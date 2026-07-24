/**
 * EMS 103 · Минск
 * Главный модуль: роутинг, тема, UI-компоненты
 */

import { themeManager } from './theme.js';
import { storage } from './storage.js';

window.themeManager = themeManager;

// ============================================
// МАРШРУТЫ
// ============================================

const routes = {
    'home': () => import('./pages/home.js'),
    'calculators': () => import('./pages/calculators.js'),
    'orders': () => import('./pages/orders.js'),
    'guidelines': () => import('./pages/guidelines.js'),
    'cheatsheets': () => import('./pages/cheatsheets.js'),
    
    // Существующие калькуляторы
    'geneva-score': () => import('./pages/geneva-score.js'),
    'glasgow-coma': () => import('./pages/glasgow-coma.js'),
    'four-score': () => import('./pages/four-score.js'),
    'sad-persons': () => import('./pages/sad-persons.js'),
    'pediatric': () => import('./pages/pediatric.js'),
    'apgar': () => import('./pages/apgar.js'),
    'ciwa-ar': () => import('./pages/ciwa-ar.js'),
    'nihss': () => import('./pages/nihss.js'),
    'killip': () => import('./pages/killip.js'),
    'vas': () => import('./pages/vas.js'),
    'fast-ed': () => import('./pages/fast-ed.js'),
    'algover': () => import('./pages/algover.js'),
    'drug-converter': () => import('./pages/drug-converter.js'),
    'pesi-score': () => import('./pages/pesi-score.js'),
    'infusomat': () => import('./pages/infusomat.js'),
    'glasgow-coma-pediatric': () => import('./pages/glasgow-coma-pediatric.js'),
    'odn-scale': () => import('./pages/odn-scale.js'),
    'shsn-scale': () => import('./pages/shsn-scale.js'),
    'sgarbossa': () => import('./pages/sgarbossa.js'),
    'ett-size': () => import('./pages/ett-size.js'),
    'qtc-bazett': () => import('./pages/qtc-bazett.js')
};

const calculatorRoutes = [
    'calculators', 'geneva-score', 'glasgow-coma', 'four-score',
    'sad-persons', 'pediatric', 'apgar', 'ciwa-ar', 'nihss',
    'killip', 'vas', 'fast-ed', 'algover', 'drug-converter',
    'pesi-score', 'infusomat', 'glasgow-coma-pediatric',
    'odn-scale', 'shsn-scale', 'sgarbossa', 'ett-size', 'qtc-bazett'
];

// ============================================
// НАВИГАЦИЯ (5 пунктов)
// ============================================

const navItems = [
    { id: 'home',        icon: 'home',        label: 'Главная',      route: 'home' },
    { id: 'orders',      icon: 'gavel',       label: 'Приказы',      route: 'orders' },
    { id: 'guidelines',  icon: 'menu_book',   label: 'Рекомендации', route: 'guidelines' },
    { id: 'calculators', icon: 'calculate',   label: 'Калькуляторы', route: 'calculators' },
    { id: 'cheatsheets', icon: 'description', label: 'Шпаргалки',    route: 'cheatsheets' }
];

// ============================================
// РЕНДЕРИНГ TOP BAR (оригинальные классы)
// ============================================

function renderTopBar(title = 'EMS 103 · Минск', subtitle = '') {
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;

    topBar.className = 'top-app-bar';
    topBar.innerHTML = `
        <button class="icon-button menu-button" id="menu-btn" aria-label="Меню">
            <span class="material-symbols-rounded">menu</span>
        </button>
        <div class="title">
            ${title}
            ${subtitle ? `<span class="subtitle">${subtitle}</span>` : ''}
        </div>
        <button class="icon-button theme-toggle" id="theme-toggle-btn" aria-label="Переключить тему">
            <span class="material-symbols-rounded theme-icon-light">dark_mode</span>
            <span class="material-symbols-rounded theme-icon-dark">light_mode</span>
        </button>
    `;

    document.getElementById('menu-btn')?.addEventListener('click', toggleDrawer);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', showThemeSelector);
}

// ============================================
// РЕНДЕРИНГ BOTTOM NAV (оригинальные классы)
// ============================================

function renderBottomNav() {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    const currentRoute = window.location.hash.slice(1) || 'home';

    // Функция определения активного пункта
    const isActive = (route) => {
        if (route === 'home') return currentRoute === 'home';
        if (route === 'calculators') {
            // Калькуляторы активны и в списке, и внутри любого калькулятора
            return currentRoute === 'calculators' || calculatorRoutes.includes(currentRoute);
        }
        return currentRoute === route;
    };

    bottomNav.innerHTML = navItems.map(item => `
        <button class="bottom-nav-item ${isActive(item.route) ? 'active' : ''}" data-route="${item.route}">
            <div class="icon-container">
                <span class="material-symbols-rounded">${item.icon}</span>
            </div>
            <span class="label">${item.label}</span>
        </button>
    `).join('');

    bottomNav.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            window.location.hash = item.dataset.route;
        });
    });
}

// ============================================
// РЕНДЕРИНГ NAV DRAWER (оригинальные классы)
// ============================================

function renderNavDrawer() {
    const drawer = document.getElementById('nav-drawer');
    if (!drawer) return;

    const currentRoute = window.location.hash.slice(1) || 'home';

    drawer.innerHTML = `
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
        
        <button class="nav-drawer-item ${currentRoute === 'home' ? 'active' : ''}" data-route="home">
            <span class="material-symbols-rounded">home</span>
            <span>Главная</span>
        </button>
        
        <button class="nav-drawer-item ${currentRoute === 'orders' ? 'active' : ''}" data-route="orders">
            <span class="material-symbols-rounded">gavel</span>
            <span>Приказы</span>
        </button>
        
        <button class="nav-drawer-item ${currentRoute === 'guidelines' ? 'active' : ''}" data-route="guidelines">
            <span class="material-symbols-rounded">menu_book</span>
            <span>Клинические рекомендации</span>
        </button>
        
        <button class="nav-drawer-item ${currentRoute === 'calculators' || calculatorRoutes.includes(currentRoute) ? 'active' : ''}" data-route="calculators">
            <span class="material-symbols-rounded">calculate</span>
            <span>Клинические калькуляторы</span>
        </button>
        
        <button class="nav-drawer-item ${currentRoute === 'cheatsheets' ? 'active' : ''}" data-route="cheatsheets">
            <span class="material-symbols-rounded">description</span>
            <span>Шпаргалки и справка</span>
        </button>
        
        <div class="nav-drawer-divider"></div>
        
        <button class="nav-drawer-item" id="drawer-theme-btn">
        <span class="material-symbols-rounded">${themeManager.getCurrentModeInfo().icon}</span>
        <span>Оформление: ${themeManager.getCurrentModeInfo().title}</span>
    </button>
    `;

    // Навигация
    drawer.querySelectorAll('[data-route]').forEach(item => {
        item.addEventListener('click', () => {
            window.location.hash = item.dataset.route;
            closeDrawer();
        });
    });

    // Тема
    document.getElementById('drawer-theme-btn')?.addEventListener('click', () => {
        closeDrawer();  // Закрываем drawer, чтобы не перекрывал селектор
        showThemeSelector();  // ← СКОБКИ! Вызов функции
    });
}

// ============================================
// DRAWER
// ============================================

function toggleDrawer() {
    const drawer = document.getElementById('nav-drawer');
    const scrim = document.getElementById('scrim');
    const isOpen = drawer?.classList.contains('open');
    
    if (isOpen) {
        closeDrawer();
    } else {
        drawer?.classList.add('open');
        scrim?.classList.add('show');
    }
}

function closeDrawer() {
    document.getElementById('nav-drawer')?.classList.remove('open');
    document.getElementById('scrim')?.classList.remove('show');
}

// ============================================
// СЕЛЕКТОР ТЕМЫ (bottom sheet)
// ============================================

function showThemeSelector() {
    // Удаляем существующий sheet, если есть
    document.getElementById('theme-sheet-wrapper')?.remove();
    
    const modes = [
        { mode: 'auto-system', icon: 'settings_suggest', title: 'По настройкам устройства', desc: 'Следует системной теме' },
        { mode: 'auto-time', icon: 'schedule', title: 'Авто по времени суток', desc: 'Светлая 7:00–20:00, тёмная ночью' },
        { mode: 'light', icon: 'light_mode', title: 'Светлая тема', desc: 'Всегда светлое оформление' },
        { mode: 'dark', icon: 'dark_mode', title: 'Тёмная тема', desc: 'Всегда тёмное оформление' }
    ];
    
    const currentMode = themeManager.getMode();
    
    const wrapper = document.createElement('div');
    wrapper.id = 'theme-sheet-wrapper';
    wrapper.className = 'filter-sheet-wrapper';
    wrapper.innerHTML = `
        <div class="filter-sheet-backdrop"></div>
        <div class="filter-sheet" style="max-width: 480px;">
            <div class="filter-sheet-header">
                <div class="filter-sheet-handle"></div>
                <div class="filter-sheet-title">
                    <span class="material-symbols-rounded">palette</span>
                    Оформление
                </div>
                <button class="filter-sheet-close" aria-label="Закрыть">
                    <span class="material-symbols-rounded">close</span>
                </button>
            </div>
            <div class="filter-sheet-body" style="padding: 8px 12px 20px;">
                ${modes.map(m => `
                    <div class="theme-option ${currentMode === m.mode ? 'selected' : ''}" data-mode="${m.mode}">
                        <div class="theme-option-icon">
                            <span class="material-symbols-rounded">${m.icon}</span>
                        </div>
                        <div class="theme-option-content">
                            <div class="theme-option-title">${m.title}</div>
                            <div class="theme-option-desc">${m.desc}</div>
                        </div>
                        <div class="theme-option-radio">
                            <div class="theme-radio-dot"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(wrapper);
    
    // Анимация открытия
    requestAnimationFrame(() => {
        wrapper.classList.add('open');
    });
    
    // Закрытие
    const close = () => {
        wrapper.classList.remove('open');
        setTimeout(() => wrapper.remove(), 300);
    };
    
    wrapper.querySelector('.filter-sheet-backdrop')?.addEventListener('click', close);
    wrapper.querySelector('.filter-sheet-close')?.addEventListener('click', close);
    
    // Выбор режима
    wrapper.querySelectorAll('.theme-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const newMode = opt.dataset.mode;
            const newTheme = themeManager.setMode(newMode);
            
            // Обновляем UI
            wrapper.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            
            // Обновляем drawer (если открыт)
            renderNavDrawer();
            
            // Показываем snackbar
            const messages = {
                'light': '☀️ Светлая тема',
                'dark': '🌙 Тёмная тема',
                'auto-time': '🕐 Авто по времени суток',
                'auto-system': '📱 По настройкам устройства'
            };
            showSnackbar(messages[newMode]);
            
            // Закрываем через 500мс
            setTimeout(close, 500);
        });
    });
    
    // Закрытие по Esc
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ============================================
// ЗАГОЛОВОК
// ============================================

function updateAppTitle(route) {
    const isCalc = calculatorRoutes.includes(route);
    const title = (route === 'home' || route === '') ? 'Главная · EMS 103 · Минск'
        : isCalc ? 'Калькуляторы · EMS 103 · Минск'
        : 'EMS 103 · Минск';
    
    document.title = title;
}

// ============================================
// РОУТИНГ
// ============================================

async function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const container = document.getElementById('app-content');
    if (!container) return;

    updateAppTitle(hash);
    renderTopBar(
        hash === 'home' ? 'EMS 103 · Минск' : 'Калькуляторы',
        hash === 'home' ? 'Скорая помощь' : ''
    );
    renderBottomNav();
    renderNavDrawer();

    // Скрытие bottom-nav: только на страницах КОНКРЕТНЫХ калькуляторов
    // На списке калькуляторов (#calculators) бар остаётся видимым
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
        // Маршруты конкретных калькуляторов (исключая сам список)
        const specificCalcRoutes = calculatorRoutes.filter(r => r !== 'calculators');
        const isSpecificCalculator = specificCalcRoutes.includes(hash);
        
        if (isSpecificCalculator) {
            bottomNav.style.display = 'none';
        } else {
            bottomNav.style.display = '';
        }
    }

    try {
        const routeLoader = routes[hash];
        if (!routeLoader) {
            container.innerHTML = `
                <div class="page-content">
                    <div class="page-header">
                        <h1>Страница не найдена</h1>
                        <p>Маршрут "${hash}" не существует.</p>
                    </div>
                    <a href="#home">На главную</a>
                </div>
            `;
            return;
        }

        // ✅ Очищаем предыдущую страницу (убирает старые обработчики)
        if (window._currentPage && typeof window._currentPage.cleanup === 'function') {
            window._currentPage.cleanup();
        }

        container.innerHTML = '';
        const module = await routeLoader();
        const PageClass = module.default;
        if (!PageClass) throw new Error(`Страница ${hash} не экспортирует класс`);

        const page = new PageClass(container);
        await page.render();

        // ✅ Сохраняем ссылку на текущую страницу для будущей очистки
        window._currentPage = page;
        window.scrollTo({ top: 0, behavior: 'instant' });

    } catch (error) {
        console.error(`Ошибка ${hash}:`, error);
        container.innerHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h1>Ошибка загрузки</h1>
                    <p>${error.message}</p>
                </div>
                <a href="#home">На главную</a>
            </div>
        `;
    }
}

// ============================================
// SNACKBAR
// ============================================

window.showSnackbar = function(message, duration = 3000) {
    const snackbar = document.getElementById('snackbar');
    if (!snackbar) return;
    snackbar.textContent = message;
    snackbar.classList.add('show');
    setTimeout(() => snackbar.classList.remove('show'), duration);
};

// ============================================
// ЗАПУСК
// ============================================

function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    document.getElementById('scrim')?.addEventListener('click', closeDrawer);

    console.log('🚑 EMS 103 загружен | Тема:', themeManager.isDark() ? 'тёмная' : 'светлая');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}