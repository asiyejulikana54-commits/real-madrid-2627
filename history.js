(()=>{
function season(){return window.RMSeasonData}
function matches(){return season()?.matches||[]}
function hEsc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function ratingEntry(player,matchId,includeReconstructed=false){return season()?.ratingEntry(matchId,player,{includeReconstructed})||null}
function minuteEntry(player,matchId,includeReconstructed=false){return season()?.minuteEntry(matchId,player,{includeReconstructed})||null}
function knownRating(player,matchId){return ratingEntry(player,matchId,false)?.value??null}
function mvpInfoFor(data,matchId,player){
  const match=data?.matches?.find(m=>m.id===matchId);if(!match)return null;
  const canonical=season()?.canonical(player)||player;const idx=(match.ranking||[]).findIndex(r=>(season()?.canonical(r.player)||r.player)===canonical);
  if(idx<0)return {rank:null,percentage:0,count:0,total:match.totalVotes||0};
  const row=match.ranking[idx];return {rank:idx+1,percentage:row.percentage,count:row.count,total:match.totalVotes||0};
}
function seasonMvpFor(data,player){
  const canonical=season()?.canonical(player)||player;
  return data?.season?.find(x=>(season()?.canonical(x.player)||x.player)===canonical)||{wins:0,votes:0};
}
function chartSvg(player){
  const history=matches();const points=history.map((m,i)=>({i,m,value:knownRating(player,m.id)})).filter(x=>x.value!==null);
  if(points.length<2)return '<div class="history-empty-chart">La gráfica aparecerá cuando haya al menos dos notas históricas confirmadas para este jugador.</div>';
  const W=620,H=230,left=38,right=20,top=20,bottom=42,plotW=W-left-right,plotH=H-top-bottom;
  const x=i=>left+(i/(Math.max(1,history.length-1)))*plotW;const y=v=>top+((10-v)/5)*plotH;
  const path=points.map((p,j)=>`${j?'L':'M'} ${x(p.i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const grid=[5,6,7,8,9,10].map(v=>`<g><line x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}" class="history-gridline"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end" class="history-axis">${v}</text></g>`).join('');
  const labels=history.map((m,i)=>`<text x="${x(i)}" y="${H-13}" text-anchor="middle" class="history-axis">${m.short}</text>`).join('');
  const dots=points.map(p=>`<g><circle cx="${x(p.i)}" cy="${y(p.value)}" r="6" class="history-dot"><title>${hEsc(p.m.label)} · ${p.value.toFixed(1)}</title></circle><text x="${x(p.i)}" y="${y(p.value)-12}" text-anchor="middle" class="history-value">${p.value.toFixed(1)}</text></g>`).join('');
  return `<div class="history-chart-wrap"><svg class="history-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de notas históricas confirmadas de ${hEsc(player)}">${grid}${labels}<path d="${path}" class="history-line"/>${dots}</svg></div>`;
}
function valueHtml(entry,type){
  if(!entry)return '<span class="history-pending">Pendiente</span>';
  const reconstructed=entry.status==='reconstructed';const value=type==='minutes'?(entry.value===0?'No jugó':`${reconstructed?'≈':''}${entry.value}'`):`${reconstructed?'≈':''}${entry.value.toFixed(1)}`;
  return `${type==='rating'?`<strong>${value}</strong>`:`<b>${value}</b>`}${reconstructed?'<small class="tag gold">Reconstruido</small>':''}`;
}
function historyRows(player,mvpData){
  return matches().map(m=>{
    const rating=ratingEntry(player,m.id,true),minutes=minuteEntry(player,m.id,true),mvp=mvpInfoFor(mvpData,m.id,player);
    const mvpHtml=!mvp||!mvp.total?'<span class="history-muted">Sin votos</span>':mvp.rank?`<b>#${mvp.rank}</b> · ${mvp.percentage}% <small>(${mvp.count}/${mvp.total})</small>`:'<span class="history-muted">0%</span>';
    return `<div class="history-match-row"><div class="history-match"><b>${hEsc(m.label)}</b><small>${hEsc(m.comp)}</small></div><div><span class="history-mobile-label">Min.</span>${valueHtml(minutes,'minutes')}</div><div><span class="history-mobile-label">Nota</span>${valueHtml(rating,'rating')}</div><div><span class="history-mobile-label">MVP com.</span>${mvpHtml}</div></div>`;
  }).join('');
}
async function fetchMvpData(){
  try{const pid=typeof getParticipantId==='function'?getParticipantId():'';const r=await fetch(`/.netlify/functions/mvp?participantId=${encodeURIComponent(pid)}`,{headers:{accept:'application/json'}});if(!r.ok)return null;return await r.json()}catch{return null}
}
async function renderHistory(player){
  const content=document.getElementById('playerHubContent');if(!content||!season())return;
  let block=document.getElementById('playerPerformanceHistory');if(!block){block=document.createElement('section');block.id='playerPerformanceHistory';block.className='player-history';content.appendChild(block)}
  block.dataset.player=player;
  const p=players.find(x=>x.name===player),metric=p?metricFor(p):null,aggregate=metric?currentRating(metric):null;
  const allRatings=matches().map(m=>ratingEntry(player,m.id,true)).filter(Boolean),confirmedRatings=allRatings.filter(x=>x.status==='confirmed').length,reconstructedRatings=allRatings.filter(x=>x.status==='reconstructed').length;
  const allMinutes=matches().map(m=>minuteEntry(player,m.id,true)).filter(Boolean),confirmedMinutes=allMinutes.filter(x=>x.status==='confirmed').length,reconstructedMinutes=allMinutes.filter(x=>x.status==='reconstructed').length;
  block.innerHTML='<div class="history-loading">Cargando historial y MVP de la comunidad…</div>';
  const mvpData=await fetchMvpData();if(!block.isConnected||block.dataset.player!==player)return;
  const seasonMvp=seasonMvpFor(mvpData,player);
  block.innerHTML=`
    <div class="history-title"><div><div class="eyebrow">EVOLUCIÓN 26/27</div><h3>Historial partido a partido</h3><p>La curva y la forma utilizan únicamente notas confirmadas. Los valores reconstruidos siguen visibles con ≈, pero no alteran rankings ni tendencias hasta que recuperemos su fuente.</p></div><div class="history-season-mvp"><span>MVP comunidad</span><b>${seasonMvp.wins||0} ★</b><small>${seasonMvp.votes||0} voto${seasonMvp.votes===1?'':'s'}</small></div></div>
    <div class="history-summary"><div><span>Media acumulada</span><b>${aggregate!==null?aggregate.toFixed(2):'—'}</b><small>Panel actual</small></div><div><span>Notas confirmadas</span><b>${confirmedRatings}/${matches().length}</b><small>${reconstructedRatings?`${reconstructedRatings} reconstruida${reconstructedRatings===1?'':'s'}`:'Sin reconstruidas'}</small></div><div><span>Minutos recuperados</span><b>${confirmedMinutes+reconstructedMinutes}/${matches().length}</b><small>${confirmedMinutes} confirmados · ${reconstructedMinutes} reconstruidos</small></div><div><span>Minutos totales</span><b>${metric?metric.minutes:'—'}</b><small>Acumulado actual</small></div></div>
    <div class="history-chart-card"><div class="history-chart-head"><b>Evolución de nota</b><span>Solo datos confirmados</span></div>${chartSvg(player)}</div>
    <div class="history-table-card"><div class="history-table-head"><span>Partido</span><span>Min.</span><span>Nota</span><span>MVP comunidad</span></div>${historyRows(player,mvpData)}</div>
    <div class="history-integrity"><b>Una única fuente interna.</b><span>Historial, Evolución, Radar, Jerarquías y Centro de Inteligencia leen ahora la misma base de temporada. “Reconstruido” significa que el valor existía en el proyecto pero aún falta comprobar su evidencia original.</span></div>`;
}
function install(){
  if(!season()||typeof openPlayerHub!=='function'||!document.getElementById('playerHubModal')){setTimeout(install,100);return}
  if(window.__rmHistoryInstalled)return;window.__rmHistoryInstalled=true;const base=openPlayerHub;
  openPlayerHub=function(name){base(name);renderHistory(name)};
}
install();
})();