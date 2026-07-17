import { NAV_ITEMS } from '../navigation.js';

export class BottomNav {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.itemCallback = null;
        this.activeRoute = 'home';
        this.render();
    }

    render() {
        this.container.innerHTML = NAV_ITEMS.map(item => `
            <button class="bottom-nav-item ripple ${item.id === this.activeRoute ? 'active' : ''}" data-route="${item.id}">
                <div class="icon-container">
                    <span class="material-symbols-rounded">${item.icon}</span>
                </div>
                <span class="label">${item.title.split(' ')[0]}</span>
            </button>
        `).join('');

        this.container.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (this.itemCallback) this.itemCallback(route);
            });
        });
    }

    setActive(route) {
        this.activeRoute = route;
        this.container.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.route === route);
        });
    }

    onItemClick(callback) {
        this.itemCallback = callback;
    }
}