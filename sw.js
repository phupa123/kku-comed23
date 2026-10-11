/**
 * COMED23 Service Worker for PWA (Progressive Web App)
 * Caches core assets and provides offline resilience
 */

const CACHE_NAME = 'comed23-pwa-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/Calendar.html',
  '/Plans.html',
  '/payment.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/assets/js/calendar_sync.js',
  '/assets/js/plans_repo.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or external analytics/APIs (Supabase, Google)
  if (req.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Network-First with Cache fallback strategy
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })
  );
});
