import { ChecklistCalculator } from '../calculator-base.js';
import { storage } from '../storage.js';
import { loadCalculatorCSS } from '../calculator-utils.js';

export default class SadPersonsPage extends ChecklistCalculator {
    constructor(container) {
        super(container, {
            id: 'sad-persons',
            title: "Шкала оценки риска суицида",
            subtitle: "SAD PERSONS Scale (ШОРС, 1983)",
            icon: "psychology",
            description: "Экспресс-диагностика суицидального риска. 10 факторов оцениваются как 0 (отсутствует) или 1 (присутствует). Применяется для определения тактики наблюдения и госпитализации.",
            reference: {
                title: "О шкале",
                paragraphs: [
                    "Шкала оценки риска суицида (ШОРС, The SAD PERSONS Scale) разработана в 1983 году.",
                    "Аббревиатура SAD PERSONS образована из первых букв: Sex, Age, Depression, Previous attempt, Ethanol abuse, Rational thinking loss, Social support lacking, Organized plan, No spouse, Sickness.",
                    "Результат определяет уровень риска: от амбулаторного наблюдения до обязательной госпитализации."
                ],
                importantNote: "Шкала является скрининговым инструментом. При наличии организованного плана суицида с летальным методом госпитализация показана независимо от общего балла.",
                legalReference: "Приказ МЗ РБ № 480 от 22.04.2020 «О мерах по оптимизации профилактики суицидов в РБ».",
                formulas: [
                    { 
                        name: 'Аббревиатура SAD PERSONS', 
                        formula: 'S-A-D-P-E-R-S-O-N-S (10 факторов)', 
                        example: 'Каждый фактор = 1 балл, макс 10 баллов' 
                    },
                    { 
                        name: 'Интерпретация', 
                        formula: '0-2: низкий, 3-4: средний, 5-6: высокий, 7-10: очень высокий', 
                        example: '5 баллов → рекомендовать госпитализацию' 
                    }
                ],
                quickRules: [
                    { icon: '🚨', rule: 'Есть план суицида → госпитализация независимо от балла' },
                    { icon: '⚠️', rule: '5-6 баллов → рекомендовать госпитализацию' },
                    { icon: '🏥', rule: '7-10 баллов → обязательная госпитализация' },
                    { icon: '📋', rule: 'Скрининговый инструмент — не заменяет клиническую оценку' },
                    { icon: '👨‍⚕️', rule: 'При суицидальных мыслях — консультация психиатра' },
                    { icon: '📞', rule: 'Телефон доверия: 8-801-100-1611 (Беларусь)' }
                ],
                examples: [
                    {
                        scenario: 'Мужчина 52 года, депрессия, злоупотребление алкоголем, разведён, хроническое заболевание',
                        calculation: 'SAD PERSONS = 1+1+1+0+1+0+0+0+1+1 = 6 баллов → высокий риск → госпитализация'
                    },
                    {
                        scenario: 'Женщина 28 лет, парасуицид в анамнезе, есть организованный план',
                        calculation: 'SAD PERSONS = 0+0+0+1+0+0+0+1+0+0 = 2 балла, НО есть план → госпитализация!'
                    },
                    {
                        scenario: 'Мужчина 17 лет, депрессия, недостаток социальной поддержки',
                        calculation: 'SAD PERSONS = 1+1+1+0+0+0+1+0+0+0 = 4 балла → средний риск → дневной стационар'
                    }
                ]
            },
            items: [
                { id: "sex", title: "Пол мужской", points: 1 },
                { id: "age", title: "Возраст < 19 лет или > 45 лет", points: 1 },
                { id: "depression", title: "Депрессия", points: 1 },
                { id: "previous", title: "Парасуициды в анамнезе", points: 1 },
                { id: "ethanol", title: "Злоупотребление алкоголем", points: 1 },
                { id: "rational", title: "Нарушение рационального мышления (бред, галлюцинации, когнитивные нарушения)", points: 1 },
                { id: "social", title: "Недостаток социальной поддержки (одиночество, потеря значимого другого)", points: 1 },
                { id: "plan", title: "Организованный план суицида с потенциально летальным методом", points: 1 },
                { id: "spouse", title: "Отсутствие супруга/супруги (разведён, вдовец, живёт отдельно)", points: 1 },
                { id: "sickness", title: "Тяжёлое хроническое или инвалидизирующее заболевание", points: 1 }
            ],
            resultRanges: [
                { min: 0, max: 2, label: "Низкий риск", description: "Амбулаторное наблюдение.", color: "success" },
                { min: 3, max: 4, label: "Средний риск", description: "Амбулаторное наблюдение с частыми встречами (1–3 р/неделю); дневной стационар; рассмотреть возможность госпитализации.", color: "warning" },
                { min: 5, max: 6, label: "Высокий риск", description: "Рекомендовать госпитализацию, если нет уверенности в качественном амбулаторном наблюдении.", color: "warning-high" },
                { min: 7, max: 10, label: "Очень высокий риск", description: "Госпитализация, в том числе принудительная.", color: "error" }
            ]
        });
    }

    /**
     * ✅ Переопределяем render для добавления динамического CSS и защищённого addRecent
     */
    async render() {
        // Динамическая загрузка CSS калькулятора
        await loadCalculatorCSS('sad-persons');
        
        // Защищённое сохранение в историю
        try {
            storage.addRecent({
                id: `calc-${this.config.id}`,
                title: this.config.title,
                subtitle: 'Калькулятор',
                icon: this.config.icon,
                section: this.config.id,
                source: 'calculators'  // ✅ Для фиолетовой иконки
            });
        } catch (e) {
            console.warn('Не удалось сохранить в историю:', e);
        }
        
        // Вызываем родительский render
        await super.render();
    }

    /**
     * Переопределяем метод для добавления предупреждения о плане суицида
     */
    hasExtraContent(total, range) {
        const hasPlan = this.checkedItems.has('plan');
        return hasPlan 
            ? `<div class="result-warning-text sad-persons-plan-warning">
                   <span class="material-symbols-rounded">warning</span>
                   <span>Есть план суицида — госпитализация показана независимо от балла</span>
               </div>`
            : '';
    }
}