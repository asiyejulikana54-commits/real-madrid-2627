(()=>{
const MATCH_HISTORY=[
  {id:'malaga',label:'Málaga',short:'MÁL',comp:'LaLiga'},
  {id:'real-sociedad',label:'Real Sociedad',short:'RSO',comp:'LaLiga'},
  {id:'espanyol',label:'Espanyol',short:'ESP',comp:'LaLiga'},
  {id:'betis',label:'Betis',short:'BET',comp:'LaLiga'},
  {id:'inter',label:'Inter',short:'INT',comp:'Champions'}
];

// Serie histórica recuperada con valores explícitamente confirmados en el proyecto.
// Se mantiene una sola fuente por punto para no mezclar metodologías: FotMob.
// Los huecos se dejan como null en vez de estimarlos.
const FOTMOB_HISTORY={
  malaga:{
    'Bellingham':8.8,'Mbappé':8.7,'Trent Alexander-Arnold':8.5,'Vini Jr.':8.3,
    'Camavinga':7.8,'Cucurella':7.7,'Huijsen':7.5,'Diomande':6.6
  },
  'real-sociedad':{
    'Mbappé':9.8,'Bellingham':9.0,'Vini Jr.':8.6,'Arda Güler':8.2,'Valverde':8.1,'Huijsen':7.8
  },
  espanyol:{
    'Arda Güler':8.6,'Bellingham':8.3,'Valverde':8.1,'Konaté':7.7,'Mbappé':7.4,'Diomande':6.0
  },
  betis:{
    'Vini Jr.':7.8,'Arda Güler':7.5,'Huijsen':7.5,'Bellingham':7.4,'Cucurella':6.8,
    'Mbappé':6.7,'Courtois':6.7,'Valverde':6.6,'Konaté':6.6,'Dumfries':6.6,'Camavinga':6.1
  },
  inter:{}
};

// Minutos exactos que pueden reconstruirse de las tablas acumuladas ya aceptadas del proyecto.
// Los tres primeros partidos permanecen pendientes salvo datos explícitos recuperados.
const MINUTES_HISTORY={
  malaga:{'Diomande':25},
  'real-sociedad':{},
  espanyol:{},
  betis:{
    'Courtois':90,'Huijsen':90,'Mbappé':90,'Vini Jr.':90,'Bellingham':90,'Konaté':90,'Cucurella':90,
    'Valverde':82,'Dumfries':64,'Arda Güler':64,'Camavinga':64,'Bernardo Silva':26,
    'Trent Alexander-Arnold':26,'Diomande':26,'Carlos Espí':8,'Álvaro Carreras':2,
    'Rüdiger':0,'Brahim Díaz':0,'Lunin':0
  },
  inter:{
    'Courtois':90,'Huijsen':90,'Mbappé':90,'Valverde':90,'Bellingham':90,'Konaté':90,'Dumfries':90,
    'Cucurella':88,'Vini Jr.':87,'Trent Alexander-Arnold':79,'Brahim Díaz':79,
    'Diomande':11,'Tchouaméni':11,'Álvaro Carreras':3,'Arda Güler':0,'Camavinga':0,
    'Bernardo Silva':0,'Carlos Espí':0,'Rüdiger':0,'Lunin':0
  }
};

function hEsc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function knownRating(player,matchId){return FOTMOB_HISTORY[matchId]?.[player]??null}
function knownMinutes(player,matchId){return Object.prototype.hasOwnProperty.call(MINUTES_HISTORY[matchId]||{},player)?MINUTES_HISTORY[matchId][player]:null}
function mvpInfoFor(data,matchId,player){
  const match=data?.matches?.find(m=>m.id===matchId);if(!match)return null;
  const idx=(match.ranking||[]).findIndex(r=>r.player===player);
  if(idx<0)return {rank:null,percentage:0,count:0,total:match.totalVotes||0};
  const row=match.ranking[idx];return {rank:idx+1,percentage:row.percentage,count:row.count,total:match.totalVotes||0};
}
function seasonMvpFor(data,player){return data?.season?.find(x=>x.player===player)||{wins:0,votes:0}}

function chartSvg(player){
  const points=MATCH_HISTORY.map((m,i)=>({i,m,value:knownRating(player,m.id)})).filter(x=>x.value!==null);
  if(points.length<2)return '<div class="history-empty-chart">La gráfica aparecerá cuando haya al menos dos notas históricas confirmadas para este jugador.</div>';
  const W=620,H=230,left=38,right=20,top=20,bottom=42,plotW=W-left-right,plotH=H-top-bottom;
  const x=i=>left+(i/(MATCH_HISTORY.length-1))*plotW;
  const y=v=>top+((10-v)/5)*plotH;
  const path=points.map((p,j)=>`${j?'L':'M'} ${x(p.i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const grid=[5,6,7,8,9,10].map(v=>`<g><line x1="${left}" x2="${W-right}" y1="${y(v)}" y2="${y(v)}" class="history-gridline"/><text x="${left-8}" y="${y(v)+4}" text-anchor="end" class="history-axis">${v}</text></g>`).join('');
  const labels=MATCH_HISTORY.map((m,i)=>`<text x="${x(i)}" y="${H-13}" text-anchor="middle" class="history-axis">${m.short}</text>`).join('');
  const dots=points.map(p=>`<g><circle cx="${x(p.i)}" cy="${y(p.value)}" r="6" class="history-dot"><title>${hEsc(p.m.label)} · ${p.value.toFixed(1)}</title></circle><text x="${x(p.i)}" y="${y(p.value)-12}" text-anchor="middle" class="history-value">${p.value.toFixed(1)}</text></g>`).join('');
  return `<div class="history-chart-wrap"><svg class="history-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución de notas FotMob de ${hEsc(player)}">${grid}${labels}<path d="${path}" class="history-line"/>${dots}</svg></div>`;
}

function historyRows(player,mvpData){
  return MATCH_HISTORY.map(m=>{
    const rating=knownRating(player,m.id),minutes=knownMinutes(player,m.id),mvp=mvpInfoFor(mvpData,m.id,player);
    const played=minutes===0?'No jugó':minutes!==null?`${minutes}'`:'—';
    const mvpHtml=!mvp||!mvp.total?'<span class="history-muted">Sin votos</span>':mvp.rank?`<b>#${mvp.rank}</b> · ${mvp.percentage}% <small>(${mvp.count}/${mvp.total})</small>`:'<span class="history-muted">0%</span>';
    return `<div class="history-match-row">
      <div class="history-match"><b>${hEsc(m.label)}</b><small>${hEsc(m.comp)}</small></div>
      <div><span class="history-mobile-label">Min.</span><b>${played}</b></div>
      <div><span class="history-mobile-label">Nota</span>${rating!==null?`<strong>${rating.toFixed(1)}</strong>`:'<span class="history-pending">Pendiente</span>'}</div>
      <div><span class="history-mobile-label">MVP com.</span>${mvpHtml}</div>
    </div>`;
  }).join('');
}

async function fetchMvpData(){
  try{
    const pid=typeof getParticipantId==='function'?getParticipantId():'';
    const r=await fetch(`/.netlify/functions/mvp?participantId=${encodeURIComponent(pid)}`,{headers:{accept:'application/json'}});
    if(!r.ok)return null;return await r.json();
  }catch{return null}
}

async function renderHistory(player){
  const content=document.getElementById('playerHubContent');if(!content)return;
  let block=document.getElementById('playerPerformanceHistory');
  if(!block){block=document.createElement('section');block.id='playerPerformanceHistory';block.className='player-history';content.appendChild(block)}
  const p=players.find(x=>x.name===player);const metric=p?metricFor(p):null;const aggregate=metric?currentRating(metric):null;
  const confirmedRatings=MATCH_HISTORY.filter(m=>knownRating(player,m.id)!==null).length;
  const confirmedMinutes=MATCH_HISTORY.filter(m=>knownMinutes(player,m.id)!==null).length;
  block.innerHTML=`<div class="history-loading">Cargando historial y MVP de la comunidad…</div>`;
  const mvpData=await fetchMvpData();
  // La ficha puede haberse cambiado mientras llegaba la petición.
  const heading=document.querySelector('#playerHubContent .player-sheet-head h2')?.textContent?.trim();if(heading!==player)return;
  const seasonMvp=seasonMvpFor(mvpData,player);
  block.innerHTML=`
    <div class="history-title"><div><div class="eyebrow">EVOLUCIÓN 26/27</div><h3>Historial partido a partido</h3><p>La media acumulada de arriba sigue siendo la oficial del panel. Esta curva histórica usa solo notas FotMob recuperadas y confirmadas; no rellenamos huecos por estimación.</p></div><div class="history-season-mvp"><span>MVP comunidad</span><b>${seasonMvp.wins||0} 🏆</b><small>${seasonMvp.votes||0} voto${seasonMvp.votes===1?'':'s'}</small></div></div>
    <div class="history-summary">
      <div><span>Media acumulada</span><b>${aggregate!==null?aggregate.toFixed(2):'—'}</b><small>Panel · 3 fuentes</small></div>
      <div><span>Notas históricas</span><b>${confirmedRatings}/5</b><small>FotMob confirmadas</small></div>
      <div><span>Minutos por partido</span><b>${confirmedMinutes}/5</b><small>Exactos recuperados</small></div>
      <div><span>Minutos totales</span><b>${metric?metric.minutes:'—'}</b><small>Acumulado actual</small></div>
    </div>
    <div class="history-chart-card"><div class="history-chart-head"><b>Evolución de nota</b><span>Fuente histórica: FotMob</span></div>${chartSvg(player)}</div>
    <div class="history-table-card">
      <div class="history-table-head"><span>Partido</span><span>Min.</span><span>Nota</span><span>MVP comunidad</span></div>
      ${historyRows(player,mvpData)}
    </div>
    <div class="history-integrity"><b>Datos sin rellenar artificialmente.</b><span>Los guiones y “Pendiente” indican que ese dato de partido todavía no está confirmado en nuestra base histórica. Cuando lo recuperemos, la gráfica y la tabla se actualizarán sin cambiar la metodología del acumulado.</span></div>`;
}

function install(){
  if(typeof openPlayerHub!=='function'||!document.getElementById('playerHubModal')){setTimeout(install,100);return}
  if(window.__rmHistoryInstalled)return;window.__rmHistoryInstalled=true;
  const base=openPlayerHub;
  openPlayerHub=function(name){base(name);renderHistory(name)};
  // Si la ficha ya estaba abierta al cargar este módulo, intenta completarla.
  const current=document.querySelector('#playerHubModal.open #playerHubContent .player-sheet-head h2')?.textContent?.trim();if(current)renderHistory(current);
}
install();
})();
