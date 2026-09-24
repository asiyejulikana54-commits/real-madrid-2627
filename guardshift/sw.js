const CACHE='guardshift-notify-v1';
self.addEventListener('install',event=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
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
  event.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,
    tag:'guardshift-push',
    renotify:true,
    data:{url:data.url||'./'}
  }));
});
