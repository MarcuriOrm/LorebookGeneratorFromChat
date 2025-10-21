// Этот скрипт добавляет кнопку для запуска нашего расширения в главное меню SillyTavern.

(function () {
    // Функция для отображения нашего интерфейса в модальном окне
    function showGeneratorModal() {
        // Удаляем старое модальное окно, если оно вдруг осталось
        $('#lorebook-generator-modal').remove();

        // Создаем HTML-структуру модального окна
        const modalHtml = `
            <div class="modal fade" id="lorebook-generator-modal" tabindex="-1" role="dialog">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content" style="background: transparent; border: none;">
                        <!-- Сюда будет загружено содержимое нашего index.html -->
                    </div>
                </div>
            </div>
        `;

        // Добавляем модальное окно на страницу
        $('body').append(modalHtml);

        // Загружаем наш красивый интерфейс
        // ВАЖНО: Убедитесь, что 'LorebookGeneratorFromChat' - это точное имя папки вашего расширения
        $('#lorebook-generator-modal .modal-content').load('/extensions/LorebookGeneratorFromChat/index.html');
        
        // Показываем модальное окно
        $('#lorebook-generator-modal').modal('show');

        // Убираем окно из DOM после его закрытия, чтобы не мусорить
        $('#lorebook-generator-modal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    }


    // Создаем саму кнопку для меню
    const menuButton = $(`
        <div class="list-group-item">
            <i class="fa-solid fa-book-medical"></i>
            <p>Lorebook Generator</p>
        </div>
    `);

    // Привязываем к кнопке действие: при клике вызывать нашу функцию
    menuButton.on('click', function () {
        showGeneratorModal();
        // Закрываем само меню после нажатия
        $('#options-popup').removeClass('open');
    });

    // Добавляем нашу кнопку в самый конец списка в главном меню
    $('#options-popup .list-group').append(menuButton);

})();

