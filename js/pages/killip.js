import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class KillipPage {
    constructor(container) {
        this.container = container;
        this.selectedClass = null;
        this._clickHandler = null;
        
        this.data = {
            title: "Классификация Killip",
            subtitle: "Тяжесть сердечной недостаточности при ОИМ",
            icon: "cardiology",
            description: "Классификация тяжести острой сердечной недостаточности у пациентов с острым инфарктом миокарда. Определяет прогноз и тактику лечения.",
            reference: {
                title: "О классификации",
                paragraphs: [
                    "Классификация Killip была предложена в 1967 году для стратификации риска у пациентов с острым инфарктом миокарда (ОИМ). Она основана на клинических признаках сердечной недостаточности, выявляемых при физикальном обследовании.",
                    "Классификация включает 4 класса, отражающих нарастание тяжести СН — от отсутствия признаков (класс I) до кардиогенного шока (класс IV). Классы взаимоисключающие: пациент относится только к одному классу на момент оценки.",
                    "Историческая 30-дневная летальность по данным оригинального исследования Killip и Kimball (1967): класс I — 6%, класс II — 17%, класс III — 38%, класс IV — 81%. В современной практике с применением тромболизиса и ЧКВ летальность значительно ниже, но стратификация сохраняет прогностическую ценность."
                ],
                importantNote: "Классификация Killip применяется преимущественно при остром инфаркте миокарда. Для оценки хронической сердечной недостаточности используется классификация NYHA или шкала Матвеева (ШСХН).",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Индекс шока Альговера', 
                        formula: 'ИА = ЧСС / САД', 
                        example: '120 / 80 = 1.5 → шок' 
                    },
                    { 
                        name: 'Сердечный индекс', 
                        formula: 'СИ = СВ / ПТ (норма 2.5-4.0 л/мин/м²)', 
                        example: 'СИ < 2.2 → кардиогенный шок' 
                    }
                ],
                quickRules: [
                    { icon: '✅', rule: 'Класс I — лёгкие чистые, САД ≥ 100, нет признаков СН' },
                    { icon: '⚠️', rule: 'Класс II — хрипы в нижних отделах, III тон, набухание ЯВ' },
                    { icon: '🚨', rule: 'Класс III — отёк лёгких, хрипы над всеми полями, SpO₂ < 90%' },
                    { icon: '💀', rule: 'Класс IV — кардиогенный шок, САД < 90, гипоперфузия' },
                    { icon: '💊', rule: 'Класс II-III — фуросемид, нитраты, кислород' },
                    { icon: '🏥', rule: 'Класс IV — норадреналин, инотропы, экстренная ЧКВ' }
                ],
                examples: [
                    {
                        scenario: 'Пациент 65 лет с ОИМ, лёгкие чистые, САД 130, нет одышки, III тона нет',
                        calculation: 'Killip I — стандартная терапия ОИМ, ранняя реперфузия'
                    },
                    {
                        scenario: 'Пациент с ОИМ, влажные хрипы в нижних отделах лёгких, III тон, САД 115',
                        calculation: 'Killip II — фуросемид в/в, нитраты, кислород, ЧКВ'
                    },
                    {
                        scenario: 'ОИМ, влажные хрипы над всей поверхностью лёгких, ортопноэ, пенистая мокрота, SpO₂ 88%',
                        calculation: 'Killip III — НИВЛ (CPAP/BiPAP), нитроглицерин в/в, экстренная ЧКВ'
                    },
                    {
                        scenario: 'ОИМ, САД 75, олигурия (<20 мл/ч), холодные конечности, спутанность сознания',
                        calculation: 'Killip IV — норадреналин, инотропы, экстренная ЧКВ, ВАКБ/ECMO'
                    }
                ]
            },
            classes: [
                {
                    id: 'I',
                    value: 1,
                    title: 'Класс I — Нет признаков СН',
                    mortality: '6%',
                    mortalityModern: '2-3%',
                    color: 'gcs-15',
                    description: 'Отсутствие клинических признаков застойной сердечной недостаточности.',
                    signs: [
                        'Лёгкие чистые, хрипы не выслушиваются',
                        'Нет набухания шейных вен',
                        'Нет периферических отёков',
                        'Отсутствие III тона сердца (ритма галопа)',
                        'САД ≥ 100 мм рт. ст.'
                    ],
                    management: [
                        'Стандартная терапия ОИМ',
                        'Мониторинг витальных функций',
                        'Ранняя реперфузия (ЧКВ/тромболизис)',
                        'Наблюдение в ОРИТ/кардиоблоке'
                    ]
                },
                {
                    id: 'II',
                    value: 2,
                    title: 'Класс II — Лёгкая-умеренная СН',
                    mortality: '17%',
                    mortalityModern: '5-8%',
                    color: 'gcs-11-12',
                    description: 'Признаки застоя в малом круге кровообращения без отёка лёгких.',
                    signs: [
                        'Влажные хрипы в нижних отделах лёгких (до 1/2 полей)',
                        'Набухание шейных вен',
                        'III тон сердца (ритм галопа)',
                        'Может быть тахикардия',
                        'САД ≥ 100 мм рт. ст.'
                    ],
                    management: [
                        'Диуретики (фуросемид в/в)',
                        'Нитраты (при отсутствии гипотензии)',
                        'Кислородотерапия',
                        'Мониторинг диуреза и SpO₂',
                        'Экстренная реперфузия'
                    ]
                },
                {
                    id: 'III',
                    value: 3,
                    title: 'Класс III — Отёк лёгких',
                    mortality: '38%',
                    mortalityModern: '10-15%',
                    color: 'gcs-8-10',
                    description: 'Острый отёк лёгких с выраженной дыхательной недостаточностью.',
                    signs: [
                        'Влажные хрипы над всей поверхностью лёгких',
                        'Выраженная одышка, ортопноэ',
                        'Пенистая мокрота (может быть розовая)',
                        'Цианоз, акроцианоз',
                        'Тахикардия, тахипноэ',
                        'SpO₂ < 90% на воздухе'
                    ],
                    management: [
                        'Неинвазивная ИВЛ (CPAP/BiPAP)',
                        'Нитроглицерин в/в (при САД > 110)',
                        'Фуросемид в/в болюсно',
                        'Морфин в/в (осторожно)',
                        'Оксигенотерапия 100%',
                        'Экстренная ЧКВ',
                        'Готовность к интубации'
                    ]
                },
                {
                    id: 'IV',
                    value: 4,
                    title: 'Класс IV — Кардиогенный шок',
                    mortality: '81%',
                    mortalityModern: '40-50%',
                    color: 'gcs-3',
                    description: 'Кардиогенный шок с гипоперфузией органов и тканей.',
                    signs: [
                        'САД < 90 мм рт. ст. (или падение на ≥30 от исходного)',
                        'Признаки гипоперфузии: олигурия (<20 мл/ч), спутанность сознания, холодные конечности',
                        'Мраморность кожи, акроцианоз',
                        'Может сочетаться с отёком лёгких',
                        'Индекс шока Альговера > 1.0',
                        'СИ < 2.2 л/мин/м² (при инвазивном мониторинге)'
                    ],
                    management: [
                        'Вазопрессоры (норадреналин — препарат выбора)',
                        'Инотропы (добутамин) при низкой сократимости',
                        'Экстренная ЧКВ — улучшает прогноз',
                        'Рассмотреть ВАКБ (внутриаортальная баллонная контрпульсация)',
                        'Рассмотреть ECMO при рефрактерном шоке',
                        'Интубация и ИВЛ при дыхательной недостаточности',
                        'Катетеризация центральной вены, контроль ЦВД'
                    ]
                }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selectedClass = null;
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('killip');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-killip',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'killip',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page killip-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="killip-classes">
                    ${this.data.classes.map(cls => `
                        <div class="killip-class card card-outlined ${this.selectedClass === cls.id ? 'selected' : ''}" 
                             data-class="${cls.id}">
                            <div class="killip-class-header">
                                <div class="killip-class-badge ${cls.color}">${cls.id}</div>
                                <div class="killip-class-title">${cls.title}</div>
                            </div>
                            <div class="killip-class-description">${cls.description}</div>
                            
                            <div class="killip-section">
                                <div class="killip-section-title">
                                    <span class="material-symbols-rounded">stethoscope</span>
                                    Клинические признаки
                                </div>
                                <ul class="killip-list">
                                    ${cls.signs.map(s => `<li>${s}</li>`).join('')}
                                </ul>
                            </div>

                            <div class="killip-section">
                                <div class="killip-section-title">
                                    <span class="material-symbols-rounded">local_hospital</span>
                                    Тактика лечения
                                </div>
                                <ul class="killip-list killip-list-management">
                                    ${cls.management.map(m => `<li>${m}</li>`).join('')}
                                </ul>
                            </div>

                            <div class="killip-mortality">
                                <div class="killip-mortality-item">
                                    <div class="killip-mortality-label">Историческая летальность</div>
                                    <div class="killip-mortality-value">${cls.mortality}</div>
                                </div>
                                <div class="killip-mortality-item">
                                    <div class="killip-mortality-label">Современная летальность</div>
                                    <div class="killip-mortality-value">${cls.mortalityModern}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
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
        if (!this.selectedClass) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">не выбрано</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите класс Killip</div>
                        <div class="result-description">Нажмите на карточку класса, соответствующего состоянию пациента</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const cls = this.data.classes.find(c => c.id === this.selectedClass);
        const inlineStyle = getResultInlineStyle(cls.color);
        const topManagement = cls.management.slice(0, 4);

        return `
            <div class="result-content result-${cls.color} killip-result" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${cls.id}</div>
                    <div class="result-score-label">класс</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${cls.title}</div>
                    <div class="result-description">${cls.description}</div>
                    
                    <div class="killip-result-mortality">
                        <div class="killip-result-mortality-item">
                            <span class="killip-mortality-icon">📊</span>
                            <span>Летальность: <strong>${cls.mortality}</strong> (истор.) → <strong>${cls.mortalityModern}</strong> (совр.)</span>
                        </div>
                    </div>

                    <div class="killip-result-management">
                        <div class="killip-management-title">
                            <span class="material-symbols-rounded">medical_services</span>
                            Тактика:
                        </div>
                        <ul class="killip-management-list">
                            ${topManagement.map(m => `<li>${m}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    setupEventListeners() {
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

            const classCard = e.target.closest('.killip-class');
            if (classCard && this.container.contains(classCard)) {
                e.preventDefault();
                this.selectClass(classCard.dataset.class);
                return;
            }
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }

    selectClass(classId) {
        if (this.selectedClass === classId) {
            this.selectedClass = null;
        } else {
            this.selectedClass = classId;
        }

        this.container.querySelectorAll('.killip-class').forEach(c => {
            c.classList.toggle('selected', c.dataset.class === this.selectedClass);
        });

        this.updateResult();
    }

    resetAll() {
        this.selectedClass = null;
        this.container.querySelectorAll('.killip-class.selected').forEach(c => {
            c.classList.remove('selected');
        });
        this.updateResult();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }
}