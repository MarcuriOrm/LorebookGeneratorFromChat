// Lorebook Generator v1.0.1

import { getContext } from "../../../extensions.js";

const extensionName = "LorebookGeneratorFromChat";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// --- Помощники ---

function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9а-яА-Я._-]/g, '_');
}

function downloadFile(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ФУНКЦИЯ ОЧИСТКИ ТЕКСТА
function cleanMessageContent(text) {
    if (!text) return "";

    let cleaned = text;

    // 1. Сначала удаляем блоки кода ```...``` целиком (вместе с содержимым)
    // Это уберет технические данные, статы и скрипты JS
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

    // 2. Удаляем содержимое тегов style и script (если они вне блоков кода)
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

    // 3. Удаляем оставшиеся HTML теги (<div style="..."> превратится в пустоту, содержимое останется)
    // Это решит проблему с "color", так как слово color находится внутри тега
    cleaned = cleaned.replace(/<[^>]*>/g, "");

    // 4. Убираем лишние пробелы и пустые строки
    cleaned = cleaned.trim();

    return cleaned;
}

// --- Логика Генерации ---

function createLorebookEntry(chunk, uid) {
    if (!chunk || chunk.length === 0) return null;
    
    // Формируем контент с очисткой
    const contentLines = chunk.map(msg => {
        const cleanText = cleanMessageContent(msg.mes);
        // Если после очистки сообщение пустое (был только код), пропускаем его
        if (!cleanText) return null;
        return `${msg.name}: ${cleanText}`;
    }).filter(Boolean); // Убираем null (пустые строки)

    // Если весь чанк состоял из кода и стал пустым - не создаем запись
    if (contentLines.length === 0) return null;

    const content = contentLines.join('\n\n');
    
    const firstMsg = chunk[0];
    const lastMsg = chunk[chunk.length - 1];
    const firstMsgNumber = firstMsg.original_id;
    const lastMsgNumber = lastMsg.original_id;
    
    const comment = (firstMsgNumber === lastMsgNumber)
        ? `Диалог. Сообщение #${firstMsgNumber + 1}`
        : `Диалог. Сообщения #${firstMsgNumber + 1}-${lastMsgNumber + 1}`;

    return { 
        uid: uid, 
        key: [], 
        comment: comment, 
        content: content, 
        
        vectorized: true, // ВКЛЮЧАЕМ ВЕКТОРНЫЙ ПОИСК (Иконка 🔗)
        
        enabled: true, 
        order: 100, 
        position: 'before_char', 
        selective: true, 
        constant: false, 
        exclude_recursion: false, 
        probability: 100 
    };
}

function generateLorebookData(messages, options, contextUserName) {
    if (!messages || messages.length === 0) throw new Error("История чата пуста.");

    const start = parseInt(options.start) || 0;
    const end = options.end ? parseInt(options.end) : messages.length;
    const actualEnd = Math.min(end, messages.length);

    const entries = {};
    let entryCounter = 0;
    let currentChunk = [];
    
    for (let i = start; i < actualEnd; i++) {
        const msg = messages[i];
        if (!msg || !msg.name || !msg.mes) continue;

        const msgWithId = { ...msg, original_id: i };
        currentChunk.push(msgWithId);

        if (msg.is_user || i === actualEnd - 1) {
            if (currentChunk.length > 0) {
                entryCounter++;
                const entry = createLorebookEntry(currentChunk, entryCounter);
                // createLorebookEntry может вернуть null, если там был только мусор
                if (entry) {
                    entries[entryCounter] = entry;
                }
                currentChunk = [];
            }
        }
    }

    return { 
        name: "Generated Lorebook", 
        description: "Сгенерировано Lorebook Generator", 
        scan_depth: parseInt(options.depth) || 10, 
        token_budget: 2048, 
        recursive_scanning: true, 
        extensions: {}, 
        entries: entries 
    };
}

// --- Логика сохранения ---

async function saveLorebookToServer(rawName, data) {
    const safeName = sanitizeFilename(rawName);
    console.log(`[${extensionName}] Пробуем сохранить (AJAX) как: ${safeName}`);

    // Создаем
    try {
        await $.ajax({
            url: '/api/worldinfo/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name: safeName }),
            beforeSend: function(xhr) {
                if (window.csrf_token) xhr.setRequestHeader('X-CSRF-Token', window.csrf_token);
            }
        });
    } catch (e) {
        console.warn(`[${extensionName}] Warning during creation:`, e);
    }

    // Редактируем
    await $.ajax({
        url: '/api/worldinfo/edit',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            name: safeName,
            data: data
        }),
        beforeSend: function(xhr) {
            if (window.csrf_token) xhr.setRequestHeader('X-CSRF-Token', window.csrf_token);
        }
    });
    
    return safeName;
}

// --- Интерфейс ---

function updateStatus(msg, type = 'info') {
    const el = $("#lorebook_status_msg");
    el.text(msg);
    if (type === 'error') el.css('color', 'red');
    else if (type === 'success') el.css('color', 'lightgreen');
    else el.css('color', 'var(--smart-theme-body-color)');
}

async function onCreateClick() {
    const context = getContext();
    if (!context.chatId) {
        updateStatus("Откройте чат!", "error");
        return;
    }

    const nameInput = $("#lorebook_name_input").val().trim();
    const options = {
        depth: $("#lorebook_depth_input").val(),
        start: $("#lorebook_start_input").val(),
        end: $("#lorebook_end_input").val()
    };
    
    if (!nameInput) {
        updateStatus("Введите имя лорбука!", "error");
        return;
    }

    $("#lorebook_create_btn").prop("disabled", true);
    updateStatus("Генерация...", "info");

    try {
        const lorebookData = generateLorebookData(
            context.chat, 
            options,
            context.user_name || "User"
        );

        // Проверка: создались ли вообще записи?
        if (Object.keys(lorebookData.entries).length === 0) {
            throw new Error("Лорбук пуст! Возможно, весь чат состоит из технического кода?");
        }

        updateStatus("Сохранение на сервер...", "info");
        
        try {
            const savedName = await saveLorebookToServer(nameInput, lorebookData);
            
            updateStatus(`✅ Успех! Файл создан: ${savedName}`, "success");
            toastr.success(`Лорбук "${savedName}" сохранен!`, "Lorebook Generator");
            
            if (context.loadWorldInfo) context.loadWorldInfo();
            else if (window.loadWorldInfo) window.loadWorldInfo();

        } catch (serverError) {
            console.warn(`[${extensionName}] Server save failed (AJAX).`, serverError);
            updateStatus("⚠️ Ошибка сервера. Скачивание...", "info");
            
            const jsonContent = JSON.stringify(lorebookData, null, 4);
            const safeName = sanitizeFilename(nameInput);
            downloadFile(jsonContent, `${safeName}.json`, 'application/json');
            updateStatus(`✅ Скачано: ${safeName}.json`, "success");
        }

    } catch (error) {
        console.error(error);
        updateStatus(`Ошибка: ${error.message}`, "error");
    } finally {
        $("#lorebook_create_btn").prop("disabled", false);
    }
}

jQuery(async () => {
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);
        
        $("#lorebook_create_btn").on("click", onCreateClick);
        
        $(document).on('click', '.inline-drawer-header', function() {
            const context = getContext();
            if (context && context.characterId) {
                const charName = context.characters[context.characterId].name;
                const currentVal = $("#lorebook_name_input").val();
                if (!currentVal) {
                    const cleanCharName = sanitizeFilename(charName);
                    $("#lorebook_name_input").val(`${cleanCharName}_Lore`);
                }
            }
        });
    } catch (error) {
        console.error(`[${extensionName}] Failed load:`, error);
    }
});
