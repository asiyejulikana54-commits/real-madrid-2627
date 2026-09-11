(()=>{
const DATA_TABS=[
  {id:'power',label:'Power',icon:'⚡'},
  {id:'estadisticas',label:'Tabla',icon:'▥'},
  {id:'evolucion',label:'Evolución',icon:'↗'},
  {id:'jerarquias',label:'Jerarquías',icon:'⌁'}
];
let refineTimer=null,installed=false;

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function compactRole(role){const parts=String(role||'').split('·');return (parts.length>1?parts.slice(1).join('·'):parts[0]).trim()}
function metricForName(name){const p=players.find(x=>x.name===name);if(!p)return {player:null,metric:null,rating:null,power:null,rank:null};const metric=metricFor(p),rating=currentRating(metric);const sample=metric?Math.min(metric.minutes,450)/450:0;const power=rating===null?null:rating*(.75+.25*sample);let rank=null;if(typeof phRows==='function'){const rows=phRows(),idx=rows.findIndex(r=>r.player.name===name);if(idx>=0)rank=idx+1}return {player:p,metric,rating,power,rank}}

function addDataTabs(){
  DATA_TABS.forEach(tab=>{
    const section=document.getElementById(tab.id);if(!section||section.querySelector(':scope > .ux-data-tabs'))return;
    const nav=document.createElement('nav');nav.className='ux-data-tabs';nav.setAttribute('aria-label','Secciones de datos');
    nav.innerHTML=DATA_TABS.map(t=>`<button class="${t.id===tab.id?'active':''}" onclick="showSection('${t.id}')"><span>${t.icon}</span><b>${t.label}</b></button>`).join('');
    section.prepend(nav);
  });
}

function refineHome(){
  const root=document.getElementById('intelligenceHome');if(!root)return;
  if(!root.querySelector('.ux-intel-more')){
    const main=root.querySelector('.intel-main-grid'),status=root.querySelector('.intel-status');
    if(main||status){
      const details=document.createElement('details');details.className='ux-intel-more';
      details.innerHTML='<summary><div><span>Análisis ampliado</span><b>XI por datos, comunidad y estado de señales</b></div><strong>+</strong></summary><div class="ux-intel-more-body"></div>';
      const anchor=root.querySelector('.intel-decisions-head');
      if(anchor)anchor.insertAdjacentElement('beforebegin',details);else root.appendChild(details);
      const body=details.querySelector('.ux-intel-more-body');if(main)body.appendChild(main);if(status)body.appendChild(status);
    }
  }
  const head=root.querySelector('.intel-head p');if(head)head.classList.add('ux-secondary-copy');
}

function refinePlayerCards(){
  document.querySelectorAll('#playersGrid .player').forEach(card=>{
    if(card.dataset.uxV2==='1')return;
    const name=card.querySelector('h3')?.textContent?.trim();const data=metricForName(name);if(!data.player)return;
    const p=data.player,m=data.metric;
    card.dataset.uxV2='1';card.classList.add('ux-player-card','player-clickable');card.tabIndex=0;
    card.innerHTML=`<div class="ux-player-top"><span>${esc(p.pos)} · ${esc(p.eligible.join('/'))}</span><b>${data.power===null?'Sin Power':`P ${data.power.toFixed(2)}`}</b></div><h3>${esc(p.short||p.name)}</h3><p>${esc(compactRole(p.role))}</p><div class="ux-player-numbers"><span><small>Media</small><b>${data.rating===null?'—':data.rating.toFixed(2)}</b></span><span><small>Minutos</small><b>${m?m.minutes:'—'}</b></span></div><div class="ux-player-foot"><span>${data.rank?`#${data.rank} Power`:'Pendiente'}</span><b>Ver ficha →</b></div>`;
    card.onclick=()=>openPlayerHub(p.name);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPlayerHub(p.name)}};
  });
}

function wrapNode(node,label,sub,className){
  const classes=String(className||'').split(/\s+/).filter(Boolean),marker=classes.at(-1);if(!node||(marker&&node.closest(`.${marker}`)))return null;
  const details=document.createElement('details');details.className=className;
  details.innerHTML=`<summary><div><b>${esc(label)}</b>${sub?`<span>${esc(sub)}</span>`:''}</div><strong>+</strong></summary>`;
  node.replaceWith(details);details.appendChild(node);return details;
}

function refinePlayerSheet(){
  const content=document.getElementById('playerHubContent');const head=content?.querySelector('.player-sheet-head');if(!content||!head)return;
  const name=head.querySelector('h2')?.textContent?.trim(),data=metricForName(name);if(!data.player)return;
  if(!content.querySelector('#uxPlayerQuick')){
    const quick=document.createElement('div');quick.id='uxPlayerQuick';quick.className='ux-player-quick';
    quick.innerHTML=`<div><span>Power</span><b>${data.power===null?'—':data.power.toFixed(2)}</b><small>${data.rank?`#${data.rank}`:'Sin ranking'}</small></div><div><span>Media</span><b>${data.rating===null?'—':data.rating.toFixed(2)}</b><small>Actual</small></div><div><span>Minutos</span><b>${data.metric?data.metric.minutes:'—'}</b><small>Acumulados</small></div><div><span>Min/punto</span><b>${data.metric?data.metric.minPerPoint.toFixed(2):'—'}</b><small>Menor = mejor</small></div>`;
    head.insertAdjacentElement('afterend',quick);
  }
  const tags=content.querySelector('.player-sheet-tags'),metrics=content.querySelector('.player-metrics'),sample=content.querySelector('.sample-card'),info=content.querySelector('.player-info-grid');
  if((tags||metrics||sample||info)&&!content.querySelector('#uxPlayerMetricsMore')){
    const details=document.createElement('details');details.id='uxPlayerMetricsMore';details.className='ux-player-section ux-player-metrics-more';
    details.innerHTML='<summary><div><b>Métricas completas</b><span>Aporte, muestra, posiciones y estado</span></div><strong>+</strong></summary><div class="ux-player-detail-body"></div>';
    const actions=content.querySelector('.player-sheet-actions');if(actions)actions.insertAdjacentElement('beforebegin',details);else content.appendChild(details);
    const body=details.querySelector('.ux-player-detail-body');[tags,metrics,sample,info].filter(Boolean).forEach(n=>body.appendChild(n));
  }
  const history=content.querySelector('#playerPerformanceHistory');if(history&&!history.closest('.ux-history-wrap'))wrapNode(history,'Historial y evolución','Notas y minutos partido a partido','ux-player-section ux-history-wrap');
  const trajectory=content.querySelector('#aPlayerTrajectory');if(trajectory&&!trajectory.closest('.ux-trajectory-wrap'))wrapNode(trajectory,'Jerarquía de forma','Cómo cambia su puesto jornada a jornada','ux-player-section ux-trajectory-wrap');
}

function refinePower(){
  const section=document.getElementById('power');if(!section)return;
  const formula=section.querySelector('.power-formula');if(formula&&!formula.closest('.ux-power-method'))wrapNode(formula,'Cómo se calcula Power RM','Fórmula y fiabilidad de muestra','ux-panel-details ux-power-method');
  const podium=section.querySelector('.power-podium');if(podium)podium.classList.add('ux-power-top');
  const table=section.querySelector('.power-table');if(table&&!table.closest('.ux-power-ranking')){
    const card=table.closest('.card');if(card){const d=wrapNode(card,'Clasificación completa','Todos los jugadores y métricas','ux-panel-details ux-power-ranking');if(d&&window.innerWidth>1050)d.open=true}
  }
}

function refineStats(){
  const section=document.getElementById('estadisticas');if(!section)return;
  const method=[...section.querySelectorAll('.grid.cols-3')].find(g=>g.querySelector('.eyebrow'));
  if(method&&!method.closest('.ux-stats-method'))wrapNode(method,'Cómo leer las estadísticas','Fuentes, aporte y eficiencia','ux-panel-details ux-stats-method');
  section.querySelector('.table-wrap')?.classList.add('ux-main-table');
}

function refineEvolution(){
  const section=document.getElementById('evolucion');if(!section)return;
  const method=section.querySelector('.a-method');if(method&&!method.closest('.ux-evo-method'))wrapNode(method,'Metodología','Qué es histórico y qué es acumulado','ux-panel-details ux-evo-method');
  const matchStats=section.querySelector('#aMatchStats');if(!matchStats||section.querySelector('.ux-evo-more'))return;
  let nodes=[],n=matchStats.nextElementSibling;while(n){nodes.push(n);n=n.nextElementSibling}
  nodes=nodes.filter(x=>!x.classList.contains('ux-evo-more'));
  if(nodes.length){
    const details=document.createElement('details');details.className='ux-panel-details ux-evo-more';details.innerHTML='<summary><div><b>Tendencias de temporada</b><span>Jerarquías, movimientos y matriz completa</span></div><strong>+</strong></summary><div class="ux-evo-more-body"></div>';
    matchStats.insertAdjacentElement('afterend',details);const body=details.querySelector('.ux-evo-more-body');nodes.forEach(x=>body.appendChild(x));
  }
}

function refineHierarchy(){
  const section=document.getElementById('jerarquias');if(!section)return;
  const method=section.querySelector('.h-method');if(method&&!method.closest('.ux-h-method'))wrapNode(method,'Cómo se calcula la jerarquía','Power, minutos, forma y decisiones','ux-panel-details ux-h-method');
}

function syncDataTabs(){
  const active=document.querySelector('.section.active')?.id;document.querySelectorAll('.ux-data-tabs button').forEach(b=>b.classList.toggle('active',(b.getAttribute('onclick')||'').includes(`'${active}'`)));
}

function runRefine(){
  if(!document.body.classList.contains('ux-clean'))return;
  addDataTabs();refineHome();refinePlayerCards();refinePlayerSheet();refinePower();refineStats();refineEvolution();refineHierarchy();syncDataTabs();
}
function schedule(){clearTimeout(refineTimer);refineTimer=setTimeout(runRefine,40)}
function install(){
  if(installed)return;if(typeof players==='undefined'||typeof showSection!=='function'||!document.body.classList.contains('ux-clean')){setTimeout(install,100);return}
  installed=true;document.body.classList.add('ux-refined');
  const prev=showSection;showSection=function(id){prev(id);setTimeout(()=>{runRefine();syncDataTabs()},30)};
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',schedule,{passive:true});runRefine();
}
setTimeout(install,120);
})();
