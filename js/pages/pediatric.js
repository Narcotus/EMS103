import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class PediatricPage {
    constructor(container) {
        this.container = container;
        this.weightKg = null;
        this.heightCm = null;
        this.ageYears = null;
        
        this.data = {
            title: "Педиатрический калькулятор",
            subtitle: "Система типа ленты Брослоу",
            icon: "child_care",
            description: "Комплексный расчёт для экстренной педиатрической помощи: оценка веса, дозировки реанимационных препаратов, размеры оборудования для интубации и ИВЛ.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Лента Брослоу (Broselow tape) — цветная измерительная лента, используемая для быстрой оценки веса ребёнка по его росту и определения соответствующих дозировок препаратов и размеров оборудования в экстренных ситуациях.",
                    "Данный калькулятор использует формулы APLS (Advanced Pediatric Life Support) и другие валидированные методы для оценки веса по возрасту: для детей 1–10 лет используется формула Best: Вес = 3 × возраст + 7. Для подростков старше 10 лет применяются другие формулы.",
                    "Дозировки препаратов рассчитаны согласно международным рекомендациям PALS (Pediatric Advanced Life Support) и European Resuscitation Council Guidelines. Размеры оборудования основаны на стандартных педиатрических формулах."
                ],
                importantNote: "Калькулятор предназначен для экстренных ситуаций, когда точное взвешивание невозможно. При возможности всегда используйте реальный вес ребёнка. Дозировки являются ориентировочными — корректируйте по клинической ситуации.",
                legalReference: null
            },
            drugs: {
                epinephrine: {
                    name: 'Адреналин',
                    concentration: 0.1, // 0.1% = 1 мг/мл
                    doseMgKg: 0.01, // 0.01 мг/кг
                    maxDoseMg: 1,
                    route: 'В/в, в/к',
                    icon: 'monitor_heart',
                    warning: 'В/в медленно! Развести 1:10000'
                },
                amiodarone: {
                    name: 'Амиодарон',
                    concentration: 50, // 50 мг/мл
                    doseMgKg: 5, // 5 мг/кг
                    maxDoseMg: 300,
                    route: 'В/в медленно',
                    icon: 'cardiology',
                    warning: 'Вводить 20-60 мин'
                },
                atropine: {
                    name: 'Атропин',
                    concentration: 0.1, // 0.1% = 1 мг/мл
                    doseMgKg: 0.02, // 0.02 мг/кг
                    maxDoseMg: 0.5,
                    route: 'В/в, в/м',
                    icon: 'heart_broken',
                    warning: 'Мин. доза 0.1 мг'
                },
                diazepam: {
                    name: 'Диазепам',
                    concentration: 5, // 5 мг/мл (0.5%)
                    doseMgKg: 0.2, // 0.2 мг/кг
                    maxDoseMg: 10,
                    route: 'В/в медленно',
                    icon: 'psychology_alt',
                    warning: 'Медленно! Риск апноэ'
                }
            },
            equipment: {
                ett: {
                    name: 'Эндотрахеальная трубка',
                    icon: 'air',
                    formula: 'uncuffed', // для детей < 8 лет без манжеты
                    unit: 'мм (ID)'
                },
                laryngoscope: {
                    name: 'Клинок ларингоскопа',
                    icon: 'visibility',
                    unit: 'размер'
                },
                mask: {
                    name: 'Маска ИВЛ',
                    icon: 'face',
                    unit: 'размер'
                },
                catheter: {
                    name: 'Назогастральный зонд',
                    icon: 'biotech',
                    unit: 'Fr'
                },
                tidalVolume: {
                    name: 'Дыхательный объём',
                    icon: 'pulmonology',
                    formula: 'weight', // 6-8 мл/кг
                    unit: 'мл'
                }
            },
            weightZones: [
                { min: 0, max: 5, color: '#E91E63', label: 'Розовая', age: '0-3 мес' },
                { min: 5, max: 7, color: '#9C27B0', label: 'Фиолетовая', age: '3-6 мес' },
                { min: 7, max: 9, color: '#3F51B5', label: 'Синяя', age: '6-12 мес' },
                { min: 9, max: 11, color: '#03A9F4', label: 'Голубая', age: '1-2 года' },
                { min: 11, max: 14, color: '#00BCD4', label: 'Бирюзовая', age: '2-3 года' },
                { min: 14, max: 16, color: '#4CAF50', label: 'Зелёная', age: '3-4 года' },
                { min: 16, max: 19, color: '#8BC34A', label: 'Светло-зелёная', age: '4-5 лет' },
                { min: 19, max: 23, color: '#FFEB3B', label: 'Жёлтая', age: '5-6 лет' },
                { min: 23, max: 27, color: '#FFC107', label: 'Оранжевая', age: '6-8 лет' },
                { min: 27, max: 36, color: '#FF9800', label: 'Тёмно-оранжевая', age: '8-10 лет' }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-pediatric',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'pediatric'
        });

        this.container.innerHTML = `
            <div class="page-content calc-page pediatric-page">
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

                <!-- Ввод параметров -->
                <div class="pediatric-inputs card card-outlined">
                    <div class="pediatric-input-title">
                        <span class="material-symbols-rounded">edit</span>
                        Параметры ребёнка (заполните любое поле)
                    </div>
                    <div class="pediatric-input-grid">
                        <div class="pediatric-input-group">
                            <label class="pediatric-input-label">
                                <span class="material-symbols-rounded">scale</span>
                                Вес
                            </label>
                            <div class="pediatric-input-row">
                                <input type="number" id="weight-input" class="pediatric-field" 
                                       min="1" max="100" step="0.1" placeholder="—" inputmode="decimal">
                                <span class="pediatric-unit">кг</span>
                            </div>
                        </div>
                        <div class="pediatric-input-group">
                            <label class="pediatric-input-label">
                                <span class="material-symbols-rounded">height</span>
                                Рост
                            </label>
                            <div class="pediatric-input-row">
                                <input type="number" id="height-input" class="pediatric-field" 
                                       min="40" max="180" step="0.5" placeholder="—" inputmode="decimal">
                                <span class="pediatric-unit">см</span>
                            </div>
                        </div>
                        <div class="pediatric-input-group">
                            <label class="pediatric-input-label">
                                <span class="material-symbols-rounded">cake</span>
                                Возраст
                            </label>
                            <div class="pediatric-input-row">
                                <input type="number" id="age-input" class="pediatric-field" 
                                       min="0" max="18" step="0.1" placeholder="—" inputmode="decimal">
                                <span class="pediatric-unit">лет</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="result-panel">
                    ${this.renderResults()}
                </div>
            </div>
        `;

        this.setupEventListeners();
        bindInfoButton(this.data);
    }

    renderResults() {
        if (this.weightKg === null && this.heightCm === null && this.ageYears === null) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните параметры</div>
                        <div class="result-description">Введите вес, рост или возраст ребёнка</div>
                    </div>
                </div>
            `;
        }

        // Оцениваем вес если не введён
        let estimatedWeight = this.weightKg;
        if (!estimatedWeight) {
            if (this.ageYears !== null) {
                estimatedWeight = this.estimateWeightByAge(this.ageYears);
            } else if (this.heightCm !== null) {
                estimatedWeight = this.estimateWeightByHeight(this.heightCm);
            }
        }

        const zone = this.getWeightZone(estimatedWeight);
        const isEstimated = this.weightKg === null;

        return `
            <!-- Оценка параметров -->
            <div class="pediatric-summary card card-outlined">
                <div class="pediatric-summary-header" style="background: ${zone.color}20;">
                    <div class="pediatric-summary-zone" style="background: ${zone.color}; color: white;">
                        ${zone.label}
                    </div>
                    <div class="pediatric-summary-weight">
                        ${estimatedWeight.toFixed(1)} кг
                        ${isEstimated ? '<span class="estimated-badge">оценка</span>' : ''}
                    </div>
                </div>
                <div class="pediatric-summary-details">
                    <div class="summary-row">
                        <span class="summary-label">Возраст:</span>
                        <span class="summary-value">${this.ageYears !== null ? this.ageYears.toFixed(1) + ' лет' : '—'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Рост:</span>
                        <span class="summary-value">${this.heightCm !== null ? this.heightCm.toFixed(0) + ' см' : '—'}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Возрастная группа:</span>
                        <span class="summary-value">${zone.age}</span>
                    </div>
                </div>
            </div>

            <!-- Дозировки препаратов -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">medication</span>
                    Дозировки препаратов
                </div>
                <div class="pediatric-drugs-grid">
                    ${this.renderDrug('epinephrine', estimatedWeight)}
                    ${this.renderDrug('amiodarone', estimatedWeight)}
                    ${this.renderDrug('atropine', estimatedWeight)}
                    ${this.renderDrug('diazepam', estimatedWeight)}
                </div>
            </div>

            <!-- Оборудование -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">build</span>
                    Оборудование
                </div>
                <div class="pediatric-equipment-grid">
                    ${this.renderEquipment('ett', estimatedWeight)}
                    ${this.renderEquipment('laryngoscope', estimatedWeight)}
                    ${this.renderEquipment('mask', estimatedWeight)}
                    ${this.renderEquipment('catheter', estimatedWeight)}
                    ${this.renderEquipment('tidalVolume', estimatedWeight)}
                </div>
            </div>
        `;
    }

    renderDrug(drugId, weight) {
        const drug = this.data.drugs[drugId];
        let doseMg = drug.doseMgKg * weight;
        
        // Ограничение максимальной дозы
        if (doseMg > drug.maxDoseMg) {
            doseMg = drug.maxDoseMg;
        }
        
        const doseMl = doseMg / drug.concentration;
        const doseRounded = Math.round(doseMg * 100) / 100;
        const mlRounded = Math.round(doseMl * 100) / 100;

        return `
            <div class="pediatric-drug-card">
                <div class="drug-header">
                    <span class="material-symbols-rounded">${drug.icon}</span>
                    <div class="drug-name">${drug.name}</div>
                </div>
                <div class="drug-doses">
                    <div class="drug-dose-main">${doseRounded} мг</div>
                    <div class="drug-dose-volume">${mlRounded} мл</div>
                </div>
                <div class="drug-details">
                    <div class="drug-detail">
                        <span class="drug-label">Концентрация:</span>
                        <span class="drug-value">${drug.concentration}%</span>
                    </div>
                    <div class="drug-detail">
                        <span class="drug-label">Доза:</span>
                        <span class="drug-value">${drug.doseMgKg} мг/кг</span>
                    </div>
                    <div class="drug-detail">
                        <span class="drug-label">Путь:</span>
                        <span class="drug-value">${drug.route}</span>
                    </div>
                </div>
                ${drug.warning ? `<div class="drug-warning">⚠️ ${drug.warning}</div>` : ''}
            </div>
        `;
    }

    renderEquipment(equipId, weight) {
        const equip = this.data.equipment[equipId];
        let value = '';
        let details = '';

        switch (equipId) {
            case 'ett':
                // Формула Коула для детей > 1 года
                if (this.ageYears && this.ageYears > 1) {
                    const ettSize = Math.round((4 + this.ageYears / 4) * 2) / 2; // округление до 0.5
                    value = `${ettSize} ${equip.unit}`;
                    details = 'Без манжеты (формула Коула)';
                } else {
                    value = '3.5 мм';
                    details = 'Для детей < 1 года';
                }
                break;

            case 'laryngoscope':
                if (weight < 5) value = '0 (прямой)';
                else if (weight < 10) value = '1 (прямой)';
                else if (weight < 20) value = '2 (прямой/изогнутый)';
                else value = '3 (изогнутый)';
                details = 'Miller или Macintosh';
                break;

            case 'mask':
                if (weight < 5) value = '0-1';
                else if (weight < 10) value = '2';
                else if (weight < 20) value = '3';
                else if (weight < 40) value = '4';
                else value = '5';
                details = 'Размер по весу';
                break;

            case 'catheter':
                // Формула: Fr = возраст (годы) / 4 + 4 или по весу
                const frSize = Math.round(weight / 3 + 5);
                value = `${frSize} ${equip.unit}`;
                details = 'Назогастральный зонд';
                break;

            case 'tidalVolume':
                const tidalMin = Math.round(weight * 6);
                const tidalMax = Math.round(weight * 8);
                value = `${tidalMin}-${tidalMax} ${equip.unit}`;
                details = '6-8 мл/кг';
                break;
        }

        return `
            <div class="pediatric-equip-card">
                <div class="equip-icon">
                    <span class="material-symbols-rounded">${equip.icon}</span>
                </div>
                <div class="equip-content">
                    <div class="equip-name">${equip.name}</div>
                    <div class="equip-value">${value}</div>
                    <div class="equip-details">${details}</div>
                </div>
            </div>
        `;
    }

    estimateWeightByAge(ageYears) {
        // Формула APLS/Best для детей 1-10 лет
        if (ageYears <= 1) {
            // Для младенцев: ~3 кг при рождении, +0.5 кг/месяц
            return 3 + ageYears * 12 * 0.5;
        } else if (ageYears <= 10) {
            // Best formula: 3 × возраст + 7
            return 3 * ageYears + 7;
        } else {
            // Для подростков: более сложные формулы
            return 3 * ageYears + 7 + (ageYears - 10) * 2;
        }
    }

    estimateWeightByHeight(heightCm) {
        // Упрощённая формула оценки веса по росту
        // Для детей: вес ≈ (рост - 100) × 0.9 (для роста > 100 см)
        if (heightCm < 100) {
            // Для маленьких детей: эмпирическая формула
            return (heightCm - 50) * 0.3;
        } else {
            return (heightCm - 100) * 0.9;
        }
    }

    getWeightZone(weight) {
        const zone = this.data.weightZones.find(z => weight >= z.min && weight < z.max);
        return zone || this.data.weightZones[this.data.weightZones.length - 1];
    }

    setupEventListeners() {
        const weightInput = document.getElementById('weight-input');
        const heightInput = document.getElementById('height-input');
        const ageInput = document.getElementById('age-input');

        const onInput = () => {
            const w = parseFloat(weightInput.value);
            const h = parseFloat(heightInput.value);
            const a = parseFloat(ageInput.value);

            this.weightKg = (!isNaN(w) && weightInput.value.trim() !== '') ? w : null;
            this.heightCm = (!isNaN(h) && heightInput.value.trim() !== '') ? h : null;
            this.ageYears = (!isNaN(a) && ageInput.value.trim() !== '') ? a : null;

            this.updateResults();
        };

        weightInput?.addEventListener('input', onInput);
        heightInput?.addEventListener('input', onInput);
        ageInput?.addEventListener('input', onInput);
    }

    updateResults() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResults();
        }
    }
}