import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class OdnScalePage {
    constructor(container) {
        this.container = container;
        this.selections = {
            dyspnea: null,
            accessoryMuscles: null,
            cyanosis: null,
            consciousness: null,
            rr: null,
            hr: null,
            spo2: null,
            pao2: null,
            paco2: null,
            fio2: null
        };
        
        this._clickHandler = null;
        this._inputHandler = null;
        
        this.data = {
            title: "Оценка тяжести ОДН",
            subtitle: "Острая дыхательная недостаточность",
            icon: "pulmonology",
            description: "Комплексная оценка тяжести острой дыхательной недостаточности на основе клинических признаков и газов крови.",
            reference: {
                title: "Об оценке",
                paragraphs: [
                    "Острая дыхательная недостаточность (ОДН) — синдром, при котором система дыхания не может обеспечить адекватный газообмен.",
                    "Оценка включает клинические признаки (одышка, участие вспомогательной мускулатуры, цианоз, сознание), частоту дыхания и сердечных сокращений, сатурацию кислорода (SpO2) и газы артериальной крови (PaO2, PaCO2).",
                    "Индекс Horowitz (PaO2/FiO2) — ключевой показатель тяжести: >300 — норма, 200-300 — лёгкая ОДН/ALI, <200 — тяжёлая ОДН/ARDS."
                ],
                importantNote: "Критерии ARDS (Berlin Definition 2012): острое начало, PaO2/FiO2 ≤ 300 при PEEP ≥ 5 см H₂O, двусторонние инфильтраты на КТ/рентгене, отсутствие признаков сердечной недостаточности.",
                legalReference: null,
                formulas: [
                    { name: 'Индекс Horowitz', formula: 'PaO₂/FiO₂ (мм рт. ст.)', example: '80 / 0.4 = 200 → умеренный ARDS' },
                    { name: 'Степень ARDS', formula: 'Лёгкий: 200-300, Умеренный: 100-200, Тяжёлый: <100', example: 'PaO₂/FiO₂ = 150 → умеренный ARDS' },
                    { name: 'A-a градиент', formula: '(FiO₂ × (760-47) - PaCO₂/0.8) - PaO₂', example: 'Норма: 5-15 мм рт. ст.' }
                ],
                quickRules: [
                    { icon: '🎯', rule: 'PaO₂/FiO₂ < 300 — есть ОДН' },
                    { icon: '🫁', rule: 'PaO₂/FiO₂ < 200 — ARDS (при PEEP ≥ 5)' },
                    { icon: '⚠️', rule: 'SpO₂ < 90% — тяжёлая гипоксемия' },
                    { icon: '💨', rule: 'ЧД > 30/мин — показание к ИВЛ' },
                    { icon: '🧠', rule: 'PaCO₂ > 60 — опасная гиперкапния' },
                    { icon: '🏥', rule: 'Баллы 8+ — респираторная поддержка, ОРИТ' }
                ],
                examples: [
                    {
                        scenario: 'Пациент с пневмонией: ЧД 28, SpO₂ 88%, PaO₂ 58, FiO₂ 21% (воздух)',
                        calculation: 'PaO₂/FiO₂ = 58/0.21 ≈ 276 → лёгкая ОДН/ALI. O₂ через маску'
                    },
                    {
                        scenario: 'Тяжёлая пневмония: ЧД 36, SpO₂ 84% на O₂ 60%, PaO₂ 65, FiO₂ 60%',
                        calculation: 'PaO₂/FiO₂ = 65/0.6 ≈ 108 → умеренный ARDS. NIV/CPAP, подготовка к интубации'
                    },
                    {
                        scenario: 'Сепсис с ОРДС: PaO₂ 55 на FiO₂ 80%, ЧД 40, сознание спутанное',
                        calculation: 'PaO₂/FiO₂ = 55/0.8 ≈ 69 → тяжёлый ARDS. Экстренная интубация, ИВЛ'
                    }
                ]
            },
            groups: [
                {
                    id: 'clinical',
                    title: 'Клинические признаки',
                    icon: 'stethoscope',
                    items: [
                        {
                            id: 'dyspnea',
                            title: 'Одышка',
                            options: [
                                { value: 0, title: 'Нет', points: 0 },
                                { value: 1, title: 'При нагрузке', points: 1 },
                                { value: 2, title: 'В покое', points: 2 },
                                { value: 3, title: 'Выраженная, не может говорить', points: 3 }
                            ]
                        },
                        {
                            id: 'accessoryMuscles',
                            title: 'Вспомогательная мускулатура',
                            options: [
                                { value: 0, title: 'Не участвует', points: 0 },
                                { value: 1, title: 'Умеренное участие', points: 1 },
                                { value: 2, title: 'Выраженное участие', points: 2 },
                                { value: 3, title: 'Парадоксальное дыхание', points: 3 }
                            ]
                        },
                        {
                            id: 'cyanosis',
                            title: 'Цианоз',
                            options: [
                                { value: 0, title: 'Нет', points: 0 },
                                { value: 1, title: 'Акроцианоз', points: 1 },
                                { value: 2, title: 'Диффузный цианоз', points: 2 }
                            ]
                        },
                        {
                            id: 'consciousness',
                            title: 'Сознание',
                            options: [
                                { value: 0, title: 'Ясное', points: 0 },
                                { value: 1, title: 'Возбуждение/тревога', points: 1 },
                                { value: 2, title: 'Спутанность/сонливость', points: 2 },
                                { value: 3, title: 'Кома', points: 3 }
                            ]
                        }
                    ]
                },
                {
                    id: 'vitals',
                    title: 'Витальные показатели',
                    icon: 'monitor_heart',
                    items: [
                        {
                            id: 'rr',
                            title: 'Частота дыхания (ЧД)',
                            type: 'number',
                            unit: '/мин',
                            min: 5,
                            max: 60,
                            ranges: [
                                { min: 0, max: 12, label: 'Брадикапноэ', points: 2, color: 'warning' },
                                { min: 12, max: 20, label: 'Норма', points: 0, color: 'success' },
                                { min: 20, max: 30, label: 'Тахипноэ', points: 1, color: 'warning' },
                                { min: 30, max: 40, label: 'Выраженное тахипноэ', points: 2, color: 'error' },
                                { min: 40, max: 100, label: 'Критическое', points: 3, color: 'error' }
                            ]
                        },
                        {
                            id: 'hr',
                            title: 'Частота сердечных сокращений (ЧСС)',
                            type: 'number',
                            unit: 'уд/мин',
                            min: 30,
                            max: 250,
                            ranges: [
                                { min: 0, max: 60, label: 'Брадикардия', points: 1, color: 'warning' },
                                { min: 60, max: 100, label: 'Норма', points: 0, color: 'success' },
                                { min: 100, max: 140, label: 'Тахикардия', points: 1, color: 'warning' },
                                { min: 140, max: 300, label: 'Выраженная тахикардия', points: 2, color: 'error' }
                            ]
                        },
                        {
                            id: 'spo2',
                            title: 'Сатурация кислорода (SpO2)',
                            type: 'number',
                            unit: '%',
                            min: 50,
                            max: 100,
                            ranges: [
                                { min: 95, max: 100, label: 'Норма', points: 0, color: 'success' },
                                { min: 90, max: 95, label: 'Лёгкая гипоксемия', points: 1, color: 'warning' },
                                { min: 85, max: 90, label: 'Умеренная гипоксемия', points: 2, color: 'warning' },
                                { min: 50, max: 85, label: 'Тяжёлая гипоксемия', points: 3, color: 'error' }
                            ]
                        }
                    ]
                },
                {
                    id: 'bloodGas',
                    title: 'Газы артериальной крови',
                    icon: 'bloodtype',
                    items: [
                        {
                            id: 'pao2',
                            title: 'PaO2 (парциальное давление O2)',
                            type: 'number',
                            unit: 'мм рт. ст.',
                            min: 20,
                            max: 600,
                            ranges: [
                                { min: 80, max: 100, label: 'Норма', points: 0, color: 'success' },
                                { min: 60, max: 80, label: 'Лёгкая гипоксемия', points: 1, color: 'warning' },
                                { min: 40, max: 60, label: 'Умеренная гипоксемия', points: 2, color: 'warning' },
                                { min: 20, max: 40, label: 'Тяжёлая гипоксемия', points: 3, color: 'error' }
                            ]
                        },
                        {
                            id: 'paco2',
                            title: 'PaCO2 (парциальное давление CO2)',
                            type: 'number',
                            unit: 'мм рт. ст.',
                            min: 10,
                            max: 120,
                            ranges: [
                                { min: 35, max: 45, label: 'Норма', points: 0, color: 'success' },
                                { min: 25, max: 35, label: 'Гипокапния', points: 1, color: 'warning' },
                                { min: 45, max: 60, label: 'Умеренная гиперкапния', points: 1, color: 'warning' },
                                { min: 60, max: 80, label: 'Выраженная гиперкапния', points: 2, color: 'error' },
                                { min: 80, max: 200, label: 'Критическая гиперкапния', points: 3, color: 'error' }
                            ]
                        },
                        {
                            id: 'fio2',
                            title: 'FiO2 (фракция кислорода во вдыхаемом воздухе)',
                            type: 'number',
                            unit: '%',
                            min: 21,
                            max: 100,
                            hint: '21% — воздух, 100% — чистый O2'
                        }
                    ]
                }
            ],
            severityLevels: [
                { min: 0, max: 3, label: 'Нет ОДН / Лёгкая', description: 'Компенсированное состояние. Наблюдение, оксигенотерапия при необходимости.', color: 'success', action: 'Наблюдение, мониторинг SpO2' },
                { min: 4, max: 7, label: 'Умеренная ОДН', description: 'Субкомпенсация. Требуется кислородотерапия, мониторинг газов крови.', color: 'warning', action: 'O2 через маску/назальные канюли, контроль газов крови' },
                { min: 8, max: 11, label: 'Тяжёлая ОДН', description: 'Декомпенсация. Показана респираторная поддержка (NIV/CPAP).', color: 'error', action: 'NIV/CPAP, подготовка к интубации, ОРИТ' },
                { min: 12, max: 100, label: 'Критическая ОДН / ARDS', description: 'Угрожающее жизни состояние. Необходима ИВЛ.', color: 'error', action: 'Экстренная интубация, ИВЛ, ОРИТ' }
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
        this.selections = {
            dyspnea: null, accessoryMuscles: null, cyanosis: null,
            consciousness: null, rr: null, hr: null, spo2: null,
            pao2: null, paco2: null, fio2: null
        };
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('odn-scale');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-odn',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'odn-scale',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page odn-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="odn-groups">
                    ${this.data.groups.map(group => `
                        <div class="odn-group">
                            <div class="odn-group-header">
                                <span class="material-symbols-rounded">${group.icon}</span>
                                <span class="odn-group-title">${group.title}</span>
                                <span class="odn-group-value" id="value-${group.id}">—</span>
                            </div>
                            <div class="odn-group-items">
                                ${group.items.map(item => this.renderItem(item)).join('')}
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

    renderItem(item) {
        if (item.type === 'number') {
            return `
                <div class="odn-number-item" data-item="${item.id}">
                    <div class="odn-number-label">${item.title}</div>
                    <div class="odn-number-input-wrapper">
                        <input type="number" 
                            class="odn-number-field" 
                            data-item="${item.id}"
                            min="${item.min}" 
                            max="${item.max}" 
                            step="1"
                            placeholder="—"
                            inputmode="numeric">
                        <span class="odn-number-unit-inside">${item.unit}</span>
                    </div>
                    ${item.hint ? `<div class="odn-number-hint">${item.hint}</div>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="odn-radio-group" data-item="${item.id}">
                <div class="odn-radio-label">${item.title}</div>
                <div class="odn-radio-options">
                    ${item.options.map(opt => `
                        <div class="odn-radio-item ripple" 
                            data-item="${item.id}" 
                            data-value="${opt.value}">
                            <div class="odn-radio-circle"><div class="odn-radio-dot"></div></div>
                            <div class="odn-radio-content">
                                <div class="odn-radio-title">${opt.title}</div>
                            </div>
                            <div class="odn-radio-points">${opt.points}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderResult() {
        const total = this.calculateTotal();
        const breakdown = this.getBreakdown();
        const allSelected = this.checkAllSelected();
        const horowitzIndex = this.calculateHorowitzIndex();
        
        if (!allSelected) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните все параметры</div>
                        <div class="result-description">Заполните: ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }
        
        const severity = this.getSeverity(total);
        const inlineStyle = getResultInlineStyle(severity.color);
        
        const horowitzBlock = horowitzIndex !== null ? `
            <div class="odn-horowitz-compact">
                <div class="horowitz-value">${horowitzIndex}</div>
                <div class="horowitz-label">PaO₂/FiO₂</div>
                <div class="horowitz-status">${this.getHorowitzStatus(horowitzIndex)}</div>
            </div>
        ` : '';
        
        return `
            <div class="result-content result-${severity.color}" style="${inlineStyle}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">баллов</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${severity.label}</div>
                    <div class="result-description">${severity.description}</div>
                    ${horowitzBlock}
                    <div class="result-action">${severity.action}</div>
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    calculateTotal() {
        let total = 0;
        
        ['dyspnea', 'accessoryMuscles', 'cyanosis', 'consciousness'].forEach(key => {
            if (this.selections[key] !== null) {
                total += this.selections[key];
            }
        });
        
        ['rr', 'hr', 'spo2', 'pao2', 'paco2'].forEach(key => {
            if (this.selections[key] !== null) {
                const group = this.data.groups.find(g => g.items.some(i => i.id === key));
                const item = group.items.find(i => i.id === key);
                const range = item.ranges.find(r => this.selections[key] >= r.min && this.selections[key] < r.max);
                if (range) total += range.points;
            }
        });
        
        return total;
    }

    calculateHorowitzIndex() {
        if (this.selections.pao2 !== null && this.selections.fio2 !== null && this.selections.fio2 > 0) {
            return Math.round(this.selections.pao2 / (this.selections.fio2 / 100));
        }
        return null;
    }

    getHorowitzStatus(index) {
        if (index > 300) return 'Норма';
        if (index > 200) return 'ALI / Лёгкий ARDS';
        if (index > 100) return 'Умеренный ARDS';
        return 'Тяжёлый ARDS';
    }

    checkAllSelected() {
        const requiredKeys = ['dyspnea', 'accessoryMuscles', 'cyanosis', 'consciousness', 'rr', 'hr', 'spo2'];
        return requiredKeys.every(key => this.selections[key] !== null);
    }

    getBreakdown() {
        const labels = {
            dyspnea: 'одышка', accessoryMuscles: 'вспом. мускулатура',
            cyanosis: 'цианоз', consciousness: 'сознание',
            rr: 'ЧД', hr: 'ЧСС', spo2: 'SpO2'
        };
        const missing = [];
        Object.keys(labels).forEach(key => {
            if (this.selections[key] === null) missing.push(labels[key]);
        });
        return { missing };
    }

    getSeverity(score) {
        return this.data.severityLevels.find(s => score >= s.min && score <= s.max) 
            || this.data.severityLevels[this.data.severityLevels.length - 1];
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

            const radioItem = e.target.closest('.odn-radio-item');
            if (radioItem && this.container.contains(radioItem)) {
                e.preventDefault();
                e.stopPropagation();
                this.selectRadio(radioItem);
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);

        this._inputHandler = (e) => {
            if (!e.target.matches('.odn-number-field')) return;
            this.handleNumberInput(e.target);
        };
        this.container.addEventListener('input', this._inputHandler, true);
    }

    selectRadio(item) {
        const itemId = item.dataset.item;
        const value = parseInt(item.dataset.value);

        this.container.querySelectorAll(`.odn-radio-item[data-item="${itemId}"]`).forEach(other => {
            other.classList.remove('selected');
        });

        item.classList.add('selected');
        this.selections[itemId] = value;

        this.updateGroupValue(itemId);
        this.updateResult();
    }

    handleNumberInput(input) {
        const itemId = input.dataset.item;
        const value = parseFloat(input.value);

        if (isNaN(value) || input.value.trim() === '') {
            this.selections[itemId] = null;
        } else {
            const group = this.data.groups.find(g => g.items.some(i => i.id === itemId));
            const item = group.items.find(i => i.id === itemId);
            
            if (value >= item.min && value <= item.max) {
                this.selections[itemId] = value;
            }
        }

        this.updateGroupValue(itemId);
        this.updateResult();
    }

    updateGroupValue(itemId) {
        const group = this.data.groups.find(g => g.items.some(i => i.id === itemId));
        if (!group) return;

        let groupTotal = 0;
        let hasValues = false;

        group.items.forEach(item => {
            if (this.selections[item.id] !== null) {
                hasValues = true;
                if (item.type === 'number') {
                    const range = item.ranges.find(r => this.selections[item.id] >= r.min && this.selections[item.id] < r.max);
                    if (range) groupTotal += range.points;
                } else {
                    groupTotal += this.selections[item.id];
                }
            }
        });

        const valueEl = this.container.querySelector(`#value-${group.id}`);
        if (valueEl) {
            valueEl.textContent = hasValues ? groupTotal : '—';
            valueEl.classList.toggle('has-value', hasValues);
        }
    }

    resetAll() {
        this.container.querySelectorAll('.odn-radio-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.container.querySelectorAll('.odn-number-field').forEach(input => {
            input.value = '';
        });
        this.container.querySelectorAll('.odn-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });

        this.selections = {
            dyspnea: null, accessoryMuscles: null, cyanosis: null,
            consciousness: null, rr: null, hr: null, spo2: null,
            pao2: null, paco2: null, fio2: null
        };

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