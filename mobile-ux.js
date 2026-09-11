(()=>{
const mq=window.matchMedia('(max-width:780px)');
let installed=false,timer=null;
function setClass(el,name,on=true){if(!el)return;if(on&&!el.classList.contains(name))el.classList.add(name);if(!on&&el.classList.contains(name))el.classList.remove(name)}
function makeSecondary(node,title,sub){
  if(!node||node.closest('.mobile-secondary'))return;
  const d=document.createElement('details');d.className='mobile-secondary';d.dataset.mobileWrap='1';
  d.innerHTML=`<summary><div>${title}${sub?`<span>${sub}</span>`:''}</div><b>+</b></summary>`;
  node.replaceWith(d);d.appendChild(node);
}
function unwrapSecondary(){
  document.querySelectorAll('.mobile-secondary[data-mobile-wrap="1"]').forEach(d=>{const node=[...d.children].find(x=>x.tagName!=='SUMMARY');if(node)d.replaceWith(node);else d.remove()});
}
function enhanceSwipe(){
  const items=[
    ['#evolucion .a-match-tabs','Jornadas: desliza horizontalmente'],
    ['#radar .radar-presets','Duelos predefinidos: desliza horizontalmente'],
    ['#laboratorio .lab-criteria','Criterios del Laboratorio: desliza horizontalmente'],
    ['#partido .our-xi-chips','Jugadores del once: desliza horizontalmente']
  ];
  items.forEach(([sel,label])=>document.querySelectorAll(sel).forEach(el=>{if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',label);if(!el.hasAttribute('tabindex'))el.tabIndex=0}));
}
function enhanceMobile(){
  if(!mq.matches){setClass(document.body,'mobile-ux',false);unwrapSecondary();return}
  setClass(document.body,'mobile-ux',true);
  const more=document.querySelector('.topbar .ux-top-more');if(more)more.setAttribute('aria-label','Abrir navegación y opciones');
  makeSecondary(document.querySelector('#laboratorio .lab-bottom'),'Detalle del XI y banquillo','Once completo, motivos y alternativas');
  makeSecondary(document.querySelector('#jerarquias .h-board-card'),'Matriz completa de posiciones','Vista global de toda la plantilla');
  makeSecondary(document.querySelector('#partido .vs-community'),'Nosotros vs comunidad','Comparación de tendencias del próximo partido');
  enhanceSwipe();
}
function schedule(){clearTimeout(timer);timer=setTimeout(enhanceMobile,70)}
function install(){
  if(installed)return;if(!document.body.classList.contains('ux-deduped')){setTimeout(install,100);return}
  installed=true;enhanceMobile();
  mq.addEventListener?.('change',enhanceMobile);
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  const previous=window.showSection;if(typeof previous==='function')window.showSection=function(id){previous(id);setTimeout(enhanceMobile,60)};
}
setTimeout(install,160);
})();
