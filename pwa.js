(()=>{
let deferredInstallPrompt=null;
let installed=false;
const SW_VERSION='78';
const SW_RELOAD_KEY=`rm_sw_reload_v${SW_VERSION}`;
const MATCH_ANNOUNCEMENT=Object.freeze({
  id:'atletico-postmatch-2026-09-21',
  title:'Atlético 2–1 Real Madrid',
  body:'El partido ya está cerrado: XI oficial, notas y análisis están disponibles.',
  action:'Ver análisis',
  section:'partido'
});
const ANNOUNCEMENT_DISMISSED_KEY=`rm_announcement_dismissed_${MATCH_ANNOUNCEMENT.id}`;
const ANNOUNCEMENT_NATIVE_KEY=`rm_announcement_native_${MATCH_ANNOUNCEMENT.id}`;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid=()=>/android/i.test(navigator.userAgent);
const isInApp=()=>/wv|instagram|fban|fbav|line\//i.test(navigator.userAgent)||(!/chrome|crios|safari|firefox|edg/i.test(navigator.userAgent)&&isAndroid());
function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.info(msg)}catch{}}
function announcementDismissed(){try{return localStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY)==='1'}catch{return false}}
function dismissAnnouncement(){
  try{localStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY,'1')}catch{}
  document.getElementById('rmMatchAnnouncement')?.remove();
}
function showMatchAnnouncement(){
  if(announcementDismissed())return;
  const home=document.getElementById('inicio');if(!home)return;
  const existing=document.getElementById('rmMatchAnnouncement');
  if(existing){if(home.firstElementChild!==existing)home.prepend(existing);return;}
  const card=document.createElement('section');card.id='rmMatchAnnouncement';card.className='card';
  card.style.cssText='margin-bottom:16px;border-color:rgba(216,180,74,.42);background:linear-gradient(135deg,rgba(216,180,74,.12),rgba(7,20,33,.96));';
  card.innerHTML=`<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px"><div><div class="eyebrow">NUEVA JORNADA · PREDICCIÓN ABIERTA</div><h2 style="margin:5px 0 6px">${MATCH_ANNOUNCEMENT.title}</h2><p class="muted" style="margin:0">${MATCH_ANNOUNCEMENT.body}</p><div class="actions" style="justify-content:flex-start;margin-top:12px"><button type="button" class="btn primary" data-rm-announcement-open>${MATCH_ANNOUNCEMENT.action}</button></div></div><button type="button" class="btn" data-rm-announcement-close aria-label="Cerrar aviso" style="min-width:auto;padding:7px 10px">×</button></div>`;
  home.prepend(card);
  card.querySelector('[data-rm-announcement-open]')?.addEventListener('click',()=>{dismissAnnouncement();try{showSection(MATCH_ANNOUNCEMENT.section)}catch{}});
  card.querySelector('[data-rm-announcement-close]')?.addEventListener('click',dismissAnnouncement);
}
async function showNativeAnnouncement(){
  if(typeof Notification==='undefined'||Notification.permission!=='granted'||!('serviceWorker' in navigator))return false;
  try{if(localStorage.getItem(ANNOUNCEMENT_NATIVE_KEY)==='1')return false}catch{}
  try{
    const reg=await navigator.serviceWorker.ready;
    await reg.showNotification(MATCH_ANNOUNCEMENT.title,{body:MATCH_ANNOUNCEMENT.body,icon:'app-icon.svg',badge:'app-icon.svg',tag:MATCH_ANNOUNCEMENT.id,renotify:false,data:{section:MATCH_ANNOUNCEMENT.section}});
    try{localStorage.setItem(ANNOUNCEMENT_NATIVE_KEY,'1')}catch{}
    return true;
  }catch{return false}
}
function loadOfficialStateSync(){
  if(window.RMOfficialStateSync||document.querySelector('script[data-official-state-sync]'))return;
  const script=document.createElement('script');script.src='official-state-sync.js?v=2';script.dataset.officialStateSync='1';script.async=false;document.body.appendChild(script)
}
function loadLeagueScoring(){
  if(window.RMLeagueScoring||document.querySelector('script[data-league-scoring]'))return;
  const script=document.createElement('script');script.src='league-scoring-ui.js?v=2';script.dataset.leagueScoring='1';script.async=false;document.body.appendChild(script)
}
function loadBackupModule(){
  if(window.RMBackup||document.querySelector('script[data-backup-pro]'))return;
  const script=document.createElement('script');script.src='backup-pro.js?v=1';script.dataset.backupPro='1';script.async=false;document.body.appendChild(script)
}
function loadDataSections(){
  const ensureStyle=(href,key)=>{if(document.querySelector(`link[href^="${href.split('?')[0]}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset[key]='1';document.head.appendChild(link)};
  const ensureScript=(src,key)=>{if(document.querySelector(`script[src^="${src.split('?')[0]}"]`))return;const script=document.createElement('script');script.src=src;script.dataset[key]='1';script.async=false;document.body.appendChild(script)};
  ensureStyle('analytics.css?v=3','dataEvolutionStyle');
  ensureStyle('hierarchy.css?v=3','dataHierarchyStyle');
  ensureScript('analytics.js?v=3','dataEvolutionScript');
  ensureScript('hierarchy.js?v=3','dataHierarchyScript');
}
function setMode(){
  document.documentElement.classList.toggle('pwa-standalone',isStandalone());
  document.documentElement.classList.toggle('pwa-offline',!navigator.onLine);
}
function guideCopy(){
  if(isIOS())return {title:'Añadir RM 26/27 al inicio',intro:'En iPhone o iPad la instalación se hace desde Safari.',steps:['Abre esta página en Safari.','Toca el botón Compartir.','Elige “Añadir a pantalla de inicio” y confirma.']};
  if(isAndroid())return {title:'Instalar RM 26/27',intro:isInApp()?'Estás en un navegador integrado. Para instalarla, abre primero la página en Chrome.':'Si no aparece el aviso automático, puedes instalarla desde el menú de Chrome.',steps:[isInApp()?'Abre el menú de esta ventana y elige “Abrir en Chrome”.':'Mantén esta página abierta en Chrome.','Toca ⋮ arriba a la derecha.','Pulsa “Instalar aplicación” o “Añadir a pantalla de inicio”.']};
  return {title:'Instalar RM 26/27',intro:'Puedes dejar RM 26/27 como una aplicación independiente.',steps:['Abre la página en Chrome o Edge.','Abre el menú del navegador.','Elige “Instalar RM 26/27” o “Instalar aplicación”.']};
}
function ensureGuide(){
  let guide=document.getElementById('pwaInstallGuide');if(guide)return guide;
  guide=document.createElement('div');guide.id='pwaInstallGuide';guide.className='pwa-install-guide';guide.setAttribute('aria-hidden','true');
  guide.innerHTML='<button class="pwa-guide-backdrop" type="button" aria-label="Cerrar"></button><div class="pwa-guide-panel" role="dialog" aria-modal="true" aria-labelledby="pwaGuideTitle"><button class="pwa-guide-close" type="button" aria-label="Cerrar">×</button><div class="pwa-guide-icon">RM</div><div><span class="pwa-guide-kicker">ACCESO RÁPIDO</span><h2 id="pwaGuideTitle"></h2><p id="pwaGuideIntro"></p><ol id="pwaGuideSteps"></ol><button class="btn primary pwa-guide-ok" type="button">Entendido</button></div></div>';
  document.body.appendChild(guide);
  guide.querySelectorAll('.pwa-guide-backdrop,.pwa-guide-close,.pwa-guide-ok').forEach(el=>el.addEventListener('click',closeInstallGuide));
  return guide;
}
function closeInstallGuide(){const guide=document.getElementById('pwaInstallGuide');if(!guide)return;guide.classList.remove('open');guide.setAttribute('aria-hidden','true');document.body.classList.remove('pwa-guide-open')}
function showInstallGuide(){
  if(isStandalone()){toastSafe('RM 26/27 ya está instalada en este dispositivo');return}
  const cfg=guideCopy(),guide=ensureGuide();
  guide.querySelector('#pwaGuideTitle').textContent=cfg.title;
  guide.querySelector('#pwaGuideIntro').textContent=cfg.intro;
  guide.querySelector('#pwaGuideSteps').innerHTML=cfg.steps.map(step=>`<li>${step}</li>`).join('');
  guide.classList.add('open');guide.setAttribute('aria-hidden','false');document.body.classList.add('pwa-guide-open');
}
function ensureInstallButton(){
  if(isStandalone()){document.getElementById('pwaInstallBtn')?.remove();document.documentElement.classList.remove('pwa-installable');return}
  const actions=document.querySelector('.topbar .actions');if(!actions)return;
  let btn=document.getElementById('pwaInstallBtn');
  if(!btn){btn=document.createElement('button');btn.id='pwaInstallBtn';btn.type='button';btn.className='btn pwa-install-btn';btn.textContent='Instalar app';btn.setAttribute('aria-label','Instalar RM 26/27 como aplicación');btn.addEventListener('click',installApp);actions.appendChild(btn)}
  const more=actions.querySelector('.ux-top-more');
  if(more&&btn.nextElementSibling!==more)actions.insertBefore(btn,more);
  btn.hidden=false;
  document.documentElement.classList.add('pwa-installable');
}
async function installApp(){
  if(isStandalone()){toastSafe('RM 26/27 ya está instalada en este dispositivo');return}
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch{}
    deferredInstallPrompt=null;ensureInstallButton();return;
  }
  showInstallGuide();
}
function reloadOnNewController(){
  if(sessionStorage.getItem(SW_RELOAD_KEY))return;
  sessionStorage.setItem(SW_RELOAD_KEY,'1');
  location.reload();
}
async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  try{
    navigator.serviceWorker.addEventListener('controllerchange',reloadOnNewController,{once:true});
    const reg=await navigator.serviceWorker.register(`./sw.js?v=${SW_VERSION}`,{scope:'./',updateViaCache:'none'});
    if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller){
          toastSafe('Actualizando RM 26/27…');
          worker.postMessage('SKIP_WAITING');
        }
      });
    });
    await reg.update();
  }catch(error){console.warn('PWA service worker:',error)}
}
function openSectionFromUrl(attempt=0){
  const id=new URLSearchParams(location.search).get('section');if(!id)return;
  if(typeof showSection==='function'&&document.getElementById(id)){showSection(id);return}
  if(attempt<40)setTimeout(()=>openSectionFromUrl(attempt+1),150);
}
window.RMPWA=Object.freeze({install:installApp,guide:showInstallGuide,closeGuide:closeInstallGuide,announcement:showMatchAnnouncement,isInstalled:isStandalone,status:()=>({installed:isStandalone(),nativePrompt:Boolean(deferredInstallPrompt),ios:isIOS(),android:isAndroid(),swVersion:SW_VERSION})});
function install(){
  if(installed)return;installed=true;loadOfficialStateSync();loadLeagueScoring();loadBackupModule();loadDataSections();setMode();ensureInstallButton();openSectionFromUrl();
  window.addEventListener('online',setMode);window.addEventListener('offline',setMode);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;ensureInstallButton()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;setMode();document.getElementById('pwaInstallBtn')?.remove();closeInstallGuide();toastSafe('RM 26/27 instalada')});
  document.addEventListener('rm-critical-modules-ready',()=>{ensureInstallButton();showMatchAnnouncement()});
  document.addEventListener('rm-modules-ready',()=>{ensureInstallButton();showMatchAnnouncement()});
  document.addEventListener('rm-home-state-ready',showMatchAnnouncement);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeInstallGuide()});
  setTimeout(()=>{ensureInstallButton();showMatchAnnouncement()},250);
  setTimeout(ensureInstallButton,900);
  window.addEventListener('load',()=>{registerServiceWorker().then(()=>showNativeAnnouncement());showMatchAnnouncement()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();