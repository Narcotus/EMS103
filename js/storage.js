/**
 * Storage wrapper с защитой от переполнения
 */

const MAX_ITEM_SIZE = 4096; // 4 КБ на элемент (безопасный лимит)
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4 МБ общий лимит

class Storage {
    constructor() {
        this.recentKey = 'recent-calculators';
        this.favoritesKey = 'favorite-calculators';
        this.historyKey = 'calculation-history';
        this.maxRecent = 10;
        this.maxHistory = 50;
    }

    /**
     * Безопасное сохранение в LocalStorage
     */
    safeSet(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            
            // Проверка размера элемента
            if (jsonString.length > MAX_ITEM_SIZE) {
                console.warn(`⚠️ Данные для ключа "${key}" слишком велики (${jsonString.length} байт), обрезаем`);
                return this.setWithTruncation(key, value);
            }
            
            // Проверка общего размера
            if (!this.checkTotalQuota(jsonString.length)) {
                console.warn('⚠️ LocalStorage переполнен, очищаем старые данные');
                this.cleanup();
            }
            
            localStorage.setItem(key, jsonString);
            return true;
        } catch (error) {
            console.error(`❌ Ошибка сохранения в LocalStorage (${key}):`, error);
            
            // Если QuotaExceededError — пытаемся очистить
            if (error.name === 'QuotaExceededError' || 
                error.code === 22 || 
                error.code === 1014) {
                this.cleanup();
                // Повторная попытка
                try {
                    const jsonString = JSON.stringify(value);
                    localStorage.setItem(key, jsonString);
                    return true;
                } catch (retryError) {
                    console.error('❌ Повторная попытка не удалась:', retryError);
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * Сохранение с обрезкой данных
     */
    setWithTruncation(key, value) {
        try {
            if (Array.isArray(value)) {
                // Для массивов — уменьшаем количество элементов
                const truncated = value.slice(0, Math.floor(value.length / 2));
                return this.safeSet(key, truncated);
            }
            
            if (typeof value === 'object' && value !== null) {
                // Для объектов — удаляем большие поля
                const truncated = {};
                for (const [k, v] of Object.entries(value)) {
                    if (typeof v === 'string' && v.length > 500) {
                        truncated[k] = v.substring(0, 500) + '...';
                    } else {
                        truncated[k] = v;
                    }
                }
                return this.safeSet(key, truncated);
            }
            
            return false;
        } catch (error) {
            console.error('❌ Ошибка обрезки данных:', error);
            return false;
        }
    }

    /**
     * Проверка общего размера LocalStorage
     */
    checkTotalQuota(newDataSize = 0) {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
            return (totalSize + newDataSize) < MAX_TOTAL_SIZE;
        } catch (error) {
            return true; // Если не можем проверить — разрешаем
        }
    }

    /**
     * Очистка старых данных
     */
    cleanup() {
        try {
            // Удаляем историю (самая большая)
            localStorage.removeItem(this.historyKey);
            
            // Обрезаем недавние до 5
            const recent = this.getRecent();
            if (recent.length > 5) {
                this.safeSet(this.recentKey, recent.slice(0, 5));
            }
            
            console.log('✅ LocalStorage очищен');
        } catch (error) {
            console.error('❌ Ошибка очистки:', error);
        }
    }

    /**
     * Безопасное чтение из LocalStorage
     */
    safeGet(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`❌ Ошибка чтения из LocalStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Добавить в недавние
     */
    addRecent(item) {
        const recent = this.getRecent();
        const filtered = recent.filter(r => r.id !== item.id);
        filtered.unshift(item);
        
        if (filtered.length > this.maxRecent) {
            filtered.length = this.maxRecent;
        }
        
        return this.safeSet(this.recentKey, filtered);
    }

    /**
     * Получить недавние
     */
    getRecent() {
        return this.safeGet(this.recentKey, []);
    }

    /**
     * Добавить в избранное
     */
    addFavorite(id) {
        const favorites = this.getFavorites();
        if (!favorites.includes(id)) {
            favorites.push(id);
            return this.safeSet(this.favoritesKey, favorites);
        }
        return true;
    }

    /**
     * Удалить из избранного
     */
    removeFavorite(id) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(f => f !== id);
        return this.safeSet(this.favoritesKey, filtered);
    }

    /**
     * Получить избранное
     */
    getFavorites() {
        return this.safeGet(this.favoritesKey, []);
    }

    /**
     * Проверить, в избранном ли
     */
    isFavorite(id) {
        return this.getFavorites().includes(id);
    }

    /**
     * Добавить в историю расчётов
     */
    addHistory(calculatorId, result) {
        const history = this.getHistory();
        history.unshift({
            id: calculatorId,
            result: result,
            timestamp: Date.now()
        });
        
        if (history.length > this.maxHistory) {
            history.length = this.maxHistory;
        }
        
        return this.safeSet(this.historyKey, history);
    }

    /**
     * Получить историю
     */
    getHistory() {
        return this.safeGet(this.historyKey, []);
    }

    /**
     * Очистить историю
     */
    clearHistory() {
        localStorage.removeItem(this.historyKey);
    }

    /**
     * Полная очистка
     */
    clearAll() {
        localStorage.clear();
        console.log('✅ Все данные удалены');
    }
}

export const storage = new Storage();