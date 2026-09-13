(()=>{
const KEY='rm_simple_experience_v1';
const WELCOME_KEY='rm_beginner_welcome_v1';
let installed=false,attempts=0,wrapped=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function storedMode(){try{const v=localStorage.getItem(KEY);return v==='simple'||v==='pro'?v:''}catch{return ''}}
function establishedUser(){
  try{
    const keys=[];for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i)||'');
    return keys.some(k=>/^rm_prediction_/i.test(k)||/^rm_league_alias/i.test(k)||/favorite|favourite|personal_history|prediction_history|notes/i.test(k));
  }catch{return false}
}
function mode(){const stored=storedMode();return stored||(establishedUser()?'pro':'simple')}
function persistInitialMode(){if(storedMode())return;try{localStorage.setItem(KEY,establishedUser()?'pro':'simple')}catch{}}
function official(){
  const currentId=safe(()=>window.RMCommunityApi?.match?.id,'')||'';
  const baseId=safe(()=>typeof predictionMatch!=='undefined'?predictionMatch.id:'','')||'';
  if(currentId&&baseId&&currentId!==baseId)return false;
  return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length===11,false)
}
function active(){return document.querySelector('.section.active')?.id||'inicio'}
function sectionExists(id){return Boolean(document.getElementById(id))}
function go(id){if(id==='mi-liga'&&typeof openMiLiga==='function'){safe(()=>openMiLiga());return}safe(()=>showSection(id))}
function currentReview(){return safe(()=>window.RMPostXiCenter?.state?.(),null)}
function itemButton(x,mobile=false){const fn=x.id==='mi-liga'?'openMiLiga()':`showSection('${x.id}')`;return mobile?`<button data-section="${x.id}" onclick="${fn}"><b>${x.icon}</b><small>${x.label}</small></button>`:`<button data-section="${x.id}" onclick="${fn}"><span>${x.icon}</span><em>${x.label}</em></button>`}
function navItems(){
  const done=official();
  return [
    {id:'inicio',icon:'⌂',label:'Inicio'},
    {id:'partido',icon:'⚽',label:'Partido'},
    {id:'prediccion',icon:'★',label:done?'Revisar':'Predecir'},
    {id:'plantilla',icon:'◉',label:'Equipo'},
    {id:'mi-liga',icon:'🏆',label:'Mi Liga'}
  ].filter(x=>sectionExists(x.id));
}
function patchDesktop(){
  if(mode()!=='simple')return;
  const nav=document.getElementById('navDesktop');if(!nav)return;
  const items=navItems();
  nav.innerHTML=`<div class="ux-nav-group sx-primary-nav"><div class="ux-nav-label">Principal</div>${items.map(x=>itemButton(x,false)).join('')}<button class="sx-more-nav" type="button" onclick="openUxMore()"><span>☰</span><em>Más análisis</em></button></div>`;
}
function patchMobile(){
  if(mode()!=='simple')return;
  const nav=document.getElementById('navMobile');if(!nav)return;
  const done=official();
  let items=[
    {id:'inicio',icon:'⌂',label:'Inicio'},
    {id:'partido',icon:'⚽',label:'Partido'},
    {id:'prediccion',icon:'★',label:done?'Revisar':'Predecir'},
    sectionExists('mi-liga')?{id:'mi-liga',icon:'🏆',label:'Mi Liga'}:{id:'plantilla',icon:'◉',label:'Equipo'}
  ].filter(x=>sectionExists(x.id));
  nav.innerHTML=`${items.map(x=>itemButton(x,true)).join('')}<button class="ux-more-tab" id="uxMoreTab" onclick="openUxMore()"><b>☰</b><small>Más</small></button>`;
}
function syncNav(){
  const id=active();document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  document.getElementById('uxMoreTab')?.classList.toggle('active',!navItems().some(x=>x.id===id));
}
function ensureModeToggle(){
  const tools=document.querySelector('#uxMoreSheet .ux-sheet-tools');if(!tools)return false;
  let quick=document.getElementById('sxQuickStart');
  if(!quick){quick=document.createElement('button');quick.id='sxQuickStart';tools.insertBefore(quick,tools.firstElementChild?.nextSibling||tools.firstChild)}
  quick.textContent='▶ Inicio rápido';quick.onclick=()=>welcome(true);
  let btn=document.getElementById('sxModeToggle');
  if(!btn){btn=document.createElement('button');btn.id='sxModeToggle';tools.insertBefore(btn,quick.nextSibling)}
  btn.textContent=mode()==='simple'?'⚙ Abrir análisis avanzado':'✓ Volver a modo sencillo';
  btn.onclick=()=>setMode(mode()==='simple'?'pro':'simple');return true;
}
function setMode(next){
  const value=next==='pro'?'pro':'simple';try{localStorage.setItem(KEY,value)}catch{}
  document.body.classList.toggle('rm-simple-mode',value==='simple');document.body.classList.toggle('rm-pro-mode',value==='pro');
  document.dispatchEvent(new CustomEvent('rm-experience-mode-updated',{detail:{mode:value}}));
  document.dispatchEvent(new CustomEvent('rm-modules-ready'));
  setTimeout(apply,80);setTimeout(apply,260);
  if(value==='simple'&&!safe(()=>localStorage.getItem(WELCOME_KEY),''))setTimeout(()=>welcome(false),420);
}
function introCopy(){
  const done=official(),review=currentReview(),user=review?.userScore,project=review?.projectScore;
  if(done){
    let score='';if(Number.isFinite(user)&&Number.isFinite(project))score=` Tu XI hizo ${user}/11 y Proyecto ${project}/11.`;else if(Number.isFinite(project))score=` Proyecto hizo ${project}/11.`;
    return {kicker:'XI OFICIAL DISPONIBLE',title:'Lo importante primero: revisa el once y tus aciertos.',copy:`No necesitas entrar en todas las estadísticas. Empieza por la revisión rápida y abre el análisis avanzado solo si te interesa.${score}`,primary:'Ver revisión',secondary:'Ver el partido'};
  }
  return {kicker:'REAL MADRID 26/27 · MODO SENCILLO',title:'Para empezar solo necesitas tres cosas.',copy:'Mira el próximo partido, haz tu predicción y compite con la comunidad. Power, eficiencia, pp y el resto del análisis quedan disponibles en “Más”.',primary:'Hacer mi predicción',secondary:'Ir a Mi Liga'};
}
function adaptIntro(){
  if(mode()!=='simple')return;
  const root=document.getElementById('publicIntro');if(!root)return;
  const c=introCopy();
  const kicker=root.querySelector('.public-kicker'),title=root.querySelector('.public-copy h2'),copy=root.querySelector('.public-copy>p');
  if(kicker)kicker.textContent=c.kicker;if(title)title.textContent=c.title;if(copy)copy.textContent=c.copy;
  const p=root.querySelector('#publicPredict'),s=root.querySelector('#publicPerformance');
  if(p){p.textContent=c.primary;p.onclick=()=>go('prediccion')}if(s){s.textContent=c.secondary;s.onclick=()=>go(official()?'partido':'mi-liga')}
  const guide=root.querySelector('.public-guide');if(!guide)return;
  if(official()){
    guide.innerHTML=`<div class="public-guide-title">Tres accesos y listo</div><button data-sx-go="prediccion"><i>1</i><span><b>Revisa tu predicción</b><small>Comprueba tus aciertos frente al XI oficial.</small></span><strong>›</strong></button><button data-sx-go="partido"><i>2</i><span><b>Abre el partido</b><small>Once, contexto y seguimiento del encuentro.</small></span><strong>›</strong></button><button data-sx-go="mi-liga"><i>3</i><span><b>Mira Mi Liga</b><small>Clasificación, amigos y onces de tu liga.</small></span><strong>›</strong></button>`;
  }else{
    guide.innerHTML=`<div class="public-guide-title">Tres accesos y listo</div><button data-sx-go="prediccion"><i>1</i><span><b>Haz tu predicción</b><small>Elige 11 jugadores antes del cierre.</small></span><strong>›</strong></button><button data-sx-go="partido"><i>2</i><span><b>Mira el próximo partido</b><small>Previa, contexto y novedades del encuentro.</small></span><strong>›</strong></button><button data-sx-go="mi-liga"><i>3</i><span><b>Compite en Mi Liga</b><small>Entra con amigos y compara vuestros XI.</small></span><strong>›</strong></button>`;
  }
  guide.querySelectorAll('[data-sx-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.sxGo)));
}
const TITLES={
  inicio:['Real Madrid 26/27','Empieza por el partido, tu predicción o Mi Liga. El análisis avanzado está en “Más”.'],
  partido:['Partido','Once, contexto y seguimiento del encuentro.'],
  plantilla:['Equipo','Jugadores, roles y rendimiento sin complicaciones.'],
  prediccion:['Predicción','Elige tu XI y comprueba después tus aciertos.'],
  comparador:['Comparar jugadores','Elige dos jugadores y mira las diferencias clave.'],
  estadisticas:['Estadísticas','Todos los datos de temporada, con muestra y contexto.'],
  power:['Rendimiento','Quién está rindiendo mejor y con qué muestra.'],
  once:['Crear un XI','Construye una alineación y guarda tus variantes.'],
  'mi-liga':['Mi Liga','Compite con amigos, consulta sus XI y sigue la clasificación.'],
  'mi-temporada':['Mi temporada','Tu histórico, aciertos, favoritos y aprendizaje.']
};
function adaptTopbar(){
  if(mode()!=='simple')return;const id=active(),t=TITLES[id];
  if(t){const h=document.getElementById('pageTitle'),s=document.getElementById('pageSub');if(h)h.textContent=id==='prediccion'&&official()?'Revisión del XI oficial':t[0];if(s)s.textContent=id==='prediccion'&&official()?'Comprueba qué acertaste sin necesidad de entrar en el análisis avanzado.':t[1]}
  const actions=document.querySelector('.topbar .actions');if(!actions)return;const prediction=[...actions.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('prediccion'));if(prediction)prediction.textContent=official()?'Ver revisión':'Predecir XI';
}
function adaptPrediction(){
  if(mode()!=='simple'||!official())return;const section=document.getElementById('prediccion');if(!section)return;
  const h=section.querySelector(':scope>.section-head h2'),p=section.querySelector(':scope>.section-head p'),status=document.getElementById('predictionStatus');if(h)h.textContent='Revisión del XI oficial';if(p)p.textContent='La predicción ya está cerrada. Primero mira el resultado; el análisis avanzado sigue disponible en “Más”.';if(status)status.textContent='XI oficial';
}
function ensureWelcome(){
  let root=document.getElementById('sxWelcome');if(root)return root;
  root=document.createElement('div');root.id='sxWelcome';root.className='sx-welcome';root.setAttribute('aria-hidden','true');
  root.innerHTML=`<button class="sx-welcome-backdrop" type="button" aria-label="Cerrar"></button><section class="sx-welcome-card" role="dialog" aria-modal="true" aria-labelledby="sxWelcomeTitle"><button class="sx-welcome-close" type="button" aria-label="Cerrar">×</button><div class="sx-welcome-kicker">BIENVENIDO A RM 26/27</div><h2 id="sxWelcomeTitle">No necesitas aprenderte toda la app para empezar</h2><p>Quédate con estas tres acciones. El resto son herramientas opcionales para cuando quieras profundizar.</p><div class="sx-welcome-steps"><button type="button" data-sx-welcome-go="partido"><i>1</i><span><b>Partido</b><small>Qué viene ahora y qué está pasando.</small></span></button><button type="button" data-sx-welcome-go="prediccion"><i>2</i><span><b>Tu XI</b><small>Elige 11 titulares y comprueba tus aciertos.</small></span></button><button type="button" data-sx-welcome-go="mi-liga"><i>3</i><span><b>Mi Liga</b><small>Compite con amigos y mira sus predicciones.</small></span></button></div><div class="sx-welcome-note"><b>¿Y Power, pp, aporte, forma...?</b><span>No hace falta entenderlos al principio. Están en el análisis avanzado y la guía los explica cuando los necesites.</span></div><div class="sx-welcome-actions"><button class="btn primary" type="button" data-sx-welcome-primary>Empezar</button><button class="btn" type="button" data-sx-welcome-guide>Cómo funciona la web</button></div></section>`;
  document.body.appendChild(root);
  root.querySelector('.sx-welcome-backdrop')?.addEventListener('click',dismissWelcome);root.querySelector('.sx-welcome-close')?.addEventListener('click',dismissWelcome);
  root.querySelectorAll('[data-sx-welcome-go]').forEach(b=>b.addEventListener('click',()=>{dismissWelcome();go(b.dataset.sxWelcomeGo)}));
  root.querySelector('[data-sx-welcome-primary]')?.addEventListener('click',()=>{dismissWelcome();go(official()?'partido':'prediccion')});
  root.querySelector('[data-sx-welcome-guide]')?.addEventListener('click',()=>{dismissWelcome();if(window.RMSiteGuide?.openOverview)window.RMSiteGuide.openOverview();else window.openHowRM?.()});
  return root;
}
function dismissWelcome(){const root=document.getElementById('sxWelcome');if(root){root.classList.remove('open');root.setAttribute('aria-hidden','true')}document.body.classList.remove('sx-welcome-open');try{localStorage.setItem(WELCOME_KEY,'1')}catch{}}
function welcome(force=false){
  if(!force){if(mode()!=='simple')return;try{if(localStorage.getItem(WELCOME_KEY)==='1')return}catch{}}
  const root=ensureWelcome();root.classList.add('open');root.setAttribute('aria-hidden','false');document.body.classList.add('sx-welcome-open');
}
function maybeWelcome(){if(mode()!=='simple'||active()!=='inicio')return;setTimeout(()=>welcome(false),650)}
function applyClasses(){const simple=mode()==='simple';document.body.classList.toggle('rm-simple-mode',simple);document.body.classList.toggle('rm-pro-mode',!simple)}
function apply(){
  applyClasses();ensureModeToggle();if(mode()==='simple'){patchDesktop();patchMobile();adaptIntro();adaptTopbar();adaptPrediction();syncNav()}
}
function wrapNavigation(){
  if(wrapped||typeof showSection!=='function')return;wrapped=true;const base=showSection;showSection=function(id){base(id);setTimeout(apply,0);setTimeout(apply,120)};
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('navDesktop')||!document.getElementById('inicio')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;persistInitialMode();wrapNavigation();apply();maybeWelcome();
  ['rm-modules-ready','rm-analysis-context-ready','rm-official-xi-review-rendered','rm-post-xi-center-rendered','rm-season-data-ready','rm-community-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(apply,60)));
  window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)setTimeout(apply,40)});
  [300,900,2200].forEach(ms=>setTimeout(apply,ms));
  window.RMSimpleExperience=Object.freeze({mode,setMode,render:apply,official,welcome});
  document.dispatchEvent(new CustomEvent('rm-simple-experience-ready',{detail:{mode:mode()}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,120);
})();