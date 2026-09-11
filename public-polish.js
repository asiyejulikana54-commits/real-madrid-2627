(()=>{
let installed=false;
function go(id){if(typeof showSection==='function')showSection(id)}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
function setHtml(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}
function setPlaceholder(el,text){if(el&&el.placeholder!==text)el.placeholder=text}
function ensureMeta(name,content,property=false){
  let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);
  if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.appendChild(el)}
  if(el.getAttribute('content')!==content)el.setAttribute('content',content)
}
function publicMeta(){
  const title='RM 26/27 · Datos, XI y comunidad del Real Madrid';
  if(document.title!==title)document.title=title;
  const description='Sigue el Real Madrid 2026/27 con rankings de rendimiento, Power RM, comparador de jugadores, constructor de XI y predicciones de la comunidad.';
  ensureMeta('description',description);ensureMeta('theme-color','#071421');ensureMeta('og:title','RM 26/27 · Datos, XI y comunidad',true);ensureMeta('og:description',description,true);ensureMeta('og:type','website',true);
}
function updateHomeTopbar(id){
  if(id!=='inicio')return;
  setText(document.getElementById('pageTitle'),'Real Madrid 26/27');
  setText(document.getElementById('pageSub'),'Rendimiento, onces, comparaciones y comunidad en un solo lugar.');
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
  setText(document.querySelector('.brand small'),'Datos · XI · Comunidad');
  setHtml(document.querySelector('.side-bottom'),'<b style="color:#fff">Proyecto independiente</b><br>Análisis no oficial del Real Madrid 26/27.');
  setText(document.querySelector('#inicio .next-match .actions .btn:nth-child(2)'),'Ver nuestra predicción');
  const noteTitle=[...document.querySelectorAll('#inicio h2')].find(x=>x.textContent.trim()==='Bloc del proyecto'||x.textContent.trim()==='Mis notas');
  if(noteTitle){setText(noteTitle,'Mis notas');setText(noteTitle.parentElement?.querySelector('p'),'Guarda aquí tus ideas sobre onces, descansos o dudas tácticas. Solo se almacenan en este dispositivo.')}
  setText(document.querySelector('#plantilla .section-head p'),'Explora la plantilla, abre la ficha de cada jugador y consulta su rendimiento actual.');
  setText(document.querySelector('#comparador>.section-head p'),'Pon dos jugadores frente a frente y compara su rendimiento en segundos.');
  setText(document.querySelector('#partidos>.section-head p'),'Consulta todos los encuentros que forman parte del seguimiento de la temporada.');
  setText(document.querySelector('#uxHomeMore>summary b'),'Análisis avanzado, metodología y herramientas');
  const useIdea=[...document.querySelectorAll('#prediccion button')].find(b=>['Usar nuestra idea','Cargar propuesta'].includes(b.textContent.trim()));
  setText(useIdea,'Cargar propuesta');
  setPlaceholder(document.getElementById('lineupComment'),'Ej.: por qué jugaría este once, quién descansaría y qué cambios harías…');
  if(!document.getElementById('publicDisclaimer')){
    const home=document.getElementById('inicio');if(home){const d=document.createElement('p');d.id='publicDisclaimer';d.className='public-disclaimer';d.innerHTML='<b>RM 26/27</b> es un proyecto independiente y no oficial. Las valoraciones se combinan a partir de las fuentes indicadas en la metodología.';home.appendChild(d)}
  }
}
function loadEngagement(){
  if(!document.querySelector('link[data-engagement]')){const link=document.createElement('link');link.rel='stylesheet';link.href='engagement.css?v=2';link.dataset.engagement='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-engagement]')){const script=document.createElement('script');script.src='engagement.js?v=2';script.dataset.engagement='1';document.body.appendChild(script)}
}
function refreshPublicCopy(){injectIntro();improveCopy();updateHomeTopbar(document.querySelector('.section.active')?.id||'inicio')}
function install(){
  if(installed)return;
  if(!document.getElementById('inicio')||typeof showSection!=='function'){setTimeout(install,100);return}
  installed=true;publicMeta();document.body.classList.add('public-ready');refreshPublicCopy();loadEngagement();
  const base=showSection;showSection=function(id){base(id);updateHomeTopbar(id);setTimeout(improveCopy,0)};
  [250,800,1600].forEach(ms=>setTimeout(refreshPublicCopy,ms));
  document.addEventListener('rm-season-data-ready',()=>setTimeout(refreshPublicCopy,0),{once:true});
}
setTimeout(install,120);
})();