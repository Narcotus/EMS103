import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class FourScorePage {
    constructor(container) {
        this.container = container;
        this.selections = { E: null, M: null, B: null, R: null };
        this._clickHandler = null;
        
        this.data = {
            title: "Шкала комы FOUR",
            subtitle: "Full Outline of UnResponsiveness Score",
            icon: "neurology",
            description: "Дополнительная оценка неврологического статуса при низком балле по ШКГ. Оценивает стволовые рефлексы и дыхательный паттерн. Применима у детей и взрослых.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала комы FOUR разработана в Mayo Clinic и представлена в 2005 году. Она позволяет точнее детализировать неврологический статус, распознать синдром запертого человека, оценить рефлексы ствола мозга и дыхательный паттерн, выявить различные стадии дислокации (вклинения) мозга.",
                    "Шкала FOUR одинаково применима у детей и взрослых. Предоставляет дополнительную информацию о прогнозе у больных с низким баллом по шкале комы Глазго, поэтому рекомендуется использовать не вместо, а в дополнение к ней. Максимальное число баллов — 16, минимальное — 0."
                ],
                importantNote: "Шкала FOUR рекомендуется как дополнение к ШКГ, а не замена. Особенно полезна при интубации, когда вербальная оценка невозможна.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Сумма FOUR', 
                        formula: 'E + M + B + R (макс 16 баллов)', 
                        example: '4+4+4+4 = 16 → ясное сознание' 
                    },
                    { 
                        name: 'Интерпретация', 
                        formula: '16: ясное | 13-15: оглушение | 9-12: сопор | 7-8: Кома I | 1-6: Кома II | 0: Кома III', 
                        example: 'FOUR = 8 → Кома I (умеренная)' 
                    }
                ],
                quickRules: [
                    { icon: '🧠', rule: 'Используется как дополнение к ШКГ, а не замена' },
                    { icon: '🫁', rule: 'Особенно полезна при интубации (нет вербальной оценки)' },
                    { icon: '👶', rule: 'Применима у детей и взрослых' },
                    { icon: '🎯', rule: 'Помогает распознать синдром запертого человека' },
                    { icon: '👁️', rule: 'E: слежение и мигание по команде = 4 балла' },
                    { icon: '✋', rule: 'M: выполнение команд (знак «отлично») = 4 балла' }
                ],
                examples: [
                    {
                        scenario: 'Пациент интубирован, глаза открывает на боль (1), локализует боль (3), зрачки реагируют (4), синхронен с ИВЛ (0)',
                        calculation: 'FOUR = 1+3+4+0 = 8 баллов → Кома I (умеренная)'
                    },
                    {
                        scenario: 'Пациент выполняет команды (4), слежение есть (4), все рефлексы сохранены (4), дышит самостоятельно (4)',
                        calculation: 'FOUR = 4+4+4+4 = 16 баллов → Ясное сознание'
                    },
                    {
                        scenario: 'Пациент с ЧМТ: глаза закрыты (0), разгибательная поза (1), нет стволовых рефлексов (0), апноэ на ИВЛ (0)',
                        calculation: 'FOUR = 0+1+0+0 = 1 балл → Кома II (глубокая) → неблагоприятный прогноз'
                    }
                ]
            },
            groups: [
                {
                    id: "E",
                    title: "Глазные реакции (E)",
                    icon: "visibility",
                    items: [
                        { value: 4, title: "Глаза открыты, слежение и мигание по команде" },
                        { value: 3, title: "Глаза открыты, но нет слежения" },
                        { value: 2, title: "Глаза закрыты, открываются на громкий звук, но слежения нет" },
                        { value: 1, title: "Глаза закрыты, открываются на боль, но слежения нет" },
                        { value: 0, title: "Глаза остаются закрытыми в ответ на боль" }
                    ]
                },
                {
                    id: "M",
                    title: "Двигательные реакции (M)",
                    icon: "accessibility_new",
                    items: [
                        { value: 4, title: "Выполняет команды (знак «отлично», кулак, знак мира)" },
                        { value: 3, title: "Локализует боль" },
                        { value: 2, title: "Сгибательный ответ на боль" },
                        { value: 1, title: "Разгибательная поза на боль" },
                        { value: 0, title: "Нет ответа на боль или генерализованный миоклонический эпистатус" }
                    ]
                },
                {
                    id: "B",
                    title: "Стволовые рефлексы (B)",
                    icon: "psychology",
                    items: [
                        { value: 4, title: "Зрачковый и корнеальный рефлексы сохранены" },
                        { value: 3, title: "Один зрачок расширен и не реагирует на свет" },
                        { value: 2, title: "Зрачковый или роговичный рефлексы отсутствуют" },
                        { value: 1, title: "Зрачковый и роговичный рефлексы отсутствуют" },
                        { value: 0, title: "Отсутствуют зрачковый, роговичный и кашлевой рефлексы" }
                    ]
                },
                {
                    id: "R",
                    title: "Дыхательный паттерн (R)",
                    icon: "air",
                    items: [
                        { value: 4, title: "Не интубирован, регулярное дыхание" },
                        { value: 3, title: "Не интубирован, дыхание Чейн–Стокса" },
                        { value: 2, title: "Не интубирован, нерегулярное дыхание" },
                        { value: 1, title: "Сопротивляется аппарату ИВЛ" },
                        { value: 0, title: "Полностью синхронен с аппаратом ИВЛ или апноэ" }
                    ]
                }
            ],
            resultRanges: [
                { min: 16, max: 16, label: "Ясное сознание", description: "Все функции сохранены.", color: "gcs-15" },
                { min: 15, max: 15, label: "Умеренное оглушение", description: "Незначительное снижение уровня бодрствования.", color: "gcs-14" },
                { min: 13, max: 14, label: "Глубокое оглушение", description: "Выраженная заторможенность, сонливость.", color: "gcs-11-12" },
                { min: 9, max: 12, label: "Сопор", description: "Глубокое угнетение сознания, реакция только на сильные стимулы.", color: "gcs-8-10" },
                { min: 7, max: 8, label: "Кома I (умеренная)", description: "Отсутствие реакции на голос, сохранена реакция на боль.", color: "gcs-6-7" },
                { min: 1, max: 6, label: "Кома II (глубокая)", description: "Реакция только на болевые стимулы, патологические рефлексы.", color: "gcs-4-5" },
                { min: 0, max: 0, label: "Кома III (запредельная)", description: "Гибель коры мозга. Отсутствие всех реакций и рефлексов.", color: "gcs-3" }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selections = { E: null, M: null, B: null, R: null };
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('four-score');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-four',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'four-score'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page four-page">
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
        const breakdown = this.getBreakdown();
        const allSelected = this.selections.E !== null && this.selections.M !== null && 
                           this.selections.B !== null && this.selections.R !== null;
        
        if (!allSelected) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите все четыре параметра</div>
                        <div class="result-description">Заполните: ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }
        
        const range = this.getRange(total);
        
        // ✅ Fallback на случай если диапазон не найден
        if (!range) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">${total}</div>
                        <div class="result-score-label">из 16</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Ошибка интерпретации</div>
                        <div class="result-description">Не удалось определить диапазон</div>
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
                    <div class="result-score-label">из 16 (${breakdown.formula})</div>
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
        const values = Object.values(this.selections);
        if (values.some(v => v === null)) return 0;
        return values.reduce((sum, v) => sum + v, 0);
    }

    getBreakdown() {
        const labels = { E: 'E', M: 'M', B: 'B', R: 'R' };
        const names = { E: 'глаза (E)', M: 'движение (M)', B: 'рефлексы (B)', R: 'дыхание (R)' };
        const parts = [];
        const missing = [];
        
        for (const key of ['E', 'M', 'B', 'R']) {
            if (this.selections[key] !== null) {
                parts.push(`${labels[key]}${this.selections[key]}`);
            } else {
                missing.push(names[key]);
            }
        }
        return { formula: parts.join('+') || '—', missing };
    }

    getRange(score) {
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
        this.selections = { E: null, M: null, B: null, R: null };
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