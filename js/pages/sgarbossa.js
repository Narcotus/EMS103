import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class SgarbossaPage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        this._clickHandler = null;
        
        this.data = {
            title: "Критерии Сгарбоссы",
            subtitle: "Диагностика ИМ при блокаде левой ножки пучка Гиса",
            icon: "monitor_heart",
            description: "Вероятностные ЭКГ-критерии диагностики острого инфаркта миокарда у пациентов с блокадой левой ножки пучка Гиса (БЛНПГ). Разработаны в исследовании GUSTO-1 (1996).",
            reference: {
                title: "О критериях",
                paragraphs: [
                    "Критерии Сгарбоссы (Sgarbossa Criteria) разработаны в 1996 году на основе данных исследования GUSTO-1 для электрокардиографической диагностики острого инфаркта миокарда у пациентов с блокадой левой ножки пучка Гиса, когда стандартные критерии элевации ST неприменимы.",
                    "Шкала включает три независимых ЭКГ-признака с разным диагностическим весом. Сумма ≥3 баллов имеет высокую специфичность (90–98%) для подтверждения ИМ, но низкую чувствительность. При сумме <3 баллов ИМ не исключается и требуется дополнительная диагностика (тропонин, ЭхоКГ, коронарография).",
                    "В 2012 году Smith et al. предложили модифицированные критерии (Smith-modified Sgarbossa), заменив абсолютную элевацию ST ≥5 мм на соотношение ST/S ≤ −0.25, что повысило чувствительность при сохранении специфичности."
                ],
                importantNote: "Критерии Сгарбоссы имеют высокую специфичность, но низкую чувствительность. Отрицательный результат (0–2 балла) НЕ исключает ИМ. Обязательна оценка тропонина и клинической картины.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Пороговое значение', 
                        formula: 'Сумма ≥ 3 баллов → ИМ подтверждён', 
                        example: 'Специфичность 90-98%, чувствительность низкая' 
                    },
                    { 
                        name: 'Модификация Смита (2012)', 
                        formula: 'Соотношение ST/S ≤ −0.25 (вместо ST ≥ 5 мм)', 
                        example: 'Повышает чувствительность при сохранении специфичности' 
                    }
                ],
                quickRules: [
                    { icon: '✅', rule: '≥ 3 баллов → экстренная реперфузионная терапия' },
                    { icon: '⚠️', rule: '< 3 баллов НЕ исключает ИМ — оцените тропонин!' },
                    { icon: '💊', rule: 'Конкордантная элевация ST (≥1 мм) = 5 баллов (самый важный)' },
                    { icon: '📉', rule: 'Депрессия ST в V1-V3 = 3 балла (задний ИМ)' },
                    { icon: '📊', rule: 'Дискордантная элевация ST (≥5 мм) = 2 балла' },
                    { icon: '🔄', rule: 'Модификация Смита (2012) — современная альтернатива' }
                ],
                examples: [
                    {
                        scenario: 'БЛНПГ, конкордантная элевация ST 2 мм в V5-V6',
                        calculation: 'Sgarbossa = 5 баллов → ИМ подтверждён → экстренная ЧКВ'
                    },
                    {
                        scenario: 'БЛНПГ, депрессия ST 1.5 мм в V2-V3',
                        calculation: 'Sgarbossa = 3 балла → высокая вероятность заднего ИМ → тропонин + ЧКВ'
                    },
                    {
                        scenario: 'БЛНПГ, дискордантная элевация ST 3 мм, без конкордантных изменений',
                        calculation: 'Sgarbossa = 0 баллов (критерий ≥5 мм не достигнут) → но ИМ не исключён!'
                    }
                ]
            },
            items: [
                { 
                    id: 'concordant_st_elevation', 
                    title: 'Элевация сегмента ST ≥ 1 мм, конкордантная с осью QRS', 
                    points: 5 
                },
                { 
                    id: 'st_depression_v1v3', 
                    title: 'Депрессия сегмента ST ≥ 1 мм в отведениях V1, V2 или V3', 
                    points: 3 
                },
                { 
                    id: 'discordant_st_elevation', 
                    title: 'Элевация сегмента ST ≥ 5 мм, дискордантная с осью QRS', 
                    points: 2 
                }
            ],
            probabilityTable: [
                { score: 10, probability: '100%' },
                { score: 8, probability: '92%' },
                { score: 7, probability: '93%' },
                { score: 5, probability: '88%' },
                { score: 3, probability: '66%' },
                { score: 2, probability: '50%' },
                { score: 0, probability: '16%' }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.checkedItems.clear();
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS
        await loadCalculatorCSS('sgarbossa');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-sgarbossa',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'sgarbossa',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page sgarbossa-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="calc-items">
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

                <!-- Таблица вероятностей -->
                <div class="card card-outlined sgarbossa-probability-card">
                    <div class="sgarbossa-prob-header">
                        <span class="material-symbols-rounded">analytics</span>
                        <span>Вероятность ИМ по баллам</span>
                    </div>
                    <div class="sgarbossa-probability-table">
                        ${this.data.probabilityTable.map(row => `
                            <div class="sgarbossa-prob-row" data-score="${row.score}">
                                <span class="sgarbossa-prob-score">${row.score} б.</span>
                                <span class="sgarbossa-prob-value">${row.probability}</span>
                            </div>
                        `).join('')}
                    </div>
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
        const probability = this.getProbability(total);
        const isPositive = total >= 3;
        
        // Определяем цвет: 0 = зелёный, 1-2 = жёлтый, 3+ = красный
        let colorType;
        if (total === 0) {
            colorType = 'success';
        } else if (isPositive) {
            colorType = 'error';
        } else {
            colorType = 'warning';
        }
        
        const inlineStyle = getResultInlineStyle(colorType);
        
        return `
            <div class="result-content result-${colorType}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralize(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">Вероятность ИМ: ${probability}</div>
                    <div class="result-description">
                        ${isPositive 
                            ? '≥3 баллов — высокая специфичность. Показана экстренная реперфузионная терапия.' 
                            : '<3 баллов — низкая чувствительность. ИМ не исключён! Оцените тропонин, ЭхоКГ.'}
                    </div>
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

    getProbability(score) {
        // Находим ближайшее значение из таблицы
        const exact = this.data.probabilityTable.find(r => r.score === score);
        if (exact) return exact.probability;
        
        // Промежуточные значения
        if (score >= 10) return '100%';
        if (score >= 8) return '92%';
        if (score >= 7) return '93%';
        if (score >= 5) return '88%';
        if (score >= 3) return '66%';
        if (score >= 2) return '50%';
        if (score >= 1) return '33%';
        return '16%';
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
        this.highlightProbabilityRow();
    }

    highlightProbabilityRow() {
        const total = this.calculateTotal();
        this.container.querySelectorAll('.sgarbossa-prob-row').forEach(row => {
            const rowScore = parseInt(row.dataset.score);
            row.classList.toggle('active', rowScore === total);
        });
    }

    resetAll() {
        this.container.querySelectorAll('.calc-item.checked').forEach(item => {
            item.classList.remove('checked');
        });
        this.checkedItems.clear();
        this.container.querySelectorAll('.sgarbossa-prob-row.active').forEach(row => {
            row.classList.remove('active');
        });
        this.updateResult();
        this.highlightProbabilityRow();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }
}