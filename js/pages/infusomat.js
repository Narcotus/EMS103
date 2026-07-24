import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class InfusomatPage {
    constructor(container) {
        this.container = container;
        this.selectedDrug = null;
        this.selectedForm = null;
        this.dilutionVolume = 0;
        this.doseValue = null;
        this.weightKg = null;
        
        this._clickHandler = null;
        this._inputHandler = null;
        
        this.data = {
            title: "Расчёт скорости инфузомата",
            subtitle: "Введение препаратов через инфузомат",
            icon: "syringe",
            description: "Расчёт скорости введения препаратов через инфузомат. База данных 9 препаратов с формами выпуска, дозировками и автоматическим расчётом скорости в мл/ч.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Инфузомат (шприцевой насос) обеспечивает точное дозирование препаратов с постоянной скоростью. Расчёт скорости введения зависит от концентрации препарата в растворе, требуемой дозы и массы тела пациента.",
                    "Формула расчёта: скорость (мл/ч) = (доза × вес × 60) / концентрация раствора, где концентрация выражена в мг/мл для доз в мг/кг/ч или мкг/мл для доз в мкг/кг/мин.",
                    "При разведении препарата растворителем (NaCl 0.9% или глюкоза 5%) конечная концентрация уменьшается, что требует увеличения скорости инфузии для достижения той же дозы."
                ],
                importantNote: "Калькулятор предназначен для врачей ОРИТ. Всегда проверяйте расчёт вручную перед началом инфузии. Учитывайте мёртвый объём инфузионной линии. Мониторируйте витальные функции пациента.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Скорость для мкг/кг/мин', 
                        formula: 'V(мл/ч) = (доза × вес × 60) / (конц × 1000)', 
                        example: '(0.1 × 70 × 60) / (0.32 × 1000) = 1.31 мл/ч' 
                    },
                    { 
                        name: 'Скорость для мг/кг/ч', 
                        formula: 'V(мл/ч) = (доза × вес) / конц', 
                        example: '(2 × 80) / 10 = 16 мл/ч' 
                    },
                    { 
                        name: 'Конечная концентрация', 
                        formula: 'конц(мг/мл) = totalMg / totalVolume', 
                        example: '16 мг / 50 мл = 0.32 мг/мл' 
                    },
                    { 
                        name: 'Суточная доза', 
                        formula: 'сут = доза × вес × (60×24/1000 или 24)', 
                        example: '0.1 × 70 × 1.44 = 10.08 мг/сут' 
                    }
                ],
                quickRules: [
                    { icon: '💉', rule: 'Инфузомат = шприцевой насос (точное дозирование)' },
                    { icon: '⚠️', rule: 'Вазопрессоры (норадреналин) — только через ЦВК' },
                    { icon: '📊', rule: 'Скорость > 50 мл/ч — используйте инфузомат для растворов' },
                    { icon: '⏱️', rule: 'Скорость < 0.5 мл/ч — увеличьте концентрацию' },
                    { icon: '💧', rule: 'При разведении — увеличивается скорость инфузии' },
                    { icon: '⚖️', rule: 'Всегда учитывайте вес пациента' }
                ],
                examples: [
                    {
                        scenario: 'Норадреналин 0.2% (4 мг/мл), 4 мл (16 мг), разведение до 50 мл, доза 0.1 мкг/кг/мин, вес 70 кг',
                        calculation: 'конц = 16/50 = 0.32 мг/мл; V = (0.1 × 70 × 60) / (0.32 × 1000) = 1.31 мл/ч'
                    },
                    {
                        scenario: 'Пропофол 1% (10 мг/мл), 20 мл (200 мг), без разведения, доза 2 мг/кг/ч, вес 80 кг',
                        calculation: 'конц = 200/20 = 10 мг/мл; V = (2 × 80) / 10 = 16 мл/ч'
                    },
                    {
                        scenario: 'Добутамин 250 мг / 20 мл, разведение до 50 мл, доза 5 мкг/кг/мин, вес 70 кг',
                        calculation: 'конц = 250/50 = 5 мг/мл; V = (5 × 70 × 60) / (5 × 1000) = 4.2 мл/ч'
                    }
                ]
            },
            drugs: {
                norepinephrine: {
                    name: 'Норадреналин',
                    category: 'cardiotonics',
                    categoryName: 'Кардиотоники',
                    icon: 'monitor_heart',
                    doseUnit: 'mcg_kg_min',
                    forms: [
                        { label: '0.2% — 4 мл', concentration: 0.2, volume: 4, totalMg: 8 },
                        { label: '0.2% — 8 мл', concentration: 0.2, volume: 8, totalMg: 16 }
                    ],
                    dosePresets: [0.05, 0.1, 0.2, 0.3, 0.5],
                    doseRange: '0.1–0.3 мкг/кг/мин',
                    warning: 'Вазопрессор! Только через центральную вену'
                },
                dopamine: {
                    name: 'Допамин',
                    category: 'cardiotonics',
                    categoryName: 'Кардиотоники',
                    icon: 'cardiology',
                    doseUnit: 'mcg_kg_min',
                    forms: [
                        { label: '0.5% — 5 мл', concentration: 0.5, volume: 5, totalMg: 25 },
                        { label: '1% — 5 мл', concentration: 1, volume: 5, totalMg: 50 },
                        { label: '2% — 5 мл', concentration: 2, volume: 5, totalMg: 100 },
                        { label: '4% — 5 мл', concentration: 4, volume: 5, totalMg: 200 }
                    ],
                    dosePresets: [2, 5, 10, 15, 20],
                    doseRange: '2–5–10 мкг/кг/мин, до 15 и более',
                    warning: null
                },
                phenylephrine: {
                    name: 'Мезатон',
                    category: 'cardiotonics',
                    categoryName: 'Кардиотоники',
                    icon: 'blood_pressure',
                    doseUnit: 'mcg_kg_min',
                    forms: [
                        { label: '1% — 1 мл', concentration: 1, volume: 1, totalMg: 10 }
                    ],
                    dosePresets: [0.5, 1, 2, 5],
                    doseRange: 'в/в разовая 5 мг, суточная 25 мг',
                    warning: 'Альфа-адреномиметик'
                },
                epinephrine: {
                    name: 'Адреналин',
                    category: 'cardiotonics',
                    categoryName: 'Кардиотоники',
                    icon: 'monitor_heart',
                    doseUnit: 'mcg_kg_min',
                    forms: [
                        { label: '0.1% — 1 мл', concentration: 0.1, volume: 1, totalMg: 1 }
                    ],
                    dosePresets: [0.01, 0.05, 0.1, 0.2, 0.3],
                    doseRange: '0.01–0.3 мкг/кг/мин',
                    warning: 'Критический препарат!'
                },
                dobutamine: {
                    name: 'Добутамин',
                    category: 'cardiotonics',
                    categoryName: 'Кардиотоники',
                    icon: 'cardiology',
                    doseUnit: 'mcg_kg_min',
                    forms: [
                        { label: '125 мг / 20 мл', concentration: 0.625, volume: 20, totalMg: 125 },
                        { label: '250 мг / 20 мл', concentration: 1.25, volume: 20, totalMg: 250 },
                        { label: '500 мг / 20 мл', concentration: 2.5, volume: 20, totalMg: 500 }
                    ],
                    dosePresets: [2.5, 5, 10, 20, 40],
                    doseRange: '2.5–10 мкг/кг/мин, до 20–40',
                    warning: null
                },
                propofol: {
                    name: 'Пропофол',
                    category: 'hypnotics',
                    categoryName: 'Гипнотики',
                    icon: 'bedtime',
                    doseUnit: 'mg_kg_h',
                    forms: [
                        { label: '1% — 10 мл', concentration: 1, volume: 10, totalMg: 100 },
                        { label: '1% — 20 мл', concentration: 1, volume: 20, totalMg: 200 },
                        { label: '1% — 50 мл', concentration: 1, volume: 50, totalMg: 500 }
                    ],
                    dosePresets: [0.5, 1, 2, 3, 4],
                    doseRange: '0.5–4 мг/кг/ч для седации',
                    warning: 'Гипнотик! Риск угнетения дыхания'
                },
                thiopental: {
                    name: 'Тиопентал',
                    category: 'hypnotics',
                    categoryName: 'Гипнотики',
                    icon: 'bedtime',
                    doseUnit: 'mg_kg_h',
                    forms: [
                        { label: '125 мг / 20 мл', concentration: 0.625, volume: 20, totalMg: 125 },
                        { label: '250 мг / 20 мл', concentration: 1.25, volume: 20, totalMg: 250 },
                        { label: '500 мг / 20 мл', concentration: 2.5, volume: 20, totalMg: 500 },
                        { label: '1000 мг / 20 мл', concentration: 5, volume: 20, totalMg: 1000 }
                    ],
                    dosePresets: [1, 2, 3, 5],
                    doseRange: '1–3 мг/кг/ч',
                    warning: 'Барбитурат! Риск апноэ'
                },
                midazolam: {
                    name: 'Мидазолам',
                    category: 'benzodiazepines',
                    categoryName: 'Бензодиазепины',
                    icon: 'psychology',
                    doseUnit: 'mg_kg_h',
                    forms: [
                        { label: '0.1% — 2 мл', concentration: 0.1, volume: 2, totalMg: 2 },
                        { label: '0.1% — 5 мл', concentration: 0.1, volume: 5, totalMg: 5 },
                        { label: '0.5% — 2 мл', concentration: 0.5, volume: 2, totalMg: 10 },
                        { label: '0.5% — 3 мл', concentration: 0.5, volume: 3, totalMg: 15 }
                    ],
                    dosePresets: [0.03, 0.05, 0.1, 0.2, 0.3],
                    doseRange: 'Нагрузочная 0.1–0.2 мг/кг, поддерживающая 0.03–0.3 мг/кг/ч',
                    warning: null
                },
                diazepam: {
                    name: 'Диазепам',
                    category: 'benzodiazepines',
                    categoryName: 'Бензодиазепины',
                    icon: 'psychology',
                    doseUnit: 'mg_kg_h',
                    forms: [
                        { label: '0.5% — 2 мл', concentration: 0.5, volume: 2, totalMg: 10 },
                        { label: '0.5% — 10 мл', concentration: 0.5, volume: 10, totalMg: 50 }
                    ],
                    dosePresets: [0.05, 0.1, 0.2],
                    doseRange: '0.05–0.1 мг/кг/ч',
                    warning: 'Медленно! Риск угнетения дыхания'
                }
            }
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
        await loadCalculatorCSS('infusomat');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-infusomat',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'infusomat',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data, this.container);
    }

    renderFullPage() {
        this.container.innerHTML = `
            <div class="page-content calc-page infusomat-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Выбор препарата — КНОПКИ -->
                <div class="infusomat-section card card-outlined">
                    <div class="infusomat-section-title">
                        <span class="material-symbols-rounded">medication</span>
                        Выбор препарата
                    </div>
                    ${this.renderDrugButtons()}
                    <div id="drug-info-container">
                        ${this.selectedDrug ? this.renderDrugInfo() : ''}
                    </div>
                </div>

                <div id="forms-container">
                    ${this.selectedDrug ? this.renderFormSelection() : ''}
                </div>

                <div id="dilution-container">
                    ${this.selectedForm !== null ? this.renderDilutionSelection() : ''}
                </div>

                <div id="dose-container">
                    ${this.selectedForm !== null ? this.renderDoseInput() : ''}
                </div>

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;
    }

    renderDrugButtons() {
        const categories = {};
        Object.entries(this.data.drugs).forEach(([id, drug]) => {
            if (!categories[drug.category]) {
                categories[drug.category] = { name: drug.categoryName, drugs: [] };
            }
            categories[drug.category].drugs.push({ id, ...drug });
        });

        return Object.entries(categories).map(([catId, cat]) => `
            <div class="infusomat-drug-category">
                <div class="infusomat-category-title">
                    <span class="material-symbols-rounded">category</span>
                    <span>${cat.name}</span>
                </div>
                <div class="infusomat-drugs-grid">
                    ${cat.drugs.map(drug => `
                        <button class="infusomat-drug-btn ${this.selectedDrug === drug.id ? 'active' : ''}" 
                                data-drug="${drug.id}">
                            <span class="material-symbols-rounded infusomat-drug-icon">${drug.icon}</span>
                            <span class="infusomat-drug-name">${drug.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderDrugInfo() {
        const drug = this.data.drugs[this.selectedDrug];
        return `
            <div class="infusomat-drug-info">
                <div class="drug-info-header">
                    <span class="material-symbols-rounded">${drug.icon}</span>
                    <div class="drug-info-name">${drug.name}</div>
                </div>
                <div class="drug-info-details">
                    <div class="drug-info-row">
                        <span class="drug-info-label">Диапазон доз:</span>
                        <span class="drug-info-value">${drug.doseRange}</span>
                    </div>
                    <div class="drug-info-row">
                        <span class="drug-info-label">Единицы:</span>
                        <span class="drug-info-value">${drug.doseUnit === 'mcg_kg_min' ? 'мкг/кг/мин' : 'мг/кг/ч'}</span>
                    </div>
                </div>
                ${drug.warning ? `
                    <div class="drug-info-warning">
                        <span class="material-symbols-rounded">warning</span>
                        <span>${drug.warning}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderFormSelection() {
        const drug = this.data.drugs[this.selectedDrug];
        return `
            <div class="infusomat-section card card-outlined">
                <div class="infusomat-section-title">
                    <span class="material-symbols-rounded">inventory_2</span>
                    Форма выпуска
                </div>
                <div class="infusomat-forms-grid">
                    ${drug.forms.map((form, idx) => `
                        <button class="infusomat-form-btn ${this.selectedForm === idx ? 'active' : ''}" 
                                data-form="${idx}">
                            <div class="form-btn-label">${form.label}</div>
                            <div class="form-btn-details">${form.totalMg} мг в ${form.volume} мл</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDilutionSelection() {
        const drug = this.data.drugs[this.selectedDrug];
        const form = drug.forms[this.selectedForm];
        const dilutionOptions = [
            { value: 0, label: 'Без разведения', total: form.volume },
            { value: 10, label: 'До 10 мл', total: 10 },
            { value: 20, label: 'До 20 мл', total: 20 },
            { value: 50, label: 'До 50 мл', total: 50 },
            { value: 100, label: 'До 100 мл', total: 100 }
        ];

        return `
            <div class="infusomat-section card card-outlined">
                <div class="infusomat-section-title">
                    <span class="material-symbols-rounded">water_drop</span>
                    Объём растворителя
                </div>
                <div class="infusomat-dilution-grid">
                    ${dilutionOptions.map(opt => `
                        <button class="infusomat-dilution-btn ${this.dilutionVolume === opt.value ? 'active' : ''}" 
                                data-dilution="${opt.value}">
                            <div class="dilution-btn-label">${opt.label}</div>
                            <div class="dilution-btn-total">Итого: ${opt.total} мл</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderDoseInput() {
        const drug = this.data.drugs[this.selectedDrug];
        const unitLabel = drug.doseUnit === 'mcg_kg_min' ? 'мкг/кг/мин' : 'мг/кг/ч';
        
        return `
            <div class="infusomat-section card card-outlined">
                <div class="infusomat-section-title">
                    <span class="material-symbols-rounded">syringe</span>
                    Дозировка и вес пациента
                </div>
                
                <!-- БЫСТРЫЙ ВЫБОР ДОЗЫ -->
                <div class="infusomat-dose-presets">
                    <div class="presets-label">
                        <span class="material-symbols-rounded">bolt</span>
                        Быстрый выбор дозы (${unitLabel}):
                    </div>
                    <div class="presets-grid">
                        ${drug.dosePresets.map(preset => `
                            <button class="preset-btn ${this.doseValue === preset ? 'active' : ''}" 
                                    data-preset="${preset}">
                                ${preset}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="infusomat-dose-inputs">
                    <div class="dose-input-group">
                        <label class="dose-input-label">Доза (${unitLabel})</label>
                        <input type="number" id="dose-input" class="infusomat-field" 
                               min="0" max="1000" step="0.01" placeholder="—" inputmode="decimal"
                               value="${this.doseValue !== null ? this.doseValue : ''}">
                    </div>
                    
                    <div class="dose-input-group">
                        <label class="dose-input-label">Вес пациента (кг)</label>
                        <input type="number" id="weight-input" class="infusomat-field" 
                               min="1" max="200" step="0.1" placeholder="—" inputmode="decimal"
                               value="${this.weightKg !== null ? this.weightKg : ''}">
                    </div>
                </div>
            </div>
        `;
    }

    renderResult() {
        if (!this.selectedDrug) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите препарат</div>
                        <div class="result-description">Начните с выбора препарата из списка выше</div>
                    </div>
                </div>
            `;
        }

        if (this.selectedForm === null) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите форму выпуска</div>
                        <div class="result-description">Укажите ампулу или флакон препарата</div>
                    </div>
                </div>
            `;
        }

        if (this.doseValue === null || this.weightKg === null) {
            const missing = [];
            if (this.doseValue === null) missing.push('дозу');
            if (this.weightKg === null) missing.push('вес пациента');
            
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Введите ${missing.join(' и ')}</div>
                        <div class="result-description">Заполните оба поля для расчёта скорости</div>
                    </div>
                </div>
            `;
        }

        // ✅ Валидация: защита от нуля и NaN
        if (this.doseValue <= 0 || this.weightKg <= 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">ошибка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Некорректные данные</div>
                        <div class="result-description">Доза и вес должны быть больше нуля</div>
                    </div>
                </div>
            `;
        }

        const drug = this.data.drugs[this.selectedDrug];
        const form = drug.forms[this.selectedForm];
        
        const totalVolume = this.dilutionVolume === 0 ? form.volume : this.dilutionVolume;
        const finalConcentration = form.totalMg / totalVolume;
        
        // ✅ Защита от деления на ноль
        if (finalConcentration <= 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">ошибка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Ошибка концентрации</div>
                        <div class="result-description">Концентрация не может быть нулевой</div>
                    </div>
                </div>
            `;
        }
        
        let speedMlH, speedMlMin;
        if (drug.doseUnit === 'mcg_kg_min') {
            speedMlH = (this.doseValue * this.weightKg * 60) / (finalConcentration * 1000);
        } else {
            speedMlH = (this.doseValue * this.weightKg) / finalConcentration;
        }
        speedMlMin = speedMlH / 60;
        
        // ✅ Защита от NaN/Infinity
        if (!isFinite(speedMlH) || isNaN(speedMlH)) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">ошибка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Ошибка расчёта</div>
                        <div class="result-description">Проверьте введённые данные</div>
                    </div>
                </div>
            `;
        }
        
        const speedHRounded = Math.round(speedMlH * 100) / 100;
        const speedMRounded = Math.round(speedMlMin * 1000) / 1000;
        
        const dailyDose = this.doseValue * this.weightKg * (drug.doseUnit === 'mcg_kg_min' ? 60 * 24 / 1000 : 24);
        const dailyDoseRounded = Math.round(dailyDose * 100) / 100;
        
        const hoursAvailable = speedMlH > 0 ? Math.round((totalVolume / speedMlH) * 10) / 10 : 0;
        
        // Определяем цвет результата
        let colorType, colorClass;
        const warnings = [];
        
        if (speedMlH > 100) {
            colorType = 'error';
            colorClass = 'result-error';
            warnings.push({ icon: 'error', text: `Экстремально высокая скорость (${speedHRounded} мл/ч)! Проверьте расчёт и концентрацию.`, type: 'error' });
        } else if (speedMlH > 50) {
            colorType = 'warning-high';
            colorClass = 'result-warning';
            warnings.push({ icon: 'warning', text: `Скорость > 50 мл/ч — рассмотрите использование инфузомата для растворов, а не шприцевого насоса.`, type: 'warn' });
        } else if (speedMlH < 0.5) {
            colorType = 'warning';
            colorClass = 'result-warning';
            warnings.push({ icon: 'warning', text: `Очень низкая скорость (${speedHRounded} мл/ч). Возможно, концентрация слишком высокая — увеличьте разведение.`, type: 'warn' });
        } else {
            colorType = 'success';
            colorClass = 'result-success';
        }
        
        if (totalVolume < 10 && speedMlH > 0.5 && hoursAvailable < 2) {
            warnings.push({ icon: 'schedule', text: `Раствор (${totalVolume} мл) закончится через ${hoursAvailable} ч.`, type: 'warn' });
        }

        const inlineStyle = getResultInlineStyle(colorType);

        return `
            <div class="result-content ${colorClass} infusomat-result" style="${inlineStyle}">
                <div class="infusomat-result-main">
                    <div class="infusomat-result-speed">
                        <div class="speed-value">${speedHRounded}</div>
                        <div class="speed-unit">мл/ч</div>
                    </div>
                    <div class="infusomat-result-alt">
                        = ${speedMRounded} мл/мин
                    </div>
                </div>
                
                <div class="infusomat-result-details">
                    <div class="result-detail-row">
                        <span class="result-detail-label">Препарат:</span>
                        <span class="result-detail-value">${drug.name}</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Форма:</span>
                        <span class="result-detail-value">${form.label}</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Растворитель:</span>
                        <span class="result-detail-value">${this.dilutionVolume === 0 ? 'без разведения' : 'до ' + this.dilutionVolume + ' мл'}</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Общий объём:</span>
                        <span class="result-detail-value">${totalVolume} мл</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Концентрация:</span>
                        <span class="result-detail-value">${Math.round(finalConcentration * 1000) / 1000} мг/мл</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Доза:</span>
                        <span class="result-detail-value">${this.doseValue} ${drug.doseUnit === 'mcg_kg_min' ? 'мкг/кг/мин' : 'мг/кг/ч'}</span>
                    </div>
                    <div class="result-detail-row">
                        <span class="result-detail-label">Вес пациента:</span>
                        <span class="result-detail-value">${this.weightKg} кг</span>
                    </div>
                    <div class="result-detail-row result-detail-highlight">
                        <span class="result-detail-label">Суточная доза:</span>
                        <span class="result-detail-value">${dailyDoseRounded} мг/сут</span>
                    </div>
                    <div class="result-detail-row result-detail-highlight">
                        <span class="result-detail-label">Хватит на:</span>
                        <span class="result-detail-value">${hoursAvailable} ч</span>
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
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }

        this._clickHandler = (e) => {
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }

            const drugBtn = e.target.closest('.infusomat-drug-btn');
            if (drugBtn && this.container.contains(drugBtn)) {
                e.preventDefault();
                this.selectDrug(drugBtn.dataset.drug);
                return;
            }

            const formBtn = e.target.closest('.infusomat-form-btn');
            if (formBtn && this.container.contains(formBtn)) {
                e.preventDefault();
                this.selectedForm = parseInt(formBtn.dataset.form);
                this.dilutionVolume = 0;
                this.updateContainer('dilution-container', this.renderDilutionSelection());
                this.updateContainer('dose-container', this.renderDoseInput());
                this.updateResultContainer();
                
                this.container.querySelectorAll('.infusomat-form-btn').forEach(b => {
                    b.classList.toggle('active', b === formBtn);
                });
                return;
            }

            const dilutionBtn = e.target.closest('.infusomat-dilution-btn');
            if (dilutionBtn && this.container.contains(dilutionBtn)) {
                e.preventDefault();
                this.dilutionVolume = parseInt(dilutionBtn.dataset.dilution);
                this.updateResultContainer();
                
                this.container.querySelectorAll('.infusomat-dilution-btn').forEach(b => {
                    b.classList.toggle('active', b === dilutionBtn);
                });
                return;
            }

            const presetBtn = e.target.closest('.preset-btn');
            if (presetBtn && this.container.contains(presetBtn)) {
                e.preventDefault();
                this.doseValue = parseFloat(presetBtn.dataset.preset);
                const doseInput = this.container.querySelector('#dose-input');
                if (doseInput) doseInput.value = this.doseValue;
                
                this.container.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.toggle('active', parseFloat(b.dataset.preset) === this.doseValue);
                });
                this.updateResultContainer();
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);

        this._inputHandler = (e) => {
            const target = e.target;
            
            if (target.id === 'dose-input') {
                const val = parseFloat(target.value);
                this.doseValue = (!isNaN(val) && target.value.trim() !== '') ? val : null;
                
                this.container.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.toggle('active', parseFloat(b.dataset.preset) === this.doseValue);
                });
                this.updateResultContainer();
                return;
            }
            
            if (target.id === 'weight-input') {
                const val = parseFloat(target.value);
                this.weightKg = (!isNaN(val) && target.value.trim() !== '') ? val : null;
                this.updateResultContainer();
                return;
            }
        };
        this.container.addEventListener('input', this._inputHandler, true);
    }

    selectDrug(drugId) {
        this.selectedDrug = drugId;
        this.selectedForm = null;
        this.dilutionVolume = 0;
        this.doseValue = null;
        this.weightKg = null;
        
        this.container.querySelectorAll('.infusomat-drug-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.drug === drugId);
        });
        
        this.updateContainer('drug-info-container', this.renderDrugInfo());
        this.updateContainer('forms-container', this.renderFormSelection());
        this.updateContainer('dilution-container', '');
        this.updateContainer('dose-container', '');
        this.updateResultContainer();
    }

    updateContainer(containerId, html) {
        const container = this.container.querySelector(`#${containerId}`);
        if (container) {
            container.innerHTML = html;
        }
    }

    updateResultContainer() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }

    resetAll() {
        this.selectedDrug = null;
        this.selectedForm = null;
        this.dilutionVolume = 0;
        this.doseValue = null;
        this.weightKg = null;
        
        this.renderFullPage();
        this.setupEventListeners();
        window.showSnackbar?.('Результат сброшен');
    }
}