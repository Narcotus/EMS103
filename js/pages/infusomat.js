import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class InfusomatPage {
    constructor(container) {
        this.container = container;
        this.selectedDrug = null;
        this.selectedForm = null;
        this.dilutionVolume = 0;
        this.doseValue = null;
        this.weightKg = null;
        
        this.data = {
            title: "Расчёт скорости инфузомата",
            subtitle: "Введение препаратов через инфузомат",
            icon: "iv",
            description: "Расчёт скорости введения препаратов через инфузомат. База данных 9 препаратов с формами выпуска, дозировками и автоматическим расчётом скорости в мл/ч.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Инфузомат (шприцевой насос) обеспечивает точное дозирование препаратов с постоянной скоростью. Расчёт скорости введения зависит от концентрации препарата в растворе, требуемой дозы и массы тела пациента.",
                    "Формула расчёта: скорость (мл/ч) = (доза × вес × 60) / концентрация раствора, где концентрация выражена в мг/мл для доз в мг/кг/ч или мкг/мл для доз в мкг/кг/мин.",
                    "При разведении препарата растворителем (NaCl 0.9% или глюкоза 5%) конечная концентрация уменьшается, что требует увеличения скорости инфузии для достижения той же дозы."
                ],
                importantNote: "Калькулятор предназначен для врачей ОРИТ. Всегда проверяйте расчёт вручную перед началом инфузии. Учитывайте мёртвый объём инфузионной линии. Мониторируйте витальные функции пациента.",
                legalReference: null
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
                    name: 'Мезатон (фенилэфрин)',
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
                    name: 'Адреналин (эпинефрин)',
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
                        { label: '125 мг / 20 мл (0.625%)', concentration: 0.625, volume: 20, totalMg: 125 },
                        { label: '250 мг / 20 мл (1.25%)', concentration: 1.25, volume: 20, totalMg: 250 },
                        { label: '500 мг / 20 мл (2.5%)', concentration: 2.5, volume: 20, totalMg: 500 }
                    ],
                    dosePresets: [2.5, 5, 10, 20, 40],
                    doseRange: '2.5–10 мкг/кг/мин, при необходимости 20–40',
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
                        { label: '125 мг / 20 мл (0.625%)', concentration: 0.625, volume: 20, totalMg: 125 },
                        { label: '250 мг / 20 мл (1.25%)', concentration: 1.25, volume: 20, totalMg: 250 },
                        { label: '500 мг / 20 мл (2.5%)', concentration: 2.5, volume: 20, totalMg: 500 },
                        { label: '1000 мг / 20 мл (5%)', concentration: 5, volume: 20, totalMg: 1000 }
                    ],
                    dosePresets: [1, 2, 3, 5],
                    doseRange: '1–3 мг/кг/ч',
                    warning: 'Барбитурат! Риск апноэ'
                },
                midazolam: {
                    name: 'Мидазолам (дормикум)',
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
                    name: 'Диазепам (реланиум)',
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

    async render() {
        storage.addRecent({
            id: 'calc-infusomat',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'infusomat'
        });

        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data);
    }

    renderFullPage() {
        this.container.innerHTML = `
            <div class="page-content calc-page infusomat-page">
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

                <!-- Выбор препарата -->
                <div class="infusomat-section card card-outlined">
                    <div class="infusomat-section-title">
                        <span class="material-symbols-rounded">medication</span>
                        Выбор препарата
                    </div>
                    <div class="infusomat-drug-selector">
                        <select id="drug-select" class="infusomat-select">
                            <option value="">— Выберите препарат —</option>
                            ${this.renderDrugOptions()}
                        </select>
                    </div>
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

                <div id="result-container">
                    ${this.renderResult()}
                </div>
            </div>
        `;
    }

    renderDrugOptions() {
        const categories = {};
        Object.entries(this.data.drugs).forEach(([id, drug]) => {
            if (!categories[drug.category]) {
                categories[drug.category] = { name: drug.categoryName, drugs: [] };
            }
            categories[drug.category].drugs.push({ id, ...drug });
        });

        return Object.entries(categories).map(([catId, cat]) => `
            <optgroup label="${cat.name}">
                ${cat.drugs.map(drug => `
                    <option value="${drug.id}" ${this.selectedDrug === drug.id ? 'selected' : ''}>
                        ${drug.name}
                    </option>
                `).join('')}
            </optgroup>
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
                ${drug.warning ? `<div class="drug-info-warning">⚠️ ${drug.warning}</div>` : ''}
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

                <div class="infusomat-dose-presets">
                    <div class="presets-label">Быстрый выбор дозы:</div>
                    <div class="presets-grid">
                        ${drug.dosePresets.map(preset => `
                            <button class="preset-btn ${this.doseValue === preset ? 'active' : ''}" 
                                    data-preset="${preset}">
                                ${preset}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderResult() {
        // Если препарат не выбран — показываем заглушку
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

        // Если форма не выбрана
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

        // Если не введены доза или вес
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

        // Полный расчёт
        const drug = this.data.drugs[this.selectedDrug];
        const form = drug.forms[this.selectedForm];
        
        // Рассчитываем конечную концентрацию
        const totalVolume = this.dilutionVolume === 0 ? form.volume : this.dilutionVolume;
        const finalConcentration = form.totalMg / totalVolume; // мг/мл
        
        // Рассчитываем скорость
        let speedMlH, speedMlMin;
        
        if (drug.doseUnit === 'mcg_kg_min') {
            // мкг/кг/мин → мл/ч
            speedMlH = (this.doseValue * this.weightKg * 60) / (finalConcentration * 1000);
        } else {
            // мг/кг/ч → мл/ч
            speedMlH = (this.doseValue * this.weightKg) / finalConcentration;
        }
        
        speedMlMin = speedMlH / 60;
        
        const speedHRounded = Math.round(speedMlH * 100) / 100;
        const speedMRounded = Math.round(speedMlMin * 1000) / 1000;
        
        // Суточная доза для контроля
        const dailyDose = this.doseValue * this.weightKg * (drug.doseUnit === 'mcg_kg_min' ? 60 * 24 / 1000 : 24);
        const dailyDoseRounded = Math.round(dailyDose * 100) / 100;
        
        // Сколько часов хватит раствора
        const hoursAvailable = Math.round((totalVolume / speedMlH) * 10) / 10;
        
        // Предупреждения
        let warnings = [];
        if (speedMlH < 0.5) {
            warnings.push('⚠️ Очень низкая скорость! Возможно, концентрация слишком высокая.');
        }
        if (speedMlH > 100) {
            warnings.push('⚠️ Высокая скорость! Проверьте расчёт и концентрацию.');
        }
        if (speedMlH > 50) {
            warnings.push('⚠️ Скорость > 50 мл/ч — рассмотрите использование инфузомата для растворов, а не шприцевого насоса.');
        }
        if (totalVolume < 5 && speedMlH > 0.5) {
            warnings.push(`⚠️ Объём ${totalVolume} мл закончится через ${hoursAvailable} ч.`);
        }

        return `
            <div class="result-content result-success infusomat-result">
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

                ${warnings.length > 0 ? warnings.map(w => `<div class="result-warning">${w}</div>`).join('') : ''}
            </div>
        `;
    }

    setupEventListeners() {
        // Выбор препарата
        const drugSelect = document.getElementById('drug-select');
        drugSelect?.addEventListener('change', (e) => {
            this.selectedDrug = e.target.value || null;
            this.selectedForm = null;
            this.dilutionVolume = 0;
            this.doseValue = null;
            this.weightKg = null;
            this.updateAllContainers();
        });

        // Делегирование событий для динамически создаваемых элементов
        this.container.addEventListener('click', (e) => {
            // Форма выпуска
            const formBtn = e.target.closest('.infusomat-form-btn');
            if (formBtn) {
                this.selectedForm = parseInt(formBtn.dataset.form);
                this.dilutionVolume = 0;
                this.updateDilutionContainer();
                this.updateDoseContainer();
                this.updateResultContainer();
                // Обновляем визуальное состояние
                document.querySelectorAll('.infusomat-form-btn').forEach(b => {
                    b.classList.toggle('active', b === formBtn);
                });
                return;
            }

            // Разведение
            const dilutionBtn = e.target.closest('.infusomat-dilution-btn');
            if (dilutionBtn) {
                this.dilutionVolume = parseInt(dilutionBtn.dataset.dilution);
                this.updateResultContainer();
                document.querySelectorAll('.infusomat-dilution-btn').forEach(b => {
                    b.classList.toggle('active', b === dilutionBtn);
                });
                return;
            }

            // Пресет дозы
            const presetBtn = e.target.closest('.preset-btn');
            if (presetBtn) {
                this.doseValue = parseFloat(presetBtn.dataset.preset);
                const doseInput = document.getElementById('dose-input');
                if (doseInput) doseInput.value = this.doseValue;
                document.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.toggle('active', b === presetBtn);
                });
                this.updateResultContainer();
                return;
            }
        });

        // Ввод дозы
        const doseInput = document.getElementById('dose-input');
        doseInput?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.doseValue = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
            // Снимаем активный пресет если значение не совпадает
            document.querySelectorAll('.preset-btn').forEach(b => {
                b.classList.toggle('active', parseFloat(b.dataset.preset) === this.doseValue);
            });
            this.updateResultContainer();
        });

        // Ввод веса
        const weightInput = document.getElementById('weight-input');
        weightInput?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.weightKg = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
            this.updateResultContainer();
        });
    }

    updateAllContainers() {
        // Обновляем информацию о препарате
        const infoContainer = document.getElementById('drug-info-container');
        if (infoContainer) {
            infoContainer.innerHTML = this.selectedDrug ? this.renderDrugInfo() : '';
        }

        // Обновляем формы выпуска
        this.updateFormsContainer();
        
        // Обновляем остальные контейнеры
        this.updateDilutionContainer();
        this.updateDoseContainer();
        this.updateResultContainer();
        
        // Переустанавливаем слушатели для новых полей ввода
        this.setupInputListeners();
    }

    updateFormsContainer() {
        const formsContainer = document.getElementById('forms-container');
        if (formsContainer) {
            formsContainer.innerHTML = this.selectedDrug ? this.renderFormSelection() : '';
        }
    }

    updateDilutionContainer() {
        const container = document.getElementById('dilution-container');
        if (container) {
            container.innerHTML = this.selectedForm !== null ? this.renderDilutionSelection() : '';
        }
    }

    updateDoseContainer() {
        const container = document.getElementById('dose-container');
        if (container) {
            container.innerHTML = this.selectedForm !== null ? this.renderDoseInput() : '';
            this.setupInputListeners();
        }
    }

    updateResultContainer() {
        const container = document.getElementById('result-container');
        if (container) {
            container.innerHTML = this.renderResult();
        }
    }

    setupInputListeners() {
        // Ввод дозы
        const doseInput = document.getElementById('dose-input');
        if (doseInput && !doseInput.hasAttribute('data-listener')) {
            doseInput.setAttribute('data-listener', 'true');
            doseInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.doseValue = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
                document.querySelectorAll('.preset-btn').forEach(b => {
                    b.classList.toggle('active', parseFloat(b.dataset.preset) === this.doseValue);
                });
                this.updateResultContainer();
            });
        }

        // Ввод веса
        const weightInput = document.getElementById('weight-input');
        if (weightInput && !weightInput.hasAttribute('data-listener')) {
            weightInput.setAttribute('data-listener', 'true');
            weightInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.weightKg = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
                this.updateResultContainer();
            });
        }
    }
}