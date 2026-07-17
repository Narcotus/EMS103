import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class ShsnScalePage {
    constructor(container) {
        this.container = container;
        // Для каждого параметра храним выбранный индекс варианта
        this.selections = {};
        
        this.data = {
            title: "Шкала оценки ХСН",
            subtitle: "Модификация Матвеева В.Ю., 2000",
            icon: "cardiology",
            description: "Оценка клинического состояния при хронической сердечной недостаточности. Определяет функциональный класс (ФК I–IV) по совокупности симптомов и признаков.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала оценки клинического состояния при ХСН разработана В.Ю. Матвеевым в 2000 году как модификация существующих шкал для российской клинической практики. Она позволяет количественно оценить тяжесть состояния пациента с хронической сердечной недостаточностью.",
                    "Шкала включает 10 параметров: одышку, динамику веса, перебои в работе сердца, положение в постели, набухание шейных вен, хрипы в лёгких, ритм галопа, гепатомегалию, отёки и уровень систолического АД. Каждый параметр оценивается от 0 до 3 баллов.",
                    "Максимальная сумма — 20 баллов, что соответствует терминальной стадии сердечной недостаточности. Шкала коррелирует с функциональными классами NYHA и используется для динамического наблюдения за эффективностью терапии."
                ],
                importantNote: null,
                legalReference: null
            },
            parameters: [
                {
                    id: 'dyspnea',
                    title: 'Одышка',
                    icon: 'air',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'При нагрузке', points: 1 },
                        { label: 'В покое', points: 2 }
                    ]
                },
                {
                    id: 'weight',
                    title: 'Изменился ли вес за последнюю неделю',
                    icon: 'scale',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Увеличился', points: 1 }
                    ]
                },
                {
                    id: 'palpitations',
                    title: 'Жалобы на перебои в работе сердца',
                    icon: 'monitor_heart',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Есть', points: 1 }
                    ]
                },
                {
                    id: 'position',
                    title: 'Положение в постели',
                    icon: 'bed',
                    options: [
                        { label: 'Горизонтальное', points: 0 },
                        { label: 'С приподнятым головным концом (+2 подушки)', points: 1 },
                        { label: 'С приподнятым головным концом, просыпается от удушья', points: 2 },
                        { label: 'Сидя', points: 3 }
                    ]
                },
                {
                    id: 'jvp',
                    title: 'Набухшие шейные вены',
                    icon: 'bloodtype',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Лёжа', points: 1 },
                        { label: 'Стоя', points: 2 }
                    ]
                },
                {
                    id: 'rales',
                    title: 'Хрипы в лёгких',
                    icon: 'pulmonology',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Нижние отделы до 1/3', points: 1 },
                        { label: 'До лопаток 2/3', points: 2 },
                        { label: 'Над всей поверхностью', points: 3 }
                    ]
                },
                {
                    id: 'gallop',
                    title: 'Наличие ритма галопа',
                    icon: 'hearing',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Есть', points: 1 }
                    ]
                },
                {
                    id: 'liver',
                    title: 'Печень',
                    icon: 'stethoscope',
                    options: [
                        { label: 'Не увеличена', points: 0 },
                        { label: 'Увеличена до 5 см', points: 1 },
                        { label: 'Увеличена более 5 см', points: 2 }
                    ]
                },
                {
                    id: 'edema',
                    title: 'Отёки',
                    icon: 'water_drop',
                    options: [
                        { label: 'Нет', points: 0 },
                        { label: 'Пастозность', points: 1 },
                        { label: 'Отёки', points: 2 },
                        { label: 'Анасарка', points: 3 }
                    ]
                },
                {
                    id: 'sbp',
                    title: 'Уровень САД (мм рт. ст.)',
                    icon: 'blood_pressure',
                    options: [
                        { label: '> 120', points: 0 },
                        { label: '100–120', points: 1 },
                        { label: '< 100', points: 2 }
                    ]
                }
            ],
            resultRanges: [
                { min: 0, max: 0, label: 'Нет клинических признаков СН', fc: '—', color: 'gcs-15' },
                { min: 1, max: 3, label: 'I ФК СН', fc: 'I', color: 'gcs-14' },
                { min: 4, max: 6, label: 'II ФК СН', fc: 'II', color: 'gcs-11-12' },
                { min: 7, max: 8, label: 'III ФК СН', fc: 'III', color: 'gcs-8-10' },
                { min: 9, max: 20, label: 'IV ФК СН', fc: 'IV', color: 'gcs-3' }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-shsn',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'shsn-scale'
        });

        this.container.innerHTML = `
            <div class="page-content calc-page">
                <button class="back-button" onclick="window.location.hash='calculators'">
                    <span class="material-symbols-rounded">arrow_back</span>
                    <span>Назад к калькуляторам</span>
                </button>

                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="shsn-groups">
                    ${this.data.parameters.map(param => `
                        <div class="gcs-group">
                            <div class="gcs-group-header">
                                <span class="material-symbols-rounded">${param.icon}</span>
                                <span class="gcs-group-title">${param.title}</span>
                                <span class="gcs-group-value" id="value-${param.id}">0</span>
                            </div>
                            <div class="gcs-group-items">
                                ${param.options.map((opt, idx) => `
                                    <label class="gcs-radio-item ripple" 
                                           data-param="${param.id}" 
                                           data-index="${idx}" 
                                           data-points="${opt.points}">
                                        <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
                                        <div class="gcs-radio-content">
                                            <div class="gcs-radio-title">${opt.label}</div>
                                        </div>
                                        <div class="gcs-radio-points">${opt.points}</div>
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
        const range = this.getRange(total);
        const answeredCount = Object.keys(this.selections).length;
        const totalParams = this.data.parameters.length;

        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 20 (${answeredCount}/${totalParams})</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}${range.fc !== '—' ? ` · ФК ${range.fc}` : ''}</div>
                    <div class="result-description">${this.getDescription(range)}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    getDescription(range) {
        if (range.fc === 'IV') return 'Терминальная стадия. Максимум 20 баллов.';
        if (range.fc === 'III') return 'Значительное ограничение физической активности.';
        if (range.fc === 'II') return 'Лёгкое ограничение физической активности.';
        if (range.fc === 'I') return 'Физическая активность не ограничена существенно.';
        return 'Признаки сердечной недостаточности отсутствуют.';
    }

    calculateTotal() {
        let total = 0;
        for (const paramId in this.selections) {
            const param = this.data.parameters.find(p => p.id === paramId);
            if (param) {
                const selectedIdx = this.selections[paramId];
                total += param.options[selectedIdx].points;
            }
        }
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max)
            || this.data.resultRanges[this.data.resultRanges.length - 1];
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
        const param = item.dataset.param;
        const index = parseInt(item.dataset.index);
        const points = parseInt(item.dataset.points);

        // Снимаем выбор с других вариантов этого параметра
        document.querySelectorAll(`.gcs-radio-item[data-param="${param}"]`).forEach(other => {
            other.classList.remove('selected');
        });

        item.classList.add('selected');
        this.selections[param] = index;

        // Обновляем бейдж в заголовке группы
        const valueEl = document.getElementById(`value-${param}`);
        if (valueEl) {
            valueEl.textContent = points > 0 ? `+${points}` : '0';
            valueEl.classList.toggle('has-value', points > 0);
        }

        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = {};
        document.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '0';
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