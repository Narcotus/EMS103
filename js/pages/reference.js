import { FilterEngine } from '../filter-engine.js';
import { storage } from '../storage.js';

export default class ReferencePage {
    constructor(container) {
        this.container = container;
        this.engine = new FilterEngine();
        this.filterExpanded = false;
        this._clickHandler = null;
        this._inputHandler = null;
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
        if (this._searchTimer) {
            clearTimeout(this._searchTimer);
            this._searchTimer = null;
        }
    }

    async render() {
        this.cleanup();
        
        // ✅ Защищённое сохранение страницы в историю
        try {
            storage.addRecent({
                id: 'reference',
                title: 'Шпаргалки и справка',
                subtitle: 'Справочная информация',
                icon: 'menu_book',
                section: 'reference',
                source: 'references'  // ✅ Для бирюзовой иконки на HomePage/RecentPage
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        try {
            const res = await fetch('data/references.json');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            this.engine.setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('❌ Ошибка загрузки справочника:', e);
            this.engine.setItems([]);
            window.showSnackbar?.('Не удалось загрузить справочник');
        }

        this.renderFullPage();
        this.setupEventListeners();
    }

    renderFullPage() {
        const categories = this.engine.getCategories();
        const filtered = this.engine.getFiltered();
        const hasActiveFilters = this.engine.selectedCategories.size > 0;

        this.container.innerHTML = `
            <div class="page-content reference-page">
                <div class="page-header">
                    <h1>Шпаргалки и справка</h1>
                    <p>Справочная информация · ${this.engine.items.length} записей</p>
                </div>

                <div class="reference-search-wrapper">
                    <span class="material-symbols-rounded reference-search-icon">search</span>
                    <input type="search" id="reference-search" 
                           placeholder="Поиск в справочнике..." 
                           autocomplete="off">
                </div>

                <div class="reference-sort-controls">
                    <span class="material-symbols-rounded">sort</span>
                    <span class="reference-sort-label">Сортировка:</span>
                    <button class="chip ${this.engine.sortOrder === 'default' ? 'chip-selected' : ''}" data-sort="default">
                        По умолчанию
                    </button>
                    <button class="chip ${this.engine.sortOrder === 'alphabet-asc' ? 'chip-selected' : ''}" data-sort="alphabet-asc">
                        <span class="material-symbols-rounded">arrow_upward</span> А-Я
                    </button>
                    <button class="chip ${this.engine.sortOrder === 'alphabet-desc' ? 'chip-selected' : ''}" data-sort="alphabet-desc">
                        <span class="material-symbols-rounded">arrow_downward</span> Я-А
                    </button>
                </div>

                <div class="filter-wrapper">
                    <div id="category-filter" class="category-filter collapsed">
                        ${categories.map(cat => `
                            <button class="chip filter-chip ${this.engine.selectedCategories.has(cat) ? 'chip-selected' : ''}" 
                                    data-category="${cat}">
                                ${cat}
                            </button>
                        `).join('')}
                    </div>
                    <div class="filter-controls">
                        <button id="filter-toggle" class="filter-toggle">
                            <span class="material-symbols-rounded">expand_more</span>
                            <span class="filter-toggle-text">Развернуть фильтры</span>
                        </button>
                        ${hasActiveFilters ? `
                            <button id="filter-clear" class="filter-toggle filter-clear-btn">
                                <span class="material-symbols-rounded">filter_list_off</span>
                                <span>Сбросить (${this.engine.selectedCategories.size})</span>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <div id="results-count" class="results-count">
                    ${this.renderResultsCount(filtered)}
                </div>

                <div id="reference-list" class="reference-list">
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

    renderResultsCount(filtered) {
        const activeFilters = this.engine.selectedCategories.size > 0 
            ? ` · <span class="active-filters">Активно: ${[...this.engine.selectedCategories].join(', ')}</span>` 
            : '';
        return `Показано: ${filtered.length} из ${this.engine.items.length}${activeFilters}`;
    }

    renderList(items) {
        if (items.length === 0) return '';

        return items.map(item => {
            const categories = item._categories || [];
            const categoryChips = categories.map(cat => 
                `<span class="category-badge">${cat}</span>`
            ).join('');

            return `
                <div class="card card-outlined ripple reference-item" data-id="${item.id}">
                    <div class="reference-item-content">
                        <div class="reference-item-icon">
                            <span class="material-symbols-rounded">${item.icon || 'menu_book'}</span>
                        </div>
                        <div class="reference-item-body">
                            <div class="card-title">${item.title}</div>
                            <div class="card-subtitle">
                                <div class="category-badges">
                                    ${categoryChips}
                                    ${item.priority === 'critical' 
                                        ? '<span class="category-badge critical">критично</span>' 
                                        : ''}
                                </div>
                            </div>
                            ${item.description ? `<div class="card-body">${item.description}</div>` : ''}
                        </div>
                        <span class="material-symbols-rounded reference-item-arrow">chevron_right</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateUI() {
        const filtered = this.engine.getFiltered();
        const listEl = this.container.querySelector('#reference-list');
        const emptyEl = this.container.querySelector('#empty-state');
        const countEl = this.container.querySelector('#results-count');
        
        if (countEl) {
            countEl.innerHTML = this.renderResultsCount(filtered);
        }

        if (filtered.length === 0) {
            if (listEl) listEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = '';
        } else {
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.innerHTML = this.renderList(filtered);
        }

        this.container.querySelectorAll('.filter-chip').forEach(btn => {
            btn.classList.toggle('chip-selected', this.engine.selectedCategories.has(btn.dataset.category));
        });

        this.updateClearButton();
    }

    updateClearButton() {
        const controls = this.container.querySelector('.filter-controls');
        if (!controls) return;

        const existingClear = controls.querySelector('#filter-clear');
        const hasActiveFilters = this.engine.selectedCategories.size > 0;
        
        if (hasActiveFilters && !existingClear) {
            const btn = document.createElement('button');
            btn.id = 'filter-clear';
            btn.className = 'filter-toggle filter-clear-btn';
            btn.innerHTML = `
                <span class="material-symbols-rounded">filter_list_off</span>
                <span>Сбросить (${this.engine.selectedCategories.size})</span>
            `;
            controls.appendChild(btn);
        } else if (!hasActiveFilters && existingClear) {
            existingClear.remove();
        } else if (existingClear) {
            // ✅ Безопасное обновление счётчика
            const countSpan = existingClear.querySelector('span:last-child');
            if (countSpan) {
                countSpan.textContent = `Сбросить (${this.engine.selectedCategories.size})`;
            }
        }
    }

    toggleFilter() {
        this.filterExpanded = !this.filterExpanded;
        const filterEl = this.container.querySelector('#category-filter');
        const toggleEl = this.container.querySelector('#filter-toggle');
        
        if (!filterEl || !toggleEl) return;

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

    setupEventListeners() {
        this._inputHandler = (e) => {
            if (!e.target.matches('#reference-search')) return;
            
            clearTimeout(this._searchTimer);
            this._searchTimer = setTimeout(() => {
                this.engine.setSearch(e.target.value);
                this.updateUI();
            }, 250);
        };
        this.container.addEventListener('input', this._inputHandler, true);

        this._clickHandler = (e) => {
            // ✅ БОНУС: Клик по бейджу категории внутри карточки (фильтр)
            // Исключаем critical-badge — он не должен фильтровать
            const categoryBadge = e.target.closest('.category-badge:not(.critical)');
            if (categoryBadge && e.target.closest('.reference-item')) {
                e.preventDefault();
                e.stopPropagation();
                const category = categoryBadge.textContent.trim();
                if (category) {
                    this.engine.toggleCategory(category);
                    this.updateUI();
                    window.showSnackbar?.(`Фильтр: ${category}`);
                }
                return;
            }

            // Фильтр по категориям (chip сверху)
            const filterChip = e.target.closest('.filter-chip');
            if (filterChip && this.container.contains(filterChip)) {
                e.preventDefault();
                this.engine.toggleCategory(filterChip.dataset.category);
                this.updateUI();
                return;
            }

            // Кнопка toggle фильтра
            if (e.target.closest('#filter-toggle')) {
                e.preventDefault();
                this.toggleFilter();
                return;
            }

            // Кнопка очистки фильтров
            if (e.target.closest('#filter-clear')) {
                e.preventDefault();
                this.engine.clearCategories();
                this.updateUI();
                return;
            }

            // Сортировка
            const sortBtn = e.target.closest('[data-sort]');
            if (sortBtn && this.container.contains(sortBtn)) {
                e.preventDefault();
                this.engine.setSort(sortBtn.dataset.sort);
                this.container.querySelectorAll('[data-sort]').forEach(b => {
                    b.classList.toggle('chip-selected', b === sortBtn);
                });
                this.updateUI();
                return;
            }

            // Клик по карточке справочника
            const referenceItem = e.target.closest('.reference-item');
            if (referenceItem && this.container.contains(referenceItem)) {
                e.preventDefault();
                this.handleReferenceClick(referenceItem);
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
    }

    handleReferenceClick(item) {
        const id = item.dataset.id;
        if (!id) return;
        
        const ref = this.engine.items.find(r => String(r.id) === String(id));
        
        // ✅ Защита от null
        if (!ref) {
            console.warn(`⚠️ Запись справочника с id="${id}" не найдена`);
            window.showSnackbar?.('Запись не найдена');
            return;
        }
        
        // ✅ Защищённое сохранение с source
        try {
            storage.addRecent({
                id: `ref-${ref.id}`,
                title: ref.title,
                subtitle: (ref._categories || []).slice(0, 2).join(', '),
                icon: ref.icon || 'menu_book',
                section: 'reference',
                source: 'references'  // ✅ Для бирюзовой иконки на HomePage/RecentPage
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }
        
        // Если есть route — переходим, иначе показываем "в разработке"
        if (ref.route) {
            window.location.hash = ref.route;
        } else {
            window.showSnackbar?.(`${ref.title} (в разработке)`);
        }
    }
}