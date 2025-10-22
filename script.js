// Lorebook Generator v1.0.0 

jQuery(async () => {
    // This function ensures our code only runs when the page is fully ready.

    // --- HTML-шаблон для нашего модального окна ---
    const modalHtmlContent = `
    <style>
        :root {
            --nightwing-bg: #0a0e1a;
            --nightwing-blue: #00baf2;
            --nightwing-glow: rgba(0, 186, 242, 0.75);
            --nightwing-text: #ffffff;
            --nightwing-border: #1a2c40;
            --glass-bg: rgba(26, 44, 64, 0.4);
            --glass-blur: backdrop-filter: blur(8px);
        }
        .nightwing-modal-content {
            background-color: var(--nightwing-bg);
            border: 1px solid var(--nightwing-blue);
            border-radius: 12px;
            box-shadow: 0 0 25px var(--nightwing-glow);
            color: var(--nightwing-text);
            font-family: 'Inter', sans-serif;
            padding: 2rem;
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { text-shadow: 0 0 5px var(--nightwing-glow); } 50% { text-shadow: 0 0 20px var(--nightwing-glow), 0 0 30px var(--nightwing-glow); } 100% { text-shadow: 0 0 5px var(--nightwing-glow); } }
        .nightwing-header { text-align: center; margin-bottom: 2rem; color: var(--nightwing-blue); font-size: 2rem; font-weight: bold; animation: pulse 3s infinite; }
        .nightwing-form .form-group { margin-bottom: 1.5rem; }
        .nightwing-form label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--nightwing-text); }
        .nightwing-form .form-control { width: 100%; padding: 0.75rem 1rem; background-color: var(--glass-bg); border: 1px solid var(--nightwing-border); border-radius: 8px; color: var(--nightwing-text); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); transition: border-color 0.3s, box-shadow 0.3s; }
        .nightwing-form .form-control:focus { outline: none; border-color: var(--nightwing-blue); box-shadow: 0 0 10px var(--nightwing-glow); }
        .nightwing-form .range-group { display: flex; gap: 1rem; }
        .nightwing-btn { width: 100%; padding: 0.85rem 1rem; font-size: 1rem; font-weight: bold; color: var(--nightwing-text); background: var(--glass-bg); border: 2px solid var(--nightwing-blue); border-radius: 8px; cursor: pointer; transition: all 0.3s ease; -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); text-transform: uppercase; letter-spacing: 1px; box-shadow: inset 0 0 10px rgba(0, 186, 242, 0.5); }
        .nightwing-btn:hover { background-color: var(--nightwing-blue); box-shadow: 0 0 20px var(--nightwing-glow); color: var(--nightwing-bg); }
        #status-message { text-align: center; margin-top: 1rem; height: 20px; color: var(--nightwing-blue); transition: opacity 0.3s; }
    </style>
    <div class="nightwing-modal-content">
        <h2 class="nightwing-header">Lorebook Generator</h2>
        <div class="nightwing-form">
            <div class="form-group"><label for="chat-select">Выберите чат:</label><select id="chat-select" class="form-control"></select></div>
            <div class="form-group"><label for="lorebook-name">Название лорбука:</label><input type="text" id="lorebook-name" class="form-control" placeholder="Batman_Memories_Part1"></div>
            <div class="form-group range-group">
                <div style="flex: 1;"><label for="start-message">Начать с:</label><input type="number" id="start-message" class="form-control" value="0" min="0"></div>
                <div style="flex: 1;"><label for="end-message">Закончить на:</label><input type="number" id="end-message" class="form-control" placeholder="Оставить пустым для конца чата"></div>
            </div>
            <button id="create-lorebook-btn" class="nightwing-btn">Создать Лорбук</button>
            <p id="status-message"></p>
        </div>
    </div>`;

    // --- Функции для работы расширения (остаются без изменений) ---
    function showGeneratorModal() {
        const modalId = 'lorebook-generator-modal';
        $('#' + modalId).remove();
        const modal = $(`<div class="modal fade" id="${modalId}" tabindex="-1" role="dialog"><div class="modal-dialog modal-lg" role="document"><div class="modal-content" style="background: transparent; border: none;">${modalHtmlContent}</div></div></div>`);
        $('body').append(modal);
        $('#' + modalId).modal('show');
        $('#' + modalId).on('shown.bs.modal', () => initializeModalLogic());
        $('#' + modalId).on('hidden.bs.modal', () => $(this).remove());
    }

    async function initializeModalLogic() {
        const chatSelect = $('#chat-select');
        const lorebookNameInput = $('#lorebook-name');
        const startMessageInput = $('#start-message');
        const endMessageInput = $('#end-message');
        const createBtn = $('#create-lorebook-btn');
        const statusMessage = $('#status-message');
        try {
            const response = await fetch('/api/chats');
            if (!response.ok) throw new Error('Failed to fetch chats list');
            const files = await response.json();
            chatSelect.empty().append('<option value="">-- Выберите файл чата --</option>');
            files.forEach(file => chatSelect.append(`<option value="${file}">${file}</option>`));
        } catch (error) {
            console.error("Lorebook Generator: Ошибка загрузки чатов:", error);
            statusMessage.text('Ошибка: не удалось загрузить чаты.');
        }
        createBtn.on('click', async function () {
            const selectedChat = chatSelect.val();
            const lorebookName = lorebookNameInput.val().trim();
            const start = parseInt(startMessageInput.val(), 10) || 0;
            const end = endMessageInput.val() ? parseInt(endMessageInput.val(), 10) : null;
            if (!selectedChat || !lorebookName) { statusMessage.text('Пожалуйста, выберите чат и введите имя лорбука.'); return; }
            statusMessage.text('Обработка... Пожалуйста, подождите...');
            createBtn.prop('disabled', true);
            try {
                const chatResponse = await fetch(`/api/chats/${selectedChat}`);
                if (!chatResponse.ok) throw new Error('Failed to load chat content');
                const chatContent = await chatResponse.text();
                const lorebookJson = generateLorebook(chatContent, start, end);
                const saveResponse = await fetch('/api/worlds/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: `${lorebookName}.json`, data: JSON.stringify(lorebookJson) }) });
                if (!saveResponse.ok) throw new Error('Failed to save lorebook');
                statusMessage.text('Лорбук успешно создан! Перезагрузите страницу.');
            } catch (error) {
                console.error("Lorebook Generator: Ошибка создания лорбука:", error);
                statusMessage.text(`Ошибка: ${error.message}`);
            } finally {
                createBtn.prop('disabled', false);
            }
        });
    }

    function generateLorebook(chatContent, start, end) {
        try {
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


    // --- НОВАЯ ТОЧКА ВХОДА ---
    function initializePhantomButton() {
        // Создаем HTML для нашей новой, стильной кнопки
        const phantomButtonHtml = `
            <div id="lorebook-generator-phantom-btn" class="interactable" title="Lorebook Generator">
                <svg viewBox="0 0 100 80" width="24" height="24" style="filter: drop-shadow(0 0 3px var(--nightwing-glow));">
                    <path d="M50,0 L100,80 L0,80 Z" fill="none" stroke="var(--nightwing-blue)" stroke-width="8"/>
                    <path d="M50,0 Q65,40 50,80" fill="none" stroke="var(--nightwing-blue)" stroke-width="8"/>
                    <path d="M50,0 Q35,40 50,80" fill="none" stroke="var(--nightwing-blue)" stroke-width="8" transform="scale(-1, 1) translate(-100, 0)"/>
                </svg>
            </div>
        `;

        // Добавляем кнопку слева от формы ввода
        $('#send_form').before(phantomButtonHtml);

        // Стилизуем кнопку, чтобы она выглядела идеально
        $('#lorebook-generator-phantom-btn').css({
            cursor: 'pointer',
            padding: '5px',
            margin: '0 5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // Навешиваем обработчик клика, который будет открывать наше модальное окно
        $('#lorebook-generator-phantom-btn').on('click', function () {
            showGeneratorModal();
        });
        
        console.log("Lorebook Generator (Phantom Edition): Кнопка успешно добавлена рядом с полем ввода.");
    }

    // Запускаем нашу функцию, чтобы добавить кнопку.
    initializePhantomButton();
});

