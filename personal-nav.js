(()=>{
let installed=false;
function personalButton(){return '<button data-section="mi-temporada" onclick="showSection(\'mi-temporada\');closeUxMore?.()"><span>◎</span><b>Mi temporada</b><small>Historial, favoritos, actividad y progreso personal.</small></button>'}
function loadPersonalSeasonPro(){
  if(!document.querySelector('link[data-personal-season-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='personal-season-pro.css?v=1';link.dataset.personalSeasonPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-personal-season-pro]')){const script=document.createElement('script');script.src='personal-season-pro.js?v=1';script.dataset.personalSeasonPro='1';document.body.appendChild(script)}
}
function injectMore(){
  const sheet=document.getElementById('uxMoreSheet');if(!sheet)return false;
  const firstGroup=sheet.querySelector('.ux-sheet-groups section>div');if(firstGroup&&!sheet.querySelector('[data-section="mi-temporada"]'))firstGroup.insertAdjacentHTML('afterbegin',personalButton());
  const tools=sheet.querySelector('.ux-sheet-tools');if(tools&&!document.getElementById('uxGlobalSearch')){
    const search=document.createElement('button');search.id='uxGlobalSearch';search.innerHTML='⌕ Buscar en RM 26/27';search.onclick=()=>{window.closeUxMore?.();window.rmOpenSearch?.()};tools.insertBefore(search,tools.children[1]||null);
  }
  if(tools&&!document.getElementById('uxShareScreen')){
    const share=document.createElement('button');share.id='uxShareScreen';share.innerHTML='↗ Compartir esta pantalla';share.onclick=()=>{window.closeUxMore?.();window.rmShareCurrent?.()};const install=document.getElementById('uxInstallApp');tools.insertBefore(share,install||tools.children[2]||null);
  }
  return true;
}
function injectDesktop(){
  const nav=document.getElementById('navDesktop');if(!nav||nav.querySelector('[data-section="mi-temporada"]'))return;
  const firstGroup=nav.querySelector('.ux-nav-group');if(!firstGroup)return;const inicio=firstGroup.querySelector('[data-section="inicio"]');const b=document.createElement('button');b.dataset.section='mi-temporada';b.onclick=()=>showSection('mi-temporada');b.innerHTML='<span>◎</span><em>Mi temporada</em>';if(inicio)inicio.insertAdjacentElement('afterend',b);else firstGroup.appendChild(b)
}
function refresh(){injectMore();injectDesktop()}
function install(){
  if(installed)return;if(!window.RMPersonal||!document.getElementById('uxMoreSheet')||typeof showSection!=='function'){setTimeout(install,100);return}
  installed=true;refresh();
  const base=showSection;showSection=function(id){if(id==='mi-temporada')loadPersonalSeasonPro();base(id);setTimeout(refresh,0);if(id==='mi-temporada')setTimeout(()=>window.RMPersonalSeasonPro?.render?.(),0)};
  if(document.querySelector('.section.active')?.id==='mi-temporada')loadPersonalSeasonPro();
  document.addEventListener('rm-modules-ready',()=>setTimeout(refresh,0));[400,1200,2600].forEach(ms=>setTimeout(refresh,ms));
}
setTimeout(install,90);
})();
