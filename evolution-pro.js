(()=>{
let installed=false;
const state={position:'ALL',sort:'momentum',minRated:1,query:''};
function season(){return window.RMSeasonData}
function matches(){return season()?.matches||[]}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function display(p){return p?.short||p?.name||'—'}
function playerList(){return typeof players==='undefined'?[]:players}
function avg(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}
function std(values){if(values.length<2)return null;const m=avg(values);return Math.sqrt(values.reduce((s,x)=>s+(x-m)*(x-m),0)/values.length)}
function ratingEntry(name,matchId){try{return season()?.officialRatingEntry?.(matchId,name)||null}catch{return null}}
function jornadaIndex(matchId){return matches().findIndex(m=>m.id===matchId)}
function jornadaLabel(match){const i=jornadaIndex(match?.id);return `${i>=0?`J${i+1} · `:''}${match?.short||match?.label||'—'}`}
function seriesFor(player){return matches().map((m,index)=>{const entry=ratingEntry(player.name,m.id);return {match:m,index,entry,value:Number.isFinite(entry?.value)?Number(entry.value):null}})}
function momentum(values){if(values.length>=4)return avg(values.slice(-2))-avg(values.slice(-4,-2));if(values.length>=2)return values.at(-1)-values.at(-2);return null}
function streak7(values){let n=0;for(let i=values.length-1;i>=0;i--){if(values[i]>=7)n++;else break}return n}
function statsFor(player){
  const series=seriesFor(player),rated=series.filter(x=>x.value!==null),values=rated.map(x=>x.value),latest=rated.at(-1)||null,previous=rated.at(-2)||null;
  const best=rated.length?[...rated].sort((a,b)=>b.value-a.value)[0]:null,worst=rated.length?[...rated].sort((a,b)=>a.value-b.value)[0]:null;
  return {player,series,rated,values,n:values.length,seasonAvg:avg(values),recentAvg:avg(values.slice(-3)),delta:latest&&previous?latest.value-previous.value:null,momentum:momentum(values),streak:streak7(values),consistency:std(values),best,worst,latest};
}
function allStats(){return playerList().map(statsFor).filter(x=>x.n>0)}
function strictPair(stat,fromIndex,toIndex){
  const a=stat.series[fromIndex],b=stat.series[toIndex];if(!a||!b||a.value===null||b.value===null)return null;return {prev:a,latest:b,delta:b.value-a.value};
}
function jornadaDelta(stat){const s=stat.series;if(s.length<2)return null;return strictPair(stat,s.length-2,s.length-1)}
function seasonDelta(stat){const s=stat.series;if(s.length<2)return null;return strictPair(stat,0,s.length-1)}
function signed(v,digits=2){if(v===null||!Number.isFinite(v))return '—';return `${v>0?'+':''}${v.toFixed(digits)}`}
function trendClass(v){return v===null?'flat':v>.049?'up':v<-.049?'down':'flat'}
function sortRows(rows){
  const copy=[...rows];
  if(state.sort==='recent')return copy.sort((a,b)=>(b.recentAvg??-99)-(a.recentAvg??-99)||b.n-a.n);
  if(state.sort==='season')return copy.sort((a,b)=>(b.seasonAvg??-99)-(a.seasonAvg??-99)||b.n-a.n);
  if(state.sort==='streak')return copy.sort((a,b)=>b.streak-a.streak||(b.recentAvg??-99)-(a.recentAvg??-99));
  return copy.sort((a,b)=>(b.momentum??-99)-(a.momentum??-99)||(b.recentAvg??-99)-(a.recentAvg??-99));
}
function sparkline(stat){
  const points=stat.series.map((x,i)=>({i,value:x.value,match:x.match})).filter(x=>x.value!==null);if(!points.length)return '<span class="ep-no-chart">Sin notas</span>';
  const W=132,H=38,pad=4,vals=points.map(x=>x.value),lo=Math.min(...vals),hi=Math.max(...vals),min=lo===hi?lo-.5:lo-.25,max=lo===hi?hi+.5:hi+.25;
  const x=i=>pad+(matches().length<=1?0:i*(W-pad*2)/(matches().length-1));
  const y=v=>H-pad-(v-min)*(H-pad*2)/(max-min||1);
  const d=points.map((p,j)=>`${j?'L':'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return `<svg class="ep-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ${esc(display(stat.player))}"><path class="ep-spark-line" d="${d}"/>${points.map(p=>`<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.5"><title>${esc(jornadaLabel(p.match))}: ${p.value.toFixed(2)}</title></circle>`).join('')}</svg>`;
}
function leaderCards(rows){
  const recent=[...rows].filter(x=>x.n>=2).sort((a,b)=>(b.recentAvg??-99)-(a.recentAvg??-99))[0]||null;
  const jornada=rows.map(x=>({stat:x,pair:jornadaDelta(x)})).filter(x=>x.pair);
  const rise=[...jornada].sort((a,b)=>b.pair.delta-a.pair.delta)[0]||null,fall=[...jornada].sort((a,b)=>a.pair.delta-b.pair.delta)[0]||null;
  const progress=rows.map(x=>({stat:x,pair:seasonDelta(x)})).filter(x=>x.pair).sort((a,b)=>b.pair.delta-a.pair.delta)[0]||null;
  const streak=[...rows].sort((a,b)=>b.streak-a.streak||(b.recentAvg??-99)-(a.recentAvg??-99))[0]||null;
  const stable=[...rows].filter(x=>x.n>=3&&x.consistency!==null).sort((a,b)=>a.consistency-b.consistency||(b.seasonAvg??-99)-(a.seasonAvg??-99))[0]||null;
  const card=(kicker,item,name,value,sub,kind='')=>`<button class="ep-leader ${kind}" ${item?`onclick="openPlayerHub('${name(item).replace(/'/g,"\\'")}')"`:''}><span>${kicker}</span><b>${item?esc(display(item.stat?.player||item.player)):'—'}</b><strong>${item?value(item):'—'}</strong><small>${item?sub(item):'Sin muestra suficiente'}</small></button>`;
  return `<div class="ep-leaders">${card('FORMA RECIENTE',recent,x=>x.player.name,x=>x.recentAvg.toFixed(2),x=>`Media de sus últimas ${Math.min(3,x.n)} notas`,'good')}${card('MAYOR SUBIDA',rise,x=>x.stat.player.name,x=>signed(x.pair.delta,1),x=>`${esc(jornadaLabel(x.pair.prev.match))} → ${esc(jornadaLabel(x.pair.latest.match))}`,'up')}${card('MAYOR BAJADA',fall,x=>x.stat.player.name,x=>signed(x.pair.delta,1),x=>`${esc(jornadaLabel(x.pair.prev.match))} → ${esc(jornadaLabel(x.pair.latest.match))}`,'down')}${card('PROGRESO TEMPORADA',progress,x=>x.stat.player.name,x=>signed(x.pair.delta,1),x=>`${esc(jornadaLabel(x.pair.prev.match))} → ${esc(jornadaLabel(x.pair.latest.match))}`,'up')}${card('RACHA 7+',streak,x=>x.player.name,x=>`${x.streak}`,x=>'Apariciones puntuadas consecutivas ≥ 7,0','gold')}${card('MÁS ESTABLE',stable,x=>x.player.name,x=>`±${x.consistency.toFixed(2)}`,x=>`${x.n} apariciones con nota`,'stable')}</div>`;
}
function journeySnapshot(rows,index){
  const match=matches()[index],rated=rows.map(stat=>({stat,row:stat.series[index]})).filter(x=>x.row&&x.row.value!==null),values=rated.map(x=>x.row.value),average=avg(values);
  const topValue=values.length?Math.max(...values):null,leaders=topValue===null?[]:rated.filter(x=>Math.abs(x.row.value-topValue)<.0001);
  const prev=index>0?rows.map(stat=>strictPair(stat,index-1,index)).filter(Boolean):[],mover=prev.length?[...prev].sort((a,b)=>b.delta-a.delta)[0]:null;
  return {match,index,rated,average,leaders,mover};
}
function journeyOverview(rows){
  const snaps=matches().map((_,i)=>journeySnapshot(rows,i));
  return `<section class="ep-journeys"><div class="ep-journeys-head"><div><div class="eyebrow">MAPA DE JORNADAS</div><h3>La temporada en el orden real</h3><p>Cada tarjeta usa la cronología oficial del proyecto. La media es la media simple de las notas oficiales publicadas en esa jornada.</p></div><span class="pill">${snaps.length} jornadas</span></div><div class="ep-journey-strip">${snaps.map(s=>{const leader=s.leaders[0],teamDelta=s.index>0&&snaps[s.index-1]?.average!==null&&s.average!==null?s.average-snaps[s.index-1].average:null;return `<article class="ep-journey-card ${s.index===snaps.length-1?'current':''}"><div class="ep-journey-id"><b>J${s.index+1}</b><span>${esc(s.match.short||s.match.label)}</span></div><h4>${esc(s.match.label)}</h4><div class="ep-journey-main"><span><small>Media notas</small><b>${s.average===null?'—':s.average.toFixed(2)}</b></span><span class="${trendClass(teamDelta)}"><small>Vs J${s.index||'—'}</small><b>${s.index===0?'Inicio':signed(teamDelta,2)}</b></span></div><button type="button" ${leader?`data-ep-journey-player="${esc(leader.stat.player.name)}"`:''} ${leader?'':'disabled'}><small>Mejor nota</small><b>${leader?`${esc(display(leader.stat.player))} · ${leader.row.value.toFixed(2)}`:'—'}</b>${s.leaders.length>1?`<em>Empate ×${s.leaders.length}</em>`:''}</button><div class="ep-journey-foot"><span>${s.rated.length} con nota</span><span>${s.mover&&s.index>0?`↑ ${esc(display(s.mover.latest?rows.find(r=>r.series[s.index]===s.mover.latest)?.player:null)||'Cambio')} ${signed(s.mover.delta,1)}`:'—'}</span></div></article>`}).join('')}</div></section>`;
}
function latestComparison(rows){
  const ms=matches();if(ms.length<2)return '';
  const prev=ms.at(-2),latest=ms.at(-1),comp=rows.map(stat=>({stat,pair:jornadaDelta(stat)})).filter(x=>x.pair).sort((a,b)=>b.pair.delta-a.pair.delta);
  return `<section class="card ep-jornada"><div class="ep-jornada-head"><div><div class="eyebrow">CAMBIO DE JORNADA · ESTRICTO</div><h3>${esc(jornadaLabel(prev))} → ${esc(jornadaLabel(latest))}</h3><p>Solo entran jugadores con nota oficial en ambas jornadas consecutivas. No se busca una nota anterior si faltó una de las dos.</p></div><span class="pill">${comp.length} comparables</span></div><div class="ep-jornada-list">${comp.length?comp.map(x=>`<button data-ep-jornada-player="${esc(x.stat.player.name)}"><span><b>${esc(display(x.stat.player))}</b><small>${x.stat.player.pos}</small></span><i>${x.pair.prev.value.toFixed(1)}</i><em>→</em><i>${x.pair.latest.value.toFixed(1)}</i><strong class="${trendClass(x.pair.delta)}">${signed(x.pair.delta,2)}</strong></button>`).join(''):'<div class="ep-empty">No hay jugadores con nota oficial en las dos últimas jornadas.</div>'}</div></section>`
}
function positionButtons(){return [['ALL','Todos'],['POR','POR'],['DEF','DEF'],['MED','MED'],['ATA','ATA']].map(([v,l])=>`<button class="${state.position===v?'active':''}" data-ep-pos="${v}">${l}</button>`).join('')}
function rowHtml(s){
  const cls=trendClass(s.momentum),best=s.best?`${s.best.value.toFixed(1)} · ${esc(jornadaLabel(s.best.match))}`:'—',worst=s.worst?`${s.worst.value.toFixed(1)} · ${esc(jornadaLabel(s.worst.match))}`:'—',seasonChange=seasonDelta(s);
  return `<button class="ep-player-row" data-ep-player="${esc(s.player.name)}"><div class="ep-player-id"><span>${esc(s.player.pos)}</span><b>${esc(display(s.player))}</b><small>${s.n}/${matches().length} jornadas con nota</small></div><div class="ep-chart">${sparkline(s)}</div><div class="ep-metric"><span>Forma</span><b>${s.recentAvg===null?'—':s.recentAvg.toFixed(2)}</b></div><div class="ep-metric ${cls}"><span>Momentum</span><b>${signed(s.momentum,2)}</b></div><div class="ep-metric"><span>Última</span><b>${s.latest?s.latest.value.toFixed(1):'—'}</b><small>${s.latest?esc(jornadaLabel(s.latest.match)):''}</small></div><div class="ep-extremes"><span><small>Máx.</small><b>${best}</b></span><span><small>Mín.</small><b>${worst}</b></span></div><div class="ep-streak ${trendClass(seasonChange?.delta??null)}"><span>J1→J${matches().length}</span><b>${seasonChange?signed(seasonChange.delta,1):'—'}</b><small>Racha 7+ · ${s.streak}</small></div><strong class="ep-open">›</strong></button>`;
}
function filteredRows(){
  const q=state.query.trim().toLocaleLowerCase('es');
  return sortRows(allStats().filter(s=>(state.position==='ALL'||s.player.pos===state.position)&&s.n>=state.minRated&&(!q||s.player.name.toLocaleLowerCase('es').includes(q)||(s.player.short||'').toLocaleLowerCase('es').includes(q))));
}
function sortName(){return state.sort==='recent'?'Forma reciente':state.sort==='season'?'Media de temporada':state.sort==='streak'?'Racha 7+':'Momentum'}
function sortValue(stat){if(state.sort==='recent')return stat.recentAvg===null?'—':stat.recentAvg.toFixed(2);if(state.sort==='season')return stat.seasonAvg===null?'—':stat.seasonAvg.toFixed(2);if(state.sort==='streak')return `${stat.streak}`;return signed(stat.momentum,2)}
function summaryText(rows){
  const current=rows[0];if(!current)return 'No hay jugadores con la muestra elegida.';
  return `${display(current.player)} encabeza el filtro de ${sortName()} con ${sortValue(current)}. SC no entra como 0 y no crea puntos falsos en la evolución.`;
}
function bodyHtml(){
  const all=allStats(),rows=filteredRows(),chronology=season()?.chronology;
  return `<div class="ep-shell"><div class="ep-title"><div><div class="eyebrow">EVOLUCIÓN PRO</div><h2>Quién sube, quién cae y cómo cambia cada jornada</h2><p>Forma, Momentum, rachas y cambios de calendario calculados sobre la cronología real de la temporada.</p></div><span class="pill">${matches().length} jornadas</span></div>${leaderCards(all)}${journeyOverview(all)}${latestComparison(all)}<div class="card ep-explorer"><div class="ep-controls"><div class="ep-pos">${positionButtons()}</div><input id="epSearch" class="input" value="${esc(state.query)}" placeholder="Buscar jugador…"><select id="epMin" class="select"><option value="1" ${state.minRated===1?'selected':''}>1+ notas</option><option value="2" ${state.minRated===2?'selected':''}>2+ notas</option><option value="3" ${state.minRated===3?'selected':''}>3+ notas</option></select><select id="epSort" class="select"><option value="momentum" ${state.sort==='momentum'?'selected':''}>Ordenar: Momentum</option><option value="recent" ${state.sort==='recent'?'selected':''}>Ordenar: Forma</option><option value="season" ${state.sort==='season'?'selected':''}>Ordenar: Media</option><option value="streak" ${state.sort==='streak'?'selected':''}>Ordenar: Racha 7+</option></select></div><div class="ep-reading"><b>LECTURA ACTUAL</b><span>${esc(summaryText(rows))}</span><small>Momentum usa las últimas notas disponibles: últimas 2 vs 2 anteriores; con menos muestra, última vs anterior. El bloque “Cambio de jornada” sí exige dos jornadas consecutivas del calendario.</small></div><div class="ep-list">${rows.length?rows.map(rowHtml).join(''):'<div class="ep-empty">No hay jugadores que cumplan estos filtros.</div>'}</div></div><div class="ep-integrity"><b>Cronología</b><span>${chronology?.corrected?esc(chronology.note):'Las jornadas se leen en el orden definido por RMSeasonData.'} <strong>SC no entra como 0</strong> y una ausencia tampoco. J1→J${matches().length} solo aparece cuando el jugador tiene nota oficial en ambos extremos.</span></div></div>`;
}
function bind(root){
  root.querySelectorAll('[data-ep-pos]').forEach(btn=>btn.onclick=()=>{state.position=btn.dataset.epPos;mount()});
  const search=root.querySelector('#epSearch');if(search)search.oninput=e=>{state.query=e.target.value;mount(false)};
  const min=root.querySelector('#epMin');if(min)min.onchange=e=>{state.minRated=Number(e.target.value)||1;mount()};
  const sort=root.querySelector('#epSort');if(sort)sort.onchange=e=>{state.sort=e.target.value;mount()};
  root.querySelectorAll('[data-ep-player]').forEach(btn=>btn.onclick=()=>window.openPlayerHub?.(btn.dataset.epPlayer));
  root.querySelectorAll('[data-ep-jornada-player],[data-ep-journey-player]').forEach(btn=>btn.onclick=()=>window.openPlayerHub?.(btn.dataset.epJornadaPlayer||btn.dataset.epJourneyPlayer));
}
function mount(preserveFocus=true){
  const section=document.getElementById('evolucion');if(!section||!season()||typeof players==='undefined')return;
  let root=document.getElementById('evolutionProMount');if(!root){root=document.createElement('div');root.id='evolutionProMount';const head=section.querySelector(':scope > .section-head');if(head)head.insertAdjacentElement('afterend',root);else section.prepend(root)}
  const active=document.activeElement?.id,selection=active==='epSearch'?{start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
  root.innerHTML=bodyHtml();bind(root);
  if(!preserveFocus&&active==='epSearch'){const input=root.querySelector('#epSearch');input?.focus({preventScroll:true});if(selection&&input?.setSelectionRange)input.setSelectionRange(selection.start,selection.end)}
  window.RMAccessibility?.refresh?.();
}
function hookBase(){
  if(window.__rmEvolutionProHooks)return;window.__rmEvolutionProHooks=true;
  const baseRender=window.renderEvolution;if(typeof baseRender==='function')window.renderEvolution=function(){const out=baseRender.apply(this,arguments);setTimeout(()=>mount(),0);return out};
  const baseSelect=window.selectEvolutionMatch;if(typeof baseSelect==='function')window.selectEvolutionMatch=function(){const out=baseSelect.apply(this,arguments);setTimeout(()=>mount(),0);return out};
}
function install(){
  if(installed)return;if(!season()||!document.getElementById('evolucion')||typeof window.renderEvolution!=='function'){setTimeout(install,100);return}
  installed=true;hookBase();mount();
  ['rm-season-data-ready','rm-season-order-corrected','rm-ranking-official-ready','rm-modules-ready'].forEach(name=>document.addEventListener(name,()=>setTimeout(mount,0)));
}
window.RMEvolutionPro=Object.freeze({render:mount,state:()=>({...state}),jornadaLabel,seasonDelta});
setTimeout(install,40);
})();