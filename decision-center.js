(()=>{
const MODE_KEY='rm_decision_center_mode_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1],position:s[4]})),[])||[]}
function currentXi(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function projectXi(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>typeof rayoXI!=='undefined'?rayoXI:null,null)||safe(()=>typeof baseXI!=='undefined'?baseXI:null,null)||null}
function validXi(xi){const d=defs(),vals=d.map(s=>xi?.[s.key]||'');return d.length===11&&!vals.some(v=>!v)&&new Set(vals.map(canonical)).size===11}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function readiness(){return safe(()=>window.RMPredictionReadiness?.state?.(),null)}
function coach(){return safe(()=>window.RMDecisionCoach?.state?.(),null)}
function consensus(){return safe(()=>window.RMConsensusXI?.auditableState?.(),null)}
function mode(){try{return localStorage.getItem(MODE_KEY)==='advanced'?'advanced':'focused'}catch{return 'focused'}}
function setMode(value){try{localStorage.setItem(MODE_KEY,value==='advanced'?'advanced':'focused')}catch{}applyMode();render()}
function applyMode(){const section=document.getElementById('prediccion');if(!section)return;const focused=mode()==='focused';section.classList.toggle('dc-focus-mode',focused);section.classList.toggle('dc-advanced-mode',!focused)}
function compareXi(base,other){
  if(!validXi(base)||!validXi(other))return null;
  if(window.RMLineupSemantics){const c=window.RMLineupSemantics.compare(base,other);return {count:c.count||0,playerIn:c.playerIn||[],playerOut:c.playerOut||[]}}
  const A=new Map(Object.values(base).map(n=>[canonical(n),n])),B=new Map(Object.values(other).map(n=>[canonical(n),n]));
  const playerIn=[...B].filter(([k])=>!A.has(k)).map(([,n])=>n),playerOut=[...A].filter(([k])=>!B.has(k)).map(([,n])=>n);return {count:playerIn.length,playerIn,playerOut};
}
function guide(){
  const c=consensus();if(c?.xi&&validXi(c.xi))return {xi:c.xi,label:'XI guía · síntesis auditable',meta:`${c.total} perspectivas · ${c.unanimous} unánimes · ${c.split} divididos`,source:'consensus'};
  const p=projectXi();if(p&&validXi(p))return {xi:p,label:'XI guía · proyecto',meta:'Referencia principal disponible',source:'project'};
  return null;
}
function coachBySlot(){const c=coach(),map=new Map();for(const row of c?.changes||[]){const key=row.slot?.key;if(key)map.set(key,row)}return map}
function priorityRows(){
  const b=board();if(!b?.rows?.length)return [];
  const cmap=coachBySlot();
  return b.rows.map(r=>{const cr=cmap.get(r.slot?.key)||null;let priority=r.decisionLevel==='strong'?100:r.decisionLevel==='open'?60:10;if(r.userDiff)priority+=35;if(cr?.coachSignal?.kind==='review')priority+=25;if(cr?.coachSignal?.kind==='support')priority+=8;if(r.primary?.sources?.length>=2)priority+=12;return {...r,centerCoach:cr,centerPriority:priority}}).filter(r=>r.decisionLevel!=='consensus'||r.userDiff).sort((a,b)=>b.centerPriority-a.centerPriority).slice(0,3);
}
function state(){
  const b=board(),r=readiness(),g=guide(),mine=currentXi(),diff=g&&validXi(mine)?compareXi(g.xi,mine):null,decisions=priorityRows();if(!b||!r)return null;
  return {board:b,readiness:r,guide:g,mine,diff,decisions,mode:mode()};
}
function ensure(){const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('decisionCenter');if(root)return root;root=document.createElement('section');root.id='decisionCenter';root.className='card decision-center';const anchor=document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root}
function sourceLabel(sources=[]){const m={user:'Tú',community:'Comunidad',data:'Datos'};return sources.map(s=>m[s]||s).join(' + ')}
function decisionCard(row,index){
  const alt=row.primary?.name||row.challenger?.p?.name||null,user=row.user||row.mineName||null,coachSignal=row.centerCoach?.coachSignal||null;
  const tag=row.decisionLevel==='strong'?'DEBATE FUERTE':row.userDiff?'TU CAMBIO':'DEBATE ABIERTO';
  const support=row.primary?.sources?.length?sourceLabel(row.primary.sources):row.dataDiff?'Datos':'Sin segunda señal';
  const history=coachSignal?`<span class="dc-center-history ${esc(coachSignal.kind)}">${esc(coachSignal.label)}</span>`:'';
  return `<article class="dc-center-decision ${esc(row.decisionLevel)}"><div class="dc-center-rank"><b>${index+1}</b><span>${esc(row.slot?.label||row.slot?.role||row.slot?.key||'Puesto')}</span><em>${esc(tag)}</em></div><h4>${esc(display(row.project))}${alt&&!same(alt,row.project)?` ↔ ${esc(display(alt))}`:''}</h4><p>${row.userDiff&&user?`Tú eliges <b>${esc(display(user))}</b>. `:''}${alt?`Alternativa principal respaldada por ${esc(support)}.`:'Sin rival principal claro.'}</p><div class="dc-center-decision-foot">${history}${alt&&!same(alt,row.project)?`<button type="button" data-dc-center-duel="${esc(row.project)}|${esc(alt)}">Comparar</button>`:`<button type="button" data-dc-center-player="${esc(row.project)}">Ver ficha</button>`}</div></article>`;
}
function xiGroups(g){
  if(!g)return '<div class="dc-center-empty">Todavía no hay un XI guía completo.</div>';const d=defs(),groups=[['POR',['gk']],['DEF',['lb','lcb','rcb','rb']],['MED',['dm1','dm2','am']],['ATA',['lw','rw','st']]];
  const known=new Set(groups.flatMap(([,keys])=>keys));const rest=d.map(x=>x.key).filter(k=>!known.has(k));if(rest.length)groups.push(['OTROS',rest]);
  return `<div class="dc-center-xi">${groups.map(([label,keys])=>`<div><span>${label}</span><p>${keys.map(k=>g.xi?.[k]).filter(Boolean).map(n=>`<b>${esc(display(n))}</b>`).join('')}</p></div>`).join('')}</div>`;
}
function diffText(s){if(!s.guide)return 'Sin XI guía disponible';if(!validXi(s.mine))return 'Completa tu XI para compararlo';if(!s.diff?.count)return 'Tu XI coincide con el XI guía por roles';const ins=s.diff.playerIn.map(display),outs=s.diff.playerOut.map(display);return `${s.diff.count} cambio${s.diff.count===1?'':'s'} real${s.diff.count===1?'':'es'} · entra ${ins.join(', ')}${outs.length?` · sale ${outs.join(', ')}`:''}`}
function nextAction(s){
  const r=s.readiness;if(r.isClosed)return {label:'Ver revisión oficial',kind:'official'};
  if(!r.complete)return {label:'Completar mi XI',kind:'pitch'};
  if(!r.p?.data||r.p?.dirty)return {label:'Guardar mi XI',kind:'save'};
  if(!r.reviewed)return {label:'Confirmar revisión final',kind:'review'};
  return {label:'XI listo para el cierre',kind:'ready'};
}
function html(s){
  const action=nextAction(s),debates=s.decisions.length,strong=s.board.counts?.strong||0,guideSource=s.guide?.source==='consensus'?'AUDITABLE':'PROYECTO',status=s.readiness.status||'PENDIENTE';
  return `<div class="dc-center-head"><div><span>CENTRO DE DECISIÓN</span><h2>Esto es lo importante hoy</h2><p>Primero resolvemos las decisiones que pueden mover el XI. El resto del análisis sigue disponible, pero ya no compite por tu atención.</p></div><div class="dc-center-status ${esc(s.readiness.tone||'review')}"><b>${esc(status)}</b><small>${esc(s.readiness.message||'')}</small></div></div><div class="dc-center-strip"><div><span>Decisiones prioritarias</span><b>${debates}</b><small>${strong} debate${strong===1?'':'s'} fuerte${strong===1?'':'s'}</small></div><div><span>XI guía</span><b>${esc(guideSource)}</b><small>${esc(s.guide?.meta||'pendiente')}</small></div><div><span>Tu diferencia</span><b>${s.diff?.count??'—'}</b><small>${esc(diffText(s))}</small></div><div><span>Modo</span><b>${s.mode==='focused'?'ESENCIAL':'AVANZADO'}</b><small>${s.mode==='focused'?'solo lo necesario':'todos los módulos visibles'}</small></div></div><section class="dc-center-priority"><div class="dc-center-subhead"><div><span>1 · DECIDE</span><h3>${debates?'Las decisiones que más pueden cambiar el once':'No hay conflictos importantes ahora mismo'}</h3></div>${debates?'<small>Máximo 3 · ordenadas por fuerza del debate y tu desacuerdo</small>':''}</div>${debates?`<div class="dc-center-grid">${s.decisions.map(decisionCard).join('')}</div>`:'<div class="dc-center-calm"><b>XI bastante alineado.</b><span>No necesitamos convertir puestos estables en debates artificiales.</span></div>'}</section><section class="dc-center-guide"><div class="dc-center-subhead"><div><span>2 · CONSTRUYE</span><h3>${esc(s.guide?.label||'XI guía')}</h3></div><small>${esc(diffText(s))}</small></div>${xiGroups(s.guide)}<div class="dc-center-guide-actions"><button type="button" data-dc-center-apply ${!s.guide||s.readiness.isClosed?'disabled':''}>Probar XI guía</button><small>No guarda nada automáticamente. Solo carga el borrador para que tú decidas.</small></div></section><section class="dc-center-close"><div><span>3 · CIERRA</span><h3>${esc(action.label)}</h3><p>${esc(s.readiness.message||'Revisa y guarda cuando estés conforme.')}</p></div><button type="button" class="primary" data-dc-center-next="${esc(action.kind)}" ${action.kind==='ready'?'disabled':''}>${esc(action.label)}</button></section><details class="dc-center-advanced" ${s.mode==='advanced'?'open':''}><summary><span>ANÁLISIS AVANZADO</span><b>${s.mode==='focused'?'Mostrar herramientas':'Ocultar herramientas'}</b></summary><p>Estabilidad, Mesa de decisiones, Coach, Escenarios, Síntesis, Auditorías y Control de cierre siguen intactos. El Centro solo cambia la jerarquía visual.</p><div><button type="button" data-dc-center-mode="${s.mode==='focused'?'advanced':'focused'}">${s.mode==='focused'?'Ver todos los módulos':'Volver al modo esencial'}</button><button type="button" data-dc-center-open="decisionBoard">Mesa de decisiones</button><button type="button" data-dc-center-open="decisionCoach">Coach</button><button type="button" data-dc-center-open="scenarioLab">Escenarios</button><button type="button" data-dc-center-open="consensusXI">XI síntesis</button></div></details>`;
}
function openDuel(a,b){safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;safe(()=>renderCompare());return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function openPlayer(name){safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}if(typeof window.openPlayerHub==='function'){window.openPlayerHub(name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function openModule(id){if(mode()!=='advanced')setMode('advanced');setTimeout(()=>document.getElementById(id)?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)}
function applyGuide(){const s=state();if(!s?.guide?.xi||s.readiness.isClosed||typeof setPredictionXI!=='function')return;setPredictionXI(s.guide.xi);const first=defs().find(d=>document.getElementById(`pred_${d.key}`));document.getElementById(`pred_${first?.key}`)?.dispatchEvent(new Event('change',{bubbles:true}));document.dispatchEvent(new CustomEvent('rm-prediction-draft-updated',{detail:{scenario:'decision-center-guide'}}));setTimeout(refreshRelated,70);safe(()=>toast('XI guía cargado · sin guardar'))}
function refreshRelated(){safe(()=>window.RMPredictionPro?.render?.());safe(()=>window.RMXIStability?.render?.());safe(()=>window.RMDecisionBoard?.render?.());safe(()=>window.RMDecisionCoach?.render?.());safe(()=>window.RMPredictionReadiness?.render?.());render()}
function saveNow(){if(typeof window.savePrediction!=='function')return;Promise.resolve(window.savePrediction()).finally(()=>setTimeout(refreshRelated,180))}
function next(kind){if(kind==='pitch'){document.getElementById('predictionPitch')?.scrollIntoView?.({behavior:'smooth',block:'center'});return}if(kind==='save'){saveNow();return}if(kind==='review'){window.RMPredictionReadiness?.markReviewed?.();setTimeout(render,80);return}if(kind==='official'){const target=document.getElementById('officialXiReview');if(target)target.scrollIntoView?.({behavior:'smooth',block:'start'});else safe(()=>showSection('partido'))}}
function bind(root){
  root.querySelectorAll('[data-dc-center-duel]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.dcCenterDuel.split('|');openDuel(a,c)}));
  root.querySelectorAll('[data-dc-center-player]').forEach(b=>b.addEventListener('click',()=>openPlayer(b.dataset.dcCenterPlayer)));
  root.querySelector('[data-dc-center-apply]')?.addEventListener('click',applyGuide);
  root.querySelector('[data-dc-center-next]')?.addEventListener('click',e=>next(e.currentTarget.dataset.dcCenterNext));
  root.querySelector('[data-dc-center-mode]')?.addEventListener('click',e=>setMode(e.currentTarget.dataset.dcCenterMode));
  root.querySelectorAll('[data-dc-center-open]').forEach(b=>b.addEventListener('click',()=>openModule(b.dataset.dcCenterOpen)));
}
function render(){const s=state();if(!s)return false;applyMode();const root=ensure();if(!root)return false;root.innerHTML=html(s);bind(root);document.dispatchEvent(new CustomEvent('rm-decision-center-rendered',{detail:{mode:s.mode,decisions:s.decisions.length,strong:s.board.counts?.strong||0,guide:s.guide?.source||null,diff:s.diff?.count??null,status:s.readiness.status}}));return true}
function install(){
  if(installed)return;if(!window.RMDecisionBoard||!window.RMPredictionReadiness||!window.RMConsensusXI||!document.getElementById('prediccion')){if(++attempts<140)setTimeout(install,100);return}
  installed=true;applyMode();render();
  ['rm-decision-board-rendered','rm-prediction-readiness-rendered','rm-consensus-xi-rendered','rm-decision-coach-rendered','rm-local-prediction-updated','rm-prediction-draft-updated','rm-current-match-idea-updated','rm-community-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,90)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,30)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  window.RMDecisionCenter=Object.freeze({render,state,setMode,applyGuide});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
