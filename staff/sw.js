'use strict';
const CACHE='nyan-staff-shell-v5-pages-2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./index_v5_test.html','./manifest.webmanifest','../jan-cat-180.png','../jan-cat-192.png','../jan-cat-512.png'])));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname)||u.pathname.endsWith('.json'))return;
 if(e.request.mode==='navigate')e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index_v5_test.html',copy));}return r;}).catch(()=>caches.match('./index_v5_test.html')));
});
