(()=>{
const PREFIX='rm_prediction_review_v1_';
let installed=false,attempts=0,timer=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function prediction(){return safe(()=>window.RMPredictionPro?.state?.(),null)}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function reviewKey(){return PREFIX+(match()?.id||'current')}
function readReview(){try{return JSON.parse(localStorage.getItem(reviewKey())||'null')}catch{return null}}
function writeReview(value){try{localStorage.setItem(reviewKey(),JSON.stringify(value))}catch{}}
function orderedXi(xi){
  const keys=safe(()=>slots.map(s=>s[0]),Object.keys(xi||{}));
  return Object.fromEntries(keys.map(k=>[k,xi?.[k]||'']));
}
function fingerprint(p){if(!p?.data?.xi)return null;return JSON.stringify({savedAt:p.data.savedAt||'',xi:orderedXi(p.data.xi)});}
function deadlineState(){
  const m=match(),ts=m?new Date(m.deadline).getTime():NaN,now=Date.now();
  if(!Number.isFinite(ts))return {ts:null,closed:false,text:'Sin hora de cierre'};
  const diff=ts-now;if(diff<=0)return {ts,closed:true,text:'Cierre alcanzado'};
  const mins=Math.ceil(diff/60000),days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),rest=mins%60;
  const text=days?`${days}d ${hours}h`:hours?`${hours}h ${rest}m`:`${rest} min`;
  return {ts,closed:false,text};
}
function classifyChange(row){
  const user=row.user||row.mineName||'',primary=row.primary?.name||null,sources=row.primary?.sources||[];
  if(!row.userDiff||!user)return null;
  if(primary&&same(primary,user)){
    const external=sources.filter(s=>s!=='user');
    return {...row,user,kind:external.length?'supported':'solo',support:external};
  }
  if(primary&&!same(primary,user))return {...row,user,kind:'third',support:[]};
  return {...row,user,kind:'solo',support:[]};
}
function state(){
  const p=prediction();if(!p)return null;const b=board(),deadline=deadlineState(),fp=fingerprint(p),review=readReview(),reviewed=Boolean(fp&&review?.fingerprint===fp);
  const changes=(b?.rows||[]).map(classifyChange).filter(Boolean),supported=changes.filter(c=>c.kind==='supported'),solo=changes.filter(c=>c.kind==='solo'),third=changes.filter(c=>c.kind==='third');
  const strong=(b?.rows||[]).filter(r=>r.decisionLevel==='strong');
  const complete=Boolean(p.complete),savedClean=Boolean(complete&&p.data&&!p.dirty),isClosed=Boolean(p.isClosed||deadline.closed);
  let status='INCOMPLETA',tone='warn',message=`Faltan ${Math.max(0,11-(p.u?.length||0))} jugadores.`;
  if(isClosed){status='CERRADA';tone='closed';message='La ventana de predicción ya está cerrada.'}
  else if(complete&&p.dirty){status='SIN GUARDAR';tone='warn';message='Has cambiado el XI después del último guardado.'}
  else if(savedClean&&!reviewed){status='REVISIÓN FINAL';tone='review';message='El XI está guardado. Falta confirmar que has revisado los cambios.'}
  else if(savedClean&&reviewed){status='LISTA';tone='ready';message='XI guardado y revisión final completada.'}
  else if(complete&&!p.data){status='LISTA PARA GUARDAR';tone='review';message='El XI es válido, pero todavía no está guardado.'}
  return {p,b,deadline,fp,reviewed,changes,supported,solo,third,strong,complete,savedClean,isClosed,status,tone,message};
}
function sourceNames(list){return list.map(s=>s==='community'?'comunidad':s==='data'?'datos':'tu criterio').join(' + ')}
function changeCard(c){
  const slot=c.slot?.label||c.slot?.role||c.slot?.key||'Puesto';let tag='DECISIÓN TUYA',note='Tu elección es la única señal que empuja este cambio.';
  if(c.kind==='supported'){tag='CAMBIO RESPALDADO';note=`También lo apoyan ${sourceNames(c.support)}.`}
  else if(c.kind==='third'){tag='TERCERA VÍA';note=`La alternativa principal de la Mesa es ${display(c.primary?.name)}, no tu elección.`}
  return `<article class="pr-change ${c.kind}"><div><span>${esc(slot)}</span><em>${esc(tag)}</em></div><b>${esc(display(c.project))} → ${esc(display(c.user))}</b><small>${esc(note)}</small></article>`;
}
function check(label,ok,detail,kind='normal'){return `<div class="pr-check ${ok?'ok':'pending'} ${kind}"><i>${ok?'✓':'•'}</i><div><b>${esc(label)}</b><span>${esc(detail)}</span></div></div>`}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('predictionReadiness');if(root)return root;
  root=document.createElement('section');root.id='predictionReadiness';root.className='card pr-shell';const anchor=document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function ensureMatchday(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('predictionReadinessMatchday');if(root)return root;
  root=document.createElement('section');root.id='predictionReadinessMatchday';root.className='card pr-compact';const anchor=document.getElementById('decisionBoardMatchday')||document.getElementById('xiStabilityMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function restoreSaved(){
  const p=prediction();if(!p?.data?.xi||typeof setPredictionXI!=='function')return;setPredictionXI(p.data.xi);refreshRelated();render();safe(()=>toast('XI guardado restaurado'));
}
function saveNow(){
  if(typeof window.savePrediction!=='function')return;const result=window.savePrediction();Promise.resolve(result).finally(()=>setTimeout(()=>{refreshRelated();render()},180));
}
function markReviewed(){
  const s=state();if(!s?.savedClean||!s.fp||s.isClosed)return;writeReview({fingerprint:s.fp,reviewedAt:new Date().toISOString(),matchId:match()?.id||null});render();safe(()=>toast('Revisión final completada'));
}
function refreshRelated(){
  safe(()=>window.RMPredictionPro?.render?.());safe(()=>window.RMXIStability?.render?.());safe(()=>window.RMDecisionBoard?.render?.());safe(()=>window.RMDecisionActions?.render?.());
}
function scrollPitch(){document.getElementById('predictionPitch')?.scrollIntoView?.({behavior:'smooth',block:'center'})}
function scrollBoard(){document.getElementById('decisionBoard')?.scrollIntoView?.({behavior:'smooth',block:'start'})}
function html(s){
  const selected=s.p.u?.length||0,visible=s.changes.slice(0,4),saved=Boolean(s.p.data),clean=s.savedClean;
  const actions=[];
  if(!s.isClosed&&!s.complete)actions.push('<button type="button" data-pr-pitch>Completar XI</button>');
  if(!s.isClosed&&s.complete&&(!saved||s.p.dirty))actions.push('<button type="button" class="primary" data-pr-save>Guardar cambios</button>');
  if(!s.isClosed&&clean&&!s.reviewed)actions.push('<button type="button" class="primary" data-pr-review>Marcar revisión hecha</button>');
  if(!s.isClosed&&s.p.dirty&&saved)actions.push('<button type="button" data-pr-restore>Restaurar guardado</button>');
  actions.push('<button type="button" data-pr-board>Ver Mesa de decisiones</button>');
  return `<div class="pr-head"><div><span>CONTROL DE CIERRE</span><h3>Revisión final antes de bloquear tu XI</h3><p>No cambia ni publica nada por su cuenta. Solo comprueba que tu predicción esté completa, guardada y conscientemente revisada.</p></div><div class="pr-status ${s.tone}"><b>${esc(s.status)}</b><small>${s.isClosed?'Cierre completado':`Cierra en ${esc(s.deadline.text)}`}</small></div></div><div class="pr-checks">${check('XI completo',s.complete,`${selected}/11 jugadores únicos`)}${check('Cambios guardados',clean,clean?'El borrador coincide con tu último guardado':s.p.dirty?'Hay cambios posteriores al guardado':'Todavía no existe un XI guardado')}${check('Revisión final',s.reviewed,s.reviewed?'Confirmada para este guardado':'Se invalida automáticamente si vuelves a modificar el XI')}${check('Debates fuertes revisables',s.strong.length===0, s.strong.length?`${s.strong.length} debate${s.strong.length===1?'':'s'} fuerte${s.strong.length===1?'':'s'} en la Mesa`:'Sin debates fuertes detectados','debate')}</div><div class="pr-summary"><div><span>Tus cambios</span><b>${s.changes.length}</b></div><div class="supported"><span>Respaldados por otra señal</span><b>${s.supported.length}</b></div><div><span>Solo tu criterio</span><b>${s.solo.length}</b></div><div class="third"><span>Tercera vía</span><b>${s.third.length}</b></div></div>${visible.length?`<div class="pr-changes"><div class="pr-subhead"><b>Cambios que estás asumiendo</b><span>${s.changes.length>visible.length?`Mostramos 4 de ${s.changes.length}`:'Respecto a nuestra propuesta'}</span></div><div class="pr-change-grid">${visible.map(changeCard).join('')}</div></div>`:'<div class="pr-nochanges"><b>Tu XI coincide con nuestra propuesta.</b><span>No estás asumiendo ningún cambio respecto al escenario del proyecto.</span></div>'}<div class="pr-actions">${actions.join('')}</div><p class="pr-note">${esc(s.message)} “Respaldado” significa que, además de tu elección, datos o comunidad disponible empujan al mismo jugador; no es una probabilidad de titularidad.</p>`;
}
function bind(root){
  root?.querySelector('[data-pr-pitch]')?.addEventListener('click',scrollPitch);root?.querySelector('[data-pr-board]')?.addEventListener('click',scrollBoard);root?.querySelector('[data-pr-save]')?.addEventListener('click',saveNow);root?.querySelector('[data-pr-review]')?.addEventListener('click',markReviewed);root?.querySelector('[data-pr-restore]')?.addEventListener('click',restoreSaved);
}
function render(){
  const s=state();if(!s)return;const root=ensurePrediction();if(root){root.innerHTML=html(s);bind(root)}
  const compact=ensureMatchday();if(compact){compact.innerHTML=`<div><span>CONTROL DE CIERRE</span><b class="${esc(s.tone)}">${esc(s.status)}</b><small>${esc(s.message)}${!s.isClosed?` · ${esc(s.deadline.text)} para el cierre`:''}</small></div><button type="button" class="btn" data-pr-open>Revisar XI</button>`;compact.querySelector('[data-pr-open]')?.addEventListener('click',()=>{safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('predictionReadiness')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)})}
  document.dispatchEvent(new CustomEvent('rm-prediction-readiness-rendered',{detail:{status:s.status,complete:s.complete,saved:s.savedClean,reviewed:s.reviewed,changes:s.changes.length,supported:s.supported.length,third:s.third.length,strongDebates:s.strong.length}}));
  schedule();
}
function schedule(){clearTimeout(timer);const s=state();if(!s||s.isClosed)return;const delay=s.deadline.ts?Math.max(15000,Math.min(60000,s.deadline.ts-Date.now()+1000)):60000;timer=setTimeout(render,delay)}
function install(){
  if(installed)return;if(!window.RMPredictionPro||!window.RMDecisionBoard||!document.getElementById('prediccion')){if(++attempts<100)setTimeout(install,100);return}
  installed=true;render();
  ['rm-decision-board-rendered','rm-local-prediction-updated','rm-prediction-analytics-updated','rm-decision-actions-updated','rm-season-data-ready','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,60)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  window.RMPredictionReadiness=Object.freeze({render,state,markReviewed});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
