import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class GlasgowComaPage {
    constructor(container) {
        this.container = container;
        this.selections = { E: null, V: null, M: null };
        
        this.data = {
            title: "Шкала комы Глазго (ШКГ)",
            subtitle: "Glasgow Coma Scale (GCS)",
            icon: "neurology",
            description: "Оценка уровня сознания по трём параметрам: открывание глаз, речевая реакция и двигательная реакция. Применяется при ЧМТ, инсультах и других нарушениях сознания.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала комы Глазго (Glasgow Coma Scale, GCS) — международный стандартизированный инструмент для оценки уровня сознания пациента. Разработана в 1974 году профессором Грэмом Тиздейлом в Университете Глазго (Шотландия). Шкала оценивает три компонента: открывание глаз (E), речевую реакцию (V) и двигательную реакцию (M).",
                    "Общая сумма баллов варьирует от 3 (глубокая кома, отсутствие всех реакций) до 15 (ясное сознание). Шкала широко используется в экстренной медицине, реанимации и неврологии для динамического наблюдения за состоянием пациента и определения тактики лечения.",
                    "Для корректной оценки необходимо исключить факторы, которые могут исказить результат: интубация (невозможность речевой реакции), отёк лица (невозможность открывания глаз), паралич конечностей, седация, языковой барьер."
                ],
                importantNote: "Если пациент интубирован, речевая реакция не оценивается. В таких случаях используйте шкалу FOUR, которая дополнительно оценивает дыхание и стволовые рефлексы."
            },
            groups: [
                {
                    id: "E",
                    title: "Открывание глаз (E, Eye response)",
                    icon: "visibility",
                    items: [
                        { value: 4, title: "Открывает самопроизвольно, наблюдает" },
                        { value: 3, title: "Реакция на голос" },
                        { value: 2, title: "Реакция на боль" },
                        { value: 1, title: "Не открывает" }
                    ]
                },
                {
                    id: "V",
                    title: "Речевая реакция (V, Verbal response)",
                    icon: "record_voice_over",
                    items: [
                        { value: 5, title: "Ориентирован, быстрый и правильный ответ на заданный вопрос" },
                        { value: 4, title: "Произносит фразы, но речь бессвязная" },
                        { value: 3, title: "Произносит отдельные слова" },
                        { value: 2, title: "Издаёт звуки, но не слова" },
                        { value: 1, title: "Никаких звуков" }
                    ]
                },
                {
                    id: "M",
                    title: "Двигательная реакция (M, Motor response)",
                    icon: "accessibility_new",
                    items: [
                        { value: 6, title: "Выполнение движений по голосовой команде" },
                        { value: 5, title: "Локализует боль, пытается её избежать" },
                        { value: 4, title: "Бессмысленные движения в ответ на боль" },
                        { value: 3, title: "Патологическое сгибание в ответ на боль (декортикационная ригидность)" },
                        { value: 2, title: "Патологическое разгибание в ответ на боль (децеребрационная ригидность)" },
                        { value: 1, title: "Не двигается" }
                    ]
                }
            ],
            resultRanges: [
                {
                    min: 15, max: 15,
                    label: "Ясное сознание",
                    description: "Пациент ориентирован, адекватен, выполняет команды.",
                    color: "gcs-15"
                },
                {
                    min: 14, max: 14,
                    label: "Лёгкое оглушение",
                    description: "Заторможенность, slowed реакции, ориентирован.",
                    color: "gcs-14"
                },
                {
                    min: 13, max: 13,
                    label: "Умеренное оглушение",
                    description: "Заторможенность, ответы замедленные, частичная дезориентация.",
                    color: "gcs-13"
                },
                {
                    min: 11, max: 12,
                    label: "Глубокое оглушение",
                    description: "Выраженная заторможенность, дезориентация, сонливость.",
                    color: "gcs-11-12"
                },
                {
                    min: 8, max: 10,
                    label: "Сопор",
                    description: "Глубокое угнетение сознания, реакция только на сильные стимулы. Показана интубация при GCS ≤ 8.",
                    color: "gcs-8-10"
                },
                {
                    min: 6, max: 7,
                    label: "Умеренная кома",
                    description: "Отсутствие реакции на голос, сохраняется реакция на боль.",
                    color: "gcs-6-7"
                },
                {
                    min: 4, max: 5,
                    label: "Глубокая кома",
                    description: "Реакция только на болевые стимулы, патологические рефлексы.",
                    color: "gcs-4-5"
                },
                {
                    min: 3, max: 3,
                    label: "Запредельная кома",
                    description: "Атония, арефлексия, отсутствие всех реакций. Подозрение на смерть мозга.",
                    color: "gcs-3"
                }
            ],
            practicalTips: [
                "Оцените, присутствуют ли факторы, мешающие коммуникации, возможности реагировать, другие повреждения.",
                "Наблюдайте за открыванием глаз, содержанием речи и движениями правыми и левыми конечностями.",
                "Звуковой стимул: реакция на обычный или громкий голос. Болевой стимул: надавливание на ногтевую пластину, трапециевидную мышцу или надглазничную вырезку.",
                "Оцените в баллах лучшую реакцию.",
                "Если пациент без сознания или интубирован, наиболее важной частью шкалы является двигательная реакция — её следует оценить более тщательно."
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-gcs',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'glasgow-coma'
        });

        this.container.innerHTML = `

                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <!-- Группы radio-кнопок -->
                <div class="gcs-groups">
                    ${this.data.groups.map(group => `
                        <div class="gcs-group">
                            <div class="gcs-group-header">
                                <span class="material-symbols-rounded">${group.icon}</span>
                                <span class="gcs-group-title">${group.title}</span>
                                <span class="gcs-group-value" id="value-${group.id}">—</span>
                            </div>
                            <div class="gcs-group-items">
                                ${group.items.map(item => `
                                    <label class="gcs-radio-item ripple" data-group="${group.id}" data-value="${item.value}">
                                        <div class="gcs-radio-circle">
                                            <div class="gcs-radio-dot"></div>
                                        </div>
                                        <div class="gcs-radio-content">
                                            <div class="gcs-radio-title">${item.title}</div>
                                        </div>
                                        <div class="gcs-radio-points">${item.value}</div>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Практические рекомендации (отдельно, не в модалке) -->
                <details class="calc-reference card card-outlined calc-tips">
                    <summary class="calc-reference-summary">
                        <span class="material-symbols-rounded">tips_and_updates</span>
                        <span>Практические рекомендации</span>
                        <span class="material-symbols-rounded expand-icon">expand_more</span>
                    </summary>
                    <div class="calc-reference-content">
                        <ol class="gcs-tips-list">
                            ${this.data.practicalTips.map(tip => `<li>${tip}</li>`).join('')}
                        </ol>
                    </div>
                </details>

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
        const range = this.getRange(total);
        const breakdown = this.getBreakdown();
        
        if (!range) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">неполная оценка</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Выберите все три параметра</div>
                        <div class="result-description">Заполните ${breakdown.missing.join(', ')}</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">баллов (${breakdown.formula})</div>
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

    calculateTotal() {
        const E = this.selections.E || 0;
        const V = this.selections.V || 0;
        const M = this.selections.M || 0;
        
        // Если все три параметра выбраны — считаем сумму
        if (this.selections.E && this.selections.V && this.selections.M) {
            return E + V + M;
        }
        return 0;
    }

    getBreakdown() {
        const E = this.selections.E;
        const V = this.selections.V;
        const M = this.selections.M;
        
        const parts = [];
        const missing = [];
        
        if (E) parts.push(`E${E}`); else missing.push('глаза (E)');
        if (V) parts.push(`V${V}`); else missing.push('речь (V)');
        if (M) parts.push(`M${M}`); else missing.push('движение (M)');
        
        return {
            formula: parts.join(' + ') || '—',
            missing: missing
        };
    }

    getRange(score) {
        if (!score) return null;
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max);
    }

    setupEventListeners() {
        // Клики по radio-элементам
        document.querySelectorAll('.gcs-radio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectItem(item);
            });
        });

        // Сброс
        document.querySelector('.result-reset')?.addEventListener('click', () => {
            this.resetAll();
        });
    }

    selectItem(item) {
        const group = item.dataset.group;
        const value = parseInt(item.dataset.value);
        
        // Снимаем выбор с других в этой группе
        document.querySelectorAll(`.gcs-radio-item[data-group="${group}"]`).forEach(other => {
            other.classList.remove('selected');
        });
        
        // Выбираем текущий
        item.classList.add('selected');
        this.selections[group] = value;
        
        // Обновляем индикатор в заголовке группы
        const valueEl = document.getElementById(`value-${group}`);
        if (valueEl) {
            valueEl.textContent = value;
            valueEl.classList.add('has-value');
        }
        
        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        this.selections = { E: null, V: null, M: null };
        
        // Сбрасываем индикаторы
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
            panel.querySelector('.result-reset')?.addEventListener('click', () => {
                this.resetAll();
            });
        }
    }
}