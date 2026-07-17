import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class NihssPage {
    constructor(container) {
        this.container = container;
        // Для каждой подгруппы храним выбранный индекс варианта
        this.selections = {};
        
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
                legalReference: null
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

    async render() {
        storage.addRecent({
            id: 'calc-nihss',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'nihss'
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
                                        <label class="gcs-radio-item ripple" 
                                               data-subgroup="${sg.id}" 
                                               data-value="${item.value}">
                                            <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
                                            <div class="gcs-radio-content">
                                                <div class="gcs-radio-title">${item.title}</div>
                                            </div>
                                            <div class="gcs-radio-points">${item.value}</div>
                                        </label>
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
        bindInfoButton(this.data);
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

        return `
            <div class="result-content result-${range.color}">
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
        return count; // 11 + 2 (руки) + 2 (ноги) - 2 = 13
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

    setupEventListeners() {
        document.querySelectorAll('.gcs-radio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectItem(item);
            });
        });
        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    selectItem(item) {
        const subgroup = item.dataset.subgroup;
        const value = parseInt(item.dataset.value);

        // Снимаем выбор с других в этой подгруппе
        document.querySelectorAll(`.gcs-radio-item[data-subgroup="${subgroup}"]`).forEach(other => {
            other.classList.remove('selected');
        });

        item.classList.add('selected');
        this.selections[subgroup] = value;

        // Обновляем бейдж в заголовке группы
        const groupId = this.findGroupIdBySubgroup(subgroup);
        if (groupId) {
            const groupScore = this.calculateGroupScore(groupId);
            const valueEl = document.getElementById(`value-${groupId}`);
            if (valueEl) {
                valueEl.textContent = groupScore > 0 ? groupScore : '0';
                valueEl.classList.add('has-value');
            }
        }

        this.updateResult();
    }

    findGroupIdBySubgroup(subgroupId) {
        for (const group of this.data.groups) {
            if (group.subgroups.some(sg => sg.id === subgroupId)) {
                return group.id;
            }
        }
        return null;
    }

    resetAll() {
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => item.classList.remove('selected'));
        this.selections = {};
        document.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
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