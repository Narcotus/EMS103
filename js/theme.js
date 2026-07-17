// ============================================
// Theme Manager - управление темами (v2)
// ============================================

export class ThemeManager {
    constructor() {
        this.mode = localStorage.getItem('ems103-theme-mode') || 'auto';
        this.listeners = [];
        
        this.apply();
        this.startTimeWatcher();
        
        // Слушаем изменения системной темы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.mode === 'auto') {
                this.apply();
            }
        });
    }
    
    isNightTime() {
        const hour = new Date().getHours();
        return hour >= 19 || hour < 6;
    }
    
    /**
     * Определяет РЕАЛЬНУЮ тему, которая должна быть применена
     * Возвращает 'light' или 'dark'
     */
    getCurrentTheme() {
        switch (this.mode) {
            case 'light':
                return 'light';
            case 'dark':
                return 'dark';
            case 'time':
                return this.isNightTime() ? 'dark' : 'light';
            case 'auto':
            default:
                return window.matchMedia('(prefers-color-scheme: dark)').matches 
                    ? 'dark' 
                    : 'light';
        }
    }
    
    /**
     * Применяет тему - устанавливает data-theme явно
     */
    apply() {
        const theme = this.getCurrentTheme();
        
        document.body.classList.add('theme-transition');
        
        // ВАЖНО: устанавливаем data-theme явно (light или dark)
        // Это активирует соответствующий блок в CSS
        document.documentElement.setAttribute('data-theme', theme);
        
        // Обновляем theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.removeAttribute('media');
            metaThemeColor.setAttribute('content', 
                theme === 'dark' ? '#181110' : '#8B1A1A'
            );
        }
        
        // Color scheme для нативных элементов
        document.documentElement.style.colorScheme = theme;
        
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
        
        this.listeners.forEach(cb => cb(theme, this.mode));
        return theme;
    }
    
    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('ems103-theme-mode', mode);
        this.apply();
    }
    
    cycleMode() {
        const modes = ['auto', 'light', 'dark', 'time'];
        const currentIndex = modes.indexOf(this.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.setMode(modes[nextIndex]);
        return modes[nextIndex];
    }
    
    startTimeWatcher() {
        this.apply();
        this.timeCheckInterval = setInterval(() => {
            if (this.mode === 'time') {
                this.apply();
            }
        }, 60000);
    }
    
    onChange(callback) {
        this.listeners.push(callback);
    }
    
    getModeIcon() {
        switch (this.mode) {
            case 'light': return 'light_mode';
            case 'dark': return 'dark_mode';
            case 'time': return 'schedule';
            case 'auto':
            default: return 'auto_awesome';
        }
    }
    
    getModeDescription() {
        switch (this.mode) {
            case 'light': return 'Светлая';
            case 'dark': return 'Тёмная';
            case 'time': return `По времени (${this.isNightTime() ? 'ночь' : 'день'})`;
            case 'auto':
            default: return 'Авто (системная)';
        }
    }
}

export const themeManager = new ThemeManager();