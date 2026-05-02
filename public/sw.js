/* MAS Service Worker */
const CACHE_VERSION = 'mas-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC_ENTRIES = 50;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/mas-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // 必須ファイルのみ: 1つでも失敗したらインストール失敗
      await cache.add('/offline.html');
      // 任意ファイル: 失敗しても続行
      const optional = ['/manifest.json', '/favicon.ico', '/mas-logo.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];
      await Promise.allSettled(optional.map(url => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // ループベース（スタックオーバーフロー防止）
  const deleteCount = Math.max(0, keys.length - maxItems);
  for (let i = 0; i < deleteCount; i++) {
    await cache.delete(keys[i]);
  }
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // API: network-only (skip)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok && networkResponse.type === 'basic') {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
          }
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offline = await caches.match('/offline.html');
          if (offline) return offline;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok && networkResponse.type === 'basic') {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response('', { status: 504, statusText: 'Gateway Timeout' });
        }
      })()
    );
    return;
  }

  // Other GET: network-first → cache fallback
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok && networkResponse.type === 'basic') {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, networkResponse.clone());
          trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('', { status: 504, statusText: 'Gateway Timeout' });
      }
    })()
  );
});

// Push notification support (placeholder)
self.addEventListener('push', (event) => {
  // Intentionally empty - extend as needed
});

self.addEventListener('notificationclick', (event) => {
  // Intentionally empty - extend as needed
});
