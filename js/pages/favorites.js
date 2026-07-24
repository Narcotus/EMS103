import { storage } from '../storage.js';

export default class FavoritesPage {
    constructor(container) {
        this.container = container;
        this._clickHandler = null;
        this._dataCache = null; // Кэш всех данных (калькуляторы, справочники, протоколы)
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
    }

    async render() {
        this.cleanup();
        
        // ✅ Избранное — системная страница, не добавляем в "Недавние"
        
        // Загружаем все источники данных (один раз)
        await this._loadDataCache();
        
        const favoriteIds = storage.getFavorites();
        const enrichedFavorites = this._enrichFavorites(favoriteIds);
        const hasFavorites = enrichedFavorites.length > 0;

        this.container.innerHTML = `
            <div class="page-content favorites-page">
                <div class="page-header favorites-header">
                    <div class="favorites-title-block">
                        <h1>
                            <span class="material-symbols-rounded">star</span>
                            Избранное
                        </h1>
                        <p>${enrichedFavorites.length} ${this._pluralize(enrichedFavorites.length)}</p>
                    </div>
                    ${hasFavorites ? `
                        <button class="md-button md-button-text favorites-clear-btn" data-action="clear-all">
                            <span class="material-symbols-rounded">delete_sweep</span>
                            Очистить
                        </button>
                    ` : ''}
                </div>

                ${!hasFavorites 
                    ? this.renderEmptyState() 
                    : this.renderList(enrichedFavorites)
                }
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Загружает данные из всех источников для обогащения избранного
     */
    async _loadDataCache() {
        if (this._dataCache) return;
        
        this._dataCache = {
            calculators: [],
            references: [],
            guidelines: [],
            orders: []
        };
        
        const sources = [
            { key: 'calculators', url: 'data/calculators.json', prefix: 'calc-' },
            { key: 'references', url: 'data/references.json', prefix: 'ref-' },
            { key: 'guidelines', url: 'data/guidelines.json', prefix: 'guideline-' },
            { key: 'orders', url: 'data/orders.json', prefix: 'order-' }
        ];
        
        await Promise.all(sources.map(async (source) => {
            try {
                const res = await fetch(source.url);
                if (!res.ok) return;
                const data = await res.json();
                // Нормализуем: добавляем префикс к ID и помечаем тип
                this._dataCache[source.key] = (Array.isArray(data) ? data : []).map(item => ({
                    ...item,
                    _fullId: `${source.prefix}${item.id}`,
                    _source: source.key,
                    section: item.route || source.key
                }));
            } catch (e) {
                console.warn(`⚠️ Не удалось загрузить ${source.url}:`, e.message);
            }
        }));
    }

    /**
     * Обогащает ID избранного полными данными из кэша
     */
    _enrichFavorites(ids) {
        if (!this._dataCache) return [];
        
        const allItems = [
            ...this._dataCache.calculators,
            ...this._dataCache.references,
            ...this._dataCache.guidelines,
            ...this._dataCache.orders
        ];
        
        const enriched = [];
        const notFound = [];
        
        ids.forEach(id => {
            // Пробуем найти по полному ID (с префиксом) или по чистому
            const found = allItems.find(item => 
                item._fullId === id || 
                String(item.id) === String(id) ||
                `${item._source}-${item.id}` === id
            );
            
            if (found) {
                enriched.push({
                    id: id,
                    title: found.title || 'Без названия',
                    subtitle: this._buildSubtitle(found),
                    icon: found.icon || this._getSourceIcon(found._source),
                    section: found.section || found._source,
                    source: found._source,
                    priority: found.priority
                });
            } else {
                notFound.push(id);
                // Fallback — показываем с заглушкой
                enriched.push({
                    id: id,
                    title: 'Запись не найдена',
                    subtitle: 'Возможно, источник был удалён',
                    icon: 'help_outline',
                    section: '',
                    source: 'unknown',
                    _notFound: true
                });
            }
        });
        
        // Логируем ненайденные (для отладки)
        if (notFound.length > 0) {
            console.warn('⚠️ Не найдено в источниках:', notFound);
        }
        
        return enriched;
    }

    /**
     * Строит подзаголовок на основе типа источника
     */
    _buildSubtitle(item) {
        if (item.subtitle) return item.subtitle;
        
        const sourceLabels = {
            calculators: 'Калькулятор',
            references: 'Справочник',
            guidelines: 'Протокол',
            orders: 'Приказ'
        };
        
        const categories = item._categories || item.categories;
        if (Array.isArray(categories) && categories.length > 0) {
            return `${sourceLabels[item._source] || ''} · ${categories[0]}`;
        }
        
        return sourceLabels[item._source] || '';
    }

    /**
     * Иконка по умолчанию для типа источника
     */
    _getSourceIcon(source) {
        const icons = {
            calculators: 'calculate',
            references: 'menu_book',
            guidelines: 'clinical_notes',
            orders: 'gavel'
        };
        return icons[source] || 'article';
    }

    renderEmptyState() {
        const recommended = this.getRecommendedItems();
        
        return `
            <div class="favorites-empty card card-elevated">
                <div class="favorites-empty-icon">
                    <span class="material-symbols-rounded">bookmark_star</span>
                </div>
                <div class="favorites-empty-content">
                    <div class="favorites-empty-title">Пока пусто</div>
                    <div class="favorites-empty-description">
                        Добавляйте важные протоколы, калькуляторы и шпаргалки в избранное — 
                        они будут всегда под рукой. Чтобы добавить запись, откройте её и 
                        нажмите на звёздочку.
                    </div>
                </div>
                <button class="md-button md-button-filled favorites-explore-btn" data-action="explore">
                    <span class="material-symbols-rounded">explore</span>
                    Посмотреть рекомендации
                </button>
            </div>

            <div class="favorites-section-title">
                <span class="material-symbols-rounded">tips_and_updates</span>
                <span>Рекомендуемые протоколы</span>
            </div>

            <div class="card card-outlined favorites-list">
                ${recommended.map(item => `
                    <div class="favorites-list-item ripple ${item._notFound ? 'not-found' : ''}" 
                         data-id="${item.id}" 
                         data-section="${item.section || ''}">
                        <div class="favorites-item-icon">
                            <span class="material-symbols-rounded">${item.icon || 'article'}</span>
                        </div>
                        <div class="favorites-item-content">
                            <div class="favorites-item-title">${item.title}</div>
                            <div class="favorites-item-subtitle">${item.subtitle || ''}</div>
                        </div>
                        <span class="material-symbols-rounded favorites-item-arrow">chevron_right</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderList(items) {
        return `
            <div class="card card-outlined favorites-list">
                ${items.map(item => `
                    <div class="favorites-list-item ripple ${item._notFound ? 'not-found' : ''}" 
                         data-id="${item.id}" 
                         data-section="${item.section || ''}">
                        <div class="favorites-item-icon favorites-icon-${item.source || 'default'}">
                            <span class="material-symbols-rounded">${item.icon || 'article'}</span>
                        </div>
                        <div class="favorites-item-content">
                            <div class="favorites-item-title">${item.title}</div>
                            <div class="favorites-item-subtitle">
                                ${item.subtitle || ''}
                                ${item.priority === 'critical' 
                                    ? '<span class="favorites-priority-badge">критично</span>' 
                                    : ''}
                            </div>
                        </div>
                        <button class="favorites-remove-btn" 
                                data-remove-id="${item.id}" 
                                aria-label="Удалить «${item.title}» из избранного"
                                title="Удалить «${item.title}»">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getRecommendedItems() {
        return [
            { 
                id: 'calc-glasgow-coma', 
                title: 'Шкала комы Глазго', 
                subtitle: 'Калькулятор · Реанимация', 
                icon: 'psychology', 
                section: 'glasgow-coma',
                source: 'calculators'
            },
            { 
                id: 'calc-algover', 
                title: 'Индекс Альговера', 
                subtitle: 'Калькулятор · Шоковый индекс', 
                icon: 'bloodtype', 
                section: 'algover',
                source: 'calculators'
            },
            { 
                id: 'calc-pediatric', 
                title: 'Педиатрический калькулятор', 
                subtitle: 'Калькулятор · Лента Брослоу', 
                icon: 'child_care', 
                section: 'pediatric',
                source: 'calculators'
            },
            { 
                id: 'calc-nihss', 
                title: 'Шкала инсульта NIHSS', 
                subtitle: 'Калькулятор · Неврология', 
                icon: 'neurology', 
                section: 'nihss',
                source: 'calculators'
            }
        ];
    }

    _pluralize(count) {
        if (count === 0) return 'записей';
        const lastTwo = count % 100;
        const lastOne = count % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'записей';
        if (lastOne === 1) return 'запись';
        if (lastOne >= 2 && lastOne <= 4) return 'записи';
        return 'записей';
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        this._clickHandler = (e) => {
            // Кнопка "Очистить всё"
            if (e.target.closest('[data-action="clear-all"]')) {
                e.preventDefault();
                e.stopPropagation();
                this.clearAll();
                return;
            }

            // Кнопка "Посмотреть рекомендации"
            if (e.target.closest('[data-action="explore"]')) {
                e.preventDefault();
                e.stopPropagation();
                window.location.hash = 'calculators';
                return;
            }

            // Кнопка удаления
            const removeBtn = e.target.closest('.favorites-remove-btn');
            if (removeBtn && this.container.contains(removeBtn)) {
                e.preventDefault();
                e.stopPropagation();
                const id = removeBtn.dataset.removeId;
                const item = removeBtn.closest('.favorites-list-item');
                this.removeFavorite(id, item);
                return;
            }

            // Клик по элементу — переход в раздел
            const item = e.target.closest('.favorites-list-item');
            if (!item || !this.container.contains(item)) return;
            
            // Игнорируем "ненайденные" записи
            if (item.classList.contains('not-found')) {
                window.showSnackbar?.('Запись не найдена в источниках');
                return;
            }

            const section = item.dataset.section;
            const title = item.querySelector('.favorites-item-title')?.textContent || '';

            if (section) {
                window.location.hash = section;
                window.showSnackbar?.(`Открытие: ${title}`);
            }
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }

    removeFavorite(id, itemElement) {
        if (itemElement) {
            itemElement.classList.add('removing');
            setTimeout(() => {
                storage.removeFavorite(id);
                window.showSnackbar?.('Удалено из избранного');
                this._dataCache = null; // Сбрасываем кэш
                this.render();
            }, 250);
        } else {
            storage.removeFavorite(id);
            window.showSnackbar?.('Удалено из избранного');
            this._dataCache = null;
            this.render();
        }
    }

    clearAll() {
        if (!confirm('Удалить все записи из избранного?')) return;
        
        storage.clearFavorites();
        window.showSnackbar?.('Избранное очищено');
        this._dataCache = null;
        this.render();
    }
}