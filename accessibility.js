(()=>{
const DIALOGS=[
  {root:'#playerHubModal',panel:'.player-sheet',close:()=>window.closePlayerHub?.(),label:'Ficha de jugador'},
  {root:'#rmGlobalSearch',panel:'.global-search-panel',close:()=>window.RMPersonal?.closeSearch?.(),label:'Buscar en RM 26/27'},
  {root:'#siteGuide',panel:'.site-guide-panel',close:()=>window.RMSiteGuide?.close?.(),label:'Guía de RM 26/27'},
  {root:'#pwaInstallGuide',panel:'.pwa-guide-panel',close:()=>window.RMPWA?.closeGuide?.(),label:'Instalar RM 26/27'},
  {root:'#uxMoreSheet',panel:'.ux-sheet-panel',close:()=>window.closeUxMore?.(),label:'Más opciones'}
];
const PANEL_SELECTOR=DIALOGS.map(x=>x.panel).join(',');
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const LABELS={
  playerSearch:'Buscar jugador',positionFilter:'Filtrar plantilla por posición',compareA:'Primer jugador a comparar',compareB:'Segundo jugador a comparar',notes:'Notas personales',predictionName:'Nombre o apodo',predictionComment:'Comentario privado de la predicción',lineupName:'Nombre del once',lineupComment:'Comentario táctico',spSearch:'Buscar jugador en estadísticas',mhSearch:'Buscar partido',epSearch:'Buscar jugador en evolución',rmSearchInput:'Buscar en RM 26/27'
};
let installed=false,activeDialog=null,returnFocus=null,lastOutsideFocus=null,lastSection=null;
function visible(el){return Boolean(el&&el.isConnected&&!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden')}
function focusables(panel){return [...panel.querySelectorAll(FOCUSABLE)].filter(el=>visible(el)&&!el.closest('[aria-hidden="true"]')&&!el.classList.contains('global-search-backdrop')&&!el.classList.contains('site-guide-backdrop')&&!el.classList.contains('pwa-guide-backdrop')&&!el.classList.contains('ux-sheet-backdrop')&&!el.classList.contains('player-modal-backdrop'))}
function setLabelledBy(panel,root,label){
  if(panel.hasAttribute('aria-label')||panel.hasAttribute('aria-labelledby'))return;
  const title=panel.querySelector('h1,h2,h3');
  if(title){if(!title.id)title.id=`a11y-title-${root.id||Math.random().toString(36).slice(2)}`;panel.setAttribute('aria-labelledby',title.id)}else panel.setAttribute('aria-label',label)
}
function prepDialog(cfg){
  const root=document.querySelector(cfg.root);if(!root)return null;const panel=root.querySelector(cfg.panel);if(!panel)return null;
  const open=root.classList.contains('open');root.setAttribute('aria-hidden',open?'false':'true');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.tabIndex=-1;setLabelledBy(panel,root,cfg.label);
  root.querySelectorAll('.global-search-backdrop,.site-guide-backdrop,.pwa-guide-backdrop,.ux-sheet-backdrop,.player-modal-backdrop').forEach(el=>{el.tabIndex=-1;el.setAttribute('aria-hidden','true')});
  return open?{...cfg,root,panel}:null
}
function currentOpen(){let found=null;DIALOGS.forEach(cfg=>{const x=prepDialog(cfg);if(x)found=x});return found}
function preferred(panel){return panel.querySelector('#rmSearchInput,.player-close,.site-guide-close,.pwa-guide-close,.ux-sheet-head button,[autofocus]')||focusables(panel)[0]||panel}
function restoreFocus(){const el=returnFocus;if(el&&el.isConnected&&typeof el.focus==='function'){try{el.focus({preventScroll:true})}catch{try{el.focus()}catch{}}}returnFocus=null}
function syncGlossary(){document.querySelectorAll('.sg-term button').forEach(btn=>{const open=btn.closest('.sg-term')?.classList.contains('open');btn.setAttribute('aria-expanded',open?'true':'false')})}
function syncLabels(){
  Object.entries(LABELS).forEach(([id,label])=>{const el=document.getElementById(id);if(el&&!el.hasAttribute('aria-label')&&!el.hasAttribute('aria-labelledby'))el.setAttribute('aria-label',label)});
  document.querySelectorAll('.slot select').forEach(sel=>{if(sel.hasAttribute('aria-label'))return;const label=sel.closest('.slot')?.querySelector('label')?.textContent?.trim();if(label)sel.setAttribute('aria-label',`${label}: seleccionar jugador`)});
  const toast=document.getElementById('toast');if(toast){toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true')}
}
function syncNav(){
  document.getElementById('navDesktop')?.setAttribute('aria-label','Navegación principal');document.getElementById('navMobile')?.setAttribute('aria-label','Navegación inferior');
  const id=document.querySelector('.section.active')?.id||'inicio';document.querySelectorAll('[data-section]').forEach(btn=>{if(btn.dataset.section===id)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
  const more=document.getElementById('uxMoreTab');if(more){more.setAttribute('aria-haspopup','dialog');more.setAttribute('aria-controls','uxMoreSheet');if(!['inicio','partido','plantilla','power'].includes(id))more.setAttribute('aria-current','page');else if(more.dataset.section!==id)more.removeAttribute('aria-current')}
}
function ensureLandmarks(){
  const main=document.querySelector('main');if(main){if(!main.id)main.id='mainContent';main.tabIndex=-1}
  if(!document.getElementById('a11ySkip')){const a=document.createElement('a');a.id='a11ySkip';a.className='a11y-skip';a.href='#mainContent';a.textContent='Saltar al contenido principal';a.addEventListener('click',()=>setTimeout(()=>document.getElementById('mainContent')?.focus({preventScroll:false}),0));document.body.prepend(a)}
  if(!document.getElementById('a11yRouteStatus')){const live=document.createElement('div');live.id='a11yRouteStatus';live.className='a11y-sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.appendChild(live)}
}
function announceSection(id){if(!id||id===lastSection)return;lastSection=id;const title=document.getElementById(id)?.querySelector('h1,h2')?.textContent?.trim()||document.getElementById('pageTitle')?.textContent?.trim()||id;const live=document.getElementById('a11yRouteStatus');if(live){live.textContent='';setTimeout(()=>{live.textContent=`Sección ${title}`},20)}}
function scan({focusNew=true}={}){
  ensureLandmarks();syncLabels();syncGlossary();syncNav();const open=currentOpen();
  if(open?.root!==activeDialog?.root){
    if(!open&&activeDialog){activeDialog=null;restoreFocus();return}
    if(open){if(!activeDialog){const candidate=lastOutsideFocus&&lastOutsideFocus.isConnected?lastOutsideFocus:document.activeElement;if(candidate&&!open.panel.contains(candidate))returnFocus=candidate}activeDialog=open;if(focusNew)setTimeout(()=>{if(activeDialog?.root===open.root&&!open.panel.contains(document.activeElement)){try{preferred(open.panel).focus({preventScroll:true})}catch{}}},0)}
  }else activeDialog=open;
}
function closeActive(){if(!activeDialog)return;try{activeDialog.close()}catch{}setTimeout(()=>scan({focusNew:false}),0)}
function trapTab(e){if(!activeDialog||e.key!=='Tab')return;const list=focusables(activeDialog.panel);if(!list.length){e.preventDefault();activeDialog.panel.focus();return}const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}else if(!activeDialog.panel.contains(document.activeElement)){e.preventDefault();first.focus()}}
function hookNavigation(){if(window.__rmA11yShowHook||typeof showSection!=='function')return;window.__rmA11yShowHook=true;const base=showSection;showSection=function(id){const out=base.apply(this,arguments);setTimeout(()=>{syncNav();syncLabels();announceSection(id);scan({focusNew:false})},0);return out}}
function install(){
  if(installed)return;if(!document.body){setTimeout(install,40);return}installed=true;ensureLandmarks();syncLabels();syncNav();hookNavigation();scan({focusNew:false});
  document.addEventListener('focusin',e=>{if(!e.target.closest(PANEL_SELECTOR))lastOutsideFocus=e.target},true);
  document.addEventListener('pointerdown',e=>{if(!e.target.closest(PANEL_SELECTOR)){const el=e.target.closest('button,a,input,select,textarea,[tabindex]');if(el)lastOutsideFocus=el}},true);
  document.addEventListener('click',()=>setTimeout(()=>scan(),0),true);
  document.addEventListener('keyup',()=>setTimeout(()=>scan(),0),true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeDialog){e.preventDefault();closeActive();return}trapTab(e)},true);
  ['rm-critical-modules-ready','rm-modules-ready','rm-season-data-ready','rm-ranking-official-ready'].forEach(name=>document.addEventListener(name,()=>setTimeout(()=>{hookNavigation();scan({focusNew:false})},0)));
  [250,800,1800,3200].forEach(ms=>setTimeout(()=>{hookNavigation();scan({focusNew:false})},ms));
  window.RMAccessibility=Object.freeze({refresh:()=>scan({focusNew:false}),activeDialog:()=>activeDialog?.root?.id||null});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
