(()=>{
const KEY='rm_simple_experience_v1';
let installed=false,attempts=0,wrapped=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function mode(){try{return localStorage.getItem(KEY)==='pro'?'pro':'simple'}catch{return 'simple'}}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length===11,false)}
function active(){return document.querySelector('.section.active')?.id||'inicio'}
function sectionExists(id){return Boolean(document.getElementById(id))}
function go(id){safe(()=>showSection(id))}
function currentReview(){return safe(()=>window.RMPostXiCenter?.state?.(),null)}
function navItems(){
  const done=official();
  return [
    {id:'inicio',icon:'⌂',label:'Inicio'},
    {id:'partido',icon:'⚽',label:'Partido'},
    {id:'prediccion',icon:'★',label:done?'Revisar':'Predecir'},
    {id:'plantilla',icon:'◉',label:'Equipo'},
    {id:'mi-temporada',icon:'◎',label:'Mi temporada'}
  ].filter(x=>sectionExists(x.id));
}
function patchDesktop(){
  if(mode()!=='simple')return;
  const nav=document.getElementById('navDesktop');if(!nav)return;
  const items=navItems();
  nav.innerHTML=`<div class="ux-nav-group sx-primary-nav"><div class="ux-nav-label">Principal</div>${items.map(x=>`<button data-section="${x.id}" onclick="showSection('${x.id}')"><span>${x.icon}</span><em>${x.label}</em></button>`).join('')}<button class="sx-more-nav" type="button" onclick="openUxMore()"><span>☰</span><em>Más análisis</em></button></div>`;
}
function patchMobile(){
  if(mode()!=='simple')return;
  const nav=document.getElementById('navMobile');if(!nav)return;
  const done=official(),items=[
    {id:'inicio',icon:'⌂',label:'Inicio'},
    {id:'partido',icon:'⚽',label:'Partido'},
    {id:'prediccion',icon:'★',label:done?'Revisar':'Predecir'},
    {id:'plantilla',icon:'◉',label:'Equipo'}
  ].filter(x=>sectionExists(x.id));
  nav.innerHTML=`${items.map(x=>`<button data-section="${x.id}" onclick="showSection('${x.id}')"><b>${x.icon}</b><small>${x.label}</small></button>`).join('')}<button class="ux-more-tab" id="uxMoreTab" onclick="openUxMore()"><b>☰</b><small>Más</small></button>`;
}
function syncNav(){
  const id=active();document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  document.getElementById('uxMoreTab')?.classList.toggle('active',mode()==='simple'&&!navItems().some(x=>x.id===id));
}
function ensureModeToggle(){
  const tools=document.querySelector('#uxMoreSheet .ux-sheet-tools');if(!tools)return false;
  let btn=document.getElementById('sxModeToggle');
  if(!btn){btn=document.createElement('button');btn.id='sxModeToggle';tools.insertBefore(btn,tools.firstElementChild?.nextSibling||tools.firstChild)}
  btn.textContent=mode()==='simple'?'⚙ Ver modo PRO':'✓ Usar modo sencillo';
  btn.onclick=()=>setMode(mode()==='simple'?'pro':'simple');return true;
}
function setMode(next){
  const value=next==='pro'?'pro':'simple';try{localStorage.setItem(KEY,value)}catch{}
  document.body.classList.toggle('rm-simple-mode',value==='simple');document.body.classList.toggle('rm-pro-mode',value==='pro');
  document.dispatchEvent(new CustomEvent('rm-experience-mode-updated',{detail:{mode:value}}));
  document.dispatchEvent(new CustomEvent('rm-modules-ready'));
  setTimeout(apply,80);setTimeout(apply,260);
}
function introCopy(){
  const done=official(),review=currentReview(),user=review?.userScore,project=review?.projectScore;
  if(done){
    let score='';if(Number.isFinite(user)&&Number.isFinite(project))score=` Tu XI hizo ${user}/11 y Proyecto ${project}/11.`;else if(Number.isFinite(project))score=` Proyecto hizo ${project}/11.`;
    return {kicker:'XI OFICIAL DISPONIBLE',title:'El once ya está. Mira en segundos qué acertamos.',copy:`Empieza por la revisión rápida y, si quieres más detalle, entra después en el análisis completo.${score}`,primary:'Ver revisión',secondary:'Ver jugadores'};
  }
  return {kicker:'REAL MADRID 26/27 · FÁCIL DE USAR',title:'Empieza por lo importante. El análisis avanzado queda a un toque.',copy:'Haz tu predicción, consulta el equipo o entra al partido. Si quieres todos los datos, abre “Más”.',primary:'Hacer mi predicción',secondary:'Ver jugadores'};
}
function adaptIntro(){
  if(mode()!=='simple')return;
  const root=document.getElementById('publicIntro');if(!root)return;
  const c=introCopy();
  const kicker=root.querySelector('.public-kicker'),title=root.querySelector('.public-copy h2'),copy=root.querySelector('.public-copy>p');
  if(kicker)kicker.textContent=c.kicker;if(title)title.textContent=c.title;if(copy)copy.textContent=c.copy;
  const p=root.querySelector('#publicPredict'),s=root.querySelector('#publicPerformance');
  if(p){p.textContent=c.primary;p.onclick=()=>go('prediccion')}if(s){s.textContent=c.secondary;s.onclick=()=>go('plantilla')}
  const guide=root.querySelector('.public-guide');if(!guide)return;
  if(official()){
    guide.innerHTML=`<div class="public-guide-title">Tres accesos y listo</div><button data-sx-go="prediccion"><i>1</i><span><b>Revisa el XI oficial</b><small>Qué acertaste tú, qué acertó Proyecto y qué cambió.</small></span><strong>›</strong></button><button data-sx-go="partido"><i>2</i><span><b>Abre el partido</b><small>Once confirmado y centro del encuentro.</small></span><strong>›</strong></button><button data-sx-go="mi-temporada"><i>3</i><span><b>Mira tu temporada</b><small>Tu histórico, aciertos y aprendizaje personal.</small></span><strong>›</strong></button>`;
  }else{
    guide.innerHTML=`<div class="public-guide-title">Tres accesos y listo</div><button data-sx-go="prediccion"><i>1</i><span><b>Haz tu predicción</b><small>Elige 11 jugadores antes del cierre.</small></span><strong>›</strong></button><button data-sx-go="plantilla"><i>2</i><span><b>Mira el equipo</b><small>Jugadores, roles y estado actual.</small></span><strong>›</strong></button><button data-sx-go="comparador"><i>3</i><span><b>Compara dos jugadores</b><small>Una duda concreta, cara a cara.</small></span><strong>›</strong></button>`;
  }
  guide.querySelectorAll('[data-sx-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.sxGo)));
}
const TITLES={
  inicio:['Real Madrid 26/27','Lo importante primero. El análisis avanzado está en “Más”.'],
  partido:['Partido','Once, contexto y seguimiento del encuentro.'],
  plantilla:['Equipo','Jugadores, roles y rendimiento sin complicaciones.'],
  prediccion:['Predicción','Elige tu XI y comprueba después tus aciertos.'],
  comparador:['Comparar jugadores','Elige dos jugadores y mira las diferencias clave.'],
  estadisticas:['Estadísticas','Todos los datos de temporada, con muestra y contexto.'],
  power:['Rendimiento','Quién está rindiendo mejor y con qué muestra.'],
  once:['Crear un XI','Construye una alineación y guarda tus variantes.'],
  'mi-temporada':['Mi temporada','Tu histórico, aciertos, favoritos y aprendizaje.']
};
function adaptTopbar(){
  if(mode()!=='simple')return;const id=active(),t=TITLES[id];
  if(t){const h=document.getElementById('pageTitle'),s=document.getElementById('pageSub');if(h)h.textContent=id==='prediccion'&&official()?'Revisión del XI oficial':t[0];if(s)s.textContent=id==='prediccion'&&official()?'Comprueba qué acertaste y qué cambió respecto a las predicciones congeladas.':t[1]}
  const actions=document.querySelector('.topbar .actions');if(!actions)return;const prediction=[...actions.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('prediccion'));if(prediction)prediction.textContent=official()?'Ver revisión':'Predecir XI';
}
function adaptPrediction(){
  if(mode()!=='simple'||!official())return;const section=document.getElementById('prediccion');if(!section)return;
  const h=section.querySelector(':scope>.section-head h2'),p=section.querySelector(':scope>.section-head p'),status=document.getElementById('predictionStatus');if(h)h.textContent='Revisión del XI oficial';if(p)p.textContent='La predicción ya está cerrada. Primero mira el resultado; el análisis avanzado sigue disponible en modo PRO.';if(status)status.textContent='XI oficial';
}
function applyClasses(){const simple=mode()==='simple';document.body.classList.toggle('rm-simple-mode',simple);document.body.classList.toggle('rm-pro-mode',!simple)}
function apply(){
  applyClasses();ensureModeToggle();if(mode()==='simple'){patchDesktop();patchMobile();adaptIntro();adaptTopbar();adaptPrediction()}syncNav();
}
function wrapNavigation(){
  if(wrapped||typeof showSection!=='function')return;wrapped=true;const base=showSection;showSection=function(id){base(id);setTimeout(apply,0);setTimeout(apply,120)};
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('navDesktop')||!document.getElementById('inicio')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;wrapNavigation();apply();
  ['rm-modules-ready','rm-analysis-context-ready','rm-official-xi-review-rendered','rm-post-xi-center-rendered','rm-season-data-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(apply,60)));
  window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)setTimeout(apply,40)});
  [300,900,2200].forEach(ms=>setTimeout(apply,ms));
  window.RMSimpleExperience=Object.freeze({mode,setMode,render:apply,official});
  document.dispatchEvent(new CustomEvent('rm-simple-experience-ready',{detail:{mode:mode()}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,120);
})();