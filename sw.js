// JAN照会アプリ: アプリ本体のみをキャッシュ。商品マスター(IndexedDB)には触れません。
const CACHE = 'nyan-search-shell-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './jan-cat-180.png',
  './jan-cat-192.png',
  './jan-cat-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => (key.startsWith('jan-iphone-shell-') || key.startsWith('nyan-search-shell-')) && key !== CACHE)
            .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML・マニフェストはオンラインなら最新版を優先し、オフラインでは保存版を使用。
  const isAppDocument = request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/manifest.webmanifest');

  if (isAppDocument) {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        return Response.error();
      })
    );
    return;
  }

  // 画像などはキャッシュ優先。未保存ならネットから取得して保存。
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
      }
      return response;
    }))
  );
});
