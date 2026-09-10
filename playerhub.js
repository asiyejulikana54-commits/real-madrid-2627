const playerHubSection=['power','⚡','Power','Power Ranking','Índice interno que combina rendimiento y tamaño de muestra.'];
const powerInsertAt=Math.max(0,sections.findIndex(s=>s[0]==='estadisticas')+1);
if(!sections.some(s=>s[0]==='power'))sections.splice(powerInsertAt,0,playerHubSection);

function phEsc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function phRows(){
  return players.map(player=>{
    const metric=metricFor(player),rating=currentRating(metric);
    if(!metric||rating===null)return null;
    const sample=Math.min(metric.minutes,450)/450;
    const score=rating*(0.75+0.25*sample);
    const efficiencyPosition=[...efficiencyRanking].sort((a,b)=>a.minPerPoint-b.minPerPoint).findIndex(m=>m===metric)+1;
    return {player,metric,rating,sample,score,efficiencyPosition};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||b.rating-a.rating);
}
function phLevel(row){
  if(row.metric.minutes<90)return 'Muestra corta';
  if(row.score>=7.5)return 'Nivel élite';
  if(row.score>=7.0)return 'Nivel muy alto';
  if(row.score>=6.5)return 'Nivel alto';
  return 'En seguimiento';
}
function phPowerTable(){
  const rows=phRows();
  return `<div class="power-table"><div class="power-head"><span>#</span><span>Jugador</span><span>Power</span><span>Media</span><span>Min</span><span>Min/punto</span><span>Nivel</span></div>${rows.map((r,i)=>`<button class="power-row" onclick="openPlayerHub('${r.player.name.replace(/'/g,"\\'")}')"><b>${i+1}</b><span class="power-name">${phEsc(r.player.short||r.player.name)}<small>${r.player.pos}</small></span><strong>${r.score.toFixed(2)}</strong><span>${r.rating.toFixed(2)}</span><span>${r.metric.minutes}</span><span>${r.metric.minPerPoint.toFixed(2)}</span><span class="power-level">${phLevel(r)}</span></button>`).join('')}</div>`;
}
function renderPowerHub(){
  const section=document.getElementById('power');if(!section)return;
  const rows=phRows(),top=rows.slice(0,5);
  section.innerHTML=`
    <div class="section-head"><div><h2>Power Ranking RM 26/27</h2><p>Una clasificación interna para equilibrar rendimiento y fiabilidad de la muestra.</p></div><span class="pill">Actualizado · ${rows.length} jugadores</span></div>
    <div class="card power-formula"><div><div class="eyebrow">FÓRMULA TRANSPARENTE</div><h3>Media × (0,75 + 0,25 × muestra)</h3><p class="muted">La muestra es minutos / 450, con máximo 1. Así una gran nota en pocos minutos cuenta, pero no pesa igual que mantenerla durante más tiempo. No sustituye a la media ni al ranking de eficiencia.</p></div><div class="formula-example"><b>Power</b><span>0–10 aprox.</span><small>Más alto = mejor combinación actual</small></div></div>
    <div class="power-podium">${top.map((r,i)=>`<button class="card power-podium-card" onclick="openPlayerHub('${r.player.name.replace(/'/g,"\\'")}')"><span class="power-place">#${i+1}</span><div class="avatar">${initials(r.player.short||r.player.name)}</div><h3>${phEsc(r.player.short||r.player.name)}</h3><strong>${r.score.toFixed(2)}</strong><small>${phLevel(r)} · ${r.metric.minutes} min</small></button>`).join('')}</div>
    <div class="card" style="margin-top:16px"><div class="section-head" style="margin-top:0"><div><h2>Clasificación completa</h2><p>Toca cualquier jugador para abrir su ficha.</p></div></div>${phPowerTable()}</div>`;
}

function ensurePlayerHubSection(){
  if(document.getElementById('power'))return;
  const section=document.createElement('section');section.className='section';section.id='power';
  const stats=document.getElementById('estadisticas');stats.insertAdjacentElement('afterend',section);
  renderPowerHub();
  document.getElementById('navDesktop').innerHTML=navHtml(false);
  document.getElementById('navMobile').innerHTML=navHtml(true);
}

function ensurePowerHome(){
  if(document.getElementById('powerHome'))return;
  const rows=phRows().slice(0,5),inicio=document.getElementById('inicio');if(!inicio)return;
  const block=document.createElement('div');block.id='powerHome';block.className='card power-home';
  block.innerHTML=`<div class="section-head" style="margin-top:0"><div><div class="eyebrow">POWER RANKING</div><h2>Los 5 más fuertes ahora</h2><p>Rendimiento combinado con tamaño de muestra.</p></div><button class="btn" onclick="showSection('power')">Ver ranking completo</button></div><div class="power-home-list">${rows.map((r,i)=>`<button onclick="openPlayerHub('${r.player.name.replace(/'/g,"\\'")}')"><b>#${i+1}</b><span>${phEsc(r.player.short||r.player.name)}</span><strong>${r.score.toFixed(2)}</strong><small>${r.metric.minutes} min</small></button>`).join('')}</div>`;
  inicio.appendChild(block);
}

function ensurePlayerModal(){
  if(document.getElementById('playerHubModal'))return;
  const modal=document.createElement('div');modal.id='playerHubModal';modal.className='player-modal';
  modal.innerHTML='<div class="player-modal-backdrop" onclick="closePlayerHub()"></div><div class="player-sheet"><button class="player-close" onclick="closePlayerHub()">×</button><div id="playerHubContent"></div></div>';
  document.body.appendChild(modal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePlayerHub()});
}
function closePlayerHub(){document.getElementById('playerHubModal')?.classList.remove('open');document.body.classList.remove('player-modal-open')}
function openPlayerHub(name){
  ensurePlayerModal();
  const player=players.find(p=>p.name===name);if(!player)return;
  const metric=metricFor(player),rating=currentRating(metric),rows=phRows(),powerIndex=rows.findIndex(r=>r.player===player),row=powerIndex>=0?rows[powerIndex]:null;
  const content=document.getElementById('playerHubContent');
  const samplePct=metric?Math.min(100,Math.round(metric.minutes/450*100)):0;
  content.innerHTML=`
    <div class="player-sheet-head"><div class="avatar big">${initials(player.short||player.name)}</div><div><div class="eyebrow">FICHA DE JUGADOR · ${player.pos}</div><h2>${phEsc(player.name)}</h2><p>${phEsc(player.role)}</p></div></div>
    <div class="player-sheet-tags">${player.tags.map(t=>`<span class="tag ${tagClass(t)}">${phEsc(t)}</span>`).join('')}</div>
    <div class="player-metrics">
      <div><span>Media actual</span><b>${rating!==null?rating.toFixed(2):'—'}</b></div>
      <div><span>Minutos</span><b>${metric?metric.minutes:'—'}</b></div>
      <div><span>Aporte</span><b>${metric?metric.points.toFixed(2):'—'}</b></div>
      <div><span>Min / punto</span><b>${metric?metric.minPerPoint.toFixed(2):'—'}</b></div>
      <div><span>Power RM</span><b>${row?row.score.toFixed(2):'—'}</b></div>
      <div><span>Puesto Power</span><b>${row?`#${powerIndex+1}`:'—'}</b></div>
    </div>
    <div class="sample-card"><div><span>Fiabilidad de muestra</span><b>${metric?`${metric.minutes}/450 min`:'Sin muestra'}</b></div><div class="sample-track"><i style="width:${samplePct}%"></i></div><small>${metric&&metric.minutes<90?'Todavía pesa poco en el Power Ranking por tener pocos minutos.':'La muestra gana peso progresivamente hasta 450 minutos.'}</small></div>
    <div class="player-info-grid"><div><span>Elegible en el once</span><b>${player.eligible.join(' · ')}</b></div><div><span>Estado interno</span><b>${row?phLevel(row):'Pendiente'}</b></div>${row?`<div><span>Puesto eficiencia</span><b>#${row.efficiencyPosition}</b></div>`:''}</div>
    <div class="actions player-sheet-actions"><button class="btn primary" onclick="compareFromPlayer('${player.name.replace(/'/g,"\\'")}')">Comparar jugador</button><button class="btn" onclick="showSection('power');closePlayerHub()">Ver Power Ranking</button></div>`;
  document.getElementById('playerHubModal').classList.add('open');document.body.classList.add('player-modal-open');
}
function compareFromPlayer(name){
  closePlayerHub();showSection('comparador');
  const player=players.find(p=>p.name===name);if(!player)return;
  const alternative=players.find(p=>p.name!==name&&p.pos===player.pos)||players.find(p=>p.name!==name);
  document.getElementById('compareA').value=name;if(alternative)document.getElementById('compareB').value=alternative.name;renderCompare();
}

function decoratePlayerCards(){
  document.querySelectorAll('#playersGrid .player').forEach(card=>{
    if(card.dataset.profileReady)return;
    const name=card.querySelector('h3')?.textContent?.trim();if(!players.some(p=>p.name===name))return;
    card.dataset.profileReady='1';card.classList.add('player-clickable');card.tabIndex=0;
    const action=document.createElement('button');action.className='player-profile-link';action.textContent='Ver ficha →';action.onclick=e=>{e.stopPropagation();openPlayerHub(name)};card.appendChild(action);
    card.onclick=()=>openPlayerHub(name);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPlayerHub(name)}};
  });
}
function decorateStatsTable(){
  const table=document.getElementById('statsBody')?.closest('table');if(!table||table.dataset.profileReady)return;
  table.dataset.profileReady='1';table.classList.add('stats-clickable');
  table.addEventListener('click',e=>{const row=e.target.closest('tbody tr');if(!row)return;const name=row.querySelector('td')?.textContent?.trim();const player=players.find(p=>p.name===name);if(player)openPlayerHub(player.name)});
}

ensurePlayerHubSection();ensurePowerHome();ensurePlayerModal();decoratePlayerCards();decorateStatsTable();
const playerGrid=document.getElementById('playersGrid');if(playerGrid)new MutationObserver(()=>decoratePlayerCards()).observe(playerGrid,{childList:true});
