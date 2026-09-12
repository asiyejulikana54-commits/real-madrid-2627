(()=>{
let installed=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function data(){return window.RMSeasonData||null}
function playerRows(){return safe(()=>players,[])||[]}
function canonical(name){return safe(()=>data()?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function aggregateThrough(name,end){
  const d=data(),matches=d?.matches||[];if(!d||end<0)return {name:canonical(name),minutes:0,ratedMinutes:0,points:0,rating:null,minPerPoint:null,power:null};
  let minutes=0,ratedMinutes=0,points=0;
  for(const match of matches.slice(0,end+1)){
    const minute=safe(()=>d.minuteEntry(match.id,name),null),m=Number.isFinite(minute?.value)?Number(minute.value):0;if(m<=0)continue;
    minutes+=m;const rating=safe(()=>d.officialRatingEntry(match.id,name),null);if(!Number.isFinite(rating?.value))continue;
    ratedMinutes+=m;points+=Number(rating.value)*m/90;
  }
  const rating=ratedMinutes?points*90/ratedMinutes:null,minPerPoint=points?minutes/points:null,power=Number.isFinite(rating)?rating*(.75+.25*Math.min(minutes,450)/450):null;
  return {name:canonical(name),minutes,ratedMinutes,points,rating,minPerPoint,power};
}
function rankingThrough(end){
  return playerRows().map(p=>aggregateThrough(p.name,end)).filter(r=>Number.isFinite(r.power)).sort((a,b)=>b.power-a.power||b.minutes-a.minutes||display(a.name).localeCompare(display(b.name),'es')).map((r,i)=>({...r,rank:i+1}));
}
function latestRows(match){
  const d=data();if(!d||!match)return [];
  return playerRows().map(p=>{
    const entry=safe(()=>d.officialRatingEntry(match.id,p.name),null),minute=safe(()=>d.minuteEntry(match.id,p.name),null),minutes=Number.isFinite(minute?.value)?Number(minute.value):0;
    if(minutes<=0||!Number.isFinite(entry?.value))return null;
    return {name:p.name,rating:Number(entry.value),minutes,coverage:entry.sourceCount||0};
  }).filter(Boolean).sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes);
}
function formRows(match){
  const d=data();if(!d||!match)return [];
  return playerRows().map(p=>{const delta=safe(()=>d.ratingDelta(p.name),null);if(!delta||delta.currentMatch?.id!==match.id||!Number.isFinite(delta.delta))return null;return {name:p.name,delta:Number(delta.delta),current:Number(delta.current),previous:Number(delta.previous)};}).filter(Boolean).sort((a,b)=>b.delta-a.delta);
}
function snapshot(){
  const d=data(),matches=d?.matches||[];if(!d||!matches.length)return null;
  const index=matches.length-1,match=matches[index],current=rankingThrough(index),previous=rankingThrough(index-1),previousMap=new Map(previous.map(r=>[canonical(r.name),r]));
  const movements=current.map(row=>{const prior=previousMap.get(canonical(row.name));return {...row,previousRank:prior?.rank??null,previousPower:prior?.power??null,rankDelta:prior?prior.rank-row.rank:null,powerDelta:prior&&Number.isFinite(prior.power)?row.power-prior.power:null,newEntry:!prior}});
  const movers=[...movements].filter(r=>r.previousRank!==null).sort((a,b)=>b.rankDelta-a.rankDelta||b.powerDelta-a.powerDelta),latest=latestRows(match),forms=formRows(match);
  const positiveMover=movers.find(r=>r.rankDelta>0)||[...movers].sort((a,b)=>b.powerDelta-a.powerDelta)[0]||null;
  return {match,index,current,previous,movements,movers,latest,forms,best:latest[0]||null,formUp:forms.find(r=>r.delta>0)||null,formDown:[...forms].reverse().find(r=>r.delta<0)||null,powerMover:positiveMover};
}
function movementText(row){
  if(row.newEntry)return '<span class="ri-new">NUEVO</span>';
  if(row.rankDelta>0)return `<span class="ri-up">↑ ${row.rankDelta}</span>`;
  if(row.rankDelta<0)return `<span class="ri-down">↓ ${Math.abs(row.rankDelta)}</span>`;
  return '<span class="ri-flat">=</span>';
}
function playerButton(row,extra=''){
  return `<button type="button" class="ri-player" data-ri-player="${esc(row.name)}"><span><b>${esc(display(row.name))}</b>${extra}</span><strong>#${row.rank}</strong>${movementText(row)}</button>`;
}
function ensureUi(){
  const home=document.getElementById('inicio');if(!home)return null;let root=document.getElementById('roundImpactHome');if(root)return root;
  root=document.createElement('section');root.id='roundImpactHome';root.className='card ri-shell';const anchor=home.querySelector('.grid.cols-4');if(anchor)anchor.insertAdjacentElement('afterend',root);else home.querySelector('.hero')?.insertAdjacentElement('afterend',root);return root;
}
function bind(root){
  root.querySelectorAll('[data-ri-player]').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.riPlayer;safe(()=>showSection('plantilla'));setTimeout(()=>safe(()=>openPlayerHub(name)),0)}));
  root.querySelector('[data-ri-go]')?.addEventListener('click',()=>{const target=document.getElementById('evolucion')?'evolucion':'estadisticas';safe(()=>showSection(target))});
}
function render(){
  const root=ensureUi();if(!root)return;const s=snapshot();if(!s){root.innerHTML='<div class="ri-empty">Esperando datos de temporada…</div>';return}
  const label=s.match.label||s.match.short||s.match.id,mover=s.powerMover,up=s.formUp,best=s.best;
  const movers=[...s.movements].sort((a,b)=>{const ad=a.newEntry?99:(a.rankDelta??-99),bd=b.newEntry?99:(b.rankDelta??-99);return bd-ad||(b.powerDelta??0)-(a.powerDelta??0)}).slice(0,5);
  const formTop=s.forms.filter(x=>Math.abs(x.delta)>=.05).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,5);
  root.innerHTML=`<div class="ri-head"><div><span>DESDE EL ÚLTIMO PARTIDO</span><h2>Qué cambió tras ${esc(label)}</h2><p>Comparamos la temporada justo antes y después de la última jornada: rendimiento del partido, forma y movimiento real en Power RM.</p></div><button class="btn" type="button" data-ri-go="1">Ver evolución</button></div><div class="ri-kpis"><article><span>MEJOR NOTA</span><b>${best?esc(display(best.name)):'—'}</b><strong>${best?best.rating.toFixed(2):'—'}</strong><small>${best?`${best.minutes}' · ${best.coverage}/3 fuentes`:'Sin nota oficial'}</small></article><article><span>MAYOR IMPULSO POWER</span><b>${mover?esc(display(mover.name)):'—'}</b><strong>${mover?(mover.rankDelta>0?`↑ ${mover.rankDelta} puestos`:`${mover.powerDelta>=0?'+':''}${mover.powerDelta.toFixed(2)}`):'—'}</strong><small>${mover&&mover.previousRank?`#${mover.previousRank} → #${mover.rank}`:'Sin comparación previa'}</small></article><article><span>FORMA QUE MÁS SUBE</span><b>${up?esc(display(up.name)):'—'}</b><strong>${up?`+${up.delta.toFixed(2)}`:'—'}</strong><small>${up?`${up.previous.toFixed(2)} → ${up.current.toFixed(2)}`:'Sin subida en la última nota'}</small></article></div><div class="ri-grid"><section><div class="ri-title"><span>POWER RM</span><h3>Movimientos de jerarquía</h3><small>Ranking acumulado antes → después de ${esc(label)}</small></div><div class="ri-list">${movers.length?movers.map(r=>playerButton(r,`<small>${Number.isFinite(r.powerDelta)?`${r.powerDelta>=0?'+':''}${r.powerDelta.toFixed(2)} Power`:'Primera muestra'}</small>`)).join(''):'<div class="ri-empty">Sin movimientos todavía.</div>'}</div></section><section><div class="ri-title"><span>FORMA</span><h3>Quién cambia de tendencia</h3><small>Diferencia entre sus dos últimas notas oficiales</small></div><div class="ri-form">${formTop.length?formTop.map(r=>`<button type="button" data-ri-player="${esc(r.name)}"><span><b>${esc(display(r.name))}</b><small>${r.previous.toFixed(2)} → ${r.current.toFixed(2)}</small></span><strong class="${r.delta>0?'up':'down'}">${r.delta>0?'+':''}${r.delta.toFixed(2)}</strong></button>`).join(''):'<div class="ri-empty">Aún no hay cambios de forma comparables.</div>'}</div></section></div><p class="ri-note">Power RM combina media y tamaño de muestra; el movimiento de puesto compara exactamente el ranking acumulado anterior con el actual. La forma es otra lectura distinta: solo compara las dos últimas apariciones con nota.</p>`;
  bind(root);document.dispatchEvent(new CustomEvent('rm-round-impact-rendered',{detail:{match:s.match.id,best:s.best?.name||null,powerMover:s.powerMover?.name||null,formUp:s.formUp?.name||null}}));
}
function install(){
  if(installed)return;if(!data()||!document.getElementById('inicio')){setTimeout(install,100);return}
  installed=true;render();['rm-season-extension-ready','rm-ranking-official-ready','rm-season-order-corrected','rm-season-data-ready'].forEach(name=>document.addEventListener(name,render));
  window.RMRoundImpact=Object.freeze({render,snapshot});
}
install();
})();
