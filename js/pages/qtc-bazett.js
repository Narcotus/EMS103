import { storage } from '../storage.js';
import { 
    renderCalcHeader, 
    bindInfoButton, 
    getResultInlineStyle,
    loadCalculatorCSS 
} from '../calculator-utils.js';

export default class QtcBazettPage {
    constructor(container) {
        this.container = container;
        this.qtValue = null;
        this.hrValue = null;
        this._inputHandler = null;
        this._clickHandler = null;
        
        this.data = {
            title: "Коррекция интервала QT",
            subtitle: "Формула Базетта (Bazett)",
            icon: "monitor_heart",
            description: "Расчёт скорректированного интервала QT (QTc) по формуле Базетта. Используется для оценки риска жизнеопасных аритмий при удлинённом QT.",
            reference: {
                title: "О формуле",
                paragraphs: [
                    "Формула Базетта (Bazett, 1920) — наиболее широко используемая формула коррекции интервала QT по частоте сердечных сокращений: QTc = QT / √RR. Несмотря на известную неточность при экстремальных значениях ЧСС, остаётся стандартом в клинической практике и автоматических измерениях ЭКГ-аппаратов.",
                    "Нормальные значения QTc различаются у мужчин и женщин. У мужчин нормой считается QTc ≤ 440 мс, у женщин — ≤ 460 мс. Значения > 500 мс ассоциированы с высоким риском полиморфной желудочковой тахикардии типа torsades de pointes.",
                    "При ЧСС < 60 или > 100 уд/мин формула Базетта может давать ложные результаты. В таких случаях рекомендуется использовать альтернативные формулы (Fridericia, Framingham) или ручное измерение."
                ],
                importantNote: "QTc > 500 мс — высокий риск torsades de pointes. Необходима срочная консультация кардиолога, отмена препаратов, удлиняющих QT, коррекция электролитов (K⁺, Mg²⁺, Ca²⁺).",
                legalReference: null,
                formulas: [
                    { 
                        name: 'Формула Базетта (1920)', 
                        formula: 'QTc = QT / √RR', 
                        example: 'QT 400 мс, ЧСС 75 → RR = 0.8 с → QTc = 400/√0.8 = 447 мс' 
                    },
                    { 
                        name: 'Формула Фридеричиа (альтернатива)', 
                        formula: 'QTc = QT / ∛RR', 
                        example: 'Точнее при ЧСС < 60 или > 100 уд/мин' 
                    },
                    { 
                        name: 'Формула Фрамингем', 
                        formula: 'QTc = QT + 0.154 × (1 - RR)', 
                        example: 'Лучше для брадикардии' 
                    },
                    { 
                        name: 'Расчёт RR', 
                        formula: 'RR (с) = 60 / ЧСС', 
                        example: 'ЧСС 75 → RR = 60/75 = 0.8 с' 
                    }
                ],
                quickRules: [
                    { icon: '♂️', rule: 'Мужчины: норма ≤ 440 мс, пограничный 440-460 мс' },
                    { icon: '♀️', rule: 'Женщины: норма ≤ 460 мс, пограничный 460-480 мс' },
                    { icon: '🚨', rule: 'QTc > 500 мс — высокий риск torsades de pointes!' },
                    { icon: '⚠️', rule: 'При ЧСС < 60 или > 100 — формула Базетта неточна' },
                    { icon: '💊', rule: 'Проверьте препараты, удлиняющие QT (антиаритмики, антибиотики)' },
                    { icon: '🧪', rule: 'Коррекция электролитов: K⁺ > 4.0, Mg²⁺ > 2.0, Ca²⁺ норма' }
                ],
                examples: [
                    {
                        scenario: 'Мужчина 55 лет, QT = 420 мс, ЧСС = 70 уд/мин',
                        calculation: 'RR = 60/70 = 0.857 с; QTc = 420/√0.857 = 454 мс → пограничный (мужчины)'
                    },
                    {
                        scenario: 'Женщина 68 лет, QT = 480 мс, ЧСС = 80 уд/мин',
                        calculation: 'RR = 60/80 = 0.75 с; QTc = 480/√0.75 = 554 мс → удлинён! → высокий риск TdP'
                    },
                    {
                        scenario: 'Пациент на амиодароне, QT = 500 мс, ЧСС = 55 уд/мин',
                        calculation: 'RR = 60/55 = 1.09 с; QTc = 500/√1.09 = 479 мс → пограничный (но формула неточна при брадикардии!)'
                    }
                ]
            },
            thresholds: {
                male: { normal: 440, borderline: 460, prolonged: 500 },
                female: { normal: 460, borderline: 480, prolonged: 500 }
            }
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
        this.qtValue = null;
        this.hrValue = null;
    }

    async render() {
        this.cleanup();
        
        // ✅ Динамическая загрузка CSS
        await loadCalculatorCSS('qtc-bazett');
        
        // ✅ Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: 'calc-qtc',
                title: this.data.title,
                subtitle: 'Калькулятор',
                icon: this.data.icon,
                section: 'qtc-bazett',
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }

        this.container.innerHTML = `
            <div class="page-content calc-page qtc-bazett-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Поля ввода -->
                <div class="qtc-inputs card card-outlined">
                    <div class="qtc-input-group">
                        <label class="qtc-input-label">
                            <span class="material-symbols-rounded">timeline</span>
                            Интервал QT
                        </label>
                        <div class="qtc-input-row">
                            <input type="number" id="qt-input" class="qtc-field" 
                                   min="100" max="800" step="1" placeholder="—" inputmode="numeric">
                            <span class="qtc-unit">мс</span>
                        </div>
                    </div>

                    <div class="qtc-input-group">
                        <label class="qtc-input-label">
                            <span class="material-symbols-rounded">monitor_heart</span>
                            Частота сердечных сокращений
                        </label>
                        <div class="qtc-input-row">
                            <input type="number" id="hr-input" class="qtc-field" 
                                   min="20" max="250" step="1" placeholder="—" inputmode="numeric">
                            <span class="qtc-unit">уд/мин</span>
                        </div>
                    </div>

                    <div class="qtc-formula-hint">
                        <span class="material-symbols-rounded">functions</span>
                        QTc = QT / √(RR), где RR = 60 / ЧСС
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
        if (this.qtValue === null || this.hrValue === null || this.hrValue <= 0) {
            return `
                <div class="result-content result-incomplete qtc-result-compact">
                    <div class="qtc-compact-score">
                        <div class="qtc-compact-value">—</div>
                        <div class="qtc-compact-label">мс</div>
                    </div>
                    <div class="qtc-compact-info">
                        <div class="qtc-compact-title">Введите данные</div>
                        <div class="qtc-compact-desc">QT (мс) и ЧСС (уд/мин)</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const qt = this.qtValue;
        const hr = this.hrValue;
        const rrSeconds = 60 / hr;
        const qtc = Math.round(qt / Math.sqrt(rrSeconds));
        const rrMs = Math.round(rrSeconds * 1000);

        const maleStatus = this.getStatus(qtc, 'male');
        const femaleStatus = this.getStatus(qtc, 'female');

        // Определяем цвет по худшему сценарию
        let colorType;
        if (maleStatus.color === 'error' || femaleStatus.color === 'error') {
            colorType = 'error';
        } else if (maleStatus.color === 'warning' || femaleStatus.color === 'warning') {
            colorType = 'warning';
        } else {
            colorType = 'success';
        }

        const inlineStyle = getResultInlineStyle(colorType);

        // Предупреждения
        const warnings = [];
        if (qtc >= 500) {
            warnings.push({ icon: 'warning', text: 'Высокий риск torsades de pointes!', type: 'error' });
        }
        if (hr < 60 || hr > 100) {
            warnings.push({ icon: 'info', text: `ЧСС ${hr} — формула Базетта неточна`, type: 'warn' });
        }

        // Позиция на шкале (0-100%)
        const scaleMin = 300;
        const scaleMax = 600;
        const position = Math.max(0, Math.min(100, ((qtc - scaleMin) / (scaleMax - scaleMin)) * 100));

        return `
            <div class="result-content result-${colorType} qtc-result-compact" style="${inlineStyle}">
                <div class="qtc-compact-main">
                    <div class="qtc-compact-score">
                        <div class="qtc-compact-value">${qtc}</div>
                        <div class="qtc-compact-label">мс</div>
                    </div>
                    <div class="qtc-compact-info">
                        <div class="qtc-compact-title">QTc по Базетту</div>
                        <div class="qtc-compact-meta">
                            <span class="qtc-meta-item">
                                <span class="material-symbols-rounded">timeline</span>
                                RR ${rrMs}мс
                            </span>
                            <span class="qtc-meta-item">
                                <span class="material-symbols-rounded">monitor_heart</span>
                                ${hr} уд/мин
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Визуальная шкала -->
                <div class="qtc-scale">
                    <div class="qtc-scale-track">
                        <div class="qtc-scale-zone qtc-zone-normal" style="left: 0%; width: 46.7%;"></div>
                        <div class="qtc-scale-zone qtc-zone-borderline" style="left: 46.7%; width: 13.3%;"></div>
                        <div class="qtc-scale-zone qtc-zone-prolonged" style="left: 60%; width: 40%;"></div>
                        <div class="qtc-scale-marker" style="left: ${position}%;"></div>
                    </div>
                    <div class="qtc-scale-labels">
                        <span>300</span>
                        <span>440</span>
                        <span>480</span>
                        <span>600</span>
                    </div>
                </div>

                <!-- Гендерные статусы -->
                <div class="qtc-gender-badges">
                    <div class="qtc-gender-badge qtc-badge-male">
                        <span class="material-symbols-rounded">male</span>
                        <span class="${maleStatus.cssClass}">${maleStatus.label}</span>
                    </div>
                    <div class="qtc-gender-badge qtc-badge-female">
                        <span class="material-symbols-rounded">female</span>
                        <span class="${femaleStatus.cssClass}">${femaleStatus.label}</span>
                    </div>
                </div>

                ${warnings.length > 0 ? `
                    <div class="qtc-warnings-inline">
                        ${warnings.map(w => `
                            <div class="qtc-warning-badge qtc-warning-${w.type}">
                                <span class="material-symbols-rounded">${w.icon}</span>
                                <span>${w.text}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <button class="result-reset" aria-label="Сбросить">
                    <span class="material-symbols-rounded">refresh</span>
                </button>
            </div>
        `;
    }

    getStatus(qtc, gender) {
        const t = this.data.thresholds[gender];
        if (qtc >= t.prolonged) return { label: 'Удлинён', color: 'error', cssClass: 'qtc-status-prolonged' };
        if (qtc >= t.borderline) return { label: 'Пограничный', color: 'warning', cssClass: 'qtc-status-borderline' };
        return { label: 'Норма', color: 'success', cssClass: 'qtc-status-normal' };
    }

    setupEventListeners() {
        if (this._inputHandler) {
            this.container.removeEventListener('input', this._inputHandler, true);
        }
        if (this._clickHandler) {
            this.container.removeEventListener('click', this._clickHandler, true);
        }

        // Обработчик input для полей QT и HR
        this._inputHandler = (e) => {
            const target = e.target;
            if (!target.matches('.qtc-field')) return;

            const qtInput = this.container.querySelector('#qt-input');
            const hrInput = this.container.querySelector('#hr-input');

            const qt = parseFloat(qtInput.value);
            const hr = parseFloat(hrInput.value);
            
            this.qtValue = (!isNaN(qt) && qtInput.value.trim() !== '') 
                ? Math.max(100, Math.min(800, qt)) 
                : null;
            this.hrValue = (!isNaN(hr) && hrInput.value.trim() !== '') 
                ? Math.max(20, Math.min(250, hr)) 
                : null;
            
            this.updateResult();
        };
        this.container.addEventListener('input', this._inputHandler, true);

        // Обработчик кликов для сброса
        this._clickHandler = (e) => {
            const resetBtn = e.target.closest('.result-reset');
            if (resetBtn && this.container.contains(resetBtn)) {
                e.preventDefault();
                e.stopPropagation();
                this.resetAll();
                return;
            }
        };
        this.container.addEventListener('click', this._clickHandler, true);
    }

    resetAll() {
        this.qtValue = null;
        this.hrValue = null;
        const qtInput = this.container.querySelector('#qt-input');
        const hrInput = this.container.querySelector('#hr-input');
        if (qtInput) qtInput.value = '';
        if (hrInput) hrInput.value = '';
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