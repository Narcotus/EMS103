const CACHE_NAME = 'ems-103-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/md3-theme.css',
    '/css/components.css',
    '/css/main.css',
    '/js/app.js',
    '/js/router.js',
    '/js/navigation.js',
    '/js/components/top-bar.js',
    '/js/components/drawer.js',
    '/js/components/bottom-nav.js',
    '/js/pages/home.js',
    '/js/pages/orders.js',
    '/js/pages/guidelines.js',
    '/js/pages/calculators.js',
    '/js/pages/reference.js',
    '/data/orders.json',
    '/data/guidelines.json',
    '/data/calculators.json',
    '/data/reference.json'
];

// Установка - кэшируем все ресурсы
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация - удаляем старые кэши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => 
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request).then(response => {
                // Кэшируем только успешные ответы
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});