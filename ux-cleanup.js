(()=>{
const UX_GROUPS=[
  {label:'Resumen',ids:['inicio','partido']},
  {label:'Equipo',ids:['plantilla','power','jerarquias']},
  {label:'Rendimiento',ids:['estadisticas','evolucion','partidos','mvp']},
  {label:'Decisiones',ids:['radar','comparador']},
  {label:'Comunidad',ids:['mi-liga','comunidad','prediccion']}
];
const UX_PRIMARY=[
  {id:'inicio',icon:'⌂',label:'Inicio'},
  {id:'partido',icon:'⚽',label:'Partido'},
  {id:'plantilla',icon:'◉',label:'Equipo'},
  {id:'mi-liga',icon:'🏆',label:'Mi Liga'}
];
const UX_REQUIRED=[];
let uxInstalled=false;

function uxSection(id){return sections.find(s=>s[0]===id)}
function uxEsc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function uxActive(){return document.querySelector('.section.active')?.id||'inicio'}
function uxGroupFor(id){return UX_GROUPS.find(g=>g.ids.includes(id))?.label||'Análisis'}

function desktopNav(){
  return UX_GROUPS.map(group=>{
    const items=group.ids.map(uxSection).filter(Boolean);
    if(!items.length)return '';
    return `<div class="ux-nav-group"><div class="ux-nav-label">${group.label}</div>${items.map(s=>`<button data-section="${s[0]}" onclick="${s[0]==='mi-liga'?'openMiLiga()':`showSection('${s[0]}')`}"><span>${s[1]}</span><em>${s[2]}</em></button>`).join('')}</div>`;
  }).join('');
}
function renderNavs(){
  const desk=document.getElementById('navDesktop'),mobile=document.getElementById('navMobile');
  if(desk)desk.innerHTML=desktopNav();
  if(mobile){
    const direct=UX_PRIMARY.filter(x=>uxSection(x.id)).map(x=>`<button data-section="${x.id}" onclick="${x.id==='mi-liga'?'openMiLiga()':`showSection('${x.id}')`}"><b>${x.icon}</b><small>${x.label}</small></button>`).join('');
    mobile.innerHTML=direct;
    mobile.style.gridTemplateColumns='repeat(4,1fr)';
  }
  syncNav(uxActive());
}
function syncNav(id){
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  const eyebrow=document.querySelector('.topbar .eyebrow');if(eyebrow)eyebrow.textContent=`Real Madrid · ${uxGroupFor(id)}`;
}

function ensureMoreSheet(){
  if(document.getElementById('uxMoreSheet'))return;
  const wrap=document.createElement('div');wrap.id='uxMoreSheet';wrap.className='ux-sheet';
  wrap.innerHTML=`<div class="ux-sheet-backdrop" onclick="closeUxMore()"></div><div class="ux-sheet-panel"><div class="ux-sheet-head"><div><div class="eyebrow">NAVEGACIÓN</div><h2>Todo el panel</h2></div><button onclick="closeUxMore()" aria-label="Cerrar">×</button></div><div class="ux-sheet-groups">${UX_GROUPS.map(group=>{const items=group.ids.map(uxSection).filter(Boolean);return items.length?`<section><h3>${group.label}</h3><div>${items.map(s=>`<button data-section="${s[0]}" onclick="${s[0]==='mi-liga'?'openMiLiga()':`showSection('${s[0]}')`}"><span>${s[1]}</span><b>${uxEsc(s[2])}</b><small>${uxEsc(s[4])}</small></button>`).join('')}</div></section>`:''}).join('')}</div><div class="ux-sheet-tools"><span>Ayuda, aplicación y datos</span><button onclick="openHowRM()">? Cómo funciona la web</button><button id="uxInstallApp" onclick="uxInstallRM()">⬇ Instalar RM 26/27</button><button onclick="exportData();closeUxMore()">⇩ Exportar datos</button><button onclick="document.getElementById('importFile')?.click();closeUxMore()">⇧ Importar datos</button></div></div>`;
  document.body.appendChild(wrap);
}
function refreshMoreSheet(){
  const current=document.getElementById('uxMoreSheet'),wasOpen=current?.classList.contains('open');if(current)current.remove();ensureMoreSheet();if(wasOpen)document.getElementById('uxMoreSheet')?.classList.add('open');
}
window.openUxMore=function(){ensureMoreSheet();document.getElementById('uxMoreSheet')?.classList.add('open');document.body.classList.add('ux-sheet-open');syncNav(uxActive())};
window.closeUxMore=function(){document.getElementById('uxMoreSheet')?.classList.remove('open');document.body.classList.remove('ux-sheet-open')};
window.openHowRM=function(){
  closeUxMore();
  if(window.RMSiteGuide?.openOverview){window.RMSiteGuide.openOverview();return}
  let tries=0;const open=()=>{if(window.RMSiteGuide?.openOverview){window.RMSiteGuide.openOverview();return}if(++tries<15)setTimeout(open,100);else if(typeof toast==='function')toast('La guía todavía se está cargando')};open();
};
window.uxInstallRM=function(){
  closeUxMore();
  if(window.RMPWA?.install){window.RMPWA.install();return}
  setTimeout(()=>{if(window.RMPWA?.install)window.RMPWA.install();else if(typeof toast==='function')toast('Abre esta página en Chrome y usa ⋮ → Añadir a pantalla de inicio')},250);
};

function simplifyTopbar(){
  const actions=document.querySelector('.topbar .actions');if(!actions||actions.dataset.uxClean)return;actions.dataset.uxClean='1';
  [...actions.children].forEach(el=>{
    const click=el.getAttribute?.('onclick')||'';
    if(click.includes('exportData')||el.getAttribute?.('for')==='importFile'||el.id==='importFile')el.classList.add('ux-hidden-tool');
  });
  const prediction=[...actions.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("prediccion"));
  if(prediction)prediction.textContent='Predecir XI';
  if(!actions.querySelector('.ux-top-more')){const more=document.createElement('button');more.className='btn ux-top-more';more.textContent='•••';more.setAttribute('aria-label','Más opciones');more.onclick=openUxMore;actions.appendChild(more)}
}

function simplifyHero(){
  const box=document.querySelector('#inicio .focus-box');if(!box||box.tagName==='DETAILS'||box.dataset.uxClean)return;box.dataset.uxClean='1';
  const details=document.createElement('details');details.className='focus-box ux-focus';
  const title=box.querySelector('h3')?.textContent||'Debates del próximo partido';
  details.innerHTML=`<summary><span>${uxEsc(title)}</span><b>Ver debates</b></summary>`;
  const list=box.querySelector('.focus-list');if(list)details.appendChild(list);
  box.replaceWith(details);if(window.innerWidth>780)details.open=true;
}

function simplifyHome(){
  const inicio=document.getElementById('inicio');if(!inicio||document.getElementById('uxHomeMore'))return;
  const details=document.createElement('details');details.id='uxHomeMore';details.className='ux-home-more';
  details.innerHTML='<summary><div><span>Más información</span><b>Power, jerarquías, comunidad, método y notas</b></div><strong>+</strong></summary><div class="ux-home-more-body"></div>';
  inicio.appendChild(details);const body=details.querySelector('.ux-home-more-body');
  const candidates=[document.getElementById('powerHome'),document.getElementById('hierarchyHome'),document.getElementById('homeVsCommunity'),document.getElementById('ratingBars')?.closest('.grid.cols-2'),[...inicio.children].find(el=>el.classList?.contains('grid')&&el.classList?.contains('cols-4'))].filter(Boolean);
  [...new Set(candidates)].forEach(el=>body.appendChild(el));
}

function cleanDenseCards(){document.querySelectorAll('.section-head p').forEach(p=>p.classList.add('ux-support-copy'));document.querySelectorAll('.card').forEach(c=>c.classList.add('ux-card'))}
function refreshUi(){simplifyTopbar();simplifyHero();simplifyHome();cleanDenseCards();renderNavs();syncNav(uxActive())}
function loadRefineLayer(){
  if(!document.querySelector('link[data-ux-refine]')){const link=document.createElement('link');link.rel='stylesheet';link.href='ux-refine.css?v=3';link.dataset.uxRefine='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-ux-refine]')){const script=document.createElement('script');script.src='ux-refine.js?v=3';script.dataset.uxRefine='1';document.body.appendChild(script)}
}
function loadVisualLayer(){if(document.querySelector('script[data-visual-system]'))return;const script=document.createElement('script');script.src='visual-system.js?v=4';script.dataset.visualSystem='1';document.body.appendChild(script)}
function loadPublicLayer(){
  if(!document.querySelector('link[data-public-polish]')){const link=document.createElement('link');link.rel='stylesheet';link.href='public-polish.css?v=6';link.dataset.publicPolish='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-public-polish]')){const script=document.createElement('script');script.src='public-polish.js?v=11';script.dataset.publicPolish='1';document.body.appendChild(script)}
}
function loadCompareLifecycle(){
  if(!document.querySelector('link[data-compare-lifecycle]')){const link=document.createElement('link');link.rel='stylesheet';link.href='compare-lifecycle.css?v=1';link.dataset.compareLifecycle='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-compare-lifecycle]')){const script=document.createElement('script');script.src='compare-lifecycle.js?v=1';script.dataset.compareLifecycle='1';document.body.appendChild(script)}
}

function install(){
  if(uxInstalled)return;
  if(typeof sections==='undefined'||typeof showSection!=='function'||!UX_REQUIRED.every(id=>sections.some(s=>s[0]===id))){setTimeout(install,80);return}
  uxInstalled=true;document.body.classList.add('ux-clean');ensureMoreSheet();refreshUi();
  const previousShow=showSection;showSection=function(id){previousShow(id);closeUxMore();renderNavs();syncNav(id);setTimeout(cleanDenseCards,0);if(id==='comparador'||id==='radar')setTimeout(()=>window.RMCompareLifecycle?.refresh?.(),0)};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeUxMore()});
  document.addEventListener('rm-modules-ready',()=>{refreshMoreSheet();refreshUi()});
  document.addEventListener('rm-ranking-official-ready',()=>setTimeout(cleanDenseCards,0));
  document.addEventListener('rm-community-updated',()=>setTimeout(refreshUi,0));
  [20,120,350,900,2200].forEach(ms=>setTimeout(refreshUi,ms));
  loadRefineLayer();loadVisualLayer();loadPublicLayer();loadCompareLifecycle();
}
setTimeout(install,10);
})();