import { storage } from '../storage.js';

export default class CalculatorDetailPage {
    constructor(container, params = {}) {
        this.container = container;
        this.calculatorId = params.calculatorId || 'geneva-score';
        this.data = null;
        this.checkedItems = new Set();
    }

    async render() {
        // Загружаем данные калькулятора
        try {
            const res = await fetch(`data/${this.calculatorId}.json`);
            if (!res.ok) throw new Error('Калькулятор не найден');
            this.data = await res.json();
        } catch (e) {
            this.container.innerHTML = `
                <div class="page-content">
                    <div class="empty-state">
                        <span class="material-symbols-rounded icon">error</span>
                        <div class="title">Калькулятор не найден</div>
                        <p>Данные для этого калькулятора ещё не загружены</p>
                        <button class="md-button md-button-filled" onclick="history.back()" style="margin-top: 16px;">
                            <span class="material-symbols-rounded">arrow_back</span>
                            Назад
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Добавляем в недавние
        storage.addRecent({
            id: `calc-${this.data.calculatorId}`,
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'calculators'
        });

        this.renderCalculator();
    }

    renderCalculator() {
        this.container.innerHTML = `
            <div class="page-content calc-page">
                <button class="back-button" onclick="history.back()">
                    <span class="material-symbols-rounded">arrow_back</span>
                    <span>Назад к калькуляторам</span>
                </button>

                <div class="calc-header">
                    <div class="calc-header-icon">
                        <span class="material-symbols-rounded">${this.data.icon}</span>
                    </div>
                    <div class="calc-header-content">
                        <h1>${this.data.title}</h1>
                        ${this.data.subtitle ? `<p class="calc-subtitle">${this.data.subtitle}</p>` : ''}
                    </div>
                </div>

                ${this.data.description ? `
                    <div class="calc-description card card-outlined">
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                            <p style="margin: 0; font: 400 14px/20px var(--md-font-family); color: var(--md-on-surface-variant);">
                                ${this.data.description}
                            </p>
                        </div>
                    </div>
                ` : ''}

                <div class="calc-items">
                    ${this.renderItems()}
                </div>

                <!-- Плашка результата (sticky bottom) -->
                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderItems() {
        return this.data.items.map(item => {
            const groupAttr = item.group ? `data-group="${item.group}"` : '';
            return `
                <label class="calc-item ripple" data-id="${item.id}" ${groupAttr} data-points="${item.points}">
                    <div class="calc-item-checkbox">
                        <span class="material-symbols-rounded check-icon">check</span>
                    </div>
                    <div class="calc-item-content">
                        <div class="calc-item-title">${item.title}</div>
                    </div>
                    <div class="calc-item-points">
                        +${item.points}
                    </div>
                </label>
            `;
        }).join('');
    }

    renderResult() {
        const total = this.calculateTotal();
        const range = this.getRange(total);
        
        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralizePoints(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
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

    pluralizePoints(n) {
        const lastTwo = n % 100;
        const lastOne = n % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'баллов';
        if (lastOne === 1) return 'балл';
        if (lastOne >= 2 && lastOne <= 4) return 'балла';
        return 'баллов';
    }

    setupEventListeners() {
        // Клики по элементам калькулятора
        document.querySelectorAll('.calc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleItem(item);
            });
        });

        // Кнопка сброса
        document.querySelector('.result-reset')?.addEventListener('click', () => {
            this.resetAll();
        });
    }

    toggleItem(item) {
        const id = item.dataset.id;
        const group = item.dataset.group;
        
        // Если есть группа — снимаем выбор с других элементов этой группы
        if (group) {
            document.querySelectorAll(`.calc-item[data-group="${group}"]`).forEach(other => {
                if (other !== item && other.classList.contains('checked')) {
                    other.classList.remove('checked');
                    this.checkedItems.delete(other.dataset.id);
                }
            });
        }

        // Переключаем текущий
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
        this.updateResult();
        window.showSnackbar?.('🔄 Результат сброшен');
    }

    updateResult() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
            // Восстанавливаем обработчик сброса
            panel.querySelector('.result-reset')?.addEventListener('click', () => {
                this.resetAll();
            });
        }
    }
}