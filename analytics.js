(()=>{
function season(){return window.RMSeasonData}
function A_MATCHES(){return season()?.matches||[]}
const evolutionSection=['evolucion','↗','Evolución','Evolución y jornadas','Estadísticas partido a partido y cambios de jerarquía durante la temporada.'];
let insertAt=sections.findIndex(s=>s[0]==='power');insertAt=insertAt<0?sections.findIndex(s=>s[0]==='estadisticas'):insertAt;
if(!sections.some(s=>s[0]==='evolucion'))sections.splice(Math.max(0,insertAt+1),0,evolutionSection);
function aEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function aRatingEntry(player,matchId,includeReconstructed=false){return season()?.ratingEntry(matchId,player,{includeReconstructed})||null}
function aMinuteEntry(player,matchId,includeReconstructed=false){return season()?.minuteEntry(matchId,player,{includeReconstructed})||null}
function aRating(player,matchId){return aRatingEntry(player,matchId,false)?.value??null}
function aPlayer(name){return players.find(p=>p.name===name)}
function aDisplay(name){const p=aPlayer(name);return p?(p.short||p.name):name}
function aAggregate(name){const p=aPlayer(name),m=p?metricFor(p):null;return {metric:m,rating:m?currentRating(m):null}}
function aKnownMatches(name,through=A_MATCHES().length-1){return A_MATCHES().slice(0,through+1).map(m=>({match:m,rating:aRating(name,m.id)})).filter(x=>x.rating!==null)}
function aFormRows(through){
  return players.map(p=>{const known=aKnownMatches(p.name,through);if(!known.length)return null;const avg=known.reduce((s,x)=>s+x.rating,0)/known.length,last=known.at(-1)?.rating??null;return {player:p,avg,last,n:known.length}}).filter(Boolean).sort((a,b)=>b.avg-a.avg||b.n-a.n||(a.player.short||a.player.name).localeCompare(b.player.short||b.player.name,'es'));
}
function aRankAt(name,through){const rows=aFormRows(through),i=rows.findIndex(r=>r.player.name===name);return i<0?null:i+1}
function aMovement(name,through){const now=aRankAt(name,through);if(now===null||through===0)return {rank:now,delta:null};const prev=aRankAt(name,through-1);if(prev===null)return {rank:now,delta:'new'};return {rank:now,delta:prev-now}}
function aMoveHtml(m){if(m.rank===null)return '<span class="a-pending">—</span>';if(m.delta==='new')return `<b>#${m.rank}</b> <span class="a-new">NUEVO</span>`;if(m.delta===null||m.delta===0)return `<b>#${m.rank}</b> <span class="a-flat">•</span>`;return `<b>#${m.rank}</b> <span class="${m.delta>0?'a-up':'a-down'}">${m.delta>0?'▲':'▼'} ${Math.abs(m.delta)}</span>`}
function ensureEvolutionSection(){
  if(document.getElementById('evolucion'))return;const section=document.createElement('section');section.id='evolucion';section.className='section';const power=document.getElementById('power')||document.getElementById('estadisticas');if(power)power.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
let selectedMatch='betis';
function matchRows(matchId){
  return players.map(p=>{const re=aRatingEntry(p.name,matchId,true),me=aMinuteEntry(p.name,matchId,true),r=re?.value??null,m=me?.value??null,contrib=r!==null&&m!==null&&m>0?r*m/90:null;return {p,re,me,r,m,contrib}}).sort((a,b)=>{if(a.r!==null&&b.r===null)return -1;if(a.r===null&&b.r!==null)return 1;if(a.r!==null&&b.r!==null&&b.r!==a.r)return b.r-a.r;if(a.m!==null&&b.m===null)return -1;if(a.m===null&&b.m!==null)return 1;return (a.p.short||a.p.name).localeCompare(b.p.short||b.p.name,'es')});
}
function matchKpis(matchId){
  const rows=matchRows(matchId),confirmed=rows.filter(x=>x.re?.status==='confirmed'),reconstructed=rows.filter(x=>x.re?.status==='reconstructed'),minutesKnown=rows.filter(x=>x.me).length,best=[...confirmed].sort((a,b)=>b.r-a.r)[0]||null;
  return {confirmed:confirmed.length,reconstructed:reconstructed.length,minutesKnown,best};
}
function dataState(row){if(!row.re&&!row.me)return '<span class="tag">Pendiente</span>';if(row.re?.status==='reconstructed'||row.me?.status==='reconstructed')return '<span class="tag gold">Reconstruido</span>';if(row.re&&row.me)return '<span class="tag green">Confirmado</span>';return '<span class="tag blue">Parcial</span>'}
function displayNumber(entry,digits=1){if(!entry)return '—';return `${entry.status==='reconstructed'?'≈':''}${Number(entry.value).toFixed(digits)}`}
function renderMatchStats(){
  const match=A_MATCHES().find(m=>m.id===selectedMatch)||A_MATCHES()[0],k=matchKpis(match.id),through=A_MATCHES().findIndex(m=>m.id===match.id),holder=document.getElementById('aMatchStats');if(!holder)return;
  holder.innerHTML=`<div class="a-match-kpis"><div class="card"><span>Notas confirmadas</span><b>${k.confirmed}/25</b><small>Entran en forma y jerarquías</small></div><div class="card"><span>Notas reconstruidas</span><b>${k.reconstructed}/25</b><small>Visibles, pero fuera de tendencias</small></div><div class="card"><span>Minutos recuperados</span><b>${k.minutesKnown}/25</b><small>Confirmados o reconstruidos</small></div><div class="card"><span>Mejor confirmada</span><b>${k.best?aEsc(aDisplay(k.best.p.name)):'—'}</b><small>${k.best?k.best.r.toFixed(1):'Pendiente'}</small></div></div>
  <div class="card a-match-table-card"><div class="section-head" style="margin-top:0"><div><h2>Real Madrid · ${aEsc(match.label)}</h2><p>${aEsc(match.comp)} · ≈ indica un dato pendiente de verificación.</p></div><span class="pill">Forma hasta ${aEsc(match.short)}</span></div><div class="a-table-wrap"><div class="a-table-head"><span>#</span><span>Jugador</span><span>Min.</span><span>Nota</span><span>Aporte</span><span>Forma</span><span>Dato</span></div>${matchRows(match.id).map((row,i)=>{const mv=aMovement(row.p.name,through);return `<button class="a-table-row" onclick="openPlayerHub('${row.p.name.replace(/'/g,"\\'")}')"><span>${i+1}</span><span class="a-name"><b>${aEsc(row.p.short||row.p.name)}</b><small>${row.p.pos}</small></span><span>${row.me?`${row.me.status==='reconstructed'?'≈':''}${row.m===0?'NJ':`${row.m}'`}`:'—'}</span><strong>${displayNumber(row.re)}</strong><span>${row.contrib===null?'—':`${row.re?.status==='reconstructed'||row.me?.status==='reconstructed'?'≈':''}${row.contrib.toFixed(2)}`}</span><span>${aMoveHtml(mv)}</span><span>${dataState(row)}</span></button>`}).join('')}</div></div>`;
}
function hierarchyCard(match,index){const top=aFormRows(index).slice(0,5);return `<button class="card a-timeline-card ${match.id===selectedMatch?'active':''}" onclick="selectEvolutionMatch('${match.id}')"><div class="a-timeline-title"><div><small>${aEsc(match.comp)}</small><b>${aEsc(match.short)}</b></div><span>${top.length} clasif.</span></div><div class="a-top5">${top.length?top.map((r,i)=>`<div><b>${i+1}</b><span>${aEsc(r.player.short||r.player.name)}</span><strong>${r.avg.toFixed(2)}</strong></div>`).join(''):'<p>Sin notas confirmadas</p>'}</div></button>`}
function movementPanel(){
  const through=A_MATCHES().findIndex(m=>m.id===selectedMatch),now=aFormRows(through),prev=through>0?aFormRows(through-1):[],moves=now.map((r,i)=>{const old=prev.findIndex(x=>x.player.name===r.player.name);return {...r,rank:i+1,old:old<0?null:old+1,delta:old<0?null:(old+1)-(i+1)}}),rises=moves.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,5),falls=moves.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta).slice(0,5),news=moves.filter(x=>x.old===null).slice(0,5);
  const list=(arr,type)=>arr.length?arr.map(x=>`<button onclick="openPlayerHub('${x.player.name.replace(/'/g,"\\'")}')"><span>${aEsc(x.player.short||x.player.name)}</span><b>#${x.rank}</b><strong class="${type}">${type==='a-up'?`▲ ${x.delta}`:type==='a-down'?`▼ ${Math.abs(x.delta)}`:'NUEVO'}</strong></button>`).join(''):'<div class="a-no-move">Sin cambios disponibles</div>';
  return `<div class="a-movement-grid"><div class="card"><h3>Mayores subidas</h3>${list(rises,'a-up')}</div><div class="card"><h3>Mayores bajadas</h3>${list(falls,'a-down')}</div><div class="card"><h3>Nuevos en ranking</h3>${list(news,'a-new')}</div></div>`;
}
function matrixHtml(){
  const current=typeof phRows==='function'?phRows():[],order=[...players].sort((a,b)=>{const ia=current.findIndex(r=>r.player.name===a.name),ib=current.findIndex(r=>r.player.name===b.name);if(ia>=0&&ib>=0)return ia-ib;if(ia>=0)return -1;if(ib>=0)return 1;return a.name.localeCompare(b.name,'es')});
  return `<div class="a-matrix"><div class="a-matrix-head"><span>Jugador</span>${A_MATCHES().map(m=>`<span>${m.short}</span>`).join('')}<span>Actual</span></div>${order.map(p=>{const agg=aAggregate(p.name);return `<button class="a-matrix-row" onclick="openPlayerHub('${p.name.replace(/'/g,"\\'")}')"><span><b>${aEsc(p.short||p.name)}</b><small>${p.pos}</small></span>${A_MATCHES().map(m=>{const e=aRatingEntry(p.name,m.id,true),r=e?.value??null,cls=r===null?'empty':e.status==='reconstructed'?'reconstructed':r>=8?'hot':r>=7?'good':'low';return `<span class="${cls}">${r===null?'—':`${e.status==='reconstructed'?'≈':''}${r.toFixed(1)}`}</span>`}).join('')}<strong>${agg.rating===null?'—':agg.rating.toFixed(2)}</strong></button>`}).join('')}</div>`;
}
function renderEvolution(){
  const section=document.getElementById('evolucion');if(!section||!season())return;const audit=season().audit();
  section.innerHTML=`<div class="section-head"><div><h2>Evolución de la temporada</h2><p>Trayectoria partido a partido usando una única base histórica para toda la web.</p></div><span class="pill">${A_MATCHES().length} partidos</span></div>
  <div class="card a-method"><div><div class="eyebrow">FUENTE ÚNICA</div><h3>${audit.ratings.confirmed} notas confirmadas · ${audit.ratings.reconstructed} reconstruidas</h3><p><b>Forma y jerarquías:</b> solo usan datos confirmados. <b>Reconstruidos:</b> se muestran con ≈ para poder auditarlos, pero no influyen en tendencias.</p></div><div><b>Minutos históricos</b><span>${audit.minutes.confirmed} confirmados · ${audit.minutes.reconstructed} reconstruidos.</span><small>El acumulado actual sigue siendo la referencia para Power y Estadísticas.</small></div></div>
  <div class="a-match-tabs">${A_MATCHES().map(m=>`<button class="${m.id===selectedMatch?'active':''}" onclick="selectEvolutionMatch('${m.id}')"><span>${m.short}</span><small>${m.label}</small></button>`).join('')}</div><div id="aMatchStats"></div>
  <div class="section-head"><div><h2>Cómo cambia la forma</h2><p>Top 5 acumulado después de cada encuentro, exclusivamente con notas confirmadas.</p></div></div><div class="a-timeline">${A_MATCHES().map(hierarchyCard).join('')}</div><div id="aMovements">${movementPanel()}</div>
  <div class="card a-matrix-card"><div class="section-head" style="margin-top:0"><div><h2>Matriz de rendimiento</h2><p>Confirmadas y reconstruidas juntas para auditoría; ≈ identifica las segundas.</p></div></div>${matrixHtml()}</div>
  <div class="a-integrity"><b>Regla de integridad</b><span>Un valor reconstruido nunca suma puntos de forma ni mueve una jerarquía. Cuando se confirme su fuente, bastará con cambiar su estado en season-data.js y toda la web se recalculará de forma coherente.</span></div>`;renderMatchStats();
}
window.selectEvolutionMatch=function(id){if(!A_MATCHES().some(m=>m.id===id))return;selectedMatch=id;renderEvolution()};
function playerTrajectory(name){return A_MATCHES().map((m,i)=>{const rank=aRankAt(name,i),known=aKnownMatches(name,i),avg=known.length?known.reduce((s,x)=>s+x.rating,0)/known.length:null,entry=aRatingEntry(name,m.id,true);return {m,rank,avg,n:known.length,entry}})}
function playerTrajectoryHtml(name){
  const arr=playerTrajectory(name),known=arr.filter(x=>x.rank!==null),best=known.length?Math.min(...known.map(x=>x.rank)):null,last=known.at(-1)||null;
  return `<section class="a-player-trajectory" id="aPlayerTrajectory"><div class="a-player-title"><div><div class="eyebrow">JERARQUÍA DE FORMA</div><h3>Trayectoria en el ranking</h3><p>Posición tras cada jornada según notas confirmadas. ≈ identifica datos que aún no entran en el cálculo.</p></div><div class="a-player-rank"><span>Puesto actual</span><b>${last?`#${last.rank}`:'—'}</b><small>Mejor: ${best?`#${best}`:'—'}</small></div></div><div class="a-player-steps">${arr.map(x=>`<div class="${x.rank===null?'empty':''}"><span>${x.m.short}</span><b>${x.rank?`#${x.rank}`:'—'}</b><small>${x.entry?`${x.entry.status==='reconstructed'?'≈':''}${x.entry.value.toFixed(1)}`:'Sin nota'}${x.avg!==null?` · μ ${x.avg.toFixed(2)}`:''}</small></div>`).join('')}</div><button class="btn" onclick="closePlayerHub();showSection('evolucion')">Ver evolución completa</button></section>`;
}
function installPlayerHook(){
  if(typeof openPlayerHub!=='function'){setTimeout(installPlayerHook,120);return}if(window.__rmAnalyticsPlayerHook)return;window.__rmAnalyticsPlayerHook=true;const base=openPlayerHub;
  openPlayerHub=function(name){base(name);const content=document.getElementById('playerHubContent');if(content)content.dataset.analyticsPlayer=name;setTimeout(()=>{const c=document.getElementById('playerHubContent');if(!c||c.dataset.analyticsPlayer!==name)return;document.getElementById('aPlayerTrajectory')?.remove();c.insertAdjacentHTML('beforeend',playerTrajectoryHtml(name))},120)};
}
function install(){if(!season()||typeof sections==='undefined'||typeof players==='undefined'||typeof navHtml!=='function'){setTimeout(install,120);return}ensureEvolutionSection();renderEvolution();installPlayerHook()}
install();
})();