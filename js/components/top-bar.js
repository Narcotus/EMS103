import { getRouteInfo } from '../navigation.js';
import { themeManager } from '../theme.js';
import { searchModal } from './search-modal.js';

export class TopBar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.menuCallback = null;
        this.isDesktop = false;
        this.render('home');
        
        themeManager.onChange(() => this.updateThemeButton());
        
        // Слушаем изменение размера экрана
        this.checkViewport();
        window.addEventListener('resize', () => this.checkViewport());
    }

    checkViewport() {
        const wasDesktop = this.isDesktop;
        this.isDesktop = window.innerWidth >= 1200;
        
        // При изменении режима — перерисовать (скрыть/показать бургер)
        if (wasDesktop !== this.isDesktop) {
            const currentRoute = window.location.hash.replace('#', '') || 'home';
            this.render(currentRoute);
        }
    }

    render(route) {
        const info = getRouteInfo(route);
        
        // На desktop не показываем кнопку-бургер
        const menuButtonHtml = this.isDesktop ? '' : `
            <button class="icon-button ripple menu-button" aria-label="Меню" data-action="menu">
                <span class="material-symbols-rounded">menu</span>
            </button>
        `;

        this.container.innerHTML = `
            <div class="top-app-bar">
                ${menuButtonHtml}
                <div class="title">
                    ${info.title}
                    <span class="subtitle">EMS 103 · Минск</span>
                </div>
                <button class="icon-button ripple" aria-label="Сменить тему" data-action="theme" title="${themeManager.getModeDescription()}">
                    <span class="material-symbols-rounded theme-toggle-icon">${themeManager.getModeIcon()}</span>
                </button>
                <button class="icon-button ripple" aria-label="Поиск (Ctrl+K)" data-action="search" title="Поиск (Ctrl+K)">
                    <span class="material-symbols-rounded">search</span>
                </button>
            </div>
        `;
        
        // Обработчик меню (только если кнопка есть)
        this.container.querySelector('[data-action="menu"]')?.addEventListener('click', () => {
            if (this.menuCallback) this.menuCallback();
        });
        
        this.container.querySelector('[data-action="theme"]')?.addEventListener('click', () => {
            const newMode = themeManager.cycleMode();
            this.updateThemeButton();
            const messages = {
                auto: '🔄 Авто (как в системе)',
                light: '☀️ Светлая тема',
                dark: '🌙 Тёмная тема',
                time: `🕐 По времени (${themeManager.isNightTime() ? 'ночь' : 'день'})`
            };
            window.showSnackbar?.(messages[newMode]);
        });
        
        this.container.querySelector('[data-action="search"]')?.addEventListener('click', () => {
            searchModal.open();
        });
    }
    
    updateThemeButton() {
        const icon = this.container.querySelector('.theme-toggle-icon');
        const button = this.container.querySelector('[data-action="theme"]');
        if (icon) icon.textContent = themeManager.getModeIcon();
        if (button) button.title = themeManager.getModeDescription();
    }

    update(route) {
        this.render(route);
    }

    onMenuClick(callback) {
        this.menuCallback = callback;
    }
}