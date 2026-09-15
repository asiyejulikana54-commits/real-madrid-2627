(()=>{
const PURPOSES={
  power:{kicker:'RANKING',text:'¿Quién está más fuerte ahora? Power ordena el rendimiento ajustándolo por el tamaño de muestra.',links:[['estadisticas','Ver números base'],['evolucion','Ver evolución']]},
  estadisticas:{kicker:'DATOS BASE',text:'La fuente principal para media, minutos, aporte y eficiencia. Aquí viven los números completos.',links:[['power','Ver ranking Power'],['comparador','Comparar']]},
  evolucion:{kicker:'TIEMPO',text:'¿Cómo cambia el rendimiento partido a partido? Esta pantalla se centra en la trayectoria de la temporada.',links:[['jerarquias','Ver jerarquías'],['partidos','Ver partidos']]},
  jerarquias:{kicker:'PUESTOS',text:'¿Quién está ganando cada posición? Ordena la competencia por puesto; no sustituye la evolución temporal.',links:[['radar','Resolver un duelo'],['laboratorio','Generar XI']]},
  comparador:{kicker:'VISTAZO RÁPIDO',text:'Compara dos jugadores de forma simple. Para decidir un puesto con seis criterios, usa el Radar.',links:[['radar','Abrir Radar']]},
  radar:{kicker:'DECISIÓN',text:'Resuelve un cara a cara con seis criterios. Es la pantalla principal para nuestros debates jugador contra jugador.',links:[['comparador','Comparación simple'],['jerarquias','Ver puesto']]},
  laboratorio:{kicker:'CONSTRUCCIÓN',text:'Genera un XI completo por datos. Aquí importa la combinación de once jugadores, no un duelo individual.',links:[['radar','Ver duelos'],['once','Editar XI']]},
  partidos:{kicker:'ARCHIVO',text:'Crónicas y conclusiones de cada encuentro. Para notas y tendencias numéricas, entra en Evolución.',links:[['evolucion','Ver datos por jornada']]},
  comunidad:{kicker:'PREDICCIONES',text:'Qué XI cree la comunidad que jugará y quién acierta más. Los votos al mejor jugador viven en MVP.',links:[['prediccion','Hacer predicción'],['mvp','Ver MVP']]},
  mvp:{kicker:'MEJOR JUGADOR',text:'Votación del mejor jugador de cada partido. Se mantiene separada de las predicciones de alineación.',links:[['comunidad','Ver comunidad'],['partidos','Ver partidos']]}
};
let installed=false,timer=null;
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function addClass(el,name){if(el&&!el.classList.contains(name))el.classList.add(name)}
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function go(id){if(id==='mi-liga'&&typeof openMiLiga==='function')return openMiLiga();if(typeof showSection==='function')showSection(id)}
function addPurpose(id){const section=document.getElementById(id),cfg=PURPOSES[id];if(!section||!cfg||section.querySelector(':scope > .ux-purpose'))return;const guide=document.createElement('div');guide.className='ux-purpose';guide.innerHTML=`<div><span>${esc(cfg.kicker)}</span><p>${esc(cfg.text)}</p></div><div>${cfg.links.map(([target,label])=>`<button onclick="showSection('${target}')">${esc(label)} <b>→</b></button>`).join('')}</div>`;const tabs=section.querySelector(':scope > .ux-data-tabs');if(tabs)tabs.insertAdjacentElement('afterend',guide);else section.prepend(guide)}
function normalizeHomeLanguage(){
  const home=document.getElementById('inicio');if(!home)return;
  const replacements=[
    [/Notas del proyecto/gi,'Notas tácticas'],
    [/tu proyecto/gi,'nuestra previsión'],
    [/Proyecto hizo/gi,'Nuestra previsión hizo'],
    [/EN PROYECTO/gi,'EN PREVISIÓN'],
    [/Entra en nuestra propuesta de XI/gi,'Entra en el XI previsto'],
    [/Sale de nuestra propuesta principal/gi,'Sale del XI previsto'],
    [/proyecto/gi,'previsión']
  ];
  const walker=document.createTreeWalker(home,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
    let value=node.nodeValue||'',next=value;for(const [pattern,to] of replacements)next=next.replace(pattern,to);if(next!==value)node.nodeValue=next;
  }
}
function cleanHome(){
  const home=document.getElementById('inicio');if(!home)return;
  addClass(home.querySelector(':scope > .hero'),'ux-duplicate-home');
  addClass(document.getElementById('publicIntro'),'ux-duplicate-home');
  addClass(document.getElementById('homePro'),'ux-duplicate-home');
  const more=document.getElementById('uxHomeMore');
  if(more){
    ['powerHome','hierarchyHome','homeVsCommunity'].forEach(id=>addClass(document.getElementById(id),'ux-duplicate-home'));
    const rating=document.getElementById('ratingBars');if(rating)addClass(rating.closest('.card'),'ux-duplicate-home');
    const generic=[...document.querySelectorAll('#uxHomeMore .grid.cols-4')].find(g=>g.querySelector('.kpi'));if(generic)addClass(generic,'ux-duplicate-home');
    const summary=more.querySelector(':scope > summary');if(summary){setText(summary.querySelector('span'),'Notas y herramientas');setText(summary.querySelector('b'),'Bloc táctico, método y ajustes guardados en este dispositivo')}
  }
  const pulse=document.getElementById('publicPulse');if(pulse){addClass(pulse.querySelector('.pulse-stage'),'ux-duplicate-home');addClass(pulse.querySelector('.pulse-player'),'ux-duplicate-home');addClass(pulse.querySelector('.pulse-changes'),'ux-duplicate-home')}
  normalizeHomeLanguage();
}
function cleanPower(){const s=document.getElementById('power');if(!s)return;addClass(s,'ux-power-deduped');const ranking=s.querySelector('.ux-power-ranking');if(ranking&&!ranking.dataset.dedupe){ranking.dataset.dedupe='1';ranking.open=false;setText(ranking.querySelector(':scope > summary b'),'Ranking Power completo');setText(ranking.querySelector(':scope > summary span'),'Puesto, jugador, Power y nivel')}}
function cleanComparator(){const s=document.getElementById('comparador');if(!s)return;addClass(s,'ux-comparator-deduped');const firstHead=s.querySelector(':scope > .section-head');if(firstHead){setText(firstHead.querySelector('h2'),'Comparación rápida');setText(firstHead.querySelector('p'),'Dos jugadores, una lectura directa. Para decidir un puesto con más contexto, usa Radar.')}[...s.querySelectorAll(':scope > .section-head')].forEach(head=>{if(head.textContent.includes('Comparaciones que seguimos')){addClass(head,'ux-duplicate-block');const next=head.nextElementSibling;if(next?.classList.contains('grid'))addClass(next,'ux-duplicate-block')}})}
function cleanRadar(){const s=document.getElementById('radar');if(!s)return;const profiles=s.querySelector('.radar-player-grid');if(profiles&&!profiles.closest('.ux-radar-profiles')){const d=document.createElement('details');d.className='ux-panel-details ux-radar-profiles';d.innerHTML='<summary><div><b>Fichas de los dos jugadores</b><span>Media, Power, minutos y forma</span></div><strong>+</strong></summary>';profiles.replaceWith(d);d.appendChild(profiles)}addClass(s.querySelector('.radar-summary-grid'),'ux-radar-secondary')}
function cleanEvolution(){const s=document.getElementById('evolucion');if(!s)return;addClass(s,'ux-evolution-deduped');const matrix=s.querySelector('.a-matrix-card');if(matrix)setText(matrix.querySelector('h2'),'Histórico de notas')}
function cleanHierarchy(){addClass(document.getElementById('jerarquias'),'ux-hierarchy-deduped')}
function cleanCommunity(){const s=document.getElementById('comunidad');if(!s)return;addClass(s,'ux-community-deduped');setText(s.querySelector(':scope > .section-head p'),'Predicciones de alineación y ranking de aciertos. El mejor jugador de cada partido se vota en MVP.')}
function cleanMvp(){addClass(document.getElementById('mvp'),'ux-mvp-deduped')}
function routeButton(id,icon,label,description){return `<button type="button" data-home-route="${id}"><b>${icon}</b><span><strong>${label}</strong><small>${description}</small></span></button>`}
function predictionButton(){return `<button type="button" class="ux-home-predict" data-home-route="prediccion"><b>★</b><span><em>PRÓXIMO PARTIDO</em><strong>Predice el XI del Real Madrid</strong><small>Elige tus 11, compáralos con la comunidad y suma aciertos cuando salga el once oficial.</small></span><i>Hacer mi XI →</i></button>`}
function addHomeMap(){
  const home=document.getElementById('inicio');if(!home)return null;let routes=document.getElementById('uxHomeRoutes');
  if(!routes){routes=document.createElement('nav');routes.id='uxHomeRoutes';routes.className='ux-home-routes';routes.setAttribute('aria-label','Apartados principales de la aplicación')}
  const markup=`${predictionButton()}<span class="ux-home-routes-label">APARTADOS PRINCIPALES</span>${routeButton('partido','⚽','Partido','Previa, XI y seguimiento')}${routeButton('plantilla','👥','Equipo','Plantilla, Power y jerarquías')}${routeButton('estadisticas','📊','Rendimiento','Datos, eficiencia y evolución')}${routeButton('radar','🎯','Decisiones','Radar, comparador y XI')}${routeButton('comunidad','🌐','Comunidad','Tendencias y predicciones')}${routeButton('mi-liga','🏆','Mi Liga','Clasificación y ligas privadas')}${routeButton('mi-temporada','👤','Mi temporada','Historial, aciertos y progreso')}`;
  if(routes.dataset.homeVersion!=='4'){routes.innerHTML=markup;routes.dataset.homeVersion='4'}
  const personal=document.getElementById('personalizedHome');
  if(personal){if(routes.nextElementSibling!==personal)personal.insertAdjacentElement('beforebegin',routes)}else if(!routes.isConnected)home.prepend(routes);
  routes.querySelectorAll('[data-home-route]').forEach(btn=>{if(btn.dataset.homeBound)return;btn.dataset.homeBound='1';btn.addEventListener('click',()=>go(btn.dataset.homeRoute))});return routes;
}
function latestRatedMatch(){
  const season=window.RMSeasonData,matches=season?.matches||[],list=safe(()=>players,[])||[];
  for(let i=matches.length-1;i>=0;i--){const match=matches[i],rated=list.some(p=>Number.isFinite(safe(()=>season.officialRatingEntry?.(match.id,p.name)?.value,null)));if(rated)return match}return matches.at(-1)||null;
}
function addMvpHome(){
  const home=document.getElementById('inicio'),routes=addHomeMap();if(!home||!routes)return;
  const hasMvp=safe(()=>sections.some(s=>s[0]==='mvp'),Boolean(document.getElementById('mvp')));if(!hasMvp)return;
  let card=document.getElementById('uxHomeMvp');if(!card){card=document.createElement('button');card.id='uxHomeMvp';card.type='button';card.className='ux-home-mvp'}
  const personal=document.getElementById('personalizedHome');if(personal){if(card.previousElementSibling!==personal)personal.insertAdjacentElement('afterend',card)}else if(!card.isConnected)routes.insertAdjacentElement('afterend',card);
  const match=latestRatedMatch(),picks=safe(()=>window.RMMvpPro?.picks?.(),{})||{},pick=match?picks[match.id]:null,label=match?.short||match?.label||'último partido';
  card.innerHTML=`<div><span>${pick?'TU MVP':'VOTA EL MVP'}</span><b>${pick?`${esc(display(pick))} · ${esc(label)}`:`¿Quién fue el mejor de ${esc(label)}?`}</b><small>${pick?'Puedes cambiar tu voto o consultar el resultado de la comunidad.':'Elige tu MVP de cada partido y compáralo con la comunidad y las notas.'}</small></div><strong>${pick?'Ver / cambiar':'Votar ahora'} →</strong>`;
  if(!card.dataset.homeBound){card.dataset.homeBound='1';card.addEventListener('click',()=>{const current=latestRatedMatch();go('mvp');setTimeout(()=>{if(current&&window.RMMvpPro?.openMatch)window.RMMvpPro.openMatch(current.id)},80)})}
}
function organizeHome(){
  const home=document.getElementById('inicio'),personal=document.getElementById('personalizedHome'),pulse=document.getElementById('publicPulse'),intel=document.getElementById('intelligenceHome'),more=document.getElementById('uxHomeMore');if(!home)return;
  const next=home.querySelector('#personalizedHome .personal-next');if(next){const prediction=next.dataset.homeGo==='prediccion';next.classList.toggle('ux-duplicate-home',prediction);next.classList.remove('prediction-priority')}
  if(personal&&pulse&&personal.nextElementSibling!==pulse)personal.insertAdjacentElement('afterend',pulse);
  if(pulse&&intel&&pulse.nextElementSibling!==intel)pulse.insertAdjacentElement('afterend',intel);
  if(more&&more.parentElement===home&&home.lastElementChild!==more)home.appendChild(more);
}
function apply(){if(!document.body.classList.contains('rm-visual-system'))return;Object.keys(PURPOSES).forEach(addPurpose);cleanHome();cleanPower();cleanComparator();cleanRadar();cleanEvolution();cleanHierarchy();cleanCommunity();cleanMvp();addHomeMap();addMvpHome();organizeHome();normalizeHomeLanguage()}
function schedule(delay=45){clearTimeout(timer);timer=setTimeout(apply,delay)}
function loadMobileLayer(){if(!document.querySelector('link[data-mobile-ux]')){const link=document.createElement('link');link.rel='stylesheet';link.href='mobile-ux.css?v=2';link.dataset.mobileUx='1';document.head.appendChild(link)}if(!document.querySelector('script[data-mobile-ux]')){const script=document.createElement('script');script.src='mobile-ux.js?v=7';script.dataset.mobileUx='1';document.body.appendChild(script)}}
function install(){
  if(installed)return;if(!document.body.classList.contains('rm-visual-system')||typeof showSection!=='function'){setTimeout(install,80);return}
  installed=true;addClass(document.body,'ux-deduped');apply();
  const previous=window.showSection;window.showSection=function(id){previous(id);schedule(25)};
  ['rm-critical-modules-ready','rm-modules-ready','rm-ranking-official-ready','rm-community-updated','rm-matchday-polls-updated','rm-mvp-personal-updated','rm-favorite-watch-rendered'].forEach(name=>document.addEventListener(name,()=>schedule(15)));
  [300,1200,2800,5200].forEach(ms=>setTimeout(apply,ms));
  loadMobileLayer();
}
setTimeout(install,110);
})();