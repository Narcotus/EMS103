import { storage } from './storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS  // ✅ Добавлен импорт
} from './calculator-utils.js';

/**
 * Базовый класс для калькуляторов с чекбоксами
 * 
 * Наследники должны определить:
 *   - this.data.items (массив с id, title, points, group?)
 *   - this.data.resultRanges (диапазоны результатов)
 *   - hasExtraContent(total, range) — опциональный доп. контент
 */
export class ChecklistCalculator {
    constructor(container, calcData) {
        this.container = container;
        this.data = calcData;  // ← все данные в this.data
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
        await loadCalculatorCSS(this.data.id);
        
        // ✅ Защищённое сохранение в историю (один раз)
        try {
            storage.addRecent({
                id: `calc-${this.data.id}`,
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: this.data.id
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        // ✅ Единый рендер страницы (без конфликта с renderFullPage)
        this.container.innerHTML = `
            <div class="page-content calc-page ${this.data.id}-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="calc-items">
                    ${this.renderItems()}
                </div>

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        bindInfoButton(this.data, this.container);
    }

    /**
     * Рендеринг карточек с группировкой (например, ЧСС)
     */
    renderItems() {
        const result = [];
        const processedGroups = new Set();
        
        // ✅ this.data вместо this.config
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
                                <span class="calc-items-group-hint">выберите один</span>
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
                    <span class="material-symbols-rounded check-icon">check</span>
                </div>
                <div class="calc-item-content">
                    <div class="calc-item-title">${item.title}</div>
                    ${item.hint ? `<div class="calc-item-hint">${item.hint}</div>` : ''}
                </div>
                <div class="calc-item-points">+${item.points}</div>
            </div>
        `;
    }

    renderResult() {
        const total = this.calculateTotal();
        const range = this.getRange(total);
        const extraContent = typeof this.hasExtraContent === 'function' 
            ? this.hasExtraContent(total, range) 
            : '';
        
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
                    <div class="result-description">${range.description}</div>
                    ${range.action ? `<div class="result-action">${range.action}</div>` : ''}
                    ${extraContent}
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
        // ✅ Fallback на ПОСЛЕДНИЙ диапазон (самый тяжёлый)
        const found = this.data.resultRanges.find(r => score >= r.min && score <= r.max);
        return found || this.data.resultRanges[this.data.resultRanges.length - 1];
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