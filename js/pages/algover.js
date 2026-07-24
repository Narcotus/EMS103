import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton, getResultInlineStyle, loadCalculatorCSS } from '../calculator-utils.js';

export default class AlgoverPage {
    constructor(container) {
        this.container = container;
        this.hrValue = null;
        this.sbpValue = null;
        this._inputHandler = null;
        this._clickHandler = null;
        
        this.data = {
            title: "Индекс Альговера",
            subtitle: "Шоковый индекс",
            icon: "bloodtype",
            description: "Простой и быстрый метод оценки тяжести шока и объёма кровопотери. Рассчитывается как отношение ЧСС к систолическому АД. Помогает выявить скрытый шок при нормальном АД.",
            reference: {
                title: "Об индексе",
                paragraphs: [
                    "Индекс Альговера (Algover Index, Shock Index, SI) был предложен швейцарским хирургом Марселем Альговером в 1970-х годах. Это отношение частоты сердечных сокращений (ЧСС) к систолическому артериальному давлению (САД).",
                    "У здоровых взрослых индекс составляет 0.5–0.7. Повышение индекса является более чувствительным маркером шока, чем изолированная тахикардия или гипотензия. У детей нормальные значения выше (0.8–1.0 у младенцев, 0.7–0.9 у старших детей).",
                    "Индекс особенно полезен для выявления компенсированного шока, когда АД ещё сохраняется за счёт компенсаторных механизмов, но тахикардия уже указывает на гиповолемию. Широко используется в травматологии, акушерстве и экстренной медицине."
                ],
                importantNote: "Индекс Альговера > 1.0 указывает на потерю ≥ 20% ОЦК и требует немедленного начала инфузионной терапии. Индекс > 1.5 — показание к экстренной трансфузии и хирургическому вмешательству.",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Индекс Альговера', 
                        formula: 'ИА = ЧСС / САД', 
                        example: 'ЧСС 110, САД 90 → ИА = 110/90 = 1.22 → шок средней тяжести' 
                    },
                    { 
                        name: 'Оценка кровопотери', 
                        formula: 'ИА 0.7-1.0 → 10-20% ОЦК, ИА 1.0-1.5 → 20-40% ОЦК', 
                        example: 'ИА 1.3 → потеря ~1500 мл (30% ОЦК)' 
                    }
                ],
                quickRules: [
                    { icon: '✅', rule: '0.5-0.7 — норма, гемодинамика стабильна' },
                    { icon: '⚠️', rule: '0.7-1.0 — субкомпенсация, потеря 10-20% ОЦК' },
                    { icon: '🚨', rule: '1.0-1.5 — шок средней тяжести, потеря 20-40% ОЦК' },
                    { icon: '💀', rule: '1.5-2.0 — тяжёлый шок, потеря 40-50% ОЦК' },
                    { icon: '☠️', rule: '> 2.0 — крайне тяжёлый шок, терминальное состояние' },
                    { icon: '💧', rule: 'ИА ≥ 1.0 → немедленная инфузионная терапия!' }
                ],
                examples: [
                    {
                        scenario: 'Пациент после ДТП, ЧСС 120 уд/мин, САД 85 мм рт.ст.',
                        calculation: 'ИА = 120/85 = 1.41 → шок средней тяжести → потеря ~1800 мл → два венозных доступа, быстрая инфузия'
                    },
                    {
                        scenario: 'Родильница, ЧСС 100 уд/мин, САД 100 мм рт.ст.',
                        calculation: 'ИА = 100/100 = 1.0 → граница шока → потеря ~1000 мл → мониторинг, венозный доступ'
                    },
                    {
                        scenario: 'Пациент с ЖКК, ЧСС 95 уд/мин, САД 130 мм рт.ст.',
                        calculation: 'ИА = 95/130 = 0.73 → субкомпенсация → потеря ~700 мл → наблюдение, подготовка к эндоскопии'
                    }
                ]
            },
            ranges: [
                {
                    min: 0.0, max: 0.7,
                    label: 'Норма',
                    bloodLoss: '< 10%',
                    bloodLossMl: '< 500 мл',
                    class: 'Компенсация',
                    description: 'Гемодинамика стабильна. Компенсаторные механизмы достаточны.',
                    color: 'gcs-15',
                    therapy: 'Наблюдение. Пероральная регидратация при необходимости.'
                },
                {
                    min: 0.71, max: 0.99,
                    label: 'Субкомпенсация',
                    bloodLoss: '10–20%',
                    bloodLossMl: '500–1000 мл',
                    class: 'Класс II',
                    description: 'Начальные признаки гиповолемии. АД может сохраняться.',
                    color: 'gcs-14',
                    therapy: 'Венозный доступ. Кристаллоиды до 1000 мл. Мониторинг диуреза.'
                },
                {
                    min: 1.0, max: 1.49,
                    label: 'Шок средней тяжести',
                    bloodLoss: '20–40%',
                    bloodLossMl: '1000–2000 мл',
                    class: 'Класс III',
                    description: 'Декомпенсация. Клинически явный шок, гипотензия.',
                    color: 'gcs-8-10',
                    therapy: 'Два венозных доступа. Быстрая инфузия кристаллоидов. Рассмотреть трансфузию эритроцитарной массы. Источник кровотечения!'
                },
                {
                    min: 1.5, max: 2.0,
                    label: 'Тяжёлый шок',
                    bloodLoss: '40–50%',
                    bloodLossMl: '2000–2500 мл',
                    class: 'Класс IV',
                    description: 'Угрожающий жизни шок. Высокий риск полиорганной недостаточности.',
                    color: 'gcs-4-5',
                    therapy: 'Массивная трансфузия (эритроцитарная масса + СЗП + тромбоциты 1:1:1). Транексамовая кислота. Экстренное хирургическое вмешательство.'
                },
                {
                    min: 2.01, max: 99,
                    label: 'Крайне тяжёлый шок',
                    bloodLoss: '> 50%',
                    bloodLossMl: '> 2500 мл',
                    class: 'Терминальный',
                    description: 'Преагональное состояние. Необратимые изменения.',
                    color: 'gcs-3',
                    therapy: 'Максимальная реанимация. Рекомбинантный фактор VIIa при рефрактерном кровотечении. Прогноз неблагоприятный.'
                }
            ]
        };
    }

    cleanup() {
        if (this._inputHandler && this.container) {
            this.container.removeEventListener('input', this._inputHandler, true);
            this._inputHandler = null;
        }
        if (this._clickHandler && this.container) {
            this.container.removeEventListener('click', this._clickHandler, true);
            this._clickHandler = null;
        }
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('algover');
        try {
            storage.addRecent({
                id: 'calc-algover',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'algover'
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page algover-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Поля ввода -->
                <div class="algover-inputs card card-outlined">
                    <div class="algover-input-group">
                        <label class="algover-input-label">
                            <span class="material-symbols-rounded">monitor_heart</span>
                            Частота сердечных сокращений
                        </label>
                        <div class="algover-input-row">
                            <input type="number" id="hr-input" class="algover-field" 
                                   min="20" max="250" step="1" placeholder="—" inputmode="numeric">
                            <span class="algover-unit">уд/мин</span>
                        </div>
                    </div>

                    <div class="algover-input-group">
                        <label class="algover-input-label">
                            <span class="material-symbols-rounded">blood_pressure</span>
                            Систолическое АД
                        </label>
                        <div class="algover-input-row">
                            <input type="number" id="sbp-input" class="algover-field" 
                                   min="20" max="300" step="1" placeholder="—" inputmode="numeric">
                            <span class="algover-unit">мм рт. ст.</span>
                        </div>
                    </div>

                    <div class="algover-formula-hint">
                        <span class="material-symbols-rounded">functions</span>
                        ИА = ЧСС / САД · Норма: 0.5–0.7
                    </div>
                </div>

                <!-- Шкала с визуализацией -->
                <div class="algover-scale-card card card-outlined">
                    <div class="algover-scale-title">
                        <span class="material-symbols-rounded">speed</span>
                        Визуальная шкала
                    </div>
                    <div class="algover-scale">
                        <div class="algover-scale-segment seg-normal">
                            <div class="seg-label">0.5–0.7</div>
                            <div class="seg-title">Норма</div>
                        </div>
                        <div class="algover-scale-segment seg-sub">
                            <div class="seg-label">0.7–1.0</div>
                            <div class="seg-title">Субкомп.</div>
                        </div>
                        <div class="algover-scale-segment seg-mod">
                            <div class="seg-label">1.0–1.5</div>
                            <div class="seg-title">Средний</div>
                        </div>
                        <div class="algover-scale-segment seg-sev">
                            <div class="seg-label">1.5–2.0</div>
                            <div class="seg-title">Тяжёлый</div>
                        </div>
                        <div class="algover-scale-segment seg-crit">
                            <div class="seg-label">&gt;2.0</div>
                            <div class="seg-title">Крит.</div>
                        </div>
                        <div class="algover-scale-marker" id="algover-marker" style="left: 0%;"></div>
                    </div>
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
        if (this.hrValue === null || this.sbpValue === null || this.sbpValue <= 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">введите данные</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните оба поля</div>
                        <div class="result-description">ЧСС (уд/мин) и систолическое АД (мм рт. ст.)</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const hr = this.hrValue;
        const sbp = this.sbpValue;
        const si = hr / sbp;
        const siRounded = Math.round(si * 100) / 100;
        
        const range = this.getRange(si);
        const inlineStyle = getResultInlineStyle(range.color);
        
        const warning = si >= 1.0 
            ? `<div class="algover-warning">
                   <span class="material-symbols-rounded">warning</span>
                   <span>ИА ≥ 1.0 — показана экстренная инфузионная терапия!</span>
               </div>`
            : '';

        return `
            <div class="result-content result-${range.color} algover-result" style="${inlineStyle}">
                <div class="algover-main-value">
                    <div class="algover-big-number">${siRounded}</div>
                    <div class="algover-big-label">индекс</div>
                </div>
                <div class="result-divider"></div>
                <div class="algover-details">
                    <div class="algover-detail-row">
                        <span class="algover-detail-label">Кровопотеря:</span>
                        <span class="algover-detail-value">${range.bloodLoss} (${range.bloodLossMl})</span>
                    </div>
                    <div class="algover-detail-row">
                        <span class="algover-detail-label">Класс:</span>
                        <span class="algover-detail-value">${range.class}</span>
                    </div>
                    <div class="algover-detail-row">
                        <span class="algover-detail-label">Состояние:</span>
                        <span class="algover-detail-value">${range.label}</span>
                    </div>
                    ${warning}
                    ${range.therapy ? `
                        <div class="result-action">
                            <span class="material-symbols-rounded">medical_services</span>
                            ${range.therapy}
                        </div>
                    ` : ''}
                </div>
                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    getRange(si) {
        return this.data.ranges.find(r => si >= r.min && si <= r.max)
            || this.data.ranges[this.data.ranges.length - 1];
    }

    setupEventListeners() {
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        this._inputHandler = (e) => {
            if (!e.target.matches('#hr-input, #sbp-input')) return;
            
            const hrInput = this.container.querySelector('#hr-input');
            const sbpInput = this.container.querySelector('#sbp-input');
            
            const hr = parseFloat(hrInput.value);
            const sbp = parseFloat(sbpInput.value);
            
            this.hrValue = (!isNaN(hr) && hrInput.value.trim() !== '') ? Math.max(20, Math.min(250, hr)) : null;
            this.sbpValue = (!isNaN(sbp) && sbpInput.value.trim() !== '') ? Math.max(20, Math.min(300, sbp)) : null;
            
            this.updateUI();
        };
        this.container.addEventListener('input', this._inputHandler, true);

        this._clickHandler = (e) => {
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
    }

    updateUI() {
        this.updateResult();
        this.updateMarker();
    }

    updateMarker() {
        const marker = this.container.querySelector('#algover-marker');
        if (!marker) return;
        
        if (this.hrValue === null || this.sbpValue === null || this.sbpValue <= 0) {
            marker.style.display = 'none';
            return;
        }

        marker.style.display = 'block';
        const si = this.hrValue / this.sbpValue;
        
        const minSI = 0.3;
        const maxSI = 2.5;
        const percent = Math.max(0, Math.min(100, ((si - minSI) / (maxSI - minSI)) * 100));
        
        marker.style.left = `${percent}%`;
    }

    resetAll() {
        this.hrValue = null;
        this.sbpValue = null;
        const hrInput = this.container.querySelector('#hr-input');
        const sbpInput = this.container.querySelector('#sbp-input');
        if (hrInput) hrInput.value = '';
        if (sbpInput) sbpInput.value = '';
        this.updateUI();
        window.showSnackbar?.('Результат сброшен');
    }

    updateResult() {
        const panel = this.container.querySelector('#result-panel');
        if (panel) {
            panel.innerHTML = this.renderResult();
        }
    }
}