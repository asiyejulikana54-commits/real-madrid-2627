const CACHE_VERSION='rm2627-static-v1';
const CORE_PATHS=['','index.html','style.css','community.css','ux-cleanup.css','app.js','season-data.js','minute-sync.js','community.js','ux-cleanup.js','pwa.css','pwa.js','manifest.webmanifest','app-icon.svg'];
const scopeUrl=new URL(self.registration.scope);
const coreUrls=CORE_PATHS.map(path=>new URL(path,scopeUrl).href);

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_VERSION);
    await Promise.allSettled(coreUrls.map(url=>cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('rm2627-')&&k!==CACHE_VERSION).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function isBackend(url){return url.pathname.includes('/.netlify/functions/');}
function isSameOrigin(url){return url.origin===self.location.origin;}
function isStaticRequest(request){return ['script','style','image','font','manifest'].includes(request.destination);}

async function networkFirst(request){
  const cache=await caches.open(CACHE_VERSION);
  try{
    const response=await fetch(request);
    if(response&&response.ok&&request.method==='GET')cache.put(request,response.clone());
    return response;
  }catch{
    return (await cache.match(request))||(await cache.match(new URL('index.html',scopeUrl).href))||Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_VERSION);
  const cached=await cache.match(request);
  const network=fetch(request).then(response=>{
    if(response&&response.ok)cache.put(request,response.clone());
    return response;
  }).catch(()=>null);
  return cached||(await network)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(isBackend(url))return;
  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request));
    return;
  }
  if(isSameOrigin(url)&&isStaticRequest(request)){
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
