// Service Worker с правильным кэшированием и ограничениями

const CACHE_VERSION = 'v2';
const CACHE_STATIC = `ems103-static-${CACHE_VERSION}`;
const CACHE_FONTS = `ems103-fonts-${CACHE_VERSION}`;

const MAX_STATIC_ITEMS = 50;
const MAX_FONTS_ITEMS = 10;

// Установка
self.addEventListener('install', (event) => {
    console.log('✅ SW: установлен');
    self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', (event) => {
    console.log('✅ SW: активирован');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => !name.startsWith(`ems103-`) || 
                                   (name !== CACHE_STATIC && name !== CACHE_FONTS))
                    .map(name => {
                        console.log('🗑️ Удаляю старый кэш:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Игнорируем неподдерживаемые схемы
    if (!request.url.startsWith('http')) return;
    
    const url = new URL(request.url);
    
    // Игнорируем POST/PUT/DELETE
    if (!['GET', 'HEAD'].includes(request.method)) return;
    
    // Игнорируем chrome-extension
    if (url.protocol === 'chrome-extension:') return;
    
    // ============================================
    // СТРАТЕГИИ КЭШИРОВАНИЯ
    // ============================================
    
    // 1. HTML — Network First (всегда свежая версия)
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // 2. Google Fonts — Network First (браузер сам кэширует)
    if (url.hostname.includes('fonts.googleapis.com') || 
        url.hostname.includes('fonts.gstatic.com')) {
        event.respondWith(networkFirstWithCache(request, CACHE_FONTS, MAX_FONTS_ITEMS));
        return;
    }
    
    // 3. Локальная статика (CSS/JS/images) — Cache First
    if (url.origin === location.origin) {
        const isStatic = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(url.pathname);
        if (isStatic) {
            event.respondWith(cacheFirst(request, CACHE_STATIC, MAX_STATIC_ITEMS));
            return;
        }
        
        // JSON данные — Network First
        if (url.pathname.endsWith('.json')) {
            event.respondWith(networkFirst(request));
            return;
        }
    }
    
    // 4. Всё остальное — Network Only
    event.respondWith(fetch(request).catch(() => {
        return new Response('Offline', { status: 503 });
    }));
});

// ============================================
// СТРАТЕГИИ
// ============================================

/**
 * Network First — сначала сеть, потом кэш (для HTML)
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) return response;
        throw new Error('Not OK');
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Cache First — сначала кэш, потом сеть (для статики)
 */
async function cacheFirst(request, cacheName, maxItems) {
    const cached = await caches.match(request);
    if (cached) {
        // Обновляем в фоне
        fetchAndCache(request, cacheName, maxItems).catch(() => {});
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cacheResponse(request, response.clone(), cacheName, maxItems);
        }
        return response;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network First с кэшированием (для шрифтов)
 */
async function networkFirstWithCache(request, cacheName, maxItems) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cacheResponse(request, response.clone(), cacheName, maxItems);
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503 });
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Обновить кэш в фоне
 */
async function fetchAndCache(request, cacheName, maxItems) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cacheResponse(request, response, cacheName, maxItems);
        }
    } catch (error) {
        // Игнорируем ошибки фонового обновления
    }
}

/**
 * Кэшировать ответ с ограничением размера
 */
async function cacheResponse(request, response, cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        
        // Проверяем размер ответа
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
            console.warn(`⚠️ Пропускаю большой ресурс: ${request.url} (${contentLength} байт)`);
            return;
        }
        
        // Добавляем в кэш
        await cache.put(request, response);
        
        // Ограничиваем количество записей
        await trimCache(cacheName, maxItems);
    } catch (error) {
        console.warn(`⚠️ Не удалось кэшировать ${request.url}:`, error.message);
    }
}

/**
 * Обрезать кэш до maxItems записей (удаляет старые)
 */
async function trimCache(cacheName, maxItems) {
    try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > maxItems) {
            const toDelete = keys.slice(0, keys.length - maxItems);
            await Promise.all(toDelete.map(key => cache.delete(key)));
            console.log(`🗑️ Удалено ${toDelete.length} старых записей из ${cacheName}`);
        }
    } catch (error) {
        console.warn(`⚠️ Не удалось обрезать кэш ${cacheName}:`, error.message);
    }
}