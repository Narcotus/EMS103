import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class CalculatorDetailPage {
    constructor(container, params = {}) {
        this.container = container;
        this.calculatorId = params.calculatorId || 'geneva-score';
        this.data = null;
        this.checkedItems = new Set();
        this._clickHandler = null;
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
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS(this.calculatorId);
        
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
                        <button class="md-button md-button-filled" data-action="go-back" style="margin-top: 16px;">
                            <span class="material-symbols-rounded">arrow_back</span>
                            Назад
                        </button>
                    </div>
                </div>
            `;
            this.setupEventListeners();
            return;
        }

        // Добавляем в недавние
        try {
            storage.addRecent({
                id: `calc-${this.data.calculatorId || this.calculatorId}`,
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: this.calculatorId
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.renderCalculator();
    }

    renderCalculator() {
        // ✅ Используем renderCalcHeader вместо ручного рендера
        // (breadcrumb + шапка + кнопка ℹ)
        
        this.container.innerHTML = `
            <div class="page-content calc-page ${this.calculatorId}-page">
                ${renderCalcHeader(this.data)}

                ${this.data.description ? `
                    <div class="calc-description card card-outlined">
                        <div style="display: flex; gap: 10px; align-items: flex-start;">
                            <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                            <p style="margin: 0;">${this.data.description}</p>
                        </div>
                    </div>
                ` : ''}

                <div class="calc-items">
                    ${this.renderItems()}
                </div>

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        
        // ✅ Привязываем кнопку ℹ (модалка с formulas, quickRules, examples)
        if (this.data.reference) {
            bindInfoButton(this.data, this.container);
        }
    }

    renderItems() {
        const result = [];
        const processedGroups = new Set();
        
        this.data.items.forEach(item => {
            if (item.group) {
                if (!processedGroups.has(item.group)) {
                    processedGroups.add(item.group);
                    const groupItems = this.data.items.filter(i => i.group === item.group);
                    
                    result.push(`
                        <div class="calc-items-group">
                            <div class="calc-items-group-header">
                                <span class="material-symbols-rounded">tune</span>
                                <span class="calc-items-group-title">${item.groupTitle || 'Выберите один вариант'}</span>
                                <span class="calc-items-group-hint">выберите один вариант</span>
                            </div>
                            <div class="calc-items-group-content">
                                ${groupItems.map(gi => this.renderItem(gi, true)).join('')}
                            </div>
                        </div>
                    `);
                }
            } else {
                result.push(this.renderItem(item, false));
            }
        });
        
        return result.join('');
    }

    renderItem(item, isRadio) {
        return `
            <div class="calc-item ripple ${isRadio ? 'calc-item-radio' : ''}" 
                 data-id="${item.id}" 
                 data-points="${item.points}"
                 ${item.group ? `data-group="${item.group}"` : ''}>
                <div class="calc-item-checkbox">
                    <span class="material-symbols-rounded">check</span>
                </div>
                <div class="calc-item-content">
                    <div class="calc-item-title">${item.title}</div>
                </div>
                <div class="calc-item-points">+${item.points}</div>
            </div>
        `;
    }

    renderResult() {
        const total = this.calculateTotal();
        const range = this.getRange(total);
        
        // ✅ Используем утилиту вместо хардкода
        const inlineStyle = getResultInlineStyle(range.color);
        
        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralizePoints(total)}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    ${range.action ? `
                        <div class="result-action">
                            <span class="material-symbols-rounded">medical_services</span>
                            ${range.action}
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
        this.checkedItems.forEach(id => {
            const item = this.data.items.find(i => i.id === id);
            if (item) total += item.points;
        });
        return total;
    }

    getRange(score) {
        // ✅ Правильный fallback: последний диапазон (самый тяжёлый)
        const found = this.data.resultRanges.find(r => score >= r.min && score <= r.max);
        return found || this.data.resultRanges[this.data.resultRanges.length - 1];
    }

    pluralizePoints(n) {
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
            // ✅ Кнопка "Назад" (без inline onclick)
            const backBtn = e.target.closest('[data-action="go-back"], .breadcrumb-back-link');
            if (backBtn && this.container.contains(backBtn)) {
                e.preventDefault();
                e.stopPropagation();
                history.back();
                return;
            }
            
            // Кнопка сброса
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }
            
            // Карточка критерия
            const item = e.target.closest('.calc-item');
            if (!item || !this.container.contains(item)) return;
            
            e.preventDefault();
            e.stopPropagation();
            this.toggleItem(item);
        };
        
        this.container.addEventListener('click', this._clickHandler, true);
    }

    toggleItem(item) {
        const id = item.dataset.id;
        const group = item.dataset.group;
        const isChecked = item.classList.contains('checked');

        if (group) {
            // Радио-группа (взаимоисключающий выбор)
            if (isChecked) {
                item.classList.remove('checked');
                this.checkedItems.delete(id);
            } else {
                // Снимаем выбор со всех элементов группы
                this.container.querySelectorAll(`.calc-item[data-group="${group}"]`).forEach(other => {
                    other.classList.remove('checked');
                    this.checkedItems.delete(other.dataset.id);
                });
                item.classList.add('checked');
                this.checkedItems.add(id);
            }
        } else {
            // Обычный чекбокс
            if (isChecked) {
                item.classList.remove('checked');
                this.checkedItems.delete(id);
            } else {
                item.classList.add('checked');
                this.checkedItems.add(id);
            }
        }

        this.updateResult();
    }

    resetAll() {
        this.container.querySelectorAll('.calc-item.checked').forEach(item => {
            item.classList.remove('checked');
        });
        this.checkedItems.clear();
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