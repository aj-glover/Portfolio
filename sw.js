/**
 * Service Worker for Portfolio
 * Caches assets for offline support and faster repeat visits
 * Version 2.0 - Optimized caching strategy
 */

const CACHE_NAME = 'portfolio-cache-v2';
const RUNTIME_CACHE = 'portfolio-runtime-v2';
const IMAGE_CACHE = 'portfolio-images-v2';

// Assets to cache immediately on install
const STATIC_ASSETS = [
    '/Portfolio/',
    '/Portfolio/index.html',
    '/Portfolio/loading.js',
    '/Portfolio/loading.css',
    '/Portfolio/index.css',
    '/Portfolio/robots.txt'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[ServiceWorker] Some assets failed to cache:', err);
                // Don't fail install if some assets fail
                return Promise.resolve();
            });
        })
    );
    // Force activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== RUNTIME_CACHE && 
                        cacheName !== IMAGE_CACHE) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests and non-GET
    if (!url.origin.includes(location.origin) || request.method !== 'GET') {
        return;
    }

    // Strategy for different asset types
    if (request.destination === 'image') {
        return event.respondWith(cacheImage(request));
    }

    if (request.destination === 'script' || request.destination === 'style') {
        return event.respondWith(cacheFirst(request, CACHE_NAME));
    }

    // Default: network first, fallback to cache
    event.respondWith(networkFirst(request));
});

/**
 * Cache First Strategy - Return cached version if available
 * Used for: CSS, JS, fonts
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Fetch failed, returning offline:', request.url);
        // Return a generic offline response
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Network First Strategy - Try network, fallback to cache
 * Used for: HTML, API calls
 */
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Network request failed:', request.url);
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Image Cache Strategy - Cache images for reuse
 * Limit cache size to prevent bloat
 */
async function cacheImage(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(IMAGE_CACHE);
            
            // Limit image cache size
            const cacheKeys = await cache.keys();
            if (cacheKeys.length > 100) {
                cache.delete(cacheKeys[0]);
            }
            
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('[ServiceWorker] Image fetch failed:', request.url);
        // Return placeholder or cached version
        return caches.match(request) || new Response('Image not available', { status: 404 });
    }
}

console.log('[ServiceWorker] Loaded');
