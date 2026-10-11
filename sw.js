/**
 * COMED23 Service Worker for PWA (Progressive Web App)
 * Caches core assets, provides offline resilience and OneSignal Web Push
 */

// Import OneSignal SDK Service Worker for reliable Background Push (RFC 8291)
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  console.warn('[SW] OneSignal import deferred:', e);
}

const CACHE_NAME = 'comed23-pwa-v2';
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
  '/assets/js/plans_repo.js',
  '/assets/js/notifications.js'
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

// Push Event: รับข้อมูล Push จาก Server เมื่อผู้ใช้ปิดแอปหรือล็อกหน้าจอ
self.addEventListener('push', (event) => {
  let data = {
    title: 'ประกาศจากสาขา COMED KKU',
    message: 'มีข้อความและการแจ้งเตือนใหม่',
    link: '/',
    type: 'info'
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.message = event.data.text();
    }
  }

  const title = data.title || 'ประกาศด่วนจาก COMED23';
  const options = {
    body: data.message || '',
    icon: '/logo.png',
    badge: '/favicon.png',
    tag: 'comed-push-' + (data.id || Date.now()),
    data: { url: data.link || '/' },
    // สั่นเตือนบนโทรศัพท์: สั่น 300ms, หยุด 100ms, สั่น 400ms, หยุด 100ms, สั่น 300ms
    vibrate: [300, 100, 400, 100, 300],
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'เปิดดูทันที' },
      { action: 'close', title: 'ปิด' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Push & System Notification Click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          if (urlToOpen && client.navigate) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
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
