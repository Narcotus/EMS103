/**
 * Storage wrapper с защитой от переполнения
 * Единая точка доступа к localStorage с безопасной записью
 */

const MAX_ITEM_SIZE = 100 * 1024;        // 100 КБ на элемент
const MAX_TOTAL_SIZE = 4 * 1024 * 1024;  // 4 МБ общий лимит
const MAX_RECENT_ITEMS = 15;             // Максимум записей в истории
const MAX_HISTORY_ITEMS = 50;            // Максимум записей в истории расчётов

class Storage {
    constructor() {
        // ✅ Единые ключи — используем везде только их
        this.recentKey = 'ems_recent';
        this.favoritesKey = 'ems_favorites';
        this.historyKey = 'ems_history';
        this.themeKey = 'ems_theme';
        this.migratedKey = 'ems_migrated_v2';
        
        // ✅ Миграция старых ключей (один раз)
        this._migrateOldKeys();
    }

    // ============================================
    // БЕЗОПАСНЫЕ БАЗОВЫЕ МЕТОДЫ
    // ============================================

    /**
     * Безопасное чтение из localStorage
     */
    safeGet(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (!value) return defaultValue;
            return JSON.parse(value);
        } catch (error) {
            console.error(`❌ Ошибка чтения "${key}":`, error);
            try { localStorage.removeItem(key); } catch (e) {}
            return defaultValue;
        }
    }

    /**
     * Безопасная запись в localStorage с защитой от квоты
     */
    safeSet(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            
            // Защита от огромных данных
            if (jsonString.length > MAX_ITEM_SIZE) {
                console.warn(`⚠️ Данные "${key}" слишком велики (${jsonString.length} байт) — не сохраняем`);
                return false;
            }
            
            // Проверка общей квоты
            if (!this._checkTotalQuota(jsonString.length)) {
                console.warn('⚠️ LocalStorage заполнен, очищаем старые данные');
                this._cleanup();
            }
            
            localStorage.setItem(key, jsonString);
            return true;
        } catch (error) {
            // Обработка QuotaExceededError
            if (this._isQuotaError(error)) {
                console.warn('⚠️ Quota exceeded, очищаем и пробуем снова');
                this._cleanup();
                
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (retryError) {
                    console.error('❌ Повторная попытка не удалась:', retryError);
                    return false;
                }
            }
            
            console.error(`❌ Ошибка сохранения "${key}":`, error);
            return false;
        }
    }

    /**
     * Проверка, что ошибка — QuotaExceeded
     */
    _isQuotaError(error) {
        return error.name === 'QuotaExceededError' ||
               error.code === 22 ||
               error.code === 1014 ||
               (error.message && error.message.toLowerCase().includes('quota'));
    }

    /**
     * Проверка общего размера localStorage
     */
    _checkTotalQuota(newDataSize = 0) {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + (value?.length || 0);
            }
            return (totalSize + newDataSize) < MAX_TOTAL_SIZE;
        } catch {
            return true;
        }
    }

    /**
     * ✅ Улучшенная очистка: 3 уровня агрессивности
     */
    _cleanup() {
        try {
            // Уровень 1: Удаляем историю расчётов (самый большой объём)
            localStorage.removeItem(this.historyKey);
            
            // Уровень 2: Обрезаем недавние до 5 записей
            const recent = this.getRecent();
            if (recent.length > 5) {
                this.safeSet(this.recentKey, recent.slice(0, 5));
            }
            
            // Уровень 3: Если всё ещё мало места — удаляем недавние полностью
            if (!this._checkTotalQuota(1024)) {
                console.warn('⚠️ Критическое переполнение, удаляем недавние');
                localStorage.removeItem(this.recentKey);
            }
            
            console.log('✅ LocalStorage очищен');
        } catch (error) {
            console.error('❌ Ошибка очистки:', error);
            this.clearAll();
        }
    }

    // ============================================
    // НЕДАВНИЕ (Recent)
    // ============================================

    addRecent(item) {
        try {
            let recent = this.getRecent();
            
            // Валидация входных данных
            if (!item || !item.id) {
                console.warn('⚠️ addRecent: некорректный item', item);
                return false;
            }
            
            // Удаляем дубликат, если есть
            recent = recent.filter(r => r.id !== item.id);
            
            // ✅ Добавляем в начало с timestamp И ВСЕМИ НУЖНЫМИ ПОЛЯМИ
            recent.unshift({
                id: String(item.id),
                title: String(item.title || '').substring(0, 100),
                subtitle: String(item.subtitle || '').substring(0, 100),
                icon: String(item.icon || 'article'),
                section: String(item.section || ''),
                // ✅ НОВОЕ: сохраняем source для цветных иконок
                source: String(item.source || this._detectSource(item)),
                viewedAt: new Date().toISOString()
            });
            
            // ✅ Ограничиваем размер
            recent = recent.slice(0, MAX_RECENT_ITEMS);
            
            return this.safeSet(this.recentKey, recent);
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить в историю:', e.message);
            return false;
        }
    }

    /**
     * ✅ Автоопределение source по section/id (fallback)
     */
    _detectSource(item) {
        const section = String(item.section || '').toLowerCase();
        const id = String(item.id || '').toLowerCase();
        
        if (section === 'calculators' || id.startsWith('calc-')) return 'calculators';
        if (section === 'references' || id.startsWith('ref-')) return 'references';
        if (section === 'guidelines' || id.startsWith('guideline-')) return 'guidelines';
        if (section === 'orders' || id.startsWith('order-')) return 'orders';
        
        return 'default';
    }

    getRecent() {
        const data = this.safeGet(this.recentKey, []);
        return Array.isArray(data) ? data : [];
    }

    removeRecent(id) {
        try {
            const recent = this.getRecent();
            const filtered = recent.filter(r => r.id !== String(id));
            return this.safeSet(this.recentKey, filtered);
        } catch (e) {
            console.warn('⚠️ Не удалось удалить из истории:', e.message);
            return false;
        }
    }

    clearRecent() {
        try {
            localStorage.removeItem(this.recentKey);
            return true;
        } catch (e) {
            console.warn('⚠️ Не удалось очистить историю:', e.message);
            return false;
        }
    }

    // ============================================
    // ИЗБРАННОЕ (Favorites)
    // ============================================

    addFavorite(id) {
        try {
            const favorites = this.getFavorites();
            const idStr = String(id);
            if (!favorites.includes(idStr)) {
                favorites.push(idStr);
                return this.safeSet(this.favoritesKey, favorites);
            }
            return true;
        } catch (error) {
            console.error('❌ Ошибка addFavorite:', error);
            return false;
        }
    }

    removeFavorite(id) {
        try {
            const favorites = this.getFavorites();
            const filtered = favorites.filter(f => f !== String(id));
            return this.safeSet(this.favoritesKey, filtered);
        } catch (error) {
            console.error('❌ Ошибка removeFavorite:', error);
            return false;
        }
    }

    getFavorites() {
        const data = this.safeGet(this.favoritesKey, []);
        return Array.isArray(data) ? data : [];
    }

    clearFavorites() {
        try {
            localStorage.removeItem(this.favoritesKey);
            return true;
        } catch (error) {
            console.error('❌ Ошибка clearFavorites:', error);
            return false;
        }
    }

    isFavorite(id) {
        return this.getFavorites().includes(String(id));
    }

    // ============================================
    // ИСТОРИЯ РАСЧЁТОВ (History)
    // ============================================

    addHistory(calculatorId, result) {
        try {
            const history = this.getHistory();
            
            const entry = {
                id: String(calculatorId || ''),
                result: this._compactResult(result),
                timestamp: Date.now()
            };
            
            history.unshift(entry);
            
            if (history.length > MAX_HISTORY_ITEMS) {
                history.length = MAX_HISTORY_ITEMS;
            }
            
            return this.safeSet(this.historyKey, history);
        } catch (error) {
            console.error('❌ Ошибка addHistory:', error);
            return false;
        }
    }

    _compactResult(result) {
        if (result === null || result === undefined) return null;
        
        if (typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean') {
            return result;
        }
        
        if (typeof result === 'object' && !Array.isArray(result)) {
            const compact = {};
            for (const [k, v] of Object.entries(result)) {
                if (typeof v === 'string') compact[k] = v.substring(0, 200);
                else if (typeof v === 'number' || typeof v === 'boolean') compact[k] = v;
            }
            return compact;
        }
        
        return null;
    }

    getHistory() {
        const data = this.safeGet(this.historyKey, []);
        return Array.isArray(data) ? data : [];
    }

    clearHistory() {
        try {
            localStorage.removeItem(this.historyKey);
            return true;
        } catch (error) {
            console.error('❌ Ошибка clearHistory:', error);
            return false;
        }
    }

    // ============================================
    // ТЕМА (Theme)
    // ============================================

    /**
     * ✅ Получить текущий режим темы
     */
    getThemeMode() {
        try {
            return localStorage.getItem(this.themeKey) || 'auto-system';
        } catch {
            return 'auto-system';
        }
    }

    /**
     * ✅ Установить режим темы
     */
    setThemeMode(mode) {
        try {
            localStorage.setItem(this.themeKey, mode);
            return true;
        } catch (e) {
            console.warn('⚠️ Не удалось сохранить режим темы:', e.message);
            return false;
        }
    }

    // ============================================
    // МИГРАЦИЯ И ОЧИСТКА
    // ============================================

    /**
     * Миграция старых ключей в новые (один раз)
     */
    _migrateOldKeys() {
        try {
            // Проверяем, была ли уже миграция
            if (localStorage.getItem(this.migratedKey)) return;
            
            const oldKeysMap = {
                'recent-calculators': this.recentKey,
                'favorite-calculators': this.favoritesKey,
                'calculation-history': this.historyKey,
                'app-theme-mode': this.themeKey
            };
            
            for (const [oldKey, newKey] of Object.entries(oldKeysMap)) {
                const value = localStorage.getItem(oldKey);
                if (value !== null) {
                    try {
                        localStorage.setItem(newKey, value);
                        localStorage.removeItem(oldKey);
                        console.log(`✅ Миграция: ${oldKey} → ${newKey}`);
                    } catch (e) {
                        console.warn(`⚠️ Не удалось мигрировать ${oldKey}`);
                    }
                }
            }
            
            localStorage.setItem(this.migratedKey, '1');
        } catch (error) {
            console.error('❌ Ошибка миграции:', error);
        }
    }

    /**
     * Полная очистка (сохраняем тему)
     */
    clearAll() {
        try {
            const theme = localStorage.getItem(this.themeKey);
            const migrated = localStorage.getItem(this.migratedKey);
            
            localStorage.clear();
            
            if (theme) localStorage.setItem(this.themeKey, theme);
            if (migrated) localStorage.setItem(this.migratedKey, migrated);
            
            console.log('✅ Все данные удалены (тема сохранена)');
            return true;
        } catch (error) {
            console.error('❌ Ошибка clearAll:', error);
            try { localStorage.clear(); } catch (e) {}
            return false;
        }
    }
}

export const storage = new Storage();