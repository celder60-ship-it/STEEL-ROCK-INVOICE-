const CACHE='steel-rock-apk-layout-2026-11-16-v3';
const APP=['./','./index.html','./manifest.webmanifest','./pumpjack.svg','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});