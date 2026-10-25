/**
 * COMED23 Service Worker for PWA (Progressive Web App)
 * Smart Stale-While-Revalidate Engine with Instant Loading, Offline Resilience, and Web Push
 */

// Import OneSignal SDK Service Worker for Background Push
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  console.warn('[SW] OneSignal import deferred:', e);
}

const CACHE_NAME = 'comed23-pwa-v3';

// Core Application Shell & Essential Static Assets
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/Calendar.html',
  '/Plans.html',
  '/payment.html',
  '/storage.html',
  '/upload.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
  '/students_data.js',
  '/assets/js/calendar_sync.js',
  '/assets/js/plans_repo.js',
  '/assets/js/notifications.js',
  '/assets/js/pwa-installer.js',
  '/assets/js/smart_upload_modal.js',
  '/assets/js/pdf_compressor_engine.js'
];

self.addEventListener('install', (event) => {
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
            console.log('[ServiceWorker] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Allow webpage to send SKIP_WAITING when user clicks "Update Now"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
  const notifData = event.notification.data || {};
  const transfer = notifData.transfer;

  if (event.action === 'decline' && transfer) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let client of windowClients) {
          client.postMessage({ type: 'FASTSHARE_DECLINE', transferId: transfer.id });
        }
      })
    );
    return;
  }

  let urlToOpen = notifData.url || '/';
  if (event.action === 'accept' && transfer) {
    urlToOpen = `/fastshare.html?auto_accept=${encodeURIComponent(transfer.id || '')}&file_url=${encodeURIComponent(transfer.file_url || '')}&file_name=${encodeURIComponent(transfer.file_name || '')}`;
  }

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

/**
 * SMART FETCH ENGINE:
 * 1. Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate (Instant load from cache, refresh in background)
 * 2. HTML Navigation: Network-first with cache fallback
 * 3. External APIs / Proxy: Pass-through
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or external endpoints (Supabase, Google APIs)
  if (req.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Skip API or dynamic proxy endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  const isHtml = req.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html');
  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|json|woff2|woff|ttf)$/i);

  // Strategy A: Static Assets -> Stale-While-Revalidate
  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        }).catch(() => null);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Strategy B: HTML Documents -> Network-First with graceful Offline Fallback
  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req, { ignoreSearch: true });
          if (cached) return cached;

          // Page fallback mapping
          if (url.pathname.includes('payment')) {
            const cachedPayment = await caches.match('/payment.html');
            if (cachedPayment) return cachedPayment;
          }
          if (url.pathname.includes('Calendar') || url.pathname.includes('calendar')) {
            const cachedCal = await caches.match('/Calendar.html');
            if (cachedCal) return cachedCal;
          }
          if (url.pathname.includes('Plans') || url.pathname.includes('plans')) {
            const cachedPlans = await caches.match('/Plans.html');
            if (cachedPlans) return cachedPlans;
          }

          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          return new Response('Offline: KKU COMED 23', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }
});
