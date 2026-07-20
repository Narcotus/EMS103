import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class SadPersonsPage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        
        this.data = {
            title: "Шкала оценки риска суицида",
            subtitle: "SAD PERSONS Scale (ШОРС, 1983)",
            icon: "psychology",
            description: "Экспресс-диагностика суицидального риска. 10 факторов оцениваются как 0 (отсутствует) или 1 (присутствует). Применяется для определения тактики наблюдения и госпитализации.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала оценки риска суицида (ШОРС, The SAD PERSONS Scale) разработана в 1983 году и предназначена для экспресс-диагностики суицидального риска. Шкала содержит 10 пунктов, характеризующих факторы риска суицида и оцениваемых клиницистом как 0 (отсутствует) либо 1 (присутствует).",
                    "Аббревиатура SAD PERSONS образована из первых букв английских названий факторов риска: Sex, Age, Depression, Previous attempt, Ethanol abuse, Rational thinking loss, Social support lacking, Organized plan, No spouse, Sickness. Каждый подтверждённый фактор даёт 1 балл.",
                    "Результат определяет уровень риска и рекомендуемую тактику: от амбулаторного наблюдения при низком риске до обязательной госпитализации (в том числе принудительной) при очень высоком риске."
                ],
                importantNote: "Шкала является скрининговым инструментом и не заменяет полноценную клиническую оценку. При наличии организованного плана суицида с летальным методом госпитализация показана независимо от общего балла.",
                legalReference: "Приказ МЗ РБ № 480 от 22.04.2020 «О мерах по оптимизации профилактики суицидов в РБ». Инструкция об определении суицидального риска и алгоритме действий медицинских работников при оказании помощи лицам с установленным риском суицидального поведения."
            },
            items: [
                { id: "sex", title: "Пол мужской", points: 1 },
                { id: "age", title: "Возраст < 19 лет или > 45 лет", points: 1 },
                { id: "depression", title: "Депрессия", points: 1 },
                { id: "previous", title: "Парасуициды в анамнезе", points: 1 },
                { id: "ethanol", title: "Злоупотребление алкоголем", points: 1 },
                { id: "rational", title: "Нарушение рационального мышления (бред, галлюцинации, когнитивные нарушения)", points: 1 },
                { id: "social", title: "Недостаток социальной поддержки (одиночество, потеря значимого другого)", points: 1 },
                { id: "plan", title: "Организованный план суицида с потенциально летальным методом", points: 1 },
                { id: "spouse", title: "Отсутствие супруга/супруги (разведён, вдовец, живёт отдельно)", points: 1 },
                { id: "sickness", title: "Тяжёлое хроническое или инвалидизирующее заболевание", points: 1 }
            ],
            resultRanges: [
                {
                    min: 0, max: 2,
                    label: "Низкий риск",
                    description: "Амбулаторное наблюдение.",
                    color: "success"
                },
                {
                    min: 3, max: 4,
                    label: "Средний риск",
                    description: "Амбулаторное наблюдение с частыми встречами (1–3 р/неделю); дневной стационар; рассмотреть возможность госпитализации.",
                    color: "warning"
                },
                {
                    min: 5, max: 6,
                    label: "Высокий риск",
                    description: "Рекомендовать госпитализацию, если нет уверенности в качественном амбулаторном наблюдении (психиатрическая и социальная служба, родственники).",
                    color: "pesi-4"
                },
                {
                    min: 7, max: 10,
                    label: "Очень высокий риск",
                    description: "Госпитализация, в том числе принудительная.",
                    color: "error"
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-sad-persons',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'sad-persons'
        });

        this.container.innerHTML = `

                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="calc-items">
                    ${this.data.items.map(item => `
                        <label class="calc-item ripple" data-id="${item.id}" data-points="${item.points}">
                            <div class="calc-item-checkbox">
                                <span class="material-symbols-rounded check-icon">check</span>
                            </div>
                            <div class="calc-item-content">
                                <div class="calc-item-title">${item.title}</div>
                            </div>
                            <div class="calc-item-points">+${item.points}</div>
                        </label>
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
        
        // Проверяем наличие организованного плана — всегда показывает предупреждение
        const hasPlan = this.checkedItems.has('plan');
        
        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralize(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    ${hasPlan ? '<div class="result-warning">⚠️ Есть план суицида — госпитализация показана независимо от балла</div>' : ''}
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    calculateTotal() {
        let total = 0;
        this.checkedItems.forEach(id => {
            const item = this.data.items.find(i => i.id === id);
            if (item) total += item.points;
        });
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max) 
            || this.data.resultRanges[0];
    }

    pluralize(n) {
        const lastTwo = n % 100;
        const lastOne = n % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'баллов';
        if (lastOne === 1) return 'балл';
        if (lastOne >= 2 && lastOne <= 4) return 'балла';
        return 'баллов';
    }

    setupEventListeners() {
        document.querySelectorAll('.calc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleItem(item);
            });
        });
        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    toggleItem(item) {
        const id = item.dataset.id;
        const isChecked = item.classList.toggle('checked');
        if (isChecked) {
            this.checkedItems.add(id);
        } else {
            this.checkedItems.delete(id);
        }
        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.calc-item.checked').forEach(item => item.classList.remove('checked'));
        this.checkedItems.clear();
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