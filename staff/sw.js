 'use strict';
const CACHE='nyan-staff-shell-v5-pages-3-bodymail-128k-20261112';
const ASSETS=['./index_v5_test.html','./index_v5_staff.html','./manifest.webmanifest','../jan-cat-180.png','../jan-cat-192.png','../jan-cat-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nyan-staff-shell-v5-pages-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname)||u.pathname.endsWith('.json'))return;
 if(e.request.mode==='navigate')e.respondWith(fetch(e.request).then(async r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return r;}).catch(async()=>{const c=await caches.open(CACHE);return await c.match(e.request)||await c.match('./index_v5_staff.html')||await c.match('./index_v5_test.html')||Response.error();}));
});

// Redirect only after this active worker has the named V5 shell cached.
self.addEventListener('message',event=>{
 if(event.data?.type!=='NYAN_NAMED_READY_V1'||!event.ports?.[0])return;
 const target=new URL('./index_v5_staff.html',self.location.href);
 event.waitUntil((async()=>{let ready=false;try{const cache=await caches.open(CACHE);ready=event.data.target===target.pathname&&!!(await cache.match(target.href));}catch{}event.ports[0].postMessage({type:'NYAN_NAMED_READY_V1',target:target.pathname,ready});})());
});
