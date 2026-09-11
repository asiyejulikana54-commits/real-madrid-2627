const CACHE_VERSION='rm2627-static-v24';
const CORE_PATHS=['','index.html','style.css','community.css','ux-cleanup.css','personal-hub.css','personal-season-pro.css','playerhub.css','player-experience.css','squad-pro.css','site-guide.css','personal-home.css','matchday.css','matchday-pro.css','mvp.css','compare-pro.css','stats-pro.css','match-history-pro.css','prediction-pro.css','lineup-pro.css','evolution-pro.css','accessibility.css','command-palette.css','decisionradar.css','hierarchy.css','power-pro.css','intelligence.css','lineuplab.css','mobile-ux.css','app.js','season-data.js','minute-sync.js','community.js','personal-hub.js','personal-nav.js','personal-season-pro.js','playerhub.js','player-experience.js','squad-pro.js','site-guide.js','personal-home.js','matchday.js','matchday-pro.js','mvp.js','compare-pro.js','stats-pro.js','match-history-pro.js','prediction-pro.js','lineup-pro.js','evolution-pro.js','accessibility.js','command-palette.js','decisionradar.js','hierarchy.js','power-pro.js','intelligence.js','lineuplab.js','visual-system.js','ux-dedupe.js','mobile-ux.js','pwa.css','pwa.js','manifest.webmanifest','app-icon.svg'];
const scopeUrl=new URL(self.registration.scope);
const coreUrls=[...new Set(CORE_PATHS)].map(path=>new URL(path,scopeUrl).href);

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

async function cachedFallback(cache,request){
  return (await cache.match(request))||(await cache.match(request,{ignoreSearch:true}))||null;
}
async function networkFirst(request){
  const cache=await caches.open(CACHE_VERSION);
  try{
    const response=await fetch(request);
    if(response&&response.ok&&request.method==='GET')cache.put(request,response.clone());
    return response;
  }catch{
    return (await cachedFallback(cache,request))||(request.mode==='navigate'?(await cache.match(new URL('index.html',scopeUrl).href)):null)||Response.error();
  }
}
async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_VERSION),cached=await cachedFallback(cache,request);
  const network=fetch(request).then(response=>{if(response&&response.ok)cache.put(request,response.clone());return response}).catch(()=>null);
  return cached||(await network)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(isBackend(url)||!isSameOrigin(url))return;
  if(request.mode==='navigate'||['script','style','manifest'].includes(request.destination)){event.respondWith(networkFirst(request));return}
  if(['image','font'].includes(request.destination))event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});