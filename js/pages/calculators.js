import { FilterEngine } from '../filter-engine.js';

export default class CalculatorsPage {
    constructor(container) {
        this.container = container;
        this.engine = new FilterEngine();
        this.engine.setFilterMode('and');
    }

    async render() {
        try {
            const res = await fetch('data/calculators.json');
            const data = await res.json();
            this.engine.setItems(data);
        } catch (e) {
            this.engine.setItems([]);
        }

        this.renderFullPage();
        this.setupEventListeners();
    }

    renderFullPage() {
        const filtered = this.engine.getFiltered();
        const hasActiveFilters = this.engine.selectedCategories.size > 0 || this.engine.sortOrder !== 'default';

        this.container.innerHTML = `
            <div class="page-content">
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
            <div class="calc-compact-card ripple" data-id="${calc.id}">
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
        const sortOrder = this.engine.sortOrder;
        
        return `
            <div class="filter-sheet-backdrop" id="filter-backdrop"></div>
            <div class="filter-sheet" id="filter-sheet">
                <div class="filter-sheet-header">
                    <div class="filter-sheet-handle"></div>
                    <div class="filter-sheet-title">
                        <span class="material-symbols-rounded">tune</span>
                        Фильтры и сортировка
                    </div>
                    <button class="filter-sheet-close" id="filter-close">
                        <span class="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div class="filter-sheet-body">
                    <!-- Сортировка -->
                    <div class="filter-section">
                        <div class="filter-section-title">Сортировка</div>
                        <button class="sort-toggle-btn ${sortOrder !== 'default' ? 'active' : ''}" id="sort-toggle">
                            <span class="material-symbols-rounded">${this.engine.getSortIcon()}</span>
                            <span class="sort-label">${this.engine.getSortLabel()}</span>
                            <span class="sort-hint">(нажмите для переключения)</span>
                        </button>
                    </div>

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
                                <button class="filter-chip ${this.engine.selectedCategories.has(cat) ? 'selected' : ''}" data-category="${cat}">
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
    }

    setupFilterSheetListeners(wrapper) {
        wrapper.querySelector('#filter-backdrop')?.addEventListener('click', () => this.closeFilterSheet());
        wrapper.querySelector('#filter-close')?.addEventListener('click', () => this.closeFilterSheet());
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeFilterSheet();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Сортировка
        wrapper.querySelector('#sort-toggle')?.addEventListener('click', () => {
            this.engine.cycleSortOrder();
            const btn = wrapper.querySelector('#sort-toggle');
            const icon = btn.querySelector('.material-symbols-rounded');
            const label = btn.querySelector('.sort-label');
            icon.textContent = this.engine.getSortIcon();
            label.textContent = this.engine.getSortLabel();
            btn.classList.toggle('active', this.engine.sortOrder !== 'default');
            const applyBtn = wrapper.querySelector('#filter-apply');
            if (applyBtn) {
                applyBtn.innerHTML = `
                    <span class="material-symbols-rounded">check</span>
                    Показать ${this.engine.getFiltered().length}
                `;
            }
        });

        // Категории
        wrapper.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.engine.toggleCategory(chip.dataset.category);
                chip.classList.toggle('selected');
                const applyBtn = wrapper.querySelector('#filter-apply');
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
            this.engine.setSort('default');
            wrapper.querySelectorAll('.filter-chip.selected').forEach(c => c.classList.remove('selected'));
            const sortBtn = wrapper.querySelector('#sort-toggle');
            sortBtn.classList.remove('active');
            sortBtn.querySelector('.material-symbols-rounded').textContent = this.engine.getSortIcon();
            sortBtn.querySelector('.sort-label').textContent = this.engine.getSortLabel();
            const applyBtn = wrapper.querySelector('#filter-apply');
            if (applyBtn) {
                applyBtn.innerHTML = `
                    <span class="material-symbols-rounded">check</span>
                    Показать ${this.engine.getFiltered().length}
                `;
            }
        });

        // Применить
        wrapper.querySelector('#filter-apply')?.addEventListener('click', () => {
            this.closeFilterSheet();
            this.updateUI();
        });
    }

    updateUI() {
        const filtered = this.engine.getFiltered();
        const listEl = document.getElementById('calculators-list');
        const emptyEl = document.getElementById('empty-state');
        const countEl = document.getElementById('filtered-count');
        const filterBtn = document.getElementById('filter-toggle-btn');
        const searchBar = document.querySelector('.search-filter-bar');

        // Обновляем список
        if (listEl) {
            listEl.innerHTML = this.renderList(filtered);
            this._setupItemListeners();
        }

        // Обновляем empty-state
        if (emptyEl) {
            emptyEl.style.display = filtered.length === 0 ? '' : 'none';
        }

        // Обновляем счётчик в подзаголовке
        if (countEl) {
            countEl.textContent = filtered.length;
        }

        // Обновляем кнопку фильтра и кнопку сброса
        if (filterBtn && searchBar) {
            const hasActive = this.engine.selectedCategories.size > 0 || this.engine.sortOrder !== 'default';
            filterBtn.classList.toggle('has-active', hasActive);
            
            // Обновляем бейдж
            const existingBadge = filterBtn.querySelector('.filter-badge');
            if (existingBadge) existingBadge.remove();
            if (this.engine.selectedCategories.size > 0) {
                const badge = document.createElement('span');
                badge.className = 'filter-badge';
                badge.textContent = this.engine.selectedCategories.size;
                filterBtn.appendChild(badge);
            }

            // Показываем/скрываем кнопку сброса
            const existingResetBtn = document.getElementById('filter-reset-btn');
            if (hasActive && !existingResetBtn) {
                const resetBtn = document.createElement('button');
                resetBtn.className = 'filter-reset-btn';
                resetBtn.id = 'filter-reset-btn';
                resetBtn.setAttribute('aria-label', 'Сбросить фильтры');
                resetBtn.innerHTML = '<span class="material-symbols-rounded">filter_list_off</span>';
                resetBtn.addEventListener('click', () => {
                    this.engine.clearCategories();
                    this.engine.setSort('default');
                    this.updateUI();
                });
                searchBar.appendChild(resetBtn);
            } else if (!hasActive && existingResetBtn) {
                existingResetBtn.remove();
            }
        }
    }

    setupEventListeners() {
        // Поиск
        const searchEl = document.getElementById('calc-search');
        let searchTimer = null;
        searchEl?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                this.engine.setSearch(searchEl.value);
                this.updateUI();
            }, 250);
        });

        // Кнопка фильтра
        document.getElementById('filter-toggle-btn')?.addEventListener('click', () => {
            this.openFilterSheet();
        });

        // Кнопка сброса
        document.getElementById('filter-reset-btn')?.addEventListener('click', () => {
            this.engine.clearCategories();
            this.engine.setSort('default');
            this.updateUI();
        });

        this._setupItemListeners();
    }

    _setupItemListeners() {
        document.querySelectorAll('.calc-compact-card').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const calc = this.engine.items.find(c => c.id == id);
                if (calc) {
                    const routeMap = {
                        1: 'geneva-score',
                        2: 'glasgow-coma',
                        3: 'four-score',
                        4: 'sad-persons',
                        5: 'pediatric',
                        6: 'apgar',
                        7: 'ciwa-ar',
                        8: 'nihss',
                        9: 'killip',
                        10: 'vas',
                        11: 'fast-ed',
                        12: 'algover',
                        13: 'drug-converter',
                        14: 'pesi-score',
                        15: 'infusomat',
                        16: 'glasgow-coma-pediatric',
                        17: 'odn-scale',
                        18: 'shsn-scale',
                        19: 'sgarbossa',
                        20: 'ett-size',
                        21: 'qtc-bazett'
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