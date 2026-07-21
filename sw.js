// Service Worker с фильтрацией неподдерживаемых схем

const CACHE_NAME = 'ems103-cache-v1';
const ALLOWED_SCHEMES = ['http:', 'https:'];

// Установка
self.addEventListener('install', (event) => {
    console.log('Service Worker: установлен');
    self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
    console.log('Service Worker: активирован');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов с фильтрацией
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Игнорируем неподдерживаемые схемы (chrome-extension, data, blob и т.д.)
    if (!ALLOWED_SCHEMES.includes(url.protocol)) {
        return;
    }
    
    // Игнорируем POST, PUT, DELETE запросы
    if (!['GET', 'HEAD'].includes(request.method)) {
        return;
    }
    
    // Игнорируем расширения Chrome
    if (url.hostname.includes('chrome-extension') || 
        url.hostname.includes('extensions')) {
        return;
    }
    
    // Игнорируем сторонние домены (кроме API)
    if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
        return;
    }
    
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) {
                // Обновляем кэш в фоне
                fetch(request).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, response);
                        });
                    }
                }).catch(() => {});
                return cached;
            }
            
            return fetch(request).then(response => {
                // Кэшируем только успешные ответы
                if (!response.ok) {
                    return response;
                }
                
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseClone);
                });
                
                return response;
            });
        }).catch(() => {
            // Fallback для offline
            if (request.mode === 'navigate') {
                return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
        })
    );
});