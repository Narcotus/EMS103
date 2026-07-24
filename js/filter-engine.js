export class FilterEngine {
    constructor() {
        this.items = [];
        this.filtered = [];
        this.searchQuery = '';
        this.selectedCategories = new Set();
        this.sortOrder = 'alphabet-asc'; // ✅ Всегда А-Я
        this.filterMode = 'and';
    }

    setItems(items) {
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

    setFilterMode(mode) {
        this.filterMode = mode === 'and' ? 'and' : 'or';
    }

    getCategories() {
        const allCats = new Set();
        this.items.forEach(item => {
            item._categories.forEach(cat => allCats.add(cat));
        });
        return [...allCats].sort((a, b) => a.localeCompare(b, 'ru'));
    }

    toggleCategory(category) {
        if (this.selectedCategories.has(category)) {
            this.selectedCategories.delete(category);
        } else {
            this.selectedCategories.add(category);
        }
    }

    clearCategories() {
        this.selectedCategories.clear();
    }

    setSearch(query) {
        this.searchQuery = query.trim().toLowerCase();
    }

    setSort(order) {
        // Игнорируем любые изменения - всегда А-Я
        this.sortOrder = 'alphabet-asc';
    }

    // Циклическое переключение сортировки
    cycleSortOrder() {
        // Не используется - всегда А-Я
        return 'alphabet-asc';
    }

    getSortIcon() {
        return 'arrow_upward'; // Всегда А-Я
    }

    getSortLabel() {
        return 'А-Я'; // Всегда А-Я
    }

    getFiltered() {
        let result = [...this.items];

        // Фильтр по категориям
        if (this.selectedCategories.size > 0) {
            if (this.filterMode === 'and') {
                // AND: элемент должен содержать ВСЕ выбранные категории
                result = result.filter(item => {
                    return [...this.selectedCategories].every(cat => 
                        item._categories.includes(cat)
                    );
                });
            } else {
                // OR: элемент содержит хотя бы одну
                result = result.filter(item => 
                    item._categories.some(cat => this.selectedCategories.has(cat))
                );
            }
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

    getState() {
        return {
            selectedCategories: [...this.selectedCategories],
            searchQuery: this.searchQuery,
            sortOrder: this.sortOrder,
            filterMode: this.filterMode,
            totalCount: this.items.length,
            filteredCount: this.getFiltered().length
        };
    }
}