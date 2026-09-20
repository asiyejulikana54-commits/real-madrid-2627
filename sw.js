const CACHE_VERSION='rm2627-static-v75';
const CORE_PATHS=['','index.html','style.css','community.css','formation.css','mi-liga.css','community-pro.css','community-league.css','ux-cleanup.css','ux-refine.css','public-polish.css','personal-hub.css','personal-season-pro.css','decision-profile.css','decision-coach.css','review-archive.css','season-learning.css','playerhub.css','player-experience.css','squad-pro.css','site-guide.css','personal-home.css','match-story.css','home-pro.css','matchday.css','matchday-performance.css','mvp.css','efficiency-pro.css','compare-pro.css','compare-lifecycle.css','stats-pro.css','momentum-pro.css','match-history-pro.css','evolution-pro.css','analytics.css','hierarchy.css','power-pro.css','mobile-ux.css','simple-mode.css','round-impact.css','xi-stability.css','prediction-readiness.css','decision-center.css','pwa.css','app.js','season-data.js','season-input.js','season-extension.js','minute-sync.js','community.js','community-supabase.js','formation.js','mi-liga.js','community-pro.js','community-league.js','league-scoring-ui.js','personal-hub.js','personal-nav.js','personal-season-pro.js','decision-profile.js','decision-coach.js','review-archive.js','season-learning.js','playerhub.js','player-experience.js','squad-pro.js','site-guide.js','personal-home.js','deep-links.js','navigation-history.js','match-story.js','home-pro.js','analysis-context.js','lineup-semantics.js','matchday.js','mvp.js','efficiency-pro.js','compare-pro.js','compare-lifecycle.js','stats-pro.js','momentum-pro.js','match-history-pro.js','evolution-pro.js','analytics.js','accessibility.js','command-palette.js','decisionradar.js','round-impact.js','xi-stability.js','prediction-readiness.js','decision-center.js','hierarchy.js','power-pro.js','visual-system.js','ux-refine.js','ux-dedupe.js','public-polish.js','mobile-ux.js','simple-mode.js','pwa.js','backup-pro.js','manifest.webmanifest','app-icon.svg'];
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

function isBackend(url){return url.pathname.includes('/.netlify/functions/')||url.hostname.endsWith('.supabase.co');}
function isSameOrigin(url){return url.origin===self.location.origin;}

async function cachedFallback(cache,request){
  return (await cache.match(request))||(await cache.match(request,{ignoreSearch:true}))||null;
}
async function networkFirst(request){
  const cache=await caches.open(CACHE_VERSION);
  try{
    const response=await fetch(request,{cache:'reload'});
    if(response&&response.ok&&request.method==='GET')cache.put(request,response.clone());
    return response;
  }catch{
    return (await cachedFallback(cache,request))||(request.mode==='navigate'?(await cache.match(new URL('index.html',scopeUrl).href)):null)||Response.error();
  }
}
async function staleWhileRevalidate(request){
  const cache=await caches.open(CACHE_VERSION),cached=await cachedFallback(cache,request);
  const network=fetch(request,{cache:'no-cache'}).then(response=>{if(response&&response.ok)cache.put(request,response.clone());return response}).catch(()=>null);
  return cached||(await network)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);if(isBackend(url)||!isSameOrigin(url))return;
  if(request.mode==='navigate'||['script','style','manifest'].includes(request.destination)){event.respondWith(networkFirst(request));return}
  if(['image','font'].includes(request.destination))event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const section=event.notification?.data?.section||'prediccion';
  const target=new URL(`?section=${encodeURIComponent(section)}`,self.registration.scope).href;
  event.waitUntil((async()=>{
    const all=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of all){
      if('focus' in client){await client.focus();if('navigate' in client)await client.navigate(target);return}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target);
  })());
});