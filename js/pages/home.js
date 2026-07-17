import { storage } from '../storage.js';

export default class HomePage {
    constructor(container) {
        this.container = container;
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
        const tiles = [
            { 
                route: 'orders', 
                title: 'Приказы', 
                subtitle: 'Нормативные документы', 
                icon: 'gavel'
            },
            { 
                route: 'guidelines', 
                title: 'Клинические рекомендации', 
                subtitle: 'Протоколы и алгоритмы', 
                icon: 'clinical_notes'
            },
            { 
                route: 'calculators', 
                title: 'Калькуляторы', 
                subtitle: 'Шкалы и расчёты', 
                icon: 'calculate'
            },
            { 
                route: 'reference', 
                title: 'Шпаргалки и справка', 
                subtitle: 'Быстрая информация', 
                icon: 'menu_book'
            }
        ];

        // Избранное — 4 демо-записи (сортировка по дате добавления)
        const favorites = storage.getFavorites();
        const favoriteItems = favorites.length > 0 ? favorites : [
            { id: 'demo-1', title: 'Сердечно-лёгочная реанимация', subtitle: 'Реанимация', icon: 'monitor_heart', section: 'guidelines' },
            { id: 'demo-2', title: 'Острый коронарный синдром', subtitle: 'Кардиология', icon: 'cardiology', section: 'guidelines' },
            { id: 'demo-3', title: 'Анафилактический шок', subtitle: 'Аллергология', icon: 'allergies', section: 'guidelines' },
            { id: 'demo-4', title: 'Гипертонический криз', subtitle: 'Кардиология', icon: 'cardiology', section: 'guidelines' }
        ];

        // Недавнее — 4 демо-записи (сортировка по времени просмотра)
        const recent = storage.getRecent();
        const recentItems = recent.length > 0 ? recent : [
            { id: 'demo-r1', title: 'Адреса больниц г. Минска', subtitle: 'Госпитализация', icon: 'local_hospital', section: 'reference' },
            { id: 'demo-r2', title: 'Детские дозировки (по весу)', subtitle: 'Фармакология', icon: 'medication', section: 'calculators' },
            { id: 'demo-r3', title: 'Шкала комы Глазго (ШКГ)', subtitle: 'Неврология', icon: 'neurology', section: 'calculators' },
            { id: 'demo-r4', title: 'Телефоны экстренных служб', subtitle: 'Контакты', icon: 'phone', section: 'reference' }
        ];
        const isRecentDemo = recent.length === 0;

        this.container.innerHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h1>${this.getGreeting()} 👋</h1>
                    <p>Скорая медицинская помощь г. Минск · ${this.getFormattedDate()}</p>
                </div>

                <!-- ===== ПЛИТКИ: 2 КОЛОНКИ, ПРЯМОУГОЛЬНЫЕ ===== -->
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

                <!-- Избранное -->
                <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0 8px;" data-navigate="favorites">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-rounded" style="font-size: 20px; color: var(--md-primary);">star</span>
                        Избранное
                    </span>
                    <button class="md-button md-button-text" style="padding: 4px 12px; height: 32px; font-size: 12px;" data-navigate="favorites">Все →</button>
                </div>
                <div class="home-compact-grid">
                    ${favoriteItems.slice(0, 4).map(item => `
                        <div class="card home-compact-tile ripple" data-fav-id="${item.id}" data-section="${item.section || ''}">
                            <div class="home-compact-icon"><span class="material-symbols-rounded">${item.icon}</span></div>
                            <div class="home-compact-content">
                                <div class="home-compact-title">${item.title}</div>
                                <div class="home-compact-subtitle">${item.subtitle || ''}</div>
                            </div>
                            <span class="home-compact-arrow material-symbols-rounded">chevron_right</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Недавнее -->
                <div class="section-header" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 0 8px;" data-navigate="recent">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-rounded" style="font-size: 20px; color: var(--md-primary);">history</span>
                        Недавнее
                    </span>
                    <button class="md-button md-button-text" style="padding: 4px 12px; height: 32px; font-size: 12px;" data-navigate="recent">Все →</button>
                </div>
                <div class="home-compact-grid">
                    ${recentItems.slice(0, 4).map(item => `
                        <div class="card home-compact-tile recent ripple" data-recent-id="${item.id}" data-section="${item.section || ''}">
                            <div class="home-compact-icon"><span class="material-symbols-rounded">${item.icon}</span></div>
                            <div class="home-compact-content">
                                <div class="home-compact-title">${item.title}</div>
                                <div class="home-compact-subtitle">${item.subtitle || ''}</div>
                            </div>
                            <span class="home-compact-arrow material-symbols-rounded">chevron_right</span>
                        </div>
                    `).join('')}
                </div>
                </div>
            </div>
        `;

        this._setupEventListeners();
    }

    _formatTime(isoString) {
        try {
            const date = new Date(isoString);
            const now = new Date();
            const diffMin = Math.floor((now - date) / 60000);
            const diffHours = Math.floor((now - date) / 3600000);
            const diffDays = Math.floor((now - date) / 86400000);

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

    _setupEventListeners() {
        this.container.querySelectorAll('[data-route]').forEach(el => {
            el.addEventListener('click', () => {
                window.location.hash = el.dataset.route;
            });
        });

        this.container.querySelectorAll('[data-navigate]').forEach(el => {
            el.addEventListener('click', () => {
                window.location.hash = el.dataset.navigate;
            });
        });

        this.container.querySelectorAll('[data-fav-id], [data-recent-id]').forEach(el => {
            el.addEventListener('click', () => {
                const section = el.dataset.section;
                const title = el.querySelector('.headline').textContent;
                if (section) window.location.hash = section;
                window.showSnackbar?.(`📄 Открытие: ${title}`);
            });
        });
    }
}