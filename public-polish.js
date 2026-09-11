(()=>{
let installed=false;
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function go(id){if(typeof showSection==='function')showSection(id)}
function ensureMeta(name,content,property=false){let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.appendChild(el)}el.setAttribute('content',content)}
function publicMeta(){
  document.title='RM 26/27 · Datos, XI y comunidad del Real Madrid';
  const description='Sigue el Real Madrid 2026/27 con rankings de rendimiento, Power RM, comparador de jugadores, constructor de XI y predicciones de la comunidad.';
  ensureMeta('description',description);ensureMeta('theme-color','#071421');ensureMeta('og:title','RM 26/27 · Datos, XI y comunidad',true);ensureMeta('og:description',description,true);ensureMeta('og:type','website',true);
}
function updateHomeTopbar(id){
  if(id!=='inicio')return;
  const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSub');
  if(title)title.textContent='Real Madrid 26/27';
  if(sub)sub.textContent='Rendimiento, onces, comparaciones y comunidad en un solo lugar.';
}
function injectIntro(){
  const home=document.getElementById('inicio');if(!home||document.getElementById('publicIntro'))return;
  const intro=document.createElement('section');intro.id='publicIntro';intro.className='card public-intro';
  intro.innerHTML=`<div class="public-copy"><div class="public-kicker">Real Madrid 26/27 · proyecto independiente</div><h2>Vive la temporada con datos, debate y tu propio XI.</h2><p>Compara jugadores, descubre quién llega mejor, construye alineaciones y compite acertando los titulares del próximo partido. Sin registro y con una metodología visible.</p><div class="public-actions"><button class="btn primary" id="publicPredict">Predecir el XI</button><button class="btn" id="publicPerformance">Ver quién está mejor</button></div><div class="public-trust"><span>3 fuentes de valoración</span><span>Sin corte mínimo de minutos</span><span>Sin registro</span><span>No oficial</span></div></div><div class="public-guide"><div class="public-guide-title">Empieza por aquí</div><button id="publicGuidePrediction"><i>11</i><span><b>Acierta el próximo XI</b><small>Elige tus titulares y compáralos con la comunidad.</small></span><strong>›</strong></button><button id="publicGuidePower"><i>⚡</i><span><b>¿Quién está rindiendo mejor?</b><small>Ranking, Power RM, forma y eficiencia.</small></span><strong>›</strong></button><button id="publicGuideCompare"><i>VS</i><span><b>Compara dos jugadores</b><small>Minutos, media, aporte y eficiencia cara a cara.</small></span><strong>›</strong></button></div>`;
  home.insertBefore(intro,home.firstChild);
  intro.querySelector('#publicPredict').onclick=()=>go('prediccion');
  intro.querySelector('#publicPerformance').onclick=()=>go('power');
  intro.querySelector('#publicGuidePrediction').onclick=()=>go('prediccion');
  intro.querySelector('#publicGuidePower').onclick=()=>go('power');
  intro.querySelector('#publicGuideCompare').onclick=()=>go('comparador');
}
function improveCopy(){
  const brand=document.querySelector('.brand small');if(brand)brand.textContent='Datos · XI · Comunidad';
  const side=document.querySelector('.side-bottom');if(side)side.innerHTML='<b style="color:#fff">Proyecto independiente</b><br>Análisis no oficial del Real Madrid 26/27.';
  const heroSecond=document.querySelector('#inicio .next-match .actions .btn:nth-child(2)');if(heroSecond)heroSecond.textContent='Ver nuestra predicción';
  const noteTitle=[...document.querySelectorAll('#inicio h2')].find(x=>x.textContent.trim()==='Bloc del proyecto');if(noteTitle){noteTitle.textContent='Mis notas';const p=noteTitle.parentElement?.querySelector('p');if(p)p.textContent='Guarda aquí tus ideas sobre onces, descansos o dudas tácticas. Solo se almacenan en este dispositivo.'}
  const plantP=document.querySelector('#plantilla .section-head p');if(plantP)plantP.textContent='Explora la plantilla, abre la ficha de cada jugador y consulta su rendimiento actual.';
  const compP=document.querySelector('#comparador>.section-head p');if(compP)compP.textContent='Pon dos jugadores frente a frente y compara su rendimiento en segundos.';
  const matchesP=document.querySelector('#partidos>.section-head p');if(matchesP)matchesP.textContent='Consulta todos los encuentros que forman parte del seguimiento de la temporada.';
  const homeMore=document.querySelector('#uxHomeMore>summary b');if(homeMore)homeMore.textContent='Análisis avanzado, metodología y herramientas';
  const useIdea=[...document.querySelectorAll('#prediccion button')].find(b=>b.textContent.trim()==='Usar nuestra idea');if(useIdea)useIdea.textContent='Cargar propuesta';
  const lineupComment=document.getElementById('lineupComment');if(lineupComment)lineupComment.placeholder='Ej.: por qué jugaría este once, quién descansaría y qué cambios harías…';
  if(!document.getElementById('publicDisclaimer')){
    const home=document.getElementById('inicio');if(home){const d=document.createElement('p');d.id='publicDisclaimer';d.className='public-disclaimer';d.innerHTML='<b>RM 26/27</b> es un proyecto independiente y no oficial. Las valoraciones se combinan a partir de las fuentes indicadas en la metodología.';home.appendChild(d)}
  }
}
function install(){
  if(installed)return;
  if(!document.getElementById('inicio')||typeof showSection!=='function'){setTimeout(install,100);return}
  installed=true;publicMeta();document.body.classList.add('public-ready');injectIntro();improveCopy();updateHomeTopbar(document.querySelector('.section.active')?.id||'inicio');
  const base=showSection;showSection=function(id){base(id);updateHomeTopbar(id)};
  const observer=new MutationObserver(()=>improveCopy());observer.observe(document.querySelector('main'),{childList:true,subtree:true});
}
setTimeout(install,120);
})();
