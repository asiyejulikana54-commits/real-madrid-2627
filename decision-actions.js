(()=>{
let installed=false,attempts=0;
const history=[];
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function current(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function saved(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function closed(){return safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false)}
function cloneXi(xi){return Object.fromEntries(Object.entries(xi||{}).map(([k,v])=>[k,v||'']))}
function hasOption(slot,name){const select=document.getElementById(`pred_${slot}`);return Boolean(select&&[...select.options].some(o=>same(o.value,name)))}
function slotOf(xi,name,except=''){return Object.entries(xi||{}).find(([k,v])=>k!==except&&same(v,name))?.[0]||null}
function dispatchDraft(changed=[]){
  const key=changed.find(k=>document.getElementById(`pred_${k}`));if(key)document.getElementById(`pred_${key}`)?.dispatchEvent(new Event('change',{bubbles:true}));
  document.dispatchEvent(new CustomEvent('rm-prediction-draft-updated',{detail:{changed}}));
  setTimeout(()=>{window.RMPredictionPro?.render?.();window.RMXIStability?.render?.();window.RMDecisionBoard?.render?.();render()},50)
}
function commitXi(next,before,changed,message){
  if(typeof setPredictionXI!=='function')return false;
  history.push(cloneXi(before));if(history.length>8)history.shift();setPredictionXI(next);dispatchDraft(changed);safe(()=>toast(message));return true
}
function planChange(xi,row){
  const slot=row.slot?.key,alt=row.primary?.name,project=row.project;if(!slot||!alt||same(alt,project))return {ok:false,reason:'Sin alternativa aplicable'};
  if(!hasOption(slot,alt))return {ok:false,reason:`${display(alt)} no es elegible en ${row.slot?.label||slot}`};
  const next=cloneXi(xi);if(same(next[slot],alt))return {ok:false,reason:'Ya tienes esa alternativa'};
  const occupied=slotOf(next,alt,slot),changed=[slot];
  if(occupied){
    if(!project||!hasOption(occupied,project))return {ok:false,reason:`${display(alt)} ya está en tu XI y ${display(project)} no puede intercambiar su puesto`};
    const third=slotOf(next,project,slot);if(third&&third!==occupied)return {ok:false,reason:`${display(project)} ya aparece en otra posición`};
    next[occupied]=project;changed.push(occupied)
  }
  next[slot]=alt;
  const values=Object.values(next).filter(Boolean).map(canonical);if(new Set(values).size!==values.length)return {ok:false,reason:'El cambio dejaría un jugador repetido'};
  return {ok:true,next,changed,swapped:Boolean(occupied)}
}
function applyRow(slot){
  if(closed()){safe(()=>toast('La predicción ya está cerrada'));return}
  const s=board(),row=s?.rows?.find(r=>r.slot?.key===slot);if(!row?.primary?.name){safe(()=>toast('No hay una alternativa clara para ese puesto'));return}
  const before=current(),plan=planChange(before,row);if(!plan.ok){safe(()=>toast(plan.reason));return}
  commitXi(plan.next,before,plan.changed,plan.swapped?`Cambio probado con intercambio: ${display(row.primary.name)}`:`Probando ${display(row.primary.name)} en ${row.slot?.label||slot}`)
}
function applyStrong(){
  if(closed()){safe(()=>toast('La predicción ya está cerrada'));return}
  const rows=(board()?.rows||[]).filter(r=>r.decisionLevel==='strong'&&r.primary?.name&&!same(r.primary.name,r.project));if(!rows.length){safe(()=>toast('No hay debates fuertes aplicables ahora'));return}
  const before=current();let next=cloneXi(before),changed=[],applied=0;
  for(const row of rows){const plan=planChange(next,row);if(!plan.ok)continue;next=plan.next;changed.push(...plan.changed);applied++}
  changed=[...new Set(changed)];if(!applied){safe(()=>toast('Los debates fuertes actuales chocan con la composición de tu XI'));return}
  commitXi(next,before,changed,`Probados ${applied} debate${applied===1?'':'s'} fuerte${applied===1?'':'s'} · sin guardar`)
}
function undo(){
  if(closed()||!history.length)return;const before=current(),prev=history.pop();if(typeof setPredictionXI!=='function')return;setPredictionXI(prev);const changed=Object.keys(prev).filter(k=>!same(prev[k],before[k]));dispatchDraft(changed);safe(()=>toast('Último cambio deshecho'))
}
function restoreSaved(){
  if(closed())return;const data=saved();if(!data?.xi){safe(()=>toast('Aún no tienes un XI guardado'));return}
  const before=current(),next=cloneXi(data.xi);history.push(cloneXi(before));if(history.length>8)history.shift();setPredictionXI(next);const changed=Object.keys(next).filter(k=>!same(next[k],before[k]));dispatchDraft(changed);safe(()=>toast('XI guardado restaurado'))
}
function sourceText(row){const map={user:'tu XI',community:'comunidad',data:'datos'};return (row.primary?.sources||[]).map(x=>map[x]||x).join(' + ')||'señales disponibles'}
function ensure(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('decisionActions');if(root)return root;
  root=document.createElement('section');root.id='decisionActions';root.className='card dact-shell';const anchor=document.getElementById('decisionBoard')||document.getElementById('xiStability')||document.getElementById('predictionAnalytics');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root
}
function render(){
  const root=ensure(),s=board();if(!root||!s)return;const xi=current(),rows=(s.rows||[]).filter(r=>r.decisionLevel!=='consensus'&&r.primary?.name&&!same(r.primary.name,r.project)).slice(0,5),strong=rows.filter(r=>r.decisionLevel==='strong'),isClosed=closed(),data=saved();
  root.innerHTML=`<div class="dact-head"><div><span>ACCIONES SOBRE TU XI</span><h3>Prueba las alternativas sin comprometer tu predicción</h3><p>Aplicamos cambios sobre el borrador, comprobamos posiciones y evitamos duplicados. Nada se guarda ni se publica hasta que pulses Guardar/Publicar predicción.</p></div><div class="dact-tools">${strong.length?`<button type="button" data-dact-all ${isClosed?'disabled':''}>Probar debates fuertes (${strong.length})</button>`:''}<button type="button" data-dact-undo ${!history.length||isClosed?'disabled':''}>Deshacer</button>${data?.xi?`<button type="button" data-dact-restore ${isClosed?'disabled':''}>Restaurar guardado</button>`:''}</div></div><div class="dact-list">${rows.length?rows.map(r=>{const alt=r.primary.name,active=same(xi[r.slot.key],alt),currentName=xi[r.slot.key]||'—';return `<article class="${r.decisionLevel}"><div><span>${esc(r.slot.label||r.slot.role||r.slot.key)}</span><em>${esc(r.decisionLabel)}</em></div><b>${esc(display(r.project))} → ${esc(display(alt))}</b><small>${esc(sourceText(r))}</small><p>Ahora en tu XI: <strong>${esc(display(currentName))}</strong></p><button type="button" data-dact-slot="${esc(r.slot.key)}" ${active||isClosed?'disabled':''}>${active?'Alternativa ya aplicada':'Probar en mi XI'}</button></article>`}).join(''):'<div class="dact-empty"><b>No hay cambios accionables ahora mismo.</b><span>Los puestos están alineados o no existe una alternativa suficientemente clara.</span></div>'}</div><p class="dact-note">Si la alternativa ya está colocada en otro puesto, intentamos un intercambio solo cuando ambos jugadores son elegibles. Si no es seguro, el cambio se bloquea en vez de romper tu XI.</p>`;
  root.querySelectorAll('[data-dact-slot]').forEach(b=>b.addEventListener('click',()=>applyRow(b.dataset.dactSlot)));root.querySelector('[data-dact-all]')?.addEventListener('click',applyStrong);root.querySelector('[data-dact-undo]')?.addEventListener('click',undo);root.querySelector('[data-dact-restore]')?.addEventListener('click',restoreSaved)
}
function install(){
  if(installed)return;if(!window.RMDecisionBoard||typeof currentPredictionXI!=='function'||typeof setPredictionXI!=='function'){if(++attempts<90)setTimeout(install,100);return}
  installed=true;render();
  ['rm-decision-board-rendered','rm-xi-stability-rendered','rm-community-updated','rm-local-prediction-updated','rm-prediction-analytics-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,40)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});
  window.RMDecisionActions=Object.freeze({render,applyRow,applyStrong,undo,restoreSaved});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
