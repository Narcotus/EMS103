import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class VasPage {
    constructor(container) {
        this.container = container;
        this.painLevel = 0;
        
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
                legalReference: null
            },
            ranges: [
                {
                    min: 0, max: 0,
                    label: 'Нет боли',
                    face: '😌',
                    color: 'vas-0',
                    description: 'Пациент не испытывает болевых ощущений. Анальгезия не требуется.',
                    therapy: 'Наблюдение, немедикаментозные методы при необходимости'
                },
                {
                    min: 1, max: 3,
                    label: 'Слабая боль',
                    face: '😐',
                    color: 'vas-1-3',
                    description: 'Лёгкий дискомфорт, не нарушающий повседневную активность. Пациент может игнорировать боль.',
                    therapy: 'Ненаркотические анальгетики: парацетамол 500-1000 мг, НПВС (ибупрофен 400 мг, кеторолак 30 мг)'
                },
                {
                    min: 4, max: 6,
                    label: 'Умеренная боль',
                    face: '😣',
                    color: 'vas-4-6',
                    description: 'Боль отвлекает, нарушает концентрацию и сон. Пациент активно жалуется.',
                    therapy: 'Слабые опиоиды (трамадол 50-100 мг) + НПВС. Комбинированная анальгезия.'
                },
                {
                    min: 7, max: 10,
                    label: 'Сильная боль',
                    face: '😫',
                    color: 'vas-7-10',
                    description: 'Интенсивная боль, нарушающая все функции. Пациент не может игнорировать боль, выраженный стресс.',
                    therapy: 'Сильные опиоиды (морфин 5-10 мг в/в, фентанил 25-50 мкг в/в) + адъюванты. Титрование до эффекта.'
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-vas',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'vas'
        });

        this.container.innerHTML = `

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
        bindInfoButton(this.data);
    }

    renderResult() {
        const range = this.getCurrentRange();

        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${this.painLevel}</div>
                    <div class="result-score-label">из 10 баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                    <div class="result-therapy">${range.therapy}</div>
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
        return this.getCurrentRange().label;
    }

    getCurrentFace() {
        return this.getCurrentRange().face;
    }

    setupEventListeners() {
        const slider = document.getElementById('vas-slider');
        slider?.addEventListener('input', (e) => {
            this.painLevel = parseInt(e.target.value);
            this.updateUI();
        });

        document.querySelectorAll('.vas-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.painLevel = parseInt(btn.dataset.value);
                this.updateUI();
            });
        });

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    updateUI() {
        const slider = document.getElementById('vas-slider');
        const fill = document.getElementById('vas-fill');
        
        if (slider) slider.value = this.painLevel;
        if (fill) fill.style.width = `${this.painLevel * 10}%`;

        // Обновляем отображение
        const display = document.querySelector('.vas-current-display');
        if (display) {
            display.querySelector('.vas-face').textContent = this.getCurrentFace();
            display.querySelector('.vas-score').textContent = this.painLevel;
            display.querySelector('.vas-label').textContent = this.getCurrentLabel();
        }

        // Обновляем кнопки
        document.querySelectorAll('.vas-quick-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.value) === this.painLevel);
        });

        // Обновляем результат
        this.updateResult();
    }

    resetAll() {
        this.painLevel = 0;
        this.updateUI();
        window.showSnackbar?.('🔄 Результат сброшен');
    }

    updateResult() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
            panel.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
        }
    }
}