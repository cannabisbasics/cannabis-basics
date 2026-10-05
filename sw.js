const CACHE='cb-app-v4-20261004';
const CORE=[
  './','./index.html','./offline.html','./manifest.webmanifest',
  './assets/logo-green.webp','./assets/locator.css','./assets/locator.js',
  './assets/pwa.js','./assets/public-data.js','./assets/site-announcements.js',
  './assets/member-deals.js','./assets/quality-pass.css','./assets/quality-pass.js'
];

async function precache(){
  const cache=await caches.open(CACHE);
  await Promise.allSettled(CORE.map(url=>cache.add(url)));
}
self.addEventListener('install',event=>{
  event.waitUntil(precache());
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
async function networkFirst(req){
  const cache=await caches.open(CACHE);
  try{
    const res=await fetch(req);
    if(res&&res.ok)cache.put(req,res.clone());
    return res;
  }catch(_){
    return await cache.match(req)||await cache.match('./offline.html');
  }
}
async function staleWhileRevalidate(req){
  const cache=await caches.open(CACHE);
  const hit=await cache.match(req);
  const update=fetch(req).then(res=>{
    if(res&&res.ok)cache.put(req,res.clone());
    return res;
  }).catch(()=>null);
  return hit||await update||Response.error();
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  if(req.mode==='navigate'){
    const privatePage=/\/(members|join|admin)\.html$/.test(url.pathname);
    if(privatePage){
      event.respondWith(fetch(req).catch(()=>caches.match('./offline.html')));
    }else{
      event.respondWith(networkFirst(req));
    }
    return;
  }

  if(/\.(?:js|css)$/.test(url.pathname)){
    event.respondWith(networkFirst(req));
    return;
  }

  if(/\.(?:png|jpe?g|webp|gif|svg|ico|mp3|mp4|webm)$/i.test(url.pathname)){
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});
self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});