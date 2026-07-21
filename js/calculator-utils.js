/**
 * Утилиты для калькуляторов
 */

/**
 * Рендеринг заголовка калькулятора
 */
export function renderCalcHeader(data) {
    return `
        <div class="calc-breadcrumb-minimal">
            <a href="#calculators" class="breadcrumb-back-link">
                <span class="material-symbols-rounded">arrow_back</span>
                <span>Калькуляторы</span>
            </a>
        </div>

        <div class="calc-header">
            <div class="calc-header-content">
                <div class="calc-icon-wrapper">
                    <span class="material-symbols-rounded">${data.icon || 'calculate'}</span>
                </div>
                <div class="calc-header-text">
                    <h1 class="calc-title">${data.title}</h1>
                    ${data.subtitle ? `<p class="calc-subtitle">${data.subtitle}</p>` : ''}
                </div>
            </div>
            <button class="calc-info-btn" id="calc-info-btn" aria-label="Информация">
                <span class="material-symbols-rounded">info</span>
            </button>
        </div>
    `;
}

/**
 * Привязка обработчика к кнопке информации калькулятора
 */
export function bindInfoButton(data) {
    const infoBtn = document.getElementById('calc-info-btn');
    if (!infoBtn) {
        console.warn('Кнопка информации не найдена');
        return;
    }

    infoBtn.addEventListener('click', () => {
        showInfoModal(data);
    });
}

/**
 * Показать модальное окно с информацией
 */
function showInfoModal(data) {
    const reference = data.reference || {};
    const paragraphs = reference.paragraphs || [];
    
    const modal = document.createElement('div');
    modal.className = 'info-modal-backdrop';
    modal.innerHTML = `
        <div class="info-modal" role="dialog" aria-modal="true">
            <div class="info-modal-header">
                <div class="info-modal-icon">
                    <span class="material-symbols-rounded">${data.icon || 'info'}</span>
                </div>
                <h2 class="info-modal-title">${reference.title || 'Информация'}</h2>
                <button class="info-modal-close" aria-label="Закрыть">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="info-modal-body">
                ${paragraphs.map(p => `<p>${p}</p>`).join('')}
                ${reference.importantNote ? `
                    <div class="info-modal-note">
                        <span class="material-symbols-rounded">warning</span>
                        <p>${reference.importantNote}</p>
                    </div>
                ` : ''}
                ${reference.legalReference ? `
                    <div class="info-modal-legal">
                        <span class="material-symbols-rounded">gavel</span>
                        <p>${reference.legalReference}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Анимация появления
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });

    // Закрытие модалки
    const closeModal = () => {
        modal.classList.remove('open');
        setTimeout(() => modal.remove(), 300);
        document.removeEventListener('keydown', escHandler);
    };

    modal.querySelector('.info-modal-close')?.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);
}