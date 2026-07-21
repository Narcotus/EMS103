import { storage } from '../storage.js';
import { renderCalcHeader, bindInfoButton } from '../calculator-utils.js';

export default class GenevaScorePage {
    constructor(container) {
        this.container = container;
        this.checkedItems = new Set();
        
        this.data = {
            title: "Клиническая оценка вероятности ТЭЛА",
            subtitle: "Обновлённая Женевская шкала",
            icon: "cardiology",
            description: "Используется для оценки доклинической вероятности тромбоэмболии лёгочной артерии перед проведением инструментальных исследований.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Обновлённая Женевская шкала — это клинический инструмент, разработанный для оценки предтестовой вероятности тромбоэмболии лёгочной артерии (ТЭЛА) у пациентов с острым началом одышки, болью в груди или другими симптомами, подозрительными на ТЭЛА. Шкала была создана как объективная альтернатива шкале Уэллса: в ней полностью исключена субъективная оценка врача, что делает её особенно полезной в экстренных отделениях и при многоцентровых протоколах.",
                    "Обновлённая версия Женевской шкалы включает девять клинических параметров, каждый из которых имеет строго заданный вес в баллах. Компоненты шкалы охватывают анамнез (возраст, предшествующий ТЭЛА или хирургическое вмешательство), активные заболевания (онкология), клинические симптомы (боль, отёк, кровохарканье) и объективные данные (частота пульса).",
                    "После подсчёта суммы баллов применяется одна из двух схем интерпретации — трёхуровневая или двухуровневая. Выбор зависит от клинической ситуации и протокола учреждения. При низкой вероятности по шкале и отрицательном результате D-димера, ТЭЛА может быть безопасно исключена без проведения КТ-ангиографии."
                ],
                legalReference: "Постановление Министерства здравоохранения Республики Беларусь 28.04.2026 № 43 «Клинический протокол „Диагностика, лечение и медицинская профилактика тромбоэмболии легочной артерии (взрослое население)“»"
            },
            items: [
                { id: "age", title: "Возраст >65 лет", points: 1 },
                { id: "dvt_history", title: "Подтверждённый тромбоз глубоких вен нижних конечностей или ТЭЛА в анамнезе", points: 3 },
                { id: "surgery", title: "Хирургическое вмешательство или перелом в течение последнего месяца", points: 2 },
                { id: "cancer", title: "Онкологическое заболевание в активной фазе", points: 2 },
                { id: "hemoptysis", title: "Кровохарканье", points: 2 },
                { id: "leg_pain", title: "Боль в одной из ног", points: 3 },
                { id: "hr_75_94", title: "ЧСС 75–94 уд/мин", points: 3, group: "hr" },
                { id: "hr_95_plus", title: "ЧСС ≥95 уд/мин", points: 5, group: "hr" },
                { id: "dvt_signs", title: "Боль при пальпации глубоких вен нижней конечности или отёк одной из ног", points: 4 }
            ],
            resultRanges: [
                {
                    min: 0, max: 3,
                    label: "Низкая вероятность",
                    description: "Рекомендуется определение уровня D-димера. При отрицательном результате — ТЭЛА маловероятна.",
                    color: "success"
                },
                {
                    min: 4, max: 10,
                    label: "Промежуточная вероятность",
                    description: "Определение D-димера. При повышенном уровне — КТ-ангиография лёгочных артерий.",
                    color: "warning"
                },
                {
                    min: 11, max: 999,
                    label: "Высокая вероятность",
                    description: "Рекомендуется немедленное проведение КТ-ангиографии лёгочных артерий без определения D-димера.",
                    color: "error"
                }
            ]
        };
    }

    async render() {
        storage.addRecent({
            id: 'calc-geneva',
            title: this.data.title,
            subtitle: 'Калькулятор',
            icon: this.data.icon,
            section: 'geneva-score'
        });

        this.container.innerHTML = `
            <div class="page-content calc-page geneva-page">
                ${renderCalcHeader(this.data)}

                <div class="calc-description card card-outlined">
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                        <span class="material-symbols-rounded" style="color: var(--md-primary); font-size: 20px; flex-shrink: 0;">info</span>
                        <p style="margin: 0;">${this.data.description}</p>
                    </div>
                </div>

                <div class="geneva-items">
                    ${this.data.items.map(item => `
                        <div class="calc-item ripple ${item.group ? 'calc-item-radio' : ''}" 
                             data-id="${item.id}" 
                             data-points="${item.points}" 
                             ${item.group ? `data-group="${item.group}"` : ''}>
                            <div class="calc-item-checkbox">
                                <span class="material-symbols-rounded">check</span>
                            </div>
                            <div class="calc-item-content">
                                <div class="calc-item-title">${item.title}</div>
                                ${item.group ? `<div class="calc-item-hint">Радио-группа: выберите один вариант</div>` : ''}
                            </div>
                            <div class="calc-item-points">+${item.points}</div>
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
        const range = this.getRange(total);
        
        return `
            <div class="result-content result-${range.color}">
                <div class="result-score">
                    <div class="result-score-value">${total}</div>
                    <div class="result-score-label">${this.pluralize(total)}</div>
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
        let total = 0;
        this.checkedItems.forEach(id => {
            const item = this.data.items.find(i => i.id === id);
            if (item) total += item.points;
        });
        return total;
    }

    getRange(score) {
        return this.data.resultRanges.find(r => score >= r.min && score <= r.max);
    }

    pluralize(n) {
        const lastTwo = n % 100;
        const lastOne = n % 10;
        if (lastTwo >= 11 && lastTwo <= 14) return 'баллов';
        if (lastOne === 1) return 'балл';
        if (lastOne >= 2 && lastOne <= 4) return 'балла';
        return 'баллов';
    }

    setupEventListeners() {
        // Делегирование событий для всех критериев
        document.querySelectorAll('.calc-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleItem(item);
            });
        });
    }

    toggleItem(item) {
        const id = item.dataset.id;
        const group = item.dataset.group;
        const isChecked = item.classList.contains('checked');

        // Логика для радио-групп (ЧСС)
        if (group) {
            if (isChecked) {
                // Снять выбор
                item.classList.remove('checked');
                this.checkedItems.delete(id);
            } else {
                // Снять выбор с других элементов той же группы
                document.querySelectorAll(`.calc-item[data-group="${group}"]`).forEach(other => {
                    other.classList.remove('checked');
                    this.checkedItems.delete(other.dataset.id);
                });
                // Выбрать текущий
                item.classList.add('checked');
                this.checkedItems.add(id);
            }
        } else {
            // Обычный чекбокс
            if (isChecked) {
                item.classList.remove('checked');
                this.checkedItems.delete(id);
            } else {
                item.classList.add('checked');
                this.checkedItems.add(id);
            }
        }

        this.updateResult();
    }

    resetAll() {
        document.querySelectorAll('.calc-item.checked').forEach(item => {
            item.classList.remove('checked');
        });
        this.checkedItems.clear();
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