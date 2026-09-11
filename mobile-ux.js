(()=>{
const mq=window.matchMedia('(max-width:780px)');
let installed=false,timer=null;
function setClass(el,name,on=true){if(!el)return;if(on&&!el.classList.contains(name))el.classList.add(name);if(!on&&el.classList.contains(name))el.classList.remove(name)}
function makeSecondary(node,title,sub){if(!node||node.closest('.mobile-secondary'))return;const d=document.createElement('details');d.className='mobile-secondary';d.dataset.mobileWrap='1';d.innerHTML=`<summary><div>${title}${sub?`<span>${sub}</span>`:''}</div><b>+</b></summary>`;node.replaceWith(d);d.appendChild(node)}
function unwrapSecondary(){document.querySelectorAll('.mobile-secondary[data-mobile-wrap="1"]').forEach(d=>{const node=[...d.children].find(x=>x.tagName!=='SUMMARY');if(node)d.replaceWith(node);else d.remove()})}
function directActivate(id){
  const target=document.getElementById(id);if(!target)return false;
  document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));target.classList.add('active');
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
  try{if(typeof syncNav==='function')syncNav(id)}catch{}
  try{if(typeof closeUxMore==='function')closeUxMore()}catch{}
  try{
    const row=typeof sections!=='undefined'?sections.find(x=>x[0]===id):null;
    if(row){const title=document.getElementById('pageTitle'),sub=document.getElementById('pageSub');if(title)title.textContent=row[3];if(sub)sub.textContent=row[4]}
  }catch{}
  try{const u=new URL(location.href);u.searchParams.set('section',id);u.searchParams.delete('player');history.replaceState(null,'',u.href)}catch{}
  window.scrollTo({top:0,behavior:'smooth'});
  document.dispatchEvent(new CustomEvent('rm-mobile-nav-fallback',{detail:{id}}));
  return true;
}
function robustNavigate(id){
  let active=false;
  try{if(typeof window.showSection==='function')window.showSection(id);else if(typeof showSection==='function')showSection(id);active=document.getElementById(id)?.classList.contains('active')||false}catch(error){console.warn('Navegación móvil recuperada',error)}
  if(!active)requestAnimationFrame(()=>{if(!document.getElementById(id)?.classList.contains('active'))directActivate(id)});
  return false;
}
function hardenNav(){
  const nav=document.querySelector('.mobile-nav');if(!nav)return;
  nav.setAttribute('aria-label','Navegación principal');
  nav.querySelectorAll('button').forEach(btn=>{btn.type='button';btn.draggable=false;if(btn.dataset.section&&!btn.getAttribute('aria-label'))btn.setAttribute('aria-label',btn.textContent.trim())});
  if(nav.dataset.touchHardened)return;nav.dataset.touchHardened='1';
  const blockSelection=e=>{if(e.target.closest?.('.mobile-nav'))e.preventDefault()};
  nav.addEventListener('selectstart',blockSelection);nav.addEventListener('contextmenu',blockSelection);nav.addEventListener('dragstart',blockSelection);
  nav.addEventListener('pointerdown',e=>{if(!e.target.closest?.('button'))return;try{window.getSelection()?.removeAllRanges()}catch{}},{passive:true});
  nav.addEventListener('click',e=>{const btn=e.target.closest?.('button[data-section]');if(!btn||!nav.contains(btn))return;e.preventDefault();e.stopPropagation();robustNavigate(btn.dataset.section)},true);
}
function enhanceSwipe(){const items=[['#evolucion .a-match-tabs','Jornadas: desliza horizontalmente'],['#radar .radar-presets','Duelos predefinidos: desliza horizontalmente'],['#laboratorio .lab-criteria','Criterios del Laboratorio: desliza horizontalmente'],['#partido .our-xi-chips','Jugadores del once: desliza horizontalmente']];items.forEach(([sel,label])=>document.querySelectorAll(sel).forEach(el=>{if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',label);if(!el.hasAttribute('tabindex'))el.tabIndex=0}))}
function enhanceMobile(){if(!mq.matches){setClass(document.body,'mobile-ux',false);unwrapSecondary();return}setClass(document.body,'mobile-ux',true);const more=document.querySelector('.topbar .ux-top-more');if(more)more.setAttribute('aria-label','Abrir navegación y opciones');makeSecondary(document.querySelector('#laboratorio .lab-bottom'),'Detalle del XI y banquillo','Once completo, motivos y alternativas');makeSecondary(document.querySelector('#jerarquias .h-board-card'),'Matriz completa de posiciones','Vista global de toda la plantilla');makeSecondary(document.querySelector('#partido .vs-community'),'Nosotros vs comunidad','Comparación de tendencias del próximo partido');hardenNav();enhanceSwipe()}
function schedule(delay=55){clearTimeout(timer);timer=setTimeout(enhanceMobile,delay)}
function install(){
  if(installed)return;if(!document.body.classList.contains('ux-deduped')){setTimeout(install,80);return}
  installed=true;enhanceMobile();mq.addEventListener?.('change',()=>schedule(20));
  const previous=window.showSection;if(typeof previous==='function')window.showSection=function(id){previous(id);schedule(30)};
  ['rm-critical-modules-ready','rm-modules-ready','rm-ranking-official-ready','rm-community-updated','rm-matchday-polls-updated'].forEach(name=>document.addEventListener(name,()=>schedule(30)));
  [350,1300,3000].forEach(ms=>setTimeout(enhanceMobile,ms));
}
setTimeout(install,130);
})();
