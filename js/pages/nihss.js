import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class NihssPage {
    constructor(container) {
        this.container = container;
        this.selections = {};
        this._clickHandler = null;
        
        this.data = {
            title: "Шкала инсульта NIHSS",
            subtitle: "National Institutes of Health Stroke Scale",
            icon: "neurology",
            description: "Стандартизированная количественная оценка тяжести неврологического дефицита при остром инсульте. 11 параметров с максимальной суммой 42 балла.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала инсульта Национального института здоровья США (NIHSS) разработана в 1989 году и является международным стандартом для количественной оценки тяжести неврологического дефицита при остром ишемическом и геморрагическом инсульте.",
                    "Шкала содержит 11 параметров, оценивающих уровень сознания, зрительные функции, движения, чувствительность, речь и когнитивные функции. Максимальная сумма — 42 балла, соответствует тяжелейшему инсульту с тотальным неврологическим дефицитом.",
                    "NIHSS критически важна для принятия решения о тромболизисе и тромбэктомии. Балл ≥ 6 обычно является показанием к тромбэктомии при окклюзии крупных сосудов в сочетании с данными нейровизуализации."
                ],
                importantNote: "Шкала оценивает наилучший ответ пациента. Движения рук и ног оцениваются отдельно для каждой стороны. При невозможности оценки параметра (например, ампутация, афазия) используется значение «Невозможно оценить» — оно не засчитывается в общую сумму.",
                legalReference: null,
                // ✅ Расширенное описание
                formulas: [
                    { 
                        name: 'Сумма NIHSS', 
                        formula: 'Сумма 11 параметров (0–42 балла)', 
                        example: '0+0+0+0+0+1+3+3+0+1+1+0+0 = 9 баллов' 
                    },
                    { 
                        name: 'Порог тромбэктомии', 
                        formula: 'NIHSS ≥ 6 + LVO на КТ-ангиографии', 
                        example: 'NIHSS = 15 + окклюзия ВСА → тромбэктомия' 
                    },
                    { 
                        name: 'Тромболизис', 
                        formula: 'До 4.5 ч от начала симптомов', 
                        example: 'NIHSS = 12, время 2 ч → альтеплаза 0.9 мг/кг' 
                    }
                ],
                quickRules: [
                    { icon: '🎯', rule: 'NIHSS ≥ 6 — показание к тромбэктомии (при LVO)' },
                    { icon: '⏱️', rule: 'Тромболизис: до 4.5 ч от начала симптомов' },
                    { icon: '🏥', rule: 'Тромбэктомия: до 24 ч при определённых условиях' },
                    { icon: '📊', rule: '0 баллов — нет дефицита, 42 — тотальный дефицит' },
                    { icon: '✋', rule: 'Руки и ноги оцениваются отдельно (лево/право)' },
                    { icon: '💡', rule: 'Оценивайте НАИЛУЧШИЙ ответ пациента' }
                ],
                examples: [
                    {
                        scenario: 'Пациент 68 лет, сознание ясное (0), ответы правильные (0), выполняет команды (0), взор не отклонён (0), поля зрения сохранены (0), лёгкий парез лица (1), левая рука падает (3), левая нога падает (3), атаксии нет (0), чувствительность снижена слева (1), лёгкая афазия (1), дизартрии нет (0), игнорирования нет (0)',
                        calculation: 'NIHSS = 0+0+0+0+0+1+3+3+0+1+1+0+0 = 9 баллов → умеренный инсульт → тромболизис'
                    },
                    {
                        scenario: 'Пациент 72 года, оглушение (2), не отвечает на вопросы (2), не выполняет команды (2), девиация взора (2), полная гемианопсия (2), полный парез лица справа (3), правая рука не двигается (4), правая нога не двигается (4), афазия немая (3), тотальная гемигипестезия (2)',
                        calculation: 'NIHSS = 2+2+2+2+2+3+4+4+0+2+3+0+2 = 28 баллов → тяжёлый инсульт → ОРИТ, тромбэктомия'
                    },
                    {
                        scenario: 'Пациент 55 лет, после ТИА — все параметры в норме',
                        calculation: 'NIHSS = 0 баллов → дефицита нет, но ТИА подтверждается клинически'
                    }
                ]
            },
            practicalNotes: {
                'questions': 'Пациента просят назвать свой возраст и текущий месяц. Правильный ответ на оба вопроса — 0 баллов.',
                'commands': 'Пациента просят открыть и закрыть глаза, затем сжать руку в кулак. Выполнение обеих инструкций — 0 баллов.',
                'aphasia': 'Лёгкая/умеренная афазия — некоторая потеря беглости или понимания. Тяжёлая — общение фрагментарное. Немая — отсутствие разумной речи.'
            },
            groups: [
                {
                    id: 'loc',
                    title: 'Уровень сознания',
                    icon: 'psychology',
                    subgroups: [
                        { id: 'loc_main', label: null, items: [
                            { value: 0, title: 'Бодрствует, реагирует адекватно' },
                            { value: 1, title: 'Лёгкая возбудимость, реагирует на минимальную стимуляцию' },
                            { value: 2, title: 'Заторможенность, требует многократного обращения' },
                            { value: 3, title: 'Реагирует только на рефлекторные стимулы или арефлексия' }
                        ]}
                    ]
                },
                {
                    id: 'questions',
                    title: 'Ответы на вопросы (возраст, месяц)',
                    icon: 'quiz',
                    note: 'questions',
                    subgroups: [
                        { id: 'questions_main', label: null, items: [
                            { value: 0, title: 'Правильный ответ на оба вопроса' },
                            { value: 1, title: 'Правильный ответ на один вопрос' },
                            { value: 2, title: 'Ни одного правильного ответа' }
                        ]}
                    ]
                },
                {
                    id: 'commands',
                    title: 'Выполнение инструкций',
                    icon: 'task_alt',
                    note: 'commands',
                    subgroups: [
                        { id: 'commands_main', label: null, items: [
                            { value: 0, title: 'Выполняет обе инструкции (открыть глаза, сжать кулак)' },
                            { value: 1, title: 'Выполняет одну инструкцию' },
                            { value: 2, title: 'Не выполняет ни одной инструкции' }
                        ]}
                    ]
                },
                {
                    id: 'gaze',
                    title: 'Парез взора',
                    icon: 'visibility',
                    subgroups: [
                        { id: 'gaze_main', label: null, items: [
                            { value: 0, title: 'Норма' },
                            { value: 1, title: 'Частичный паралич, вынужденная девиация отсутствует' },
                            { value: 2, title: 'Вынужденная девиация или полный паралич (не корректируется окулоцефальным манёвром)' }
                        ]}
                    ]
                },
                {
                    id: 'visual',
                    title: 'Поля зрения',
                    icon: 'panorama',
                    subgroups: [
                        { id: 'visual_main', label: null, items: [
                            { value: 0, title: 'Сохранены' },
                            { value: 1, title: 'Частичная гемианопсия' },
                            { value: 2, title: 'Полная гемианопсия' },
                            { value: 3, title: 'Слепота (двусторонняя гемианопсия, включая кортикальную слепоту)' }
                        ]}
                    ]
                },
                {
                    id: 'facial',
                    title: 'Парез лицевой мускулатуры',
                    icon: 'face',
                    subgroups: [
                        { id: 'facial_main', label: null, items: [
                            { value: 0, title: 'Норма, симметричные движения' },
                            { value: 1, title: 'Незначительный парез (сглаженность носогубной складки)' },
                            { value: 2, title: 'Частичный парез (отчётливая асимметрия при улыбке)' },
                            { value: 3, title: 'Полный одно- или двусторонний паралич' }
                        ]}
                    ]
                },
                {
                    id: 'arm',
                    title: 'Движения в руках',
                    icon: 'front_hand',
                    dual: true,
                    subgroups: [
                        { id: 'arm_left', label: 'Левая рука', items: [
                            { value: 0, title: 'Нет пареза (удерживает 10 сек)' },
                            { value: 1, title: 'Дрейфует, но не ударяется о опору' },
                            { value: 2, title: 'Некоторое усилие против силы тяжести' },
                            { value: 3, title: 'Не удерживает, падает' },
                            { value: 4, title: 'Полное отсутствие движений' }
                        ]},
                        { id: 'arm_right', label: 'Правая рука', items: [
                            { value: 0, title: 'Нет пареза (удерживает 10 сек)' },
                            { value: 1, title: 'Дрейфует, но не ударяется о опору' },
                            { value: 2, title: 'Некоторое усилие против силы тяжести' },
                            { value: 3, title: 'Не удерживает, падает' },
                            { value: 4, title: 'Полное отсутствие движений' }
                        ]}
                    ]
                },
                {
                    id: 'leg',
                    title: 'Движения в ногах',
                    icon: 'directions_walk',
                    dual: true,
                    subgroups: [
                        { id: 'leg_left', label: 'Левая нога', items: [
                            { value: 0, title: 'Нет пареза (удерживает 5 сек)' },
                            { value: 1, title: 'Дрейфует, но не ударяется о опору' },
                            { value: 2, title: 'Падает, но прилагает усилия против силы тяжести' },
                            { value: 3, title: 'Не удерживает, падает' },
                            { value: 4, title: 'Полное отсутствие движений' }
                        ]},
                        { id: 'leg_right', label: 'Правая нога', items: [
                            { value: 0, title: 'Нет пареза (удерживает 5 сек)' },
                            { value: 1, title: 'Дрейфует, но не ударяется о опору' },
                            { value: 2, title: 'Падает, но прилагает усилия против силы тяжести' },
                            { value: 3, title: 'Не удерживает, падает' },
                            { value: 4, title: 'Полное отсутствие движений' }
                        ]}
                    ]
                },
                {
                    id: 'ataxia',
                    title: 'Атаксия конечностей',
                    icon: 'balance',
                    subgroups: [
                        { id: 'ataxia_main', label: null, items: [
                            { value: 0, title: 'Атаксия отсутствует' },
                            { value: 1, title: 'Атаксия в одной конечности' },
                            { value: 2, title: 'Атаксия в двух и более конечностях' }
                        ]}
                    ]
                },
                {
                    id: 'sensory',
                    title: 'Чувствительность',
                    icon: 'touch_app',
                    subgroups: [
                        { id: 'sensory_main', label: null, items: [
                            { value: 0, title: 'Норма, симметричная' },
                            { value: 1, title: 'Умеренная гемигипестезия' },
                            { value: 2, title: 'Тяжёлая или тотальная гемигипестезия' }
                        ]}
                    ]
                },
                {
                    id: 'language',
                    title: 'Лучшая функция языка',
                    icon: 'chat',
                    note: 'aphasia',
                    subgroups: [
                        { id: 'language_main', label: null, items: [
                            { value: 0, title: 'Афазия отсутствует' },
                            { value: 1, title: 'Лёгкая или умеренная афазия' },
                            { value: 2, title: 'Тяжёлая афазия (фрагментарная речь)' },
                            { value: 3, title: 'Немая (глобальная) афазия' }
                        ]}
                    ]
                },
                {
                    id: 'dysarthria',
                    title: 'Артикуляция / дизартрия',
                    icon: 'record_voice_over',
                    subgroups: [
                        { id: 'dysarthria_main', label: null, items: [
                            { value: 0, title: 'Норма, чёткая речь' },
                            { value: 1, title: 'Лёгкая или умеренная дизартрия' },
                            { value: 2, title: 'Выраженная дизартрия (речь не поддаётся пониманию)' }
                        ]}
                    ]
                },
                {
                    id: 'extinction',
                    title: 'Угасание рефлекса / невнимательность',
                    icon: 'remove_red_eye',
                    subgroups: [
                        { id: 'extinction_main', label: null, items: [
                            { value: 0, title: 'Отсутствует' },
                            { value: 1, title: 'Невнимательность в одной модальности' },
                            { value: 2, title: 'Глубокое игнорирование или угасание в нескольких модальностях' }
                        ]}
                    ]
                }
            ],
            resultRanges: [
                { min: 0, max: 0, label: 'Нет неврологического дефицита', description: 'Все функции сохранены. ТИА или лакунарный инсульт?', color: 'gcs-15' },
                { min: 1, max: 4, label: 'Лёгкий инсульт', description: 'Незначительный неврологический дефицит. Рассмотреть тромболизис при наличии показаний.', color: 'gcs-14' },
                { min: 5, max: 15, label: 'Умеренный инсульт', description: 'Чётко выраженный неврологический дефицит. Показана тромболитическая терапия в терапевтическом окне.', color: 'gcs-11-12' },
                { min: 16, max: 20, label: 'Среднетяжёлый-тяжёлый инсульт', description: 'Значительный дефицит. Рассмотреть тромбэктомию при окклюзии крупных сосудов.', color: 'gcs-8-10' },
                { min: 21, max: 42, label: 'Тяжёлый инсульт', description: 'Тотальный неврологический дефицит. Высокий риск малигнизации отёка. ИТ в ОРИТ.', color: 'gcs-3' }
            ]
        };
    }

    cleanup() {
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
        this.selections = {};
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('nihss');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-nihss',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'nihss',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page nihss-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="gcs-groups">
                    ${this.data.groups.map(group => `
                        <div class="gcs-group">
                            <div class="gcs-group-header">
                                <span class="material-symbols-rounded">${group.icon}</span>
                                <span class="gcs-group-title">${group.title}</span>
                                <span class="gcs-group-value" id="value-${group.id}">—</span>
                            </div>
                            ${group.note ? `
                                <div class="nihss-group-note">
                                    <span class="material-symbols-rounded">help_outline</span>
                                    ${this.data.practicalNotes[group.note]}
                                </div>
                            ` : ''}
                            <div class="gcs-group-items">
                                ${group.subgroups.map(sg => `
                                    ${group.dual ? `<div class="nihss-subgroup-label">${sg.label}</div>` : ''}
                                    ${sg.items.map(item => `
                                        <div class="gcs-radio-item ripple" 
                                             data-subgroup="${sg.id}" 
                                             data-value="${item.value}">
                                            <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
                                            <div class="gcs-radio-content">
                                                <div class="gcs-radio-title">${item.title}</div>
                                            </div>
                                            <div class="gcs-radio-points">${item.value}</div>
                                        </div>
                                    `).join('')}
                                `).join('')}
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
        const total = this.calculateTotal();
        const filledCount = Object.keys(this.selections).length;
        const totalSubgroups = this.countTotalSubgroups();

        if (filledCount < totalSubgroups) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните все параметры</div>
                        <div class="result-description">Осталось: ${totalSubgroups - filledCount} из ${totalSubgroups}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const range = this.getRange(total);
        const inlineStyle = getResultInlineStyle(range.color);

        return `
            <div class="result-content result-${range.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">из 42 баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${range.label}</div>
                    <div class="result-description">${range.description}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    countTotalSubgroups() {
        let count = 0;
        this.data.groups.forEach(g => {
            count += g.subgroups.length;
        });
        return count;
    }

    calculateTotal() {
        let total = 0;
        for (const key in this.selections) {
            total += this.selections[key];
        }
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max)
            || this.data.resultRanges[this.data.resultRanges.length - 1];
    }

    calculateGroupScore(groupId) {
        const group = this.data.groups.find(g => g.id === groupId);
        if (!group) return 0;
        let sum = 0;
        group.subgroups.forEach(sg => {
            if (this.selections[sg.id] !== undefined) {
                sum += this.selections[sg.id];
            }
        });
        return sum;
    }

    findGroupIdBySubgroup(subgroupId) {
        for (const group of this.data.groups) {
            if (group.subgroups.some(sg => sg.id === subgroupId)) {
                return group.id;
            }
        }
        return null;
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

            const item = e.target.closest('.gcs-radio-item');
            if (!item || !this.container.contains(item)) return;

            e.preventDefault();
            e.stopPropagation();
            this.selectItem(item);
        };

        this.container.addEventListener('click', this._clickHandler, true);
    }

    selectItem(item) {
        const subgroup = item.dataset.subgroup;
        const value = parseInt(item.dataset.value);

        this.container.querySelectorAll(`.gcs-radio-item[data-subgroup="${subgroup}"]`).forEach(other => {
            other.classList.remove('selected');
        });

        item.classList.add('selected');
        this.selections[subgroup] = value;

        const groupId = this.findGroupIdBySubgroup(subgroup);
        if (groupId) {
            const groupScore = this.calculateGroupScore(groupId);
            const valueEl = this.container.querySelector(`#value-${groupId}`);
            if (valueEl) {
                valueEl.textContent = groupScore > 0 ? groupScore : '0';
                valueEl.classList.add('has-value');
            }
        }

        this.updateResult();
    }

    resetAll() {
        this.container.querySelectorAll('.gcs-radio-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.selections = {};
        this.container.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
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