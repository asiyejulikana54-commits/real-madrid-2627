(()=>{
let installed=false,attempts=0,pendingCompare=null,pendingRadar=null,lastRendered='',compareTimer=null,radarTimer=null,compareToken=0,radarToken=0,compareExpired=false,radarExpired=false;
const MAX_ATTEMPTS=36,RETRY_MS=80;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function canon(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function roster(){return safe(()=>players,[])||[]}
function resolve(name){
  const raw=String(name||'').trim();if(!raw)return null;const c=canon(raw);
  const p=roster().find(x=>x.name===raw||x.short===raw||canon(x.name)===c||canon(x.short||'')===c);
  return p?.name||null;
}
function pair(a,b){
  let A=resolve(a),B=resolve(b);if(!A||!B)return null;
  if(canon(A)===canon(B)){const alt=roster().find(p=>canon(p.name)!==canon(A));B=alt?.name||null}
  return A&&B?{a:A,b:B}:null;
}
function hasOption(select,value){return Boolean(select&&[...select.options].some(o=>o.value===value))}
function compareControls(p){const A=document.getElementById('compareA'),B=document.getElementById('compareB');return Boolean(A&&B&&hasOption(A,p.a)&&hasOption(B,p.b))?{A,B}:null}
function emit(name,detail){document.dispatchEvent(new CustomEvent(name,{detail}))}
function syncUrl(p){try{const u=new URL(location.href);u.searchParams.set('section','comparador');u.searchParams.set('a',p.a);u.searchParams.set('b',p.b);u.searchParams.delete('player');history.replaceState(null,'',u.href)}catch{}}
function setStatus(text=''){const el=document.getElementById('cplStatus');if(el)el.textContent=text}
function setBusy(kind,p,on=true){
  const section=document.getElementById('comparador');if(section){section.classList.toggle('cpl-loading',Boolean(on));if(on)section.setAttribute('aria-busy','true');else section.removeAttribute('aria-busy')}
  ensureGuide();
  if(!on){setStatus('');return}
  setStatus(kind==='radar'?`Abriendo Radar · ${p?.a||''} vs ${p?.b||''}`:`Preparando duelo · ${p?.a||''} vs ${p?.b||''}`)
}
function assetScript(selector,src,key,onReady){
  let script=document.querySelector(selector);
  if(!script){script=document.createElement('script');script.src=src;script.dataset[key]='1';script.async=false;document.body.appendChild(script)}
  if(onReady&&!script.dataset.cplReadyBound){script.dataset.cplReadyBound='1';script.addEventListener('load',()=>{script.dataset.cplLoaded='1';onReady()});script.addEventListener('error',()=>onReady())}
  else if(onReady&&(script.dataset.cplLoaded==='1'||(key==='comparePro'&&window.RMComparePro)||(key==='compareRadar'&&window.RMDecisionRadar)))setTimeout(onReady,0);
  return script
}
function ensureCompareAssets(onReady){
  if(!document.querySelector('link[data-compare-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='compare-pro.css?v=1';link.dataset.comparePro='1';document.head.appendChild(link)}
  if(window.RMComparePro){onReady?.();return}
  assetScript('script[data-compare-pro]','compare-pro.js?v=1','comparePro',onReady)
}
function ensureRadarAssets(onReady){
  if(!document.querySelector('link[data-compare-radar]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decisionradar.css?v=1';link.dataset.compareRadar='1';document.head.appendChild(link)}
  if(window.RMDecisionRadar){onReady?.();return}
  assetScript('script[data-compare-radar]','decisionradar.js?v=1','compareRadar',onReady)
}
function finishCompare(source,p){
  pendingCompare=null;compareExpired=false;clearTimeout(compareTimer);compareTimer=null;setBusy('compare',p,false);emit('rm-compare-pro-duel-set',{a:p.a,b:p.b,source});return true
}
function applyCompare(source='bridge'){
  const p=pendingCompare;if(!p)return false;const controls=compareControls(p);if(!controls)return false;
  lastRendered=`${p.a}|${p.b}`;
  if(window.RMComparePro?.setDuel)window.RMComparePro.setDuel(p.a,p.b,true);else{controls.A.value=p.a;controls.B.value=p.b;if(typeof renderCompare==='function')renderCompare();syncUrl(p)}
  return finishCompare(source,p)
}
function retryCompare(source='bridge',n=0,token=compareToken){
  if(token!==compareToken)return;if(applyCompare(source))return;
  if(n>=MAX_ATTEMPTS){compareExpired=true;clearTimeout(compareTimer);compareTimer=null;setBusy('compare',pendingCompare,false);safe(()=>toast('El Comparador tardó demasiado en cargar · toca el duelo para reintentar'));return}
  clearTimeout(compareTimer);compareTimer=setTimeout(()=>retryCompare(source,n+1,token),RETRY_MS)
}
function openCompare(a,b,source='bridge'){
  const p=pair(a,b);if(!p)return false;compareToken++;compareExpired=false;clearTimeout(compareTimer);pendingCompare=p;syncUrl(p);setBusy('compare',p,true);safe(()=>showSection('comparador'));
  const token=compareToken;ensureCompareAssets(()=>{if(token!==compareToken)return;compareExpired=false;retryCompare(`${source}-asset`,0,token)});retryCompare(source,0,token);return true
}
function radarPair(){const values=safe(()=>window.RMDecisionRadar?.players?.(),null);return Array.isArray(values)&&values.length===2?pair(values[0],values[1]):null}
function finishRadar(source,p){pendingRadar=null;radarExpired=false;clearTimeout(radarTimer);radarTimer=null;setBusy('radar',p,false);emit('rm-compare-radar-duel-set',{...p,source});return true}
function applyRadar(source='compare'){
  const p=pendingRadar;if(!p)return false;const root=document.getElementById('radar');if(!root)return false;
  safe(()=>showSection('radar'));
  if(window.RMDecisionRadar?.set){window.RMDecisionRadar.set(p.a,p.b);return finishRadar(source,p)}
  if(typeof window.setRadarPlayers==='function'){
    window.setRadarPlayers(p.a,null);window.setRadarPlayers(null,p.b);return finishRadar(source,p)
  }
  return false;
}
function retryRadar(source='compare',n=0,token=radarToken){
  if(token!==radarToken)return;if(applyRadar(source))return;
  if(n>=MAX_ATTEMPTS){radarExpired=true;clearTimeout(radarTimer);radarTimer=null;setBusy('radar',pendingRadar,false);safe(()=>toast('El Radar tardó demasiado en cargar · vuelve a intentarlo'));return}
  clearTimeout(radarTimer);radarTimer=setTimeout(()=>retryRadar(source,n+1,token),RETRY_MS)
}
function openRadar(a,b,source='compare'){
  const p=pair(a,b);if(!p)return false;radarToken++;radarExpired=false;clearTimeout(radarTimer);pendingRadar=p;setBusy('radar',p,true);const token=radarToken;
  ensureRadarAssets(()=>{if(token!==radarToken)return;radarExpired=false;retryRadar(`${source}-asset`,0,token)});retryRadar(source,0,token);return true;
}
function markStaticExtras(){
  const section=document.getElementById('comparador');if(!section)return;
  const heads=[...section.querySelectorAll(':scope>.section-head')];const head=heads.find(h=>h.textContent.includes('Comparaciones que seguimos'));if(head){head.classList.add('cpl-static-extra');head.nextElementSibling?.classList.add('cpl-static-extra')}
}
function ensureGuide(){
  const section=document.getElementById('comparador'),card=section?.querySelector(':scope>.card');if(!section||!card)return false;
  markStaticExtras();let guide=document.getElementById('compareLifecycleGuide');if(!guide){guide=document.createElement('div');guide.id='compareLifecycleGuide';guide.className='cpl-guide';guide.innerHTML='<div><span>LECTURA RÁPIDA</span><b>Mira primero el veredicto y su confianza.</b><small>Si quieres profundizar, abre el detalle o manda el mismo duelo al Radar.</small><em id="cplStatus" class="cpl-guide-status" aria-live="polite"></em></div><button type="button" id="cplToggle">Ver detalle</button>';card.insertAdjacentElement('afterbegin',guide)}
  else if(!document.getElementById('cplStatus')){const em=document.createElement('em');em.id='cplStatus';em.className='cpl-guide-status';em.setAttribute('aria-live','polite');guide.querySelector('div')?.appendChild(em)}
  const btn=document.getElementById('cplToggle');if(btn&&!btn.dataset.bound){btn.dataset.bound='1';btn.addEventListener('click',()=>{section.classList.toggle('cpl-expanded');btn.textContent=section.classList.contains('cpl-expanded')?'Ocultar detalle':'Ver detalle'})}
  return true;
}
function patchRadarToComparator(){
  if(typeof window.radarToComparator!=='function'||window.radarToComparator.__rmBridge)return false;
  const fn=function(){const p=radarPair();if(p)openCompare(p.a,p.b,'radar');else safe(()=>showSection('comparador'))};fn.__rmBridge=true;window.radarToComparator=fn;return true;
}
function interceptClicks(){
  document.addEventListener('click',e=>{
    const radar=e.target.closest?.('#cpRadar');if(radar){e.preventDefault();e.stopImmediatePropagation();const A=document.getElementById('compareA')?.value,B=document.getElementById('compareB')?.value;openRadar(A,B,'compare-button');return}
  },true)
}
function observeRenders(){
  document.addEventListener('rm-compare-pro-rendered',e=>{const a=e.detail?.a,b=e.detail?.b,key=`${a}|${b}`;ensureGuide();if(a&&b&&key!==lastRendered){lastRendered=key;emit('rm-compare-pro-duel-set',{a,b,source:'render'})}});
  ['rm-modules-ready','rm-season-data-ready','rm-ranking-official-ready'].forEach(ev=>document.addEventListener(ev,()=>{setTimeout(()=>{ensureGuide();patchRadarToComparator();if(pendingCompare&&!compareExpired)retryCompare('event',0,compareToken);if(pendingRadar&&!radarExpired)retryRadar('event',0,radarToken)},60)}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,a=q.get('a'),b=q.get('b');if(a&&b){const p=pair(a,b);if(p){pendingCompare=p;compareToken++;syncUrl(p);setBusy('compare',p,true);const token=compareToken;ensureCompareAssets(()=>retryCompare('url-asset',0,token))}}}catch{}}
function install(){
  if(installed)return;if(typeof showSection!=='function'||typeof players==='undefined'){if(++attempts<120)setTimeout(install,100);return}
  installed=true;ensureGuide();interceptClicks();observeRenders();patchRadarToComparator();applyUrl();if(pendingCompare)retryCompare('url',0,compareToken);
  window.RMCompareLifecycle=Object.freeze({openCompare,openRadar,state:()=>({pendingCompare,pendingRadar,lastRendered,compareExpired,radarExpired}),refresh:()=>{ensureGuide();patchRadarToComparator();if(pendingCompare&&!compareExpired)retryCompare('refresh',0,compareToken);if(pendingRadar&&!radarExpired)retryRadar('refresh',0,radarToken)}});
  emit('rm-compare-lifecycle-ready',{bounded:true,maxAttempts:MAX_ATTEMPTS,assetPreload:true,cancellable:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,120);
})();
