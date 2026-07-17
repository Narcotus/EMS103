import { FilterEngine } from '../filter-engine.js';

export default class CalculatorsPage {
    constructor(container) {
        this.container = container;
        this.engine = new FilterEngine();
        this.filterExpanded = false;
    }

    async render() {
        try {
            const res = await fetch('data/calculators.json');
            const data = await res.json();
            this.engine.setItems(data);
        } catch (e) {
            this.engine.setItems([]);
        }

        const categories = this.engine.getCategories();
        const filtered = this.engine.getFiltered();

        this.container.innerHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h1>Клинические калькуляторы</h1>
                    <p>Медицинские шкалы и расчёты · ${this.engine.items.length} инструментов</p>
                </div>

                <div style="margin-bottom: 12px;">
                    <input type="search" id="calc-search" placeholder="Поиск калькулятора..." autocomplete="off">
                </div>

                <div class="sort-controls" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <span class="material-symbols-rounded" style="font-size: 20px; color: var(--md-on-surface-variant);">sort</span>
                    <span style="font: 500 13px/1 var(--md-font-family); color: var(--md-on-surface-variant); margin-right: 4px;">Сортировка:</span>
                    <button class="chip ${this.engine.sortOrder === 'default' ? 'chip-selected' : ''}" data-sort="default">По умолчанию</button>
                    <button class="chip ${this.engine.sortOrder === 'alphabet-asc' ? 'chip-selected' : ''}" data-sort="alphabet-asc">
                        <span class="material-symbols-rounded" style="font-size: 16px;">arrow_upward</span> А-Я
                    </button>
                    <button class="chip ${this.engine.sortOrder === 'alphabet-desc' ? 'chip-selected' : ''}" data-sort="alphabet-desc">
                        <span class="material-symbols-rounded" style="font-size: 16px;">arrow_downward</span> Я-А
                    </button>
                </div>

                <div class="filter-wrapper">
                    <div id="category-filter" class="category-filter collapsed">
                        ${categories.map(cat => `
                            <button class="chip filter-chip ${this.engine.selectedCategories.has(cat) ? 'chip-selected' : ''}" data-category="${cat}">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>
                    <div class="filter-controls">
                        <button id="filter-toggle" class="filter-toggle">
                            <span class="material-symbols-rounded">expand_more</span>
                            <span class="filter-toggle-text">Развернуть фильтры</span>
                        </button>
                        ${this.engine.selectedCategories.size > 0 ? `
                            <button id="filter-clear" class="filter-toggle" style="color: var(--md-error);">
                                <span class="material-symbols-rounded">filter_list_off</span>
                                <span>Сбросить фильтры (${this.engine.selectedCategories.size})</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div id="results-count" class="results-count">
                    Показано: ${filtered.length} из ${this.engine.items.length}
                    ${this.engine.selectedCategories.size > 0 ? ` · <span class="active-filters">Активно: ${[...this.engine.selectedCategories].join(', ')}</span>` : ''}
                </div>

                <div id="calculators-list" class="calculators-list">
                    ${this.renderList(filtered)}
                </div>

                <div id="empty-state" style="display: ${filtered.length === 0 ? '' : 'none'};" class="empty-state">
                    <span class="material-symbols-rounded icon">search_off</span>
                    <div class="title">Ничего не найдено</div>
                    <p>Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
            </div>
        `;

        this._setupEventListeners();
    }

    renderList(items) {
        if (items.length === 0) return '';

        return items.map(calc => {
            const categories = calc._categories || [];
            const categoryChips = categories.map(cat => `
                <span class="category-badge">${cat}</span>
            `).join('');

            return `
                <div class="card card-outlined ripple calc-item" data-id="${calc.id}">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: var(--md-primary-container); color: var(--md-on-primary-container); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <span class="material-symbols-rounded">${calc.icon || 'calculate'}</span>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div class="card-title">${calc.title}</div>
                            <div class="card-subtitle" style="margin-bottom: 6px;">
                                <div class="category-badges">
                                    ${categoryChips}
                                    ${calc.priority === 'critical' ? '<span class="category-badge critical">критично</span>' : ''}
                                </div>
                            </div>
                            <div class="card-body">${calc.description}</div>
                        </div>
                        <span class="material-symbols-rounded" style="color: var(--md-on-surface-variant); opacity: 0.5; font-size: 24px; flex-shrink: 0; align-self: center;">chevron_right</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateUI() {
        const filtered = this.engine.getFiltered();
        const listEl = document.getElementById('calculators-list');
        const emptyEl = document.getElementById('empty-state');
        const countEl = document.getElementById('results-count');
        
        // Обновляем счётчик
        if (countEl) {
            const activeFilters = this.engine.selectedCategories.size > 0 
                ? ` · <span class="active-filters">Активно: ${[...this.engine.selectedCategories].join(', ')}</span>` 
                : '';
            countEl.innerHTML = `Показано: ${filtered.length} из ${this.engine.items.length}${activeFilters}`;
        }

        // Обновляем список
        if (filtered.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = '';
        } else {
            emptyEl.style.display = 'none';
            listEl.innerHTML = this.renderList(filtered);
            this._setupItemListeners();
        }

        // Обновляем кнопки фильтров
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.classList.toggle('chip-selected', this.engine.selectedCategories.has(btn.dataset.category));
        });

        // Показываем/скрываем кнопку "Сбросить"
        const clearBtn = document.getElementById('filter-clear');
        if (clearBtn) {
            clearBtn.parentElement.removeChild(clearBtn);
        }
        if (this.engine.selectedCategories.size > 0) {
            const controls = document.querySelector('.filter-controls');
            const newClearBtn = document.createElement('button');
            newClearBtn.id = 'filter-clear';
            newClearBtn.className = 'filter-toggle';
            newClearBtn.style.color = 'var(--md-error)';
            newClearBtn.innerHTML = `
                <span class="material-symbols-rounded">filter_list_off</span>
                <span>Сбросить фильтры (${this.engine.selectedCategories.size})</span>
            `;
            newClearBtn.addEventListener('click', () => {
                this.engine.clearCategories();
                this.updateUI();
            });
            controls.appendChild(newClearBtn);
        }
    }

    toggleFilter() {
        this.filterExpanded = !this.filterExpanded;
        const filterEl = document.getElementById('category-filter');
        const toggleEl = document.getElementById('filter-toggle');
        const iconEl = toggleEl.querySelector('.material-symbols-rounded');
        const textEl = toggleEl.querySelector('.filter-toggle-text');

        if (this.filterExpanded) {
            filterEl.classList.remove('collapsed');
            filterEl.classList.add('expanded');
            iconEl.textContent = 'expand_less';
            textEl.textContent = 'Свернуть фильтры';
        } else {
            filterEl.classList.remove('expanded');
            filterEl.classList.add('collapsed');
            iconEl.textContent = 'expand_more';
            textEl.textContent = 'Развернуть фильтры';
        }
    }

    _setupEventListeners() {
        const searchEl = document.getElementById('calc-search');
        let searchTimer = null;
        searchEl?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                this.engine.setSearch(searchEl.value);
                this.updateUI();
            }, 250);
        });

        // Мульти-выбор категорий
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.toggleCategory(btn.dataset.category);
                this.updateUI();
            });
        });

        document.getElementById('filter-toggle')?.addEventListener('click', () => {
            this.toggleFilter();
        });

        document.getElementById('filter-clear')?.addEventListener('click', () => {
            this.engine.clearCategories();
            this.updateUI();
        });

        document.querySelectorAll('[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.setSort(btn.dataset.sort);
                document.querySelectorAll('[data-sort]').forEach(b => {
                    b.classList.toggle('chip-selected', b === btn);
                });
                this.updateUI();
            });
        });

        this._setupItemListeners();
    }

    _setupItemListeners() {
        document.querySelectorAll('.calc-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const calc = this.engine.items.find(c => c.id == id);
                if (calc) {
                    const routeMap = {
                        1: 'geneva-score',
                        2: 'glasgow-coma',
                        14: 'pesi-score'
                    };
                    const route = routeMap[calc.id];
                    if (route) {
                        window.location.hash = route;
                    } else {
                        window.showSnackbar?.(`🧮 ${calc.title} (в разработке)`);
                    }
                }
            });
        });
    }
}