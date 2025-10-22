// Lorebook Generator v1.0.0
import { getContext } from '../../../extensions.js';

jQuery(async () => {
    // Эта функция гарантирует, что наш код выполняется только тогда, когда страница полностью готова.

    // --- HTML-шаблон для нашего ИНТЕРФЕЙСА ---
    const popupHtmlContent = `
    <style>
        /* ... (стили остаются без изменений) ... */
        :root {
            --nightwing-bg: #0a0e1a;
            --nightwing-blue: #00baf2;
            --nightwing-glow: rgba(0, 186, 242, 0.75);
            --nightwing-text: #ffffff;
            --nightwing-border: #1a2c40;
            --glass-bg: rgba(26, 44, 64, 0.4);
            --glass-blur: backdrop-filter: blur(8px);
        }
        #lorebook-generator-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center;
            justify-content: center; z-index: 99999; animation: fadeInOverlay 0.3s ease-in-out;
        }
        @keyframes fadeInOverlay { from { background-color: rgba(0, 0, 0, 0); } to { background-color: rgba(0, 0, 0, 0.7); } }
        .nightwing-popup-content {
            background-color: var(--nightwing-bg); border: 1px solid var(--nightwing-blue);
            border-radius: 12px; box-shadow: 0 0 35px var(--nightwing-glow);
            color: var(--nightwing-text); font-family: 'Inter', sans-serif;
            padding: 2rem; width: 90%; max-width: 600px; position: relative;
            animation: fadeInModal 0.4s ease-in-out;
        }
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { text-shadow: 0 0 5px var(--nightwing-glow); } 50% { text-shadow: 0 0 20px var(--nightwing-glow), 0 0 30px var(--nightwing-glow); } 100% { text-shadow: 0 0 5px var(--nightwing-glow); } }
        .nightwing-header { text-align: center; margin-bottom: 2rem; color: var(--nightwing-blue); font-size: 2rem; font-weight: bold; animation: pulse 3s infinite; }
        .nightwing-form .form-group { margin-bottom: 1.5rem; }
        .nightwing-form label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--nightwing-text); }
        .nightwing-form .form-control { width: 100%; padding: 0.75rem 1rem; background-color: var(--glass-bg); border: 1px solid var(--nightwing-border); border-radius: 8px; color: var(--nightwing-text); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); transition: border-color 0.3s, box-shadow 0.3s; box-sizing: border-box; }
        .nightwing-form .form-control:focus { outline: none; border-color: var(--nightwing-blue); box-shadow: 0 0 10px var(--nightwing-glow); }
        .nightwing-form .range-group { display: flex; gap: 1rem; }
        .nightwing-btn { width: 100%; padding: 0.85rem 1rem; font-size: 1rem; font-weight: bold; color: var(--nightwing-text); background: var(--glass-bg); border: 2px solid var(--nightwing-blue); border-radius: 8px; cursor: pointer; transition: all 0.3s ease; -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); text-transform: uppercase; letter-spacing: 1px; box-shadow: inset 0 0 10px rgba(0, 186, 242, 0.5); }
        .nightwing-btn:hover { background-color: var(--nightwing-blue); box-shadow: 0 0 20px var(--nightwing-glow); color: var(--nightwing-bg); }
        #status-message { text-align: center; margin-top: 1rem; height: 20px; color: var(--nightwing-blue); transition: opacity 0.3s; }
        #lorebook-generator-close-btn {
            position: absolute; top: 15px; right: 15px; font-size: 1.5rem;
            color: var(--nightwing-text); cursor: pointer; transition: color 0.3s;
            line-height: 1;
        }
        #lorebook-generator-close-btn:hover { color: var(--nightwing-blue); }
    </style>
    <div class="nightwing-popup-content">
        <div id="lorebook-generator-close-btn">&times;</div>
        <h2 class="nightwing-header">Lorebook Generator</h2>
        <p style="text-align:center; margin-top:-1.5rem; margin-bottom: 1.5rem;">Будет обработан текущий активный чат.</p>
        <div class="nightwing-form">
            <div class="form-group"><label for="lorebook-name">Название лорбука:</label><input type="text" id="lorebook-name" class="form-control" placeholder="Batman_Memories_Part1"></div>
            <div class="form-group range-group">
                <div style="flex: 1;"><label for="start-message">Начать с:</label><input type="number" id="start-message" class="form-control" value="0" min="0"></div>
                <div style="flex: 1;"><label for="end-message">Закончить на:</label><input type="number" id="end-message" class="form-control" placeholder="Оставить пустым для конца чата"></div>
            </div>
            <button id="create-lorebook-btn" class="nightwing-btn">Создать Лорбук</button>
            <p id="status-message"></p>
        </div>
    </div>`;

    // --- Функции для работы расширения ---

    function showGeneratorModal() {
        const modalContainer = $('<div id="lorebook-generator-overlay"></div>');
        modalContainer.html(popupHtmlContent);
        $('body').append(modalContainer);

        initializePopupLogic();

        $('#lorebook-generator-close-btn').on('click', () => {
            modalContainer.remove();
        });
        modalContainer.on('click', function (event) {
            if (event.target === this) {
                $(this).remove();
            }
        });
    }

    async function initializePopupLogic() {
        const lorebookNameInput = $('#lorebook-name');
        const startMessageInput = $('#start-message');
        const endMessageInput = $('#end-message');
        const createBtn = $('#create-lorebook-btn');
        const statusMessage = $('#status-message');
        
        const context = getContext();
        
        if (!context || !context.chatId) {
            statusMessage.text('Пожалуйста, сначала откройте чат.');
            createBtn.prop('disabled', true);
            return;
        }
        
        const characterName = context.characters[context.characterId]?.name || 'Chat';
        lorebookNameInput.val(`${characterName}_Lorebook`);

        createBtn.on('click', async function () {
            const lorebookName = lorebookNameInput.val().trim();
            const start = parseInt(startMessageInput.val(), 10) || 0;
            const end = endMessageInput.val() ? parseInt(endMessageInput.val(), 10) : null;
            
            if (!lorebookName) { 
                statusMessage.text('Пожалуйста, введите имя лорбука.'); 
                return; 
            }
            
            statusMessage.text('Обработка... Пожалуйста, подождите...');
            createBtn.prop('disabled', true);
            
            try {
                const userInfo = { user_name: context.user_name };
                const messages = context.chat;
                const chatContent = JSON.stringify(userInfo) + '\n' + messages.map(msg => JSON.stringify(msg)).join('\n');

                const lorebookJson = generateLorebook(chatContent, start, end);
                
                // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
                const token = $('#csrf_token').val(); // Получаем CSRF токен со страницы
                // --- КОНЕЦ ИЗМЕНЕНИЯ ---
                
                const importResponse = await fetch('/api/worlds/import', {
                    method: 'POST',
                    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token // Добавляем токен в заголовки
                    },
                    // --- КОНЕЦ ИЗМЕНЕНИЯ ---
                    body: JSON.stringify({
                        filename: `${lorebookName}.json`,
                        data: JSON.stringify(lorebookJson) 
                    }),
                });

                if (!importResponse.ok) {
                    throw new Error(`Ошибка импорта: ${importResponse.statusText}`);
                }

                statusMessage.text('Лорбук успешно создан! Перезагрузите страницу.');
            } catch (error) {
                console.error("Lorebook Generator: Ошибка создания лорбука:", error);
                statusMessage.text(`Ошибка создания: ${error.message || 'Server Error'}`);
            } finally {
                createBtn.prop('disabled', false);
            }
        });
    }

    function generateLorebook(chatContent, start, end) {
        try {
            if (!chatContent || typeof chatContent !== 'string') {
                 throw new Error("Содержимое чата пустое или имеет неверный формат.");
            }
            const lines = chatContent.trim().split('\n').map(line => JSON.parse(line));
            const messages = lines.slice(1);
            const userName = lines[0].user_name;
            const entries = {};
            let entryCounter = 0;
            let currentChunk = [];
            const sliceEnd = end === null ? messages.length : end + 1;
            const messagesToProcess = messages.slice(start, sliceEnd);
            for (let i = 0; i < messagesToProcess.length; i++) {
                const msg = messagesToProcess[i];
                if (msg.name === userName && currentChunk.length > 0) {
                    entryCounter++;
                    entries[entryCounter] = createLorebookEntry(currentChunk, entryCounter);
                    currentChunk = [];
                }
                currentChunk.push(msg);
            }
            if (currentChunk.length > 0) {
                entryCounter++;
                entries[entryCounter] = createLorebookEntry(currentChunk, entryCounter);
            }
            return { name: "Generated Lorebook", description: "Сгенерировано с помощью Lorebook Generator", scan_depth: 10, token_budget: 2048, recursive_scanning: true, extensions: {}, entries: entries };
        } catch (e) {
            console.error("Lorebook Generator: Ошибка парсинга чата или генерации лорбука", e);
            throw new Error("Файл чата поврежден или имеет неверный формат.");
        }
    }

    function createLorebookEntry(chunk, uid) {
        const firstMsgNumber = chunk[0].id ?? uid;
        const lastMsgNumber = chunk[chunk.length - 1].id ?? uid;
        const content = chunk.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
        return { uid: uid, key: [], comment: `Диалог. Сообщения #${firstMsgNumber}-${lastMsgNumber}`, content: content, enabled: true, order: 100, position: 'before_char', selective: true, constant: false, exclude_recursion: false, probability: 100 };
    }

    // --- ТОЧКА ВХОДА ---
    function addMenuButton() {
        if ($('#lorebook-generator-menu-btn').length > 0) { return; }
        const menuContainer = $('#options .options-content');
        if (menuContainer.length === 0) { return; }
        const menuButton = $(`<a id="lorebook-generator-menu-btn" class="interactable" tabindex="0"><i class="fa-lg fa-solid fa-book"></i><span>Lorebook Generator</span></a>`);
        menuButton.on('click', function (event) {
            event.stopPropagation();
            showGeneratorModal();
            $('#options').removeClass('open');
        });
        menuContainer.append(menuButton);
    }

    const observer = new MutationObserver(function (mutations) {
        addMenuButton();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});

