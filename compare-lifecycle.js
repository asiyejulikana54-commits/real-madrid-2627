(()=>{
let installed=false,attempts=0,pendingCompare=null,pendingRadar=null,lastRendered='';
const MAX_ATTEMPTS=36;
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
function ensureRadarAssets(){
  if(!document.querySelector('link[data-compare-radar]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decisionradar.css?v=1';link.dataset.compareRadar='1';document.head.appendChild(link)}
  if(!window.RMDecisionRadar&&!document.querySelector('script[data-compare-radar]')){const script=document.createElement('script');script.src='decisionradar.js?v=1';script.dataset.compareRadar='1';document.body.appendChild(script)}
}
function applyCompare(source='bridge'){
  const p=pendingCompare;if(!p)return false;const controls=compareControls(p);if(!controls)return false;
  lastRendered=`${p.a}|${p.b}`;
  if(window.RMComparePro?.setDuel)window.RMComparePro.setDuel(p.a,p.b,true);else{controls.A.value=p.a;controls.B.value=p.b;if(typeof renderCompare==='function')renderCompare();syncUrl(p)}
  pendingCompare=null;emit('rm-compare-pro-duel-set',{a:p.a,b:p.b,source});return true;
}
function retryCompare(source='bridge',n=0){if(applyCompare(source))return;if(n>=MAX_ATTEMPTS)return;setTimeout(()=>retryCompare(source,n+1),80)}
function openCompare(a,b,source='bridge'){
  const p=pair(a,b);if(!p)return false;pendingCompare=p;safe(()=>showSection('comparador'));retryCompare(source);return true;
}
function radarPair(){const values=safe(()=>window.RMDecisionRadar?.players?.(),null);return Array.isArray(values)&&values.length===2?pair(values[0],values[1]):null}
function applyRadar(source='compare'){
  const p=pendingRadar;if(!p)return false;const root=document.getElementById('radar');if(!root)return false;
  safe(()=>showSection('radar'));
  if(window.RMDecisionRadar?.set){window.RMDecisionRadar.set(p.a,p.b);pendingRadar=null;emit('rm-compare-radar-duel-set',{...p,source});return true}
  if(typeof window.setRadarPlayers==='function'){
    window.setRadarPlayers(p.a,null);window.setRadarPlayers(null,p.b);pendingRadar=null;emit('rm-compare-radar-duel-set',{...p,source});return true
  }
  return false;
}
function retryRadar(source='compare',n=0){if(applyRadar(source))return;if(n>=MAX_ATTEMPTS)return;setTimeout(()=>retryRadar(source,n+1),80)}
function openRadar(a,b,source='compare'){
  const p=pair(a,b);if(!p)return false;pendingRadar=p;ensureRadarAssets();retryRadar(source);return true;
}
function markStaticExtras(){
  const section=document.getElementById('comparador');if(!section)return;
  const heads=[...section.querySelectorAll(':scope>.section-head')];const head=heads.find(h=>h.textContent.includes('Comparaciones que seguimos'));if(head){head.classList.add('cpl-static-extra');head.nextElementSibling?.classList.add('cpl-static-extra')}
}
function ensureGuide(){
  const section=document.getElementById('comparador'),card=section?.querySelector(':scope>.card');if(!section||!card)return false;
  markStaticExtras();let guide=document.getElementById('compareLifecycleGuide');if(!guide){guide=document.createElement('div');guide.id='compareLifecycleGuide';guide.className='cpl-guide';guide.innerHTML='<div><span>LECTURA RÁPIDA</span><b>Mira primero el veredicto y su confianza.</b><small>Si quieres profundizar, abre el detalle o manda el mismo duelo al Radar.</small></div><button type="button" id="cplToggle">Ver detalle</button>';card.insertAdjacentElement('afterbegin',guide)}
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
  ['rm-modules-ready','rm-season-data-ready','rm-ranking-official-ready'].forEach(ev=>document.addEventListener(ev,()=>{setTimeout(()=>{ensureGuide();patchRadarToComparator();if(pendingCompare)retryCompare('event');if(pendingRadar)retryRadar('event')},60)}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,a=q.get('a'),b=q.get('b');if(a&&b)pendingCompare=pair(a,b)}catch{}}
function install(){
  if(installed)return;if(typeof showSection!=='function'||typeof players==='undefined'){if(++attempts<120)setTimeout(install,100);return}
  installed=true;applyUrl();ensureGuide();interceptClicks();observeRenders();patchRadarToComparator();if(pendingCompare)retryCompare('url');
  window.RMCompareLifecycle=Object.freeze({openCompare,openRadar,state:()=>({pendingCompare,pendingRadar,lastRendered}),refresh:()=>{ensureGuide();patchRadarToComparator()}});
  emit('rm-compare-lifecycle-ready',{bounded:true,maxAttempts:MAX_ATTEMPTS});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,120);
})();
