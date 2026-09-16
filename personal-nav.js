(()=>{
let installed=false,attempts=0,menuRefreshTimer=null;
function loadLatestUiFixes(){
  if(window.RMUiFixes20260916||document.querySelector('script[data-rm-ui-fixes-20260916]'))return;
  const script=document.createElement('script');script.src='ui-fixes-20260916.js?v=1';script.dataset.rmUiFixes20260916='1';script.async=false;document.body.appendChild(script);
}
function personalButton(){return '<button data-section="mi-temporada" onclick="showSection(\'mi-temporada\');closeUxMore?.()"><span>◎</span><b>Mi temporada</b><small>Historial, favoritos, actividad y progreso personal.</small></button>'}
function loadPersonalSeasonPro(){
  if(!document.querySelector('link[data-personal-season-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='personal-season-pro.css?v=1';link.dataset.personalSeasonPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-personal-season-pro]')){const script=document.createElement('script');script.src='personal-season-pro.js?v=1';script.dataset.personalSeasonPro='1';document.body.appendChild(script)}
}
function loadSimpleExperience(){
  if(!document.querySelector('link[data-simple-experience]')){const link=document.createElement('link');link.rel='stylesheet';link.href='simple-mode.css?v=2';link.dataset.simpleExperience='1';document.head.appendChild(link)}
  if(!window.RMSimpleExperience&&!document.querySelector('script[data-simple-experience]')){const script=document.createElement('script');script.src='simple-mode.js?v=2';script.dataset.simpleExperience='1';script.async=false;document.body.appendChild(script)}
}
function loadCommunityPro(){
  if(!document.querySelector('link[data-community-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='community-pro.css?v=3';link.dataset.communityPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-community-pro]')){const script=document.createElement('script');script.src='community-pro.js?v=3';script.dataset.communityPro='1';document.body.appendChild(script)}
}
function loadCommunityLeague(){
  if(window.RMCommunityApi&&!window.RMCommunityApi.available?.())return false;
  if(!document.querySelector('link[data-community-league]')){const link=document.createElement('link');link.rel='stylesheet';link.href='community-league.css?v=1';link.dataset.communityLeague='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-community-league]')){const script=document.createElement('script');script.src='community-league.js?v=1';script.dataset.communityLeague='1';document.body.appendChild(script)}
  return true;
}
function openHowItWorks(){
  window.closeUxMore?.();let tries=0;
  const open=()=>{if(window.RMSiteGuide?.openOverview){window.RMSiteGuide.openOverview();return}if(window.RMSiteGuide?.open){window.RMSiteGuide.open();return}if(++tries<25)setTimeout(open,80)};
  open();
}
function ensureSingleHelpButton(tools){
  if(!tools)return null;
  const matches=[...tools.querySelectorAll('button')].filter(b=>/cómo funciona la web/i.test(b.textContent||''));
  let help=matches[0]||null;
  if(!help){help=document.createElement('button');tools.insertBefore(help,tools.children[1]||null)}
  help.id='uxHowRM';if(help.innerHTML!=='? Cómo funciona la web')help.innerHTML='? Cómo funciona la web';help.onclick=openHowItWorks;
  matches.slice(1).forEach(b=>b.remove());
  return help;
}
function injectMore(){
  const sheet=document.getElementById('uxMoreSheet');if(!sheet)return false;
  const firstGroup=sheet.querySelector('.ux-sheet-groups section>div');if(firstGroup&&!sheet.querySelector('[data-section="mi-temporada"]'))firstGroup.insertAdjacentHTML('afterbegin',personalButton());
  const tools=sheet.querySelector('.ux-sheet-tools');
  let help=null;
  if(tools){
    const title=tools.querySelector(':scope > span');if(title&&title.textContent!=='Ayuda, aplicación y datos')title.textContent='Ayuda, aplicación y datos';
    help=ensureSingleHelpButton(tools);
  }
  if(tools&&!document.getElementById('uxGlobalSearch')){
    const search=document.createElement('button');search.id='uxGlobalSearch';search.innerHTML='⌕ Buscar en RM 26/27';search.onclick=()=>{window.closeUxMore?.();window.rmOpenSearch?.()};tools.insertBefore(search,help?.nextSibling||tools.children[1]||null);
  }
  if(tools&&!document.getElementById('uxShareScreen')){
    const share=document.createElement('button');share.id='uxShareScreen';share.innerHTML='↗ Compartir esta pantalla';share.onclick=()=>{window.closeUxMore?.();window.rmShareCurrent?.()};const install=document.getElementById('uxInstallApp');tools.insertBefore(share,install||tools.children[3]||null);
  }
  return true;
}
function injectDesktop(){
  const nav=document.getElementById('navDesktop');if(!nav||nav.querySelector('[data-section="mi-temporada"]'))return;
  const firstGroup=nav.querySelector('.ux-nav-group');if(!firstGroup)return;const inicio=firstGroup.querySelector('[data-section="inicio"]');const b=document.createElement('button');b.dataset.section='mi-temporada';b.onclick=()=>showSection('mi-temporada');b.innerHTML='<span>◎</span><em>Mi temporada</em>';if(inicio)inicio.insertAdjacentElement('afterend',b);else firstGroup.appendChild(b)
}
function refresh(){injectMore();injectDesktop()}
function scheduleMenuRefresh(){clearTimeout(menuRefreshTimer);menuRefreshTimer=setTimeout(refresh,0)}
function install(){
  if(installed)return;if(!window.RMPersonal||!document.getElementById('uxMoreSheet')||typeof showSection!=='function'){if(++attempts<80)setTimeout(install,100);return}
  installed=true;refresh();loadSimpleExperience();loadCommunityLeague();
  new MutationObserver(scheduleMenuRefresh).observe(document.body,{childList:true});
  const base=showSection;showSection=function(id){
    if(id==='mi-temporada')loadPersonalSeasonPro();
    if(id==='comunidad'){loadCommunityPro();loadCommunityLeague()}
    base(id);setTimeout(refresh,0);
    if(id==='mi-temporada')setTimeout(()=>window.RMPersonalSeasonPro?.render?.(),0);
    if(id==='comunidad'){setTimeout(()=>window.RMCommunityPro?.render?.(),120);setTimeout(()=>window.RMCommunityLeague?.render?.(),160)}
  };
  const active=document.querySelector('.section.active')?.id;if(active==='mi-temporada')loadPersonalSeasonPro();if(active==='comunidad'){loadCommunityPro();loadCommunityLeague()}
  document.addEventListener('rm-modules-ready',()=>setTimeout(refresh,0));[200,400,800,1200,2600].forEach(ms=>setTimeout(refresh,ms));
}
loadLatestUiFixes();
setTimeout(install,90);
})();