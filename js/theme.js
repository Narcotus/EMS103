/**
 * Менеджер темы с 4 режимами:
 * - light (светлая)
 * - dark (тёмная)
 * - auto-time (по времени суток: 7:00-20:00 — светлая)
 * - auto-system (по настройкам устройства)
 */

// ✅ Унифицированный ключ (совпадает с storage.js и index.html)
const MODE_KEY = 'ems_theme';

export const THEME_MODES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO_TIME: 'auto-time',
    AUTO_SYSTEM: 'auto-system'
};

export const THEME_MODE_INFO = {
    [THEME_MODES.LIGHT]: {
        icon: 'light_mode',
        title: 'Светлая тема',
        description: 'Всегда светлое оформление'
    },
    [THEME_MODES.DARK]: {
        icon: 'dark_mode',
        title: 'Тёмная тема',
        description: 'Всегда тёмное оформление'
    },
    [THEME_MODES.AUTO_TIME]: {
        icon: 'schedule',
        title: 'Авто по времени',
        description: 'Светлая с 7:00 до 20:00, тёмная — ночью'
    },
    [THEME_MODES.AUTO_SYSTEM]: {
        icon: 'settings_suggest',
        title: 'По настройкам устройства',
        description: 'Следует системной теме'
    }
};

// Цвета для meta theme-color (синхронизация с адресной строкой)
const META_COLORS = {
    light: '#FEF7FF',
    dark: '#1D1B20'
};

class ThemeManager {
    constructor() {
        this.root = document.documentElement;
        this.currentTheme = 'light';
        this.mode = THEME_MODES.AUTO_SYSTEM;
        this._previousMode = null;  // ✅ Для умного toggle
        this._intervalId = null;
        this._mediaQuery = null;
        this._mediaQueryHandler = null;
        
        this.init();
    }

    init() {
        // Загружаем сохранённый режим
        const saved = this.getSavedMode();
        if (saved && Object.values(THEME_MODES).includes(saved)) {
            this.mode = saved;
        }
        
        this.applyCurrentTheme();
        this.setupListeners();
    }

    setupListeners() {
        // ✅ Сохраняем ссылку для возможности cleanup
        this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this._mediaQueryHandler = () => {
            if (this.mode === THEME_MODES.AUTO_SYSTEM) {
                this.applyCurrentTheme();
            }
        };
        
        this._mediaQuery.addEventListener('change', this._mediaQueryHandler);
        
        // ✅ Interval запускаем ТОЛЬКО когда режим AUTO_TIME
        this._startAutoTimeInterval();
    }

    /**
     * ✅ Запускает interval только для AUTO_TIME
     */
    _startAutoTimeInterval() {
        this._stopAutoTimeInterval();
        
        if (this.mode === THEME_MODES.AUTO_TIME) {
            this._intervalId = setInterval(() => {
                this.applyCurrentTheme();
            }, 60000); // каждую минуту
        }
    }

    /**
     * ✅ Останавливает interval
     */
    _stopAutoTimeInterval() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    /**
     * ✅ Полная очистка ресурсов (для HMR или уничтожения)
     */
    destroy() {
        this._stopAutoTimeInterval();
        
        if (this._mediaQuery && this._mediaQueryHandler) {
            this._mediaQuery.removeEventListener('change', this._mediaQueryHandler);
        }
    }

    /**
     * Определяет какую тему применить в зависимости от режима
     */
    getEffectiveTheme() {
        switch (this.mode) {
            case THEME_MODES.LIGHT:
                return 'light';
            
            case THEME_MODES.DARK:
                return 'dark';
            
            case THEME_MODES.AUTO_SYSTEM:
                return window.matchMedia('(prefers-color-scheme: dark)').matches 
                    ? 'dark' : 'light';
            
            case THEME_MODES.AUTO_TIME: {
                const hour = new Date().getHours();
                return (hour >= 7 && hour < 20) ? 'light' : 'dark';
            }
            
            default:
                return 'light';
        }
    }

    /**
     * Применяет текущую эффективную тему
     */
    applyCurrentTheme() {
        const theme = this.getEffectiveTheme();
        
        // Применяем всегда (не только при изменении) — для корректной инициализации
        this.currentTheme = theme;
        this.root.setAttribute('data-theme', theme);
        
        // Обновляем meta theme-color
        this._updateMetaThemeColor(theme);
        
        // Диспатчим событие
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, mode: this.mode }
        }));
    }

    /**
     * ✅ Обновляет meta theme-color (для адресной строки мобильных)
     */
    _updateMetaThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta && meta.content !== META_COLORS[theme]) {
            meta.content = META_COLORS[theme];
        }
    }

    /**
     * Устанавливает режим темы
     */
    setMode(mode) {
        if (!Object.values(THEME_MODES).includes(mode)) {
            console.warn('⚠️ Неизвестный режим темы:', mode);
            return this.currentTheme;
        }
        
        // ✅ Сохраняем предыдущий режим для умного toggle
        if (this.mode !== mode) {
            this._previousMode = this.mode;
        }
        
        this.mode = mode;
        this.saveMode(mode);
        
        // ✅ Управляем interval в зависимости от режима
        this._startAutoTimeInterval();
        
        this.applyCurrentTheme();
        return this.currentTheme;
    }

    /**
     * ✅ Умное переключение:
     * - Если был auto-режим → переключается на противоположный фиксированный
     * - Если был фиксированный → переключается на противоположный
     * - Сохраняет историю для возможного возврата
     */
    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        const newMode = newTheme === 'dark' ? THEME_MODES.DARK : THEME_MODES.LIGHT;
        return this.setMode(newMode);
    }

    /**
     * ✅ Возврат к предыдущему режиму (если был auto)
     */
    restorePreviousMode() {
        if (this._previousMode) {
            return this.setMode(this._previousMode);
        }
        return this.currentTheme;
    }

    /**
     * Текущий режим
     */
    getMode() {
        return this.mode;
    }

    /**
     * Текущая применённая тема (light/dark)
     */
    getTheme() {
        return this.currentTheme;
    }

    isDark() {
        return this.currentTheme === 'dark';
    }

    isLight() {
        return this.currentTheme === 'light';
    }

    isAuto() {
        return this.mode === THEME_MODES.AUTO_SYSTEM || this.mode === THEME_MODES.AUTO_TIME;
    }

    getSavedMode() {
        try {
            return localStorage.getItem(MODE_KEY);
        } catch (e) {
            console.warn('⚠️ Не удалось прочитать режим темы:', e.message);
            return null;
        }
    }

    saveMode(mode) {
        try {
            localStorage.setItem(MODE_KEY, mode);
            return true;
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить режим темы:', e.message);
            return false;
        }
    }

    /**
     * Информация о текущем режиме
     */
    getCurrentModeInfo() {
        return THEME_MODE_INFO[this.mode] || THEME_MODE_INFO[THEME_MODES.AUTO_SYSTEM];
    }

    /**
     * ✅ Информация о конкретном режиме
     */
    getModeInfo(mode) {
        return THEME_MODE_INFO[mode] || null;
    }

    /**
     * ✅ Список всех доступных режимов (для UI)
     */
    getAllModes() {
        return Object.values(THEME_MODES).map(mode => ({
            mode,
            ...THEME_MODE_INFO[mode],
            active: mode === this.mode
        }));
    }
}

// Singleton — один менеджер на всё приложение
export const themeManager = new ThemeManager();

// ✅ Очистка при выгрузке страницы (на всякий случай)
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        themeManager.destroy();
    });
}