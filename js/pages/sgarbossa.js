import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class SgarbossaPage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        
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
                legalReference: null
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

    async render() {
        storage.addRecent({
            id: 'calc-sgarbossa',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'sgarbossa'
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

                <!-- Таблица вероятностей -->
                <div class="card card-outlined sgarbossa-probability-card">
                    <div class="card-title" style="padding: 12px 16px 8px; border-bottom: 1px solid var(--md-outline-variant);">
                        Вероятность ИМ по баллам
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
        bindInfoButton(this.data);
    }

    renderResult() {
        const total = this.calculateTotal();
        const probability = this.getProbability(total);
        const isPositive = total >= 3;
        
        return `
            <div class="result-content result-${isPositive ? 'error' : 'warning'}">
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
        
        // Для промежуточных значений (например, 5+2=7 уже есть, но 5+3=8 тоже есть)
        // Максимально возможный балл = 10, минимальный = 0
        if (score >= 10) return '100%';
        if (score >= 8) return '92%';
        if (score >= 7) return '93%';
        if (score >= 5) return '88%';
        if (score >= 3) return '66%';
        if (score >= 2) return '50%';
        return '16%';
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
        this.highlightProbabilityRow();
    }

    highlightProbabilityRow() {
        const total = this.calculateTotal();
        document.querySelectorAll('.sgarbossa-prob-row').forEach(row => {
            row.classList.toggle('active', parseInt(row.dataset.score) === total);
        });
    }

    resetAll() {
        document.querySelectorAll('.calc-item.checked').forEach(item => item.classList.remove('checked'));
        this.checkedItems.clear();
        document.querySelectorAll('.sgarbossa-prob-row.active').forEach(row => row.classList.remove('active'));
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