import { storage } from '../storage.js';

export default class HomePage {
    constructor(container) {
        this.container = container;
        this._clickHandler = null;
        this._dataCache = null;
        this._cacheReady = false;  // ✅ Флаг готовности кэша
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Доброе утро';
        if (hour >= 12 && hour < 18) return 'Добрый день';
        if (hour >= 18 && hour < 23) return 'Добрый вечер';
        return 'Доброй ночи';
    }

    getFormattedDate() {
        const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 
                      'четверг', 'пятница', 'суббота'];
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const now = new Date();
        return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    async render() {
        this.cleanup();

        // ✅ Загружаем все источники данных для обогащения избранного
        await this._loadDataCache();

        const tiles = [
            { route: 'orders', title: 'Приказы', subtitle: 'Нормативные документы', icon: 'gavel' },
            { route: 'guidelines', title: 'Клинические рекомендации', subtitle: 'Протоколы и алгоритмы', icon: 'clinical_notes' },
            { route: 'calculators', title: 'Калькуляторы', subtitle: 'Шкалы и расчёты', icon: 'calculate' },
            { route: 'cheatsheets', title: 'Шпаргалки и справка', subtitle: 'Быстрая информация', icon: 'menu_book' }
        ];

        // Обогащаем избранное (ID → полные данные)
        const favoriteIds = this._safeGetFavorites();
        const favoriteItems = favoriteIds.length > 0 
            ? this._enrichItems(favoriteIds) 
            : this._getDemoFavorites();

        // Обогащаем недавнее
        const recentRaw = this._safeGetRecent();
        const recentItems = recentRaw.length > 0 
            ? recentRaw 
            : this._getDemoRecent();

        this.container.innerHTML = `
            <div class="page-content home-page">
                <div class="page-header">
                    <h1>${this.getGreeting()} 👋</h1>
                    <p>Скорая медицинская помощь г. Минск · ${this.getFormattedDate()}</p>
                </div>

                <div class="home-tiles-grid">
                    ${tiles.map(tile => `
                        <div class="card card-elevated ripple home-tile" data-route="${tile.route}">
                            <div class="home-tile-icon">
                                <span class="material-symbols-rounded">${tile.icon}</span>
                            </div>
                            <div class="home-tile-content">
                                <div class="home-tile-title">${tile.title}</div>
                                <div class="home-tile-subtitle">${tile.subtitle}</div>
                            </div>
                            <span class="home-tile-arrow material-symbols-rounded">chevron_right</span>
                        </div>
                    `).join('')}
                </div>

                <div class="home-section-header">
                    <span class="home-section-title">
                        <span class="material-symbols-rounded">star</span>
                        Избранное
                        ${favoriteItems.length > 0 ? `<span class="home-section-count">${favoriteItems.length}</span>` : ''}
                    </span>
                    <button class="md-button md-button-text home-section-more" data-navigate="favorites">
                        Все →
                    </button>
                </div>
                <div class="home-compact-grid">
                    ${favoriteItems.slice(0, 4).map(item => this._renderCompactTile(item, 'fav')).join('')}
                </div>

                <div class="home-section-header">
                    <span class="home-section-title">
                        <span class="material-symbols-rounded">history</span>
                        Недавнее
                    </span>
                    <button class="md-button md-button-text home-section-more" data-navigate="recent">
                        Все →
                    </button>
                </div>
                <div class="home-compact-grid">
                    ${recentItems.slice(0, 4).map(item => this._renderCompactTile(item, 'recent')).join('')}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Рендер компактной плитки
     */
    _renderCompactTile(item, type) {
        const dataAttr = type === 'fav' 
            ? `data-fav-id="${item.id}"` 
            : `data-recent-id="${item.id}"`;
        
        const notFoundClass = item._notFound ? 'not-found' : '';
        const icon = item.icon || this._getSourceIcon(item.source);
        // ✅ Бейдж критичности
        const priorityBadge = item.priority === 'critical' 
            ? '<span class="home-priority-badge">критично</span>' 
            : '';
        
        return `
            <div class="card home-compact-tile ripple ${type === 'recent' ? 'recent' : ''} ${notFoundClass}" 
                 ${dataAttr} 
                 data-section="${item.section || ''}"
                 data-source="${item.source || ''}">
                <div class="home-compact-icon home-icon-${item.source || 'default'}">
                    <span class="material-symbols-rounded">${icon}</span>
                </div>
                <div class="home-compact-content">
                    <div class="home-compact-title">
                        ${item.title}
                        ${priorityBadge}
                    </div>
                    <div class="home-compact-subtitle">${item.subtitle || ''}</div>
                </div>
                <span class="home-compact-arrow material-symbols-rounded">chevron_right</span>
            </div>
        `;
    }

    // ============================================
    // БЕЗОПАСНОЕ ПОЛУЧЕНИЕ ДАННЫХ ИЗ STORAGE
    // ============================================

    _safeGetFavorites() {
        try {
            const data = storage.getFavorites();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.warn('⚠️ Не удалось получить избранное:', e);
            return [];
        }
    }

    _safeGetRecent() {
        try {
            const data = storage.getRecent();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.warn('⚠️ Не удалось получить недавнее:', e);
            return [];
        }
    }

    // ============================================
    // ЗАГРУЗКА ДАННЫХ ДЛЯ ОБОГАЩЕНИЯ
    // ============================================

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
                this._dataCache[source.key] = (Array.isArray(data) ? data : []).map(item => ({
                    ...item,
                    _fullId: `${source.prefix}${item.id}`,
                    _source: source.key,
                    section: item.route || source.key
                }));
            } catch (e) {
                // Тихо пропускаем недоступные источники
            }
        }));
        
        this._cacheReady = true;  // ✅ Отмечаем готовность
    }

    /**
     * Обогащает ID полными данными из кэша
     */
    _enrichItems(ids) {
        if (!this._dataCache) return [];
        
        const allItems = [
            ...this._dataCache.calculators,
            ...this._dataCache.references,
            ...this._dataCache.guidelines,
            ...this._dataCache.orders
        ];
        
        return ids.map(id => {
            const found = allItems.find(item => 
                item._fullId === id || 
                String(item.id) === String(id) ||
                `${item._source}-${item.id}` === id
            );
            
            if (found) {
                return {
                    id: id,
                    title: found.title || 'Без названия',
                    subtitle: this._buildSubtitle(found),
                    icon: found.icon || this._getSourceIcon(found._source),
                    section: found.section || found._source,
                    source: found._source,
                    priority: found.priority,
                    route: found.route  // ✅ Сохраняем route для навигации
                };
            }
            
            return {
                id: id,
                title: this._extractTitleFromId(id),
                subtitle: 'Запись не найдена',
                icon: 'help_outline',
                section: '',
                source: 'unknown',
                _notFound: true
            };
        });
    }

    _extractTitleFromId(id) {
        const clean = String(id).replace(/^(calc|ref|guideline|order)-/, '');
        return clean
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ') || id;
    }

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

    _getSourceIcon(source) {
        const icons = {
            calculators: 'calculate',
            references: 'menu_book',
            guidelines: 'clinical_notes',
            orders: 'gavel'
        };
        return icons[source] || 'article';
    }

    // ============================================
    // DEMO-ДАННЫЕ
    // ============================================

    _getDemoFavorites() {
        return [
            { id: 'demo-1', title: 'Сердечно-лёгочная реанимация', subtitle: 'Реанимация', icon: 'monitor_heart', section: 'guidelines', source: 'guidelines' },
            { id: 'demo-2', title: 'Острый коронарный синдром', subtitle: 'Кардиология', icon: 'cardiology', section: 'guidelines', source: 'guidelines' },
            { id: 'demo-3', title: 'Анафилактический шок', subtitle: 'Аллергология', icon: 'allergies', section: 'guidelines', source: 'guidelines' },
            { id: 'demo-4', title: 'Гипертонический криз', subtitle: 'Кардиология', icon: 'cardiology', section: 'guidelines', source: 'guidelines' }
        ];
    }

    _getDemoRecent() {
        return [
            { id: 'demo-r1', title: 'Адреса больниц г. Минска', subtitle: 'Госпитализация', icon: 'local_hospital', section: 'reference', source: 'references' },
            { id: 'demo-r2', title: 'Детские дозировки (по весу)', subtitle: 'Фармакология', icon: 'medication', section: 'calculators', source: 'calculators' },
            { id: 'demo-r3', title: 'Шкала комы Глазго (ШКГ)', subtitle: 'Неврология', icon: 'neurology', section: 'calculators', source: 'calculators' },
            { id: 'demo-r4', title: 'Телефоны экстренных служб', subtitle: 'Контакты', icon: 'phone', section: 'reference', source: 'references' }
        ];
    }

    // ============================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        this._clickHandler = (e) => {
            const routeEl = e.target.closest('[data-route]');
            if (routeEl && this.container.contains(routeEl)) {
                e.preventDefault();
                window.location.hash = routeEl.dataset.route;
                return;
            }

            const navigateEl = e.target.closest('[data-navigate]');
            if (navigateEl && this.container.contains(navigateEl)) {
                e.preventDefault();
                window.location.hash = navigateEl.dataset.navigate;
                return;
            }

            const itemEl = e.target.closest('[data-fav-id], [data-recent-id]');
            if (itemEl && this.container.contains(itemEl)) {
                e.preventDefault();
                this._handleItemClick(itemEl);
                return;
            }
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }

    /**
     * ✅ УНИВЕРСАЛЬНАЯ умная навигация по записи
     */
    _handleItemClick(itemEl) {
        const id = itemEl.dataset.favId || itemEl.dataset.recentId;
        const section = itemEl.dataset.section;
        const source = itemEl.dataset.source;
        const title = itemEl.querySelector('.home-compact-title')?.textContent?.trim() || '';
        
        // Запись не найдена в источниках
        if (itemEl.classList.contains('not-found')) {
            window.showSnackbar?.(`"${title}" — запись не найдена в источниках`);
            return;
        }
        
        // Защита от быстрого клика до загрузки кэша
        if (!this._cacheReady) {
            window.showSnackbar?.('Загрузка данных...');
            return;
        }
        
        // Ищем запись в кэше для получения route
        const cachedItem = this._findInCache(id);
        
        // 1. Если есть route в кэше — переходим по нему
        if (cachedItem?.route) {
            window.location.hash = cachedItem.route;
            return;
        }
        
        // 2. Калькуляторы: обрезаем префикс calc-
        if (source === 'calculators' && id) {
            const calcRoute = id.startsWith('calc-') ? id.substring(5) : id;
            window.location.hash = calcRoute;
            return;
        }
        
        // 3. Fallback — переходим в раздел
        if (section) {
            window.location.hash = section;
            window.showSnackbar?.(`Открытие: ${title}`);
        } else {
            window.showSnackbar?.(title);
        }
    }

    _findInCache(id) {
        if (!this._dataCache) return null;
        
        const allItems = [
            ...this._dataCache.calculators,
            ...this._dataCache.references,
            ...this._dataCache.guidelines,
            ...this._dataCache.orders
        ];
        
        return allItems.find(item => 
            item._fullId === id || 
            String(item.id) === String(id) ||
            `${item._source}-${item.id}` === id
        );
    }
}