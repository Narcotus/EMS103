// ============================================
// Search Engine - глобальный поиск с алиасами
// ============================================

export class SearchEngine {
    constructor() {
        this.index = [];
        this.ready = false;
    }

    /**
     * Загружает и индексирует все данные
     */
    async init() {
        if (this.ready) return;

        try {
            const [orders, guidelines, calculators, reference] = await Promise.all([
                this.loadJSON('data/orders.json'),
                this.loadJSON('data/guidelines.json'),
                this.loadJSON('data/calculators.json'),
                this.loadJSON('data/reference.json')
            ]);

            // Индексируем каждый раздел
            this.index = [
                ...this.indexSection(orders, 'orders', 'Приказы', 'gavel'),
                ...this.indexSection(guidelines, 'guidelines', 'Протоколы', 'clinical_notes'),
                ...this.indexSection(calculators, 'calculators', 'Калькуляторы', 'calculate'),
                ...this.indexSection(reference, 'reference', 'Справочник', 'menu_book')
            ];

            this.ready = true;
            console.log(`✅ Поиск инициализирован: ${this.index.length} записей`);
        } catch (error) {
            console.error('❌ Ошибка инициализации поиска:', error);
        }
    }

    async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`⚠️ Не удалось загрузить ${url}:`, error);
            return [];
        }
    }

    /**
     * Индексирует секцию данных
     */
    indexSection(items, section, sectionTitle, sectionIcon) {
        return items.map(item => ({
            id: item.id,
            section: section,
            sectionTitle: sectionTitle,
            sectionIcon: sectionIcon,
            title: item.title || item.number || '',
            subtitle: item.description || item.category || item.date || '',
            keywords: item.keywords || [],
            aliases: item.aliases || [],
            priority: item.priority || 'medium',
            icon: item.icon || 'article',
            url: `#${section}`,
            data: item
        }));
    }

    /**
     * Основной метод поиска
     * @param {string} query - поисковый запрос
     * @param {number} limit - макс. количество результатов (по умолчанию 20)
     * @returns {Object} сгруппированные результаты
     */
    search(query, limit = 20) {
        if (!this.ready || !query || query.trim().length < 2) {
            return { results: [], groups: {}, total: 0 };
        }

        const normalizedQuery = this.normalize(query);
        const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);

        // Ищем совпадения
        const matches = this.index
            .map(item => {
                const score = this.calculateScore(item, normalizedQuery, queryWords);
                return { ...item, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => {
                // Сортировка: сначала по score, потом по priority
                if (b.score !== a.score) return b.score - a.score;
                return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
            })
            .slice(0, limit);

        // Группируем по разделам
        const groups = {};
        matches.forEach(item => {
            if (!groups[item.section]) {
                groups[item.section] = {
                    title: item.sectionTitle,
                    icon: item.sectionIcon,
                    items: []
                };
            }
            groups[item.section].items.push(item);
        });

        return {
            results: matches,
            groups: groups,
            total: matches.length,
            query: query
        };
    }

    /**
     * Нормализует строку (lowercase, убирает диакритику)
     */
    normalize(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/ё/g, 'е')
            .replace(/[^a-zа-я0-9\s]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    /**
     * Рассчитывает релевантность
     */
    calculateScore(item, normalizedQuery, queryWords) {
        let score = 0;

        // Полное совпадение с заголовком — максимум
        const normalizedTitle = this.normalize(item.title);
        if (normalizedTitle === normalizedQuery) {
            score += 100;
        } else if (normalizedTitle.includes(normalizedQuery)) {
            score += 50;
        }

        // Совпадение в начале заголовка
        if (normalizedTitle.startsWith(normalizedQuery)) {
            score += 30;
        }

        // Поиск по каждому слову запроса
        queryWords.forEach(word => {
            // В заголовке
            if (normalizedTitle.includes(word)) {
                score += 10;
                if (normalizedTitle.startsWith(word)) score += 5;
            }

            // В подзаголовке
            const normalizedSubtitle = this.normalize(item.subtitle);
            if (normalizedSubtitle.includes(word)) {
                score += 5;
            }

            // В keywords (высокий приоритет)
            if (item.keywords.some(kw => this.normalize(kw).includes(word))) {
                score += 15;
            }

            // В aliases (синонимы — очень важно!)
            if (item.aliases.some(alias => this.normalize(alias).includes(word))) {
                score += 25;
            }

            // Точное совпадение в keywords
            if (item.keywords.some(kw => this.normalize(kw) === word)) {
                score += 20;
            }

            // Точное совпадение в aliases
            if (item.aliases.some(alias => this.normalize(alias) === word)) {
                score += 30;
            }
        });

        // Бонус за priority
        score *= (1 + this.getPriorityWeight(item.priority) / 10);

        return Math.round(score);
    }

    /**
     * Вес приоритета
     */
    getPriorityWeight(priority) {
        const weights = {
            critical: 3,
            high: 2,
            medium: 1,
            low: 0
        };
        return weights[priority] || 0;
    }

    /**
     * Подсвечивает совпадения в тексте
     */
    highlight(text, query) {
        if (!query || !text) return text;
        
        const words = query.split(/\s+/).filter(w => w.length > 1);
        let result = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
            result = result.replace(regex, '<mark>$1</mark>');
        });
        
        return result;
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$1');
    }

    /**
     * Получает историю поиска из localStorage
     */
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem('ems103-search-history') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Добавляет запрос в историю
     */
    addToHistory(query) {
        if (!query || query.trim().length < 2) return;

        let history = this.getHistory();
        history = history.filter(h => h !== query);
        history.unshift(query);
        history = history.slice(0, 5); // последние 5 запросов

        localStorage.setItem('ems103-search-history', JSON.stringify(history));
    }

    /**
     * Очищает историю
     */
    clearHistory() {
        localStorage.removeItem('ems103-search-history');
    }
}

// Singleton
export const searchEngine = new SearchEngine();