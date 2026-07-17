// ============================================
// Shared navigation data
// ============================================

export const NAV_ITEMS = [
    {
        id: 'home',
        title: 'Главная',
        icon: 'home',
        description: 'Главный экран'
    },
    {
        id: 'orders',
        title: 'Приказы',
        icon: 'gavel',
        description: 'Нормативные документы'
    },
    {
        id: 'guidelines',
        title: 'Клинические рекомендации',
        icon: 'clinical_notes',
        description: 'Протоколы лечения'
    },
    {
        id: 'calculators',
        title: 'Калькуляторы',
        icon: 'calculate',
        description: 'Медицинские расчёты'
    },
    {
        id: 'reference',
        title: 'Шпаргалки и справка',
        icon: 'menu_book',
        description: 'Справочники и шпаргалки'
    }
];

export const getRouteInfo = (route) => {
    return NAV_ITEMS.find(item => item.id === route) || NAV_ITEMS[0];
};