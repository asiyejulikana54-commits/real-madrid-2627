(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1],position:s[4]})),[])||[]}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function current(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function closed(){return safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false)}
function cloneXi(xi){return Object.fromEntries(defs().map(s=>[s.key,xi?.[s.key]||'']))}
function player(name){const key=canonical(name);return safe(()=>players.find(p=>canonical(p.name)===key||(p.short&&canonical(p.short)===key)),null)}
function eligible(slot,name){
  if(!slot||!name)return false;const select=document.getElementById(`pred_${slot}`);if(select&&[...select.options].some(o=>same(o.value,name)))return true;
  const def=defs().find(s=>s.key===slot),p=player(name);return Boolean(def&&p?.eligible?.includes(def.position));
}
function slotOf(xi,name,except=''){return defs().find(s=>s.key!==except&&same(xi?.[s.key],name))?.key||null}
function validXi(xi){const d=defs();if(d.length!==11)return false;const values=d.map(s=>xi?.[s.key]||'');if(values.some(v=>!v))return false;if(new Set(values.map(canonical)).size!==11)return false;return d.every(s=>eligible(s.key,xi[s.key]))}
function setMatch(a,b){const A=new Set(Object.values(a||{}).filter(Boolean).map(canonical)),B=new Set(Object.values(b||{}).filter(Boolean).map(canonical));return [...A].filter(x=>B.has(x)).length}
function selectedCount(xi){return new Set(Object.values(xi||{}).filter(Boolean).map(canonical)).size}
function presenceDiff(base,xi){
  const baseMap=new Map(Object.values(base||{}).filter(Boolean).map(n=>[canonical(n),n])),nextMap=new Map(Object.values(xi||{}).filter(Boolean).map(n=>[canonical(n),n]));
  return {in:[...nextMap].filter(([k])=>!baseMap.has(k)).map(([,n])=>n),out:[...baseMap].filter(([k])=>!nextMap.has(k)).map(([,n])=>n)};
}
function projectXi(state=board()){
  const xi={};for(const row of state?.rows||[]){const key=row.slot?.key;if(key)xi[key]=row.project||row.current||''}
  return cloneXi(xi);
}
function applyAlternative(xi,row){
  const slot=row.slot?.key,alt=row.primary?.name;if(!slot||!alt||same(xi[slot],alt)||!eligible(slot,alt))return {ok:false,next:xi};
  const next=cloneXi(xi),currentName=next[slot],occupied=slotOf(next,alt,slot);
  if(occupied){if(!currentName||!eligible(occupied,currentName))return {ok:false,next:xi};next[occupied]=currentName}
  next[slot]=alt;if(new Set(Object.values(next).filter(Boolean).map(canonical)).size!==Object.values(next).filter(Boolean).length)return {ok:false,next:xi};
  return {ok:true,next,slot,alt,swapped:Boolean(occupied)};
}
function strongXi(project,state=board()){
  let next=cloneXi(project);const applied=[],skipped=[];
  for(const row of state?.rows||[]){if(row.decisionLevel!=='strong'||!row.primary?.name||same(row.primary.name,row.project))continue;const plan=applyAlternative(next,row);if(plan.ok){next=plan.next;applied.push({slot:row.slot?.key,name:row.primary.name,swapped:plan.swapped})}else skipped.push(row.slot?.key||'')}
  return {xi:next,applied,skipped,valid:validXi(next)};
}
function communityXi(){
  const data=window.RMCommunityData||null,m=safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null);if(!data)return {valid:false,reason:'Comunidad no disponible',xi:null,total:0,final:false};
  if(data.match?.id&&m?.id&&data.match.id!==m.id)return {valid:false,reason:'Comunidad de otro partido',xi:null,total:0,final:false};
  const total=Number(data.totalPredictions)||0;if(!total)return {valid:false,reason:'Todavía no hay votos',xi:null,total:0,final:Boolean(data.match?.closed)};
  const xi={};for(const s of defs()){const row=data.popularXI?.[s.key]||null;xi[s.key]=typeof row==='string'?row:row?.name||''}
  if(!validXi(xi))return {valid:false,reason:'El consenso actual no forma 11 titulares únicos y válidos',xi:cloneXi(xi),total,final:Boolean(data.match?.closed)};
  return {valid:true,reason:'',xi:cloneXi(xi),total,final:Boolean(data.match?.closed)};
}
function sameXi(a,b){return defs().every(s=>same(a?.[s.key],b?.[s.key]))}
function scenarioState(){
  const state=board();if(!state)return null;const project=projectXi(state);if(!validXi(project))return null;const strong=strongXi(project,state),community=communityXi(),mine=current(),mineCount=selectedCount(mine);
  const scenarios=[
    {id:'project',title:'Nuestra propuesta',subtitle:'Escenario base del proyecto',xi:project,valid:true,meta:'Punto de partida'},
    {id:'strong',title:'Señales fuertes',subtitle:'Aplica solo debates fuertes compatibles',xi:strong.xi,valid:strong.valid,meta:strong.applied.length?`${strong.applied.length} cambio${strong.applied.length===1?'':'s'} aplicable${strong.applied.length===1?'':'s'}`:'Sin cambios fuertes aplicables',applied:strong.applied,skipped:strong.skipped},
    {id:'community',title:'Comunidad',subtitle:community.valid?'XI más votado por puesto':community.reason,xi:community.xi,valid:community.valid,meta:community.total?`${community.total} pronóstico${community.total===1?'':'s'} · ${community.final?'final':'provisional'}`:'Sin muestra',community}
  ];
  for(const s of scenarios){s.match=mineCount?setMatch(mine,s.xi):0;s.diff=s.xi?presenceDiff(project,s.xi):{in:[],out:[]};s.sameCurrent=s.valid&&sameXi(mine,s.xi)}
  const available=scenarios.filter(s=>s.valid),best=mineCount===11?[...available].sort((a,b)=>b.match-a.match||a.title.localeCompare(b.title,'es'))[0]||null:null;
  return {state,project,strong,community,mine,mineCount,scenarios,available,best,isClosed:closed()};
}
function playerGrid(s,project){
  if(!s.xi)return '<div class="sl-unavailable">Escenario no disponible todavía.</div>';
  return `<div class="sl-xi">${defs().map(d=>{const name=s.xi[d.key]||'—',changed=!same(project[d.key],name);return `<span class="${changed?'changed':''}"><small>${esc(d.label)}</small><b>${esc(display(name))}</b></span>`}).join('')}</div>`;
}
function card(s,ctx){
  const diff=s.diff.in.length,den=ctx.mineCount||11,matchText=ctx.mineCount?`${s.match}/${den} con tu borrador`:'Completa tu XI para comparar',disabled=ctx.isClosed||!s.valid||s.sameCurrent;
  const changeText=s.id==='project'?'0 titulares distintos':`${diff} titular${diff===1?'':'es'} distinto${diff===1?'':'s'} vs proyecto`;
  return `<article class="sl-card ${s.id} ${s.valid?'':'unavailable'}"><div class="sl-card-head"><div><span>${esc(s.title)}</span><small>${esc(s.subtitle)}</small></div><em>${esc(s.meta)}</em></div><div class="sl-metrics"><b>${esc(matchText)}</b><span>${esc(changeText)}</span></div>${playerGrid(s,ctx.project)}${s.diff.in.length?`<p class="sl-diff"><b>Entran:</b> ${s.diff.in.map(display).map(esc).join(' · ')}<br><b>Salen:</b> ${s.diff.out.map(display).map(esc).join(' · ')}</p>`:''}<button type="button" data-sl-load="${esc(s.id)}" ${disabled?'disabled':''}>${ctx.isClosed?'Predicción cerrada':s.sameCurrent?'Ya está en tu borrador':s.valid?'Probar este escenario':'No disponible'}</button></article>`;
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('scenarioLab');if(root)return root;root=document.createElement('section');root.id='scenarioLab';root.className='card sl-shell';const anchor=document.getElementById('decisionActions')||document.getElementById('decisionBoard')||document.getElementById('xiStability');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function ensureMatchday(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('scenarioLabMatchday');if(root)return root;root=document.createElement('section');root.id='scenarioLabMatchday';root.className='card sl-compact';const anchor=document.getElementById('predictionReadinessMatchday')||document.getElementById('decisionBoardMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function refreshRelated(){safe(()=>window.RMPredictionPro?.render?.());safe(()=>window.RMXIStability?.render?.());safe(()=>window.RMDecisionBoard?.render?.());safe(()=>window.RMDecisionActions?.render?.());safe(()=>window.RMPredictionReadiness?.render?.())}
function loadScenario(id){
  const ctx=scenarioState(),s=ctx?.scenarios?.find(x=>x.id===id);if(!s?.valid||ctx.isClosed||typeof setPredictionXI!=='function')return;setPredictionXI(s.xi);const first=defs().find(d=>document.getElementById(`pred_${d.key}`));if(first)document.getElementById(`pred_${first.key}`)?.dispatchEvent(new Event('change',{bubbles:true}));document.dispatchEvent(new CustomEvent('rm-prediction-draft-updated',{detail:{scenario:id}}));refreshRelated();render();safe(()=>toast(`${s.title} cargado · sin guardar`));
}
function html(ctx){
  const best=ctx.best?`Tu XI se parece más a <b>${esc(ctx.best.title)}</b> · ${ctx.best.match}/11.`:'Completa los 11 jugadores para medir qué escenario se parece más a tu predicción.';
  return `<div class="sl-head"><div><span>LABORATORIO DE ESCENARIOS</span><h3>Tres formas de mirar el próximo XI</h3><p>No son probabilidades de titularidad. Son composiciones válidas construidas desde nuestra propuesta, los debates fuertes y el consenso comunitario cuando existe.</p></div><div class="sl-best">${best}</div></div><div class="sl-grid">${ctx.scenarios.map(s=>card(s,ctx)).join('')}</div><p class="sl-note">“Señales fuertes” solo cambia un puesto cuando la alternativa es compatible y el XI sigue teniendo 11 jugadores únicos. Si una sustitución rompe la estructura, se omite en lugar de forzarla.</p>`;
}
function bind(root){root?.querySelectorAll('[data-sl-load]').forEach(b=>b.addEventListener('click',()=>loadScenario(b.dataset.slLoad)))}
function render(){
  const ctx=scenarioState();if(!ctx)return;const root=ensurePrediction();if(root){root.innerHTML=html(ctx);bind(root)}
  const compact=ensureMatchday();if(compact){const labels=ctx.available.map(s=>s.title).join(' · '),best=ctx.best?`Más cercano a tu XI: ${ctx.best.title} (${ctx.best.match}/11)`:`${ctx.available.length} escenarios válidos`;compact.innerHTML=`<div><span>ESCENARIOS DE XI</span><b>${esc(best)}</b><small>${esc(labels)}</small></div><button type="button" class="btn" data-sl-open>Ver escenarios</button>`;compact.querySelector('[data-sl-open]')?.addEventListener('click',()=>{safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('scenarioLab')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)})}
  document.dispatchEvent(new CustomEvent('rm-scenario-lab-rendered',{detail:{available:ctx.available.map(s=>s.id),best:ctx.best?.id||null,bestMatch:ctx.best?.match??null,strongChanges:ctx.strong.applied.length,communityValid:ctx.community.valid}}));
}
function install(){
  if(installed)return;if(!window.RMDecisionBoard||typeof currentPredictionXI!=='function'||typeof setPredictionXI!=='function'){if(++attempts<100)setTimeout(install,100);return}
  installed=true;render();
  ['rm-decision-board-rendered','rm-community-updated','rm-local-prediction-updated','rm-prediction-analytics-updated','rm-decision-actions-updated','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,50)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});
  window.RMScenarioLab=Object.freeze({render,state:scenarioState,load:loadScenario});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
