// Lorebook Generator v1.0.0


(function () {
    // --- ВСЯ ЛОГИКА ЗДЕСЬ ---
    // (HTML-шаблон, функции showGeneratorModal, initializeModalLogic, и т.д.)
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
            console.error(error);
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
                console.error(error);
                statusMessage.text(`Ошибка: ${error.message}`);
            } finally {
                createBtn.prop('disabled', false);
            }
        });
    }

    function generateLorebook(chatContent, start, end) {
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
    }

    function createLorebookEntry(chunk, uid) {
        const firstMsgNumber = chunk[0].id ?? 'N/A';
        const lastMsgNumber = chunk[chunk.length - 1].id ?? 'N/A';
        const content = chunk.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
        return { uid: uid, key: [], comment: `Диалог. Сообщения #${firstMsgNumber}-${lastMsgNumber}`, content: content, enabled: true, order: 100, position: 'before_char', selective: true, constant: false, exclude_recursion: false, probability: 100 };
    }

    // --- НОВАЯ ТОЧКА ВХОДА С "УМНЫМ СТОРОЖЕМ" (неочевидная, да-да) ---

    /**
     * Эта функция будет вызвана, когда меню SillyTavern готово.
     */
    function initializeButton() {
        const menuButton = $(`<div class="list-group-item"><i class="fa-solid fa-book"></i><p>Lorebook Generator</p></div>`);
        menuButton.on('click', function () {
            showGeneratorModal();
            $('#options-popup').removeClass('open');
        });
        // Добавляем нашу кнопку в меню
        $('#options-popup .list-group').append(menuButton);
        console.log("Lorebook Generator: 'Умный сторож' дождался и добавил кнопку в меню.");
    }

    // Создаем "сторожа", который будет следить за изменениями на странице.
    const observer = new MutationObserver(function (mutations, me) {
        const menu = document.getElementById('options-popup');
        const button = document.querySelector('#options-popup .list-group-item:last-child'); // Проверяем, есть ли уже кнопки
        
        // Если меню появилось и в нем уже есть какие-то пункты...
        if (menu && button) {
            // ...значит, оно готово, и мы можем добавлять свою кнопку.
            initializeButton();
            // Отключаем "сторожа", его работа выполнена.
            me.disconnect();
        }
    });

    // Запускаем "сторожа". Он будет следить за всей страницей,
    // ожидая появления и наполнения нашего меню.
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

})();

