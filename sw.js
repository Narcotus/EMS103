const CACHE_NAME = 'ems-103-v2';
const ASSETS = [
'/',
'/index.html',
'/manifest.json',
'/css/md3-theme.css',
'/css/components.css',
'/css/main.css',
'/css/calculator.css',
'/js/app.js',
'/js/router.js',
'/js/navigation.js',
'/js/theme.js',
'/js/storage.js',
'/js/search-engine.js',
'/js/calculator-utils.js',
'/js/filter-engine.js',
'/js/components/top-bar.js',
'/js/components/drawer.js',
'/js/components/bottom-nav.js',
'/js/components/search-modal.js',
'/js/pages/home.js',
'/js/pages/orders.js',
'/js/pages/guidelines.js',
'/js/pages/calculators.js',
'/js/pages/reference.js',
'/js/pages/favorites.js',
'/js/pages/recent.js',
'/js/pages/geneva-score.js',
'/js/pages/glasgow-coma.js',
'/js/pages/glasgow-coma-pediatric.js',
'/js/pages/four-score.js',
'/js/pages/sad-persons.js',
'/js/pages/pediatric.js',
'/js/pages/apgar.js',
'/js/pages/ciwa-ar.js',
'/js/pages/nihss.js',
'/js/pages/killip.js',
'/js/pages/vas.js',
'/js/pages/fast-ed.js',
'/js/pages/algover.js',
'/js/pages/drug-converter.js',
'/js/pages/pesi-score.js',
'/js/pages/infusomat.js',
'/js/pages/odn-scale.js',
'/js/pages/shsn-scale.js',
'/js/pages/sgarbossa.js',
'/js/pages/qtc-bazett.js',
'/data/orders.json',
'/data/guidelines.json',
'/data/calculators.json',
'/data/references.json',
'/data/geneva-score.json'
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