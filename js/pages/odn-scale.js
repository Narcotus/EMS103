import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class OdnScalePage {
    constructor(container) {
        this.container = container;
        // Выбранные значения для каждого параметра: ключ = id параметра, значение = индекс степени (0-4)
        this.selections = {};
        
        this.data = {
            title: "Оценка тяжести острой дыхательной недостаточности",
            subtitle: "Шкала степеней ОДН",
            icon: "pulmonology",
            description: "Диагностика ОДН и её степени на основании совокупности клинических признаков. Степень определяется не по баллам, а по совпадению параметров.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Острая дыхательная недостаточность (ОДН) — синдром, при котором газовый состав крови не поддерживается на нормальном уровне или достигается за счёт чрезмерного напряжения работы системы внешнего дыхания и компенсаторных механизмов.",
                    "Диагностировать ОДН и её степень можно только на основании совокупности признаков: уровня сознания, частоты дыхания, состояния кожных покровов, гемодинамики и сатурации кислорода. Ни один отдельный параметр не является достаточным для определения степени тяжести.",
                    "Классификация выделяет 5 степеней: от нормы (ДН 0) до терминальной ОДН IV степени. Каждая следующая степень характеризуется нарастанием гипоксемии, гиперкапнии и декомпенсации витальных функций."
                ],
                importantNote: "SpO2 оценивается на фоне оксигенотерапии. При отсутствии кислородной поддержки значения SpO2 будут ниже, что может искусственно завысить оценку степени ОДН.",
                legalReference: null
            },
            parameters: [
                {
                    id: 'consciousness',
                    title: 'Уровень сознания',
                    icon: 'psychology',
                    degrees: [
                        { label: 'Ясное', degree: 0 },
                        { label: 'Ясное', degree: 1 },
                        { label: 'Возбуждение, агрессивность', degree: 2 },
                        { label: 'Спутанность, оглушение', degree: 3 },
                        { label: 'Гипоксическая кома, судороги, мидриаз', degree: 4 }
                    ]
                },
                {
                    id: 'rr',
                    title: 'ЧДД (в минуту)',
                    icon: 'air',
                    degrees: [
                        { label: '12–16', degree: 0 },
                        { label: '14–20', degree: 1 },
                        { label: '20–30', degree: 2 },
                        { label: '30–40', degree: 3 },
                        { label: '<8 или >40', degree: 4 }
                    ]
                },
                {
                    id: 'skin',
                    title: 'Кожные покровы',
                    icon: 'dermatology',
                    degrees: [
                        { label: 'Обычной окраски', degree: 0 },
                        { label: 'Бледность, умеренный цианоз', degree: 1 },
                        { label: 'Цианоз', degree: 2 },
                        { label: 'Выраженный цианоз', degree: 3 },
                        { label: '«Мраморный» цианоз', degree: 4 }
                    ]
                },
                {
                    id: 'hr',
                    title: 'ЧСС (уд/мин)',
                    icon: 'monitor_heart',
                    degrees: [
                        { label: '60–90', degree: 0 },
                        { label: '100–110', degree: 1 },
                        { label: '100–120', degree: 2 },
                        { label: '120–140', degree: 3 },
                        { label: '>140 или <60, аритмии', degree: 4 }
                    ]
                },
                {
                    id: 'bp',
                    title: 'АД',
                    icon: 'blood_pressure',
                    degrees: [
                        { label: 'Норма', degree: 0 },
                        { label: 'Норма, умеренная гипертензия', degree: 1 },
                        { label: 'Умеренная гипертензия', degree: 2 },
                        { label: 'Гипертензия', degree: 3 },
                        { label: 'Гипотензия', degree: 4 }
                    ]
                },
                {
                    id: 'spo2',
                    title: 'SpO₂ на фоне оксигенотерапии',
                    icon: 'oxygen_saturation',
                    degrees: [
                        { label: '96–99%', degree: 0 },
                        { label: '92–95%', degree: 1 },
                        { label: '90–92%', degree: 2 },
                        { label: '85–90%', degree: 3 },
                        { label: '<85%', degree: 4 }
                    ]
                }
            ],
            degreeLabels: [
                { name: 'Норма (ДН 0)', color: 'gcs-15' },
                { name: 'ОДН I ст.', color: 'gcs-14' },
                { name: 'ОДН II ст.', color: 'gcs-11-12' },
                { name: 'ОДН III ст.', color: 'gcs-8-10' },
                { name: 'ОДН IV ст.', color: 'gcs-3' }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-odn',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'odn-scale'
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

                <div class="odn-table-wrapper">
                    <table class="odn-table">
                        <thead>
                            <tr>
                                <th class="odn-param-header">Параметр</th>
                                ${this.data.degreeLabels.map((d, i) => `
                                    <th class="odn-degree-header odn-degree-${i}">${d.name}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.parameters.map(param => `
                                <tr class="odn-row" data-param="${param.id}">
                                    <td class="odn-param-cell">
                                        <span class="material-symbols-rounded">${param.icon}</span>
                                        <span>${param.title}</span>
                                    </td>
                                    ${param.degrees.map(deg => `
                                        <td class="odn-cell odn-degree-${deg.degree}" 
                                            data-param="${param.id}" 
                                            data-degree="${deg.degree}">
                                            ${deg.label}
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
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
        const selectedCount = Object.keys(this.selections).length;
        const totalParams = this.data.parameters.length;

        if (selectedCount === 0) {
            return `
                <div class="result-content result-incomplete">
                    <div class="result-score">
                        <div class="result-score-value">—</div>
                        <div class="result-score-label">нет данных</div>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-info">
                        <div class="result-label">Отметьте наблюдаемые признаки</div>
                        <div class="result-description">Нажмите на ячейку в таблице напротив каждого параметра</div>
                    </div>
                    <button class="result-reset" aria-label="Сбросить"><span class="material-symbols-rounded">refresh</span></button>
                </div>
            `;
        }

        // Определяем наиболее частую степень среди выбранных
        const degreeCounts = {};
        Object.values(this.selections).forEach(d => {
            degreeCounts[d] = (degreeCounts[d] || 0) + 1;
        });

        let maxDegree = 0;
        let maxCount = 0;
        for (const [degree, count] of Object.entries(degreeCounts)) {
            if (count > maxCount || (count === maxCount && parseInt(degree) > maxDegree)) {
                maxCount = count;
                maxDegree = parseInt(degree);
            }
        }

        const degreeInfo = this.data.degreeLabels[maxDegree];
        const consistency = Math.round((maxCount / selectedCount) * 100);

        let warningHtml = '';
        if (consistency < 60) {
            warningHtml = `<div class="result-warning">⚠️ Признаки противоречивы (${consistency}% совпадение). Оцените клиническую картину комплексно.</div>`;
        } else if (maxDegree >= 3) {
            warningHtml = `<div class="result-warning">🚨 Требуется неотложная интенсивная терапия!</div>`;
        }

        return `
            <div class="result-content result-${degreeInfo.color}">
                <div class="result-score">
                    <div class="result-score-value" style="font-size: 28px;">${degreeInfo.name}</div>
                    <div class="result-score-label">${selectedCount} из ${totalParams} параметров · ${consistency}% совпадение</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-info">
                    <div class="result-label">${this.getRecommendation(maxDegree)}</div>
                    ${warningHtml}
                </div>
                <button class="result-reset" aria-label="Сбросить"><span class="material-symbols-rounded">refresh</span></button>
            </div>
        `;
    }

    getRecommendation(degree) {
        const recommendations = [
            'Газообмен не нарушен. Наблюдение.',
            'Компенсированная ОДН. Оксигенотерапия, мониторинг.',
            'Субкомпенсированная ОДН. Усиленная оксигенотерапия, подготовка к ИВЛ.',
            'Декомпенсированная ОДН. Показана ИВЛ, интенсивная терапия.',
            'Терминальная ОДН. Экстренная ИВЛ, реанимационные мероприятия.'
        ];
        return recommendations[degree] || '';
    }

    setupEventListeners() {
        document.querySelectorAll('.odn-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const param = cell.dataset.param;
                const degree = parseInt(cell.dataset.degree);
                
                // Снимаем выделение с других ячеек этого параметра
                document.querySelectorAll(`.odn-cell[data-param="${param}"]`).forEach(c => {
                    c.classList.remove('selected');
                });
                
                // Выделяем текущую
                cell.classList.add('selected');
                this.selections[param] = degree;
                
                // Подсвечиваем колонку
                this.highlightColumn();
                this.updateResult();
            });
        });

        document.querySelector('.result-reset')?.addEventListener('click', () => this.resetAll());
    }

    highlightColumn() {
        // Убираем старую подсветку
        document.querySelectorAll('.odn-cell').forEach(c => c.classList.remove('column-highlight'));
        
        // Находим наиболее частую степень и подсвечиваем колонку
        const degreeCounts = {};
        Object.values(this.selections).forEach(d => {
            degreeCounts[d] = (degreeCounts[d] || 0) + 1;
        });
        
        let maxDegree = -1;
        let maxCount = 0;
        for (const [degree, count] of Object.entries(degreeCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxDegree = parseInt(degree);
            }
        }
        
        if (maxDegree >= 0) {
            document.querySelectorAll(`.odn-cell.odn-degree-${maxDegree}`).forEach(c => {
                if (!c.classList.contains('selected')) {
                    c.classList.add('column-highlight');
                }
            });
        }
    }

    resetAll() {
        this.selections = {};
        document.querySelectorAll('.odn-cell.selected, .odn-cell.column-highlight').forEach(c => {
            c.classList.remove('selected', 'column-highlight');
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