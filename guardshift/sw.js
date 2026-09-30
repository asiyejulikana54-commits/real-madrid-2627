const CACHE='guardshift-shell-v5';
const SHELL=['./','./index.html'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    try{
      const cache=await caches.open(CACHE);
      await cache.addAll(SHELL);
    }catch(e){}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('guardshift-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
        let response;
        try{response=await fetch(request,{signal:controller.signal})}finally{clearTimeout(timer)}
        if(response&&response.ok){await cache.put('./index.html',response.clone());await cache.put('./',response.clone());}
        return response;
      }catch(e){
        return (await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
      }
    })());
    return;
  }

  if(url.hostname==='cdn.jsdelivr.net'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(request);
      const network=fetch(request).then(async response=>{if(response&&response.ok)await cache.put(request,response.clone());return response}).catch(()=>null);
      if(cached){event.waitUntil(network);return cached}
      return (await network)||Response.error();
    })());
  }
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url)||'./';
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clientsList){
      if('focus' in client){
        try{await client.navigate(target)}catch(e){}
        return client.focus();
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});

self.addEventListener('push',event=>{
  let data={title:'GuardShift',body:'Tienes una nueva notificación.',url:'./'};
  try{if(event.data)data=Object.assign(data,event.data.json())}catch(e){}
  const tag=data.tag||('guardshift-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,
    tag,
    renotify:false,
    data:{url:data.url||'./',notificationId:data.notification_id||null}
  }));
});
