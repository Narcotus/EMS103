import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class ApgarPage {
    constructor(container) {
        this.container = container;
        // Оценки на 1-й и 5-й минуте
        this.scores = {
            '1min': { A: null, P: null, G: null, A2: null, R: null },
            '5min': { A: null, P: null, G: null, A2: null, R: null }
        };
        this.currentTime = '1min';
        
        this.data = {
            title: "Шкала Апгар",
            subtitle: "Оценка состояния новорождённого",
            icon: "child_care",
            description: "Быстрая оценка состояния новорождённого на 1-й и 5-й минуте жизни по 5 параметрам: цвет кожи, ЧСС, рефлексы, мышечный тонус, дыхание.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала Апгар предложена американским анестезиологом Вирджинией Апгар в 1952 году. Это стандартизированный метод быстрой оценки состояния новорождённого, применяемый во всём мире в первые минуты жизни.",
                    "Оценка проводится на 1-й и 5-й минуте после рождения. При низких показателях на 5-й минуте (≤7 баллов) дополнительно оценивают на 10, 15 и 20-й минутах. Каждый из 5 параметров оценивается от 0 до 2 баллов, максимум — 10 баллов.",
                    "Аббревиатура APGAR является мнемоникой: Appearance (цвет кожи), Pulse (ЧСС), Grimace (рефлекторная возбудимость), Activity (мышечный тонус), Respiration (дыхание). Это совпадает с фамилией автора, но было предложено позже как удобный способ запоминания."
                ],
                importantNote: "Шкала Апгар не предназначена для прогнозирования долгосрочного неврологического исхода. Низкий балл на 1-й минуте часто нормализуется к 5-й минуте при адекватной реанимации. Важна именно динамика показателей.",
                legalReference: null
            },
            timePoints: [
                { id: '1min', label: '1 минута', icon: 'filter_1' },
                { id: '5min', label: '5 минут', icon: 'filter_5' }
            ],
            groups: [
                {
                    id: 'A',
                    title: 'Appearance — Цвет кожи',
                    shortTitle: 'A',
                    fullName: 'Цвет кожи',
                    icon: 'palette',
                    items: [
                        { value: 0, title: 'Генерализованный цианоз или бледность (всё тело синюшное/бледное)' },
                        { value: 1, title: 'Акроцианоз (туловище розовое, конечности синюшные)' },
                        { value: 2, title: 'Полностью розовая окраска кожи' }
                    ]
                },
                {
                    id: 'P',
                    title: 'Pulse — Частота сердечных сокращений',
                    shortTitle: 'P',
                    fullName: 'ЧСС',
                    icon: 'monitor_heart',
                    items: [
                        { value: 0, title: 'Отсутствует (пульс не определяется)' },
                        { value: 1, title: 'Менее 100 уд/мин (брадикардия)' },
                        { value: 2, title: '100 уд/мин и более' }
                    ]
                },
                {
                    id: 'G',
                    title: 'Grimace — Рефлекторная возбудимость',
                    shortTitle: 'G',
                    fullName: 'Рефлексы',
                    icon: 'sentiment_dissatisfied',
                    items: [
                        { value: 0, title: 'Нет реакции на раздражение (катетер в носу)' },
                        { value: 1, title: 'Гримаса (слабая реакция)' },
                        { value: 2, title: 'Кашель, чихание, громкий крик, активное отталкивание' }
                    ]
                },
                {
                    id: 'A2',
                    title: 'Activity — Мышечный тонус',
                    shortTitle: 'A',
                    fullName: 'Тонус',
                    icon: 'accessibility_new',
                    items: [
                        { value: 0, title: 'Атония (конечности вялые, не двигаются)' },
                        { value: 1, title: 'Сгибание конечностей (сниженный тонус)' },
                        { value: 2, title: 'Активные движения, хорошее сгибание' }
                    ]
                },
                {
                    id: 'R',
                    title: 'Respiration — Дыхание',
                    shortTitle: 'R',
                    fullName: 'Дыхание',
                    icon: 'air',
                    items: [
                        { value: 0, title: 'Отсутствует (апноэ)' },
                        { value: 1, title: 'Нерегулярное, поверхностное, слабый крик' },
                        { value: 2, title: 'Нормальное, громкий крик' }
                    ]
                }
            ],
            resultRanges: [
                { min: 8, max: 10, label: 'Нормальное состояние', description: 'Ребёнок в удовлетворительном состоянии. Наблюдение.', color: 'gcs-15' },
                { min: 4, max: 7, label: 'Асфиксия средней степени', description: 'Требуется стимуляция, оксигенотерапия, возможно — респираторная поддержка.', color: 'gcs-11-12' },
                { min: 1, max: 3, label: 'Тяжёлая асфиксия', description: 'Необходима интенсивная реанимация: ИВЛ, медикаментозная поддержка.', color: 'gcs-4-5' },
                { min: 0, max: 0, label: 'Крайне тяжёлое состояние', description: 'Клиническая смерть. Экстренные реанимационные мероприятия.', color: 'gcs-3' }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-apgar',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'apgar'
        });

        this.renderFullPage();
        this.setupEventListeners();
        bindInfoButton(this.data);
    }

    renderFullPage() {
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

                <!-- Переключатель времени -->
                <div class="apgar-time-switcher">
                    ${this.data.timePoints.map(tp => {
                        const score = this.calculateScore(tp.id);
                        const count = this.countFilled(tp.id);
                        return `
                            <button class="apgar-time-btn ${this.currentTime === tp.id ? 'active' : ''}" data-time="${tp.id}">
                                <span class="material-symbols-rounded">${tp.icon}</span>
                                <div class="apgar-time-content">
                                    <div class="apgar-time-label">${tp.label}</div>
                                    <div class="apgar-time-score">${score !== null ? score + '/10' : count + '/5'}</div>
                                </div>
                            </button>
                        `;
                    }).join('')}
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
                                    <label class="gcs-radio-item ripple" 
                                           data-group="${group.id}" 
                                           data-value="${item.value}">
                                        <div class="gcs-radio-circle"><div class="gcs-radio-dot"></div></div>
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

                <div id="result-panel" class="result-panel">
                    ${this.renderResult()}
                </div>
            </div>
        `;

        this.updateSelections();
    }

    renderResult() {
        const score1 = this.calculateScore('1min');
        const score5 = this.calculateScore('5min');
        const count1 = this.countFilled('1min');
        const count5 = this.countFilled('5min');

        // Если ничего не заполнено
        if (count1 === 0 && count5 === 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Оцените новорождённого</div>
                        <div class="result-description">Заполните параметры на 1-й и 5-й минутах жизни</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить">
                        <span class="material-symbols-rounded">refresh</span>
                    </button>
                </div>
            `;
        }

        const range1 = score1 !== null ? this.getRange(score1) : null;
        const range5 = score5 !== null ? this.getRange(score5) : null;

        // Определяем тренд между 1 и 5 минутами
        let trendHtml = '';
        if (score1 !== null && score5 !== null) {
            const diff = score5 - score1;
            if (diff > 0) {
                trendHtml = `<div class="apgar-trend trend-up">
                    <span class="material-symbols-rounded">trending_up</span>
                    Улучшение на ${diff} ${this.pluralizePoints(diff)}
                </div>`;
            } else if (diff < 0) {
                trendHtml = `<div class="apgar-trend trend-down">
                    <span class="material-symbols-rounded">trending_down</span>
                    Ухудшение на ${Math.abs(diff)} ${this.pluralizePoints(Math.abs(diff))}
                </div>`;
            } else {
                trendHtml = `<div class="apgar-trend trend-same">
                    <span class="material-symbols-rounded">trending_flat</span>
                    Без динамики
                </div>`;
            }
        }

        // Основной цвет — по последней заполненной оценке
        const lastRange = range5 || range1;
        const colorClass = lastRange ? lastRange.color : 'incomplete';

        return `
            <div class="result-content result-${colorClass} apgar-result">
                <div class="apgar-result-grid">
                    <div class="apgar-result-cell ${count1 === 5 ? 'filled' : 'partial'}">
                        <div class="apgar-cell-label">1 минута</div>
                        <div class="apgar-cell-value">${score1 !== null ? score1 : '—'}</div>
                        <div class="apgar-cell-range">${count1}/5</div>
                    </div>
                    <div class="apgar-result-divider">→</div>
                    <div class="apgar-result-cell ${count5 === 5 ? 'filled' : 'partial'}">
                        <div class="apgar-cell-label">5 минут</div>
                        <div class="apgar-cell-value">${score5 !== null ? score5 : '—'}</div>
                        <div class="apgar-cell-range">${count5}/5</div>
                    </div>
                </div>
                ${trendHtml}
                ${range1 || range5 ? `
                    <div class="apgar-interpretation">
                        <strong>${(range5 || range1).label}:</strong> ${(range5 || range1).description}
                    </div>
                ` : ''}
                <button class="result-reset" aria-label="Сбросить" style="position:absolute;top:8px;right:8px;width:36px;height:36px;">
                    <span class="material-symbols-rounded" style="font-size:20px;">refresh</span>
                </button>
            </div>
        `;
    }

    calculateScore(time) {
        const s = this.scores[time];
        const values = Object.values(s);
        if (values.some(v => v === null)) return null;
        return values.reduce((sum, v) => sum + v, 0);
    }

    countFilled(time) {
        return Object.values(this.scores[time]).filter(v => v !== null).length;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max);
    }

    pluralizePoints(n) {
        const lastTwo = n % 100;
        const lastOne = n % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'баллов';
        if (lastOne === 1) return 'балл';
        if (lastOne >= 2 && lastOne <= 4) return 'балла';
        return 'баллов';
    }

    updateSelections() {
        const current = this.scores[this.currentTime];
        
        this.data.groups.forEach(group => {
            const selectedValue = current[group.id];
            
            document.querySelectorAll(`.gcs-radio-item[data-group="${group.id}"]`).forEach(item => {
                const value = parseInt(item.dataset.value);
                item.classList.toggle('selected', value === selectedValue);
            });
            
            const valueEl = document.getElementById(`value-${group.id}`);
            if (valueEl) {
                if (selectedValue !== null) {
                    valueEl.textContent = selectedValue;
                    valueEl.classList.add('has-value');
                } else {
                    valueEl.textContent = '—';
                    valueEl.classList.remove('has-value');
                }
            }
        });
    }

    setupEventListeners() {
        // Переключение времени
        document.querySelectorAll('.apgar-time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTime = btn.dataset.time;
                document.querySelectorAll('.apgar-time-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                this.updateSelections();
            });
        });

        // Клики по radio-элементам
        document.querySelectorAll('.gcs-radio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectItem(item);
            });
        });

        // Сброс
        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    selectItem(item) {
        const group = item.dataset.group;
        const value = parseInt(item.dataset.value);
        
        // Снимаем выбор с других в этой группе
        document.querySelectorAll(`.gcs-radio-item[data-group="${group}"]`).forEach(other => {
            other.classList.remove('selected');
        });
        
        item.classList.add('selected');
        this.scores[this.currentTime][group] = value;
        
        // Обновляем бейдж в заголовке группы
        const valueEl = document.getElementById(`value-${group}`);
        if (valueEl) {
            valueEl.textContent = value;
            valueEl.classList.add('has-value');
        }
        
        // Обновляем счётчик в кнопке времени
        this.updateTimeButtonScores();
        this.updateResult();
    }

    updateTimeButtonScores() {
        this.data.timePoints.forEach(tp => {
            const btn = document.querySelector(`.apgar-time-btn[data-time="${tp.id}"]`);
            if (btn) {
                const score = this.calculateScore(tp.id);
                const count = this.countFilled(tp.id);
                const scoreEl = btn.querySelector('.apgar-time-score');
                if (scoreEl) {
                    scoreEl.textContent = score !== null ? score + '/10' : count + '/5';
                }
            }
        });
    }

    resetAll() {
        this.scores = {
            '1min': { A: null, P: null, G: null, A2: null, R: null },
            '5min': { A: null, P: null, G: null, A2: null, R: null }
        };
        document.querySelectorAll('.gcs-radio-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.gcs-group-value').forEach(el => {
            el.textContent = '—';
            el.classList.remove('has-value');
        });
        this.updateTimeButtonScores();
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