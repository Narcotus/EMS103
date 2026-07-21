import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class PediatricPage {
    constructor(container) {
        this.container = container;
        // Ограничения параметров
        this.limits = {
            weight: { min: 1, max: 120, warnThreshold: 60 },     // кг
            height: { min: 40, max: 200, warnThreshold: 170 },   // см
            age: { min: 0, max: 18, warnThreshold: 14 }          // лет
        };
        this.weightKg = null;
        this.heightCm = null;
        this.ageYears = null;

        this.norepinephrineDilution = 50;

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
                // ═══════════════════════════════════════════
                // РЕАНИМАЦИОННЫЕ ПРЕПАРАТЫ (СЛР)
                // ═══════════════════════════════════════════

                epinephrine: {
                    name: 'Адреналин 0,182% - 1,0 мл',
                    category: 'resuscitation',
                    categoryName: 'Реанимация (СЛР)',
                    icon: 'monitor_heart',
                    ampouleConc: 1,
                    ampouleVol: 1,
                    dilutedConc: 0.1,
                    dilutionDesc: '1 мл + 9 мл NaCl 0.9% = 10 мл (1:10000)',
                    doseMgKg: 0.01,
                    maxDoseMg: 1,
                    route: 'В/в, внутрикостно',
                    repeatInterval: 'Каждые 3–5 мин',
                    warning: 'Макс. 1 мг (вес > 40 кг). Не превышать разовую дозу!',
                    useDiluted: true
                },

                amiodarone: {
                    name: 'Амиодарон 5% - 3,0 мл',
                    category: 'resuscitation',
                    categoryName: 'Реанимация (СЛР)',
                    icon: 'cardiology',
                    ampouleConc: 50,
                    ampouleVol: 3,
                    doseMgKg: 5,
                    maxDoseMg: 300,
                    route: 'В/в, внутрикостно',
                    dilutionDesc: 'Разводить только в глюкозе 5%',
                    repeatInterval: 'Повторить до макс. 15 мг/кг',
                    warning: 'Риск АВ-блокады! Off-label до 3 лет',
                    useDiluted: false
                },

                lidocaine: {
                    name: 'Лидокаин 10% - 2,0 мл',
                    category: 'resuscitation',
                    categoryName: 'Реанимация (СЛР)',
                    icon: 'cardiology',
                    ampouleConc: 100,
                    ampouleVol: 2,
                    doseMgKg: 1,
                    maxDoseMg: 100,
                    route: 'В/в струйно',
                    dilutionDesc: 'Альтернатива амиодарону. Также есть форма 2% (20 мг/мл)',
                    repeatInterval: 'Титрование 20–50 мкг/кг/мин',
                    warning: 'При ФЖ/ЖТ без пульса',
                    useDiluted: false
                },

                atropine: {
                    name: 'Атропин 0,1% - 1,0 мл',
                    category: 'resuscitation',
                    categoryName: 'Реанимация (СЛР)',
                    icon: 'heart_broken',
                    ampouleConc: 1,
                    ampouleVol: 1,
                    doseMgKg: 0.02,
                    maxDoseMg: 1,
                    route: 'В/в',
                    repeatInterval: 'Повтор через 5 мин',
                    warning: 'Только при ваготонии, ФОС-отравлениях!',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // ВАЗОАКТИВНЫЕ ПРЕПАРАТЫ
                // ═══════════════════════════════════════════

                norepinephrine: {
                    name: 'Норадреналин 0.2% - 4,0 мл',
                    category: 'vasoactive',
                    categoryName: 'Вазоактивные',
                    icon: 'trending_up',
                    ampouleConc: 2,
                    ampouleVol: 4,
                    totalMgPerAmpoule: 8,
                    startDoseMcgKgMin: 0.1,
                    maxDoseMcgKgMin: 0.3,
                    titrationStep: 0.05,
                    route: 'В/в капельно (только ЦВК!)',
                    dilutionDesc: '2 мл + 48 мл глюкозы 5% (шприц) или 20 мл + 480 мл (капельница)',
                    protocolNote: 'При некупирующейся артериальной гипотензии (АД < 10-го процентиля). Скорость 10–20 кап/мин под контролем АД и ЧСС.',
                    warning: 'Только через ЦВК! Титровать до АД > 25-го процентиля',
                    useDiluted: false,
                    specialUnit: 'мкг/кг/мин',
                    specialDose: 0.1,
                    isInfusomat: true
                },

                prednisolone: {
                    name: 'Преднизолон 3% - 1,0 мл',
                    category: 'vasoactive',
                    categoryName: 'Вазоактивные',
                    icon: 'medication',
                    ampouleConc: 30,
                    ampouleVol: 1,
                    doseMgKg: 2,
                    maxDoseMg: 120,
                    route: 'В/в струйно',
                    dilutionDesc: 'На 10–20 мл NaCl 0.9%',
                    warning: 'Контроль АД после введения',
                    useDiluted: false
                },

                dexamethasone: {
                    name: 'Дексаметазон 0,4% - 1,0 мл',
                    category: 'vasoactive',
                    categoryName: 'Вазоактивные',
                    icon: 'medication',
                    ampouleConc: 4,
                    ampouleVol: 1,
                    doseMgKg: 0.15,
                    maxDoseMg: 16,
                    route: 'В/в, в/м',
                    dilutionDesc: 'Эквивалент преднизолону 1:7',
                    warning: 'Альтернатива преднизолону',
                    useDiluted: false
                },

                furosemide: {
                    name: 'Фуросемид 1% - 2,0 мл',
                    category: 'vasoactive',
                    categoryName: 'Вазоактивные',
                    icon: 'water_drop',
                    ampouleConc: 10,
                    ampouleVol: 2,
                    doseMgKg: 1,
                    maxDoseMg: 20,
                    route: 'В/в, в/м медленно',
                    dilutionDesc: 'Дети: 0.5–1.5 мг/кг/сут',
                    repeatInterval: 'Повтор через 20 мин при неэффективности',
                    warning: 'Макс. суточная 20 мг! В/в детям до 15 лет — только в исключительных случаях',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // ПРОТИВОСУДОРОЖНЫЕ / СЕДАЦИЯ
                // ═══════════════════════════════════════════

                diazepam: {
                    name: 'Диазепам 0.5% - 2,0 мл',
                    category: 'anticonvulsant',
                    categoryName: 'Противосудорожные',
                    icon: 'psychology_alt',
                    ampouleConc: 5,
                    ampouleVol: 2,
                    doseMgKg: 0.3,
                    maxDoseMg: 10,
                    route: 'В/в медленно (3–5 мин)',
                    dilutionDesc: 'Судороги: 0.3–0.4 мг/кг. Столбняк: 0.1–0.3 мг/кг',
                    repeatInterval: 'Повтор через 10 мин при необходимости',
                    warning: 'Риск апноэ! Скорость ≤ 5 мг/мин. Макс. 10 мг на дозу',
                    useDiluted: false
                },

                midazolam: {
                    name: 'Мидазолам 0,5% - 1,0 мл',
                    category: 'anticonvulsant',
                    categoryName: 'Противосудорожные',
                    icon: 'psychology_alt',
                    ampouleConc: 5,
                    ampouleVol: 3,
                    doseMgKg: 0.1,
                    maxDoseMg: 10,
                    route: 'В/в, в/м, ректально',
                    dilutionDesc: 'Ректально: 0.3–0.5 мг/кг',
                    warning: 'Альтернатива диазепаму',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // АНАЛЬГЕТИКИ
                // ═══════════════════════════════════════════

                analgin: {
                    name: 'Анальгин 50% - 2,0 мл',
                    category: 'analgesic',
                    categoryName: 'Анальгетики',
                    icon: 'pill',
                    ampouleConc: 500,
                    ampouleVol: 2,
                    doseMgKg: 10,
                    maxDoseMg: 1000,
                    route: 'В/в медленно, в/м',
                    dilutionDesc: '8–16 мг/кг (для t°: 10 мг/кг). Начало действия через 30 мин',
                    repeatInterval: 'До 4 раз/сут, интервал 6–8 ч',
                    warning: '⛔ До 3 мес. не применять! 3–11 мес. только в/м! Риск агранулоцитоза',
                    useDiluted: false
                },

                tramadol: {
                    name: 'Трамадол 5% - 1,0 мл',
                    category: 'analgesic',
                    categoryName: 'Анальгетики',
                    icon: 'pill',
                    ampouleConc: 50,
                    ampouleVol: 1,
                    doseMgKg: 1.5,
                    maxDoseMg: 100,
                    route: 'В/в, в/м',
                    dilutionDesc: 'Дети 1–14 лет: 1–2 мг/кг. Макс. суточная 4–8 мг/кг',
                    repeatInterval: 'Каждые 4–6 часов',
                    warning: 'Слабый опиоид. >14 лет: 50–100 мг, макс. 400 мг/сут',
                    useDiluted: false
                },

                morphine: {
                    name: 'Морфин 1% - 1,0 мл',
                    category: 'analgesic',
                    categoryName: 'Анальгетики',
                    icon: 'pill',
                    ampouleConc: 10,
                    ampouleVol: 1,
                    doseMgKg: 0.1,
                    maxDoseMg: 10,
                    route: 'В/в медленно, п/к',
                    dilutionDesc: 'П/к: 0.05–0.2 мг/кг. В/в: 0.05–0.1 мг/кг. Инфузия: 0.01–0.02 мг/кг/ч',
                    repeatInterval: 'Каждые 4–6 часов',
                    warning: '⛔ Не рекомендуется < 1 года! Наркотический анальгетик!',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // АНТИГИСТАМИННЫЕ
                // ═══════════════════════════════════════════

                dimedrol: {
                    name: 'Димедрол 1% - 1,0 мл',
                    category: 'antihistamine',
                    categoryName: 'Антигистаминные',
                    icon: 'allergies',
                    ampouleConc: 10,
                    ampouleVol: 1,
                    doseMgKg: 0.5,
                    maxDoseMg: 50,
                    route: 'В/м, в/в медленно',
                    dilutionDesc: '7–12 мес: 3–5 мг | 1–3 г: 5–10 мг | 4–6 л: 10–15 мг | 7–14 л: 15–30 мг',
                    repeatInterval: 'Каждые 6–8 часов, 1–3 раза/сут',
                    warning: 'Макс. суточная 200 мг. >14 лет: 10–50 мг',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // СПАЗМОЛИТИКИ
                // ═══════════════════════════════════════════

                drotaverine: {
                    name: 'Дротаверин 2% - 2,0 мл',
                    category: 'spasmolytic',
                    categoryName: 'Спазмолитики',
                    icon: 'medication',
                    ampouleConc: 20,
                    ampouleVol: 2,
                    doseMgKg: 0.5,
                    maxDoseMg: 80,
                    route: 'В/м, в/в медленно',
                    dilutionDesc: 'Дети: 10–20 мг (0.5–1 мл). Взрослые: 40–80 мг (2–4 мл)',
                    repeatInterval: '1–3 раза/сут',
                    warning: 'В/в вводить медленно! Риск коллапса',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // ЖАРОПОНИЖАЮЩИЕ
                // ═══════════════════════════════════════════

                paracetamol: {
                    name: 'Парацетамол 1,0% - 100,0 мл',
                    category: 'antipyretic',
                    categoryName: 'Жаропонижающие',
                    icon: 'thermometer',
                    ampouleConc: 10,
                    ampouleVol: 100,
                    doseMgKg: 15,
                    maxDoseMg: 1000,
                    route: 'В/в, внутрь, ректально',
                    dilutionDesc: 'Сироп 30 мг/мл, свечи, инфузия 10 мг/мл',
                    repeatInterval: 'Каждые 4–6 часов, макс. 4 раза/сут',
                    warning: 'Макс. суточная 60 мг/кг',
                    useDiluted: false
                },

                ibuprofen: {
                    name: 'Ибупрофен (суспензия)',
                    category: 'antipyretic',
                    categoryName: 'Жаропонижающие',
                    icon: 'thermometer',
                    ampouleConc: 20,
                    ampouleVol: 100,
                    doseMgKg: 10,
                    maxDoseMg: 400,
                    route: 'Внутрь',
                    repeatInterval: 'Каждые 6–8 часов',
                    warning: 'С 6 месяцев жизни',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // БРОНХОЛИТИКИ
                // ═══════════════════════════════════════════

                berodual: {
                    name: 'Фенотерол/Ипратропия (Беродуал)',
                    category: 'bronchodilator',
                    categoryName: 'Бронхолитики',
                    icon: 'air',
                    ampouleConc: 0.75,  // 500 мкг + 250 мкг = 750 мкг/мл = 0.75 мг/мл
                    ampouleVol: 2,
                    doseMgKg: 0.015,  // примерная доза для расчёта
                    maxDoseMg: 1,
                    route: 'Ингаляции через небулайзер',
                    dilutionDesc: 'До 6 лет (<22 кг): 0.5 мл (10 кап) | 6-12 лет: 0.5-1.0 мл (10-20 кап) | >12 лет: 1 мл (20 кап)',
                    repeatInterval: 'Каждые 20 мин × 3 в 1-й час при бронхоспазме',
                    warning: 'Концентрация: 500 мкг фенотерола + 250 мкг ипратропия/мл',
                    useDiluted: false
                },

                // ═══════════════════════════════════════════
                // АНТИБИОТИКИ
                // ═══════════════════════════════════════════

                ceftriaxone: {
                    name: 'Цефтриаксон',
                    category: 'antibiotic',
                    categoryName: 'Антибиотики',
                    icon: 'vaccines',
                    ampouleConc: 100,
                    ampouleVol: 10,
                    doseMgKg: 50,
                    maxDoseMg: 2000,
                    route: 'В/в капельно (30+ мин)',
                    dilutionDesc: 'Развести в воде для инъекций',
                    repeatInterval: '1 раз в сутки',
                    warning: 'При менингите: 100 мг/кг',
                    useDiluted: false
                },

                cefotaxime: {
                    name: 'Цефотаксим',
                    category: 'antibiotic',
                    categoryName: 'Антибиотики',
                    icon: 'vaccines',
                    ampouleConc: 100,
                    ampouleVol: 10,
                    doseMgKg: 50,
                    maxDoseMg: 2000,
                    route: 'В/в, в/м',
                    dilutionDesc: '4–6 разовых доз в сутки',
                    repeatInterval: 'При менингите — высшие дозы',
                    warning: 'Альтернатива цефтриаксону',
                    useDiluted: false
                }
            },
            equipment: {
                ettUncuffed: { 
                    name: 'ЭТТ без манжеты', 
                    icon: 'air', 
                    unit: 'мм (ID)'
                },
                ettCuffed: { 
                    name: 'ЭТТ с манжетой', 
                    icon: 'air', 
                    unit: 'мм (ID)',
                    minCuffPressure: 20,
                    maxCuffPressure: 25
                },
                laryngoscope: { name: 'Клинок ларингоскопа', icon: 'visibility', unit: 'размер' },
                mask: { name: 'Маска ИВЛ', icon: 'face', unit: 'размер' },
                gastricTube: { 
                    name: 'Зонд для промывания желудка', 
                    icon: 'biotech', 
                    unit: 'Fr',
                    route: 'Орогастрально'
                },
                tidalVolume: { name: 'Дыхательный объём', icon: 'pulmonology', unit: 'мл' }
            },
            weightZones: [
                { min: 0, max: 5, color: '#E91E63', label: 'Розовая', age: '0–3 мес' },
                { min: 5, max: 7, color: '#9C27B0', label: 'Фиолетовая', age: '3–6 мес' },
                { min: 7, max: 9, color: '#3F51B5', label: 'Синяя', age: '6–12 мес' },
                { min: 9, max: 11, color: '#03A9F4', label: 'Голубая', age: '1–2 года' },
                { min: 11, max: 14, color: '#00BCD4', label: 'Бирюзовая', age: '2–3 года' },
                { min: 14, max: 16, color: '#4CAF50', label: 'Зелёная', age: '3–4 года' },
                { min: 16, max: 19, color: '#8BC34A', label: 'Светло-зелёная', age: '4–5 лет' },
                { min: 19, max: 23, color: '#FFEB3B', label: 'Жёлтая', age: '5–6 лет' },
                { min: 23, max: 27, color: '#FFC107', label: 'Оранжевая', age: '6–8 лет' },
                { min: 27, max: 36, color: '#FF9800', label: 'Тёмно-оранжевая', age: '8–10 лет' }
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

        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data);
    }

        renderFullPage() {
            this.container.innerHTML = `
                <div class="page-content calc-page pediatric-page">
                ${renderCalcHeader(this.data)}
                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Параметры ребёнка -->
                <div class="pediatric-inputs card card-outlined">
                    <div class="pediatric-input-title">
                        <span class="material-symbols-rounded">edit</span>
                        Параметры ребёнка (заполните любое поле)
                    </div>
                    <div class="pediatric-input-grid">
                        <div class="pediatric-input-group">
                            <div class="pediatric-field-wrapper">
                                <div class="pediatric-field-bg-left">
                                    <span class="material-symbols-rounded">scale</span>
                                    <span>Вес</span>
                                </div>
                                <div class="pediatric-field-bg-center">1–120</div>
                                <input type="number" id="weight-input" class="pediatric-field"
                                    min="${this.limits.weight.min}" 
                                    max="${this.limits.weight.max}" 
                                    step="0.1" 
                                    inputmode="decimal">
                                <span class="pediatric-field-unit">кг</span>
                            </div>
                        </div>
                        <div class="pediatric-input-group">
                            <div class="pediatric-field-wrapper">
                                <div class="pediatric-field-bg-left">
                                    <span class="material-symbols-rounded">height</span>
                                    <span>Рост</span>
                                </div>
                                <div class="pediatric-field-bg-center">40–200</div>
                                <input type="number" id="height-input" class="pediatric-field"
                                    min="${this.limits.height.min}" 
                                    max="${this.limits.height.max}" 
                                    step="0.5" 
                                    inputmode="decimal">
                                <span class="pediatric-field-unit">см</span>
                            </div>
                        </div>
                        <div class="pediatric-input-group">
                            <div class="pediatric-field-wrapper">
                                <div class="pediatric-field-bg-left">
                                    <span class="material-symbols-rounded">cake</span>
                                    <span>Возраст</span>
                                </div>
                                <div class="pediatric-field-bg-center">0–18</div>
                                <input type="number" id="age-input" class="pediatric-field"
                                    min="${this.limits.age.min}" 
                                    max="${this.limits.age.max}" 
                                    step="0.1" 
                                    inputmode="decimal">

                                <span class="pediatric-field-unit">лет</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Баннер предупреждений -->
                <div id="limits-warning" class="limits-warning" style="display: none;"></div>

            <div id="result-panel">
                ${this.renderResults()}
            </div>
            </div>
        </div>
    `;
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

        // Возрастные нормы
        // Используем эффективный возраст (прямой ввод или оценка по весу/росту)
        const effectiveAge = this.getEffectiveAge();
        const norms = this.getNormalVitals(effectiveAge);

        let maintenanceMlH = 0;
        if (estimatedWeight <= 10) {
            maintenanceMlH = estimatedWeight * 4;
        } else if (estimatedWeight <= 20) {
            maintenanceMlH = 40 + (estimatedWeight - 10) * 2;
        } else {
            maintenanceMlH = 60 + (estimatedWeight - 20) * 1;
        }

        return `
            <!-- Сводка: Лента Брослоу + Возрастные нормы -->
            <div class="pediatric-summary card card-outlined" style="border-color: ${zone.color};">
                <div class="pediatric-summary-header" style="background: linear-gradient(135deg, ${zone.color}20 0%, ${zone.color}40 100%);">
                    <div class="broselow-zone-badge" style="background: ${zone.color}; color: white;">
                        <span class="broselow-zone-label">${zone.label}</span>
                    </div>
                    <div class="broselow-weight">
                        ${estimatedWeight.toFixed(1)} кг
                        ${isEstimated ? '<span class="estimated-badge">оценка</span>' : ''}
                    </div>
                </div>
                <div class="pediatric-summary-grid">
                    <!-- Левая колонка: Лента Брослоу -->
                    <div class="summary-column broselow-column" style="border-left: 4px solid ${zone.color};">
                        <div class="summary-column-title">
                            <span class="material-symbols-rounded">colorize</span>
                            Лента Брослоу
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Цветовая зона:</span>
                            <span class="summary-value" style="color: ${zone.color}; font-weight: 600;">${zone.label}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Вес:</span>
                            <span class="summary-value">${estimatedWeight.toFixed(1)} кг ${isEstimated ? '(оценка)' : ''}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Возраст:</span>
                            <span class="summary-value">
                                ${this.ageYears !== null 
                                    ? this.ageYears.toFixed(1) + ' лет' 
                                    : (effectiveAge !== null ? '~' + effectiveAge.toFixed(1) + ' лет (оценка)' : '—')}
                            </span>
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

                    <!-- Правая колонка: Возрастные нормы (только витальные) -->
                    <div class="summary-column norms-column">
                        <div class="summary-column-title">
                            <span class="material-symbols-rounded">monitor_heart</span>
                            Возрастные нормы
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">АД:</span>
                            <span class="summary-value">
                                ${norms ? `${norms.sbp.min}–${norms.sbp.max} / ${norms.dbp.min}–${norms.dbp.max}` : '—'}
                            </span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">ЧСС:</span>
                            <span class="summary-value">
                                ${norms ? `${norms.hr.min}–${norms.hr.max} уд/мин` : '—'}
                            </span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">ЧД:</span>
                            <span class="summary-value">
                                ${norms ? `${norms.rr.min}–${norms.rr.max} /мин` : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ОСНОВНЫЕ ПРЕПАРАТЫ (экстренная помощь) -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">emergency</span>
                    Экстренные препараты
                </div>
                <div class="pediatric-drugs-grid">
                    ${this.renderDrug('epinephrine', estimatedWeight)}
                    ${this.renderDrug('amiodarone', estimatedWeight)}
                    ${this.renderDrug('atropine', estimatedWeight)}
                    ${this.renderDrug('prednisolone', estimatedWeight)}
                    ${this.renderNorepinephrineCard(estimatedWeight)}
                </div>  
            </div>

            <!-- ОСТАЛЬНЫЕ ПРЕПАРАТЫ (спойлер) -->
            <details class="drugs-spoiler card card-outlined">
                <summary class="drugs-spoiler-summary">
                    <div class="spoiler-left">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <span class="spoiler-title">Остальные препараты</span>
                        <span class="spoiler-count">15</span>
                    </div>
                    <span class="material-symbols-rounded spoiler-arrow">expand_more</span>
                </summary>
                
                <div class="drugs-spoiler-content">
                    <!-- Вазоактивные дополнительные -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">trending_up</span>
                            Вазоактивные и диуретики
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('dexamethasone', estimatedWeight)}
                            ${this.renderDrug('furosemide', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Противосудорожные -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">psychology_alt</span>
                            Противосудорожные / Седация
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('lidocaine', estimatedWeight)}
                            ${this.renderDrug('diazepam', estimatedWeight)}
                            ${this.renderDrug('midazolam', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Анальгетики -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">pill</span>
                            Анальгетики
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('analgin', estimatedWeight)}
                            ${this.renderDrug('tramadol', estimatedWeight)}
                            ${this.renderDrug('morphine', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Антигистаминные и спазмолитики -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">allergies</span>
                            Антигистаминные и спазмолитики
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('dimedrol', estimatedWeight)}
                            ${this.renderDrug('drotaverine', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Жаропонижающие -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">thermometer</span>
                            Жаропонижающие
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('paracetamol', estimatedWeight)}
                            ${this.renderDrug('ibuprofen', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Бронхолитики -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">air</span>
                            Бронхолитики
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('berodual', estimatedWeight)}
                        </div>
                    </div>

                    <!-- Антибиотики -->
                    <div class="spoiler-category">
                        <div class="spoiler-category-title">
                            <span class="material-symbols-rounded">vaccines</span>
                            Антибиотики (менингококк, сепсис)
                        </div>
                        <div class="pediatric-drugs-grid">
                            ${this.renderDrug('ceftriaxone', estimatedWeight)}
                            ${this.renderDrug('cefotaxime', estimatedWeight)}
                        </div>
                    </div>
                </div>
            </details>

            <!-- ДЕФИБРИЛЛЯЦИЯ -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">bolt</span>
                    Дефибрилляция (ФЖ/ЖТ без пульса)
                </div>
                <div class="pediatric-defib-card card card-outlined">
                    ${this.renderDefibrillation(estimatedWeight)}
                </div>
            </div>

            <!-- ОБОРУДОВАНИЕ -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">build</span>
                    Оборудование
                </div>
                <div class="pediatric-equipment-grid">
                    ${this.renderEquipment('ettUncuffed', estimatedWeight)}
                    ${this.renderEquipment('ettCuffed', estimatedWeight)}
                    ${this.renderEquipment('laryngoscope', estimatedWeight)}
                    ${this.renderEquipment('mask', estimatedWeight)}
                    ${this.renderEquipment('tidalVolume', estimatedWeight)}
                    ${this.renderEquipment('gastricTube', estimatedWeight)}
                </div>
            </div>

            <!-- ИНФУЗИОННАЯ ТЕРАПИЯ -->
            <div class="pediatric-section">
                <div class="pediatric-section-title">
                    <span class="material-symbols-rounded">water_drop</span>
                    Инфузионная терапия
                </div>
                <div class="pediatric-infusion-card card card-outlined">
                    <div class="infusion-bolus">
                        <div class="infusion-title">Болюс (при шоке, дегидратации)</div>
                        <div class="infusion-value">${Math.round(estimatedWeight * 10)}–${Math.round(estimatedWeight * 20)} мл</div>
                        <div class="infusion-subtitle">NaCl 0.9% или Рингер (10–20 мл/кг за 20–30 мин)</div>
                    </div>
                    <div class="infusion-maintenance">
                        <div class="infusion-title">Поддерживающая скорость</div>
                        <div class="infusion-value">${Math.round(maintenanceMlH)} мл/ч</div>
                        <div class="infusion-subtitle">По правилу 4-2-1 (для веса ${estimatedWeight.toFixed(1)} кг)</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // РЕНДЕРИНГ ПРЕПАРАТОВ
    // ═══════════════════════════════════════

    renderDrug(drugId, weight) {
        const drug = this.data.drugs[drugId];
        if (!drug) return '';

        let calculatedDoseMg = drug.doseMgKg * weight;
        const isAdultDose = calculatedDoseMg > drug.maxDoseMg;
        let doseMg = Math.min(calculatedDoseMg, drug.maxDoseMg);
        const weightForMaxDose = drug.maxDoseMg / drug.doseMgKg;

        let volumeMl;
        if (drug.useDiluted && drug.dilutedConc) {
            volumeMl = doseMg / drug.dilutedConc;
        } else {
            volumeMl = doseMg / drug.ampouleConc;
        }

        const doseRounded = Math.round(doseMg * 100) / 100;
        const mlRounded = volumeMl < 0.1
            ? Math.round(volumeMl * 1000) / 1000
            : Math.round(volumeMl * 100) / 100;

        const ampoulesNeeded = volumeMl / drug.ampouleVol;
        const ampoulesRounded = Math.ceil(ampoulesNeeded * 10) / 10;

        let ageWarning = '';
        if (drugId === 'ibuprofen' && this.ageYears !== null && this.ageYears < 0.5) {
            ageWarning = '<div class="drug-age-warning">⛔ Противопоказан до 6 мес!</div>';
        }

        let adultDoseBanner = '';
        if (isAdultDose) {
            adultDoseBanner = `
                <div class="adult-dose-banner">
                    <span class="material-symbols-rounded">person</span>
                    <div class="adult-dose-text">
                        <div class="adult-dose-title">Взрослая дозировка</div>
                        <div class="adult-dose-subtitle">Достигается при весе ${weightForMaxDose.toFixed(0)} кг и выше</div>
                    </div>
                </div>
            `;
        }

        const specialInfo = drug.specialUnit
            ? `<div class="drug-detail">
                   <span class="drug-label">Дозировка:</span>
                   <span class="drug-value">${drug.specialDose} ${drug.specialUnit}</span>
               </div>`
            : `<div class="drug-detail">
                   <span class="drug-label">Дозировка:</span>
                   <span class="drug-value">${drug.doseMgKg} мг/кг</span>
               </div>`;

        const limitedNote = isAdultDose
            ? `<div class="drug-detail limited">
                   <span class="drug-label">Расчётная доза:</span>
                   <span class="drug-value">${Math.round(calculatedDoseMg)} мг → ограничена</span>
               </div>`
            : '';

        return `
            <div class="pediatric-drug-card ${isAdultDose ? 'adult-dose-card' : ''}">
                <div class="drug-header">
                    <span class="material-symbols-rounded">${drug.icon}</span>
                    <div class="drug-name">${drug.name}</div>
                </div>
                ${adultDoseBanner}
                <div class="drug-dose-section">
                    <div class="drug-dose-label">
                        ${isAdultDose ? 'Взрослая разовая доза:' : 'Разовая доза:'}
                    </div>
                    <div class="drug-doses">
                        <div class="drug-dose-item">
                            <div class="drug-dose-main">${doseRounded}</div>
                            <div class="drug-dose-unit">мг</div>
                        </div>
                        <div class="drug-dose-separator">=</div>
                        <div class="drug-dose-item">
                            <div class="drug-dose-volume">${mlRounded}</div>
                            <div class="drug-dose-unit">мл</div>
                        </div>
                    </div>
                    ${drug.useDiluted ? '<div class="drug-dose-note">объём разведённого раствора</div>' : ''}
                </div>
                <div class="drug-details">
                    ${specialInfo}
                    ${limitedNote}
                    <div class="drug-detail">
                        <span class="drug-label">Конц. ампулы:</span>
                        <span class="drug-value">${drug.ampouleConc} мг/мл (${drug.ampouleVol} мл)</span>
                    </div>
                    ${drug.useDiluted && drug.dilutedConc ? `
                        <div class="drug-detail highlight">
                            <span class="drug-label">Конц. развед.:</span>
                            <span class="drug-value">${drug.dilutedConc} мг/мл</span>
                        </div>
                    ` : ''}
                    ${drug.dilutionDesc ? `
                        <div class="drug-detail">
                            <span class="drug-label">Разведение:</span>
                            <span class="drug-value">${drug.dilutionDesc}</span>
                        </div>
                    ` : ''}
                    <div class="drug-detail">
                        <span class="drug-label">Путь:</span>
                        <span class="drug-value">${drug.route}</span>
                    </div>
                    ${drug.repeatInterval ? `
                        <div class="drug-detail">
                            <span class="drug-label">Повтор:</span>
                            <span class="drug-value">${drug.repeatInterval}</span>
                        </div>
                    ` : ''}
                    <div class="drug-detail max-dose-info">
                        <span class="drug-label">Макс. (взрослая):</span>
                        <span class="drug-value">${drug.maxDoseMg} мг</span>
                    </div>
                    <div class="drug-detail ampoules-info">
                        <span class="drug-label">Нужно ампул:</span>
                        <span class="drug-value">${ampoulesRounded} × ${drug.ampouleVol} мл</span>
                    </div>
                </div>
                ${ageWarning}
                ${drug.warning ? `<div class="drug-warning">⚠️ ${drug.warning}</div>` : ''}
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // НОРЭПИНЕФРИН (ИНФУЗОМАТ)
    // ═══════════════════════════════════════

    renderNorepinephrineCard(weight) {
        const drug = this.data.drugs.norepinephrine;
        const dilution = this.norepinephrineDilution;
        const totalMg = drug.totalMgPerAmpoule;
        const totalMcg = totalMg * 1000;
        const concMcgMl = totalMcg / dilution;

        const startDose = drug.startDoseMcgKgMin;
        const speedMlH = (startDose * weight * 60) / concMcgMl;
        const speedMlMin = speedMlH / 60;
        const dropsPerMin = speedMlMin * 20;
        const titrationMlH = (drug.titrationStep * weight * 60) / concMcgMl;

        return `
            <div class="pediatric-drug-card norepinephrine-card">
                <div class="drug-header">
                    <span class="material-symbols-rounded">${drug.icon}</span>
                    <div class="drug-name">${drug.name}</div>
                </div>

                <div class="ne-dilution-section">
                    <div class="ne-dilution-label">Объём разведения (инфузомат):</div>
                    <div class="ne-dilution-options">
                        ${[20, 50, 100].map(vol => `
                            <button class="ne-dilution-btn ${this.norepinephrineDilution === vol ? 'active' : ''}"
                                    data-dilution="${vol}">
                                ${vol} мл
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="ne-concentration">
                    <span class="ne-conc-label">Концентрация:</span>
                    <span class="ne-conc-value">${Math.round(concMcgMl)} мкг/мл</span>
                    <span class="ne-conc-detail">(${totalMg} мг / ${dilution} мл)</span>
                </div>

                <div class="ne-speed-section">
                    <div class="ne-speed-title">
                        Стартовая скорость (${startDose} мкг/кг/мин):
                    </div>
                    <div class="ne-speed-grid">
                        <div class="ne-speed-item">
                            <div class="ne-speed-value">${speedMlH.toFixed(2)}</div>
                            <div class="ne-speed-unit">мл/ч</div>
                        </div>
                        <div class="ne-speed-separator">=</div>
                        <div class="ne-speed-item">
                            <div class="ne-speed-value">${speedMlMin.toFixed(3)}</div>
                            <div class="ne-speed-unit">мл/мин</div>
                        </div>
                        <div class="ne-speed-separator">=</div>
                        <div class="ne-speed-item">
                            <div class="ne-speed-value">${dropsPerMin.toFixed(1)}</div>
                            <div class="ne-speed-unit">кап/мин</div>
                        </div>
                    </div>
                </div>

                <div class="ne-titration">
                    <div class="ne-titration-title">
                        <span class="material-symbols-rounded">tune</span>
                        Титрование
                    </div>
                    <div class="ne-titration-desc">
                        Шаг: +${drug.titrationStep}–${drug.titrationStep * 2} мкг/кг/мин
                        (= +${titrationMlH.toFixed(2)}–${(titrationMlH * 2).toFixed(2)} мл/ч)<br>
                        До достижения АД &gt; 25-го процентиля возрастной нормы
                    </div>
                </div>

                <div class="drug-details">
                    <div class="drug-detail">
                        <span class="drug-label">Диапазон дозы:</span>
                        <span class="drug-value">${drug.startDoseMcgKgMin}–${drug.maxDoseMcgKgMin} мкг/кг/мин</span>
                    </div>
                    <div class="drug-detail">
                        <span class="drug-label">Ампула:</span>
                        <span class="drug-value">${drug.ampouleConc} мг/мл × ${drug.ampouleVol} мл</span>
                    </div>
                    <div class="drug-detail">
                        <span class="drug-label">Растворитель:</span>
                        <span class="drug-value">Глюкоза 5% или NaCl 0.9%</span>
                    </div>
                    <div class="drug-detail">
                        <span class="drug-label">Скорость введения:</span>
                        <span class="drug-value">10–20 кап/мин</span>
                    </div>
                </div>

                <div class="drug-warning">⚠️ ${drug.warning}</div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // ДЕФИБРИЛЛЯЦИЯ
    // ═══════════════════════════════════════

    renderDefibrillation(weight) {
        const maxDefibEnergy = 360;

        const shock1 = Math.min(Math.round(weight * 4), maxDefibEnergy);
        const shock2 = Math.min(Math.round(weight * 4), maxDefibEnergy);
        const shock3 = Math.min(Math.round(weight * 4), maxDefibEnergy);
        const shock4 = Math.min(Math.round(weight * 6), maxDefibEnergy);
        const shock5 = Math.min(Math.round(weight * 8), maxDefibEnergy);

        const hitsMax1 = weight * 4 >= maxDefibEnergy;
        const hitsMax4 = weight * 6 >= maxDefibEnergy;

        const epiDose = Math.min(weight * 0.01, 1);
        const amioDose = Math.min(weight * 5, 300);
        const lidoDose = Math.min(weight * 1, 100);

        return `
            <div class="defib-header">
                <div class="defib-main">
                    <div class="defib-value">${shock1} Дж</div>
                    <div class="defib-label">Первый разряд (4 Дж/кг)</div>
                </div>
                <div class="defib-legend">
                    <div class="defib-legend-item">
                        <span class="defib-legend-dot" style="background: var(--md-error);"></span>
                        <span>Немедленный разряд → продолжение компрессий</span>
                    </div>
                    <div class="defib-legend-item">
                        <span class="defib-legend-dot" style="background: var(--md-primary);"></span>
                        <span>СЛР 2 мин → оценка ритма</span>
                    </div>
                    <div class="defib-legend-item">
                        <span class="defib-legend-dot" style="background: var(--md-tertiary, #6750A4);"></span>
                        <span>Введение препаратов</span>
                    </div>
                </div>
            </div>

            <div class="defib-timeline">
                <div class="defib-step shock">
                    <div class="defib-step-num">1</div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Разряд ${shock1} Дж</div>
                        <div class="defib-step-desc">Немедленно при выявлении ФЖ/ЖТ. Сразу продолжить компрессии!</div>
                        ${hitsMax1 ? '<div class="defib-max-note">⚠️ Достигнут максимум дефибриллятора</div>' : ''}
                    </div>
                </div>

                <div class="defib-step cpr">
                    <div class="defib-step-num">
                        <span class="material-symbols-rounded" style="font-size: 14px;">favorite</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">СЛР 2 минуты</div>
                        <div class="defib-step-desc">Даже при восстановлении ритма — сердце не поддерживает гемодинамику ≥1 мин</div>
                    </div>
                </div>

                <div class="defib-step shock">
                    <div class="defib-step-num">2</div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Разряд ${shock2} Дж (4 Дж/кг)</div>
                        <div class="defib-step-desc">Повтор при сохранении ФЖ/ЖТ</div>
                    </div>
                </div>

                <div class="defib-step cpr">
                    <div class="defib-step-num">
                        <span class="material-symbols-rounded" style="font-size: 14px;">favorite</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">СЛР 2 минуты</div>
                        <div class="defib-step-desc">Оценка ритма и пульса</div>
                    </div>
                </div>

                <div class="defib-step drug">
                    <div class="defib-step-num" style="background: var(--md-error);">
                        <span class="material-symbols-rounded" style="font-size: 14px;">medication</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Эпинефрин ${epiDose.toFixed(2)} мг (10 мкг/кг)</div>
                        <div class="defib-step-desc">В/в или внутрикостно. Повторять каждые 3–5 мин</div>
                    </div>
                </div>

                <div class="defib-step shock">
                    <div class="defib-step-num">3</div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Разряд ${shock3} Дж (4 Дж/кг)</div>
                        <div class="defib-step-desc">Сразу после введения эпинефрина</div>
                    </div>
                </div>

                <div class="defib-step cpr">
                    <div class="defib-step-num">
                        <span class="material-symbols-rounded" style="font-size: 14px;">favorite</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">СЛР 2 минуты</div>
                    </div>
                </div>

                <div class="defib-step drug">
                    <div class="defib-step-num" style="background: var(--md-tertiary, #6750A4);">
                        <span class="material-symbols-rounded" style="font-size: 14px;">monitor_heart</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Антиаритмический препарат</div>
                        <div class="defib-step-desc">
                            <strong>Амиодарон ${amioDose} мг</strong> (5 мг/кг, макс 300 мг) — предпочтительно<br>
                            <em>или</em> Лидокаин ${lidoDose} мг (1 мг/кг, макс 100 мг)
                        </div>
                    </div>
                </div>

                <div class="defib-step shock">
                    <div class="defib-step-num">4</div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Разряд ${shock4} Дж (6 Дж/кг)</div>
                        <div class="defib-step-desc">Повышенная энергия</div>
                        ${hitsMax4 && !hitsMax1 ? '<div class="defib-max-note">⚠️ Достигнут максимум дефибриллятора</div>' : ''}
                    </div>
                </div>

                <div class="defib-step cpr">
                    <div class="defib-step-num">
                        <span class="material-symbols-rounded" style="font-size: 14px;">favorite</span>
                    </div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">СЛР 2 минуты</div>
                    </div>
                </div>

                <div class="defib-step shock max-shock">
                    <div class="defib-step-num">5+</div>
                    <div class="defib-step-content">
                        <div class="defib-step-title">Максимальный разряд: ${shock5} Дж (8 Дж/кг)</div>
                        <div class="defib-step-desc">
                            При неэффективности первых 5 разрядов.
                            ${shock5 >= maxDefibEnergy ? '<strong>Ограничено максимумом дефибриллятора 360 Дж.</strong>' : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="defib-footer">
                <div class="defib-footer-note">
                    <span class="material-symbols-rounded">info</span>
                    Цикл повторяется: СЛР 2 мин → разряд → препараты каждые 3–5 мин
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // ОБОРУДОВАНИЕ
    // ═══════════════════════════════════════

    renderEquipment(equipId, weight) {
        // Вычисляем эффективный возраст (прямой ввод или оценка по весу/росту)
        const effectiveAge = this.getEffectiveAge();
        
        const equip = this.data.equipment[equipId];
        let value = '';
        let details = '';
        let warning = '';
        let extraInfo = '';

        switch (equipId) {
            case 'ettUncuffed': {
                const age = effectiveAge; // Используем эффективный возраст
                let extraInfo = '';

                if (age !== null && age > 1) {
                    const uncuffedSize = Math.round((4 + age / 4) * 2) / 2;
                    const depth = Math.round(3 * uncuffedSize * 10) / 10;
                    const depthAlt = Math.round((12 + age / 2) * 10) / 10;
                    const styletSize = uncuffedSize <= 4.0 ? '6 Fr' : (uncuffedSize <= 5.5 ? '10 Fr' : '14 Fr');

                    value = `${uncuffedSize} ${equip.unit}`;
                    details = `Формула Коула: 4 + возраст/4`;

                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-additional">
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">straighten</span>
                                    <span class="ett-additional-label">Глубина интубации:</span>
                                    <span class="ett-additional-value">${depth} см (от губ)</span>
                                </div>
                                <div class="ett-additional-item ett-additional-alt">
                                    <span class="material-symbols-rounded">swap_horiz</span>
                                    <span class="ett-additional-label">Альтернативно:</span>
                                    <span class="ett-additional-value">${depthAlt} см (12 + возраст/2)</span>
                                </div>
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">linear_scale</span>
                                    <span class="ett-additional-label">Размер стилета:</span>
                                    <span class="ett-additional-value">${styletSize}</span>
                                </div>
                            </div>
                            <div class="ett-safety-notes">
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">info</span>
                                    <span>Классический выбор для детей < 8 лет</span>
                                </div>
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">verified</span>
                                    <span>Верификация: аускультация + капнография</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (age !== null && age <= 1) {
                    let size = '3.0';
                    if (age < 0.08) size = '3.0';
                    else if (age < 0.5) size = '3.5';
                    else size = '3.5–4.0';

                    const depthInfant = age < 0.08 ? '9' : (age < 0.5 ? '10' : '11');

                    value = `${size} ${equip.unit}`;
                    details = age < 0.08 ? 'новорождённый' : `${age.toFixed(1)} лет`;

                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-additional">
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">straighten</span>
                                    <span class="ett-additional-label">Глубина:</span>
                                    <span class="ett-additional-value">${depthInfant} см (от губ)</span>
                                </div>
                            </div>
                            <div class="ett-safety-notes">
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">check_circle</span>
                                    <span>Предпочтительный вариант для детей < 1 года</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    value = '—';
                    details = 'Укажите возраст или вес';
                }
                break;
            }

            case 'ettCuffed': {
                const age = effectiveAge; // Используем эффективный возраст
                let extraInfo = '';

                if (age !== null && age > 1) {
                    const cuffedSize = Math.round((3.5 + age / 4) * 2) / 2;
                    const depth = Math.round(3 * cuffedSize * 10) / 10;
                    const depthAlt = Math.round((12 + age / 2) * 10) / 10;
                    const styletSize = cuffedSize <= 4.0 ? '6 Fr' : (cuffedSize <= 5.5 ? '10 Fr' : '14 Fr');
                    const cuffVolume = cuffedSize <= 4.0 ? '2–3' : (cuffedSize <= 5.0 ? '3–5' : (cuffedSize <= 6.0 ? '5–7' : '7–10'));

                    value = `${cuffedSize} ${equip.unit}`;
                    details = `Формула: 3.5 + возраст/4`;

                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-additional">
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">straighten</span>
                                    <span class="ett-additional-label">Глубина интубации:</span>
                                    <span class="ett-additional-value">${depth} см (от губ)</span>
                                </div>
                                <div class="ett-additional-item ett-additional-alt">
                                    <span class="material-symbols-rounded">swap_horiz</span>
                                    <span class="ett-additional-label">Альтернативно:</span>
                                    <span class="ett-additional-value">${depthAlt} см (12 + возраст/2)</span>
                                </div>
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">speed</span>
                                    <span class="ett-additional-label">Давление в манжете:</span>
                                    <span class="ett-additional-value">${equip.minCuffPressure}–${equip.maxCuffPressure} см H₂O</span>
                                </div>
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">water_drop</span>
                                    <span class="ett-additional-label">Объём манжеты:</span>
                                    <span class="ett-additional-value">${cuffVolume} мл воздуха</span>
                                </div>
                                <div class="ett-additional-item">
                                    <span class="material-symbols-rounded">linear_scale</span>
                                    <span class="ett-additional-label">Размер стилета:</span>
                                    <span class="ett-additional-value">${styletSize}</span>
                                </div>
                            </div>
                            <div class="ett-safety-notes">
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">info</span>
                                    <span>Современные манжеты высокого объёма/низкого давления безопасны в любом возрасте</span>
                                </div>
                                <div class="safety-note safety-warning">
                                    <span class="material-symbols-rounded">warning</span>
                                    <span>Контроль давления манжеты каждые 4–6 часов, утечка при 20–25 см H₂O</span>
                                </div>
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">verified</span>
                                    <span>Верификация: аускультация + капнография + симметричная экскурсия</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (age !== null && age <= 1) {
                    value = '—';
                    details = 'Не применяется до 1 года';
                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-safety-notes">
                                <div class="safety-note safety-warning">
                                    <span class="material-symbols-rounded">warning</span>
                                    <span>У детей < 1 года используйте ЭТТ без манжеты</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    value = '—';
                    details = 'Укажите возраст или вес';
                }
                break;
            }

            case 'laryngoscope': {
                if (weight === null || weight === undefined || isNaN(weight)) {
                    value = '—';
                    details = 'Укажите вес или возраст';
                } else {
                    if (weight < 3) {
                        value = '0';
                        details = 'Прямой (Miller) · < 3 кг';
                    } else if (weight < 5) {
                        value = '0';
                        details = 'Прямой (Miller) · 3–5 кг';
                    } else if (weight < 10) {
                        value = '1';
                        details = 'Прямой (Miller) · 5–10 кг';
                    } else if (weight < 20) {
                        value = '2';
                        details = 'Прямой/Изогнутый · 10–20 кг';
                    } else if (weight < 40) {
                        value = '2';
                        details = 'Изогнутый (Macintosh) · 20–40 кг';
                    } else {
                        value = '3';
                        details = 'Изогнутый (Macintosh) · > 40 кг';
                    }
                }
                break;
            }

            case 'mask': {
                if (weight === null || weight === undefined || isNaN(weight)) {
                    value = '—';
                    details = 'Укажите вес или возраст';
                } else {
                    if (weight < 3) {
                        value = '0';
                        details = 'Новорождённый · < 3 кг';
                    } else if (weight < 5) {
                        value = '1';
                        details = 'Младенец · 3–5 кг';
                    } else if (weight < 10) {
                        value = '2';
                        details = 'Ребёнок · 5–10 кг';
                    } else if (weight < 20) {
                        value = '3';
                        details = 'Ребёнок · 10–20 кг';
                    } else if (weight < 40) {
                        value = '4';
                        details = 'Подросток · 20–40 кг';
                    } else {
                        value = '5';
                        details = 'Взрослая · > 40 кг';
                    }
                }
                break;
            }

            case 'gastricTube': {
                const age = this.ageYears;
                let ageGroup = '';
                let sizeRange = '';
                let volumePerPortion = weight ? Math.round(weight * 10) : 0;
                const maxVolume = 300;

                // Проверка наличия параметров
                if ((age === null || age === undefined) && (!weight || weight === null || weight === undefined)) {
                    value = '—';
                    details = 'Укажите возраст или вес';
                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-safety-notes">
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">info</span>
                                    <span>Введите возраст или вес ребёнка для расчёта размера зонда</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (age !== null && age < 1) {
                    value = '—';
                    details = 'Не рекомендуется';
                    ageGroup = 'До 1 года';
                    warning = '⛔ До 1 года крупнокалиберный зонд может вызвать брадикардию и ларингоспазм';
                    extraInfo = '<div class="equip-alternative">Альтернатива: активированный уголь (при показаниях) + консультация токсиколога</div>';
                } else if (age !== null && age >= 1 && age < 4) {
                    sizeRange = '18–20';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${age.toFixed(1)} лет`;
                    details = `${ageGroup} (10–15 кг)`;
                } else if (age !== null && age >= 4 && age < 8) {
                    sizeRange = '20–22';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${age.toFixed(1)} лет`;
                    details = `${ageGroup} (16–22 кг)`;
                } else if (age !== null && age >= 8 && age < 13) {
                    sizeRange = '22–24';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${age.toFixed(1)} лет`;
                    details = `${ageGroup} (23–40 кг)`;
                } else if (age !== null && age >= 13) {
                    sizeRange = '26–28';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${age.toFixed(1)} лет`;
                    details = `${ageGroup} (> 40 кг)`;
                } else if (weight >= 10 && weight < 16) {
                    sizeRange = '18–20';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${weight.toFixed(0)} кг`;
                    details = `${ageGroup} (1–3 года)`;
                } else if (weight >= 16 && weight < 23) {
                    sizeRange = '20–22';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${weight.toFixed(0)} кг`;
                    details = `${ageGroup} (4–7 лет)`;
                } else if (weight >= 23 && weight < 41) {
                    sizeRange = '22–24';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${weight.toFixed(0)} кг`;
                    details = `${ageGroup} (8–12 лет)`;
                } else if (weight >= 41) {
                    sizeRange = '26–28';
                    value = `${sizeRange} ${equip.unit}`;
                    ageGroup = `${weight.toFixed(0)} кг`;
                    details = `${ageGroup} (13–18 лет)`;
                } else {
                    value = '—';
                    details = 'Недостаточно данных';
                    extraInfo = `
                        <div class="ett-details">
                            <div class="ett-safety-notes">
                                <div class="safety-note">
                                    <span class="material-symbols-rounded">info</span>
                                    <span>Вес менее 10 кг — зонд не рекомендуется</span>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Ограничение объёма порции максимумом
                if (volumePerPortion > maxVolume) {
                    volumePerPortion = maxVolume;
                }

                // Дополнительные клинические примечания с расчётом порции
                if (value !== '—' && sizeRange) {
                    extraInfo = `
                        <div class="ett-details">
                            <div class="safety-note safety-highlight">
                                <span class="material-symbols-rounded">calculate</span>
                                <span>Объём одной порции: <strong>${volumePerPortion} мл</strong> (${weight ? weight.toFixed(1) : '?'} кг × 10 мл/кг)</span>
                            </div>
                            <div class="safety-note">
                                <span class="material-symbols-rounded">check_circle</span>
                                <span><strong>Орогастрально</strong> (не назально)</span>
                            </div>
                            <div class="safety-note">
                                <span class="material-symbols-rounded">bed</span>
                                <span>Положение Тренделенбурга на левом боку</span>
                            </div>
                            <div class="safety-note">
                                <span class="material-symbols-rounded">water_drop</span>
                                <span>Промывать тёплым физраствором или водой до чистых промывных вод</span>
                            </div>
                            <div class="safety-note">
                                <span class="material-symbols-rounded">schedule</span>
                                <span>Показания: ≤1–2 ч после приёма токсина</span>
                            </div>
                            <div class="safety-note safety-warning">
                                <span class="material-symbols-rounded">warning</span>
                                <span>При нарушенном сознании — <strong>только после интубации!</strong></span>
                            </div>
                            <div class="safety-note">
                                <span class="material-symbols-rounded">verified</span>
                                <span>Верификация: аспирация желудочного содержимого</span>
                            </div>
                        </div>
                    `;
                }
                break;
            }

            case 'tidalVolume': {
                const tidalMin = Math.round(weight * 6);
                const tidalMax = Math.round(weight * 8);
                value = `${tidalMin}–${tidalMax} ${equip.unit}`;
                details = '6–8 мл/кг';
                break;
            }
        }

        return `
            <div class="pediatric-equip-card ${equipId === 'gastricTube' ? 'equip-wide' : ''}">
                <div class="equip-icon">
                    <span class="material-symbols-rounded">${equip.icon}</span>
                </div>
                <div class="equip-content">
                    <div class="equip-name">${equip.name}</div>
                    <div class="equip-value">${value}</div>
                    <div class="equip-details">${details}</div>
                    ${equip.route ? `<div class="equip-route">${equip.route}</div>` : ''}
                    ${warning ? `<div class="equip-warning">${warning}</div>` : ''}
                    ${extraInfo}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ═══════════════════════════════════════

    estimateWeightByAge(ageYears) {
        if (ageYears <= 1) {
            return 3 + ageYears * 12 * 0.5;
        } else if (ageYears <= 10) {
            return 3 * ageYears + 7;
        } else {
            return 3 * ageYears + 7 + (ageYears - 10) * 2;
        }
    }

    estimateWeightByHeight(heightCm) {
        if (heightCm < 100) {
            return (heightCm - 50) * 0.3;
        } else {
            return (heightCm - 100) * 0.9;
        }
    }

    getWeightZone(weight) {
        const zone = this.data.weightZones.find(z => weight >= z.min && weight < z.max);
        return zone || this.data.weightZones[this.data.weightZones.length - 1];
    }

    // Определение эффективного возраста (прямой ввод или оценка по весу/росту)
    getEffectiveAge() {
        // Приоритет: прямой ввод возраста
        if (this.ageYears !== null) {
            return this.ageYears;
        }
        
        // Оценка по весу (обратная формула от estimateWeightByAge)
        if (this.weightKg !== null) {
            const w = this.weightKg;
            if (w <= 4.5) {
                // До 1 года: вес = 3 + возраст_мес × 0.5 → возраст = (вес - 3) / 0.5 / 12
                return Math.max(0, (w - 3) / 0.5 / 12);
            } else if (w <= 37) {
                // 1-10 лет: вес = 3×возраст + 7 → возраст = (вес - 7) / 3
                return Math.max(1, (w - 7) / 3);
            } else {
                // > 10 лет: вес = 3×возраст + 7 + 2×(возраст-10) = 5×возраст - 13
                // возраст = (вес + 13) / 5
                return Math.min(18, (w + 13) / 5);
            }
        }
        
        // Оценка по росту (обратная формула от estimateWeightByHeight + коррекция)
        if (this.heightCm !== null) {
            const h = this.heightCm;
            if (h < 75) {
                // Новорождённый ~50 см, +25 см/год в первый год
                return Math.max(0, (h - 50) / 25);
            } else if (h < 100) {
                // 1-4 года: ~75 см в 1 год, +6 см/год
                return 1 + (h - 75) / 6;
            } else if (h < 140) {
                // 4-10 лет: ~100 см в 4 года, +6 см/год
                return 4 + (h - 100) / 6;
            } else if (h < 160) {
                // 10-14 лет: ~140 см в 10 лет, +5 см/год
                return 10 + (h - 140) / 5;
            } else {
                // > 14 лет: ~160 см в 14 лет, +3 см/год
                return Math.min(18, 14 + (h - 160) / 3);
            }
        }
        
        return null;
    }

    // Возрастные нормы витальных показателей
        getNormalVitals(ageOverride = null) {
            const age = ageOverride !== null ? ageOverride : this.ageYears;
            if (age === null) return null;

        let hrMin, hrMax, rrMin, rrMax, sbpMin, sbpMax, dbpMin, dbpMax;

        if (age < 0.08) { // новорождённые (< 1 мес)
            hrMin = 120; hrMax = 160;
            rrMin = 30; rrMax = 60;
            sbpMin = 60; sbpMax = 90;
            dbpMin = 40; dbpMax = 60;
        } else if (age < 1) { // 1-12 мес
            hrMin = 100; hrMax = 160;
            rrMin = 25; rrMax = 50;
            sbpMin = 70; sbpMax = 100;
            dbpMin = 45; dbpMax = 70;
        } else if (age <= 3) { // 1-3 года
            hrMin = 90; hrMax = 140;
            rrMin = 24; rrMax = 40;
            sbpMin = 70 + 2 * age; sbpMax = 100 + 2 * age;
            dbpMin = 50; dbpMax = 70;
        } else if (age <= 6) { // 4-6 лет
            hrMin = 80; hrMax = 120;
            rrMin = 22; rrMax = 34;
            sbpMin = 70 + 2 * age; sbpMax = 110;
            dbpMin = 55; dbpMax = 75;
        } else if (age <= 12) { // 7-12 лет
            hrMin = 70; hrMax = 110;
            rrMin = 18; rrMax = 30;
            sbpMin = 70 + 2 * age; sbpMax = 120;
            dbpMin = 60; dbpMax = 80;
        } else { // > 12 лет
            hrMin = 60; hrMax = 100;
            rrMin = 12; rrMax = 20;
            sbpMin = 90; sbpMax = 130;
            dbpMin = 60; dbpMax = 85;
        }

        return {
            hr: { min: Math.round(hrMin), max: Math.round(hrMax) },
            rr: { min: Math.round(rrMin), max: Math.round(rrMax) },
            sbp: { min: Math.round(sbpMin), max: Math.round(sbpMax) },
            dbp: { min: Math.round(dbpMin), max: Math.round(dbpMax) }
        };
    }

    // Валидация и обрезка значений
    validateLimits() {
        const warnings = [];
        const softWarnings = []; // мягкие предупреждения (без обрезки)
        
        // Проверка веса
        if (this.weightKg !== null) {
            // Жёсткая обрезка только если ОЧЕНЬ далеко за пределами
            if (this.weightKg > this.limits.weight.max + 10) {
                this.weightKg = this.limits.weight.max;
                const input = document.getElementById('weight-input');
                if (input && document.activeElement !== input) input.value = this.limits.weight.max;
                warnings.push(`⚠️ Вес ограничен максимумом ${this.limits.weight.max} кг`);
            }
            if (this.weightKg < this.limits.weight.min && this.weightKg !== 0) {
                this.weightKg = this.limits.weight.min;
                const input = document.getElementById('weight-input');
                if (input && document.activeElement !== input) input.value = this.limits.weight.min;
            }
            if (this.weightKg >= this.limits.weight.warnThreshold && this.weightKg <= this.limits.weight.max) {
                softWarnings.push(`👤 Вес ${this.weightKg.toFixed(1)} кг — возможна взрослая масса тела`);
            }
        }
        
        // Проверка роста
        if (this.heightCm !== null) {
            // Жёсткая обрезка только если ОЧЕНЬ далеко за пределами
            if (this.heightCm > this.limits.height.max + 10) {
                this.heightCm = this.limits.height.max;
                const input = document.getElementById('height-input');
                if (input && document.activeElement !== input) input.value = this.limits.height.max;
                warnings.push(`⚠️ Рост ограничен максимумом ${this.limits.height.max} см`);
            }
            if (this.heightCm < this.limits.height.min && this.heightCm !== 0) {
                this.heightCm = this.limits.height.min;
                const input = document.getElementById('height-input');
                if (input && document.activeElement !== input) input.value = this.limits.height.min;
            }
            if (this.heightCm >= this.limits.height.warnThreshold && this.heightCm <= this.limits.height.max) {
                softWarnings.push(`👤 Рост ${this.heightCm.toFixed(0)} см — параметры подростка`);
            }
        }
        
        // Проверка возраста
        if (this.ageYears !== null) {
            // Жёсткая обрезка только если ОЧЕНЬ далеко за пределами
            if (this.ageYears > this.limits.age.max + 2) {
                this.ageYears = this.limits.age.max;
                const input = document.getElementById('age-input');
                if (input && document.activeElement !== input) input.value = this.limits.age.max;
                warnings.push(`⚠️ Возраст ограничен ${this.limits.age.max} годами`);
            }
            if (this.ageYears < this.limits.age.min && this.ageYears !== 0) {
                this.ageYears = this.limits.age.min;
                const input = document.getElementById('age-input');
                if (input && document.activeElement !== input) input.value = this.limits.age.min;
            }
            if (this.ageYears >= this.limits.age.warnThreshold && this.ageYears <= this.limits.age.max) {
                softWarnings.push(`👤 Возраст ${this.ageYears.toFixed(1)} лет — подросток, учитывайте взрослые дозировки`);
            }
        }
        
        // Объединяем все предупреждения
        const allWarnings = [...warnings, ...softWarnings];
        
        // Обновление баннера предупреждений
        const warningEl = document.getElementById('limits-warning');
        if (warningEl) {
            if (allWarnings.length > 0) {
                warningEl.style.display = '';
                warningEl.innerHTML = `
                    <div class="limits-warning-header">
                        <span class="material-symbols-rounded">info</span>
                        <span>Внимание</span>
                    </div>
                    <ul class="limits-warning-list">
                        ${allWarnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                `;
            } else {
                warningEl.style.display = 'none';
            }
        }
    }

    // ═══════════════════════════════════════
    // СОБЫТИЯ
    // ═══════════════════════════════════════

    setupEventListeners() {
        const weightInput = document.getElementById('weight-input');
        const heightInput = document.getElementById('height-input');
        const ageInput = document.getElementById('age-input');

        const onMainInput = () => {
            const w = parseFloat(weightInput.value);
            const h = parseFloat(heightInput.value);
            const a = parseFloat(ageInput.value);

            this.weightKg = (!isNaN(w) && weightInput.value.trim() !== '') ? w : null;
            this.heightCm = (!isNaN(h) && heightInput.value.trim() !== '') ? h : null;
            this.ageYears = (!isNaN(a) && ageInput.value.trim() !== '') ? a : null;

            // Переключаем класс has-value на WRAPPER (не на input)
            weightInput.closest('.pediatric-field-wrapper')
                ?.classList.toggle('has-value', weightInput.value.trim() !== '');
            heightInput.closest('.pediatric-field-wrapper')
                ?.classList.toggle('has-value', heightInput.value.trim() !== '');
            ageInput.closest('.pediatric-field-wrapper')
                ?.classList.toggle('has-value', ageInput.value.trim() !== '');

            this.validateLimits();
            this.updateResults();
        };

        weightInput?.addEventListener('input', onMainInput);
        heightInput?.addEventListener('input', onMainInput);
        ageInput?.addEventListener('input', onMainInput);

        // Делегирование для кнопок разведения норэпинефрина
        this.container.addEventListener('click', (e) => {
            const dilutionBtn = e.target.closest('.ne-dilution-btn');
            if (dilutionBtn) {
                this.norepinephrineDilution = parseInt(dilutionBtn.dataset.dilution);
                this.updateResults();
            }
        });
    }

    updateResults() {
        const panel = document.getElementById('result-panel');
        if (panel) {
            panel.innerHTML = this.renderResults();
        }
    }
}