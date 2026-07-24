import { storage } from '../storage.js';

export default class CheatsheetsPage {
    constructor(container) {
        this.container = container;
        this._clickHandler = null;
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
    }

    async render() {
        this.cleanup();
        
        try {
            storage.addRecent({
                id: 'cheatsheets',
                title: 'Шпаргалки и справка',
                subtitle: 'Справочная информация',
                icon: 'description',
                section: 'cheatsheets'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        // Генерируем roadmap отдельно
        const roadmapItems = [
            { icon: 'emergency_medicine', title: 'Алгоритм СЛР', desc: 'Полный протокол сердечно-лёгочной реанимации' },
            { icon: 'medication', title: 'Экстренные дозы', desc: 'Таблица доз реанимационных препаратов' },
            { icon: 'monitor_heart', title: 'Нормы витальных', desc: 'ЧСС, АД, ЧД по возрастам' },
            { icon: 'air', title: 'Размеры ЭТТ', desc: 'Таблица подбора интубационных трубок' },
            { icon: 'psychology', title: 'Шкалы боли', desc: 'FLACC, Wong-Baker, ВАШ у детей' },
            { icon: 'bolt', title: 'ЭКГ-признаки', desc: 'Распознавание жизнеопасных ритмов' },
            { icon: 'water_drop', title: 'Инфузионная терапия', desc: 'Правило 4-2-1, формулы' },
            { icon: 'local_hospital', title: 'Госпитализация', desc: 'Адреса и профили стационаров Минска' }
        ];

        const roadmapHtml = roadmapItems.map(item => `
            <div class="cheatsheets-roadmap-item">
                <div class="cheatsheets-roadmap-item-icon">
                    <span class="material-symbols-rounded">${item.icon}</span>
                </div>
                <div class="cheatsheets-roadmap-item-content">
                    <div class="cheatsheets-roadmap-item-title">${item.title}</div>
                    <div class="cheatsheets-roadmap-item-desc">${item.desc}</div>
                </div>
                <div class="cheatsheets-roadmap-item-status">
                    <span class="material-symbols-rounded">hourglass_empty</span>
                </div>
            </div>
        `).join('');

        this.container.innerHTML = `
            <div class="page-content cheatsheets-page">
                <div class="page-header">
                    <h1>Шпаргалки и справка</h1>
                    <p>Быстрые справочные таблицы и памятки</p>
                </div>
                
                <div class="cheatsheets-hero card card-elevated">
                    <div class="cheatsheets-hero-icon">
                        <span class="material-symbols-rounded">construction</span>
                    </div>
                    <div class="cheatsheets-hero-content">
                        <h2>Раздел в разработке</h2>
                        <p>Здесь будут удобные шпаргалки, справочные таблицы и памятки для повседневной работы бригад СМП</p>
                    </div>
                </div>

                <div class="cheatsheets-roadmap">
                    <div class="cheatsheets-roadmap-title">
                        <span class="material-symbols-rounded">route</span>
                        <span>Планируемые разделы</span>
                    </div>
                    <div class="cheatsheets-roadmap-grid">
                        ${roadmapHtml}
                    </div>
                </div>

                <div class="cheatsheets-feedback card card-outlined">
                    <div class="cheatsheets-feedback-icon">
                        <span class="material-symbols-rounded">lightbulb</span>
                    </div>
                    <div class="cheatsheets-feedback-content">
                        <div class="cheatsheets-feedback-title">Есть идея для шпаргалки?</div>
                        <div class="cheatsheets-feedback-desc">Напишите нам — какие справочные материалы были бы вам полезны в работе</div>
                    </div>
                    <button class="md-button md-button-tonal cheatsheets-feedback-btn" data-action="suggest">
                        <span class="material-symbols-rounded">send</span>
                        Предложить
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        this._clickHandler = (e) => {
            const suggestBtn = e.target.closest('[data-action="suggest"]');
            if (suggestBtn && this.container.contains(suggestBtn)) {
                e.preventDefault();
                window.showSnackbar?.('Спасибо! Обратная связь будет добавлена в следующей версии');
                return;
            }
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }
}