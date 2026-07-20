import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class FastEdPage {
    constructor(container) {
        this.container = container;
        this.selections = { F: null, A: null, S: null, T: null, E: null };
        
        this.data = {
            title: "Шкала FAST-ED",
            subtitle: "Field Assessment Stroke Triage for Emergency Destination",
            icon: "neurology",
            description: "Догоспитальная шкала для выявления пациентов с крупным окклюзионным инсультом (LVO), которым может быть показана тромбэктомия. Помогает выбрать оптимальный стационар.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала FAST-ED (Field Assessment Stroke Triage for Emergency Destination) разработана в 2017 году для догоспитального выявления пациентов с окклюзией крупных сосудов (Large Vessel Occlusion, LVO), которым может быть показана механическая тромбэктомия.",
                    "Шкала содержит 5 параметров: Face (лицо), Arms (руки), Speech (речь), Time (время) и Eyes (глаза). Максимальная сумма — 9 баллов. Пороговое значение ≥ 4 балла имеет высокую специфичность для выявления LVO и показаний к тромбэктомии.",
                    "Шкала используется бригадами скорой помощи для принятия решения о транспортировке пациента в специализированный сосудистый центр с возможностью проведения тромбэктомии, а не в ближайший стационар."
                ],
                importantNote: "FAST-ED ≥ 4 балла указывает на высокую вероятность окклюзии крупных сосудов. Таких пациентов следует направлять в центры с возможностью тромбэктомии, если время от начала симптомов < 24 часов.",
                legalReference: null
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
                    label: 'Низкая вероятность LVO',
                    description: 'Окклюзия крупных сосудов маловероятна. Транспортировка в ближайший стационар с инсультным отделением.',
                    color: 'gcs-14',
                    triage: 'Ближайший стационар'
                },
                {
                    min: 4, max: 9,
                    label: 'Высокая вероятность LVO',
                    description: 'Высокая вероятность окклюзии крупных сосудов. Показана транспортировка в центр с возможностью тромбэктомии.',
                    color: 'gcs-8-10',
                    triage: 'Сосудистый центр (тромбэктомия)'
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-fast-ed',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'fast-ed'
        });

        this.container.innerHTML = `

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
                                    <label class="gcs-radio-item ripple" 
                                           data-group="${group.id}" 
                                           data-value="${item.value}">
                                        <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
                                        <div class="gcs-radio-content">
                                            <div class="gcs-radio-title">${item.title}</div>
                                        </div>
                                        <div class="gcs-radio-points">${item.value}</div>
                                    </label>
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
        bindInfoButton(this.data);
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
                        <div class="result-description">Заполните: ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const range = this.getRange(total);

        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 9 (${breakdown.formula})</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-triage">${range.triage}</div>
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
        document.querySelectorAll('.gcs-radio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectItem(item);
            });
        });
        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    selectItem(item) {
        const group = item.dataset.group;
        const value = parseInt(item.dataset.value);

        document.querySelectorAll(`.gcs-radio-item[data-group="${group}"]`).forEach(other => {
            other.classList.remove('selected');
        });

        item.classList.add('selected');
        this.selections[group] = value;

        const valueEl = document.getElementById(`value-${group}`);
        if (valueEl) {
            valueEl.textContent = value;
            valueEl.classList.add('has-value');
        }

        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = { F: null, A: null, S: null, T: null, E: null };
        document.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
        this.updateResult();
        window.showSnackbar?.('🔄 Результат сброшен');
    }

    updateResult() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
            panel.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
        }
    }
}