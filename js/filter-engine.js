// ============================================
// Универсальный движок фильтрации с мультикатегориями
// ============================================

export class FilterEngine {
    constructor() {
        this.items = [];
        this.selectedCategories = new Set();
        this.searchQuery = '';
        this.sortOrder = 'default';
    }

    /**
     * Устанавливает исходные данные
     */
    setItems(items) {
        // Нормализация: поддерживаем и category (старое) и categories (новое)
        this.items = items.map(item => {
            let categories = [];
            if (Array.isArray(item.categories)) {
                categories = item.categories;
            } else if (item.category) {
                categories = [item.category];
            }
            return { ...item, _categories: categories };
        });
    }

    /**
     * Получить все уникальные категории
     */
    getCategories() {
        const allCats = new Set();
        this.items.forEach(item => {
            item._categories.forEach(cat => allCats.add(cat));
        });
        return [...allCats].sort((a, b) => a.localeCompare(b, 'ru'));
    }

    /**
     * Переключить категорию (мульти-выбор)
     */
    toggleCategory(category) {
        if (this.selectedCategories.has(category)) {
            this.selectedCategories.delete(category);
        } else {
            this.selectedCategories.add(category);
        }
    }

    /**
     * Сбросить все категории
     */
    clearCategories() {
        this.selectedCategories.clear();
    }

    /**
     * Установить поисковый запрос
     */
    setSearch(query) {
        this.searchQuery = query.trim().toLowerCase();
    }

    /**
     * Установить сортировку
     */
    setSort(order) {
        this.sortOrder = order;
    }

    /**
     * Получить отфильтрованные элементы
     */
    getFiltered() {
        let result = [...this.items];

        // Фильтр по категориям (OR: элемент входит если есть хотя бы одна из выбранных)
        if (this.selectedCategories.size > 0) {
            result = result.filter(item => 
                item._categories.some(cat => this.selectedCategories.has(cat))
            );
        }

        // Фильтр по поиску
        if (this.searchQuery) {
            const q = this.searchQuery;
            result = result.filter(item => {
                const searchText = [
                    item.title,
                    item.description,
                    item.subtitle,
                    item.number,
                    ...(item.keywords || []),
                    ...(item.aliases || [])
                ].filter(Boolean).join(' ').toLowerCase();
                return searchText.includes(q);
            });
        }

        // Сортировка
        if (this.sortOrder === 'alphabet-asc') {
            result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ru'));
        } else if (this.sortOrder === 'alphabet-desc') {
            result.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'ru'));
        }

        return result;
    }

    /**
     * Получить состояние для UI
     */
    getState() {
        return {
            selectedCategories: [...this.selectedCategories],
            searchQuery: this.searchQuery,
            sortOrder: this.sortOrder,
            totalCount: this.items.length,
            filteredCount: this.getFiltered().length
        };
    }
}