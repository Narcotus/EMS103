import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class GlasgowComaPediatricPage {
    constructor(container) {
        this.container = container;
        this.selections = { E: null, V: null, M: null };
        this._clickHandler = null;
        
        this.data = {
            title: "Шкала комы Глазго (дети < 4 лет)",
            subtitle: "Pediatric Glasgow Coma Scale (pGCS)",
            icon: "child_care",
            description: "Адаптированная оценка уровня сознания для детей младше 4 лет. Отличается от взрослой версии критериями речевой реакции с учётом возрастных особенностей развития.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Детская шкала комы Глазго (Pediatric Glasgow Coma Scale, pGCS) — модификация классической шкалы GCS, разработанная специально для оценки уровня сознания у детей младше 4 лет, которые ещё не владеют полноценной речью.",
                    "Ключевое отличие от взрослой версии заключается в оценке вербального ответа (V): вместо ориентации в пространстве и связной речи оцениваются плач, способность к успокоению, интерактивность и слежение за объектами. Компоненты E (глаза) и M (движения) идентичны взрослой шкале.",
                    "Общая сумма баллов варьирует от 3 до 15. Интерпретация результатов аналогична взрослой шкале. Динамическая оценка pGCS позволяет отслеживать изменения неврологического статуса ребёнка и своевременно корректировать тактику лечения."
                ],
                importantNote: "Если пациент без сознания, интубирован или ещё не умеет говорить, наиболее важной частью этой шкалы является двигательная реакция — её следует оценить более тщательно. Баллы начисляются за наилучшее наблюдение в процессе осмотра.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Сумма pGCS', 
                        formula: 'E + V + M (3–15 баллов)', 
                        example: 'E3 + V4 + M5 = 12 → глубокое оглушение' 
                    },
                    { 
                        name: 'Порог интубации', 
                        formula: 'pGCS ≤ 8 → показана интубация', 
                        example: 'E2 + V2 + M4 = 8 → интубация!' 
                    }
                ],
                quickRules: [
                    { icon: '👶', rule: 'Применяется для детей младше 4 лет' },
                    { icon: '🗣️', rule: 'Вербальный ответ адаптирован: плач, успокоение, интерактивность' },
                    { icon: '⚠️', rule: 'GCS ≤ 8 — показание к интубации' },
                    { icon: '🎯', rule: 'Двигательная реакция — самый важный компонент при невозможности речи' },
                    { icon: '📈', rule: 'Динамическая оценка важнее однократного измерения' },
                    { icon: '🧒', rule: 'Для детей ≥ 4 лет используйте взрослую GCS' }
                ],
                examples: [
                    {
                        scenario: 'Ребёнок 2 года, открывает глаза на голос (3), плачет но успокаивается (4), отталкивает руку при боли (5)',
                        calculation: 'pGCS = 3+4+5 = 12 баллов → глубокое оглушение → наблюдение, повторная оценка через 1 час'
                    },
                    {
                        scenario: 'Ребёнок 1 год после ЧМТ: глаза не открывает (1), плач не успокаивается (2), декортикация (3)',
                        calculation: 'pGCS = 1+2+3 = 6 баллов → умеренная кома → интубация, КТ головного мозга, нейрохирург!'
                    },
                    {
                        scenario: 'Ребёнок 3 года после падения: глаза открыты спонтанно (4), улыбается и следит (5), выполняет команды (6)',
                        calculation: 'pGCS = 4+5+6 = 15 баллов → ясное сознание → наблюдение, выписка при отсутствии других симптомов'
                    }
                ]
            },
            groups: [
                {
                    id: "E",
                    title: "Открывание глаз (E, Eye response)",
                    icon: "visibility",
                    items: [
                        { value: 4, title: "Произвольное" },
                        { value: 3, title: "Реакция на голос" },
                        { value: 2, title: "Реакция на боль" },
                        { value: 1, title: "Отсутствует" }
                    ]
                },
                {
                    id: "V",
                    title: "Речевая реакция (V, Verbal response)",
                    icon: "record_voice_over",
                    items: [
                        { value: 5, title: "Улыбается, ориентируется на звук, следит за объектами, интерактивен" },
                        { value: 4, title: "При плаче можно успокоить, интерактивность неполноценная" },
                        { value: 3, title: "При плаче успокаивается, но ненадолго, стонет" },
                        { value: 2, title: "Не успокаивается при плаче, беспокоен" },
                        { value: 1, title: "Плач и интерактивность отсутствуют" }
                    ]
                },
                {
                    id: "M",
                    title: "Двигательная реакция (M, Motor response)",
                    icon: "accessibility_new",
                    items: [
                        { value: 6, title: "Выполнение движений по голосовой команде" },
                        { value: 5, title: "Целенаправленное движение в ответ на болевое раздражение (отталкивание)" },
                        { value: 4, title: "Отдёргивание конечности в ответ на болевое раздражение" },
                        { value: 3, title: "Патологическое сгибание в ответ на боль (декортикация)" },
                        { value: 2, title: "Патологическое разгибание в ответ на боль (децеребрация)" },
                        { value: 1, title: "Отсутствие движений" }
                    ]
                }
            ],
            resultRanges: [
                { min: 15, max: 15, label: "Ясное сознание", description: "Ребёнок активен, интерактивен, адекватен возрасту.", color: "gcs-15" },
                { min: 14, max: 14, label: "Лёгкое оглушение", description: "Незначительная заторможенность, реакция сохранена.", color: "gcs-14" },
                { min: 13, max: 13, label: "Умеренное оглушение", description: "Заторможенность, ответы замедленные.", color: "gcs-13" },
                { min: 11, max: 12, label: "Глубокое оглушение", description: "Выраженная заторможенность, сонливость.", color: "gcs-11-12" },
                { min: 8, max: 10, label: "Сопор", description: "Глубокое угнетение сознания, реакция только на сильные стимулы. Показана интубация при GCS ≤ 8.", color: "gcs-8-10" },
                { min: 6, max: 7, label: "Умеренная кома", description: "Нет реакции на голос, сохраняется реакция на боль.", color: "gcs-6-7" },
                { min: 4, max: 5, label: "Глубокая кома", description: "Реакция только на болевые стимулы, патологические рефлексы.", color: "gcs-4-5" },
                { min: 3, max: 3, label: "Запредельная кома", description: "Атония, арефлексия, отсутствие всех реакций.", color: "gcs-3" }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selections = { E: null, V: null, M: null };
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('glasgow-coma-pediatric');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-gcs-ped',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'glasgow-coma-pediatric'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page glasgow-coma-pediatric-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="gcs-groups">
                    ${this.data.groups.map(group => `
                        <div class="gcs-group">
                            <div class="gcs-group-header">
                                <span class="material-symbols-rounded">${group.icon}</span>
                                <span class="gcs-group-title">${group.title}</span>
                                <span class="gcs-group-value" id="value-${group.id}">—</span>
                            </div>
                            <div class="gcs-group-items">
                                ${group.items.map(item => `
                                    <div class="gcs-radio-item ripple" data-group="${group.id}" data-value="${item.value}">
                                        <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
                                        <div class="gcs-radio-content">
                                            <div class="gcs-radio-title">${item.title}</div>
                                        </div>
                                        <div class="gcs-radio-points">${item.value}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        bindInfoButton(this.data, this.container);
    }

    renderResult() {
        const total = this.calculateTotal();
        const range = this.getRange(total);
        const breakdown = this.getBreakdown();
        
        if (!range) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите все три параметра</div>
                        <div class="result-description">Заполните: ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }
        
        const inlineStyle = getResultInlineStyle(range.color);

        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">баллов (${breakdown.formula})</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    calculateTotal() {
        if (this.selections.E !== null && this.selections.V !== null && this.selections.M !== null) {
            return this.selections.E + this.selections.V + this.selections.M;
        }
        return 0;
    }

    getBreakdown() {
        const parts = [];
        const missing = [];
        if (this.selections.E !== null) parts.push(`E${this.selections.E}`); else missing.push('глаза (E)');
        if (this.selections.V !== null) parts.push(`V${this.selections.V}`); else missing.push('речь (V)');
        if (this.selections.M !== null) parts.push(`M${this.selections.M}`); else missing.push('движение (M)');
        return { formula: parts.join(' + ') || '—', missing };
    }

    getRange(score) {
        if (!score) return null;
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max);
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }
        
        this._clickHandler = (e) => {
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }
            
            const item = e.target.closest('.gcs-radio-item');
            if (!item || !this.container.contains(item)) return;
            
            e.preventDefault();
            e.stopPropagation();
            this.selectItem(item);
        };
        
        this.container.addEventListener('click', this._clickHandler, true);
    }

    selectItem(item) {
        const group = item.dataset.group;
        const value = parseInt(item.dataset.value);
        
        this.container.querySelectorAll(`.gcs-radio-item[data-group="${group}"]`).forEach(other => {
            other.classList.remove('selected');
        });
        
        item.classList.add('selected');
        this.selections[group] = value;
        
        const valueEl = this.container.querySelector(`#value-${group}`);
        if (valueEl) {
            valueEl.textContent = value;
            valueEl.classList.add('has-value');
        }
        
        this.updateResult();
    }

    resetAll() {
        this.container.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = { E: null, V: null, M: null };
        this.container.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
        this.updateResult();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }
}