(()=>{
const H_SECTION=['jerarquias','⌁','Jerarquías','Jerarquías PRO','Quién manda, quién aprieta y dónde sigue abierto el puesto.'];
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
function hRecent(p){return season()?.recentRating?.(p.name,3)||null}
function hDelta(p){return season()?.ratingDelta?.(p.name)||null}
function hPositionCfg(pos){return H_POSITIONS.find(x=>x.id===pos)}
function hDecision(p,pos){const cfg=hPositionCfg(pos);if(!cfg)return 0;const inXI=xi=>cfg.slots.some(s=>xi?.[s]===p.name);return ((inXI(baseXI)?1:0)+(inXI(rayoXI)?1:0))/2*10}
function hScore(p,pos){
  const m=hMetric(p),power=hPower(p);if(!m||power===null)return null;
  const recent=hRecent(p),sample=Math.min(m.minutes,450)/450*10,decision=hDecision(p,pos);
  const parts=[{v:power,w:.45},{v:sample,w:.20},{v:decision,w:.15}];if(recent)parts.push({v:recent.value,w:.20});
  const totalW=parts.reduce((s,x)=>s+x.w,0);return parts.reduce((s,x)=>s+x.v*x.w,0)/totalW;
}
function hCandidates(pos){
  return players.filter(p=>p.eligible.includes(pos)&&(hMode==='all'||p.eligible[0]===pos)).map(p=>({p,score:hScore(p,pos),power:hPower(p),recent:hRecent(p),delta:hDelta(p),metric:hMetric(p),decision:hDecision(p,pos)})).sort((a,b)=>{
    if(a.score!==null&&b.score===null)return -1;if(a.score===null&&b.score!==null)return 1;if(a.score!==null&&b.score!==null&&Math.abs(b.score-a.score)>.0001)return b.score-a.score;return (a.p.short||a.p.name).localeCompare(b.p.short||b.p.name,'es');
  });
}
function hStarterSpots(pos){return hPositionCfg(pos)?.slots.length||1}
function hKnown(pos){return hCandidates(pos).filter(x=>x.score!==null)}
function hSummary(pos){
  const known=hKnown(pos),spots=hStarterSpots(pos);if(!known.length)return {pos,known,spots,starters:[],boundary:null,challenger:null,gap:null};
  const starters=known.slice(0,spots),boundary=known[Math.min(spots-1,known.length-1)],challenger=known[spots]||null;
  return {pos,known,spots,starters,boundary,challenger,gap:challenger?boundary.score-challenger.score:null};
}
function hConfidence(summary){
  const rows=[summary.boundary,summary.challenger].filter(Boolean);if(!rows.length)return {pct:0,label:'Sin muestra',minutes:0,form:0};
  const minMinutes=Math.min(...rows.map(r=>r.metric?.minutes||0)),minForm=Math.min(...rows.map(r=>r.recent?.n||0));
  const dataShare=rows.filter(r=>r.power!==null&&r.score!==null).length/rows.length;
  const pct=Math.round(Math.min(100,(Math.min(minMinutes,450)/450*.58+Math.min(minForm,3)/3*.27+dataShare*.15)*100));
  return {pct,label:pct>=75?'Alta':pct>=45?'Media':'Baja',minutes:minMinutes,form:minForm};
}
function hPositionState(summary){
  const confidence=hConfidence(summary);if(!summary.boundary)return {id:'pending',label:'Sin datos',copy:'No hay muestra suficiente para ordenar este puesto.',confidence};
  if(!summary.challenger)return {id:confidence.pct>=45?'clear':'pending',label:confidence.pct>=45?'Sin rival con muestra':'Muestra corta',copy:'No existe un perseguidor con datos comparables en esta vista.',confidence};
  if(confidence.pct<45)return {id:'pending',label:'Muestra insuficiente',copy:`La frontera es ${summary.gap.toFixed(2)}, pero la confianza de muestra es baja.`,confidence};
  if(summary.gap<=.35)return {id:'open',label:'Duelo abierto',copy:`Solo ${summary.gap.toFixed(2)} puntos separan la última plaza titular de su perseguidor.`,confidence};
  if(summary.gap<.75)return {id:'edge',label:'Ventaja',copy:`Hay ${summary.gap.toFixed(2)} puntos de margen, todavía sin cerrar el puesto.`,confidence};
  return {id:'clear',label:'Jerarquía clara',copy:`La frontera titular tiene ${summary.gap.toFixed(2)} puntos de margen.`,confidence};
}
function hTier(row,index,known,pos){
  if(row.score===null)return {id:'depth',label:'Fondo de plantilla',className:'depth'};
  const spots=hStarterSpots(pos),boundary=known[Math.min(spots-1,Math.max(0,known.length-1))],challenger=known[spots]||null;
  if(index<spots){const gap=challenger?row.score-challenger.score:99;if(gap>=.75&&row.decision>=5)return {id:'clear',label:'Titular claro',className:'clear'};if(gap>=.35)return {id:'edge',label:'Ventaja',className:'edge'};return {id:'duel',label:'Duelo abierto',className:'duel'}}
  const gap=boundary?boundary.score-row.score:99;if(index===spots&&gap<=.45)return {id:'duel',label:'Duelo abierto',className:'duel'};if(index<=spots+1||gap<=1.20)return {id:'rotation',label:'Rotación',className:'rotation'};return {id:'depth',label:'Fondo de plantilla',className:'depth'};
}
function hPositionData(pos){const rows=hCandidates(pos),known=rows.filter(x=>x.score!==null);return rows.map((r,i)=>({...r,tier:hTier(r,i,known,pos)}))}
function hAllSummaries(){return H_POSITIONS.map(p=>hSummary(p.id))}
function hHottest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>a.gap-b.gap)[0]||null}
function hClearest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>b.gap-a.gap)[0]||null}
function hBestLeader(){return hAllSummaries().filter(x=>x.known.length).sort((a,b)=>b.known[0].score-a.known[0].score)[0]||null}
function hPressure(){
  const rows=[];H_POSITIONS.forEach(cfg=>hPositionData(cfg.id).forEach((r,i)=>{if(i>0&&r.delta?.delta>0)rows.push({pos:cfg.id,row:r,delta:r.delta.delta})}));
  return rows.sort((a,b)=>b.delta-a.delta)[0]||null;
}
function hTierCounts(){const counts={clear:0,edge:0,duel:0,rotation:0,depth:0};H_POSITIONS.forEach(p=>hPositionData(p.id).forEach(r=>counts[r.tier.id]++));return counts}
function trendHtml(row){const d=row.delta?.delta;if(typeof d!=='number')return '<span class="h-trend neutral">Sin tendencia</span>';if(Math.abs(d)<.05)return '<span class="h-trend neutral">→ estable</span>';return `<span class="h-trend ${d>0?'up':'down'}">${d>0?'▲':'▼'} ${Math.abs(d).toFixed(2)} última nota</span>`}
function hPlayerRow(row,index){
  const name=row.p.short||row.p.name,minutes=row.metric?.minutes??null,recent=row.recent?.value??null,sample=Math.min(100,Math.round((minutes||0)/450*100));
  return `<button class="h-player ${row.tier.className}" onclick="openPlayerHub('${row.p.name.replace(/'/g,"\\'")}')"><div class="h-player-main"><span class="h-rank">${row.score===null?'—':index+1}</span><div><b>${hEsc(name)}</b><small>${hEsc(row.p.eligible.join(' · '))}</small></div><strong>${row.score===null?'—':row.score.toFixed(2)}</strong></div><div class="h-player-meta"><span class="h-tier ${row.tier.className}">${row.tier.label}</span><span>${row.power===null?'Power —':`Power ${row.power.toFixed(2)}`}</span><span>${minutes===null?'Min —':`${minutes} min`}</span><span>${recent===null?'Forma —':`Forma ${recent.toFixed(2)} · ${row.recent.n}/3`}</span>${trendHtml(row)}</div><div class="h-sample"><i style="width:${sample}%"></i></div></button>`;
}
function hPairActions(summary){if(!summary.boundary||!summary.challenger)return '';return `<div class="h-pair-actions"><button onclick="event.stopPropagation();hierarchyToRadar('${summary.pos}')">Abrir Radar</button><button onclick="event.stopPropagation();hierarchyToCompare('${summary.pos}')">Comparar</button></div>`}
function hPositionCard(cfg){
  const rows=hPositionData(cfg.id),summary=hSummary(cfg.id),state=hPositionState(summary),spots=cfg.slots.length,title=summary.starters.length?summary.starters.map(r=>hEsc(r.p.short||r.p.name)).join(spots>1?' + ':''):'Sin datos';
  const boundary=summary.boundary,challenger=summary.challenger,frontier=challenger?`${hEsc(boundary.p.short||boundary.p.name)} +${summary.gap.toFixed(2)} sobre ${hEsc(challenger.p.short||challenger.p.name)}`:summary.starters.length?'Sin perseguidor comparable':'Pendiente';
  return `<article class="card h-position-card"><div class="h-position-head"><div><span>${cfg.id}</span><h3>${hEsc(cfg.label)}</h3><small>${spots} plaza${spots===1?'':'s'} · frontera ${spots===1?'1.º–2.º':'2.º–3.º'}</small></div><div><b>${title}</b><small>${frontier}</small></div></div><div class="h-position-status ${state.id}"><div><span>${state.label}</span><b>${hEsc(state.copy)}</b></div><div class="h-confidence"><strong>${state.confidence.pct}%</strong><small>confianza de muestra</small><div><i style="width:${state.confidence.pct}%"></i></div></div></div>${hPairActions(summary)}<div class="h-position-list">${rows.length?rows.map((r,i)=>hPlayerRow(r,i)).join(''):'<div class="h-empty">Sin jugadores en esta vista.</div>'}</div></article>`;
}
function hBoard(){const tiers=[['clear','Titular claro'],['edge','Ventaja'],['duel','Duelo abierto'],['rotation','Rotación'],['depth','Fondo']];return `<div class="h-board"><div class="h-board-head"><span>Nivel</span>${H_POSITIONS.map(p=>`<span>${p.id}</span>`).join('')}</div>${tiers.map(([id,label])=>`<div class="h-board-row ${id}"><strong>${label}</strong>${H_POSITIONS.map(pos=>{const rows=hPositionData(pos.id).filter(r=>r.tier.id===id);return `<div>${rows.map(r=>`<button onclick="openPlayerHub('${r.p.name.replace(/'/g,"\\'")}')"><span>${hEsc(r.p.short||r.p.name)}</span><small>${r.score===null?'—':r.score.toFixed(2)}</small></button>`).join('')||'<i>—</i>'}</div>`}).join('')}</div>`).join('')}</div>`}
function ensureHierarchy(){
  if(document.getElementById('jerarquias'))return;const idx=sections.findIndex(s=>s[0]==='power');if(!sections.some(s=>s[0]==='jerarquias'))sections.splice(idx>=0?idx+1:Math.max(0,sections.findIndex(s=>s[0]==='estadisticas')+1),0,H_SECTION);
  const section=document.createElement('section');section.id='jerarquias';section.className='section';const power=document.getElementById('power'),evo=document.getElementById('evolucion');if(power)power.insertAdjacentElement('afterend',section);else if(evo)evo.insertAdjacentElement('beforebegin',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
function ensureHierarchyHome(){const inicio=document.getElementById('inicio');if(!inicio||document.getElementById('hierarchyHome'))return;const block=document.createElement('div');block.id='hierarchyHome';block.className='card h-home';const intel=document.getElementById('intelligenceHome');if(intel)intel.insertAdjacentElement('afterend',block);else inicio.appendChild(block)}
function renderHierarchyHome(){
  const root=document.getElementById('hierarchyHome');if(!root)return;const hot=hHottest(),clear=hClearest(),pressure=hPressure();
  root.innerHTML=`<div class="h-home-head"><div><div class="eyebrow">⌁ JERARQUÍAS PRO</div><h2>Quién tiene el puesto y quién está apretando</h2><p>Jerarquía, muestra y tendencia reciente en una sola lectura.</p></div><button class="btn" onclick="showSection('jerarquias')">Abrir mapa</button></div><div class="h-home-grid"><button onclick="showSection('jerarquias')"><span>🔥 Frontera más abierta</span><b>${hot?hEsc(hPositionCfg(hot.pos)?.label):'—'}</b><small>${hot?.challenger?`${hEsc(displayName(hot.boundary.p.name))} vs ${hEsc(displayName(hot.challenger.p.name))} · ${hot.gap.toFixed(2)}`:'Sin duelo calculable'}</small></button><button onclick="showSection('jerarquias')"><span>🔒 Frontera más clara</span><b>${clear?hEsc(hPositionCfg(clear.pos)?.label):'—'}</b><small>${clear?.challenger?`${hEsc(displayName(clear.boundary.p.name))} +${clear.gap.toFixed(2)}`:'Sin perseguidor'}</small></button><button onclick="showSection('jerarquias')"><span>↗ Quién más aprieta</span><b>${pressure?hEsc(displayName(pressure.row.p.name)):'—'}</b><small>${pressure?`${pressure.pos} · +${pressure.delta.toFixed(2)} en su última nota`:'Sin subida comparable'}</small></button></div>`;
}
function renderHierarchy(){
  const section=document.getElementById('jerarquias');if(!section)return;const hot=hHottest(),clear=hClearest(),best=hBestLeader(),pressure=hPressure(),counts=hTierCounts(),coverage=season()?.sourceAudit?.();const states=hAllSummaries().map(hPositionState),open=states.filter(x=>x.id==='open').length,clearCount=states.filter(x=>x.id==='clear').length;
  section.innerHTML=`<div class="section-head"><div><div class="eyebrow">JERARQUÍAS PRO</div><h2>Mapa de jerarquías por posición</h2><p>No solo ordena jugadores: muestra distancia, confianza de la muestra y presión reciente en cada puesto.</p></div><div class="h-mode"><button class="${hMode==='all'?'active':''}" onclick="setHierarchyMode('all')">Polivalencia</button><button class="${hMode==='primary'?'active':''}" onclick="setHierarchyMode('primary')">Rol principal</button></div></div>
  <div class="card h-method"><div><div class="eyebrow">ÍNDICE DE JERARQUÍA</div><h3>45% Power · 20% muestra · 20% forma · 15% nuestras decisiones</h3><p>El índice conserva la metodología del proyecto. La confianza de muestra se muestra aparte y nunca suma puntos al jugador.</p></div><div><b>Confianza ≠ probabilidad de ser titular</b><span>Solo indica cuánto respaldo tienen los datos que sostienen la frontera del puesto.</span><small>${coverage?.complete3||0} apariciones 3/3 · ${coverage?.partial2||0} apariciones 2+SC.</small></div></div>
  <div class="h-kpis"><div class="card"><span>🔥 Puestos abiertos</span><b>${open}</b><small>${hot?.challenger?`${hot.pos}: ${hEsc(displayName(hot.boundary.p.name))} / ${hEsc(displayName(hot.challenger.p.name))}`:'Sin frontera abierta'}</small></div><div class="card"><span>🔒 Jerarquías claras</span><b>${clearCount}</b><small>${clear?.challenger?`${clear.pos} · margen ${clear.gap.toFixed(2)}`:'Sin frontera clara'}</small></div><div class="card"><span>⭐ Índice más alto</span><b>${best?hEsc(displayName(best.known[0].p.name)):'—'}</b><small>${best?`${best.pos} · ${best.known[0].score.toFixed(2)}`:'—'}</small></div><div class="card"><span>↗ Mayor presión reciente</span><b>${pressure?hEsc(displayName(pressure.row.p.name)):'—'}</b><small>${pressure?`${pressure.pos} · +${pressure.delta.toFixed(2)} última nota`:'Sin subida comparable'}</small></div></div>
  <div class="h-legend"><span class="clear">Titular claro <b>${counts.clear}</b></span><span class="edge">Ventaja <b>${counts.edge}</b></span><span class="duel">Duelo abierto <b>${counts.duel}</b></span><span class="rotation">Rotación <b>${counts.rotation}</b></span><span class="depth">Fondo <b>${counts.depth}</b></span></div>
  <div class="section-head"><div><h2>Puesto a puesto</h2><p>En DFC y MC la frontera relevante es 2.º–3.º; en el resto, 1.º–2.º.</p></div></div><div class="h-position-grid">${H_POSITIONS.map(hPositionCard).join('')}</div>
  <div class="card h-board-card"><div class="section-head" style="margin-top:0"><div><h2>Matriz global</h2><p>Una vista rápida de titulares, ventajas, duelos, rotaciones y fondo de plantilla.</p></div></div>${hBoard()}</div>
  <div class="h-integrity"><b>Cómo leerlo</b><span>“Jerarquía clara” describe una ventaja interna del índice, no una predicción automática del once del entrenador. Rival, descanso, encaje táctico y disponibilidad siguen pudiendo cambiar una decisión.</span></div>`;
}
window.setHierarchyMode=function(mode){hMode=mode==='primary'?'primary':'all';renderHierarchy();renderHierarchyHome()};
window.hierarchyToRadar=function(pos){const s=hSummary(pos);if(!s.boundary||!s.challenger)return;showSection('radar');let n=0;const go=()=>{if(typeof window.setRadarPlayers==='function'){window.setRadarPlayers(s.boundary.p.name,s.challenger.p.name);return}if(n++<20)setTimeout(go,80)};go()};
window.hierarchyToCompare=function(pos){const s=hSummary(pos);if(!s.boundary||!s.challenger)return;showSection('comparador');let n=0;const go=()=>{const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=s.boundary.p.name;B.value=s.challenger.p.name;if(typeof window.renderCompare==='function')window.renderCompare();setTimeout(()=>window.RMComparePro?.render?.(),0);return}if(n++<20)setTimeout(go,80)};go()};
function install(){if(!season()||typeof sections==='undefined'||typeof players==='undefined'||typeof metricFor!=='function'||typeof openPlayerHub!=='function'){setTimeout(install,120);return}ensureHierarchy();ensureHierarchyHome();renderHierarchy();renderHierarchyHome();window.RMHierarchyPro=Object.freeze({render:renderHierarchy,summary:hSummary,state:pos=>hPositionState(hSummary(pos)),mode:()=>hMode})}
document.addEventListener('rm-ranking-official-ready',()=>{renderHierarchy();renderHierarchyHome()});
document.addEventListener('rm-season-data-ready',()=>{renderHierarchy();renderHierarchyHome()});
install();
})();