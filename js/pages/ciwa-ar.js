import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class CiwaArPage {
    constructor(container) {
        this.container = container;
        this.selections = {};
        this._clickHandler = null;
        
        this.data = {
            title: "Шкала CIWA-Ar",
            subtitle: "Оценка тяжести алкогольной абстиненции",
            icon: "psychology",
            description: "Стандартизированная оценка тяжести алкогольной абстиненции для определения тактики медикаментозной терапии.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала CIWA-Ar — наиболее широко используемый инструмент для количественной оценки тяжести алкогольной абстиненции. Разработана в 1989 году как модификация исходной шкалы.",
                    "Шкала содержит 10 параметров, большинство из которых оцениваются от 0 до 7 баллов. Два параметра (ориентация и тактильные нарушения) имеют шкалу 0–4 балла. Максимальная сумма — 67 баллов.",
                    "CIWA-Ar позволяет стандартизировать наблюдение, титровать дозы бензодиазепинов (диазепам, хлордиазепоксид) и снизить общую дозу седативных препаратов на 50–70%."
                ],
                importantNote: "Шкала не заменяет клиническую оценку. При признаках алкогольного делирия (спутанность сознания, галлюцинации, гипертермия) требуется экстренная терапия независимо от балла.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Сумма CIWA-Ar', 
                        formula: 'Σ 10 параметров (макс 67 баллов)', 
                        example: 'Тошнота 3 + Тремор 4 + ... = итоговый балл' 
                    },
                    { 
                        name: 'Интерпретация', 
                        formula: '0-7: лёгкая | 8-15: умеренная | ≥16: тяжёлая', 
                        example: '12 баллов → умеренная → бензодиазепины' 
                    }
                ],
                quickRules: [
                    { icon: '✅', rule: '0-7 баллов — без фармакотерапии, мониторинг каждые 8 ч' },
                    { icon: '⚠️', rule: '8-15 баллов — бензодиазепины по потребности' },
                    { icon: '🚨', rule: '≥16 баллов — риск делирия, интенсивная седация' },
                    { icon: '💊', rule: 'Диазепам 10-20 мг или хлордиазепоксид 50-100 мг' },
                    { icon: '🧠', rule: 'Делирий = экстренная терапия независимо от балла' },
                    { icon: '📉', rule: 'Титрование по шкале снижает дозу на 50-70%' }
                ],
                examples: [
                    {
                        scenario: 'Пациент 45 лет, 2 дня без алкоголя: лёгкая тошнота (2), лёгкий тремор (3), лёгкая тревога (2), остальное в норме',
                        calculation: 'CIWA-Ar = 7 баллов → лёгкая абстиненция → наблюдение каждые 8 часов, без препаратов'
                    },
                    {
                        scenario: 'Пациент 52 года, сутки без алкоголя: умеренная тошнота (4), умеренный тремор (5), выраженная тревога (5), лёгкая потливость (3)',
                        calculation: 'CIWA-Ar = 17 баллов → тяжёлая абстиненция → диазепам 10 мг в/в, мониторинг каждые 2-4 часа'
                    },
                    {
                        scenario: 'Пациент с галлюцинациями, дезориентацией, профузным потом, тремором 7 баллов',
                        calculation: 'CIWA-Ar > 25 баллов + признаки делирия → экстренная седация, ОРИТ, постоянный мониторинг'
                    }
                ]
            },
            groups: [
                {
                    id: 'nausea',
                    title: 'Тошнота и рвота',
                    icon: 'sick',
                    max: 7,
                    items: [
                        { value: 0, title: 'Нет тошноты' },
                        { value: 1, title: 'Очень лёгкая тошнота' },
                        { value: 2, title: 'Лёгкая тошнота' },
                        { value: 3, title: 'Умеренная тошнота' },
                        { value: 4, title: 'Умеренная тошнота с позывами на рвоту' },
                        { value: 5, title: 'Сильная тошнота' },
                        { value: 6, title: 'Сильная тошнота с позывами на рвоту' },
                        { value: 7, title: 'Постоянная тошнота с многократной рвотой' }
                    ]
                },
                {
                    id: 'tremor',
                    title: 'Тремор (руки вытянуты, пальцы разведены)',
                    icon: 'vibration',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствует' },
                        { value: 1, title: 'Не заметен, ощущается кончиками пальцев' },
                        { value: 2, title: 'Очень лёгкий' },
                        { value: 3, title: 'Лёгкий' },
                        { value: 4, title: 'Умеренный (в покое)' },
                        { value: 5, title: 'Умеренный (при вытянутых руках)' },
                        { value: 6, title: 'Выраженный' },
                        { value: 7, title: 'Грубый, размашистый' }
                    ]
                },
                {
                    id: 'sweating',
                    title: 'Пароксизмальные поты (при нормальной температуре)',
                    icon: 'water_drop',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствуют' },
                        { value: 1, title: 'Едва заметны' },
                        { value: 2, title: 'Лёгкая влажность ладоней' },
                        { value: 3, title: 'Лёгкая испарина на лбу' },
                        { value: 4, title: 'Умеренная потливость' },
                        { value: 5, title: 'Выраженная потливость лба и лица' },
                        { value: 6, title: 'Профузный пот' },
                        { value: 7, title: 'Профузный пот по всему телу' }
                    ]
                },
                {
                    id: 'anxiety',
                    title: 'Тревога',
                    icon: 'sentiment_very_dissatisfied',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствует, спокоен' },
                        { value: 1, title: 'Очень лёгкая' },
                        { value: 2, title: 'Лёгкая' },
                        { value: 3, title: 'Умеренная (чувство дискомфорта)' },
                        { value: 4, title: 'Умеренно выраженная' },
                        { value: 5, title: 'Выраженная' },
                        { value: 6, title: 'Сильная' },
                        { value: 7, title: 'Эквивалентна острой панической атаке' }
                    ]
                },
                {
                    id: 'agitation',
                    title: 'Ажитация',
                    icon: 'directions_run',
                    max: 7,
                    items: [
                        { value: 0, title: 'Нормальная активность' },
                        { value: 1, title: 'Чуть больше обычной' },
                        { value: 2, title: 'Лёгкое беспокойство' },
                        { value: 3, title: 'Умеренное беспокойство' },
                        { value: 4, title: 'Умеренно выраженная' },
                        { value: 5, title: 'Выраженная' },
                        { value: 6, title: 'Мечется, постоянно меняет позу' },
                        { value: 7, title: 'Постоянно пытается встать с кровати' }
                    ]
                },
                {
                    id: 'tactile',
                    title: 'Тактильные нарушения',
                    icon: 'touch_app',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствуют' },
                        { value: 1, title: 'Очень лёгкий зуд/парестезии' },
                        { value: 2, title: 'Лёгкий зуд' },
                        { value: 3, title: 'Умеренный зуд' },
                        { value: 4, title: 'Умеренно выраженный зуд/парестезии' },
                        { value: 5, title: 'Выраженные ощущения' },
                        { value: 6, title: 'Сильные галлюцинации' },
                        { value: 7, title: 'Постоянные тактильные галлюцинации' }
                    ]
                },
                {
                    id: 'auditory',
                    title: 'Слуховые нарушения',
                    icon: 'hearing',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствуют' },
                        { value: 1, title: 'Очень лёгкая раздражительность к звукам' },
                        { value: 2, title: 'Лёгкая раздражительность' },
                        { value: 3, title: 'Умеренная' },
                        { value: 4, title: 'Умеренно выраженные галлюцинации' },
                        { value: 5, title: 'Выраженные галлюцинации' },
                        { value: 6, title: 'Постоянные галлюцинации' },
                        { value: 7, title: 'Угрожающие голоса' }
                    ]
                },
                {
                    id: 'visual',
                    title: 'Зрительные нарушения',
                    icon: 'visibility',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствуют' },
                        { value: 1, title: 'Очень лёгкая светобоязнь' },
                        { value: 2, title: 'Лёгкая' },
                        { value: 3, title: 'Умеренная светобоязнь' },
                        { value: 4, title: 'Умеренно выраженные зрительные галлюцинации' },
                        { value: 5, title: 'Выраженные' },
                        { value: 6, title: 'Постоянные галлюцинации' },
                        { value: 7, title: 'Угрожающие видения' }
                    ]
                },
                {
                    id: 'headache',
                    title: 'Головная боль, ощущение «наполнения» головы',
                    icon: 'headset_mic',
                    max: 7,
                    items: [
                        { value: 0, title: 'Отсутствует' },
                        { value: 1, title: 'Очень лёгкая' },
                        { value: 2, title: 'Лёгкая' },
                        { value: 3, title: 'Умеренная' },
                        { value: 4, title: 'Умеренно выраженная' },
                        { value: 5, title: 'Выраженная' },
                        { value: 6, title: 'Сильная' },
                        { value: 7, title: 'Эквивалентна тяжелейшей мигрени' }
                    ]
                },
                {
                    id: 'orientation',
                    title: 'Ориентация и ясность сознания',
                    icon: 'psychology_alt',
                    max: 4,
                    items: [
                        { value: 0, title: 'Полностью ориентирован, может выполнять серийный счёт' },
                        { value: 1, title: 'Не может выполнить серийный счёт, но ориентирован' },
                        { value: 2, title: 'Дезориентирован в дате (ошибка до 2 дней)' },
                        { value: 3, title: 'Дезориентирован в месте' },
                        { value: 4, title: 'Дезориентирован в личности (себя не узнаёт)' }
                    ]
                }
            ],
            resultRanges: [
                {
                    min: 0, max: 7,
                    label: 'Лёгкая абстиненция',
                    description: 'Медикаментозная терапия не требуется. Психологическая поддержка, мониторинг каждые 8 часов.',
                    color: 'gcs-15',
                    therapy: 'Без фармакотерапии. Мониторинг каждые 8 часов.'
                },
                {
                    min: 8, max: 15,
                    label: 'Умеренная абстиненция',
                    description: 'Показана симптоматическая терапия бензодиазепинами. Мониторинг каждые 4–8 часов.',
                    color: 'gcs-11-12',
                    therapy: 'Диазепам 10-20 мг или хлордиазепоксид 50-100 мг. Мониторинг каждые 4-8 часов.'
                },
                {
                    min: 16, max: 67,
                    label: 'Тяжёлая абстиненция',
                    description: 'Риск алкогольного делирия и судорог. Показана интенсивная седативная терапия, постоянный мониторинг, возможна госпитализация в отделение реанимации.',
                    color: 'gcs-3',
                    therapy: 'Интенсивная седация. ОРИТ. Постоянный мониторинг каждые 1-2 часа.'
                }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selections = {};
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('ciwa-ar');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-ciwa',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'ciwa-ar'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page ciwa-ar-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Прогресс-бар -->
                <div class="ciwa-progress-card card card-outlined">
                    <div class="ciwa-progress-header">
                        <span class="ciwa-progress-label">Заполнено параметров</span>
                        <span class="ciwa-progress-value" id="ciwa-progress">0 / 10</span>
                    </div>
                    <div class="ciwa-progress-bar">
                        <div class="ciwa-progress-fill" id="ciwa-progress-fill" style="width: 0%;"></div>
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
                            <div class="gcs-group-items ciwa-items">
                                ${group.items.map(item => `
                                    <div class="gcs-radio-item ripple ciwa-radio-item" 
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
        // ✅ Передаём контейнер для привязки кнопки ℹ
        bindInfoButton(this.data, this.container);
        this.updateProgress();
    }

    renderResult() {
        const total = this.calculateTotal();
        const filledCount = Object.keys(this.selections).length;
        const totalGroups = this.data.groups.length;

        if (filledCount < totalGroups) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните все 10 параметров</div>
                        <div class="result-description">Осталось: ${totalGroups - filledCount}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const range = this.getRange(total);
        // ✅ Используем утилиту вместо хардкода
        const inlineStyle = getResultInlineStyle(range.color);

        return `
            <div class="result-content result-${range.color} ciwa-result" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 67 баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    ${range.therapy ? `
                        <div class="result-action">
                            <span class="material-symbols-rounded">medication</span>
                            ${range.therapy}
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
        let total = 0;
        for (const key in this.selections) {
            total += this.selections[key];
        }
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max)
            || this.data.resultRanges[this.data.resultRanges.length - 1];
    }

    updateProgress() {
        const filledCount = Object.keys(this.selections).length;
        const totalGroups = this.data.groups.length;
        const percent = Math.round((filledCount / totalGroups) * 100);
        
        const progressEl = this.container.querySelector('#ciwa-progress');
        const fillEl = this.container.querySelector('#ciwa-progress-fill');
        
        if (progressEl) progressEl.textContent = `${filledCount} / ${totalGroups}`;
        if (fillEl) fillEl.style.width = `${percent}%`;
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

        this.updateProgress();
        this.updateResult();
    }

    resetAll() {
        this.container.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = {};
        this.container.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
        this.updateProgress();
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