import { storage } from '../storage.js';

export default class RecentPage {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const recent = storage.getRecent();
        const MAX_DISPLAY = 15;
        const displayItems = recent.slice(0, MAX_DISPLAY);

        this.container.innerHTML = `
            <div class="page-content">
                <div class="page-header" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
                    <div>
                        <h1 style="display: flex; align-items: center; gap: 12px;">
                            <span class="material-symbols-rounded" style="color: var(--md-primary);">history</span>
                            Недавнее
                        </h1>
                        <p>Последние ${displayItems.length} ${this._pluralize(displayItems.length)} (макс. ${MAX_DISPLAY})</p>
                    </div>
                    ${displayItems.length > 0 ? `
                        <button class="md-button md-button-text" data-action="clear-all" style="flex-shrink: 0;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete_sweep</span>
                            Очистить
                        </button>
                    ` : ''}
                </div>

                ${displayItems.length === 0 ? `
                    <div class="empty-state">
                        <span class="material-symbols-rounded icon">history</span>
                        <div class="title">История пуста</div>
                        <p>Здесь будут отображаться недавно просмотренные записи</p>
                    </div>
                ` : `
                    <div class="card card-outlined" style="padding: 4px 0;">
                        ${displayItems.map(item => `
                            <div class="list-item ripple" data-id="${item.id}" data-section="${item.section || ''}">
                                <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--md-secondary-container); color: var(--md-on-secondary-container); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <span class="material-symbols-rounded">${item.icon || 'article'}</span>
                                </div>
                                <div class="content">
                                    <div class="headline">${item.title}</div>
                                    <div class="supporting">
                                        ${item.subtitle || ''}
                                        ${item.viewedAt ? ` · ${this._formatTime(item.viewedAt)}` : ''}
                                    </div>
                                </div>
                                <button class="icon-button ripple remove-btn" data-remove-id="${item.id}" aria-label="Удалить" style="width: 40px; height: 40px;">
                                    <span class="material-symbols-rounded" style="font-size: 20px;">close</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        this._setupEventListeners();
    }

    _pluralize(count) {
        const lastTwo = count % 100;
        const lastOne = count % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'записей';
        if (lastOne === 1) return 'запись';
        if (lastOne >= 2 && lastOne <= 4) return 'записи';
        return 'записей';
    }

    /**
     * Форматирует время: "только что", "5 мин назад", "вчера", "17 июля"
     */
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

    _setupEventListeners() {
        // Клик по элементу
        this.container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.remove-btn')) return;
                
                const section = item.dataset.section;
                const title = item.querySelector('.headline').textContent;
                
                if (section) {
                    window.location.hash = section;
                }
                window.showSnackbar?.(`📄 ${title}`);
            });
        });

        // Кнопки удаления
        this.container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.removeId;
                storage.removeRecent(id);
                window.showSnackbar?.('🗑️ Удалено из истории');
                this.render();
            });
        });

        // Кнопка "Очистить всё"
        this.container.querySelector('[data-action="clear-all"]')?.addEventListener('click', () => {
            if (confirm('Очистить всю историю просмотров?')) {
                storage.clearRecent();
                window.showSnackbar?.('🗑️ История очищена');
                this.render();
            }
        });
    }
}