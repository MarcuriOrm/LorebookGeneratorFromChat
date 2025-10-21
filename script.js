// Этот файл выполняется на стороне сервера (в Node.js).

// Подключаем необходимые модули для работы с файлами и путями
const fs = require('fs').promises;
const path = require('path');

// Определяем базовые пути к папкам SillyTavern
const TAVERN_DIR = path.resolve(__dirname, '../../../');
const CHATS_DIR = path.join(TAVERN_DIR, 'public/chats');
const WORLDS_DIR = path.join(TAVERN_DIR, 'public/worlds');

/**
 * Главная функция, которая запускается при загрузке расширения.
 */
async function onPageLoad() {
    // Получаем список всех файлов чатов
    const chatFiles = await getChatFiles();
    
    // Находим наш выпадающий список в HTML
    const chatFileSelect = document.getElementById('chat-file');
    // Очищаем его на случай, если там что-то было
    chatFileSelect.innerHTML = '';

    // Заполняем список чатами
    chatFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        chatFileSelect.appendChild(option);
    });

    // Находим кнопку и добавляем к ней обработчик нажатия
    const generateButton = document.getElementById('generate-button');
    generateButton.addEventListener('click', handleGenerateClick);
}

/**
 * Функция для получения списка файлов чатов в формате .jsonl
 */
async function getChatFiles() {
    try {
        const files = await fs.readdir(CHATS_DIR);
        // Фильтруем, чтобы оставить только нужные нам файлы
        return files.filter(file => file.endsWith('.jsonl'));
    } catch (error) {
        logMessage(`Ошибка при чтении папки чатов: ${error.message}`);
        return [];
    }
}

/**
 * Обработчик нажатия на кнопку "Создать Лорбук".
 */
async function handleGenerateClick() {
    // Получаем значения из всех полей ввода
    const chatFileName = document.getElementById('chat-file').value;
    const lorebookName = document.getElementById('lorebook-name').value;
    const startIndex = parseInt(document.getElementById('start-index').value, 10);
    let endIndex = parseInt(document.getElementById('end-index').value, 10);

    // --- Валидация ввода ---
    if (!chatFileName) {
        logMessage('Ошибка: Пожалуйста, выберите файл чата.');
        return;
    }
    if (!lorebookName) {
        logMessage('Ошибка: Пожалуйста, введите название для лорбука.');
        return;
    }

    logMessage('Начинаю процесс генерации...');
    logMessage(`Выбран чат: ${chatFileName}`);
    logMessage(`Название лорбука: ${lorebookName}.json`);

    try {
        const chatHistory = await loadChatFile(chatFileName);
        
        if (!chatHistory) {
            logMessage('Не удалось загрузить историю чата.');
            return;
        }

        // Если endIndex не указан (0), то читаем до конца
        if (endIndex === 0 || endIndex > chatHistory.length) {
            endIndex = chatHistory.length;
        }
        
        logMessage(`Будут обработаны сообщения с ${startIndex} по ${endIndex-1}. Всего: ${endIndex - startIndex}.`);

        // Вызываем основную функцию конвертации
        const lorebookData = await createDialogueLorebook(chatHistory, startIndex, endIndex);
        
        // Добавляем имя и описание в финальную структуру
        lorebookData.name = lorebookName;
        lorebookData.description = `Сгенерировано из ${chatFileName} с сообщениями с ${startIndex} по ${endIndex}.`;

        // Сохраняем файл
        const outputPath = path.join(WORLDS_DIR, `${lorebookName}.json`);
        await fs.writeFile(outputPath, JSON.stringify(lorebookData, null, 4));
        
        logMessage('---');
        logMessage(`УСПЕХ! Лорбук сохранен в: public/worlds/${lorebookName}.json`);
        logMessage('Перезагрузите страницу SillyTavern, чтобы увидеть его в списке.');

    } catch (error) {
        logMessage(`Критическая ошибка: ${error.message}`);
    }
}

// --- Логика конвертации ---

async function loadChatFile(fileName) {
    const filePath = path.join(CHATS_DIR, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    return lines.map(line => {
        try {
            return JSON.parse(line);
        } catch {
            return null;
        }
    }).filter(Boolean); // Убираем пустые/невалидные строки
}

function createFullLorebookStructure() {
    return {
        "name": "", "description": "", "scan_depth": 4, "token_budget": 2048,
        "recursive_scanning": true, "entries": {}
    };
}

function createFullEntryStructure(uid, comment, content) {
    return {
        "uid": uid, "key": [], "comment": comment, "content": content, "enabled": true,
        "category": "Script-Generated", "displayIndex": uid, "keysecondary": [],
        "constant": false, "selective": true, "selectiveLogic": 0, "addMemo": true,
        "order": 100, "position": 0, "disable": false, "ignoreBudget": false,
        "excludeRecursion": false, "preventRecursion": false, "matchPersonaDescription": false,
        "matchCharacterDescription": false, "matchCharacterPersonality": false,
        "vectorized": true, "probability": 100,
    };
}

async function createDialogueLorebook(chatHistory, startIndex, endIndex) {
    const lorebookData = createFullLorebookStructure();
    
    // Определяем имя пользователя
    const userPost = chatHistory.find(p => p.is_user);
    if (!userPost) {
        logMessage('Ошибка: Не удалось найти сообщения пользователя для определения имени.');
        return null;
    }
    const userName = userPost.name;
    logMessage(`Определено имя пользователя: ${userName}`);

    let entryCounter = 1;
    let currentChunkParts = [];
    let chunkStartIndex = startIndex;

    const relevantHistory = chatHistory.slice(startIndex, endIndex);

    for (let i = 0; i < relevantHistory.length; i++) {
        const post = relevantHistory[i];
        if (post.is_system) continue;

        if (post.name === userName && currentChunkParts.length > 0) {
            const chunkText = currentChunkParts.join('\n\n');
            const comment = `Диалог. Сообщения #${chunkStartIndex}-${startIndex + i - 1}`;
            const entry = createFullEntryStructure(entryCounter, comment, chunkText);
            lorebookData.entries[entryCounter] = entry;

            entryCounter++;
            currentChunkParts = [];
            chunkStartIndex = startIndex + i;
        }
        
        currentChunkParts.push(`${post.name}: ${post.mes}`);
    }

    // Сохраняем последний чанк
    if (currentChunkParts.length > 0) {
        const chunkText = currentChunkParts.join('\n\n');
        const comment = `Диалог. Сообщения #${chunkStartIndex}-${endIndex - 1}`;
        const entry = createFullEntryStructure(entryCounter, comment, chunkText);
        lorebookData.entries[entryCounter] = entry;
    }

    logMessage(`Обработка завершена. Создано записей: ${Object.keys(lorebookData.entries).length}.`);
    return lorebookData;
}


/**
 * Вспомогательная функция для вывода сообщений в лог на странице.
 */
function logMessage(message) {
    const logOutput = document.getElementById('log-output');
    console.log(message); // Также выводим в консоль для отладки
    logOutput.textContent = `${message}\n${logOutput.textContent}`;
}


// Запускаем нашу функцию, когда страница расширения загрузится
onPageLoad();

