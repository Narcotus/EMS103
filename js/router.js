export class Router {
    constructor(containerId, routes) {
        this.container = document.getElementById(containerId);
        this.routes = routes;
        this.currentRoute = null;
        this.currentParams = {};
        this.listeners = [];
        
        window.addEventListener('hashchange', () => this.handleHashChange());
        window.addEventListener('popstate', () => this.handleHashChange());
    }

    onRouteChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Парсит hash с параметрами: #calculator-detail?id=geneva-score
     */
    parseHash() {
        const hash = window.location.hash.replace('#', '');
        const [route, queryString] = hash.split('?');
        const params = {};
        
        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key) params[key] = decodeURIComponent(value || '');
            });
        }
        
        return { route: route || 'home', params };
    }

    async navigate(route, params = {}) {
        // Если маршрут не найден — на главную
        if (!this.routes[route]) {
            console.warn(`Маршрут ${route} не найден`);
            route = 'home';
        }

        // Формируем hash с параметрами
        let hash = route;
        if (Object.keys(params).length > 0) {
            const queryString = Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&');
            hash += `?${queryString}`;
        }

        if (window.location.hash !== `#${hash}`) {
            history.pushState(null, '', `#${hash}`);
        }

        this.currentRoute = route;
        this.currentParams = params;
        
        this.container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        `;

        try {
            const module = await this.routes[route]();
            const Page = module.default;
            
            this.container.innerHTML = '';
            const page = new Page(this.container, params);
            await page.render();
            
            this.container.querySelector('.page-content')?.classList.add('page-enter');
            this.listeners.forEach(cb => cb(route));
            
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error('Ошибка загрузки страницы:', error);
            this.container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded icon">error</span>
                    <div class="title">Ошибка загрузки</div>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    handleHashChange() {
        const { route, params } = this.parseHash();
        if (route !== this.currentRoute || JSON.stringify(params) !== JSON.stringify(this.currentParams)) {
            this.navigate(route, params);
        }
    }
}