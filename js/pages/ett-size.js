import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class EttSizePage {
    constructor(container) {
        this.container = container;
        this.ageValue = null;
        
        this.data = {
            title: "Размер эндотрахеальной трубки",
            subtitle: "Для детей от 1 до 8 лет (формула Коула)",
            icon: "child_care",
            description: "Расчёт внутреннего диаметра (ID) эндотрахеальной трубки с манжетой и без манжеты для детей на основе возраста. Показывает расчётный размер ± 0.5 мм.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Формулы Коула (Cole) являются наиболее распространённым методом подбора размера эндотрахеальной трубки (ЭТТ) у детей старше 1 года. Для ЭТТ без манжеты: ID = 4 + возраст/4. Для ЭТТ с манжетой (низкопрофильной): ID = 3.5 + возраст/4.",
                    "Для грудных детей до 1 года используется фиксированный размер: ЭТТ без манжеты 3.5 мм, ЭТТ с манжетой 3.0 мм (при массе тела > 3.5 кг). Уравнение для трубки с манжетой применимо для ЭТТ с низким профилем и тонкими стенками. При использовании обычной ЭТТ с манжетой следует выбирать на один полный размер меньше.",
                    "Дополнительные трубки на половину размера больше и половину размера меньше вычисленного должны быть доступны во время попыток интубации, независимо от типа ЭТТ."
                ],
                importantNote: "Всегда готовьте три трубки: расчётного размера, на 0.5 мм больше и на 0.5 мм меньше. Формула даёт ориентировочный размер — окончательный выбор определяется при ларингоскопии.",
                legalReference: null
            }
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-ett',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'ett-size'
        });

        this.container.innerHTML = `
            <div class="page-content calc-page">
                <button class="back-button" onclick="window.location.hash='calculators'">
                    <span class="material-symbols-rounded">arrow_back</span>
                    <span>Назад к калькуляторам</span>
                </button>

                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Ввод возраста -->
                <div class="ett-input-section card card-outlined">
                    <label class="ett-input-label">
                        <span class="material-symbols-rounded">calendar_today</span>
                        Возраст ребёнка
                    </label>
                    <div class="ett-input-row">
                        <input type="number" id="age-input" class="ett-age-input" 
                               min="0" max="16" step="0.5" placeholder="—" inputmode="decimal">
                        <span class="ett-age-unit">лет</span>
                    </div>
                    <div class="ett-formulas-hint">
                        Без манжеты: 4 + возраст/4 &nbsp;|&nbsp; С манжетой: 3.5 + возраст/4
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
        if (this.ageValue === null || this.ageValue < 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">введите возраст</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Укажите возраст ребёнка</div>
                        <div class="result-description">От 0 до 16 лет (поддерживаются десятичные значения)</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const age = this.ageValue;
        let uncuffed, cuffed, note = '';

        if (age < 1) {
            uncuffed = 3.5;
            cuffed = 3.0;
            note = 'Для детей < 1 года используются фиксированные размеры';
        } else {
            uncuffed = Math.round((4 + age / 4) * 2) / 2; // округление до 0.5
            cuffed = Math.round((3.5 + age / 4) * 2) / 2;
        }

        const uncuffedRange = [uncuffed - 0.5, uncuffed, uncuffed + 0.5];
        const cuffedRange = [cuffed - 0.5, cuffed, cuffed + 0.5];

        return `
            <div class="result-content result-success ett-result">
                <div class="ett-result-grid">
                    <div class="ett-result-column">
                        <div class="ett-result-type">Без манжеты</div>
                        <div class="ett-result-main">${uncuffed.toFixed(1)} мм</div>
                        <div class="ett-result-range">
                            ${uncuffedRange.map((v, i) => 
                                `<span class="${i === 1 ? 'ett-highlight' : ''}">${v.toFixed(1)}</span>`
                            ).join(' · ')}
                        </div>
                    </div>
                    <div class="ett-result-divider-v"></div>
                    <div class="ett-result-column">
                        <div class="ett-result-type">С манжетой</div>
                        <div class="ett-result-main">${cuffed.toFixed(1)} мм</div>
                        <div class="ett-result-range">
                            ${cuffedRange.map((v, i) => 
                                `<span class="${i === 1 ? 'ett-highlight' : ''}">${v.toFixed(1)}</span>`
                            ).join(' · ')}
                        </div>
                    </div>
                </div>
                ${note ? `<div class="ett-result-note">${note}</div>` : ''}
                <div class="ett-result-tip">Готовьте 3 трубки: −0.5, расчётная, +0.5</div>
                <button class="result-reset" aria-label="Сбросить" style="position:absolute;top:8px;right:8px;width:36px;height:36px;">
                    <span class="material-symbols-rounded" style="font-size:20px;">refresh</span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const ageInput = document.getElementById('age-input');
        ageInput?.addEventListener('input', (e) => {
            let value = parseFloat(e.target.value);
            if (isNaN(value) || e.target.value.trim() === '') {
                this.ageValue = null;
            } else {
                if (value < 0) value = 0;
                if (value > 16) value = 16;
                this.ageValue = value;
            }
            this.updateResult();
        });

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    resetAll() {
        this.ageValue = null;
        const ageInput = document.getElementById('age-input');
        if (ageInput) ageInput.value = '';
        this.updateResult();
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