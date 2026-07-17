import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class PesI_scorePage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        this.ageValue = 0;
        
        this.data = {
            title: "Оценка тяжести ТЭЛА (PESI)",
            subtitle: "Pulmonary Embolism Severity Index",
            icon: "cardiology",
            description: "Прогнозирование риска летального исхода в течение 30 дней у пациентов с подтверждённой тромбоэмболией лёгочной артерии.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала PESI (Индекс тяжести легочной эмболии, Pulmonary Embolism Severity Index) — прогнозирование риска летального исхода в течение 30 дней у пациентов с диагностированной тромбоэмболией легочной артерии. Применяются 11 параметров, оценивающие наличие сопутствующих заболеваний и витальные признаки. Пациенту начисляются баллы (возраст + баллы за каждый критерий), по сумме определяется 1 из 5 классов риска (I–V).",
                    "Шкала позволяет стратифицировать пациентов для принятия решения о возможности амбулаторного лечения (классы I–II) или необходимости стационарного наблюдения (классы III–V). Пациенты с очень низким и низким риском могут быть кандидатами для ранней выписки или лечения на дому при наличии соответствующих условий."
                ],
                importantNote: "Важно: данная шкала применяется только после подтверждения диагноза ТЭЛА.",
                legalReference: "Постановление Министерства здравоохранения Республики Беларусь 28.04.2026 № 43 «Клинический протокол „Диагностика, лечение и медицинская профилактика тромбоэмболии легочной артерии (взрослое население)“»"
            },
            ageItem: {
                id: "age",
                title: "Возраст (в годах)",
                type: "number"
            },
            items: [
                { id: "male", title: "Мужской пол", points: 10 },
                { id: "cancer", title: "Злокачественное новообразование", points: 30 },
                { id: "chf", title: "Хроническая сердечная недостаточность", points: 10 },
                { id: "copd", title: "Хроническое заболевание лёгких", points: 10 },
                { id: "hr", title: "ЧСС > 110 уд/мин", points: 20 },
                { id: "sbp", title: "Систолическое АД < 100 мм рт. ст.", points: 30 },
                { id: "rr", title: "Частота дыхательных движений > 30 в минуту", points: 20 },
                { id: "temp", title: "Температура тела < 36 °C", points: 20 },
                { id: "consciousness", title: "Нарушение сознания", points: 60 },
                { id: "spo2", title: "Насыщение артериальной крови кислородом < 90 %", points: 20 }
            ],
            resultRanges: [
                {
                    min: 0, max: 65,
                    label: "Класс I — Очень низкий риск",
                    mortality: "0–1,6 %",
                    description: "Возможно амбулаторное лечение или ранняя выписка при наличии условий.",
                    color: "pesi-1"
                },
                {
                    min: 66, max: 85,
                    label: "Класс II — Низкий риск",
                    mortality: "1,7–3,5 %",
                    description: "Возможно лечение в стационаре кратковременного пребывания.",
                    color: "pesi-2"
                },
                {
                    min: 86, max: 105,
                    label: "Класс III — Умеренный риск",
                    mortality: "3,2–7,1 %",
                    description: "Требуется госпитализация в стационар.",
                    color: "pesi-3"
                },
                {
                    min: 106, max: 125,
                    label: "Класс IV — Высокий риск",
                    mortality: "4,0–11,4 %",
                    description: "Требуется лечение в специализированном отделении.",
                    color: "pesi-4"
                },
                {
                    min: 126, max: 999,
                    label: "Класс V — Очень высокий риск",
                    mortality: "10,0–24,5 %",
                    description: "Показано лечение в отделении реанимации и интенсивной терапии.",
                    color: "pesi-5"
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-pesi',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'pesi-score'
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

                <div class="calc-items">
                    <!-- Поле ввода возраста -->
                    <div class="calc-item calc-item-input">
                        <div class="calc-item-checkbox" style="background: var(--md-primary); border-color: var(--md-primary);">
                            <span class="material-symbols-rounded" style="color: var(--md-on-primary); font-size: 18px;">person</span>
                        </div>
                        <div class="calc-item-content">
                            <div class="calc-item-title">${this.data.ageItem.title}</div>
                        </div>
                        <div class="calc-age-wrapper">
                            <input type="number" id="age-input" class="calc-age-input" 
                                min="0" max="120" placeholder="—" inputmode="numeric">
                            <span class="calc-age-unit">лет</span>
                        </div>
                    </div>

                    <!-- Чекбоксы -->
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
        
        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralize(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-mortality">Смертность: ${range.mortality}</div>
                    <div class="result-description">${range.description}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    calculateTotal() {
        let total = this.ageValue;
        this.checkedItems.forEach(id => {
            const item = this.data.items.find(i => i.id === id);
            if (item) total += item.points;
        });
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max) 
            || this.data.resultRanges[this.data.resultRanges.length - 1];
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
        // Ввод возраста
        const ageInput = document.getElementById('age-input');
        ageInput?.addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;
            if (value < 0) value = 0;
            if (value > 120) value = 120;
            this.ageValue = value;
            this.updateResult();
        });

        // Чекбоксы
        document.querySelectorAll('.calc-item[data-id]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleItem(item);
            });
        });

        // Сброс
        document.querySelector('.result-reset')?.addEventListener('click', () => {
            this.resetAll();
        });
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
        document.querySelectorAll('.calc-item.checked').forEach(item => {
            item.classList.remove('checked');
        });
        this.checkedItems.clear();
        this.ageValue = 0;
        const ageInput = document.getElementById('age-input');
        if (ageInput) ageInput.value = '';
        this.updateResult();
        window.showSnackbar?.('🔄 Результат сброшен');
    }

    updateResult() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
            panel.querySelector('.result-reset')?.addEventListener('click', () => {
                this.resetAll();
            });
        }
    }
}