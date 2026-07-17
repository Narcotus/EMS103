import { NAV_ITEMS } from '../navigation.js';

export class Drawer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scrim = document.getElementById('scrim');
        this.itemCallback = null;
        this.activeRoute = 'home';
        this.isDesktop = false;
        
        this.render();
        this.checkViewport();
        
        window.addEventListener('resize', () => this.checkViewport());
    }

    checkViewport() {
        this.isDesktop = window.innerWidth >= 1200;
        if (this.isDesktop) {
            this.container.classList.remove('open');
            this.scrim?.classList.remove('show');
        }
    }

    render() {
        const itemsHtml = NAV_ITEMS.map(item => `
            <button class="nav-drawer-item ripple ${item.id === this.activeRoute ? 'active' : ''}" data-route="${item.id}">
                <span class="material-symbols-rounded">${item.icon}</span>
                <span>${item.title}</span>
            </button>
        `).join('');

        this.container.innerHTML = `
            <div class="nav-drawer-header">
                <div class="logo">
                    <div class="logo-icon">
                        <span class="material-symbols-rounded">local_hospital</span>
                    </div>
                    <div>
                        <div class="app-name">EMS 103</div>
                        <div class="app-description">Скорая помощь · Минск</div>
                    </div>
                </div>
            </div>
            
            ${itemsHtml}
            
            <div class="nav-drawer-divider"></div>
            
            <button class="nav-drawer-item ripple" data-route="favorites">
                <span class="material-symbols-rounded">star</span>
                <span>Избранное</span>
            </button>
            <button class="nav-drawer-item ripple" data-route="recent">
                <span class="material-symbols-rounded">history</span>
                <span>Недавнее</span>
            </button>
            
            <div class="nav-drawer-divider"></div>
            
            <button class="nav-drawer-item ripple" data-action="settings">
                <span class="material-symbols-rounded">settings</span>
                <span>Настройки</span>
            </button>
            <button class="nav-drawer-item ripple" data-action="about">
                <span class="material-symbols-rounded">info</span>
                <span>О приложении</span>
            </button>
            
            <div style="padding: 16px 24px; font: 400 12px/16px var(--md-font-family); color: var(--md-on-surface-variant);">
                EMS 103 v1.5 · Минск · 2026
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Все пункты теперь navigation (data-route)
        this.container.querySelectorAll('.nav-drawer-item[data-route]').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route && this.itemCallback) {
                    this.itemCallback(route);
                    if (!this.isDesktop) {
                        this.close();
                    }
                }
            });
        });
        
        // Действия (Настройки, О приложении) — пока заглушки
        this.container.querySelectorAll('.nav-drawer-item[data-action]').forEach(item => {
            item.addEventListener('click', () => {
                this.handleAction(item.dataset.action);
            });
        });
    }

    handleAction(action) {
        const messages = {
            settings: '⚙️ Раздел "Настройки" в разработке',
            about: 'ℹ️ EMS 103 v1.5 — Неофициальное приложение для СМП Минска'
        };
        window.showSnackbar?.(messages[action] || 'Действие');
    }

    toggle() {
        if (this.isDesktop) return;
        this.container.classList.toggle('open');
        this.scrim?.classList.toggle('show');
    }

    close() {
        if (this.isDesktop) return;
        this.container.classList.remove('open');
        this.scrim?.classList.remove('show');
    }

    setActive(route) {
        this.activeRoute = route;
        this.container.querySelectorAll('.nav-drawer-item[data-route]').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });
    }

    onItemClick(callback) {
        this.itemCallback = callback;
    }
}