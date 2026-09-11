(()=>{
let deferredInstallPrompt=null;
let installed=false;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid=()=>/android/i.test(navigator.userAgent);
const isInApp=()=>/wv|instagram|fban|fbav|line\//i.test(navigator.userAgent)||(!/chrome|crios|safari|firefox|edg/i.test(navigator.userAgent)&&isAndroid());
function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.info(msg)}catch{}}
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
  if(isStandalone()){document.getElementById('pwaInstallBtn')?.remove();return}
  const actions=document.querySelector('.topbar .actions');if(!actions)return;
  let btn=document.getElementById('pwaInstallBtn');
  if(!btn){btn=document.createElement('button');btn.id='pwaInstallBtn';btn.type='button';btn.className='btn pwa-install-btn';btn.textContent='Instalar app';btn.addEventListener('click',installApp);actions.appendChild(btn)}
  const available=Boolean(deferredInstallPrompt)||isIOS();
  btn.hidden=!available;
  document.documentElement.classList.toggle('pwa-installable',available);
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
async function registerServiceWorker(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  try{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    if(reg.waiting)reg.waiting.postMessage('SKIP_WAITING');
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;if(!worker)return;
      worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)toastSafe('Nueva versión preparada para la próxima apertura')});
    });
  }catch(error){console.warn('PWA service worker:',error)}
}
function openSectionFromUrl(attempt=0){
  const id=new URLSearchParams(location.search).get('section');if(!id)return;
  if(typeof showSection==='function'&&document.getElementById(id)){showSection(id);return}
  if(attempt<40)setTimeout(()=>openSectionFromUrl(attempt+1),150);
}
window.RMPWA=Object.freeze({install:installApp,guide:showInstallGuide,closeGuide:closeInstallGuide,isInstalled:isStandalone,status:()=>({installed:isStandalone(),nativePrompt:Boolean(deferredInstallPrompt),ios:isIOS(),android:isAndroid()})});
function install(){
  if(installed)return;installed=true;setMode();ensureInstallButton();openSectionFromUrl();
  window.addEventListener('online',setMode);window.addEventListener('offline',setMode);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;ensureInstallButton()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;setMode();document.getElementById('pwaInstallBtn')?.remove();closeInstallGuide();toastSafe('RM 26/27 instalada')});
  document.addEventListener('rm-critical-modules-ready',ensureInstallButton);
  document.addEventListener('rm-modules-ready',ensureInstallButton);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeInstallGuide()});
  setTimeout(ensureInstallButton,700);
  window.addEventListener('load',registerServiceWorker,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
