import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class DrugConverterPage {
    constructor(container) {
        this.container = container;
        this.mode = 'dose'; // 'concentration' | 'dose' | 'weight'
        
        // Значения
        this.concentrationPercent = null;  // %
        this.concentrationMgMl = null;     // мг/мл (автоматически из %)
        this.doseMg = null;                // требуемая доза в мг
        this.dosePerKg = null;             // доза в мг/кг
        this.weightKg = null;              // вес пациента
        
        this.data = {
            title: "Перевод мг ↔ мл ↔ %",
            subtitle: "Конвертер концентраций и расчёт объёмов",
            icon: "medication",
            description: "Перевод между миллиграммами, миллилитрами и процентными растворами. Расчёт объёма препарата для заданной дозы или дозы на килограмм массы тела.",
            reference: {
                title: "О калькуляторе",
                paragraphs: [
                    "Процентный раствор означает количество граммов вещества в 100 мл раствора. Например, 1% раствор содержит 1 г (1000 мг) в 100 мл, то есть 10 мг/мл. Формула: концентрация (мг/мл) = % × 10.",
                    "Для расчёта объёма в мл используется формула: объём = требуемая доза (мг) / концентрация (мг/мл). При дозировании по массе тела: объём = (доза мг/кг × вес кг) / концентрация (мг/мл).",
                    "Важно: расчётный объём является ориентировочным. Перед введением всегда проверяйте концентрацию на ампуле, срок годности, прозрачность раствора и совместимость с другими препаратами."
                ],
                importantNote: "Калькулятор предназначен для взрослых. Для детей используйте педиатрические дозировки и калькулятор Брослоу. Всегда учитывайте максимальные разовые и суточные дозы, скорость введения и противопоказания.",
                legalReference: null
            },
            presets: [
                { name: 'Адреналин 0.1%', percent: 0.1, icon: 'monitor_heart', warning: 'В/в медленно! Критический препарат' },
                { name: 'Атропин 0.1%', percent: 0.1, icon: 'cardiology', warning: null },
                { name: 'Димедрол 1%', percent: 1, icon: 'psychology', warning: null },
                { name: 'Супрастин 2%', percent: 2, icon: 'allergies', warning: null },
                { name: 'Диазепам 0.5%', percent: 0.5, icon: 'psychology_alt', warning: 'Медленно в/в, риск угнетения дыхания' },
                { name: 'Фуросемид 1%', percent: 1, icon: 'water_drop', warning: null },
                { name: 'Дексаметазон 4мг/мл', mgMl: 4, icon: 'medication', warning: null },
                { name: 'Преднизолон 30мг/мл', mgMl: 30, icon: 'medication', warning: null },
                { name: 'Анальгин 50%', percent: 50, icon: 'pill', warning: 'Риск анафилаксии!' },
                { name: 'Глюкоза 40%', percent: 40, icon: 'bloodtype', warning: 'Только в центральную вену!' },
                { name: 'Глюкоза 5%', percent: 5, icon: 'water_drop', warning: null },
                { name: 'NaCl 0.9%', percent: 0.9, icon: 'water_drop', warning: null }
            ],
            modes: [
                { id: 'concentration', label: 'Концентрация', icon: 'science', subtitle: '% ↔ мг/мл' },
                { id: 'dose', label: 'По дозе', icon: 'syringe', subtitle: 'мг → мл' },
                { id: 'weight', label: 'По весу', icon: 'scale', subtitle: 'мг/кг → мл' }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-drug',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'drug-converter'
        });

        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data);
    }

    renderFullPage() {
        this.container.innerHTML = `
            <div class="page-content calc-page drug-converter-page">
            ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Переключатель режимов -->
                <div class="drug-mode-switcher">
                    ${this.data.modes.map(m => `
                        <button class="drug-mode-btn ${this.mode === m.id ? 'active' : ''}" data-mode="${m.id}">
                            <span class="material-symbols-rounded">${m.icon}</span>
                            <div class="drug-mode-content">
                                <div class="drug-mode-label">${m.label}</div>
                                <div class="drug-mode-subtitle">${m.subtitle}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <!-- Быстрые пресеты -->
                <details class="drug-presets card card-outlined" open>
                    <summary class="drug-presets-summary">
                        <span class="material-symbols-rounded">inventory_2</span>
                        <span>Популярные препараты</span>
                        <span class="material-symbols-rounded expand-icon">expand_more</span>
                    </summary>
                    <div class="drug-presets-grid">
                        ${this.data.presets.map((p, idx) => `
                            <button class="drug-preset-btn" data-preset="${idx}">
                                <span class="material-symbols-rounded">${p.icon}</span>
                                <span class="drug-preset-name">${p.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </details>

                <!-- Концентрация препарата -->
                <div class="drug-input-card card card-outlined">
                    <div class="drug-input-title">
                        <span class="material-symbols-rounded">science</span>
                        Концентрация препарата
                    </div>
                    <div class="drug-input-row">
                        <input type="number" id="conc-percent" class="drug-field" 
                               min="0" max="100" step="0.01" placeholder="—" inputmode="decimal"
                               value="${this.concentrationPercent !== null ? this.concentrationPercent : ''}">
                        <span class="drug-unit">%</span>
                        <span class="drug-separator">=</span>
                        <input type="number" id="conc-mgml" class="drug-field" 
                               min="0" max="10000" step="0.01" placeholder="—" inputmode="decimal"
                               value="${this.concentrationMgMl !== null ? this.concentrationMgMl : ''}">
                        <span class="drug-unit">мг/мл</span>
                    </div>
                    <div class="drug-hint">1% = 10 мг/мл</div>
                </div>

                <!-- Доза -->
                ${this.mode === 'dose' ? `
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">syringe</span>
                            Требуемая доза
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="dose-mg" class="drug-field" 
                                   min="0" max="10000" step="0.1" placeholder="—" inputmode="decimal"
                                   value="${this.doseMg !== null ? this.doseMg : ''}">
                            <span class="drug-unit">мг</span>
                        </div>
                    </div>
                ` : ''}

                ${this.mode === 'weight' ? `
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">scale</span>
                            Доза на массу тела
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="dose-perkg" class="drug-field" 
                                   min="0" max="100" step="0.01" placeholder="—" inputmode="decimal"
                                   value="${this.dosePerKg !== null ? this.dosePerKg : ''}">
                            <span class="drug-unit">мг/кг</span>
                        </div>
                    </div>
                    <div class="drug-input-card card card-outlined">
                        <div class="drug-input-title">
                            <span class="material-symbols-rounded">person</span>
                            Масса тела пациента
                        </div>
                        <div class="drug-input-row">
                            <input type="number" id="weight-kg" class="drug-field" 
                                   min="1" max="300" step="0.1" placeholder="—" inputmode="decimal"
                                   value="${this.weightKg !== null ? this.weightKg : ''}">
                            <span class="drug-unit">кг</span>
                        </div>
                    </div>
                ` : ''}

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;
    }

        renderResult() {

            // ── Режим 1: только конвертация концентрации ──
            if (this.mode === 'concentration') {
                if (this.concentrationPercent === null && this.concentrationMgMl === null) {
                    return this.renderEmpty('Введите концентрацию', '% или мг/мл');
                }

                const percent = this.concentrationPercent;
                const mgMl = this.concentrationMgMl;

                return `
                    <div class="result-content result-success">
                        <div class="result-score">
                            <div class="result-score-value">${percent !== null ? percent + '%' : mgMl + ''}</div>
                            <div class="result-score-label">${percent !== null ? 'процент' : 'мг/мл'}</div>
                        </div>
                        <div class="result-divider"></div>
                        <div class="result-info">
                            <div class="result-label">= ${mgMl !== null ? mgMl + ' мг/мл' : percent + '%'}</div>
                            <div class="result-description">
                                Формула: 1% = 10 мг/мл
                            </div>
                        </div>
                        <button class="result-reset" aria-label="Сбросить">
                            <span class="material-symbols-rounded">refresh</span>
                        </button>
                    </div>
                `;
            }

            // ── Режим 2: расчёт по дозе в мг ──
            if (this.mode === 'dose') {
                if (this.concentrationMgMl === null || this.doseMg === null || this.concentrationMgMl === 0) {
                    return this.renderEmpty('Введите концентрацию и дозу', 'для расчёта объёма');
                }
                const volumeMl = this.doseMg / this.concentrationMgMl;
                return this.renderVolumeResult(volumeMl, this.doseMg);
            }

            // ── Режим 3: расчёт по весу ──
            if (this.mode === 'weight') {
                if (this.concentrationMgMl === null || this.dosePerKg === null || this.weightKg === null || this.concentrationMgMl === 0) {
                    return this.renderEmpty('Заполните все поля', 'концентрация, мг/кг, вес');
                }
                const totalDose = this.dosePerKg * this.weightKg;
                const volumeMl = totalDose / this.concentrationMgMl;
                return this.renderVolumeResult(volumeMl, totalDose, true);
            }
        }

        renderEmpty(label, description) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">ожидание</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">${label}</div>
                        <div class="result-description">${description}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        renderVolumeResult(volumeMl, doseMg, fromWeight = false) {
            const volRounded = Math.round(volumeMl * 100) / 100;
            const doseRounded = Math.round(doseMg * 100) / 100;

            // Определяем цвет результата
            let colorClass = 'result-success';
            if (volRounded > 100) colorClass = 'result-error';
            else if (volRounded > 20 || volRounded < 0.1) colorClass = 'result-warning';

            // Предупреждения
            const warnings = [];
            if (volRounded > 20) {
                warnings.push({ icon: 'warning', text: `Большой объём (${volRounded} мл). Проверьте концентрацию!`, type: 'warn' });
            }
            if (volRounded < 0.1) {
                warnings.push({ icon: 'error', text: 'Очень малый объём — сложно точно дозировать. Используйте более разведённый раствор.', type: 'error' });
            }
            if (volRounded > 100) {
                warnings.push({ icon: 'error', text: 'Экстремально большой объём! Проверьте расчёт.', type: 'error' });
            }

            return `
                <div class="result-content ${colorClass}">

                    <div class="result-score">
                        <div class="result-score-value">${volRounded}</div>
                        <div class="result-score-label">мл</div>
                    </div>

                    <div class="result-divider"></div>

                    <div class="result-info">
                        <div class="result-label">Объём для введения</div>
                        <div class="result-description">
                            <div class="drug-detail-row">
                                <span>Суммарная доза:</span>
                                <strong>${doseRounded} мг</strong>
                            </div>
                            ${fromWeight ? `
                            <div class="drug-detail-row">
                                <span>Расчёт:</span>
                                <strong>${this.dosePerKg} мг/кг × ${this.weightKg} кг</strong>
                            </div>
                            ` : ''}
                            <div class="drug-detail-row">
                                <span>Концентрация:</span>
                                <strong>${this.concentrationPercent}% (${this.concentrationMgMl} мг/мл)</strong>
                            </div>
                        </div>
                    </div>

                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>

                <!-- Предупреждения -->
                ${warnings.length > 0 ? `
                <div class="drug-warnings">
                    ${warnings.map(w => `
                        <div class="drug-warning-item drug-warning-${w.type}">
                            <span class="material-symbols-rounded">${w.icon}</span>
                            <span>${w.text}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            `;
        }

    setupEventListeners() {
        // Переключение режимов
        document.querySelectorAll('.drug-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                this.renderFullPage();
                this.setupEventListeners();
                this.updateResult();
            });
        });

        // Пресеты
        document.querySelectorAll('.drug-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = this.data.presets[parseInt(btn.dataset.preset)];
                if (preset.percent !== undefined) {
                    this.concentrationPercent = preset.percent;
                    this.concentrationMgMl = Math.round(preset.percent * 10 * 100) / 100;
                } else if (preset.mgMl !== undefined) {
                    this.concentrationMgMl = preset.mgMl;
                    this.concentrationPercent = Math.round((preset.mgMl / 10) * 100) / 100;
                }
                
                // Переключаемся в режим дозы, если ещё не там
                if (this.mode === 'concentration') {
                    this.mode = 'dose';
                }
                
                this.renderFullPage();
                this.setupEventListeners();
                this.updateResult();
                
                if (preset.warning) {
                    window.showSnackbar?.(`⚠️ ${preset.warning}`);
                }
            });
        });

        // Концентрация %
        const concPercent = document.getElementById('conc-percent');
        concPercent?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val) || e.target.value.trim() === '') {
                this.concentrationPercent = null;
                this.concentrationMgMl = null;
                const mgMlInput = document.getElementById('conc-mgml');
                if (mgMlInput) mgMlInput.value = '';
            } else {
                this.concentrationPercent = val;
                this.concentrationMgMl = Math.round(val * 10 * 100) / 100;
                const mgMlInput = document.getElementById('conc-mgml');
                if (mgMlInput) mgMlInput.value = this.concentrationMgMl;
            }
            this.updateResult();
        });

        // Концентрация мг/мл
        const concMgMl = document.getElementById('conc-mgml');
        concMgMl?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            if (isNaN(val) || e.target.value.trim() === '') {
                this.concentrationMgMl = null;
                this.concentrationPercent = null;
                const percentInput = document.getElementById('conc-percent');
                if (percentInput) percentInput.value = '';
            } else {
                this.concentrationMgMl = val;
                this.concentrationPercent = Math.round((val / 10) * 100) / 100;
                const percentInput = document.getElementById('conc-percent');
                if (percentInput) percentInput.value = this.concentrationPercent;
            }
            this.updateResult();
        });

        // Доза в мг
        const doseMg = document.getElementById('dose-mg');
        doseMg?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.doseMg = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
            this.updateResult();
        });

        // Доза мг/кг
        const dosePerKg = document.getElementById('dose-perkg');
        dosePerKg?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.dosePerKg = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
            this.updateResult();
        });

        // Вес
        const weightKg = document.getElementById('weight-kg');
        weightKg?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.weightKg = (!isNaN(val) && e.target.value.trim() !== '') ? val : null;
            this.updateResult();
        });

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    resetAll() {
        this.concentrationPercent = null;
        this.concentrationMgMl = null;
        this.doseMg = null;
        this.dosePerKg = null;
        this.weightKg = null;
        this.renderFullPage();
        this.setupEventListeners();
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