import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class FastEdPage {
    constructor(container) {
        this.container = container;
        this.selections = { F: null, A: null, S: null, T: null, E: null };
        this._clickHandler = null;
        
        this.data = {
            title: "Шкала FAST-ED",
            subtitle: "Field Assessment Stroke Triage for Emergency Destination",
            icon: "neurology",
            description: "Догоспитальная шкала для выявления пациентов с крупным окклюзионным инсультом, которым может быть показана тромбэктомия. Помогает выбрать оптимальный стационар.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала FAST-ED (Field Assessment Stroke Triage for Emergency Destination) разработана в 2017 году для догоспитального выявления пациентов с окклюзией крупных сосудов головного мозга, которым может быть показана механическая тромбэктомия.",
                    "Шкала содержит 5 параметров: Face (лицо), Arms (руки), Speech (речь), Time (время) и Eyes (глаза). Максимальная сумма — 9 баллов. Пороговое значение ≥ 4 балла имеет высокую специфичность для выявления вероятности окклюзии крупного сосуда и показаний к тромбэктомии.",
                    "Шкала используется бригадами скорой помощи для принятия решения о транспортировке пациента в специализированный сосудистый центр с возможностью проведения тромбэктомии, а не в ближайший стационар."
                ],
                importantNote: "FAST-ED ≥ 4 балла указывает на высокую вероятность окклюзии крупных сосудов. Таких пациентов следует направлять в центры с возможностью тромбэктомии, если время от начала симптомов < 24 часов.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Сумма FAST-ED', 
                        formula: 'F + A + S + T + E (макс 9 баллов)', 
                        example: '2+2+1+1+0 = 6 баллов → тромбэктомия' 
                    },
                    { 
                        name: 'Пороговое значение', 
                        formula: '≥ 4 балла → окклюзия крупного сосуда', 
                        example: 'Специфичность ~85%, чувствительность ~60%' 
                    }
                ],
                quickRules: [
                    { icon: '🎯', rule: 'Пороговое значение: ≥ 4 балла' },
                    { icon: '⏱️', rule: 'Окно для тромбэктомии: < 24 часа от начала симптомов' },
                    { icon: '🏥', rule: 'FAST-ED ≥ 4 → сосудистый центр с тромбэктомией' },
                    { icon: '🏥', rule: 'FAST-ED < 4 → ближайший стационар с инсультным отделением' },
                    { icon: '👁️', rule: 'Девиация взора (E=1) — специфичный признак LVO' },
                    { icon: '📞', rule: 'Уведомьте приёмное отделение заранее (code stroke)' }
                ],
                examples: [
                    {
                        scenario: 'Пациент 68 лет, асимметрия лица (2), слабость в правой руке (2), дизартрия (1), симптомы 3 часа (1), взгляд симметричный (0)',
                        calculation: 'FAST-ED = 2+2+1+1+0 = 6 баллов → сосудистый центр с тромбэктомией'
                    },
                    {
                        scenario: 'Пациент 55 лет, лёгкая асимметрия лица (1), слабость в руке (1), чёткая речь (0), симптомы 1 час (0), взгляд симметричный (0)',
                        calculation: 'FAST-ED = 1+1+0+0+0 = 2 балла → ближайший стационар с инсультным отделением'
                    },
                    {
                        scenario: 'Пациент 72 года, девиация взора вправо (1), афазия (2), плегии в левых конечностях (2), лицо асимметрично (2), симптомы 6 часов (1)',
                        calculation: 'FAST-ED = 2+2+2+1+1 = 8 баллов → экстренная тромбэктомия, code stroke'
                    }
                ]
            },
            groups: [
                {
                    id: 'F',
                    title: 'Face (Лицо) — Асимметрия',
                    shortTitle: 'F',
                    icon: 'face',
                    items: [
                        { value: 0, title: 'Норма, симметричные движения' },
                        { value: 1, title: 'Лёгкая асимметрия (сглаженность носогубной складки)' },
                        { value: 2, title: 'Выраженная асимметрия (отчётливый парез)' }
                    ]
                },
                {
                    id: 'A',
                    title: 'Arms (Руки) — Слабость',
                    shortTitle: 'A',
                    icon: 'front_hand',
                    items: [
                        { value: 0, title: 'Норма, обе руки удерживает' },
                        { value: 1, title: 'Слабость в одной руке (дрейф, падение)' },
                        { value: 2, title: 'Слабость в обеих руках' }
                    ]
                },
                {
                    id: 'S',
                    title: 'Speech (Речь) — Нарушения',
                    shortTitle: 'S',
                    icon: 'record_voice_over',
                    items: [
                        { value: 0, title: 'Норма, чёткая речь' },
                        { value: 1, title: 'Лёгкие нарушения (дизартрия, поиск слов)' },
                        { value: 2, title: 'Выраженные нарушения (афазия, невнятная речь)' }
                    ]
                },
                {
                    id: 'T',
                    title: 'Time (Время) — От начала симптомов',
                    shortTitle: 'T',
                    icon: 'schedule',
                    items: [
                        { value: 0, title: 'Менее 2 часов' },
                        { value: 1, title: 'От 2 до 24 часов' },
                        { value: 2, title: 'Более 24 часов или неизвестно' }
                    ]
                },
                {
                    id: 'E',
                    title: 'Eyes (Глаза) — Девиация взора',
                    shortTitle: 'E',
                    icon: 'visibility',
                    items: [
                        { value: 0, title: 'Норма, взгляд симметричный' },
                        { value: 1, title: 'Вынужденная девиация взора (в сторону очага)' }
                    ]
                }
            ],
            resultRanges: [
                {
                    min: 0, max: 3,
                    label: 'Низкая вероятность окклюзии крупного сосуда',
                    description: 'Окклюзия крупных сосудов маловероятна. Транспортировка в ближайший стационар с инсультным отделением.',
                    color: 'gcs-14',
                    triage: 'Ближайший стационар с инсультным отделением',
                    triageIcon: 'local_hospital'
                },
                {
                    min: 4, max: 9,
                    label: 'Высокая вероятность окклюзии крупного сосуда',
                    description: 'Высокая вероятность окклюзии крупных сосудов. Показана транспортировка в центр с возможностью тромбэктомии.',
                    color: 'gcs-8-10',
                    triage: 'Сосудистый центр (тромбэктомия)',
                    triageIcon: 'emergency'
                }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selections = { F: null, A: null, S: null, T: null, E: null };
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('fast-ed');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-fast-ed',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'fast-ed'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page fast-ed-page">
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
                                    <div class="gcs-radio-item ripple" 
                                         data-group="${group.id}" 
                                         data-value="${item.value}">
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
        const allSelected = Object.values(this.selections).every(v => v !== null);
        
        if (!allSelected) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните все 5 параметров</div>
                        <div class="result-description">Не заполнено: ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const range = this.getRange(total);
        if (!range) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">${total}</div>
                        <div class="result-score-label">из 9</div>
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

        // ✅ Используем утилиту вместо хардкода
        const inlineStyle = getResultInlineStyle(range.color);

        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 9 (${breakdown.formula})</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    ${range.triage ? `
                        <div class="fast-ed-triage">
                            <span class="material-symbols-rounded">${range.triageIcon || 'local_hospital'}</span>
                            <strong>${range.triage}</strong>
                        </div>
                    ` : ''}
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
        const labels = { F: 'F', A: 'A', S: 'S', T: 'T', E: 'E' };
        const names = { 
            F: 'лицо (F)', 
            A: 'руки (A)', 
            S: 'речь (S)', 
            T: 'время (T)', 
            E: 'глаза (E)' 
        };
        const parts = [];
        const missing = [];
        
        for (const key of ['F', 'A', 'S', 'T', 'E']) {
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
        this.selections = { F: null, A: null, S: null, T: null, E: null };
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