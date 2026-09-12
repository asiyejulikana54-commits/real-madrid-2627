(()=>{
const STORAGE='rm_stats_pro_v2_state';
let installed=false,attempts=0;
const defaults={query:'',position:'ALL',competition:'ALL',horizon:'ALL',minMinutes:0,sort:'rating',direction:'auto',compareA:'',compareB:''};
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function loadState(){try{return {...defaults,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return {...defaults}}}
const state=loadState();
function saveState(){try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}}
function season(){return window.RMSeasonData||null}
function allMatches(){return safe(()=>season()?.matches||[],[])||[]}
function selectedMatches(){
  let rows=allMatches();if(state.competition!=='ALL')rows=rows.filter(m=>m.comp===state.competition);
  if(state.horizon!=='ALL'){const n=Math.max(1,Number(state.horizon)||1);rows=rows.slice(-n)}
  return rows;
}
function playerWindow(name){
  const sd=season(),matches=selectedMatches(),series=[];let totalMinutes=0,ratedMinutes=0,totalPoints=0,ratedMatches=0,completeMatches=0,appearances=0,unrated=0;
  for(const match of matches){
    const min=Number(sd?.minutes?.(match.id,name))||0;if(min<=0)continue;appearances++;totalMinutes+=min;
    const entry=sd?.officialRatingEntry?.(match.id,name);
    if(entry&&Number.isFinite(entry.value)){const points=entry.value*min/90;ratedMinutes+=min;totalPoints+=points;ratedMatches++;if(entry.sourceCount===3)completeMatches++;series.push({match,value:entry.value,minutes:min,entry})}
    else if(entry?.status==='unrated')unrated++;
  }
  const values=series.map(x=>x.value),rating=ratedMinutes?totalPoints*90/ratedMinutes:null,recentValues=values.slice(-3),recent=recentValues.length?recentValues.reduce((a,b)=>a+b,0)/recentValues.length:null;
  const delta=values.length>=2?values.at(-1)-values.at(-2):null,mean=values.length?values.reduce((a,b)=>a+b,0)/values.length:null,stability=values.length>=2?Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length):null;
  const sample=Math.min(totalMinutes,450)/450,efficiency=totalPoints?totalMinutes/totalPoints:null,power=Number.isFinite(rating)?rating*(.75+.25*sample):null;
  const coverage=appearances?ratedMatches/appearances:null,participation=matches.length?appearances/matches.length:null;
  return {matches,series,totalMinutes,ratedMinutes,totalPoints,ratedMatches,completeMatches,appearances,unrated,rating,recent,delta,stability,sample,efficiency,power,coverage,participation};
}
function stabilityLabel(sd){if(!Number.isFinite(sd))return 'Sin muestra';return sd<=.25?'Muy estable':sd<=.45?'Estable':sd<=.70?'Variable':'Volátil'}
function baseRow(p){const w=playerWindow(p.name);return {p,...w,r:w.rating,minutes:w.totalMinutes,points:w.totalPoints,recentN:Math.min(3,w.series.length),stabilityLabel:stabilityLabel(w.stability)}}
function relativeContext(rows,target,key,{higher=true}={}){
  const group=rows.filter(row=>row.p.pos===target.p.pos&&Number.isFinite(row[key])),value=target[key];if(!Number.isFinite(value)||!group.length)return {rank:null,total:group.length,percentile:null};
  const better=group.filter(row=>higher?row[key]>value:row[key]<value).length,worse=group.filter(row=>higher?row[key]<value:row[key]>value).length;
  return {rank:better+1,total:group.length,percentile:group.length===1?100:Math.round(100*worse/(group.length-1))};
}
function signal(context){if(!Number.isFinite(context?.percentile))return 'Sin señal';if(context.total===1)return 'Único con dato';if(context.percentile>=75)return 'Top del grupo';if(context.percentile>=50)return 'Zona alta';if(context.percentile>=25)return 'Zona media';return 'Zona baja'}
function allRows(){
  const rows=safe(()=>players,[]).map(baseRow);
  return rows.map(row=>{const powerGroup=relativeContext(rows,row,'power'),ratingGroup=relativeContext(rows,row,'r'),efficiencyGroup=relativeContext(rows,row,'efficiency',{higher:false}),performance=Number.isFinite(powerGroup.percentile)?powerGroup:ratingGroup;return {...row,powerGroup,ratingGroup,efficiencyGroup,performancePercentile:performance.percentile,performanceRank:performance.rank,performanceTotal:performance.total,performanceSignal:signal(performance)}})
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
  participation:{label:'Participación',higher:true,get:r=>r.participation},
  stability:{label:'Estabilidad',higher:false,get:r=>r.stability}
};
function filtered(){
  const q=normalize(state.query),sort=SORTS[state.sort]||SORTS.rating;
  const rows=allRows().filter(r=>{if(state.position!=='ALL'&&r.p.pos!==state.position)return false;if(r.minutes<state.minMinutes)return false;if(q&&!normalize(`${r.p.name} ${r.p.short||''} ${r.p.role||''} ${(r.p.tags||[]).join(' ')}`).includes(q))return false;return true});
  return rows.sort((a,b)=>{const av=sort.get(a),bv=sort.get(b),af=Number.isFinite(av),bf=Number.isFinite(bv);if(af&&!bf)return -1;if(!af&&bf)return 1;if(!af&&!bf)return display(a.p.name).localeCompare(display(b.p.name),'es');const dir=state.direction==='asc'?1:state.direction==='desc'?-1:(sort.higher?-1:1),d=(av-bv)*dir;return d||b.minutes-a.minutes||display(a.p.name).localeCompare(display(b.p.name),'es')})
}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function pct(v){return Number.isFinite(v)?`${Math.round(v*100)}%`:'—'}
function sampleLabel(r){if(r.minutes<90)return 'Corta';if(r.minutes<270)return 'Media';return r.minutes<450?'Alta':'Completa'}
function trend(r){if(!Number.isFinite(r.delta))return '<span class="sp-trend neutral">—</span>';if(Math.abs(r.delta)<.05)return '<span class="sp-trend neutral">≈</span>';return `<span class="sp-trend ${r.delta>0?'up':'down'}">${r.delta>0?'▲':'▼'} ${Math.abs(r.delta).toFixed(2)}</span>`}
function leader(rows,key,higher=true){const available=rows.filter(r=>Number.isFinite(r[key]));if(!available.length)return null;return [...available].sort((a,b)=>higher?(b[key]-a[key]):(a[key]-b[key]))[0]}
function leadersHtml(rows){
  const items=[['Media',leader(rows,'r',true),'r'],['Power RM',leader(rows,'power',true),'power'],['Forma',leader(rows,'recent',true),'recent'],['Eficiencia',leader(rows,'efficiency',false),'efficiency']];
  return `<div class="sp-leaders">${items.map(([label,r,key])=>r?`<button data-sp-player="${esc(r.p.name)}"><span>${esc(label)}</span><b>${esc(display(r.p.name))}</b><strong>${fmt(r[key],2)}</strong><small>${key==='efficiency'?'min/punto':key==='recent'?`${r.recentN||'—'} partidos`:`${r.minutes} min`}</small></button>`:`<div><span>${esc(label)}</span><b>—</b><small>Sin datos</small></div>`).join('')}</div>`
}
function percentileHtml(r){if(!Number.isFinite(r.performancePercentile))return '<b>—</b><small>Sin dato comparable</small>';return `<b>P${r.performancePercentile}</b><small>${esc(r.performanceSignal)} · #${r.performanceRank}/${r.performanceTotal} ${esc(r.p.pos)}</small><i class="sp-percentile"><em style="width:${r.performancePercentile}%"></em></i>`}
function supportHtml(r){return `<b>${Math.round(r.sample*100)}%</b><small>${sampleLabel(r)} · cobertura ${pct(r.coverage)}</small><em class="sp-stability">${esc(r.stabilityLabel)}${Number.isFinite(r.stability)?` · σ ${r.stability.toFixed(2)}`:''}</em>`}
function seriesHtml(r){if(!r.series.length)return '<span class="sp-series-empty">—</span>';return `<span class="sp-series" title="${esc(r.series.map(x=>`${x.match.short||x.match.label}: ${x.value.toFixed(2)}`).join(' · '))}">${r.series.slice(-5).map(x=>`<i style="height:${Math.max(14,Math.min(100,((x.value-5)/5)*100))}%"></i>`).join('')}</span>`}
function rowHtml(r,index){return `<button class="sp-row" data-sp-player="${esc(r.p.name)}"><span class="sp-rank">${index+1}</span><span class="sp-player"><b>${esc(display(r.p.name))}</b><small>${esc(r.p.pos)} · ${esc(r.p.role||'')}</small></span><span><b>${fmt(r.r)}</b><small>Media</small></span><span><b>${fmt(r.power)}</b><small>Power</small></span><span><b>${fmt(r.recent)}</b><small>Forma</small>${trend(r)}</span><span><b>${r.minutes}</b><small>Min</small></span><span><b>${fmt(r.efficiency)}</b><small>Min/punto</small></span><span class="sp-context">${percentileHtml(r)}</span><span class="sp-support">${supportHtml(r)}</span><span>${seriesHtml(r)}<small>Serie</small></span></button>`}
function competitionOptions(){const comps=[...new Set(allMatches().map(m=>m.comp).filter(Boolean))];return `<option value="ALL">Todas las competiciones</option>${comps.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}`}
function controlsHtml(){return `<div class="sp-presets"><button data-sp-preset="all">Temporada completa</button><button data-sp-preset="last3">Últimos 3</button><button data-sp-preset="def270">Defensas · 270+ min</button><button data-sp-preset="attackform">Ataque · forma</button><button data-sp-reset>Restablecer</button></div><div class="sp-controls"><label class="sp-search"><span>⌕</span><input id="spQuery" placeholder="Buscar jugador…" value="${esc(state.query)}"></label><select id="spPosition"><option value="ALL">Todas las posiciones</option><option value="POR">Porteros</option><option value="DEF">Defensas</option><option value="MED">Centrocampistas</option><option value="ATA">Atacantes</option></select><select id="spCompetition">${competitionOptions()}</select><select id="spHorizon"><option value="ALL">Todo el periodo</option><option value="5">Últimos 5 partidos</option><option value="3">Últimos 3 partidos</option><option value="1">Último partido</option></select><select id="spSample"><option value="0">Toda la muestra</option><option value="90">90+ minutos</option><option value="180">180+ minutos</option><option value="270">270+ minutos</option></select><select id="spSort">${Object.entries(SORTS).map(([key,s])=>`<option value="${key}">Ordenar: ${esc(s.label)}</option>`).join('')}</select></div>`}
function windowLabel(){const matches=selectedMatches();if(!matches.length)return 'Sin partidos';const comp=state.competition==='ALL'?'todas las competiciones':state.competition,h=state.horizon==='ALL'?`${matches.length} jornadas`:`últimos ${matches.length}`;return `${h} · ${comp}`}
function groupLeader(rows){const available=rows.filter(r=>Number.isFinite(r.performancePercentile)&&Number.isFinite(r.power));if(!available.length)return null;return [...available].sort((a,b)=>b.performancePercentile-a.performancePercentile||b.power-a.power||b.minutes-a.minutes)[0]}
function insight(rows){
  const top=rows[0],bestForm=leader(rows,'recent',true),bestEff=leader(rows,'efficiency',false),relative=groupLeader(rows),sort=SORTS[state.sort]||SORTS.rating;
  if(!top)return `<div class="sp-empty"><b>No hay jugadores con estos filtros.</b><span>Prueba a ampliar periodo, reducir muestra mínima o quitar el filtro de posición.</span></div>`;
  return `<div class="sp-insight"><div><span>FILTRO ACTUAL</span><h3>${rows.length} jugador${rows.length===1?'':'es'} · ${esc(sort.label)}</h3><p><b>${esc(windowLabel())}</b>. ${esc(display(top.p.name))} encabeza la vista${Number.isFinite(sort.get(top))?` con ${sort.label==='Minutos'?Math.round(sort.get(top)):sort.label.includes('Percentil')?`P${Math.round(sort.get(top))}`:fmt(sort.get(top))}`:''}.</p>${relative?`<p>Mejor señal relativa: <b>${esc(display(relative.p.name))}</b> · P${relative.performancePercentile} entre ${esc(relative.p.pos)}.</p>`:''}</div><div><span>REFERENCIAS</span><p>${bestForm?`Mejor forma: <b>${esc(display(bestForm.p.name))}</b> · ${fmt(bestForm.recent)}`:'Forma sin datos suficientes.'}</p><p>${bestEff?`Mejor eficiencia: <b>${esc(display(bestEff.p.name))}</b> · ${fmt(bestEff.efficiency)} min/punto`:'Eficiencia sin datos.'}</p></div></div>`
}
function methodHtml(){return `<section class="sp-method"><div><span>VENTANA DINÁMICA</span><h3>El periodo sí recalcula las métricas</h3><p>Competición y últimos 1/3/5 partidos no son un filtro visual: vuelven a calcular media ponderada por minutos, aporte, Min/punto, Power RM, forma, estabilidad y percentiles con esa ventana.</p></div><div><span>RESPALDO</span><p><b>Muestra</b> = minutos hasta 450. <b>Cobertura</b> = apariciones con nota / apariciones jugadas. <b>Participación</b> = partidos con minutos / partidos de la ventana. SC no equivale a 0 y nunca se convierte en una nota ficticia.</p></div></section>`}
function compareHtml(rows){
  const options=rows.map(r=>`<option value="${esc(r.p.name)}">${esc(display(r.p.name))}</option>`).join('');
  const a=state.compareA&&rows.some(r=>canonical(r.p.name)===canonical(state.compareA))?state.compareA:rows[0]?.p.name||'',b=state.compareB&&rows.some(r=>canonical(r.p.name)===canonical(state.compareB))?state.compareB:rows.find(r=>!sameName(r.p.name,a))?.p.name||'';
  state.compareA=a;state.compareB=b;
  return `<div class="sp-quick-compare"><div><span>COMPARACIÓN RÁPIDA</span><b>Lleva cualquier duelo al Comparador PRO</b></div><select id="spCompareA">${options}</select><span>vs</span><select id="spCompareB">${options}</select><button type="button" id="spCompareGo" ${!a||!b||sameName(a,b)?'disabled':''}>Comparar</button></div>`
}
function sameName(a,b){return canonical(a)===canonical(b)}
function openCompare(){
  const a=state.compareA,b=state.compareB;if(!a||!b||sameName(a,b))return;
  safe(()=>showSection('comparador'));let tries=0;const run=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const sa=document.getElementById('compareA'),sb=document.getElementById('compareB');if(sa&&sb){sa.value=a;sb.value=b;sa.dispatchEvent(new Event('change',{bubbles:true}));sb.dispatchEvent(new Event('change',{bubbles:true}));return}if(++tries<24)setTimeout(run,100)};setTimeout(run,80)
}
function applyPreset(id){
  Object.assign(state,{query:'',position:'ALL',competition:'ALL',horizon:'ALL',minMinutes:0,sort:'rating',direction:'auto'});
  if(id==='last3'){state.horizon='3';state.sort='recent'}else if(id==='def270'){state.position='DEF';state.minMinutes=270;state.sort='power'}else if(id==='attackform'){state.position='ATA';state.horizon='3';state.sort='recent'}
  saveState();render()
}
function reset(){Object.assign(state,{...defaults});saveState();render()}
function ensureShell(){const section=document.getElementById('estadisticas');if(!section||document.getElementById('statsPro'))return;const shell=document.createElement('div');shell.id='statsPro';shell.className='stats-pro';const table=section.querySelector('.table-wrap');if(table)table.classList.add('sp-legacy-table');shell.innerHTML='<div id="spContent"></div>';const head=section.querySelector('.section-head');if(head)head.insertAdjacentElement('afterend',shell);else section.prepend(shell)}
function bind(root,rows){
  const pairs=[['spQuery','input','query'],['spPosition','change','position'],['spCompetition','change','competition'],['spHorizon','change','horizon'],['spSample','change','minMinutes'],['spSort','change','sort']];
  for(const [id,ev,key] of pairs){const el=root.querySelector(`#${id}`);if(!el)continue;if(key==='minMinutes')el.value=String(state.minMinutes);else el.value=String(state[key]);el.addEventListener(ev,e=>{state[key]=key==='minMinutes'?Number(e.target.value)||0:e.target.value;if(key==='sort')state.direction='auto';saveState();render()})}
  root.querySelectorAll('[data-sp-player]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>openPlayerHub(btn.dataset.spPlayer))));
  root.querySelectorAll('[data-sp-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.spPreset)));root.querySelector('[data-sp-reset]')?.addEventListener('click',reset);
  const a=root.querySelector('#spCompareA'),b=root.querySelector('#spCompareB');if(a)a.value=state.compareA;if(b)b.value=state.compareB;a?.addEventListener('change',e=>{state.compareA=e.target.value;saveState();render()});b?.addEventListener('change',e=>{state.compareB=e.target.value;saveState();render()});root.querySelector('#spCompareGo')?.addEventListener('click',openCompare)
}
function render(){
  ensureShell();const root=document.getElementById('spContent');if(!root)return;const rows=filtered();
  root.innerHTML=`${leadersHtml(rows)}${controlsHtml()}${insight(rows)}${compareHtml(rows)}${methodHtml()}<div class="sp-table"><div class="sp-head"><span>#</span><span>Jugador</span><span>Media</span><span>Power</span><span>Forma</span><span>Min</span><span>Min/punto</span><span>Señal grupo</span><span>Respaldo</span><span>Serie</span></div><div class="sp-body">${rows.length?rows.map(rowHtml).join(''):'<div class="sp-empty"><b>No hay resultados</b><span>Cambia los filtros para volver a ver jugadores.</span></div>'}</div></div><p class="sp-note">Power RM se recalcula con la ventana elegida y ajusta la media por muestra hasta 450 minutos. En Min/punto, menor es mejor. SC no equivale a 0. Percentil, muestra, cobertura, participación y estabilidad son lecturas separadas.</p>`;
  bind(root,rows);document.body.classList.add('stats-pro-ready');document.dispatchEvent(new CustomEvent('rm-stats-pro-rendered',{detail:{count:rows.length,sort:state.sort,position:state.position,minMinutes:state.minMinutes,competition:state.competition,horizon:state.horizon,matches:selectedMatches().map(m=>m.id)}}))
}
function install(){
  if(installed)return;if(!document.getElementById('estadisticas')||typeof players==='undefined'||!season()){if(++attempts<100)setTimeout(install,80);return}
  installed=true;render();['rm-season-data-ready','rm-season-extension-ready','rm-season-order-corrected'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,70)));window.RMStatsPro=Object.freeze({render,state,rows:filtered,reset,percentile:(name)=>{const row=allRows().find(r=>sameName(r.p.name,name)||sameName(r.p.short,name));return row?{value:row.performancePercentile,rank:row.performanceRank,total:row.performanceTotal,group:row.p.pos}:null}})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();