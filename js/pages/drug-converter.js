import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle, 
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class DrugConverterPage {
    constructor(container) {
        this.container = container;
        this.mode = 'dose';
        
        this.concentrationPercent = null;
        this.concentrationMgMl = null;
        this.doseMg = null;
        this.dosePerKg = null;
        this.weightKg = null;
        
        this._clickHandler = null;
        this._inputHandler = null;
        
        this.data = {
            title: "Перевод мг ↔ мл ↔ %",
            subtitle: "Конвертер концентраций и расчёт объёмов",
            icon: "medication",
            description: "Перевод между миллиграммами, миллилитрами и процентными растворами. Расчёт объёма препарата для заданной дозы или дозы на килограмм массы тела.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Процентный раствор означает количество граммов вещества в 100 мл раствора. Например, 1% раствор содержит 1 г (1000 мг) в 100 мл, то есть 10 мг/мл. Формула: концентрация (мг/мл) = % × 10.",
                    "Для расчёта объёма в мл используется формула: объём = требуемая доза (мг) / концентрация (мг/мл). При дозировании по массе тела: объём = (доза мг/кг × вес кг) / концентрация (мг/мл).",
                    "Важно: расчётный объём является ориентировочным. Перед введением всегда проверяйте концентрацию на ампуле, срок годности, прозрачность раствора и совместимость с другими препаратами."
                ],
                importantNote: "Калькулятор предназначен для взрослых. Для детей используйте педиатрические дозировки и калькулятор Брослоу. Всегда учитывайте максимальные разовые и суточные дозы, скорость введения и противопоказания.",
                legalReference: null,
                formulas: [
                    { name: 'Концентрация % → мг/мл', formula: 'мг/мл = % × 10', example: '1% = 10 мг/мл' },
                    { name: 'Концентрация мг/мл → %', formula: '% = мг/мл ÷ 10', example: '10 мг/мл = 1%' },
                    { name: 'Объём по дозе', formula: 'V(мл) = доза(мг) ÷ конц(мг/мл)', example: '10 мг ÷ 1 мг/мл = 10 мл' },
                    { name: 'Объём по весу', formula: 'V(мл) = (доза(мг/кг) × вес(кг)) ÷ конц(мг/мл)', example: '(2 мг/кг × 70 кг) ÷ 10 мг/мл = 14 мл' }
                ],
                quickRules: [
                    { icon: '💡', rule: '1% раствор = 10 мг/мл' },
                    { icon: '💡', rule: '0.1% раствор = 1 мг/мл (адреналин, атропин)' },
                    { icon: '💡', rule: '10% раствор = 100 мг/мл' },
                    { icon: '⚠️', rule: 'Всегда проверяйте концентрацию на ампуле' },
                    { icon: '⚠️', rule: 'Для объёмов < 0.1 мл используйте более разведённый раствор' },
                    { icon: '⚠️', rule: 'Для объёмов > 20 мл пересчитайте дозу или концентрацию' }
                ],
                commonConcentrations: [
                    { drug: 'Адреналин', concentration: '0.1%', mgMl: 1 },
                    { drug: 'Атропин', concentration: '0.1%', mgMl: 1 },
                    { drug: 'Димедрол', concentration: '1%', mgMl: 10 },
                    { drug: 'Супрастин', concentration: '2%', mgMl: 20 },
                    { drug: 'Диазепам', concentration: '0.5%', mgMl: 5 },
                    { drug: 'Фуросемид', concentration: '1%', mgMl: 10 },
                    { drug: 'Анальгин', concentration: '50%', mgMl: 500 },
                    { drug: 'Глюкоза', concentration: '40%', mgMl: 400 }
                ],
                examples: [
                    { scenario: 'Пациент 70 кг, доза 2 мг/кг, концентрация 10 мг/мл', calculation: 'Объём = (2 × 70) ÷ 10 = 140 ÷ 10 = 14 мл' },
                    { scenario: 'Нужно ввести 5 мг диазепама (0.5% = 5 мг/мл)', calculation: 'Объём = 5 ÷ 5 = 1 мл' },
                    { scenario: 'Концентрация 0.1% адреналина', calculation: 'мг/мл = 0.1 × 10 = 1 мг/мл' }
                ]
            },
            modes: [
                { id: 'concentration', label: 'Концентрация', icon: 'science', subtitle: '% ↔ мг/мл' },
                { id: 'dose', label: 'По дозе', icon: 'syringe', subtitle: 'мг → мл' },
                { id: 'weight', label: 'По весу', icon: 'scale', subtitle: 'мг/кг → мл' }
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
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('drug-converter');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-drug',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'drug-converter'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.renderFullPage();
        this.setupEventListeners();
        // ✅ Передаём контейнер для привязки кнопки ℹ
        bindInfoButton(this.data, this.container);
    }

    renderFullPage() {
        this.container.innerHTML = `
            <div class="page-content calc-page drug-converter-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="drug-mode-switcher">
                    ${this.data.modes.map(m => `
                        <button class="drug-mode-btn ${this.mode === m.id ? 'active' : ''}" data-mode="${m.id}">
                            <span class="material-symbols-rounded">${m.icon}</span>
                            <div class="drug-mode-content">
                                <div class="drug-mode-label">${m.label}</div>
                                <div class="drug-mode-subtitle">${m.subtitle}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <div class="drug-input-card card card-outlined">
                    <div class="drug-input-title">
                        <span class="material-symbols-rounded">science</span>
                        Концентрация препарата
                    </div>
                    <div class="drug-input-row">
                        <input type="number" id="conc-percent" class="drug-field" 
                               min="0" max="100" step="0.01" placeholder="—" inputmode="decimal"
                               value="${this.concentrationPercent ?? ''}">
                        <span class="drug-unit">%</span>
                        <span class="drug-separator">=</span>
                        <input type="number" id="conc-mgml" class="drug-field" 
                               min="0" max="10000" step="0.01" placeholder="—" inputmode="decimal"
                               value="${this.concentrationMgMl ?? ''}">
                        <span class="drug-unit">мг/мл</span>
                    </div>
                    <div class="drug-hint">1% = 10 мг/мл</div>
                </div>

                ${this.mode === 'dose' ? `
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">syringe</span>
                            Требуемая доза
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="dose-mg" class="drug-field" 
                                   min="0" max="10000" step="0.1" placeholder="—" inputmode="decimal"
                                   value="${this.doseMg ?? ''}">
                            <span class="drug-unit">мг</span>
                        </div>
                    </div>
                ` : ''}

                ${this.mode === 'weight' ? `
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">scale</span>
                            Доза на массу тела
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="dose-perkg" class="drug-field" 
                                   min="0" max="100" step="0.01" placeholder="—" inputmode="decimal"
                                   value="${this.dosePerKg ?? ''}">
                            <span class="drug-unit">мг/кг</span>
                        </div>
                    </div>
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">person</span>
                            Масса тела пациента
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="weight-kg" class="drug-field" 
                                   min="1" max="300" step="0.1" placeholder="—" inputmode="decimal"
                                   value="${this.weightKg ?? ''}">
                            <span class="drug-unit">кг</span>
                        </div>
                    </div>
                ` : ''}

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;
    }

    renderResult() {
        if (this.mode === 'concentration') {
            if (this.concentrationPercent === null && this.concentrationMgMl === null) {
                return this.renderEmpty('Введите концентрацию', '% или мг/мл');
            }
            return this.renderConcentrationResult();
        }

        if (this.mode === 'dose') {
            if (this.concentrationMgMl === null || this.doseMg === null || this.concentrationMgMl === 0) {
                return this.renderEmpty('Введите концентрацию и дозу', 'для расчёта объёма');
            }
            return this.renderVolumeResult(this.doseMg / this.concentrationMgMl, this.doseMg);
        }

        if (this.mode === 'weight') {
            if (!this.concentrationMgMl || this.dosePerKg === null || this.weightKg === null) {
                return this.renderEmpty('Заполните все поля', 'концентрация, мг/кг, вес');
            }
            const totalDose = this.dosePerKg * this.weightKg;
            return this.renderVolumeResult(totalDose / this.concentrationMgMl, totalDose, true);
        }
    }

    renderEmpty(label, description) {
        return `
            <div class="result-content result-incomplete drug-result">
                <div class="result-score">
                    <div class="result-score-value">—</div>
                    <div class="result-score-label">ожидание</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${label}</div>
                    <div class="result-description">${description}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    renderConcentrationResult() {
        const percent = this.concentrationPercent;
        const mgMl = this.concentrationMgMl;
        const inlineStyle = getResultInlineStyle('success');

        return `
            <div class="result-content result-success drug-result" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${percent !== null ? percent + '%' : mgMl}</div>
                    <div class="result-score-label">${percent !== null ? 'процент' : 'мг/мл'}</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">= ${mgMl !== null ? mgMl + ' мг/мл' : percent + '%'}</div>
                    <div class="result-description">Формула: 1% = 10 мг/мл</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    renderVolumeResult(volumeMl, doseMg, fromWeight = false) {
        const volRounded = Math.round(volumeMl * 100) / 100;
        const doseRounded = Math.round(doseMg * 100) / 100;

        let colorType;
        if (volRounded > 100) {
            colorType = 'error';
        } else if (volRounded > 20 || volRounded < 0.1) {
            colorType = 'warning';
        } else {
            colorType = 'success';
        }
        
        const inlineStyle = getResultInlineStyle(colorType);

        const warnings = [];
        if (volRounded > 20 && volRounded <= 100) {
            warnings.push({ icon: 'warning', text: `Большой объём (${volRounded} мл). Проверьте концентрацию!`, type: 'warn' });
        }
        if (volRounded < 0.1) {
            warnings.push({ icon: 'error', text: 'Очень малый объём — сложно точно дозировать. Используйте более разведённый раствор.', type: 'error' });
        }
        if (volRounded > 100) {
            warnings.push({ icon: 'error', text: 'Экстремально большой объём! Проверьте расчёт.', type: 'error' });
        }

        return `
            <div class="result-content result-${colorType} drug-result" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${volRounded}</div>
                    <div class="result-score-label">мл</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">Объём для введения</div>
                    <div class="result-description">
                        <div class="drug-detail-row">
                            <span>Суммарная доза:</span>
                            <strong>${doseRounded} мг</strong>
                        </div>
                        ${fromWeight ? `
                        <div class="drug-detail-row">
                            <span>Расчёт:</span>
                            <strong>${this.dosePerKg} мг/кг × ${this.weightKg} кг</strong>
                        </div>
                        ` : ''}
                        <div class="drug-detail-row">
                            <span>Концентрация:</span>
                            <strong>${this.concentrationPercent ?? '?'}% (${this.concentrationMgMl ?? '?'} мг/мл)</strong>
                        </div>
                    </div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>

            ${warnings.length > 0 ? `
            <div class="drug-warnings">
                ${warnings.map(w => `
                    <div class="drug-warning-item drug-warning-${w.type}">
                        <span class="material-symbols-rounded">${w.icon}</span>
                        <span>${w.text}</span>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        `;
    }

    setupEventListeners() {
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }

        this._inputHandler = (e) => {
            const target = e.target;
            if (!target.matches('input.drug-field')) return;

            const id = target.id;
            const val = parseFloat(target.value);
            const isEmpty = isNaN(val) || target.value.trim() === '';

            if (id === 'conc-percent') {
                const mgMlInput = this.container.querySelector('#conc-mgml');
                if (isEmpty) {
                    this.concentrationPercent = null;
                    this.concentrationMgMl = null;
                    if (mgMlInput) mgMlInput.value = '';
                } else {
                    this.concentrationPercent = val;
                    this.concentrationMgMl = Math.round(val * 10 * 100) / 100;
                    if (mgMlInput) mgMlInput.value = this.concentrationMgMl;
                }
            } else if (id === 'conc-mgml') {
                const percentInput = this.container.querySelector('#conc-percent');
                if (isEmpty) {
                    this.concentrationMgMl = null;
                    this.concentrationPercent = null;
                    if (percentInput) percentInput.value = '';
                } else {
                    this.concentrationMgMl = val;
                    this.concentrationPercent = Math.round((val / 10) * 100) / 100;
                    if (percentInput) percentInput.value = this.concentrationPercent;
                }
            } else if (id === 'dose-mg') {
                this.doseMg = isEmpty ? null : val;
            } else if (id === 'dose-perkg') {
                this.dosePerKg = isEmpty ? null : val;
            } else if (id === 'weight-kg') {
                this.weightKg = isEmpty ? null : val;
            }

            this.updateResult();
        };
        this.container.addEventListener('input', this._inputHandler, true);

        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        this._clickHandler = (e) => {
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }

            const modeBtn = e.target.closest('.drug-mode-btn');
            if (modeBtn && this.container.contains(modeBtn)) {
                e.preventDefault();
                this.mode = modeBtn.dataset.mode;
                this.renderFullPage();
                this.setupEventListeners();
                bindInfoButton(this.data, this.container);
                this.updateResult();
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
    }

    resetAll() {
        this.concentrationPercent = null;
        this.concentrationMgMl = null;
        this.doseMg = null;
        this.dosePerKg = null;
        this.weightKg = null;
        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data, this.container);
        this.updateResult();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) panel.innerHTML = this.renderResult();
    }
}