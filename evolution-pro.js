(()=>{
let installed=false;
const state={position:'ALL',sort:'momentum',minRated:1,query:''};
function season(){return window.RMSeasonData}
function matches(){return season()?.matches||[]}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function display(p){return p?.short||p?.name||'—'}
function avg(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}
function std(values){if(values.length<2)return null;const m=avg(values);return Math.sqrt(values.reduce((s,x)=>s+(x-m)*(x-m),0)/values.length)}
function ratingEntry(name,matchId){try{return season()?.officialRatingEntry?.(matchId,name)||null}catch{return null}}
function seriesFor(player){
  return matches().map(m=>{const entry=ratingEntry(player.name,m.id);return {match:m,entry,value:Number.isFinite(entry?.value)?Number(entry.value):null}});
}
function ratedFor(player){return seriesFor(player).filter(x=>x.value!==null)}
function momentum(values){
  if(values.length>=4)return avg(values.slice(-2))-avg(values.slice(-4,-2));
  if(values.length>=2)return values.at(-1)-values.at(-2);
  return null;
}
function streak7(values){let n=0;for(let i=values.length-1;i>=0;i--){if(values[i]>=7)n++;else break}return n}
function statsFor(player){
  const series=seriesFor(player),rated=series.filter(x=>x.value!==null),values=rated.map(x=>x.value),latest=rated.at(-1)||null,previous=rated.at(-2)||null;
  const best=rated.length?[...rated].sort((a,b)=>b.value-a.value)[0]:null,worst=rated.length?[...rated].sort((a,b)=>a.value-b.value)[0]:null;
  return {player,series,rated,values,n:values.length,seasonAvg:avg(values),recentAvg:avg(values.slice(-3)),delta:latest&&previous?latest.value-previous.value:null,momentum:momentum(values),streak:streak7(values),consistency:std(values),best,worst,latest};
}
function allStats(){return (window.players||[]).map(statsFor).filter(x=>x.n>0)}
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
  const points=stat.series.map((x,i)=>({i,value:x.value})).filter(x=>x.value!==null);if(!points.length)return '<span class="ep-no-chart">Sin notas</span>';
  const W=132,H=38,pad=4,vals=points.map(x=>x.value),lo=Math.min(...vals),hi=Math.max(...vals),min=lo===hi?lo-.5:lo-.25,max=lo===hi?hi+.5:hi+.25;
  const x=i=>pad+(matches().length<=1?0:i*(W-pad*2)/(matches().length-1));
  const y=v=>H-pad-(v-min)*(H-pad*2)/(max-min||1);
  const d=points.map((p,j)=>`${j?'L':'M'}${x(p.i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  return `<svg class="ep-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de ${esc(display(stat.player))}"><path class="ep-spark-line" d="${d}"/>${points.map(p=>`<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.5"/>`).join('')}</svg>`;
}
function leaderCards(rows){
  const recent=[...rows].filter(x=>x.n>=2).sort((a,b)=>(b.recentAvg??-99)-(a.recentAvg??-99))[0]||null;
  const rises=[...rows].filter(x=>x.delta!==null).sort((a,b)=>b.delta-a.delta)[0]||null;
  const streak=[...rows].sort((a,b)=>b.streak-a.streak||(b.recentAvg??-99)-(a.recentAvg??-99))[0]||null;
  const stable=[...rows].filter(x=>x.n>=3&&x.consistency!==null).sort((a,b)=>a.consistency-b.consistency||(b.seasonAvg??-99)-(a.seasonAvg??-99))[0]||null;
  const card=(kicker,item,value,sub,kind='')=>`<button class="ep-leader ${kind}" ${item?`onclick="openPlayerHub('${item.player.name.replace(/'/g,"\\'")}')"`:''}><span>${kicker}</span><b>${item?esc(display(item.player)):'—'}</b><strong>${item?value(item):'—'}</strong><small>${item?sub(item):'Sin muestra suficiente'}</small></button>`;
  return `<div class="ep-leaders">${card('FORMA RECIENTE',recent,x=>x.recentAvg.toFixed(2),x=>`Media de sus últimas ${Math.min(3,x.n)} notas`,'good')}${card('MAYOR SUBIDA',rises,x=>signed(x.delta,1),x=>'Última nota vs anterior',rises?.delta>=0?'up':'down')}${card('RACHA 7+',streak,x=>`${x.streak}`,x=>'Apariciones puntuadas consecutivas ≥ 7,0','gold')}${card('MÁS ESTABLE',stable,x=>`±${x.consistency.toFixed(2)}`,x=>`${x.n} apariciones con nota`,'stable')}</div>`;
}
function positionButtons(){return [['ALL','Todos'],['POR','POR'],['DEF','DEF'],['MED','MED'],['ATA','ATA']].map(([v,l])=>`<button class="${state.position===v?'active':''}" data-ep-pos="${v}">${l}</button>`).join('')}
function rowHtml(s){
  const cls=trendClass(s.momentum),best=s.best?`${s.best.value.toFixed(1)} · ${esc(s.best.match.short)}`:'—',worst=s.worst?`${s.worst.value.toFixed(1)} · ${esc(s.worst.match.short)}`:'—';
  return `<button class="ep-player-row" data-ep-player="${esc(s.player.name)}"><div class="ep-player-id"><span>${esc(s.player.pos)}</span><b>${esc(display(s.player))}</b><small>${s.n} nota${s.n===1?'':'s'}</small></div><div class="ep-chart">${sparkline(s)}</div><div class="ep-metric"><span>Forma</span><b>${s.recentAvg===null?'—':s.recentAvg.toFixed(2)}</b></div><div class="ep-metric ${cls}"><span>Momentum</span><b>${signed(s.momentum,2)}</b></div><div class="ep-metric"><span>Última</span><b>${s.latest?s.latest.value.toFixed(1):'—'}</b><small>${s.latest?esc(s.latest.match.short):''}</small></div><div class="ep-extremes"><span><small>Máx.</small><b>${best}</b></span><span><small>Mín.</small><b>${worst}</b></span></div><div class="ep-streak"><span>Racha 7+</span><b>${s.streak}</b></div><strong class="ep-open">›</strong></button>`;
}
function filteredRows(){
  const q=state.query.trim().toLocaleLowerCase('es');
  return sortRows(allStats().filter(s=>(state.position==='ALL'||s.player.pos===state.position)&&s.n>=state.minRated&&(!q||s.player.name.toLocaleLowerCase('es').includes(q)||(s.player.short||'').toLocaleLowerCase('es').includes(q))));
}
function summaryText(rows){
  const current=sortRows(rows)[0];if(!current)return 'No hay jugadores con la muestra elegida.';
  const direction=current.momentum===null?'sin tendencia calculable':current.momentum>.049?`con momentum ${signed(current.momentum,2)}`:current.momentum<-.049?`con momentum ${signed(current.momentum,2)}`:'estable en las últimas apariciones';
  return `${display(current.player)} encabeza el filtro de Momentum ${direction}. SC no entra como 0 y no altera estas curvas.`;
}
function bodyHtml(){
  const all=allStats(),rows=filteredRows();
  return `<div class="ep-shell"><div class="ep-title"><div><div class="eyebrow">EVOLUCIÓN PRO</div><h2>Quién sube, quién cae y quién sostiene el nivel</h2><p>Forma reciente, Momentum, rachas y extremos calculados solo con las notas oficiales combinadas.</p></div><span class="pill">${matches().length} jornadas</span></div>${leaderCards(all)}<div class="card ep-explorer"><div class="ep-controls"><div class="ep-pos">${positionButtons()}</div><input id="epSearch" class="input" value="${esc(state.query)}" placeholder="Buscar jugador…"><select id="epMin" class="select"><option value="1" ${state.minRated===1?'selected':''}>1+ notas</option><option value="2" ${state.minRated===2?'selected':''}>2+ notas</option><option value="3" ${state.minRated===3?'selected':''}>3+ notas</option></select><select id="epSort" class="select"><option value="momentum" ${state.sort==='momentum'?'selected':''}>Ordenar: Momentum</option><option value="recent" ${state.sort==='recent'?'selected':''}>Ordenar: Forma</option><option value="season" ${state.sort==='season'?'selected':''}>Ordenar: Media</option><option value="streak" ${state.sort==='streak'?'selected':''}>Ordenar: Racha 7+</option></select></div><div class="ep-reading"><b>LECTURA ACTUAL</b><span>${esc(summaryText(rows))}</span><small>Momentum: últimas 2 notas vs 2 anteriores; con menos muestra, última vs anterior. Racha 7+: apariciones puntuadas consecutivas con nota ≥ 7,0.</small></div><div class="ep-list">${rows.length?rows.map(rowHtml).join(''):'<div class="ep-empty">No hay jugadores que cumplan estos filtros.</div>'}</div></div><div class="ep-integrity"><b>Cómo leerlo</b><span>La curva enseña solo partidos con valoración. <strong>SC no es cero</strong>; simplemente no crea un punto en la serie. “Forma” es la media de hasta las 3 últimas notas y “Media” mantiene toda la temporada disponible.</span></div></div>`;
}
function bind(root){
  root.querySelectorAll('[data-ep-pos]').forEach(btn=>btn.onclick=()=>{state.position=btn.dataset.epPos;mount()});
  const search=root.querySelector('#epSearch');if(search)search.oninput=e=>{state.query=e.target.value;mount(false)};
  const min=root.querySelector('#epMin');if(min)min.onchange=e=>{state.minRated=Number(e.target.value)||1;mount()};
  const sort=root.querySelector('#epSort');if(sort)sort.onchange=e=>{state.sort=e.target.value;mount()};
  root.querySelectorAll('[data-ep-player]').forEach(btn=>btn.onclick=()=>window.openPlayerHub?.(btn.dataset.epPlayer));
}
function mount(preserveFocus=true){
  const section=document.getElementById('evolucion');if(!section||!season()||!Array.isArray(window.players))return;
  let root=document.getElementById('evolutionProMount');if(!root){root=document.createElement('div');root.id='evolutionProMount';const head=section.querySelector(':scope > .section-head');if(head)head.insertAdjacentElement('afterend',root);else section.prepend(root)}
  const active=document.activeElement?.id,selection=active==='epSearch'?{start:document.activeElement.selectionStart,end:document.activeElement.selectionEnd}:null;
  root.innerHTML=bodyHtml();bind(root);
  if(!preserveFocus&&active==='epSearch'){const input=root.querySelector('#epSearch');input?.focus({preventScroll:true});if(selection&&input?.setSelectionRange)input.setSelectionRange(selection.start,selection.end)}
}
function hookBase(){
  if(window.__rmEvolutionProHooks)return;window.__rmEvolutionProHooks=true;
  const baseRender=window.renderEvolution;if(typeof baseRender==='function')window.renderEvolution=function(){const out=baseRender.apply(this,arguments);setTimeout(()=>mount(),0);return out};
  const baseSelect=window.selectEvolutionMatch;if(typeof baseSelect==='function')window.selectEvolutionMatch=function(){const out=baseSelect.apply(this,arguments);setTimeout(()=>mount(),0);return out};
}
function install(){
  if(installed)return;if(!season()||!document.getElementById('evolucion')||typeof window.renderEvolution!=='function'){setTimeout(install,100);return}
  installed=true;hookBase();mount();
  ['rm-season-data-ready','rm-ranking-official-ready','rm-modules-ready'].forEach(name=>document.addEventListener(name,()=>setTimeout(mount,0)));
}
window.RMEvolutionPro=Object.freeze({render:mount,state:()=>({...state})});
setTimeout(install,40);
})();
