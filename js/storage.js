// ============================================
// Storage Manager - управление избранным и недавними
// ============================================

const STORAGE_KEYS = {
    FAVORITES: 'ems103-favorites',
    RECENT: 'ems103-recent',
    THEME: 'ems103-theme-mode',
    SEARCH_HISTORY: 'ems103-search-history'
};

const MAX_RECENT = 15;

class StorageManager {
    /**
     * Читает массив из localStorage
     */
    _read(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Записывает массив в localStorage
     */
    _write(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Storage write error:', e);
        }
    }

    // ============ ИЗБРАННОЕ ============

    /**
     * Получить список избранного
     */
    getFavorites() {
        return this._read(STORAGE_KEYS.FAVORITES);
    }

    /**
     * Проверить, в избранном ли элемент
     */
    isFavorite(id) {
        return this.getFavorites().some(item => item.id === id);
    }

    /**
     * Добавить в избранное
     */
    addFavorite(item) {
        const favorites = this.getFavorites().filter(f => f.id !== item.id);
        favorites.unshift({
            ...item,
            addedAt: new Date().toISOString()
        });
        this._write(STORAGE_KEYS.FAVORITES, favorites);
    }

    /**
     * Удалить из избранного
     */
    removeFavorite(id) {
        const favorites = this.getFavorites().filter(f => f.id !== id);
        this._write(STORAGE_KEYS.FAVORITES, favorites);
    }

    /**
     * Переключить избранное (toggle)
     */
    toggleFavorite(item) {
        if (this.isFavorite(item.id)) {
            this.removeFavorite(item.id);
            return false;
        } else {
            this.addFavorite(item);
            return true;
        }
    }

    /**
     * Очистить всё избранное
     */
    clearFavorites() {
        this._write(STORAGE_KEYS.FAVORITES, []);
    }

    // ============ НЕДАВНИЕ ============

    /**
     * Получить список недавних (макс 15)
     */
    getRecent() {
        return this._read(STORAGE_KEYS.RECENT).slice(0, MAX_RECENT);
    }

    /**
     * Добавить в недавние (или обновить позицию)
     */
    addRecent(item) {
        let recent = this._read(STORAGE_KEYS.RECENT).filter(r => r.id !== item.id);
        recent.unshift({
            ...item,
            viewedAt: new Date().toISOString()
        });
        recent = recent.slice(0, MAX_RECENT);
        this._write(STORAGE_KEYS.RECENT, recent);
    }

    /**
     * Удалить из недавних
     */
    removeRecent(id) {
        const recent = this._read(STORAGE_KEYS.RECENT).filter(r => r.id !== id);
        this._write(STORAGE_KEYS.RECENT, recent);
    }

    /**
     * Очистить всю историю недавних
     */
    clearRecent() {
        this._write(STORAGE_KEYS.RECENT, []);
    }

    // ============ ОБЩЕЕ ============

    /**
     * Очистить все данные приложения
     */
    clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// Singleton
export const storage = new StorageManager();