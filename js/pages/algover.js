import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class AlgoverPage {
    constructor(container) {
        this.container = container;
        this.hrValue = null;
        this.sbpValue = null;
        
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
                    "Индекс особенно полезен для выявления компенсированного шока, когда АД ещё сохраняется за счёт компенсаторных механизмов, но тахикардия уже указывает на гиповолемию. Широко используется в травматологии, акушерстве (для оценки послеродовых кровотечений) и экстренной медицине."
                ],
                importantNote: "Индекс Альговера > 1.0 указывает на потерю ≥ 20% ОЦК и требует немедленного начала инфузионной терапии. Индекс > 1.5 — показание к экстренной трансфузии и хирургическому вмешательству.",
                legalReference: null
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
                    therapy: 'Вен доступ. Кристаллоиды до 1000 мл. Мониторинг диуреза.'
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

    async render() {
        storage.addRecent({
            id: 'calc-algover',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'algover'
        });

        this.container.innerHTML = `
        
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
                        ИА = ЧСС / САД · Норма: 0.5–0.7
                    </div>
                </div>

                <!-- Шкала с визуализацией -->
                <div class="algover-scale-card card card-outlined">
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
                            <div class="seg-label">>2.0</div>
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
        bindInfoButton(this.data);
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
        
        const warning = si >= 1.0 
            ? `<div class="result-warning">⚠️ ИА ≥ 1.0 — показана экстренная инфузионная терапия!</div>`
            : '';

        return `
            <div class="result-content result-${range.color} algover-result">
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
                    <div class="algover-therapy">${range.therapy}</div>
                    ${warning}
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
        const hrInput = document.getElementById('hr-input');
        const sbpInput = document.getElementById('sbp-input');

        const onInput = () => {
            const hr = parseFloat(hrInput.value);
            const sbp = parseFloat(sbpInput.value);
            this.hrValue = (!isNaN(hr) && hrInput.value.trim() !== '') ? Math.max(20, Math.min(250, hr)) : null;
            this.sbpValue = (!isNaN(sbp) && sbpInput.value.trim() !== '') ? Math.max(20, Math.min(300, sbp)) : null;
            this.updateUI();
        };

        hrInput?.addEventListener('input', onInput);
        sbpInput?.addEventListener('input', onInput);

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    updateUI() {
        this.updateResult();
        this.updateMarker();
    }

    updateMarker() {
        const marker = document.getElementById('algover-marker');
        if (!marker) return;
        
        if (this.hrValue === null || this.sbpValue === null || this.sbpValue <= 0) {
            marker.style.display = 'none';
            return;
        }

        marker.style.display = 'block';
        const si = this.hrValue / this.sbpValue;
        
        // Преобразуем SI в проценты шкалы (0.3 → 0%, 2.5 → 100%)
        const minSI = 0.3;
        const maxSI = 2.5;
        const percent = Math.max(0, Math.min(100, ((si - minSI) / (maxSI - minSI)) * 100));
        
        marker.style.left = `${percent}%`;
    }

    resetAll() {
        this.hrValue = null;
        this.sbpValue = null;
        const hrInput = document.getElementById('hr-input');
        const sbpInput = document.getElementById('sbp-input');
        if (hrInput) hrInput.value = '';
        if (sbpInput) sbpInput.value = '';
        this.updateUI();
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