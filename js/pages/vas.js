import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class VasPage {
    constructor(container) {
        this.container = container;
        this.painLevel = 0;
        this._clickHandler = null;
        this._inputHandler = null;
        
        this.data = {
            title: "Шкала ВАШ",
            subtitle: "Визуально-аналоговая шкала боли",
            icon: "sentiment_very_dissatisfied",
            description: "Субъективная оценка интенсивности боли по 10-балльной шкале. Используется для мониторинга эффективности анальгезии и принятия решений о тактике обезболивания.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Визуально-аналоговая шкала (ВАШ, Visual Analog Scale, VAS) — один из наиболее широко используемых инструментов для количественной оценки субъективного ощущения боли. Пациент отмечает на линии длиной 10 см (или 100 мм) точку, соответствующую интенсивности его боли.",
                    "В клинической практике чаще используется упрощённая 10-балльная числовая рейтинговая шкала (NRS, Numeric Rating Scale), где 0 означает отсутствие боли, а 10 — невыносимую боль. Обе шкалы имеют высокую корреляцию и валидность.",
                    "Шкала ВАШ применяется для динамического наблюдения за эффективностью анальгезии, определения тактики обезболивания и оценки качества оказания медицинской помощи. Целевой уровень боли после анальгезии — ≤ 3 баллов."
                ],
                importantNote: "Оценка боли субъективна и зависит от индивидуальных особенностей пациента, культурного контекста и эмоционального состояния. У детей, пожилых и пациентов с когнитивными нарушениями предпочтительнее использовать шкалу лиц Wong-Baker или упрощённые вербальные шкалы.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Ступенчатая анальгезия (ВОЗ)', 
                        formula: '0-3: НПВС → 4-6: слабые опиоиды → 7-10: сильные опиоиды', 
                        example: 'Боль 5/10 → трамадол 50-100 мг + НПВС' 
                    },
                    { 
                        name: 'Целевой уровень', 
                        formula: 'После анальгезии: ≤ 3 баллов', 
                        example: 'Было 8/10, стало 3/10 — эффективная анальгезия' 
                    }
                ],
                quickRules: [
                    { icon: '😌', rule: '0 баллов — нет боли, наблюдение' },
                    { icon: '😐', rule: '1-3 балла — НПВС (парацетамол, ибупрофен)' },
                    { icon: '😣', rule: '4-6 баллов — слабые опиоиды (трамадол) + НПВС' },
                    { icon: '😫', rule: '7-10 баллов — сильные опиоиды (морфин, фентанил)' },
                    { icon: '🎯', rule: 'Целевой уровень после анальгезии ≤ 3 балла' },
                    { icon: '⏱️', rule: 'Оценка через 30 мин после в/в, 60 мин после в/м' }
                ],
                examples: [
                    {
                        scenario: 'Пациент после травмы, боль 6/10, ранее не получал анальгезию',
                        calculation: 'Трамадол 100 мг в/в + кеторолак 30 мг в/в → переоценка через 30 мин'
                    },
                    {
                        scenario: 'Почечная колика, боль 9/10, выраженная вегетативная реакция',
                        calculation: 'Морфин 5-10 мг в/в дробно + спазмолитик → титрование до эффекта'
                    },
                    {
                        scenario: 'Хроническая боль в спине, 3/10 на фоне НПВС',
                        calculation: 'Боль контролируемая (≤ 3) — продолжение текущей терапии'
                    }
                ]
            },
            ranges: [
                {
                    min: 0, max: 0,
                    label: 'Нет боли',
                    face: '😌',
                    color: 'gcs-15',
                    description: 'Пациент не испытывает болевых ощущений. Анальгезия не требуется.',
                    therapy: 'Наблюдение, немедикаментозные методы при необходимости'
                },
                {
                    min: 1, max: 3,
                    label: 'Слабая боль',
                    face: '😐',
                    color: 'gcs-14',
                    description: 'Лёгкий дискомфорт, не нарушающий повседневную активность.',
                    therapy: 'Ненаркотические анальгетики: парацетамол 500-1000 мг, НПВС (ибупрофен 400 мг, кеторолак 30 мг)'
                },
                {
                    min: 4, max: 6,
                    label: 'Умеренная боль',
                    face: '😣',
                    color: 'gcs-11-12',
                    description: 'Боль отвлекает, нарушает концентрацию и сон.',
                    therapy: 'Слабые опиоиды (трамадол 50-100 мг) + НПВС. Комбинированная анальгезия.'
                },
                {
                    min: 7, max: 10,
                    label: 'Сильная боль',
                    face: '😫',
                    color: 'gcs-3',
                    description: 'Интенсивная боль, нарушающая все функции.',
                    therapy: 'Сильные опиоиды (морфин 5-10 мг в/в, фентанил 25-50 мкг в/в) + адъюванты.'
                }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        if (this._inputHandler && this.container) {
            this.container.removeEventListener('input', this._inputHandler, true);
            this._inputHandler = null;
        }
        this.painLevel = 0;
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS
        await loadCalculatorCSS('vas');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-vas',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'vas',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page vas-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Слайдер боли -->
                <div class="vas-slider-card card card-outlined">
                    <div class="vas-current-display">
                        <div class="vas-face">${this.getCurrentFace()}</div>
                        <div class="vas-score">${this.painLevel}</div>
                        <div class="vas-label">${this.getCurrentLabel()}</div>
                    </div>
                    
                    <div class="vas-slider-wrapper">
                        <input type="range" id="vas-slider" class="vas-slider" 
                               min="0" max="10" step="1" value="${this.painLevel}">
                        <div class="vas-slider-track">
                            <div class="vas-slider-fill" id="vas-fill" style="width: ${this.painLevel * 10}%;"></div>
                        </div>
                    </div>

                    <div class="vas-scale-labels">
                        <span>0<br><small>Нет боли</small></span>
                        <span>5<br><small>Умеренная</small></span>
                        <span>10<br><small>Невыносимая</small></span>
                    </div>

                    <div class="vas-quick-buttons">
                        ${Array.from({length: 11}, (_, i) => `
                            <button class="vas-quick-btn ${this.painLevel === i ? 'active' : ''}" data-value="${i}">
                                ${i}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        bindInfoButton(this.data, this.container);
    }

    renderResult() {
        const range = this.getCurrentRange();
        const inlineStyle = getResultInlineStyle(range.color);

        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${this.painLevel}</div>
                    <div class="result-score-label">из 10 баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    ${range.therapy ? `<div class="result-therapy">${range.therapy}</div>` : ''}
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    getCurrentRange() {
        return this.data.ranges.find(r => this.painLevel >= r.min && this.painLevel <= r.max);
    }

    getCurrentLabel() {
        return this.getCurrentRange()?.label || '';
    }

    getCurrentFace() {
        return this.getCurrentRange()?.face || '😐';
    }

    setupEventListeners() {
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }

        // Обработчик input для слайдера
        this._inputHandler = (e) => {
            if (!e.target.matches('#vas-slider')) return;
            this.painLevel = parseInt(e.target.value);
            this.updateUI();
        };
        this.container.addEventListener('input', this._inputHandler, true);

        // Обработчик кликов
        this._clickHandler = (e) => {
            // Кнопка сброса
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }

            // Быстрые кнопки
            const quickBtn = e.target.closest('.vas-quick-btn');
            if (quickBtn && this.container.contains(quickBtn)) {
                e.preventDefault();
                this.painLevel = parseInt(quickBtn.dataset.value);
                this.updateUI();
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
    }

    updateUI() {
        const slider = this.container.querySelector('#vas-slider');
        const fill = this.container.querySelector('#vas-fill');
        
        if (slider) slider.value = this.painLevel;
        if (fill) fill.style.width = `${this.painLevel * 10}%`;

        // Обновляем отображение
        const display = this.container.querySelector('.vas-current-display');
        if (display) {
            const face = display.querySelector('.vas-face');
            const score = display.querySelector('.vas-score');
            const label = display.querySelector('.vas-label');
            if (face) face.textContent = this.getCurrentFace();
            if (score) score.textContent = this.painLevel;
            if (label) label.textContent = this.getCurrentLabel();
        }

        // Обновляем кнопки
        this.container.querySelectorAll('.vas-quick-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === this.painLevel);
        });

        this.updateResult();
    }

    resetAll() {
        this.painLevel = 0;
        this.updateUI();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }
}