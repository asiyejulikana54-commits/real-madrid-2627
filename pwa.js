(()=>{
let deferredInstallPrompt=null;
let installed=false;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
function toastSafe(msg){try{if(typeof toast==='function')toast(msg);else console.info(msg)}catch{}}
function setMode(){
  document.documentElement.classList.toggle('pwa-standalone',isStandalone());
  document.documentElement.classList.toggle('pwa-offline',!navigator.onLine);
}
function ensureInstallButton(){
  if(isStandalone())return;
  const actions=document.querySelector('.topbar .actions');if(!actions)return;
  let btn=document.getElementById('pwaInstallBtn');
  if(!btn){
    btn=document.createElement('button');btn.id='pwaInstallBtn';btn.type='button';btn.className='btn pwa-install-btn';btn.textContent='Instalar app';
    btn.addEventListener('click',installApp);actions.appendChild(btn);
  }
  const available=Boolean(deferredInstallPrompt)||isIOS();
  btn.hidden=!available;
  document.documentElement.classList.toggle('pwa-installable',available);
}
async function installApp(){
  if(isStandalone())return;
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch{}
    deferredInstallPrompt=null;ensureInstallButton();return;
  }
  if(isIOS())toastSafe('En Safari: Compartir → Añadir a pantalla de inicio');
  else toastSafe('La instalación estará disponible cuando el navegador la habilite');
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
function install(){
  if(installed)return;installed=true;setMode();ensureInstallButton();openSectionFromUrl();
  window.addEventListener('online',setMode);window.addEventListener('offline',setMode);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;ensureInstallButton()});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;setMode();document.getElementById('pwaInstallBtn')?.remove();toastSafe('RM 26/27 instalada')});
  document.addEventListener('rm-critical-modules-ready',ensureInstallButton);
  document.addEventListener('rm-modules-ready',ensureInstallButton);
  setTimeout(ensureInstallButton,700);
  window.addEventListener('load',registerServiceWorker,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
