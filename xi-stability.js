(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function userXi(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function ensureSemantics(){if(window.RMLineupSemantics||document.querySelector('script[data-lineup-semantics]'))return;const script=document.createElement('script');script.src='lineup-semantics.js?v=1';script.dataset.lineupSemantics='1';document.body.appendChild(script)}
function state(){
  const api=window.RMRoundImpact;if(!api?.snapshot||!api?.selectionPressure||!api?.signalFor||!window.RMLineupSemantics)return null;
  const snap=safe(()=>api.snapshot(),null);if(!snap)return null;
  const selection=safe(()=>api.selectionPressure(snap),null);if(!selection)return null;
  const mine=userXi(),projectXi=Object.fromEntries((selection.slots||[]).map(slot=>[slot.key,slot.name||''])),semantic=safe(()=>window.RMLineupSemantics.compare(projectXi,mine),null);
  const rows=(selection.slots||[]).map(slot=>{
    const current=slot.name,key=canonical(current),pressure=(selection.pressure||[]).find(r=>canonical(r.p?.name)===key)||null;
    const challenger=(selection.challengers||[]).filter(r=>canonical(r.occupant)===key).sort((a,b)=>(b.challengeScore||0)-(a.challengeScore||0))[0]||pressure?.challenger||null;
    const reinforced=(selection.reinforced||[]).find(r=>canonical(r.p?.name)===key)||null,sig=safe(()=>api.signalFor(current,snap),null);
    let level='stable',label='ESTABLE',detail='Sin presión fuerte detectada por los datos recientes.';
    if(pressure&&challenger&&(challenger.challengeScore||0)>=.35){level='risk';label='DEBATE FUERTE';detail=`${display(challenger.p.name)} está empujando con una señal competitiva clara.`}
    else if(pressure){level='risk';label='BAJO PRESIÓN';detail=challenger?`${display(challenger.p.name)} aparece como alternativa directa.`:'Sus señales recientes han perdido fuerza.'}
    else if(reinforced&&sig?.confidence>=.65&&sig?.momentum>=.28){level='strong';label='RESPALDADO';detail='Power, forma y muestra reciente refuerzan su presencia en nuestra idea.'}
    else if(challenger&&(challenger.challengeScore||0)>=.12){level='watch';label='VIGILAR';detail=`${display(challenger.p.name)} gana opciones, aunque todavía no fuerza el cambio.`}
    const sem=semantic?.bySlot?.[slot.key]||null,mineName=sem?.user||mine?.[slot.key]||'',changed=Boolean(sem?.changed??(mineName&&canonical(mineName)!==key));
    return {slot,current,pressure,challenger,reinforced,sig,level,label,detail,mineName,changed,semantic:sem};
  });
  const counts=rows.reduce((a,r)=>(a[r.level]=(a[r.level]||0)+1,a),{strong:0,stable:0,watch:0,risk:0}),changed=rows.filter(r=>r.changed).length;
  return {snap,selection,rows,counts,changed,semantic};
}
function card(row){
  const rival=row.challenger?.p?.name||'',action=rival?`data-xs-duel="${esc(row.current)}|${esc(rival)}"`:`data-xs-player="${esc(row.current)}"`;
  const mine=row.changed?`<div class="xs-mine"><span>TU CAMBIO REAL</span><b>${esc(display(row.mineName))}</b></div>`:'';
  const compare=row.changed?`<button type="button" class="xs-compare" data-xs-duel="${esc(row.current)}|${esc(row.mineName)}">${esc(display(row.current))} vs ${esc(display(row.mineName))} →</button>`:'';
  const support=Number.isFinite(row.sig?.confidence)?`Respaldo ${row.sig.confidence>=.76?'alto':row.sig.confidence>=.52?'medio':'bajo'}`:'Respaldo limitado';
  return `<article class="xs-slot ${row.level}"><button type="button" class="xs-main" ${action}><div class="xs-slot-head"><span>${esc(row.slot.label||row.slot.role||row.slot.key)}</span><em>${esc(row.label)}</em></div><b>${esc(display(row.current))}</b><small>${esc(row.detail)}</small><i>${esc(support)}</i></button>${mine}${compare}</article>`;
}
function html(s){
  const open=s.counts.risk+s.counts.watch;
  return `<div class="xs-head"><div><span>MAPA DE ESTABILIDAD DEL XI</span><h3>Dónde está firme nuestra propuesta y dónde hay debate</h3><p>Semáforo de los 11 puestos usando las mismas señales de Power, forma, última nota y competencia directa. Los puestos equivalentes como los dos DFC o los dos MC se comparan como grupo: intercambiarlos no cuenta como cambio.</p></div><div class="xs-summary"><b>${open}</b><small>puestos a vigilar</small></div></div><div class="xs-kpis"><div class="strong"><span>Respaldados</span><b>${s.counts.strong}</b></div><div><span>Estables</span><b>${s.counts.stable}</b></div><div class="watch"><span>Vigilar</span><b>${s.counts.watch}</b></div><div class="risk"><span>Debate / presión</span><b>${s.counts.risk}</b></div></div>${s.changed?`<div class="xs-user-note"><b>Tu XI introduce ${s.changed} cambio${s.changed===1?'':'s'} real${s.changed===1?'':'es'} de jugador o rol respecto a nuestra propuesta.</b><span>Los simples intercambios dentro del mismo rol no se contabilizan.</span></div>`:''}<div class="xs-grid">${s.rows.map(card).join('')}</div><p class="xs-note">Interpretación: <b>Respaldado</b> exige señal positiva y muestra suficiente; <b>Estable</b> significa que no vemos presión fuerte; <b>Vigilar</b> indica un rival creciendo; <b>Debate fuerte / Bajo presión</b> señala competencia directa o deterioro reciente.</p>`;
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('xiStability');if(root)return root;
  root=document.createElement('section');root.id='xiStability';root.className='card xs-shell';const anchor=document.getElementById('predictionAnalytics')||document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function ensureMatchday(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('xiStabilityMatchday');if(root)return root;
  root=document.createElement('section');root.id='xiStabilityMatchday';root.className='card xs-compact';const anchor=document.getElementById('roundImpactMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function openPlayer(name){safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}if(typeof window.openPlayerHub==='function'){window.openPlayerHub(name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function openDuel(a,b){safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;safe(()=>renderCompare());return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function bind(root){if(!root)return;root.querySelectorAll('[data-xs-player]').forEach(b=>b.addEventListener('click',()=>openPlayer(b.dataset.xsPlayer)));root.querySelectorAll('[data-xs-duel]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.xsDuel.split('|');openDuel(a,c)}))}
function render(){
  const s=state();if(!s)return;
  const p=ensurePrediction();if(p){p.innerHTML=html(s);bind(p)}
  const m=ensureMatchday();if(m){const open=s.counts.risk+s.counts.watch;m.innerHTML=`<div><span>ESTABILIDAD DE NUESTRA PROPUESTA</span><b>${s.counts.strong+s.counts.stable}/11 sin alerta fuerte</b><small>${open?`${open} puesto${open===1?'':'s'} con debate o vigilancia`:'No detectamos debates fuertes por datos recientes'}${s.changed?` · tu XI cambia ${s.changed}`:''}</small></div><button type="button" class="btn" data-xs-go>Ver mapa completo</button>`;m.querySelector('[data-xs-go]')?.addEventListener('click',()=>safe(()=>showSection('prediccion')))}
  document.dispatchEvent(new CustomEvent('rm-xi-stability-rendered',{detail:{counts:s.counts,userChanges:s.changed,semanticChanges:s.semantic?.changes||[],open:s.rows.filter(r=>r.level==='risk'||r.level==='watch').map(r=>({slot:r.slot.key,player:r.current,status:r.label,challenger:r.challenger?.p?.name||null}))}}));
}
function install(){
  if(installed)return;ensureSemantics();if(!window.RMRoundImpact||!window.RMLineupSemantics||!document.getElementById('prediccion')){if(++attempts<80)setTimeout(install,100);return}
  installed=true;render();
  ['rm-round-impact-rendered','rm-lineup-semantics-ready','rm-current-match-idea-updated','rm-prediction-analytics-updated','rm-local-prediction-updated','rm-season-data-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,40)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});
  window.RMXIStability=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
