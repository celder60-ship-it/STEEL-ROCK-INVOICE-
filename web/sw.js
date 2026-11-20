const CACHE='steel-rock-pdf-png-export-v8';
const APP=['./','./index.html','./manifest.webmanifest','./pumpjack.svg','./icon.svg','./native-ios.js','./invoice-export.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('steel-rock-')&&!k.startsWith('steel-rock-timesheet-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin||request.url.startsWith(new URL('timesheet/',self.registration.scope).href))return;
 e.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}return response;}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});