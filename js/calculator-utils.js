// ============================================
// Утилиты для калькуляторов
// ============================================

/**
 * Рендерит заголовок калькулятора с информационной кнопкой
 */
export function renderCalcHeader(data) {
    return `
        <div class="calc-header">
            <div class="calc-header-icon">
                <span class="material-symbols-rounded">${data.icon}</span>
            </div>
            <div class="calc-header-content">
                <h1>${data.title}</h1>
                <p class="calc-subtitle">${data.subtitle}</p>
            </div>
            <button class="calc-header-info-btn" id="info-btn" aria-label="О шкале">
                <span class="material-symbols-rounded">info</span>
            </button>
        </div>
    `;
}

/**
 * Создаёт и открывает модальное окно со справочной информацией
 */
export function openReferenceModal(data) {
    // Удаляем предыдущее модальное окно, если есть
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
    
    // Анимация открытия
    requestAnimationFrame(() => {
        modal.classList.add('open');
    });
    
    // Блокируем прокрутку body
    document.body.style.overflow = 'hidden';
    
    // Закрытие
    const close = () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => modal.remove(), 250);
    };
    
    modal.querySelector('.reference-modal-backdrop')?.addEventListener('click', close);
    modal.querySelector('.reference-modal-close')?.addEventListener('click', close);
    
    // Закрытие по Escape
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
 */
export function bindInfoButton(data) {
    const btn = document.getElementById('info-btn');
    if (btn) {
        btn.addEventListener('click', () => openReferenceModal(data));
    }
}