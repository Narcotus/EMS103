import { FilterEngine } from '../filter-engine.js';
import { storage } from '../storage.js';

export default class CalculatorsPage {
    constructor(container) {
        this.container = container;
        this.engine = new FilterEngine();
        this.engine.setFilterMode('and');
        // Сортировка А-Я по умолчанию
        this.engine.setSort('alphabet-asc');
        
        this._clickHandler = null;
        this._inputHandler = null;
        this._escHandler = null;
        this._searchTimer = null;
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
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
            this._searchTimer = null;
        }
        // Восстанавливаем прокрутку
        document.body.style.overflow = '';
    }

    async render() {
        this.cleanup();
        
        // ✅ Сохраняем страницу в "Недавние" с source
        try {
            storage.addRecent({
                id: 'calculators',
                title: 'Клинические калькуляторы',
                subtitle: 'Медицинские шкалы и расчёты',
                icon: 'calculate',
                section: 'calculators',
                source: 'calculators'  // ✅ Для фиолетовой иконки на HomePage
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }
        
        try {
            const res = await fetch('data/calculators.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.engine.setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('❌ Ошибка загрузки калькуляторов:', e);
            this.engine.setItems([]);
            window.showSnackbar?.('Не удалось загрузить калькуляторы');
        }

        this.renderFullPage();
        this.setupEventListeners();
    }

    renderFullPage() {
        const filtered = this.engine.getFiltered();
        const hasActiveFilters = this.engine.selectedCategories.size > 0;

        this.container.innerHTML = `
            <div class="page-content calculators-page">
                <div class="page-header">
                    <h1>Клинические калькуляторы</h1>
                    <p class="calc-subtitle-info">
                        Медицинские шкалы и расчёты · ${this.engine.items.length} инструментов, 
                        показано <span id="filtered-count">${filtered.length}</span>
                    </p>
                </div>

                <!-- Поиск + кнопка фильтра + кнопка сброса -->
                <div class="search-filter-bar">
                    <div class="search-wrapper">
                        <span class="material-symbols-rounded search-icon">search</span>
                        <input type="search" id="calc-search" placeholder="Поиск калькулятора..." 
                               autocomplete="off" value="${this.engine.searchQuery}">
                    </div>
                    <button class="filter-toggle-btn ${hasActiveFilters ? 'has-active' : ''}" id="filter-toggle-btn" aria-label="Фильтры">
                        <span class="material-symbols-rounded">tune</span>
                        ${this.engine.selectedCategories.size > 0 ? `<span class="filter-badge">${this.engine.selectedCategories.size}</span>` : ''}
                    </button>
                    ${hasActiveFilters ? `
                        <button class="filter-reset-btn" id="filter-reset-btn" aria-label="Сбросить фильтры">
                            <span class="material-symbols-rounded">filter_list_off</span>
                        </button>
                    ` : ''}
                </div>

                <!-- Список -->
                <div id="calculators-list" class="calculators-list-compact">
                    ${this.renderList(filtered)}
                </div>

                <div id="empty-state" style="display: ${filtered.length === 0 ? '' : 'none'};" class="empty-state">
                    <span class="material-symbols-rounded icon">search_off</span>
                    <div class="title">Ничего не найдено</div>
                    <p>Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
            </div>
        `;
    }

    renderList(items) {
        if (items.length === 0) return '';

        return items.map(calc => `
            <div class="calc-compact-card ripple" data-id="${calc.id}" data-route="${calc.route || calc.id}">
                <div class="calc-compact-icon">
                    <span class="material-symbols-rounded">${calc.icon || 'calculate'}</span>
                </div>
                <div class="calc-compact-title">${calc.title}</div>
                <span class="material-symbols-rounded calc-compact-arrow">chevron_right</span>
            </div>
        `).join('');
    }

    renderFilterSheet() {
        const categories = this.engine.getCategories();
        
        return `
            <div class="filter-sheet-backdrop" id="filter-backdrop"></div>
            <div class="filter-sheet" id="filter-sheet" role="dialog" aria-modal="true" aria-label="Фильтры и сортировка">
                <div class="filter-sheet-header">
                    <div class="filter-sheet-handle"></div>
                    <div class="filter-sheet-title">
                        <span class="material-symbols-rounded">tune</span>
                        Фильтры и сортировка
                    </div>
                    <button class="filter-sheet-close" id="filter-close" aria-label="Закрыть">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div class="filter-sheet-body">
                    <!-- Категории -->
                    <div class="filter-section">
                        <div class="filter-section-title">
                            Категории
                            <span class="filter-mode-hint">
                                <span class="material-symbols-rounded">info</span>
                                показываются калькуляторы со всеми выбранными
                            </span>
                        </div>
                        <div class="filter-chips-grid">
                            ${categories.map(cat => `
                                <button class="filter-chip ${this.engine.selectedCategories.has(cat) ? 'selected' : ''}" 
                                        data-category="${cat}"
                                        aria-pressed="${this.engine.selectedCategories.has(cat)}">
                                    <span class="material-symbols-rounded check-icon">check</span>
                                    <span>${cat}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="filter-sheet-footer">
                    <button class="md-button md-button-text" id="filter-reset">
                        <span class="material-symbols-rounded">refresh</span>
                        Сбросить
                    </button>
                    <button class="md-button md-button-filled" id="filter-apply">
                        <span class="material-symbols-rounded">check</span>
                        Показать ${this.engine.getFiltered().length}
                    </button>
                </div>
            </div>
        `;
    }

    openFilterSheet() {
        const existing = document.querySelector('.filter-sheet-wrapper');
        if (existing) existing.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'filter-sheet-wrapper';
        wrapper.innerHTML = this.renderFilterSheet();
        document.body.appendChild(wrapper);

        requestAnimationFrame(() => {
            wrapper.classList.add('open');
        });

        document.body.style.overflow = 'hidden';
        this.setupFilterSheetListeners(wrapper);
    }

    closeFilterSheet() {
        const wrapper = document.querySelector('.filter-sheet-wrapper');
        if (!wrapper) return;

        wrapper.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => wrapper.remove(), 250);
        
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    }

    setupFilterSheetListeners(wrapper) {
        wrapper.querySelector('#filter-backdrop')?.addEventListener('click', () => this.closeFilterSheet());
        wrapper.querySelector('#filter-close')?.addEventListener('click', () => this.closeFilterSheet());
        
        // ESC-обработчик
        this._escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFilterSheet();
            }
        };
        document.addEventListener('keydown', this._escHandler);

        const applyBtn = wrapper.querySelector('#filter-apply');

        // Категории
        wrapper.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.engine.toggleCategory(chip.dataset.category);
                const isSelected = chip.classList.toggle('selected');
                chip.setAttribute('aria-pressed', isSelected);
                
                if (applyBtn) {
                    applyBtn.innerHTML = `
                        <span class="material-symbols-rounded">check</span>
                        Показать ${this.engine.getFiltered().length}
                    `;
                }
            });
        });

        // Сброс в шторке
        wrapper.querySelector('#filter-reset')?.addEventListener('click', () => {
            this.engine.clearCategories();
            wrapper.querySelectorAll('.filter-chip.selected').forEach(c => {
                c.classList.remove('selected');
                c.setAttribute('aria-pressed', 'false');
            });
            if (applyBtn) {
                applyBtn.innerHTML = `
                    <span class="material-symbols-rounded">check</span>
                    Показать ${this.engine.getFiltered().length}
                `;
            }
        });

        // Применить
        applyBtn?.addEventListener('click', () => {
            this.closeFilterSheet();
            this.updateUI();
        });
    }

    updateUI() {
        const filtered = this.engine.getFiltered();
        const listEl = this.container.querySelector('#calculators-list');
        const emptyEl = this.container.querySelector('#empty-state');
        const countEl = this.container.querySelector('#filtered-count');
        const filterBtn = this.container.querySelector('#filter-toggle-btn');
        const searchBar = this.container.querySelector('.search-filter-bar');

        if (listEl) listEl.innerHTML = this.renderList(filtered);
        if (emptyEl) emptyEl.style.display = filtered.length === 0 ? '' : 'none';
        if (countEl) countEl.textContent = filtered.length;

        if (filterBtn && searchBar) {
            const hasActive = this.engine.selectedCategories.size > 0;
            filterBtn.classList.toggle('has-active', hasActive);
            
            // Обновляем бейдж
            const existingBadge = filterBtn.querySelector('.filter-badge');
            if (existingBadge) existingBadge.remove();
            if (hasActive) {
                const badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.textContent = this.engine.selectedCategories.size;
                filterBtn.appendChild(badge);
            }

            // Показываем/скрываем кнопку сброса
            const existingResetBtn = this.container.querySelector('#filter-reset-btn');
            if (hasActive && !existingResetBtn) {
                const resetBtn = document.createElement('button');
                resetBtn.className = 'filter-reset-btn';
                resetBtn.id = 'filter-reset-btn';
                resetBtn.setAttribute('aria-label', 'Сбросить фильтры');
                resetBtn.innerHTML = '<span class="material-symbols-rounded">filter_list_off</span>';
                resetBtn.addEventListener('click', () => {
                    this.engine.clearCategories();
                    this.updateUI();
                });
                searchBar.appendChild(resetBtn);
            } else if (!hasActive && existingResetBtn) {
                existingResetBtn.remove();
            }
        }
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }

        // Обработчик ввода (поиск)
        this._inputHandler = (e) => {
            if (!e.target.matches('#calc-search')) return;
            clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                this.engine.setSearch(e.target.value);
                this.updateUI();
            }, 250);
        };
        this.container.addEventListener('input', this._inputHandler, true);

        // Универсальный обработчик кликов
        this._clickHandler = (e) => {
            // Кнопка фильтра
            if (e.target.closest('#filter-toggle-btn')) {
                e.preventDefault();
                this.openFilterSheet();
                return;
            }
            
            // Кнопка сброса фильтров
            if (e.target.closest('#filter-reset-btn')) {
                e.preventDefault();
                this.engine.clearCategories();
                this.updateUI();
                return;
            }
            
            // Карточка калькулятора
            const card = e.target.closest('.calc-compact-card');
            if (!card || !this.container.contains(card)) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            this.handleCalculatorClick(card);
        };
        
        this.container.addEventListener('click', this._clickHandler, true);
    }

    /**
     * ✅ Обработка клика по карточке калькулятора
     * Сохраняет в "Недавние" и переходит на страницу калькулятора
     */
    handleCalculatorClick(card) {
        const id = card.dataset.id;
        const route = card.dataset.route;
        
        if (!id) return;
        
        const calc = this.engine.items.find(c => String(c.id) === String(id));
        
        // ✅ Защита от null
        if (!calc) {
            console.warn(`⚠️ Калькулятор с id="${id}" не найден`);
            window.showSnackbar?.('Калькулятор не найден');
            return;
        }
        
        // ✅ Сохраняем конкретный калькулятор в историю
        try {
            storage.addRecent({
                id: `calc-${calc.id}`,
                title: calc.title,
                subtitle: calc.subtitle || 'Калькулятор',
                icon: calc.icon || 'calculate',
                section: route || calc.id,
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }
        
        // Переход на страницу калькулятора
        if (route) {
            window.location.hash = route;
        } else {
            window.showSnackbar?.(`${calc.title} — в разработке`);
        }
    }
}