(()=>{
const H_SECTION=['jerarquias','⌁','Jerarquías','Mapa de jerarquías','Quién manda, quién aprieta y dónde sigue abierto el puesto.'];
const H_POSITIONS=[
  {id:'POR',label:'Portero',slots:['gk']},
  {id:'LI',label:'Lateral izquierdo',slots:['lb']},
  {id:'DFC',label:'Centrales',slots:['lcb','rcb']},
  {id:'LD',label:'Lateral derecho',slots:['rb']},
  {id:'MC',label:'Mediocentro',slots:['dm1','dm2']},
  {id:'MP',label:'Mediapunta',slots:['am']},
  {id:'EI',label:'Banda izquierda',slots:['lw']},
  {id:'ED',label:'Banda derecha',slots:['rw']},
  {id:'DC',label:'Delantero centro',slots:['st']}
];
let hMode='all';
function season(){return window.RMSeasonData}
function hEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function hMetric(p){return metricFor(p)}
function hRating(p){const m=hMetric(p);return currentRating(m)}
function hPower(p){const m=hMetric(p),r=hRating(p);if(!m||r===null)return null;const sample=Math.min(m.minutes,450)/450;return r*(.75+.25*sample)}
function hRecent(p){return season()?.recentRating(p.name,3)||null}
function hPositionCfg(pos){return H_POSITIONS.find(x=>x.id===pos)}
function hDecision(p,pos){const cfg=hPositionCfg(pos);if(!cfg)return 0;const inXI=xi=>cfg.slots.some(s=>xi?.[s]===p.name);return ((inXI(baseXI)?1:0)+(inXI(rayoXI)?1:0))/2*10}
function hScore(p,pos){
  const m=hMetric(p),power=hPower(p);if(!m||power===null)return null;
  const recent=hRecent(p),sample=Math.min(m.minutes,450)/450*10,decision=hDecision(p,pos);
  const parts=[{v:power,w:.45},{v:sample,w:.20},{v:decision,w:.15}];if(recent)parts.push({v:recent.value,w:.20});
  const totalW=parts.reduce((s,x)=>s+x.w,0);return parts.reduce((s,x)=>s+x.v*x.w,0)/totalW;
}
function hCandidates(pos){
  const list=players.filter(p=>p.eligible.includes(pos)&&(hMode==='all'||p.eligible[0]===pos));
  return list.map(p=>({p,score:hScore(p,pos),power:hPower(p),recent:hRecent(p),metric:hMetric(p),decision:hDecision(p,pos)})).sort((a,b)=>{
    if(a.score!==null&&b.score===null)return -1;if(a.score===null&&b.score!==null)return 1;if(a.score!==null&&b.score!==null&&b.score!==a.score)return b.score-a.score;return (a.p.short||a.p.name).localeCompare(b.p.short||b.p.name,'es');
  });
}
function hKnown(pos){return hCandidates(pos).filter(x=>x.score!==null)}
function hStarterSpots(pos){return hPositionCfg(pos)?.slots.length||1}
function hTier(row,index,known,pos){
  if(row.score===null)return {id:'depth',label:'Fondo de plantilla',className:'depth'};
  const spots=hStarterSpots(pos),boundary=known[Math.min(spots-1,Math.max(0,known.length-1))],challenger=known[spots]||null;
  if(index<spots){const gap=challenger?row.score-challenger.score:99;if(gap>=.75&&row.decision>=5)return {id:'clear',label:'Titular claro',className:'clear'};if(gap>=.35)return {id:'edge',label:'Ventaja',className:'edge'};return {id:'duel',label:'Duelo abierto',className:'duel'}}
  const gap=boundary?boundary.score-row.score:99;if(index===spots&&gap<=.45)return {id:'duel',label:'Duelo abierto',className:'duel'};if(index<=spots+1||gap<=1.20)return {id:'rotation',label:'Rotación',className:'rotation'};return {id:'depth',label:'Fondo de plantilla',className:'depth'};
}
function hPositionData(pos){const rows=hCandidates(pos),known=rows.filter(x=>x.score!==null);return rows.map((r,i)=>({...r,tier:hTier(r,i,known,pos)}))}
function hPositionSummary(pos){const known=hKnown(pos),spots=hStarterSpots(pos);if(!known.length)return {pos,gap:null,leader:null,boundary:null,challenger:null,starters:[]};const boundary=known[Math.min(spots-1,known.length-1)],challenger=known[spots]||null;return {pos,gap:challenger?boundary.score-challenger.score:null,leader:known[0],boundary,challenger,starters:known.slice(0,spots)}}
function hAllSummaries(){return H_POSITIONS.map(p=>hPositionSummary(p.id))}
function hHottest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>a.gap-b.gap)[0]||null}
function hClearest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>b.gap-a.gap)[0]||null}
function hBestLeader(){return hAllSummaries().filter(x=>x.leader).sort((a,b)=>b.leader.score-a.leader.score)[0]||null}
function hMultiLeader(){const starterZones=[];hAllSummaries().forEach(x=>x.starters.forEach(r=>starterZones.push({pos:x.pos,name:r.p.name,score:r.score})));const by={};starterZones.forEach(x=>(by[x.name]??=[]).push(x));return Object.entries(by).map(([name,rows])=>({name,rows})).filter(x=>x.rows.length>1).sort((a,b)=>b.rows.length-a.rows.length||Math.max(...b.rows.map(x=>x.score))-Math.max(...a.rows.map(x=>x.score)))[0]||null}
function hTierCounts(){const counts={clear:0,edge:0,duel:0,rotation:0,depth:0};H_POSITIONS.forEach(p=>hPositionData(p.id).forEach(r=>counts[r.tier.id]++));return counts}
function hPlayerRow(row,index){const name=row.p.short||row.p.name,minutes=row.metric?.minutes??null,recent=row.recent?.value??null;return `<button class="h-player ${row.tier.className}" onclick="openPlayerHub('${row.p.name.replace(/'/g,"\\'")}')"><div class="h-player-main"><span class="h-rank">${row.score===null?'—':index+1}</span><div><b>${hEsc(name)}</b><small>${hEsc(row.p.eligible.join(' · '))}</small></div><strong>${row.score===null?'—':row.score.toFixed(2)}</strong></div><div class="h-player-meta"><span class="h-tier ${row.tier.className}">${row.tier.label}</span><span>${row.power===null?'Power —':`Power ${row.power.toFixed(2)}`}</span><span>${minutes===null?'Min —':`${minutes} min`}</span><span>${recent===null?'Forma —':`Forma ${recent.toFixed(2)} · ${row.recent.n} notas`}</span></div></button>`}
function hPositionCard(cfg){const rows=hPositionData(cfg.id),summary=hPositionSummary(cfg.id),spots=cfg.slots.length,title=summary.starters.length?summary.starters.map(r=>hEsc(r.p.short||r.p.name)).join(spots>1?' + ':''):'Sin datos',sub=summary.challenger?`${hEsc(summary.boundary.p.short||summary.boundary.p.name)} +${summary.gap.toFixed(2)} sobre ${hEsc(summary.challenger.p.short||summary.challenger.p.name)}`:summary.starters.length?'Sin perseguidor calculable':'Pendiente';return `<article class="card h-position-card"><div class="h-position-head"><div><span>${cfg.id}</span><h3>${hEsc(cfg.label)}</h3><small>${spots} plaza${spots===1?'':'s'} de referencia</small></div><div><b>${title}</b><small>${sub}</small></div></div><div class="h-position-list">${rows.length?rows.map((r,i)=>hPlayerRow(r,i)).join(''):'<div class="h-empty">Sin jugadores en esta vista.</div>'}</div></article>`}
function hBoard(){const tiers=[['clear','Titular claro'],['edge','Ventaja'],['duel','Duelo abierto'],['rotation','Rotación'],['depth','Fondo']];return `<div class="h-board"><div class="h-board-head"><span>Nivel</span>${H_POSITIONS.map(p=>`<span>${p.id}</span>`).join('')}</div>${tiers.map(([id,label])=>`<div class="h-board-row ${id}"><strong>${label}</strong>${H_POSITIONS.map(pos=>{const rows=hPositionData(pos.id).filter(r=>r.tier.id===id);return `<div>${rows.map(r=>`<button onclick="openPlayerHub('${r.p.name.replace(/'/g,"\\'")}')"><span>${hEsc(r.p.short||r.p.name)}</span><small>${r.score===null?'—':r.score.toFixed(2)}</small></button>`).join('')||'<i>—</i>'}</div>`}).join('')}</div>`).join('')}</div>`}
function ensureHierarchy(){
  if(document.getElementById('jerarquias'))return;const idx=sections.findIndex(s=>s[0]==='power');if(!sections.some(s=>s[0]==='jerarquias'))sections.splice(idx>=0?idx+1:Math.max(0,sections.findIndex(s=>s[0]==='estadisticas')+1),0,H_SECTION);
  const section=document.createElement('section');section.id='jerarquias';section.className='section';const power=document.getElementById('power'),evo=document.getElementById('evolucion');if(power)power.insertAdjacentElement('afterend',section);else if(evo)evo.insertAdjacentElement('beforebegin',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
function ensureHierarchyHome(){const inicio=document.getElementById('inicio');if(!inicio||document.getElementById('hierarchyHome'))return;const block=document.createElement('div');block.id='hierarchyHome';block.className='card h-home';const intel=document.getElementById('intelligenceHome');if(intel)intel.insertAdjacentElement('afterend',block);else inicio.appendChild(block)}
function renderHierarchyHome(){const root=document.getElementById('hierarchyHome');if(!root)return;const hot=hHottest(),clear=hClearest(),multi=hMultiLeader();root.innerHTML=`<div class="h-home-head"><div><div class="eyebrow">⌁ MAPA DE JERARQUÍAS</div><h2>Quién tiene el puesto y dónde hay pelea</h2><p>Lectura posicional del Power, la muestra, la forma confirmada y nuestras decisiones.</p></div><button class="btn" onclick="showSection('jerarquias')">Abrir mapa</button></div><div class="h-home-grid"><button onclick="showSection('jerarquias')"><span>🔥 Frontera más abierta</span><b>${hot?hEsc(H_POSITIONS.find(p=>p.id===hot.pos)?.label):'—'}</b><small>${hot?.challenger?`${hEsc(hot.boundary.p.short||hot.boundary.p.name)} vs ${hEsc(hot.challenger.p.short||hot.challenger.p.name)} · ${hot.gap.toFixed(2)} pts`:'Sin duelo calculable'}</small></button><button onclick="showSection('jerarquias')"><span>🔒 Frontera más clara</span><b>${clear?hEsc(H_POSITIONS.find(p=>p.id===clear.pos)?.label):'—'}</b><small>${clear?.challenger?`${hEsc(clear.boundary.p.short||clear.boundary.p.name)} +${clear.gap.toFixed(2)} sobre ${hEsc(clear.challenger.p.short||clear.challenger.p.name)}`:'Sin perseguidor'}</small></button><button onclick="showSection('jerarquias')"><span>♜ Polivalencia dominante</span><b>${multi?hEsc(displayName(multi.name)):'—'}</b><small>${multi?`Zona titular en ${multi.rows.map(x=>x.pos).join(' · ')}`:'Nadie domina dos puestos'}</small></button></div>`}
function renderHierarchy(){
  const section=document.getElementById('jerarquias');if(!section)return;const hot=hHottest(),clear=hClearest(),best=hBestLeader(),multi=hMultiLeader(),counts=hTierCounts(),audit=season()?.audit();
  section.innerHTML=`<div class="section-head"><div><h2>Mapa de jerarquías por posición</h2><p>Cada jugador aparece en todas las demarcaciones en las que es elegible. DFC y MC consideran dos plazas titulares; en el resto, una.</p></div><div class="h-mode"><button class="${hMode==='all'?'active':''}" onclick="setHierarchyMode('all')">Polivalencia</button><button class="${hMode==='primary'?'active':''}" onclick="setHierarchyMode('primary')">Rol principal</button></div></div>
  <div class="card h-method"><div><div class="eyebrow">ÍNDICE DE JERARQUÍA</div><h3>45% Power · 20% minutos · 20% forma · 15% nuestras decisiones</h3><p>Power y minutos vienen del acumulado actual. La forma consume exclusivamente las ${audit?.ratings.confirmed||0} notas históricas confirmadas de la fuente única.</p></div><div><b>Reconstruidos fuera del cálculo</b><span>Los datos históricos pendientes de verificar siguen visibles en Evolución, pero no mueven este índice.</span><small>Si falta forma, su peso se redistribuye entre las señales disponibles.</small></div></div>
  <div class="h-kpis"><div class="card"><span>🔥 Frontera más abierta</span><b>${hot?hEsc(hot.pos):'—'}</b><small>${hot?.challenger?`${hEsc(displayName(hot.boundary.p.name))} / ${hEsc(displayName(hot.challenger.p.name))} · ${hot.gap.toFixed(2)}`:'Sin duelo'}</small></div><div class="card"><span>🔒 Frontera más clara</span><b>${clear?hEsc(clear.pos):'—'}</b><small>${clear?.challenger?`${hEsc(displayName(clear.boundary.p.name))} +${clear.gap.toFixed(2)}`:'Sin perseguidor'}</small></div><div class="card"><span>⭐ Índice más alto</span><b>${best?hEsc(displayName(best.leader.p.name)):'—'}</b><small>${best?`${best.pos} · ${best.leader.score.toFixed(2)}`:'—'}</small></div><div class="card"><span>♜ Polivalencia</span><b>${multi?hEsc(displayName(multi.name)):'—'}</b><small>${multi?multi.rows.map(x=>x.pos).join(' · '):'Sin doble zona titular'}</small></div></div>
  <div class="h-legend"><span class="clear">Titular claro <b>${counts.clear}</b></span><span class="edge">Ventaja <b>${counts.edge}</b></span><span class="duel">Duelo abierto <b>${counts.duel}</b></span><span class="rotation">Rotación <b>${counts.rotation}</b></span><span class="depth">Fondo <b>${counts.depth}</b></span></div>
  <div class="section-head"><div><h2>Jerarquía puesto a puesto</h2><p>La frontera importante es 1.º–2.º en puestos de una plaza y 2.º–3.º en DFC/MC.</p></div></div><div class="h-position-grid">${H_POSITIONS.map(hPositionCard).join('')}</div>
  <div class="card h-board-card"><div class="section-head" style="margin-top:0"><div><h2>Matriz global de jerarquía</h2><p>Localiza rápidamente titulares claros, ventajas, duelos abiertos, rotaciones y fondo de plantilla.</p></div></div>${hBoard()}</div>
  <div class="h-integrity"><b>Cómo leer el mapa</b><span>“Titular claro” exige margen sobre el primer jugador que quedaría fuera y presencia en nuestras referencias de XI. La forma histórica solo cuenta si está confirmada en season-data.js.</span></div>`;
}
window.setHierarchyMode=function(mode){hMode=mode==='primary'?'primary':'all';renderHierarchy();renderHierarchyHome()};
function install(){if(!season()||typeof sections==='undefined'||typeof players==='undefined'||typeof metricFor!=='function'||typeof openPlayerHub!=='function'){setTimeout(install,120);return}ensureHierarchy();ensureHierarchyHome();renderHierarchy();renderHierarchyHome()}
install();
})();