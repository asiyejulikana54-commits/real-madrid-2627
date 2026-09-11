(()=>{
const A_MATCHES=[
  {id:'malaga',label:'Málaga',short:'MÁL',comp:'LaLiga'},
  {id:'real-sociedad',label:'Real Sociedad',short:'RSO',comp:'LaLiga'},
  {id:'espanyol',label:'Espanyol',short:'ESP',comp:'LaLiga'},
  {id:'betis',label:'Betis',short:'BET',comp:'LaLiga'},
  {id:'inter',label:'Inter',short:'INT',comp:'Champions'}
];

// Histórico confirmado/reconstruido dentro del proyecto. Los huecos se muestran como pendientes.
// Esta serie histórica se mantiene separada de la media acumulada de 3 fuentes del panel.
const A_RATINGS={
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
const A_MINUTES={
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

const evolutionSection=['evolucion','↗','Evolución','Evolución y jornadas','Estadísticas partido a partido y cambios de jerarquía durante la temporada.'];
let insertAt=sections.findIndex(s=>s[0]==='power');insertAt=insertAt<0?sections.findIndex(s=>s[0]==='estadisticas'):insertAt;
if(!sections.some(s=>s[0]==='evolucion'))sections.splice(Math.max(0,insertAt+1),0,evolutionSection);

function aEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function aRating(player,matchId){return A_RATINGS[matchId]?.[player]??null}
function aMinutes(player,matchId){return Object.prototype.hasOwnProperty.call(A_MINUTES[matchId]||{},player)?A_MINUTES[matchId][player]:null}
function aPlayer(name){return players.find(p=>p.name===name)}
function aDisplay(name){const p=aPlayer(name);return p?(p.short||p.name):name}
function aAggregate(name){const p=aPlayer(name),m=p?metricFor(p):null;return {metric:m,rating:m?currentRating(m):null}}
function aKnownMatches(name,through=A_MATCHES.length-1){return A_MATCHES.slice(0,through+1).map(m=>({match:m,rating:aRating(name,m.id)})).filter(x=>x.rating!==null)}
function aFormRows(through){
  return players.map(p=>{
    const known=aKnownMatches(p.name,through);if(!known.length)return null;
    const avg=known.reduce((s,x)=>s+x.rating,0)/known.length;
    const last=known[known.length-1]?.rating??null;
    return {player:p,avg,last,n:known.length};
  }).filter(Boolean).sort((a,b)=>b.avg-a.avg||b.n-a.n||(a.player.short||a.player.name).localeCompare(b.player.short||b.player.name,'es'));
}
function aRankAt(name,through){const rows=aFormRows(through);const i=rows.findIndex(r=>r.player.name===name);return i<0?null:i+1}
function aMovement(name,through){
  const now=aRankAt(name,through);if(now===null||through===0)return {rank:now,delta:null};
  const prev=aRankAt(name,through-1);if(prev===null)return {rank:now,delta:'new'};
  return {rank:now,delta:prev-now};
}
function aMoveHtml(m){
  if(m.rank===null)return '<span class="a-pending">—</span>';
  if(m.delta==='new')return `<b>#${m.rank}</b> <span class="a-new">NUEVO</span>`;
  if(m.delta===null||m.delta===0)return `<b>#${m.rank}</b> <span class="a-flat">•</span>`;
  return `<b>#${m.rank}</b> <span class="${m.delta>0?'a-up':'a-down'}">${m.delta>0?'▲':'▼'} ${Math.abs(m.delta)}</span>`;
}
function ensureEvolutionSection(){
  if(document.getElementById('evolucion'))return;
  const section=document.createElement('section');section.id='evolucion';section.className='section';
  const power=document.getElementById('power')||document.getElementById('estadisticas');
  if(power)power.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';
  document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}

let selectedMatch='betis';
function matchKpis(matchId){
  const rated=players.map(p=>({p,r:aRating(p.name,matchId),m:aMinutes(p.name,matchId)})).filter(x=>x.r!==null);
  const minutesKnown=players.filter(p=>aMinutes(p.name,matchId)!==null).length;
  const best=[...rated].sort((a,b)=>b.r-a.r)[0]||null;
  const contributions=rated.filter(x=>x.m!==null&&x.m>0).map(x=>({...x,contrib:x.r*x.m/90})).sort((a,b)=>b.contrib-a.contrib);
  return {rated:rated.length,minutesKnown,best,contrib:contributions[0]||null};
}
function matchRows(matchId){
  return players.map(p=>{
    const r=aRating(p.name,matchId),m=aMinutes(p.name,matchId),contrib=r!==null&&m!==null&&m>0?r*m/90:null;
    return {p,r,m,contrib};
  }).sort((a,b)=>{
    if(a.r!==null&&b.r===null)return -1;if(a.r===null&&b.r!==null)return 1;
    if(a.r!==null&&b.r!==null&&b.r!==a.r)return b.r-a.r;
    if(a.m!==null&&b.m===null)return -1;if(a.m===null&&b.m!==null)return 1;
    return (a.p.short||a.p.name).localeCompare(b.p.short||b.p.name,'es');
  });
}
function dataState(row){
  if(row.r!==null&&row.m!==null)return '<span class="tag green">Completo</span>';
  if(row.r!==null||row.m!==null)return '<span class="tag gold">Parcial</span>';
  return '<span class="tag">Pendiente</span>';
}
function renderMatchStats(){
  const match=A_MATCHES.find(m=>m.id===selectedMatch)||A_MATCHES[0],k=matchKpis(match.id),through=A_MATCHES.findIndex(m=>m.id===match.id);
  const holder=document.getElementById('aMatchStats');if(!holder)return;
  holder.innerHTML=`
    <div class="a-match-kpis">
      <div class="card"><span>Notas confirmadas</span><b>${k.rated}/25</b><small>Histórico recuperado</small></div>
      <div class="card"><span>Minutos exactos</span><b>${k.minutesKnown}/25</b><small>Sin estimaciones</small></div>
      <div class="card"><span>Mejor nota</span><b>${k.best?aEsc(aDisplay(k.best.p.name)):'—'}</b><small>${k.best?k.best.r.toFixed(1):'Pendiente'}</small></div>
      <div class="card"><span>Mayor aporte</span><b>${k.contrib?aEsc(aDisplay(k.contrib.p.name)):'—'}</b><small>${k.contrib?k.contrib.contrib.toFixed(2):'Faltan minutos/notas'}</small></div>
    </div>
    <div class="card a-match-table-card">
      <div class="section-head" style="margin-top:0"><div><h2>Real Madrid · ${aEsc(match.label)}</h2><p>${aEsc(match.comp)} · nota histórica + minutos confirmados + aporte del partido.</p></div><span class="pill">Jerarquía hasta ${aEsc(match.short)}</span></div>
      <div class="a-table-wrap"><div class="a-table-head"><span>#</span><span>Jugador</span><span>Min.</span><span>Nota</span><span>Aporte</span><span>Forma</span><span>Dato</span></div>${matchRows(match.id).map((row,i)=>{const mv=aMovement(row.p.name,through);return `<button class="a-table-row" onclick="openPlayerHub('${row.p.name.replace(/'/g,"\\'")}')"><span>${i+1}</span><span class="a-name"><b>${aEsc(row.p.short||row.p.name)}</b><small>${row.p.pos}</small></span><span>${row.m===null?'—':row.m===0?'NJ':`${row.m}'`}</span><strong>${row.r===null?'—':row.r.toFixed(1)}</strong><span>${row.contrib===null?'—':row.contrib.toFixed(2)}</span><span>${aMoveHtml(mv)}</span><span>${dataState(row)}</span></button>`}).join('')}</div>
    </div>`;
}
function hierarchyCard(match,index){
  const top=aFormRows(index).slice(0,5);
  return `<button class="card a-timeline-card ${match.id===selectedMatch?'active':''}" onclick="selectEvolutionMatch('${match.id}')"><div class="a-timeline-title"><div><small>${aEsc(match.comp)}</small><b>${aEsc(match.short)}</b></div><span>${top.length} clasif.</span></div><div class="a-top5">${top.length?top.map((r,i)=>`<div><b>${i+1}</b><span>${aEsc(r.player.short||r.player.name)}</span><strong>${r.avg.toFixed(2)}</strong></div>`).join(''):'<p>Sin notas recuperadas</p>'}</div></button>`;
}
function movementPanel(){
  const through=A_MATCHES.findIndex(m=>m.id===selectedMatch),now=aFormRows(through),prev=through>0?aFormRows(through-1):[];
  const moves=now.map(r=>{const old=prev.findIndex(x=>x.player.name===r.player.name);return {...r,rank:now.findIndex(x=>x.player.name===r.player.name)+1,old:old<0?null:old+1,delta:old<0?null:(old+1)-(now.findIndex(x=>x.player.name===r.player.name)+1)}});
  const rises=moves.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,5),falls=moves.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,5),news=moves.filter(x=>x.old===null).slice(0,5);
  const list=(arr,type)=>arr.length?arr.map(x=>`<button onclick="openPlayerHub('${x.player.name.replace(/'/g,"\\'")}')"><span>${aEsc(x.player.short||x.player.name)}</span><b>#${x.rank}</b><strong class="${type}">${type==='a-up'?`▲ ${x.delta}`:type==='a-down'?`▼ ${Math.abs(x.delta)}`:'NUEVO'}</strong></button>`).join(''):'<div class="a-no-move">Sin cambios disponibles</div>';
  return `<div class="a-movement-grid"><div class="card"><h3>Mayores subidas</h3>${list(rises,'a-up')}</div><div class="card"><h3>Mayores bajadas</h3>${list(falls,'a-down')}</div><div class="card"><h3>Nuevos en ranking</h3>${list(news,'a-new')}</div></div>`;
}
function matrixHtml(){
  const current=phRows?phRows():[];
  const order=[...players].sort((a,b)=>{const ia=current.findIndex(r=>r.player.name===a.name),ib=current.findIndex(r=>r.player.name===b.name);if(ia>=0&&ib>=0)return ia-ib;if(ia>=0)return -1;if(ib>=0)return 1;return a.name.localeCompare(b.name,'es')});
  return `<div class="a-matrix"><div class="a-matrix-head"><span>Jugador</span>${A_MATCHES.map(m=>`<span>${m.short}</span>`).join('')}<span>Actual</span></div>${order.map(p=>{const agg=aAggregate(p.name);return `<button class="a-matrix-row" onclick="openPlayerHub('${p.name.replace(/'/g,"\\'")}')"><span><b>${aEsc(p.short||p.name)}</b><small>${p.pos}</small></span>${A_MATCHES.map(m=>{const r=aRating(p.name,m.id);return `<span class="${r===null?'empty':r>=8?'hot':r>=7?'good':'low'}">${r===null?'—':r.toFixed(1)}</span>`}).join('')}<strong>${agg.rating===null?'—':agg.rating.toFixed(2)}</strong></button>`}).join('')}</div>`;
}
function renderEvolution(){
  const section=document.getElementById('evolucion');if(!section)return;
  section.innerHTML=`
    <div class="section-head"><div><h2>Evolución de la temporada</h2><p>Conecta las jornadas, el rendimiento histórico y la jerarquía de forma sin mezclarlo con el Power Ranking acumulado.</p></div><span class="pill">5 partidos</span></div>
    <div class="card a-method"><div><div class="eyebrow">METODOLOGÍA</div><h3>Dos capas de datos, sin mezclarlas</h3><p><b>Actual:</b> media acumulada de 3 fuentes del panel. <b>Histórico:</b> notas partido a partido recuperadas y minutos exactos cuando constan. Los huecos permanecen pendientes.</p></div><div><b>Jerarquía de forma</b><span>Media simple de las notas históricas confirmadas hasta cada jornada.</span><small>Sirve para ver tendencia; no sustituye al Power RM.</small></div></div>
    <div class="a-match-tabs">${A_MATCHES.map(m=>`<button class="${m.id===selectedMatch?'active':''}" onclick="selectEvolutionMatch('${m.id}')"><span>${m.short}</span><small>${m.label}</small></button>`).join('')}</div>
    <div id="aMatchStats"></div>
    <div class="section-head"><div><h2>Cómo ha cambiado la jerarquía de forma</h2><p>Top 5 acumulado después de cada encuentro, usando solo notas históricas confirmadas.</p></div></div>
    <div class="a-timeline">${A_MATCHES.map(hierarchyCard).join('')}</div>
    <div id="aMovements">${movementPanel()}</div>
    <div class="card a-matrix-card"><div class="section-head" style="margin-top:0"><div><h2>Matriz de rendimiento</h2><p>Vista rápida de todas las notas históricas recuperadas. “Actual” es la media acumulada de 3 fuentes.</p></div></div>${matrixHtml()}</div>
    <div class="a-integrity"><b>Integridad de datos</b><span>La sección está preparada para quedar completa partido a partido. No se rellenan minutos ni notas ausentes por aproximación; al añadir datos confirmados, tablas, tendencias y fichas se recalculan automáticamente.</span></div>`;
  renderMatchStats();
}
window.selectEvolutionMatch=function(id){if(!A_MATCHES.some(m=>m.id===id))return;selectedMatch=id;renderEvolution()};

function playerTrajectory(name){
  return A_MATCHES.map((m,i)=>{const rank=aRankAt(name,i),known=aKnownMatches(name,i),avg=known.length?known.reduce((s,x)=>s+x.rating,0)/known.length:null;return {m,rank,avg,n:known.length,rating:aRating(name,m.id)}});
}
function playerTrajectoryHtml(name){
  const arr=playerTrajectory(name),known=arr.filter(x=>x.rank!==null),best=known.length?Math.min(...known.map(x=>x.rank)):null,last=known.at(-1)||null;
  return `<section class="a-player-trajectory" id="aPlayerTrajectory"><div class="a-player-title"><div><div class="eyebrow">JERARQUÍA DE FORMA</div><h3>Trayectoria en el ranking</h3><p>Posición tras cada jornada según la media de notas históricas confirmadas.</p></div><div class="a-player-rank"><span>Puesto actual</span><b>${last?`#${last.rank}`:'—'}</b><small>Mejor: ${best?`#${best}`:'—'}</small></div></div><div class="a-player-steps">${arr.map(x=>`<div class="${x.rank===null?'empty':''}"><span>${x.m.short}</span><b>${x.rank?`#${x.rank}`:'—'}</b><small>${x.rating!==null?`Jornada ${x.rating.toFixed(1)}`:'Sin nota'}${x.avg!==null?` · μ ${x.avg.toFixed(2)}`:''}</small></div>`).join('')}</div><button class="btn" onclick="closePlayerHub();showSection('evolucion')">Ver evolución completa</button></section>`;
}
function installPlayerHook(){
  if(typeof openPlayerHub!=='function'){setTimeout(installPlayerHook,120);return}
  if(window.__rmAnalyticsPlayerHook)return;window.__rmAnalyticsPlayerHook=true;
  const base=openPlayerHub;
  openPlayerHub=function(name){base(name);setTimeout(()=>{const content=document.getElementById('playerHubContent');if(!content)return;const heading=content.querySelector('.player-sheet-head h2')?.textContent?.trim();if(heading!==name)return;document.getElementById('aPlayerTrajectory')?.remove();content.insertAdjacentHTML('beforeend',playerTrajectoryHtml(name));},120)};
}

function install(){
  if(typeof sections==='undefined'||typeof players==='undefined'||typeof navHtml!=='function'){setTimeout(install,120);return}
  ensureEvolutionSection();renderEvolution();installPlayerHook();
}
install();
})();
