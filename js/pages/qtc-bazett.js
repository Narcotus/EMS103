import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class QtcBazettPage {
    constructor(container) {
        this.container = container;
        this.qtValue = null;
        this.hrValue = null;
        
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
                legalReference: null
            },
            thresholds: {
                male: { normal: 440, borderline: 460, prolonged: 500 },
                female: { normal: 460, borderline: 480, prolonged: 500 }
            }
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-qtc',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'qtc-bazett'
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
                        QTc = QT / √(RR), где RR = 60 / ЧСС
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
        if (this.qtValue === null || this.hrValue === null || this.hrValue <= 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">введите данные</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Заполните оба поля</div>
                        <div class="result-description">Интервал QT (мс) и ЧСС (уд/мин)</div>
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

        // Определяем статус для обоих полов
        const maleStatus = this.getStatus(qtc, 'male');
        const femaleStatus = this.getStatus(qtc, 'female');

        // Общий цвет берём по худшему сценарию
        const worstColor = maleStatus.color === 'error' || femaleStatus.color === 'error' ? 'error'
            : maleStatus.color === 'warning' || femaleStatus.color === 'warning' ? 'warning'
            : 'success';

        return `
            <div class="result-content result-${worstColor} qtc-result">
                <div class="qtc-main-value">
                    <div class="qtc-big-number">${qtc}</div>
                    <div class="qtc-big-label">мс (QTc)</div>
                </div>
                <div class="result-divider"></div>
                <div class="qtc-details">
                    <div class="qtc-detail-row">
                        <span class="qtc-detail-label">RR интервал:</span>
                        <span class="qtc-detail-value">${rrMs} мс (${rrSeconds.toFixed(2)} с)</span>
                    </div>
                    <div class="qtc-gender-row">
                        <div class="qtc-gender-item qtc-gender-male">
                            <span class="material-symbols-rounded">male</span>
                            <span class="${maleStatus.cssClass}">${maleStatus.label}</span>
                        </div>
                        <div class="qtc-gender-item qtc-gender-female">
                            <span class="material-symbols-rounded">female</span>
                            <span class="${femaleStatus.cssClass}">${femaleStatus.label}</span>
                        </div>
                    </div>
                    ${qtc >= 500 ? '<div class="result-warning">⚠️ Высокий риск torsades de pointes!</div>' : ''}
                </div>
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
        const qtInput = document.getElementById('qt-input');
        const hrInput = document.getElementById('hr-input');

        const onInput = () => {
            const qt = parseFloat(qtInput.value);
            const hr = parseFloat(hrInput.value);
            this.qtValue = (!isNaN(qt) && qtInput.value.trim() !== '') ? Math.max(100, Math.min(800, qt)) : null;
            this.hrValue = (!isNaN(hr) && hrInput.value.trim() !== '') ? Math.max(20, Math.min(250, hr)) : null;
            this.updateResult();
        };

        qtInput?.addEventListener('input', onInput);
        hrInput?.addEventListener('input', onInput);

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    resetAll() {
        this.qtValue = null;
        this.hrValue = null;
        const qtInput = document.getElementById('qt-input');
        const hrInput = document.getElementById('hr-input');
        if (qtInput) qtInput.value = '';
        if (hrInput) hrInput.value = '';
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