import { storage } from '../storage.js';

export default class RecentPage {
    constructor(container) {
        this.container = container;
        this._clickHandler = null;
        this._dataCache = null;
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
    }

    async render() {
        this.cleanup();
        
        // ✅ Защищённое сохранение страницы в историю
        try {
            storage.addRecent({
                id: 'recent',
                title: 'Недавнее',
                subtitle: 'История просмотров',
                icon: 'history',
                section: 'recent',
                source: 'recent'  // ✅ Для иконки страницы
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        // ✅ Загружаем кэш для обогащения старых записей
        await this._loadDataCache();

        const recent = storage.getRecent();
        const MAX_DISPLAY = 15;
        const rawItems = recent.slice(0, MAX_DISPLAY);
        
        // ✅ Обогащаем записи (добавляем source для старых)
        const displayItems = rawItems.map(item => this._enrichItem(item));

        this.container.innerHTML = `
            <div class="page-content recent-page">
                <div class="page-header recent-header">
                    <div class="recent-title-block">
                        <h1>
                            <span class="material-symbols-rounded">history</span>
                            Недавнее
                        </h1>
                        <p>Последние ${displayItems.length} ${this._pluralize(displayItems.length)} (макс. ${MAX_DISPLAY})</p>
                    </div>
                    ${displayItems.length > 0 ? `
                        <button class="md-button md-button-text recent-clear-btn" data-action="clear-all">
                            <span class="material-symbols-rounded">delete_sweep</span>
                            Очистить
                        </button>
                    ` : ''}
                </div>

                ${displayItems.length === 0 ? this.renderEmptyState() : this.renderList(displayItems)}
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * ✅ Обогащение записи данными из кэша
     */
    _enrichItem(item) {
        // Если source уже есть — используем как есть
        if (item.source) return item;
        
        // Ищем в кэше
        const cached = this._findInCache(item.id);
        if (cached) {
            return {
                ...item,
                source: cached._source,
                icon: cached.icon || item.icon,
                section: cached.section || cached.route || item.section
            };
        }
        
        // Автоопределение source по ID/section
        return {
            ...item,
            source: this._detectSource(item)
        };
    }

    /**
     * ✅ Автоопределение source для старых записей
     */
    _detectSource(item) {
        const id = String(item.id || '').toLowerCase();
        const section = String(item.section || '').toLowerCase();
        
        if (id.startsWith('calc-') || section === 'calculators') return 'calculators';
        if (id.startsWith('ref-') || section === 'reference' || section === 'references') return 'references';
        if (id.startsWith('guideline-') || section === 'guidelines') return 'guidelines';
        if (id.startsWith('order-') || section === 'orders') return 'orders';
        
        return 'default';
    }

    /**
     * Поиск записи в кэше
     */
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

    /**
     * Загрузка кэша данных
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
                this._dataCache[source.key] = (Array.isArray(data) ? data : []).map(item => ({
                    ...item,
                    _fullId: `${source.prefix}${item.id}`,
                    _source: source.key,
                    section: item.route || source.key
                }));
            } catch (e) {
                // Тихо пропускаем
            }
        }));
    }

    renderEmptyState() {
        return `
            <div class="recent-empty empty-state">
                <span class="material-symbols-rounded icon">history</span>
                <div class="title">История пуста</div>
                <p>Здесь будут отображаться недавно просмотренные записи</p>
            </div>
        `;
    }

    renderList(items) {
        return `
            <div class="card card-outlined recent-list">
                ${items.map(item => {
                    const source = item.source || 'default';
                    const icon = item.icon || this._getSourceIcon(source);
                    
                    return `
                        <div class="list-item ripple recent-item" 
                             data-id="${item.id}" 
                             data-section="${item.section || ''}"
                             data-source="${source}">
                            <div class="recent-item-icon recent-icon-${source}">
                                <span class="material-symbols-rounded">${icon}</span>
                            </div>
                            <div class="content">
                                <div class="headline">${item.title}</div>
                                <div class="supporting">
                                    ${item.subtitle || ''}
                                    ${item.viewedAt ? ` · ${this._formatTime(item.viewedAt)}` : ''}
                                </div>
                            </div>
                            <button class="icon-button ripple remove-btn" 
                                    data-remove-id="${item.id}" 
                                    aria-label="Удалить «${item.title}» из истории"
                                    title="Удалить «${item.title}»">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    _getSourceIcon(source) {
        const icons = {
            calculators: 'calculate',
            references: 'menu_book',
            guidelines: 'clinical_notes',
            orders: 'gavel',
            recent: 'history'
        };
        return icons[source] || 'article';
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

    _formatTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMin = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMin < 1) return 'только что';
            if (diffMin < 60) return `${diffMin} мин назад`;
            if (diffHours < 24) return `${diffHours} ч назад`;
            if (diffDays === 1) return 'вчера';
            if (diffDays < 7) return `${diffDays} дн назад`;

            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        } catch {
            return '';
        }
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

            // Кнопка удаления
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn && this.container.contains(removeBtn)) {
                e.preventDefault();
                e.stopPropagation();
                const id = removeBtn.dataset.removeId;
                const item = removeBtn.closest('.recent-item');
                this.removeRecent(id, item);
                return;
            }

            // Клик по элементу
            const item = e.target.closest('.recent-item');
            if (!item || !this.container.contains(item)) return;

            // Если клик по кнопке удаления — игнорируем
            if (e.target.closest('.remove-btn')) return;

            e.preventDefault();
            this._handleItemClick(item);
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }

    /**
     * ✅ Умная маршрутизация при клике
     */
    _handleItemClick(itemEl) {
        const id = itemEl.dataset.id;
        const section = itemEl.dataset.section;
        const source = itemEl.dataset.source;
        const title = itemEl.querySelector('.headline')?.textContent?.trim() || '';
        
        // Ищем в кэше для получения route
        const cached = this._findInCache(id);
        
        // 1. Если есть route в кэше — переходим по нему
        if (cached?.route) {
            window.location.hash = cached.route;
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

    removeRecent(id, itemElement) {
        // Анимация удаления
        if (itemElement) {
            itemElement.classList.add('removing');
            setTimeout(() => {
                storage.removeRecent(id);
                window.showSnackbar?.('Удалено из истории');
                this.render();
            }, 250);
        } else {
            storage.removeRecent(id);
            window.showSnackbar?.('Удалено из истории');
            this.render();
        }
    }

    clearAll() {
        if (!confirm('Очистить всю историю просмотров?')) return;
        
        storage.clearRecent();
        window.showSnackbar?.('История очищена');
        this.render();
    }
}