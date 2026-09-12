(()=>{
const KEY='rm_analysis_context_v1';
const STATS_KEY='rm_stats_pro_v2_state';
const DEFAULTS={competition:'ALL',horizon:'ALL'};
let installed=false,attempts=0,syncingStats=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function season(){return window.RMSeasonData||null}
function allMatches(){return safe(()=>season()?.matches||[],[])||[]}
function read(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULTS}}}
const current=read();
function competitions(){return [...new Set(allMatches().map(m=>m.comp).filter(Boolean))]}
function sanitize(next={}){
  const competition=next.competition==='ALL'||competitions().includes(next.competition)?next.competition:'ALL';
  const horizon=['ALL','5','3','1'].includes(String(next.horizon))?String(next.horizon):'ALL';
  return {competition,horizon};
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(current))}catch{}}
function persistStats(){
  try{const prior=JSON.parse(localStorage.getItem(STATS_KEY)||'{}')||{};localStorage.setItem(STATS_KEY,JSON.stringify({...prior,competition:current.competition,horizon:current.horizon}))}catch{}
}
function state(){return {...current}}
function matches(){
  let rows=allMatches();
  if(current.competition!=='ALL')rows=rows.filter(m=>m.comp===current.competition);
  if(current.horizon!=='ALL'){const n=Math.max(1,Number(current.horizon)||1);rows=rows.slice(-n)}
  return rows;
}
function label(){
  const rows=matches(),competition=current.competition==='ALL'?'todas las competiciones':current.competition;
  if(!rows.length)return `Sin partidos · ${competition}`;
  const period=current.horizon==='ALL'?`${rows.length} jornada${rows.length===1?'':'s'}`:`últimos ${rows.length}`;
  return `${period} · ${competition}`;
}
function emit(source='api'){
  const detail={state:state(),matches:matches().map(m=>m.id),label:label(),source};
  document.dispatchEvent(new CustomEvent('rm-analysis-context-updated',{detail}));
  return detail;
}
function syncStats(render=true){
  const api=window.RMStatsPro;if(!api?.state)return false;
  api.state.competition=current.competition;api.state.horizon=current.horizon;persistStats();
  if(render&&api.render&&!syncingStats){syncingStats=true;setTimeout(()=>{safe(()=>api.render());syncingStats=false},0)}
  return true;
}
function set(next={},source='api'){
  const merged=sanitize({...current,...next}),changed=merged.competition!==current.competition||merged.horizon!==current.horizon;
  current.competition=merged.competition;current.horizon=merged.horizon;persist();persistStats();
  if(source!=='stats-render')syncStats(false);
  if(changed)emit(source);
  return state();
}
function reset(source='api'){return set(DEFAULTS,source)}
function presetContext(id){if(id==='last3'||id==='attackform')return {competition:'ALL',horizon:'3'};return {...DEFAULTS}}
function bindStatsBridge(){
  document.addEventListener('change',e=>{
    if(e.target?.id==='spCompetition')set({competition:e.target.value},'stats-ui');
    if(e.target?.id==='spHorizon')set({horizon:e.target.value},'stats-ui');
  },true);
  document.addEventListener('click',e=>{
    const preset=e.target?.closest?.('[data-sp-preset]');if(preset)set(presetContext(preset.dataset.spPreset),'stats-ui');
    if(e.target?.closest?.('[data-sp-reset]'))reset('stats-ui');
  },true);
  document.addEventListener('rm-stats-pro-rendered',e=>{
    const d=e.detail||{};
    if(d.competition===current.competition&&String(d.horizon)===String(current.horizon))return;
    syncStats(true);
  });
}
function loadEngagementLoop(){
  if(!document.querySelector('link[data-engagement-loop]')){const link=document.createElement('link');link.rel='stylesheet';link.href='engagement-loop.css?v=1';link.dataset.engagementLoop='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-engagement-loop]')){const script=document.createElement('script');script.src='engagement-loop.js?v=1';script.dataset.engagementLoop='1';document.body.appendChild(script)}
}
function loadEngagementRewards(){
  if(!document.querySelector('link[data-engagement-rewards]')){const link=document.createElement('link');link.rel='stylesheet';link.href='engagement-rewards.css?v=1';link.dataset.engagementRewards='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-engagement-rewards]')){const script=document.createElement('script');script.src='engagement-rewards.js?v=1';script.dataset.engagementRewards='1';document.body.appendChild(script)}
}
function loadQuickPicks(){
  if(!document.querySelector('link[data-quick-picks]')){const link=document.createElement('link');link.rel='stylesheet';link.href='quick-picks.css?v=1';link.dataset.quickPicks='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-quick-picks]')){const script=document.createElement('script');script.src='quick-picks.js?v=1';script.dataset.quickPicks='1';document.body.appendChild(script)}
}
function loadFavoriteWatch(){
  if(!document.querySelector('link[data-favorite-watch]')){const link=document.createElement('link');link.rel='stylesheet';link.href='favorite-watch.css?v=1';link.dataset.favoriteWatch='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-favorite-watch]')){const script=document.createElement('script');script.src='favorite-watch.js?v=1';script.dataset.favoriteWatch='1';document.body.appendChild(script)}
}
function loadActivityCenter(){
  if(!document.querySelector('link[data-activity-center]')){const link=document.createElement('link');link.rel='stylesheet';link.href='activity-center.css?v=1';link.dataset.activityCenter='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-activity-center]')){const script=document.createElement('script');script.src='activity-center.js?v=1';script.dataset.activityCenter='1';document.body.appendChild(script)}
}
function loadDeepLinks(){
  if(!document.querySelector('script[data-deep-links]')){const script=document.createElement('script');script.src='deep-links.js?v=1';script.dataset.deepLinks='1';document.body.appendChild(script)}
}
function loadSharedEntry(){
  if(!document.querySelector('link[data-shared-entry]')){const link=document.createElement('link');link.rel='stylesheet';link.href='social-entry.css?v=1';link.dataset.sharedEntry='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-shared-entry]')){const script=document.createElement('script');script.src='social-entry.js?v=1';script.dataset.sharedEntry='1';document.body.appendChild(script)}
}
function loadMomentumPro(){
  if(!document.querySelector('link[data-momentum-pro]')){const link=document.createElement('link');link.rel='stylesheet';link.href='momentum-pro.css?v=1';link.dataset.momentumPro='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-momentum-pro]')){const script=document.createElement('script');script.src='momentum-pro.js?v=1';script.dataset.momentumPro='1';document.body.appendChild(script)}
}
function loadPostXiCenter(){
  if(!document.querySelector('link[data-post-xi-center]')){const link=document.createElement('link');link.rel='stylesheet';link.href='post-xi-center.css?v=1';link.dataset.postXiCenter='1';document.head.appendChild(link)}
  if(!document.querySelector('script[data-post-xi-center]')){const script=document.createElement('script');script.src='post-xi-center.js?v=1';script.dataset.postXiCenter='1';document.body.appendChild(script)}
}
function bindQuickPicksNav(){
  document.addEventListener('click',e=>{const nav=e.target?.closest?.('[data-section]');if(!nav||!['inicio','mi-temporada','partido'].includes(nav.dataset.section))return;setTimeout(()=>safe(()=>window.RMQuickPicks?.render?.()),220)},true);
}
function install(){
  if(installed)return;
  if(!season()){if(++attempts<80)setTimeout(install,100);return}
  installed=true;Object.assign(current,sanitize(current));persist();persistStats();bindStatsBridge();bindQuickPicksNav();
  window.RMAnalysisContext=Object.freeze({state,matches,label,set,reset,competitions,allMatches,syncStats});
  syncStats(true);loadEngagementLoop();loadEngagementRewards();loadQuickPicks();loadFavoriteWatch();loadActivityCenter();loadDeepLinks();loadSharedEntry();loadMomentumPro();loadPostXiCenter();
  document.dispatchEvent(new CustomEvent('rm-analysis-context-ready',{detail:{state:state(),label:label()}}));
}
['rm-season-data-ready','rm-season-extension-ready','rm-season-order-corrected'].forEach(ev=>document.addEventListener(ev,()=>{if(installed){Object.assign(current,sanitize(current));persist();persistStats();syncStats(false);emit('season')}}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();