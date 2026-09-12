(()=>{
let installed=false;
const state={query:'',position:'ALL',minMinutes:0,sort:'rating',direction:'auto'};
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function rating(m){return m?safe(()=>currentRating(m),Number.isFinite(m.rating)?m.rating:null):null}
function recent(name){const r=safe(()=>window.RMSeasonData?.recentRating?.(name,3),null);return Number.isFinite(r?.value)?r:null}
function power(name,m,r){
  const c=canonical(name),official=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===c),null);
  if(Number.isFinite(official?.power))return official.power;
  return m&&Number.isFinite(r)?r*(.75+.25*Math.min(m.minutes||0,450)/450):null;
}
function delta(name){const d=safe(()=>window.RMSeasonData?.ratingDelta?.(name),null);return Number.isFinite(d?.delta)?d.delta:null}
function aggregate(name){return safe(()=>window.RMSeasonData?.aggregatePlayer?.(name),null)}
function scheduleCount(){return safe(()=>window.RMSeasonData?.matches?.length,0)||0}
function series(name){return safe(()=>window.RMSeasonData?.ratingSeries?.(name),[])||[]}
function stability(name){
  const values=series(name).map(row=>row.entry?.value).filter(Number.isFinite);
  if(values.length<2)return {sd:null,label:'Sin muestra'};
  const mean=values.reduce((s,v)=>s+v,0)/values.length;
  const sd=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
  return {sd,label:sd<=.25?'Muy estable':sd<=.45?'Estable':sd<=.70?'Variable':'Volátil'};
}
function baseRow(p){
  const m=metric(p),r=rating(m),form=recent(p.name),agg=aggregate(p.name),minutes=m?.minutes||agg?.totalMinutes||0,stable=stability(p.name),totalMatches=scheduleCount();
  return {p,m,r,power:power(p.name,m,r),recent:form?.value??null,recentN:form?.n||0,delta:delta(p.name),minutes,points:Number.isFinite(m?.points)?m.points:Number.isFinite(agg?.totalPoints)?agg.totalPoints:null,efficiency:Number.isFinite(m?.minPerPoint)?m.minPerPoint:Number.isFinite(agg?.minPerPoint)?agg.minPerPoint:null,sample:Math.min(minutes,450)/450,ratedMatches:agg?.ratedMatches??null,completeMatches:agg?.completeMatches??null,coverage:totalMatches&&Number.isFinite(agg?.ratedMatches)?agg.ratedMatches/totalMatches:null,stability:stable.sd,stabilityLabel:stable.label};
}
function relativeContext(rows,target,key,{higher=true}={}){
  const group=rows.filter(row=>row.p.pos===target.p.pos&&Number.isFinite(row[key]));
  const value=target[key];if(!Number.isFinite(value)||!group.length)return {rank:null,total:group.length,percentile:null};
  const better=group.filter(row=>higher?row[key]>value:row[key]<value).length;
  const worse=group.filter(row=>higher?row[key]<value:row[key]>value).length;
  return {rank:better+1,total:group.length,percentile:group.length===1?100:Math.round(100*worse/(group.length-1))};
}
function signal(context){
  if(!Number.isFinite(context?.percentile))return 'Sin señal';
  if(context.total===1)return 'Único con dato';
  if(context.percentile>=75)return 'Top del grupo';
  if(context.percentile>=50)return 'Zona alta';
  if(context.percentile>=25)return 'Zona media';
  return 'Zona baja';
}
function allRows(){
  const rows=safe(()=>players,[]).map(baseRow);
  return rows.map(row=>{
    const powerGroup=relativeContext(rows,row,'power'),ratingGroup=relativeContext(rows,row,'r'),efficiencyGroup=relativeContext(rows,row,'efficiency',{higher:false});
    const performance=Number.isFinite(powerGroup.percentile)?powerGroup:ratingGroup;
    return {...row,powerGroup,ratingGroup,efficiencyGroup,performancePercentile:performance.percentile,performanceRank:performance.rank,performanceTotal:performance.total,performanceSignal:signal(performance)};
  });
}
const SORTS={
  rating:{label:'Media',higher:true,get:r=>r.r},
  power:{label:'Power RM',higher:true,get:r=>r.power},
  group:{label:'Percentil de grupo',higher:true,get:r=>r.performancePercentile},
  recent:{label:'Forma reciente',higher:true,get:r=>r.recent},
  efficiency:{label:'Min / punto',higher:false,get:r=>r.efficiency},
  minutes:{label:'Minutos',higher:true,get:r=>r.minutes},
  points:{label:'Aporte',higher:true,get:r=>r.points},
  sample:{label:'Muestra',higher:true,get:r=>r.sample},
  coverage:{label:'Cobertura',higher:true,get:r=>r.coverage},
  stability:{label:'Estabilidad',higher:false,get:r=>r.stability}
};
function filtered(){
  const q=normalize(state.query),sort=SORTS[state.sort]||SORTS.rating;
  const rows=allRows().filter(r=>{
    if(state.position!=='ALL'&&r.p.pos!==state.position)return false;
    if(r.minutes<state.minMinutes)return false;
    if(q&&!normalize(`${r.p.name} ${r.p.short||''} ${r.p.role||''} ${(r.p.tags||[]).join(' ')}`).includes(q))return false;
    return true;
  });
  return rows.sort((a,b)=>{
    const av=sort.get(a),bv=sort.get(b),af=Number.isFinite(av),bf=Number.isFinite(bv);
    if(af&&!bf)return -1;if(!af&&bf)return 1;if(!af&&!bf)return display(a.p.name).localeCompare(display(b.p.name),'es');
    const dir=state.direction==='asc'?1:state.direction==='desc'?-1:(sort.higher?-1:1);
    const d=(av-bv)*dir;return d||b.minutes-a.minutes||display(a.p.name).localeCompare(display(b.p.name),'es');
  });
}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function sampleLabel(r){if(r.minutes<90)return 'Corta';if(r.minutes<270)return 'Media';return r.minutes<450?'Alta':'Completa'}
function coverageText(r){const total=scheduleCount();return Number.isFinite(r.ratedMatches)&&total?`${r.ratedMatches}/${total}`:'—'}
function trend(r){if(!Number.isFinite(r.delta))return '<span class="sp-trend neutral">—</span>';if(Math.abs(r.delta)<.05)return '<span class="sp-trend neutral">≈</span>';return `<span class="sp-trend ${r.delta>0?'up':'down'}">${r.delta>0?'▲':'▼'} ${Math.abs(r.delta).toFixed(2)}</span>`}
function leader(rows,key,higher=true){const available=rows.filter(r=>Number.isFinite(r[key]));if(!available.length)return null;return [...available].sort((a,b)=>higher?(b[key]-a[key]):(a[key]-b[key]))[0]}
function leadersHtml(rows){
  const items=[['Media',leader(rows,'r',true),'r'],['Power RM',leader(rows,'power',true),'power'],['Forma',leader(rows,'recent',true),'recent'],['Eficiencia',leader(rows,'efficiency',false),'efficiency']];
  return `<div class="sp-leaders">${items.map(([label,r,key])=>r?`<button data-sp-player="${esc(r.p.name)}"><span>${esc(label)}</span><b>${esc(display(r.p.name))}</b><strong>${fmt(r[key],2)}</strong><small>${key==='efficiency'?'min/punto':key==='recent'?`${r.recentN||'—'} partidos`:`${r.minutes} min`}</small></button>`:`<div><span>${esc(label)}</span><b>—</b><small>Sin datos</small></div>`).join('')}</div>`;
}
function percentileHtml(r){
  if(!Number.isFinite(r.performancePercentile))return '<b>—</b><small>Sin dato comparable</small>';
  return `<b>P${r.performancePercentile}</b><small>${esc(r.performanceSignal)} · #${r.performanceRank}/${r.performanceTotal} ${esc(r.p.pos)}</small><i class="sp-percentile"><em style="width:${r.performancePercentile}%"></em></i>`;
}
function supportHtml(r){
  return `<b>${Math.round(r.sample*100)}%</b><small>${sampleLabel(r)} · ${coverageText(r)} jornadas</small><em class="sp-stability">${esc(r.stabilityLabel)}${Number.isFinite(r.stability)?` · σ ${r.stability.toFixed(2)}`:''}</em>`;
}
function rowHtml(r,index){
  return `<button class="sp-row" data-sp-player="${esc(r.p.name)}"><span class="sp-rank">${index+1}</span><span class="sp-player"><b>${esc(display(r.p.name))}</b><small>${esc(r.p.pos)} · ${esc(r.p.role||'')}</small></span><span><b>${fmt(r.r)}</b><small>Media</small></span><span><b>${fmt(r.power)}</b><small>Power</small></span><span><b>${fmt(r.recent)}</b><small>Forma</small>${trend(r)}</span><span><b>${r.minutes}</b><small>Min</small></span><span><b>${fmt(r.efficiency)}</b><small>Min/punto</small></span><span class="sp-context">${percentileHtml(r)}</span><span class="sp-support">${supportHtml(r)}</span></button>`;
}
function controlsHtml(){
  return `<div class="sp-controls"><label class="sp-search"><span>⌕</span><input id="spQuery" placeholder="Buscar jugador…" value="${esc(state.query)}"></label><select id="spPosition"><option value="ALL">Todas las posiciones</option><option value="POR">Porteros</option><option value="DEF">Defensas</option><option value="MED">Centrocampistas</option><option value="ATA">Atacantes</option></select><select id="spSample"><option value="0">Toda la muestra</option><option value="90">90+ minutos</option><option value="180">180+ minutos</option><option value="270">270+ minutos</option></select><select id="spSort">${Object.entries(SORTS).map(([key,s])=>`<option value="${key}">Ordenar: ${esc(s.label)}</option>`).join('')}</select></div>`;
}
function groupLeader(rows){const available=rows.filter(r=>Number.isFinite(r.performancePercentile)&&Number.isFinite(r.power));if(!available.length)return null;return [...available].sort((a,b)=>b.performancePercentile-a.performancePercentile||b.power-a.power||b.minutes-a.minutes)[0]}
function insight(rows){
  const top=rows[0],bestForm=leader(rows,'recent',true),bestEff=leader(rows,'efficiency',false),relative=groupLeader(rows);
  if(!top)return '<div class="sp-empty"><b>No hay jugadores con estos filtros.</b><span>Prueba a reducir la muestra mínima o quitar el filtro de posición.</span></div>';
  const sort=SORTS[state.sort]||SORTS.rating;
  return `<div class="sp-insight"><div><span>FILTRO ACTUAL</span><h3>${rows.length} jugador${rows.length===1?'':'es'} · ${esc(sort.label)}</h3><p>${esc(display(top.p.name))} encabeza la vista actual${Number.isFinite(sort.get(top))?` con ${sort.label==='Minutos'?Math.round(sort.get(top)):sort.label.includes('Percentil')?`P${Math.round(sort.get(top))}`:fmt(sort.get(top))}`:''}.</p>${relative?`<p>Mejor señal relativa visible: <b>${esc(display(relative.p.name))}</b> · P${relative.performancePercentile} entre ${esc(relative.p.pos)}.</p>`:''}</div><div><span>REFERENCIAS</span><p>${bestForm?`Mejor forma reciente: <b>${esc(display(bestForm.p.name))}</b> · ${fmt(bestForm.recent)}`:'Forma reciente sin datos suficientes.'}</p><p>${bestEff?`Mejor eficiencia: <b>${esc(display(bestEff.p.name))}</b> · ${fmt(bestEff.efficiency)} min/punto`:'Eficiencia sin datos.'}</p></div></div>`;
}
function methodHtml(){return `<section class="sp-method"><div><span>LECTURA RELATIVA</span><h3>Percentil ≠ fiabilidad</h3><p>El percentil compara el rendimiento con jugadores del mismo grupo general (POR, DEF, MED o ATA) que sí tienen dato. P100 significa estar en el extremo superior de ese grupo para la señal usada; con grupos pequeños los saltos son más grandes.</p></div><div><span>RESPALDO</span><p><b>Muestra</b> = minutos hasta 450. <b>Cobertura</b> = jornadas con nota oficial. <b>Estabilidad</b> = dispersión de las notas disponibles. Estas tres señales se muestran aparte y nunca modifican el percentil.</p></div></section>`}
function ensureShell(){
  const section=document.getElementById('estadisticas');if(!section||document.getElementById('statsPro'))return;
  const shell=document.createElement('div');shell.id='statsPro';shell.className='stats-pro';const table=section.querySelector('.table-wrap');if(table)table.classList.add('sp-legacy-table');
  shell.innerHTML='<div id="spContent"></div>';const head=section.querySelector('.section-head');if(head)head.insertAdjacentElement('afterend',shell);else section.prepend(shell);
}
function bind(root){
  const q=root.querySelector('#spQuery'),pos=root.querySelector('#spPosition'),sample=root.querySelector('#spSample'),sort=root.querySelector('#spSort');
  if(pos)pos.value=state.position;if(sample)sample.value=String(state.minMinutes);if(sort)sort.value=state.sort;
  q?.addEventListener('input',e=>{state.query=e.target.value;render()});
  pos?.addEventListener('change',e=>{state.position=e.target.value;render()});
  sample?.addEventListener('change',e=>{state.minMinutes=Number(e.target.value)||0;render()});
  sort?.addEventListener('change',e=>{state.sort=e.target.value;state.direction='auto';render()});
  root.querySelectorAll('[data-sp-player]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>openPlayerHub(btn.dataset.spPlayer))));
}
function render(){
  ensureShell();const root=document.getElementById('spContent');if(!root)return;const rows=filtered();
  root.innerHTML=`${leadersHtml(rows)}${controlsHtml()}${insight(rows)}${methodHtml()}<div class="sp-table"><div class="sp-head"><span>#</span><span>Jugador</span><span>Media</span><span>Power</span><span>Forma</span><span>Min</span><span>Min/punto</span><span>Señal grupo</span><span>Respaldo</span></div><div class="sp-body">${rows.length?rows.map(rowHtml).join(''):'<div class="sp-empty"><b>No hay resultados</b><span>Cambia los filtros para volver a ver jugadores.</span></div>'}</div></div><p class="sp-note">Power RM ajusta la media por muestra hasta 450 minutos. En Min/punto, un valor menor es mejor. SC no equivale a 0: significa que una fuente comprobada no publicó nota. Percentil, muestra, cobertura y estabilidad son lecturas separadas.</p>`;
  bind(root);document.dispatchEvent(new CustomEvent('rm-stats-pro-rendered',{detail:{count:rows.length,sort:state.sort,position:state.position,minMinutes:state.minMinutes}}));
}
function install(){
  if(installed)return;if(!document.getElementById('estadisticas')||typeof players==='undefined'){setTimeout(install,80);return}
  installed=true;document.body.classList.add('stats-pro-ready');render();
  document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-season-order-corrected',render);
  window.RMStatsPro=Object.freeze({render,state,rows:filtered,percentile:(name)=>{const row=allRows().find(r=>r.p.name===name||r.p.short===name);return row?{value:row.performancePercentile,rank:row.performanceRank,total:row.performanceTotal,group:row.p.pos}:null}});
}
install();
})();