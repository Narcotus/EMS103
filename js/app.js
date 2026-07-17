import { TopBar } from './components/top-bar.js';
import { Drawer } from './components/drawer.js';
import { BottomNav } from './components/bottom-nav.js';
import { Router } from './router.js';
import { themeManager } from './theme.js';

class App {
    constructor() {
        this.topBar = null;
        this.drawer = null;
        this.bottomNav = null;
        this.router = null;
    }

    async init() {
        console.log('🚑 EMS 103 запуск...');
        console.log(`🎨 Тема: ${themeManager.getModeDescription()}`);
        
        this.topBar = new TopBar('top-bar');
        this.drawer = new Drawer('nav-drawer');
        this.bottomNav = new BottomNav('bottom-nav');
        
        // Роутер с маршрутами
        this.router = new Router('app-content', {
            home: () => import('./pages/home.js'),
            orders: () => import('./pages/orders.js'),
            guidelines: () => import('./pages/guidelines.js'),
            calculators: () => import('./pages/calculators.js'),
            reference: () => import('./pages/reference.js'),
            favorites: () => import('./pages/favorites.js'),
            recent: () => import('./pages/recent.js'),
            'geneva-score': () => import('./pages/geneva-score.js'),
            'pesi-score': () => import('./pages/pesi-score.js'),
            'glasgow-coma': () => import('./pages/glasgow-coma.js')
        });

        this.router.onRouteChange((route) => {
            this.topBar.update(route);
            this.drawer.setActive(route);
            this.bottomNav.setActive(route);
        });

        this.setupNavigation();

        const initialRoute = window.location.hash.replace('#', '') || 'home';
        await this.router.navigate(initialRoute);

        this.setupScrollListener();
    }

    setupNavigation() {
        this.topBar.onMenuClick(() => this.drawer.toggle());
        
        document.getElementById('scrim')?.addEventListener('click', () => {
            this.drawer.close();
        });

        this.drawer.onItemClick((route) => {
            this.router.navigate(route);
            this.drawer.close();
        });

        this.bottomNav.onItemClick((route) => {
            this.router.navigate(route);
        });
    }

    setupScrollListener() {
        const topBar = document.querySelector('.top-app-bar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                topBar?.classList.add('scrolled');
            } else {
                topBar?.classList.remove('scrolled');
            }
        }, { passive: true });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(err => {
        console.error('Ошибка запуска:', err);
    });
});

window.showSnackbar = function(message, duration = 3000) {
    const snackbar = document.getElementById('snackbar');
    if (!snackbar) return;
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => snackbar.classList.remove('show'), duration);
};