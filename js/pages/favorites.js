import { storage } from '../storage.js';

export default class FavoritesPage {
    constructor(container) {
        this.container = container;
    }

    async render() {
        const favorites = storage.getFavorites();

        // Если избранного нет — показываем рекомендованные заглушки
        const displayItems = favorites.length > 0 ? favorites : [
            { 
                id: 'rec-1', 
                title: 'Сердечно-лёгочная реанимация', 
                subtitle: 'Реанимация', 
                icon: 'monitor_heart',
                section: 'guidelines'
            },
            { 
                id: 'rec-2', 
                title: 'Острый коронарный синдром', 
                subtitle: 'Кардиология', 
                icon: 'cardiology',
                section: 'guidelines'
            },
            { 
                id: 'rec-3', 
                title: 'Анафилактический шок', 
                subtitle: 'Аллергология', 
                icon: 'allergies',
                section: 'guidelines'
            }
        ];

        const isDemo = favorites.length === 0;

        this.container.innerHTML = `
            <div class="page-content">
                <div class="page-header" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
                    <div>
                        <h1 style="display: flex; align-items: center; gap: 12px;">
                            <span class="material-symbols-rounded" style="color: var(--md-primary);">star</span>
                            Избранное
                        </h1>
                        <p>${displayItems.length} ${this._pluralize(displayItems.length)}</p>
                    </div>
                    ${!isDemo ? `
                        <button class="md-button md-button-text" data-action="clear-all" style="flex-shrink: 0;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete_sweep</span>
                            Очистить
                        </button>
                    ` : ''}
                </div>

                ${isDemo ? `
                    <div class="card card-elevated" style="background: var(--md-primary-container); color: var(--md-on-primary-container); margin-bottom: 16px; padding: 16px;">
                        <div style="display: flex; gap: 12px; align-items: flex-start;">
                            <span class="material-symbols-rounded" style="font-size: 24px;">info</span>
                            <div>
                                <div style="font: 500 14px/20px var(--md-font-family); margin-bottom: 4px;">Демо-режим</div>
                                <div style="font: 400 13px/18px var(--md-font-family); opacity: 0.9;">
                                    Избранных записей пока нет. Ниже показаны рекомендованные протоколы. 
                                    Чтобы добавить запись в избранное, откройте её и нажмите ⭐
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="card card-outlined" style="padding: 4px 0;">
                    ${displayItems.map(item => `
                        <div class="list-item ripple" data-id="${item.id}" data-section="${item.section || ''}">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: var(--md-primary-container); color: var(--md-on-primary-container); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <span class="material-symbols-rounded">${item.icon || 'article'}</span>
                            </div>
                            <div class="content">
                                <div class="headline">${item.title}</div>
                                <div class="supporting">${item.subtitle || ''}</div>
                            </div>
                            ${!isDemo ? `
                                <button class="icon-button ripple remove-btn" data-remove-id="${item.id}" aria-label="Удалить" style="width: 40px; height: 40px;">
                                    <span class="material-symbols-rounded" style="font-size: 20px;">close</span>
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this._setupEventListeners(isDemo);
    }

    _pluralize(count) {
        const lastTwo = count % 100;
        const lastOne = count % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'записей';
        if (lastOne === 1) return 'запись';
        if (lastOne >= 2 && lastOne <= 4) return 'записи';
        return 'записей';
    }

    _setupEventListeners(isDemo) {
        // Клик по элементу — переход в раздел
        this.container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Если клик по кнопке удаления — игнорируем
                if (e.target.closest('.remove-btn')) return;
                
                const section = item.dataset.section;
                const id = item.dataset.id;
                const title = item.querySelector('.headline').textContent;
                
                if (section) {
                    window.location.hash = section;
                    window.showSnackbar?.(`📄 Открытие: ${title}`);
                } else {
                    window.showSnackbar?.(`📄 ${title}`);
                }
            });
        });

        // Кнопки удаления
        this.container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.removeId;
                storage.removeFavorite(id);
                window.showSnackbar?.('⭐ Удалено из избранного');
                this.render(); // Перерисовать
            });
        });

        // Кнопка "Очистить всё"
        this.container.querySelector('[data-action="clear-all"]')?.addEventListener('click', () => {
            if (confirm('Удалить все записи из избранного?')) {
                storage.clearFavorites();
                window.showSnackbar?.('🗑️ Избранное очищено');
                this.render();
            }
        });
    }
}