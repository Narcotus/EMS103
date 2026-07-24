import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class PesIScorePage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        this.ageValue = 0;
        this._clickHandler = null;
        this._inputHandler = null;
        
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
                legalReference: "Постановление Министерства здравоохранения Республики Беларусь 28.04.2026 № 43 «Клинический протокол „Диагностика, лечение и медицинская профилактика тромбоэмболии легочной артерии (взрослое население)“»",
                formulas: [
                    { name: 'Базовая формула PESI', formula: 'Возраст (годы) + сумма баллов критериев', example: '65 лет + 30 (рак) + 20 (ЧСС) = 115 → Класс IV' },
                    { name: 'Упрощённая sPESI', formula: '0 или 1 балл (без возраста)', example: '0 баллов → низкий риск (1% летальность)' }
                ],
                quickRules: [
                    { icon: '✅', rule: 'Класс I-II (≤85) — кандидаты для амбулаторного лечения' },
                    { icon: '⚠️', rule: 'Класс III (86-105) — стационарное лечение' },
                    { icon: '🚨', rule: 'Класс IV (106-125) — специализированное отделение' },
                    { icon: '💀', rule: 'Класс V (≥126) — ОРИТ' },
                    { icon: '🎯', rule: 'Возраст добавляется к сумме напрямую (в годах)' },
                    { icon: '📋', rule: 'Применять только ПОСЛЕ подтверждения ТЭЛА' }
                ],
                examples: [
                    {
                        scenario: 'Пациент 55 лет, без сопутствующих заболеваний, ЧСС 88, САД 120, ЧД 18, t° 36.6°C, SpO₂ 96%, сознание ясное',
                        calculation: 'PESI = 55 + 0 = 55 баллов → Класс I (очень низкий риск, 0-1.6%) → амбулаторное лечение'
                    },
                    {
                        scenario: 'Пациент 72 года, рак лёгкого (+30), ЧСС 115 (+20), САД 95 (+30), SpO₂ 88% (+20)',
                        calculation: 'PESI = 72 + 30 + 20 + 30 + 20 = 172 балла → Класс V (очень высокий риск, 10-24.5%) → ОРИТ'
                    },
                    {
                        scenario: 'Пациент 68 лет, ХСН (+10), ХОБЛ (+10), ЧД 32 (+20)',
                        calculation: 'PESI = 68 + 10 + 10 + 20 = 108 баллов → Класс IV (высокий риск) → специализированное отделение'
                    }
                ]
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
                    action: "Амбулаторное лечение / ранняя выписка",
                    color: "gcs-15"
                },
                {
                    min: 66, max: 85,
                    label: "Класс II — Низкий риск",
                    mortality: "1,7–3,5 %",
                    description: "Возможно лечение в стационаре кратковременного пребывания.",
                    action: "Стационар кратковременного пребывания",
                    color: "gcs-14"
                },
                {
                    min: 86, max: 105,
                    label: "Класс III — Умеренный риск",
                    mortality: "3,2–7,1 %",
                    description: "Требуется госпитализация в стационар.",
                    action: "Госпитализация в стационар",
                    color: "gcs-11-12"
                },
                {
                    min: 106, max: 125,
                    label: "Класс IV — Высокий риск",
                    mortality: "4,0–11,4 %",
                    description: "Требуется лечение в специализированном отделении.",
                    action: "Специализированное отделение",
                    color: "gcs-8-10"
                },
                {
                    min: 126, max: 999,
                    label: "Класс V — Очень высокий риск",
                    mortality: "10,0–24,5 %",
                    description: "Показано лечение в отделении реанимации и интенсивной терапии.",
                    action: "ОРИТ",
                    color: "gcs-3"
                }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        if (this._inputHandler && this.container) {
            this.container.removeEventListener('input', this._inputHandler, true);
            this._inputHandler = null;
        }
        this.checkedItems.clear();
        this.ageValue = 0;
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS
        await loadCalculatorCSS('pesi-score');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-pesi',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'pesi-score',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page pesi-score-page">
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
                        <div class="calc-item ripple" data-id="${item.id}" data-points="${item.points}">
                            <div class="calc-item-checkbox">
                                <span class="material-symbols-rounded check-icon">check</span>
                            </div>
                            <div class="calc-item-content">
                                <div class="calc-item-title">${item.title}</div>
                            </div>
                            <div class="calc-item-points">+${item.points}</div>
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
        const inlineStyle = getResultInlineStyle(range.color);
        
        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralize(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-mortality">Смертность: ${range.mortality}</div>
                    <div class="result-description">${range.description}</div>
                    ${range.action ? `<div class="result-action">${range.action}</div>` : ''}
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
        if (n === 0) return 'баллов';
        const lastTwo = n % 100;
        const lastOne = n % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'баллов';
        if (lastOne === 1) return 'балл';
        if (lastOne >= 2 && lastOne <= 4) return 'балла';
        return 'баллов';
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }

        // Обработчик input для возраста
        this._inputHandler = (e) => {
            if (!e.target.matches('#age-input')) return;
            
            let value = parseInt(e.target.value) || 0;
            if (value < 0) value = 0;
            if (value > 120) {
                value = 120;
                e.target.value = 120;
            }
            this.ageValue = value;
            this.updateResult();
        };
        this.container.addEventListener('input', this._inputHandler, true);

        // Обработчик кликов для чекбоксов и сброса
        this._clickHandler = (e) => {
            // Кнопка сброса
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }

            // Чекбокс-элемент
            const item = e.target.closest('.calc-item[data-id]');
            if (item && this.container.contains(item)) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleItem(item);
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
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
        this.container.querySelectorAll('.calc-item.checked').forEach(item => {
            item.classList.remove('checked');
        });
        this.checkedItems.clear();
        this.ageValue = 0;
        const ageInput = this.container.querySelector('#age-input');
        if (ageInput) ageInput.value = '';
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