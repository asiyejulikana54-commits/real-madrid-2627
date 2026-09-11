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
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function addClass(el,name){if(el&&!el.classList.contains(name))el.classList.add(name)}
function addPurpose(id){const section=document.getElementById(id),cfg=PURPOSES[id];if(!section||!cfg||section.querySelector(':scope > .ux-purpose'))return;const guide=document.createElement('div');guide.className='ux-purpose';guide.innerHTML=`<div><span>${esc(cfg.kicker)}</span><p>${esc(cfg.text)}</p></div><div>${cfg.links.map(([target,label])=>`<button onclick="showSection('${target}')">${esc(label)} <b>→</b></button>`).join('')}</div>`;const tabs=section.querySelector(':scope > .ux-data-tabs');if(tabs)tabs.insertAdjacentElement('afterend',guide);else section.prepend(guide)}
function cleanHome(){const more=document.getElementById('uxHomeMore');if(!more)return;['powerHome','hierarchyHome','homeVsCommunity'].forEach(id=>addClass(document.getElementById(id),'ux-duplicate-home'));const rating=document.getElementById('ratingBars');if(rating)addClass(rating.closest('.card'),'ux-duplicate-home');const generic=[...document.querySelectorAll('#uxHomeMore .grid.cols-4')].find(g=>g.querySelector('.kpi'));if(generic)addClass(generic,'ux-duplicate-home');const summary=more.querySelector(':scope > summary');if(summary){setText(summary.querySelector('span'),'Notas del proyecto');setText(summary.querySelector('b'),'Bloc táctico y ajustes guardados en este dispositivo')}}
function cleanPower(){const s=document.getElementById('power');if(!s)return;addClass(s,'ux-power-deduped');const ranking=s.querySelector('.ux-power-ranking');if(ranking&&!ranking.dataset.dedupe){ranking.dataset.dedupe='1';ranking.open=false;setText(ranking.querySelector(':scope > summary b'),'Ranking Power completo');setText(ranking.querySelector(':scope > summary span'),'Puesto, jugador, Power y nivel')}}
function cleanComparator(){const s=document.getElementById('comparador');if(!s)return;addClass(s,'ux-comparator-deduped');const firstHead=s.querySelector(':scope > .section-head');if(firstHead){setText(firstHead.querySelector('h2'),'Comparación rápida');setText(firstHead.querySelector('p'),'Dos jugadores, una lectura directa. Para decidir un puesto con más contexto, usa Radar.')}[...s.querySelectorAll(':scope > .section-head')].forEach(head=>{if(head.textContent.includes('Comparaciones que seguimos')){addClass(head,'ux-duplicate-block');const next=head.nextElementSibling;if(next?.classList.contains('grid'))addClass(next,'ux-duplicate-block')}})}
function cleanRadar(){const s=document.getElementById('radar');if(!s)return;const profiles=s.querySelector('.radar-player-grid');if(profiles&&!profiles.closest('.ux-radar-profiles')){const d=document.createElement('details');d.className='ux-panel-details ux-radar-profiles';d.innerHTML='<summary><div><b>Fichas de los dos jugadores</b><span>Media, Power, minutos y forma</span></div><strong>+</strong></summary>';profiles.replaceWith(d);d.appendChild(profiles)}addClass(s.querySelector('.radar-summary-grid'),'ux-radar-secondary')}
function cleanEvolution(){const s=document.getElementById('evolucion');if(!s)return;addClass(s,'ux-evolution-deduped');const matrix=s.querySelector('.a-matrix-card');if(matrix)setText(matrix.querySelector('h2'),'Histórico de notas')}
function cleanHierarchy(){addClass(document.getElementById('jerarquias'),'ux-hierarchy-deduped')}
function cleanCommunity(){const s=document.getElementById('comunidad');if(!s)return;addClass(s,'ux-community-deduped');setText(s.querySelector(':scope > .section-head p'),'Predicciones de alineación y ranking de aciertos. El mejor jugador de cada partido se vota en MVP.')}
function cleanMvp(){addClass(document.getElementById('mvp'),'ux-mvp-deduped')}
function addHomeMap(){const intel=document.getElementById('intelligenceHome'),home=document.getElementById('inicio');if(!home||!intel||document.getElementById('uxHomeRoutes'))return;const routes=document.createElement('div');routes.id='uxHomeRoutes';routes.className='ux-home-routes';routes.innerHTML=`<span>IR DIRECTO</span><button onclick="showSection('power')"><b>↗</b> Ranking</button><button onclick="showSection('evolucion')"><b>⌁</b> Evolución</button><button onclick="showSection('radar')"><b>◇</b> Decidir</button><button onclick="showSection('laboratorio')"><b>△</b> XI por datos</button>`;intel.insertAdjacentElement('afterend',routes)}
function apply(){if(!document.body.classList.contains('rm-visual-system'))return;Object.keys(PURPOSES).forEach(addPurpose);cleanHome();cleanPower();cleanComparator();cleanRadar();cleanEvolution();cleanHierarchy();cleanCommunity();cleanMvp();addHomeMap()}
function schedule(delay=45){clearTimeout(timer);timer=setTimeout(apply,delay)}
function loadMobileLayer(){if(!document.querySelector('link[data-mobile-ux]')){const link=document.createElement('link');link.rel='stylesheet';link.href='mobile-ux.css?v=2';link.dataset.mobileUx='1';document.head.appendChild(link)}if(!document.querySelector('script[data-mobile-ux]')){const script=document.createElement('script');script.src='mobile-ux.js?v=3';script.dataset.mobileUx='1';document.body.appendChild(script)}}
function install(){
  if(installed)return;if(!document.body.classList.contains('rm-visual-system')||typeof showSection!=='function'){setTimeout(install,80);return}
  installed=true;addClass(document.body,'ux-deduped');apply();
  const previous=window.showSection;window.showSection=function(id){previous(id);schedule(25)};
  ['rm-critical-modules-ready','rm-modules-ready','rm-ranking-official-ready','rm-community-updated','rm-matchday-polls-updated'].forEach(name=>document.addEventListener(name,()=>schedule(15)));
  [300,1200,2800].forEach(ms=>setTimeout(apply,ms));
  loadMobileLayer();
}
setTimeout(install,110);
})();
