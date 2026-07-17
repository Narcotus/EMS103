// ============================================
// Search Modal - полноэкранный поиск
// ============================================

import { searchEngine } from '../search-engine.js';

export class SearchModal {
    constructor() {
        this.isOpen = false;
        this.container = null;
        this.input = null;
        this.debounceTimer = null;
        this.createModal();
        this.setupKeyboardShortcuts();
    }

    createModal() {
        this.container = document.createElement('div');
        this.container.className = 'search-modal';
        this.container.innerHTML = `
            <div class="search-modal-backdrop"></div>
            <div class="search-modal-content">
                <div class="search-modal-header">
                    <div class="search-input-wrapper">
                        <span class="material-symbols-rounded">search</span>
                        <input 
                            type="text" 
                            class="search-input" 
                            placeholder="Поиск по приложению..."
                            autocomplete="off"
                            spellcheck="false"
                        >
                        <button class="search-clear" aria-label="Очистить">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>
                    <button class="search-close" aria-label="Закрыть">
                        <kbd>Esc</kbd>
                    </button>
                </div>
                <div class="search-modal-body">
                    <div class="search-initial-state">
                        <div class="search-hint">
                            <span class="material-symbols-rounded">lightbulb</span>
                            <span>Попробуйте: <strong>инфаркт</strong>, <strong>СЛР</strong>, <strong>давление</strong>, <strong>больницы</strong></span>
                        </div>
                        <div class="search-shortcuts">
                            <div class="shortcut-item">
                                <kbd>↑</kbd> <kbd>↓</kbd>
                                <span>навигация</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Enter</kbd>
                                <span>открыть</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Esc</kbd>
                                <span>закрыть</span>
                            </div>
                        </div>
                        <div class="search-history"></div>
                    </div>
                    <div class="search-results"></div>
                    <div class="search-empty" style="display: none;">
                        <span class="material-symbols-rounded">search_off</span>
                        <p>Ничего не найдено</p>
                        <small>Попробуйте другие ключевые слова</small>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Кэшируем элементы
        this.input = this.container.querySelector('.search-input');
        this.resultsContainer = this.container.querySelector('.search-results');
        this.initialState = this.container.querySelector('.search-initial-state');
        this.emptyState = this.container.querySelector('.search-empty');
        this.historyContainer = this.container.querySelector('.search-history');
        this.clearButton = this.container.querySelector('.search-clear');

        // Обработчики
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Открытие/закрытие
        this.container.querySelector('.search-modal-backdrop').addEventListener('click', () => this.close());
        this.container.querySelector('.search-close').addEventListener('click', () => this.close());

        // Ввод текста с debounce
        this.input.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleSearch(e.target.value);
            }, 300);
        });

        // Очистка
        this.clearButton.addEventListener('click', () => {
            this.input.value = '';
            this.input.focus();
            this.showInitialState();
        });

        // Навигация клавишами внутри результатов
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateResults(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.openSelected();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K или Cmd+K или /
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === '/' && !this.isInputFocused()) {
                e.preventDefault();
                this.open();
            } else if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    isInputFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    }

    async open() {
        if (this.isOpen) return;
        
        // Инициализируем поиск если ещё не готов
        if (!searchEngine.ready) {
            await searchEngine.init();
        }

        this.isOpen = true;
        this.container.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            this.input.focus();
            this.showHistory();
        }, 100);
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.container.classList.remove('open');
        document.body.style.overflow = '';
        this.input.value = '';
        this.showInitialState();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    showInitialState() {
        this.initialState.style.display = '';
        this.resultsContainer.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.clearButton.style.display = 'none';
    }

    handleSearch(query) {
        query = query.trim();

        if (query.length < 2) {
            this.showInitialState();
            return;
        }

        this.clearButton.style.display = '';

        const results = searchEngine.search(query);

        if (results.total === 0) {
            this.initialState.style.display = 'none';
            this.resultsContainer.style.display = 'none';
            this.emptyState.style.display = '';
            return;
        }

        this.renderResults(results);
    }

    renderResults(results) {
        this.initialState.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.resultsContainer.style.display = '';

        const sections = Object.entries(results.groups).map(([key, group]) => `
            <div class="search-group">
                <div class="search-group-header">
                    <span class="material-symbols-rounded">${group.icon}</span>
                    <span>${group.title}</span>
                    <span class="search-group-count">${group.items.length}</span>
                </div>
                <div class="search-group-items">
                    ${group.items.map(item => `
                        <button class="search-result-item" data-section="${item.section}" data-id="${item.id}">
                            <div class="search-result-icon">
                                <span class="material-symbols-rounded">${item.icon}</span>
                            </div>
                            <div class="search-result-content">
                                <div class="search-result-title">
                                    ${searchEngine.highlight(item.title, results.query)}
                                </div>
                                <div class="search-result-subtitle">
                                    ${searchEngine.highlight(item.subtitle, results.query)}
                                </div>
                            </div>
                            ${item.priority === 'critical' ? '<span class="search-result-badge">критично</span>' : ''}
                            <span class="material-symbols-rounded search-result-arrow">chevron_right</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');

        this.resultsContainer.innerHTML = sections;

        // Обработчики кликов
        this.resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                const id = item.dataset.id;
                searchEngine.addToHistory(this.input.value);
                this.close();
                window.location.hash = section;
                window.showSnackbar?.(`📄 Открыт: ${item.querySelector('.search-result-title').textContent}`);
            });
        });
    }

    showHistory() {
        const history = searchEngine.getHistory();
        
        if (history.length === 0) {
            this.historyContainer.innerHTML = '';
            return;
        }

        this.historyContainer.innerHTML = `
            <div class="search-history-header">
                <span>Недавние поиски</span>
                <button class="search-history-clear">
                    <span class="material-symbols-rounded">delete_sweep</span>
                    Очистить
                </button>
            </div>
            <div class="search-history-items">
                ${history.map(h => `
                    <button class="search-history-item" data-query="${h}">
                        <span class="material-symbols-rounded">history</span>
                        <span>${h}</span>
                    </button>
                `).join('')}
            </div>
        `;

        // Обработчики
        this.historyContainer.querySelectorAll('.search-history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.input.value = item.dataset.query;
                this.handleSearch(item.dataset.query);
            });
        });

        this.historyContainer.querySelector('.search-history-clear')?.addEventListener('click', () => {
            searchEngine.clearHistory();
            this.historyContainer.innerHTML = '';
        });
    }

    navigateResults(direction) {
        const items = this.resultsContainer.querySelectorAll('.search-result-item');
        if (items.length === 0) return;

        const current = this.resultsContainer.querySelector('.search-result-item.selected');
        let index = current ? Array.from(items).indexOf(current) : -1;
        
        index = (index + direction + items.length) % items.length;
        
        items.forEach(item => item.classList.remove('selected'));
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    }

    openSelected() {
        const selected = this.resultsContainer.querySelector('.search-result-item.selected');
        if (selected) {
            selected.click();
        } else {
            const first = this.resultsContainer.querySelector('.search-result-item');
            if (first) first.click();
        }
    }
}

export const searchModal = new SearchModal();