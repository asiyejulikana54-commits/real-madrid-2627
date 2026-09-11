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
const H_HISTORY={
  malaga:{'Bellingham':8.8,'Mbappé':8.7,'Trent Alexander-Arnold':8.5,'Vini Jr.':8.3,'Camavinga':7.8,'Cucurella':7.7,'Huijsen':7.5,'Diomande':6.6},
  'real-sociedad':{'Mbappé':9.8,'Bellingham':9.0,'Vini Jr.':8.6,'Arda Güler':8.2,'Valverde':8.1,'Huijsen':7.8},
  espanyol:{'Arda Güler':8.6,'Bellingham':8.3,'Valverde':8.1,'Konaté':7.7,'Mbappé':7.4,'Diomande':6.0},
  betis:{'Vini Jr.':7.8,'Arda Güler':7.5,'Huijsen':7.5,'Bellingham':7.4,'Cucurella':6.8,'Mbappé':6.7,'Courtois':6.7,'Valverde':6.6,'Konaté':6.6,'Dumfries':6.6,'Camavinga':6.1},
  inter:{}
};
const H_MATCH_ORDER=['malaga','real-sociedad','espanyol','betis','inter'];
let hMode='all';

function hEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function hMetric(p){return metricFor(p)}
function hRating(p){const m=hMetric(p);return currentRating(m)}
function hPower(p){const m=hMetric(p),r=hRating(p);if(!m||r===null)return null;const sample=Math.min(m.minutes,450)/450;return r*(.75+.25*sample)}
function hRecent(p){const values=H_MATCH_ORDER.map(id=>H_HISTORY[id]?.[p.name]).filter(v=>typeof v==='number').slice(-3);return values.length?{value:values.reduce((a,b)=>a+b,0)/values.length,n:values.length}:null}
function hDecision(p,pos){const cfg=H_POSITIONS.find(x=>x.id===pos);if(!cfg)return 0;const inXI=xi=>cfg.slots.some(s=>xi?.[s]===p.name);return ((inXI(baseXI)?1:0)+(inXI(rayoXI)?1:0))/2*10}
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
function hTier(row,index,known){
  if(row.score===null)return {id:'depth',label:'Fondo de plantilla',className:'depth'};
  if(index===0){
    const gap=known[1]?row.score-known[1].score:99;
    if(gap>=.75&&row.decision>=5)return {id:'clear',label:'Titular claro',className:'clear'};
    if(gap>=.35)return {id:'edge',label:'Ventaja',className:'edge'};
    return {id:'duel',label:'Duelo abierto',className:'duel'};
  }
  const gap=known[0]?known[0].score-row.score:99;
  if(gap<=.45)return {id:'duel',label:'Duelo abierto',className:'duel'};
  if(index<=2||gap<=1.20)return {id:'rotation',label:'Rotación',className:'rotation'};
  return {id:'depth',label:'Fondo de plantilla',className:'depth'};
}
function hPositionData(pos){
  const rows=hCandidates(pos),known=rows.filter(x=>x.score!==null);return rows.map((r,i)=>({...r,tier:hTier(r,i,known)}));
}
function hPositionSummary(pos){const known=hKnown(pos);if(!known.length)return {pos,gap:null,leader:null};return {pos,gap:known[1]?known[0].score-known[1].score:null,leader:known[0],second:known[1]||null}}
function hAllSummaries(){return H_POSITIONS.map(p=>hPositionSummary(p.id))}
function hHottest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>a.gap-b.gap)[0]||null}
function hClearest(){return hAllSummaries().filter(x=>x.gap!==null).sort((a,b)=>b.gap-a.gap)[0]||null}
function hBestLeader(){return hAllSummaries().filter(x=>x.leader).sort((a,b)=>b.leader.score-a.leader.score)[0]||null}
function hMultiLeader(){
  const leaders=hAllSummaries().filter(x=>x.leader).map(x=>({pos:x.pos,name:x.leader.p.name,score:x.leader.score}));const by={};leaders.forEach(x=>(by[x.name]??=[]).push(x));
  return Object.entries(by).map(([name,rows])=>({name,rows})).filter(x=>x.rows.length>1).sort((a,b)=>b.rows.length-a.rows.length||Math.max(...b.rows.map(x=>x.score))-Math.max(...a.rows.map(x=>x.score)))[0]||null;
}
function hTierCounts(){const counts={clear:0,edge:0,duel:0,rotation:0,depth:0};H_POSITIONS.forEach(p=>hPositionData(p.id).forEach(r=>counts[r.tier.id]++));return counts}
function hSignalBar(value,label){const pct=value===null?0:Math.max(0,Math.min(100,value*10));return `<div class="h-signal"><span>${label}</span><i><b style="width:${pct}%"></b></i><strong>${value===null?'—':value.toFixed(1)}</strong></div>`}
function hPlayerRow(row,index,known){
  const name=row.p.short||row.p.name,minutes=row.metric?.minutes??null,recent=row.recent?.value??null;
  return `<button class="h-player ${row.tier.className}" onclick="openPlayerHub('${row.p.name.replace(/'/g,"\\'")}')"><div class="h-player-main"><span class="h-rank">${row.score===null?'—':index+1}</span><div><b>${hEsc(name)}</b><small>${hEsc(row.p.eligible.join(' · '))}</small></div><strong>${row.score===null?'—':row.score.toFixed(2)}</strong></div><div class="h-player-meta"><span class="h-tier ${row.tier.className}">${row.tier.label}</span><span>${row.power===null?'Power —':`Power ${row.power.toFixed(2)}`}</span><span>${minutes===null?'Min —':`${minutes} min`}</span><span>${recent===null?'Forma —':`Forma ${recent.toFixed(2)}`}</span></div></button>`;
}
function hPositionCard(cfg){
  const rows=hPositionData(cfg.id),known=rows.filter(x=>x.score!==null),leader=known[0],second=known[1],gap=leader&&second?leader.score-second.score:null;
  return `<article class="card h-position-card"><div class="h-position-head"><div><span>${cfg.id}</span><h3>${hEsc(cfg.label)}</h3></div><div>${leader?`<b>${hEsc(leader.p.short||leader.p.name)}</b><small>${gap===null?'Sin perseguidor':`+${gap.toFixed(2)} sobre el 2º`}</small>`:'<b>Sin datos</b><small>Pendiente</small>'}</div></div><div class="h-position-list">${rows.length?rows.map((r,i)=>hPlayerRow(r,i,known)).join(''):'<div class="h-empty">Sin jugadores en esta vista.</div>'}</div></article>`;
}
function hBoard(){
  const tiers=[['clear','Titular claro'],['edge','Ventaja'],['duel','Duelo abierto'],['rotation','Rotación'],['depth','Fondo']];
  return `<div class="h-board"><div class="h-board-head"><span>Nivel</span>${H_POSITIONS.map(p=>`<span>${p.id}</span>`).join('')}</div>${tiers.map(([id,label])=>`<div class="h-board-row ${id}"><strong>${label}</strong>${H_POSITIONS.map(pos=>{const rows=hPositionData(pos.id).filter(r=>r.tier.id===id);return `<div>${rows.map(r=>`<button onclick="openPlayerHub('${r.p.name.replace(/'/g,"\\'")}')"><span>${hEsc(r.p.short||r.p.name)}</span><small>${r.score===null?'—':r.score.toFixed(2)}</small></button>`).join('')||'<i>—</i>'}</div>`}).join('')}</div>`).join('')}</div>`;
}
function ensureHierarchy(){
  if(document.getElementById('jerarquias'))return;const idx=sections.findIndex(s=>s[0]==='power');if(!sections.some(s=>s[0]==='jerarquias'))sections.splice(idx>=0?idx+1:Math.max(0,sections.findIndex(s=>s[0]==='estadisticas')+1),0,H_SECTION);
  const section=document.createElement('section');section.id='jerarquias';section.className='section';const power=document.getElementById('power'),evo=document.getElementById('evolucion');if(power)power.insertAdjacentElement('afterend',section);else if(evo)evo.insertAdjacentElement('beforebegin',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
function ensureHierarchyHome(){
  const inicio=document.getElementById('inicio');if(!inicio||document.getElementById('hierarchyHome'))return;const block=document.createElement('div');block.id='hierarchyHome';block.className='card h-home';const intel=document.getElementById('intelligenceHome');if(intel)intel.insertAdjacentElement('afterend',block);else inicio.appendChild(block);
}
function renderHierarchyHome(){
  const root=document.getElementById('hierarchyHome');if(!root)return;const hot=hHottest(),clear=hClearest(),multi=hMultiLeader();
  root.innerHTML=`<div class="h-home-head"><div><div class="eyebrow">⌁ MAPA DE JERARQUÍAS</div><h2>Quién tiene el puesto y dónde hay pelea</h2><p>Lectura posicional del Power, la muestra, la forma y nuestras decisiones.</p></div><button class="btn" onclick="showSection('jerarquias')">Abrir mapa</button></div><div class="h-home-grid"><button onclick="showSection('jerarquias')"><span>🔥 Puesto más abierto</span><b>${hot?hEsc(H_POSITIONS.find(p=>p.id===hot.pos)?.label):'—'}</b><small>${hot?.second?`${hEsc(hot.leader.p.short||hot.leader.p.name)} vs ${hEsc(hot.second.p.short||hot.second.p.name)} · ${hot.gap.toFixed(2)} pts`:'Sin duelo calculable'}</small></button><button onclick="showSection('jerarquias')"><span>🔒 Mayor ventaja</span><b>${clear?hEsc(clear.leader.p.short||clear.leader.p.name):'—'}</b><small>${clear?.gap!==null?`${clear.pos} · +${clear.gap.toFixed(2)} sobre el segundo`:'Sin perseguidor'}</small></button><button onclick="showSection('jerarquias')"><span>♜ Polivalencia dominante</span><b>${multi?hEsc(displayName(multi.name)):'—'}</b><small>${multi?`Lidera ${multi.rows.map(x=>x.pos).join(' · ')}`:'Nadie lidera dos puestos'}</small></button></div>`;
}
function renderHierarchy(){
  const section=document.getElementById('jerarquias');if(!section)return;const hot=hHottest(),clear=hClearest(),best=hBestLeader(),multi=hMultiLeader(),counts=hTierCounts();
  section.innerHTML=`<div class="section-head"><div><h2>Mapa de jerarquías por posición</h2><p>Cada jugador aparece en todas las demarcaciones en las que es elegible. El mapa no decide el once: muestra quién tiene ventaja y dónde el puesto sigue abierto.</p></div><div class="h-mode"><button class="${hMode==='all'?'active':''}" onclick="setHierarchyMode('all')">Polivalencia</button><button class="${hMode==='primary'?'active':''}" onclick="setHierarchyMode('primary')">Rol principal</button></div></div>
  <div class="card h-method"><div><div class="eyebrow">ÍNDICE DE JERARQUÍA</div><h3>45% Power · 20% minutos · 20% forma · 15% nuestras decisiones</h3><p>Power y minutos vienen del acumulado actual. La forma usa solo notas históricas confirmadas. “Nuestras decisiones” mide si el jugador aparece en ese puesto en el XI base y/o en la idea del próximo partido.</p></div><div><b>Sin datos inventados</b><span>Si un jugador no tiene forma histórica, ese 20% se redistribuye proporcionalmente entre las señales disponibles.</span><small>Sin Power/minutos suficientes, queda visible pero sin puntuación.</small></div></div>
  <div class="h-kpis"><div class="card"><span>🔥 Puesto más abierto</span><b>${hot?hEsc(hot.pos):'—'}</b><small>${hot?.second?`${hEsc(displayName(hot.leader.p.name))} / ${hEsc(displayName(hot.second.p.name))} · ${hot.gap.toFixed(2)}`:'Sin duelo'}</small></div><div class="card"><span>🔒 Jerarquía más clara</span><b>${clear?hEsc(displayName(clear.leader.p.name)):'—'}</b><small>${clear?.gap!==null?`${clear.pos} · margen ${clear.gap.toFixed(2)}`:'Sin segundo'}</small></div><div class="card"><span>⭐ Líder más fuerte</span><b>${best?hEsc(displayName(best.leader.p.name)):'—'}</b><small>${best?`${best.pos} · índice ${best.leader.score.toFixed(2)}`:'—'}</small></div><div class="card"><span>♜ Líder polivalente</span><b>${multi?hEsc(displayName(multi.name)):'—'}</b><small>${multi?multi.rows.map(x=>x.pos).join(' · '):'Nadie lidera 2 puestos'}</small></div></div>
  <div class="h-legend"><span class="clear">Titular claro <b>${counts.clear}</b></span><span class="edge">Ventaja <b>${counts.edge}</b></span><span class="duel">Duelo abierto <b>${counts.duel}</b></span><span class="rotation">Rotación <b>${counts.rotation}</b></span><span class="depth">Fondo <b>${counts.depth}</b></span></div>
  <div class="section-head"><div><h2>Jerarquía puesto a puesto</h2><p>Toca cualquier jugador para abrir su ficha completa.</p></div></div><div class="h-position-grid">${H_POSITIONS.map(hPositionCard).join('')}</div>
  <div class="card h-board-card"><div class="section-head" style="margin-top:0"><div><h2>Matriz global de jerarquía</h2><p>La misma información vista como niveles, para localizar rápidamente titulares, duelos y rotaciones.</p></div></div>${hBoard()}</div>
  <div class="h-integrity"><b>Cómo leer el mapa</b><span>“Titular claro” exige una ventaja real y presencia en nuestras referencias de XI. “Ventaja” indica líder, pero sin ruptura total. “Duelo abierto” aparece cuando los candidatos están muy próximos. “Rotación” y “Fondo” describen la situación actual, no el potencial futuro.</span></div>`;
}
window.setHierarchyMode=function(mode){hMode=mode==='primary'?'primary':'all';renderHierarchy();renderHierarchyHome()};
function install(){if(typeof sections==='undefined'||typeof players==='undefined'||typeof metricFor!=='function'||typeof openPlayerHub!=='function'){setTimeout(install,120);return}ensureHierarchy();ensureHierarchyHome();renderHierarchy();renderHierarchyHome()}
install();
})();
