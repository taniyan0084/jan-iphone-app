// JAN照会アプリ: アプリ本体のみをキャッシュ。商品マスター(IndexedDB)には触れません。
const CACHE = 'nyan-search-shell-v4-bodymail-128k-20261112';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './index_v5_test.html',
  './index_v5_customer.html',
  './manifest_v5.webmanifest',
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

  // Ver.5は専用の起動先・manifestとして扱い、Ver.4への代替表示を防ぐ。
  const isV5Document = ['./index_v5_test.html','./index_v5_customer.html'].some(path => url.pathname === new URL(path, self.location.href).pathname);
  const isV5Manifest = url.pathname === new URL('./manifest_v5.webmanifest', self.location.href).pathname;

  // HTML・マニフェストはオンラインなら最新版を優先し、オフラインでは保存版を使用。
  const isAppDocument = request.mode === 'navigate' || isV5Document || isV5Manifest ||
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
        const ownCache = await caches.open(CACHE);
        const cached = await ownCache.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = isV5Document ? (await ownCache.match('./index_v5_customer.html') || await ownCache.match('./index_v5_test.html')) : await caches.match('./index.html');
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

// Redirect only after this active worker has the named V5 shell cached.
self.addEventListener('message',event=>{
 if(event.data?.type!=='NYAN_NAMED_READY_V1'||!event.ports?.[0])return;
 const target=new URL('./index_v5_customer.html',self.location.href);
 event.waitUntil((async()=>{let ready=false;try{const cache=await caches.open(CACHE);ready=event.data.target===target.pathname&&!!(await cache.match(target.href));}catch{}event.ports[0].postMessage({type:'NYAN_NAMED_READY_V1',target:target.pathname,ready});})());
});
