// ============================================
// Утилиты для калькуляторов
// ============================================

/**
 * Рендерит заголовок калькулятора с breadcrumb и info-кнопкой
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
 * Создаёт и открывает модальное окно со справочной информацией
 */
export function openReferenceModal(data) {
    const existing = document.getElementById('reference-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'reference-modal';
    modal.className = 'reference-modal';
    modal.innerHTML = `
        <div class="reference-modal-backdrop"></div>
        <div class="reference-modal-content">
            <div class="reference-modal-header">
                <div class="reference-modal-header-icon">
                    <span class="material-symbols-rounded">menu_book</span>
                </div>
                <h3 class="reference-modal-title">${data.reference?.title || 'О шкале'}</h3>
                <button class="reference-modal-close" aria-label="Закрыть">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="reference-modal-body">
                ${(data.reference?.paragraphs || []).map(p => `<p>${p}</p>`).join('')}
                ${data.reference?.importantNote ? `
                    <div class="calc-important-note">
                        <span class="material-symbols-rounded">warning</span>
                        <strong>${data.reference.importantNote}</strong>
                    </div>
                ` : ''}
                ${data.reference?.legalReference ? `
                    <div class="calc-legal-reference">
                        <span class="material-symbols-rounded">gavel</span>
                        <em>${data.reference.legalReference}</em>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add('open');
    });

    document.body.style.overflow = 'hidden';

    const close = () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 250);
    };

    modal.querySelector('.reference-modal-backdrop')?.addEventListener('click', close);
    modal.querySelector('.reference-modal-close')?.addEventListener('click', close);

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Подключает обработчик клика на info-кнопку
 * ИСПРАВЛЕНО: ищет правильный ID 'calc-info-btn'
 */
export function bindInfoButton(data) {
    const btn = document.getElementById('calc-info-btn');
    if (btn) {
        btn.addEventListener('click', () => openReferenceModal(data));
    }
}