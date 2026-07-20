import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class CiwaArPage {
    constructor(container) {
        this.container = container;
        this.selections = {};
        
        this.data = {
            title: "Шкала CIWA-Ar",
            subtitle: "Оценка тяжести алкогольной абстиненции",
            icon: "psychology",
            description: "Стандартизированная оценка тяжести алкогольной абстиненции для определения тактики медикаментозной терапии.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала CIWA-Ar — наиболее широко используемый инструмент для количественной оценки тяжести алкогольной абстиненции. Разработана в 1989 году как модификация исходной шкалы.",
                    "Шкала содержит 10 параметров, большинство из которых оцениваются от 0 до 7 баллов. Два параметра (ориентация и тактильные нарушения) имеют шкалу 0–4 балла. Максимальная сумма — 67 баллов, что соответствует крайне тяжёлой абстиненции.",
                    "CIWA-Ar позволяет стандартизировать наблюдение, титровать дозы бензодиазепинов (диазепам, хлордиазепоксид) и снизить общую дозу седативных препаратов на 50–70% по сравнению с фиксированным дозированием. Оценка проводится каждые 4–8 часов до стабильного снижения баллов ниже 8–10."
                ],
                importantNote: "Шкала не заменяет клиническую оценку. При признаках алкогольного делирия (спутанность сознания, галлюцинации, гипертермия) требуется экстренная терапия независимо от балла. Обязательно мониторирование витальных функций.",
                legalReference: null
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
                    therapy: 'Без фармакотерапии'
                },
                {
                    min: 8, max: 15,
                    label: 'Умеренная абстиненция',
                    description: 'Показана симптоматическая терапия бензодиазепинами. Мониторинг каждые 4–8 часов.',
                    color: 'gcs-11-12',
                    therapy: 'Бензодиазепины по потребности'
                },
                {
                    min: 16, max: 67,
                    label: 'Тяжёлая абстиненция',
                    description: 'Риск алкогольного делирия и судорог. Показана интенсивная седативная терапия, постоянный мониторинг, возможна госпитализация в отделение реанимации.',
                    color: 'gcs-3',
                    therapy: 'Интенсивная седация'
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-ciwa',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'ciwa-ar'
        });

        this.container.innerHTML = `

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
                                    <label class="gcs-radio-item ripple ciwa-radio-item" 
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

        return `
            <div class="result-content result-${range.color} ciwa-result">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 67 баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-therapy">${range.therapy}</div>
                    <div class="result-description">${range.description}</div>
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
        
        const progressEl = document.getElementById('ciwa-progress');
        const fillEl = document.getElementById('ciwa-progress-fill');
        
        if (progressEl) progressEl.textContent = `${filledCount} / ${totalGroups}`;
        if (fillEl) fillEl.style.width = `${percent}%`;
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

        this.updateProgress();
        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = {};
        document.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
        this.updateProgress();
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