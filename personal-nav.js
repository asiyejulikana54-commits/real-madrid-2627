(()=>{
let installed=false,attempts=0,menuRefreshTimer=null,decisionCenterLoader=null,decisionCoachLoader=null,reviewArchiveLoader=null;
function loadLatestUiFixes(){
  if(window.RMUiFixes20260916||document.querySelector('script[data-rm-ui-fixes-20260916]'))return;
  const script=document.createElement('script');script.src='ui-fixes-20260916.js?v=1';script.dataset.rmUiFixes20260916='1';script.async=false;document.body.appendChild(script);
}
function personalButton(){return '<button data-section="mi-temporada" onclick="showSection(\'mi-temporada\');closeUxMore?.()"><span>◎</span><b>Mi temporada</b><small>Historial, favoritos, actividad y progreso personal.</small></button>'}
function loadPersonalSeasonPro(){
  if(!document.querySelector('link[data-personal-season-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='personal-season-pro.css?v=1';link.dataset.personalSeasonPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-personal-season-pro]')){const script=document.createElement('script');script.src='personal-season-pro.js?v=2';script.dataset.personalSeasonPro='1';document.body.appendChild(script)}
}
function loadDecisionProfile(){
  if(!document.querySelector('link[data-decision-profile]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decision-profile.css?v=1';link.dataset.decisionProfile='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-decision-profile]')){const script=document.createElement('script');script.src='decision-profile.js?v=2';script.dataset.decisionProfile='1';script.addEventListener('load',()=>setTimeout(()=>window.RMDecisionProfile?.render?.(),80),{once:true});document.body.appendChild(script)}else setTimeout(()=>window.RMDecisionProfile?.render?.(),80)
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
function ensureDecisionStyle(file,key){
  const base=file.split('?')[0];if(document.querySelector(`link[href^="${base}"]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=file;link.dataset[key]='1';document.head.appendChild(link)
}
function ensureDecisionScript(file,key,globalName){
  if(globalName&&window[globalName])return Promise.resolve();
  const base=file.split('?')[0],existing=[...document.scripts].find(s=>String(s.getAttribute('src')||'').startsWith(base));
  if(existing){
    if(globalName&&window[globalName])return Promise.resolve();
    return new Promise(resolve=>{existing.addEventListener('load',resolve,{once:true});setTimeout(resolve,1200)})
  }
  return new Promise(resolve=>{const script=document.createElement('script');script.src=file;script.dataset[key]='1';script.async=false;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',resolve,{once:true});document.body.appendChild(script)})
}
function loadDecisionCenter(){
  if(window.RMDecisionCenter){setTimeout(()=>window.RMDecisionCenter?.render?.(),0);return Promise.resolve()}
  if(decisionCenterLoader)return decisionCenterLoader;
  [
    ['prediction-pro.css?v=1','predictionPro'],['round-impact.css?v=1','roundImpact'],['xi-stability.css?v=1','xiStability'],['decision-board.css?v=1','decisionBoard'],
    ['prediction-readiness.css?v=1','predictionReadiness'],['scenario-lab.css?v=1','scenarioLab'],['consensus-xi.css?v=1','consensusXi'],['decision-center.css?v=1','decisionCenter']
  ].forEach(([file,key])=>ensureDecisionStyle(file,key));
  const scripts=[
    ['prediction-pro.js?v=1','predictionPro','RMPredictionPro'],
    ['round-impact.js?v=1','roundImpact','RMRoundImpact'],
    ['lineup-semantics.js?v=1','lineupSemantics','RMLineupSemantics'],
    ['xi-stability.js?v=1','xiStability','RMXIStability'],
    ['decision-board.js?v=1','decisionBoard','RMDecisionBoard'],
    ['prediction-readiness.js?v=1','predictionReadiness','RMPredictionReadiness'],
    ['scenario-lab.js?v=1','scenarioLab','RMScenarioLab'],
    ['consensus-xi.js?v=1','consensusXi','RMConsensusXI'],
    ['decision-center.js?v=1','decisionCenter','RMDecisionCenter']
  ];
  decisionCenterLoader=scripts.reduce((promise,args)=>promise.then(()=>ensureDecisionScript(...args)),Promise.resolve()).then(()=>{
    setTimeout(()=>window.RMDecisionCenter?.render?.(),80);return true
  }).catch(()=>false).finally(()=>{if(!window.RMDecisionCenter)decisionCenterLoader=null});
  return decisionCenterLoader
}
function loadDecisionCoach(){
  if(window.RMDecisionCoach){setTimeout(()=>window.RMDecisionCoach?.render?.(),0);return Promise.resolve(true)}
  if(decisionCoachLoader)return decisionCoachLoader;
  ensureDecisionStyle('decision-audit.css?v=1','decisionAudit');
  ensureDecisionStyle('decision-profile.css?v=1','decisionProfile');
  ensureDecisionStyle('decision-coach.css?v=1','decisionCoach');
  decisionCoachLoader=loadDecisionCenter()
    .then(()=>ensureDecisionScript('decision-audit.js?v=2','decisionAudit','RMDecisionAudit'))
    .then(()=>ensureDecisionScript('decision-profile.js?v=2','decisionProfile','RMDecisionProfile'))
    .then(()=>ensureDecisionScript('decision-coach.js?v=1','decisionCoach','RMDecisionCoach'))
    .then(()=>{setTimeout(()=>window.RMDecisionCoach?.render?.(),120);return true})
    .catch(()=>false).finally(()=>{if(!window.RMDecisionCoach)decisionCoachLoader=null});
  return decisionCoachLoader
}
function loadReviewArchive(){
  if(window.RMReviewArchive){setTimeout(()=>window.RMReviewArchive?.render?.(),0);return Promise.resolve(true)}
  if(reviewArchiveLoader)return reviewArchiveLoader;
  ensureDecisionStyle('prediction-analytics.css?v=1','predictionAnalytics');
  ensureDecisionStyle('decision-audit.css?v=1','decisionAudit');
  ensureDecisionStyle('scenario-audit.css?v=1','scenarioAudit');
  ensureDecisionStyle('review-archive.css?v=1','reviewArchive');
  reviewArchiveLoader=loadDecisionCenter()
    .then(()=>ensureDecisionScript('prediction-analytics.js?v=2','predictionAnalytics','RMPredictionAnalytics'))
    .then(()=>ensureDecisionScript('decision-audit.js?v=2','decisionAudit','RMDecisionAudit'))
    .then(()=>ensureDecisionScript('scenario-audit.js?v=1','scenarioAudit','RMScenarioAudit'))
    .then(()=>ensureDecisionScript('review-archive.js?v=2','reviewArchive','RMReviewArchive'))
    .then(()=>{setTimeout(()=>window.RMReviewArchive?.render?.(),140);return true})
    .catch(()=>false).finally(()=>{if(!window.RMReviewArchive)reviewArchiveLoader=null});
  return reviewArchiveLoader
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
    if(id==='mi-temporada'){loadPersonalSeasonPro();loadDecisionProfile();loadReviewArchive()}
    if(id==='comunidad'){loadCommunityPro();loadCommunityLeague()}
    if(id==='prediccion'){loadDecisionCenter();loadDecisionCoach()}
    base(id);setTimeout(refresh,0);
    if(id==='mi-temporada'){setTimeout(()=>window.RMPersonalSeasonPro?.render?.(),0);setTimeout(()=>window.RMDecisionProfile?.render?.(),180);setTimeout(()=>window.RMReviewArchive?.render?.(),300)}
    if(id==='comunidad'){setTimeout(()=>window.RMCommunityPro?.render?.(),120);setTimeout(()=>window.RMCommunityLeague?.render?.(),160)}
    if(id==='prediccion'){setTimeout(()=>window.RMDecisionCenter?.render?.(),180);setTimeout(()=>window.RMDecisionCoach?.render?.(),280)}
  };
  const active=document.querySelector('.section.active')?.id;if(active==='mi-temporada'){loadPersonalSeasonPro();loadDecisionProfile();loadReviewArchive()}if(active==='comunidad'){loadCommunityPro();loadCommunityLeague()}if(active==='prediccion'){loadDecisionCenter();loadDecisionCoach()}
  document.addEventListener('rm-modules-ready',()=>{if(document.getElementById('prediccion')?.classList.contains('active')){loadDecisionCenter();loadDecisionCoach()}if(document.getElementById('mi-temporada')?.classList.contains('active')){loadDecisionProfile();loadReviewArchive()}setTimeout(refresh,0)});[200,400,800,1200,2600].forEach(ms=>setTimeout(refresh,ms));
}
loadLatestUiFixes();
setTimeout(install,90);
})();