(()=>{
let installed=false,attempts=0;
function personalButton(){return '<button data-section="mi-temporada" onclick="showSection(\'mi-temporada\');closeUxMore?.()"><span>◎</span><b>Mi temporada</b><small>Historial, favoritos, actividad y progreso personal.</small></button>'}
function loadPersonalSeasonPro(){
  if(!document.querySelector('link[data-personal-season-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='personal-season-pro.css?v=1';link.dataset.personalSeasonPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-personal-season-pro]')){const script=document.createElement('script');script.src='personal-season-pro.js?v=1';script.dataset.personalSeasonPro='1';document.body.appendChild(script)}
}
function loadRoundImpact(){
  if(!document.querySelector('link[data-round-impact]')){const link=document.createElement('link');link.rel='stylesheet';link.href='round-impact.css?v=1';link.dataset.roundImpact='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-round-impact]')){const script=document.createElement('script');script.src='round-impact.js?v=1';script.dataset.roundImpact='1';document.body.appendChild(script)}
}
function loadPredictionAnalytics(){
  if(!document.querySelector('link[data-prediction-analytics]')){const link=document.createElement('link');link.rel='stylesheet';link.href='prediction-analytics.css?v=2';link.dataset.predictionAnalytics='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-prediction-analytics]')){const script=document.createElement('script');script.src='prediction-analytics.js?v=2';script.dataset.predictionAnalytics='1';document.body.appendChild(script)}
}
function loadXiStability(){
  if(!document.querySelector('link[data-xi-stability]')){const link=document.createElement('link');link.rel='stylesheet';link.href='xi-stability.css?v=1';link.dataset.xiStability='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-xi-stability]')){const script=document.createElement('script');script.src='xi-stability.js?v=1';script.dataset.xiStability='1';document.body.appendChild(script)}
}
function loadDecisionBoard(){
  if(!document.querySelector('link[data-decision-board]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decision-board.css?v=1';link.dataset.decisionBoard='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-decision-board]')){const script=document.createElement('script');script.src='decision-board.js?v=1';script.dataset.decisionBoard='1';document.body.appendChild(script)}
}
function loadDecisionAudit(){
  if(!document.querySelector('link[data-decision-audit]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decision-audit.css?v=1';link.dataset.decisionAudit='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-decision-audit]')){const script=document.createElement('script');script.src='decision-audit.js?v=1';script.dataset.decisionAudit='1';document.body.appendChild(script)}
}
function loadDecisionActions(){
  if(!document.querySelector('link[data-decision-actions]')){const link=document.createElement('link');link.rel='stylesheet';link.href='decision-actions.css?v=1';link.datasetDecisionActions='1';link.dataset.decisionActions='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-decision-actions]')){const script=document.createElement('script');script.src='decision-actions.js?v=1';script.dataset.decisionActions='1';document.body.appendChild(script)}
}
function loadPredictionReadiness(){
  if(!document.querySelector('link[data-prediction-readiness]')){const link=document.createElement('link');link.rel='stylesheet';link.href='prediction-readiness.css?v=1';link.dataset.predictionReadiness='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-prediction-readiness]')){const script=document.createElement('script');script.src='prediction-readiness.js?v=1';script.dataset.predictionReadiness='1';document.body.appendChild(script)}
}
function loadScenarioLab(){
  if(!document.querySelector('link[data-scenario-lab]')){const link=document.createElement('link');link.rel='stylesheet';link.href='scenario-lab.css?v=1';link.dataset.scenarioLab='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-scenario-lab]')){const script=document.createElement('script');script.src='scenario-lab.js?v=1';script.dataset.scenarioLab='1';document.body.appendChild(script)}
}
function loadScenarioAudit(){
  if(!document.querySelector('link[data-scenario-audit]')){const link=document.createElement('link');link.rel='stylesheet';link.href='scenario-audit.css?v=1';link.dataset.scenarioAudit='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-scenario-audit]')){const script=document.createElement('script');script.src='scenario-audit.js?v=1';script.dataset.scenarioAudit='1';document.body.appendChild(script)}
}
function loadConsensusXI(){
  if(!document.querySelector('link[data-consensus-xi]')){const link=document.createElement('link');link.rel='stylesheet';link.href='consensus-xi.css?v=1';link.dataset.consensusXi='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-consensus-xi]')){const script=document.createElement('script');script.src='consensus-xi.js?v=1';script.dataset.consensusXi='1';document.body.appendChild(script)}
}
function loadCommunityPro(){
  if(!document.querySelector('link[data-community-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='community-pro.css?v=1';link.dataset.communityPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-community-pro]')){const script=document.createElement('script');script.src='community-pro.js?v=1';script.dataset.communityPro='1';document.body.appendChild(script)}
}
function loadCommunityLeague(){
  if(!document.querySelector('link[data-community-league]')){const link=document.createElement('link');link.rel='stylesheet';link.href='community-league.css?v=1';link.dataset.communityLeague='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-community-league]')){const script=document.createElement('script');script.src='community-league.js?v=1';script.dataset.communityLeague='1';document.body.appendChild(script)}
}
function scheduleRoundImpact(){const run=()=>loadRoundImpact();if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:1800});else setTimeout(run,700)}
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
  if(installed)return;if(!window.RMPersonal||!document.getElementById('uxMoreSheet')||typeof showSection!=='function'){if(++attempts<80)setTimeout(install,100);return}
  installed=true;refresh();loadPredictionAnalytics();scheduleRoundImpact();loadXiStability();loadDecisionBoard();loadDecisionAudit();loadDecisionActions();loadPredictionReadiness();loadScenarioLab();loadConsensusXI();loadScenarioAudit();loadCommunityLeague();
  const base=showSection;showSection=function(id){if(id==='mi-temporada')loadPersonalSeasonPro();if(id==='comunidad'){loadCommunityPro();loadCommunityLeague()}base(id);setTimeout(refresh,0);if(id==='mi-temporada')setTimeout(()=>window.RMPersonalSeasonPro?.render?.(),0);if(id==='comunidad'){setTimeout(()=>window.RMCommunityPro?.render?.(),120);setTimeout(()=>window.RMCommunityLeague?.render?.(),160)}if(id==='prediccion'||id==='mi-temporada')setTimeout(()=>window.RMPredictionAnalytics?.render?.(),140);if(id==='prediccion'||id==='partido')setTimeout(()=>window.RMXIStability?.render?.(),180);if(id==='prediccion'||id==='partido')setTimeout(()=>window.RMDecisionBoard?.render?.(),240);if(id==='prediccion')setTimeout(()=>window.RMDecisionActions?.render?.(),290);if(id==='prediccion'||id==='partido')setTimeout(()=>window.RMPredictionReadiness?.render?.(),320);if(id==='prediccion'||id==='partido')setTimeout(()=>window.RMScenarioLab?.render?.(),345);if(id==='prediccion'||id==='partido')setTimeout(()=>window.RMConsensusXI?.render?.(),370);if(id==='prediccion'||id==='mi-temporada')setTimeout(()=>window.RMDecisionAudit?.render?.(),410);if(id==='prediccion'||id==='mi-temporada')setTimeout(()=>window.RMScenarioAudit?.render?.(),455)};
  const active=document.querySelector('.section.active')?.id;if(active==='mi-temporada')loadPersonalSeasonPro();if(active==='comunidad'){loadCommunityPro();loadCommunityLeague()}
  document.addEventListener('rm-modules-ready',()=>setTimeout(refresh,0));[400,1200,2600].forEach(ms=>setTimeout(refresh,ms));
}
setTimeout(install,90);
})();