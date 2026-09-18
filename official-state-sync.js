(()=>{
const HISTORY_KEY='rm_prediction_history_v1';
let installed=false,observer=null,scheduled=false,lastSignature='';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function matchTeams(m){const rival=String(m?.rival||'Rival');return m?.home===false?{home:rival,away:'Real Madrid'}:{home:'Real Madrid',away:rival}}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length===11?officialXI:null,null)}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function currentPrediction(){
  const m=match();if(!m)return null;
  return safe(()=>JSON.parse(localStorage.getItem(`rm_prediction_${m.id}`)||'null'),null)
}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function scorePrediction(data,actual){
  if(!data?.xi||!Array.isArray(actual))return null;
  const predicted=values(data.xi);if(predicted.length!==11||new Set(predicted.map(canonical)).size!==11)return null;
  const set=new Set(actual.map(canonical)),hits=predicted.filter(n=>set.has(canonical(n))),misses=predicted.filter(n=>!set.has(canonical(n)));
  return {score:hits.length,hits,misses};
}
function label(m){
  if(!m)return 'Partido';
  const d=new Date(m.kickoff||'');
  const date=Number.isNaN(d.getTime())?'':` · ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  return `${m.rival||'Partido'}${date}`;
}
function syncPredictionResult(){
  const m=match(),actual=official();if(!m||!actual)return null;
  const key=`rm_prediction_${m.id}`,data=currentPrediction(),result=scorePrediction(data,actual);if(!data||!result)return null;
  const scoredAt=data.scoredAt||new Date().toISOString(),next={...data,...result,scoredAt,label:data.label||label(m)};
  safe(()=>localStorage.setItem(key,JSON.stringify(next)));
  const ledger=safe(()=>JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}'),{})||{};
  ledger[m.id]={...(ledger[m.id]||{}),...next,matchId:m.id,rival:m.rival||ledger[m.id]?.rival||'',label:next.label};
  safe(()=>localStorage.setItem(HISTORY_KEY,JSON.stringify(ledger)));
  return next;
}
function officialStage(){
  const m=match(),actual=official();if(!m||!actual)return null;
  return {eyebrow:'XI OFICIAL',title:`XI oficial publicado${m.rival?` contra el ${m.rival}`:''}`,copy:'La alineación ya está confirmada. Revisa tus aciertos y compárala con la comunidad y el XI confirmado.',action:'Revisar XI',section:'prediccion',tone:'locked',count:'11 confirmados'};
}
function wrapApis(){
  const stage=officialStage();
  if(stage&&window.RMPublicEngagement&&!window.RMPublicEngagement.__officialStateSync){
    const base=window.RMPublicEngagement,baseStage=base.stage?.bind(base);
    window.RMPublicEngagement=Object.freeze({...base,stage:()=>officialStage()||baseStage?.()||null,__officialStateSync:true});
  }
  if(window.RMMatchdayCenter&&!window.RMMatchdayCenter.__officialStateSync){
    const base=window.RMMatchdayCenter,basePhase=base.phase?.bind(base);
    window.RMMatchdayCenter=Object.freeze({...base,phase:()=>official()?{id:'official',label:'XI oficial',clock:'Publicado'}:(basePhase?.()||{id:'pre',label:'Previa',clock:'Predicción abierta'}),__officialStateSync:true});
  }
}
const replacements=[
  ['Esperando el XI oficial para calcular tus aciertos.','XI oficial publicado. Ya puedes revisar tus aciertos.'],
  ['Predicción cerrada · esperando resultado','XI oficial publicado · resultado disponible'],
  ['La liga empieza con el primer XI oficial','XI oficial publicado · ranking pendiente de sincronizar'],
  ['Aparecerá al publicarse el primer XI oficial puntuable.','El XI oficial ya está publicado. El ranking aparecerá al sincronizarse la jornada.'],
  ['Empezará a contar cuando publiquemos el primer once oficial.','El XI oficial ya está publicado. El ranking aparecerá al sincronizarse la jornada.'],
  ['El ranking aparecerá cuando haya al menos un once oficial puntuado.','XI oficial publicado. El ranking se actualizará al sincronizarse la jornada.'],
  ['Cuando tengamos el primer XI oficial cerrado aparecerá aquí la comparación jornada a jornada.','La comparación aparecerá cuando exista una jornada con predicciones comparables cerradas.'],
  ['Construye tu XI, compáralo con la comunidad y, cuando se publique, con el XI oficial.','Revisa tu XI, compáralo con la comunidad y con el XI oficial ya publicado.']
];
function replaceText(root=document.body){
  if(!root||!official())return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
    let text=node.nodeValue||'',next=text;
    for(const [from,to] of replacements)if(next.includes(from))next=next.split(from).join(to);
    next=next.replace(/(\d+) pendientes de XI oficial/g,'$1 pendientes de cerrar');
    if(next!==text)node.nodeValue=next;
  }
}
function patchPredictionHeader(){
  const m=match(),actual=official(),section=document.getElementById('prediccion');if(!m||!actual||!section)return;
  const head=section.querySelector(':scope>.section-head'),h=head?.querySelector('h2'),p=head?.querySelector('p'),status=document.getElementById('predictionStatus');
  if(h&&!/Revisión|oficial/i.test(h.textContent||''))h.textContent=`Revisión del XI oficial contra el ${m.rival||'rival'}`;
  if(p)p.textContent='El once oficial ya está publicado. Comprueba tus aciertos y revisa las diferencias con la comunidad y el XI confirmado.';
  if(status){status.textContent='XI oficial publicado';status.classList.add('closed');status.classList.remove('open')}
  const hero=section.querySelector('.prediction-hero');if(hero){
    const eyebrow=hero.querySelector('.eyebrow'),title=hero.querySelector('h2'),copy=hero.querySelector('p.muted'),rules=hero.querySelector('.prediction-rules');
    if(eyebrow)eyebrow.textContent='XI OFICIAL PUBLICADO';
    if(title)title.textContent='La alineación de Mourinho ya está confirmada';
    if(copy)copy.textContent='Revisa cuántos titulares acertaste y qué cambió respecto a las predicciones previas.';
    if(rules){const spans=rules.querySelectorAll('span');const d=new Date(m.kickoff||'');const date=Number.isNaN(d.getTime())?'':`${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('es-ES',{month:'short'}).toUpperCase()} · ${d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}`;const b=rules.querySelector('b');if(b){const t=matchTeams(m);b.textContent=`${t.home.toUpperCase()} vs ${t.away.toUpperCase()}`;}if(spans[0])spans[0].textContent=date;if(spans[1])spans[1].textContent='XI publicado'}
  }
}
function patchCommunityPending(){
  if(!official())return;
  const board=document.getElementById('communityLeaderboard');
  if(board&&/once oficial|XI oficial/i.test(board.textContent||'')&&!/publicado/i.test(board.textContent||''))board.innerHTML='<div class="result-pending"><b>XI oficial publicado</b><span>El ranking se actualizará cuando la jornada quede sincronizada.</span></div>';
}
function refreshModules(){
  safe(()=>window.RMPredictionAnalytics?.settle?.());
  for(const api of [window.RMPersonalHome,window.RMPersonal,window.RMEngagementLoop,window.RMHomeLower,window.RMHomePro,window.RMMatchdayPro,window.RMMatchdayCenter,window.RMOfficialXIReview,window.RMPostXiCenter,window.RMPredictionPro,window.RMPredictionReadiness,window.RMCommunityLeague])safe(()=>api?.render?.());
}
function apply(){
  scheduled=false;if(!official())return false;
  const m=match(),record=syncPredictionResult(),sig=`${m?.id||''}|${official()?.map(canonical).join('|')||''}|${record?.score??''}`;
  wrapApis();patchPredictionHeader();replaceText();patchCommunityPending();
  if(sig!==lastSignature){lastSignature=sig;document.dispatchEvent(new CustomEvent('rm-official-state-synced',{detail:{matchId:m?.id||null,score:record?.score??null}}));document.dispatchEvent(new CustomEvent('rm-local-prediction-updated'));}
  return true;
}
function schedule(refresh=false){if(scheduled)return;scheduled=true;setTimeout(()=>{apply();if(refresh)refreshModules();setTimeout(()=>{apply();replaceText()},80)},0)}
function install(){
  if(installed)return;installed=true;schedule(true);
  ['rm-modules-ready','rm-critical-modules-ready','rm-season-data-ready','rm-community-updated','rm-ranking-official-ready','rm-post-xi-center-rendered','rm-official-xi-review-rendered'].forEach(ev=>document.addEventListener(ev,()=>schedule(true)));
  window.addEventListener('storage',e=>{if(!e.key||e.key.startsWith('rm_prediction_'))schedule(true)});
  observer=new MutationObserver(()=>schedule(false));observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  [250,700,1500,3000].forEach(ms=>setTimeout(()=>schedule(true),ms));
  window.RMOfficialStateSync=Object.freeze({apply,syncPredictionResult,stage:officialStage});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
