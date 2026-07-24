/**
 * Утилиты для калькуляторов
 */

// Хранилище для отслеживания активных обработчиков
const activeHandlers = new WeakMap();

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
 * Получить inline-стили для результата калькулятора
 */
export function getResultInlineStyle(colorType) {
    const styles = {
        'success': 'background: var(--calc-gcs-excellent); color: var(--md-on-primary);',
        'warning': 'background: var(--calc-gcs-warning); color: var(--md-on-surface);',
        'warning-high': 'background: var(--calc-gcs-danger); color: var(--md-on-primary);',
        'error': 'background: var(--calc-gcs-severe); color: var(--md-on-error);',
        'gcs-15': 'background: var(--calc-gcs-excellent); color: var(--md-on-primary);',
        'gcs-14': 'background: var(--calc-gcs-good); color: var(--md-on-primary);',
        'gcs-13': 'background: var(--calc-gcs-moderate); color: var(--md-on-primary);',
        'gcs-11-12': 'background: var(--calc-gcs-warning); color: var(--md-on-surface);',
        'gcs-8-10': 'background: var(--calc-gcs-danger); color: var(--md-on-primary);',
        'gcs-6-7': 'background: var(--calc-gcs-critical); color: var(--md-on-error);',
        'gcs-4-5': 'background: var(--calc-gcs-severe); color: var(--md-on-error);',
        'gcs-3': 'background: var(--calc-gcs-terminal); color: var(--md-on-error);'
    };
    return styles[colorType] || '';
}

/**
 * Рендеринг секции с формулами
 */
function renderFormulasSection(formulas) {
    if (!formulas || formulas.length === 0) return '';
    
    return `
        <div class="calc-reference-section">
            <div class="calc-reference-title">
                <span class="material-symbols-rounded">functions</span>
                Формулы
            </div>
            <div class="calc-formulas-grid">
                ${formulas.map(f => `
                    <div class="calc-formula-card">
                        <div class="calc-formula-name">${f.name}</div>
                        <div class="calc-formula-text">${f.formula}</div>
                        <div class="calc-formula-example">Пример: ${f.example}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Рендеринг секции с быстрыми правилами
 */
function renderQuickRulesSection(rules) {
    if (!rules || rules.length === 0) return '';
    
    return `
        <div class="calc-reference-section">
            <div class="calc-reference-title">
                <span class="material-symbols-rounded">tips_and_updates</span>
                Быстрые правила
            </div>
            <div class="calc-quick-rules">
                ${rules.map(r => `
                    <div class="calc-quick-rule">
                        <span class="calc-quick-rule-icon">${r.icon}</span>
                        <span>${r.rule}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Рендеринг таблицы концентраций
 */
function renderConcentrationsTable(concentrations) {
    if (!concentrations || concentrations.length === 0) return '';
    
    return `
        <div class="calc-reference-section">
            <div class="calc-reference-title">
                <span class="material-symbols-rounded">table_chart</span>
                Типичные концентрации
            </div>
            <table class="calc-concentrations-table">
                <thead>
                    <tr>
                        <th>Препарат</th>
                        <th>Концентрация</th>
                        <th>мг/мл</th>
                    </tr>
                </thead>
                <tbody>
                    ${concentrations.map(c => `
                        <tr>
                            <td>${c.drug}</td>
                            <td>${c.concentration}</td>
                            <td><strong>${c.mgMl}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Рендеринг примеров расчётов
 */
function renderExamplesSection(examples) {
    if (!examples || examples.length === 0) return '';
    
    return `
        <div class="calc-reference-section">
            <div class="calc-reference-title">
                <span class="material-symbols-rounded">calculate</span>
                Примеры расчётов
            </div>
            <div class="calc-examples">
                ${examples.map(ex => `
                    <div class="calc-example-card">
                        <div class="calc-example-scenario">${ex.scenario}</div>
                        <div class="calc-example-calculation">${ex.calculation}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Создать HTML-контент модалки информации
 */
function createInfoModalContent(data) {
    const ref = data.reference || {};
    
    let content = `
        <div class="info-modal-header">
            <div class="info-modal-icon">
                <span class="material-symbols-rounded">${data.icon || 'info'}</span>
            </div>
            <h2 class="info-modal-title">${ref.title || data.title}</h2>
            <button class="info-modal-close" aria-label="Закрыть">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        <div class="info-modal-body">
    `;

    if (ref.paragraphs) {
        content += ref.paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    if (ref.importantNote) {
        content += `
            <div class="info-modal-note">
                <span class="material-symbols-rounded">warning</span>
                <p>${ref.importantNote}</p>
            </div>
        `;
    }

    content += renderFormulasSection(ref.formulas);
    content += renderQuickRulesSection(ref.quickRules);
    content += renderConcentrationsTable(ref.commonConcentrations);
    content += renderExamplesSection(ref.examples);

    if (ref.legalReference) {
        content += `
            <div class="info-modal-legal">
                <span class="material-symbols-rounded">gavel</span>
                <p>${ref.legalReference}</p>
            </div>
        `;
    }

    content += '</div>';
    return content;
}

/**
 * Закрыть модальное окно информации
 */
function closeInfoModal(backdrop) {
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 300);
}

/**
 * Показать модальное окно с информацией
 */
function showInfoModal(data) {
    const content = createInfoModalContent(data);
    
    const backdrop = document.createElement('div');
    backdrop.className = 'info-modal-backdrop';
    backdrop.innerHTML = `<div class="info-modal" role="dialog" aria-modal="true">${content}</div>`;
    document.body.appendChild(backdrop);

    requestAnimationFrame(() => backdrop.classList.add('open'));

    const closeBtn = backdrop.querySelector('.info-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeInfoModal(backdrop));
    }

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
            closeInfoModal(backdrop);
        }
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeInfoModal(backdrop);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Привязать кнопку информации к калькулятору
 */
export function bindInfoButton(data, container = document) {
    const btn = container.querySelector('.calc-info-btn');
    if (!btn || !data.reference) return;

    const existingHandler = activeHandlers.get(btn);
    if (existingHandler) {
        btn.removeEventListener('click', existingHandler);
    }

    const handler = () => showInfoModal(data);
    activeHandlers.set(btn, handler);
    btn.addEventListener('click', handler);
}

// ============================================
// ДИНАМИЧЕСКАЯ ЗАГРУЗКА CSS КАЛЬКУЛЯТОРОВ
// ============================================

const loadedCalcStyles = new Set();

export async function loadCalculatorCSS(route) {
    // Базовые стили — один раз
    await loadCSS('css/calculator-base.css', 'css-calculator-base');
    
    // Маппинг маршрутов на CSS-файлы
    const cssMap = {
        'algover': 'algover.css',
        'apgar': 'apgar.css',
        'pediatric': 'pediatric.css',
        'ciwa-ar': 'ciwa-ar.css',
        'infusomat': 'infusomat.css',
        'geneva-score': 'geneva-score.css',
        'glasgow-coma': 'glasgow-coma.css',
        'glasgow-coma-pediatric': 'glasgow-coma-pediatric.css',
        'nihss': 'nihss.css',
        'odn-scale': 'odn-scale.css',
        'killip': 'killip.css',
        'pesi-score': 'pesi-score.css',
        'qtc-bazett': 'qtc-bazett.css',
        'sad-persons': 'sad-persons.css',
        'sgarbossa': 'sgarbossa.css',
        'shsn-scale': 'shsn-scale.css',
        'vas': 'vas.css',
        'fast-ed': 'fast-ed.css',
        'four-score': 'four-score.css',
        'drug-converter': 'drug-converter.css'
    };
    
    const cssFile = cssMap[route];
    
    if (!cssFile) {
        console.warn(`⚠️ CSS для "${route}" не найден в cssMap`);
        return;
    }
    
    const id = `css-calc-${route}`;
    if (loadedCalcStyles.has(id)) return;
    
    console.log(`📄 Загружаем CSS: ${cssFile}`);
    await loadCSS(`css/calculators/${cssFile}`, id);
    loadedCalcStyles.add(id);
}

/**
 * Вспомогательная функция загрузки CSS
 */
function loadCSS(href, id) {
    return new Promise((resolve) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = () => {
            console.warn(`⚠️ Не удалось загрузить CSS: ${href}`);
            resolve();
        };
        document.head.appendChild(link);
    });
}