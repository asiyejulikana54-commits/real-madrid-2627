const communitySection=['comunidad','♟','Comunidad','La comunidad','XI más votado, porcentajes y ranking de aciertos.'];
const predictionIndex=sections.findIndex(s=>s[0]==='prediccion');
if(!sections.some(s=>s[0]==='comunidad'))sections.splice(predictionIndex,0,communitySection);
document.getElementById('navDesktop').innerHTML=navHtml(false);
document.getElementById('navMobile').innerHTML=navHtml(true);

const participantStorageKey='rm_community_participant_id';
function getParticipantId(){let id=localStorage.getItem(participantStorageKey);if(!id){id=(crypto.randomUUID?crypto.randomUUID():`rm_${Date.now()}_${Math.random().toString(36).slice(2)}`);localStorage.setItem(participantStorageKey,id)}return id}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function communityBackendAvailable(){return /^https?:$/.test(location.protocol)}
function communityApiUrl(params={}){
  const base=location.hostname.endsWith('github.io')?'https://real-madrid-2627-panel.netlify.app/.netlify/functions/community-v2':'/.netlify/functions/community-v2';
  const url=new URL(base,location.href);for(const [key,value] of Object.entries(params))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));return url.href;
}

const baseShowSection=showSection;
showSection=function(id){baseShowSection(id);if(id==='comunidad')loadCommunity()};

const predictionActions=document.querySelector('#prediccion .prediction-actions');
if(predictionActions&&!document.getElementById('goCommunityBtn')){
  const goCommunityBtn=document.createElement('button');
  goCommunityBtn.className='btn';goCommunityBtn.id='goCommunityBtn';goCommunityBtn.textContent='Ver comunidad';
  goCommunityBtn.onclick=()=>showSection('comunidad');predictionActions.appendChild(goCommunityBtn);
}

const baseSavePrediction=savePrediction;
savePrediction=async function(){
  if(predictionIsClosed()){toast('La predicción ya está cerrada');return}
  const xi=currentPredictionXI(),values=predictionValues(xi),alias=document.getElementById('predictionName').value.trim();
  if(values.length!==11){toast('Completa los 11 jugadores');return}
  if(new Set(values).size!==11){toast('No puedes repetir jugadores');return}
  if(alias.length<2){toast('Pon un apodo de al menos 2 caracteres');return}
  baseSavePrediction();
  const btn=document.getElementById('savePredictionBtn');btn.disabled=true;btn.textContent=communityBackendAvailable()?'Publicando…':'Guardando…';
  if(!communityBackendAvailable()){
    toast('Predicción guardada en tu móvil');btn.textContent='Publicar predicción';btn.disabled=predictionIsClosed();document.dispatchEvent(new CustomEvent('rm-local-prediction-updated'));return;
  }
  try{
    const response=await fetch(communityApiUrl(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:getParticipantId(),alias,matchId:predictionMatch.id,xi})});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);
    toast(result.updated?'Predicción comunitaria actualizada':'Predicción publicada en la comunidad');communityCache=null;await loadCommunity(true);setTimeout(()=>showSection('comunidad'),350)
  }catch(error){toast(`Guardada en tu móvil · ${error.message||'sin conexión con la comunidad'}`)}
  finally{btn.textContent='Publicar predicción';btn.disabled=predictionIsClosed()}
};

document.getElementById('savePredictionBtn').textContent='Publicar predicción';
const resultBox=document.getElementById('predictionResult');if(resultBox)resultBox.innerHTML=resultBox.innerHTML.replace('Guardar predicción','Publicar predicción');

let communityCache=window.RMCommunityData||null;
function renderCommunityUnavailable(){
  const total=document.getElementById('communityTotal');if(total)total.textContent='—';
  const pitch=document.getElementById('communityPitch');if(pitch)pitch.innerHTML='<div class="community-loading">La comunidad en vivo necesita conexión web. Tu predicción local sigue funcionando.</div>';
  const polls=document.getElementById('communityPolls');if(polls)polls.innerHTML='<div class="result-pending"><b>Comunidad en vivo en espera</b><span>Conéctate a internet para cargar votos, clasificación y ligas.</span></div>';
  const board=document.getElementById('communityLeaderboard');if(board)board.innerHTML='<div class="result-pending"><b>Ranking comunitario no cargado</b><span>Se mostrará cuando vuelva la conexión.</span></div>';
}
function renderCommunityPitch(popularXI,total){
  const pitch=document.getElementById('communityPitch');if(!pitch)return;
  if(!total){pitch.innerHTML='<div class="community-loading">Todavía no hay pronósticos. Sé el primero desde “Predicción”.</div>';return}
  pitch.innerHTML=slots.map(s=>{const choice=popularXI?.[s[0]];return `<div class="community-slot" style="left:${s[2]}%;top:${s[3]}%"><small>${s[1]}</small><b>${choice?escapeHtml(displayName(choice.name)):'—'}</b><span>${choice?`${choice.percentage}%${choice.globalPercentage!==choice.percentage?` (${choice.globalPercentage}%)`:''}`:'0%'}</span></div>`}).join('')
}
function pollBlock(title,slotData){
  const items=(slotData||[]).slice(0,4);if(!items.length)return `<div class="community-poll"><h3>${title}</h3><div class="muted">Sin votos todavía</div></div>`;
  return `<div class="community-poll"><h3>${title}</h3>${items.map(x=>`<div class="poll-row"><div><span>${escapeHtml(displayName(x.name))}</span><b>${x.percentage}%${x.multiPosition?` <small>(global ${x.globalPercentage}%)</small>`:''}</b></div><div class="poll-bar"><i style="width:${x.percentage}%"></i></div></div>`).join('')}</div>`
}
function renderCommunity(data){
  if(!data)return;communityCache=data;window.RMCommunityData=data;const total=data.totalPredictions||0;
  document.getElementById('communityTotal').textContent=total;document.getElementById('communityScoredMatches').textContent=data.scoredMatches||0;
  const rb=data.slotShares?.rb?.[0],rw=data.slotShares?.rw?.[0];
  document.getElementById('communityRB').textContent=rb?displayName(rb.name):'—';document.getElementById('communityRBShare').textContent=rb?`${rb.percentage}% de los pronósticos`:'Esperando votos';
  document.getElementById('communityRW').textContent=rw?displayName(rw.name):'—';document.getElementById('communityRWShare').textContent=rw?`${rw.percentage}% de los pronósticos`:'Esperando votos';
  renderCommunityPitch(data.popularXI,total);
  document.getElementById('communityPolls').innerHTML=[['Portero','gk'],['Lateral izquierdo','lb'],['Central izquierdo','lcb'],['Central derecho','rcb'],['Lateral derecho','rb'],['Mediocentro izquierdo','dm1'],['Mediocentro derecho','dm2'],['Mediapunta','am'],['Banda izquierda','lw'],['Banda derecha','rw'],['Delantero centro','st']].map(([label,key])=>pollBlock(label,data.slotShares?.[key])).join('');
  const board=document.getElementById('communityLeaderboard');
  if(!(data.scoredMatches>0)||!data.leaderboard?.length){board.innerHTML='<div class="result-pending"><b>Ranking pendiente</b><span>Empezará a contar cuando publiquemos el primer once oficial.</span></div>';return}
  board.innerHTML=`<div class="leaderboard-head"><span>#</span><span>Usuario</span><span>Aciertos</span><span>Partidos</span><span>Plenos</span></div>${data.leaderboard.map((u,i)=>`<div class="leaderboard-row ${u.participantId===getParticipantId()?'me':''}"><b>${i+1}</b><span>${escapeHtml(u.alias)}${u.participantId===getParticipantId()?' <small>(tú)</small>':''}</span><strong>${u.hits}<small>/${u.possible}</small></strong><span>${u.scoredMatches}</span><span>${u.perfect}</span></div>`).join('')}`
}
async function loadCommunity(force=false){
  if(communityCache&&!force){renderCommunity(communityCache);return communityCache}
  if(!communityBackendAvailable()){renderCommunityUnavailable();return null}
  try{const response=await fetch(communityApiUrl({participantId:getParticipantId()}),{headers:{accept:'application/json'}});const data=await response.json();if(!response.ok)throw new Error(data.error||'Error');renderCommunity(data);document.dispatchEvent(new CustomEvent('rm-community-updated',{detail:data}));return data}
  catch{const total=document.getElementById('communityTotal');if(total)total.textContent='—';const polls=document.getElementById('communityPolls');if(polls)polls.innerHTML='<div class="result-pending"><b>No se pudo cargar la comunidad</b><span>Pulsa “Actualizar” para volver a intentarlo.</span></div>';return null}
}
document.addEventListener('rm-community-updated',event=>{if(event.detail){communityCache=event.detail;window.RMCommunityData=event.detail;if(document.getElementById('comunidad')?.classList.contains('active'))renderCommunity(event.detail)}});
window.RMCommunityApi=Object.freeze({url:communityApiUrl,available:communityBackendAvailable,participantId:getParticipantId,refresh:()=>loadCommunity(true)});

function ensureStyle(href,key){
  if(document.querySelector(`link[data-${key}]`))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.setAttribute(`data-${key}`,'1');document.head.appendChild(link);
}
function ensureScript(src,key){
  const existing=document.querySelector(`script[data-${key}]`);if(existing)return Promise.resolve(true);
  return new Promise(resolve=>{
    const script=document.createElement('script');script.async=false;script.src=src;script.setAttribute(`data-${key}`,'1');
    script.onload=()=>resolve(true);script.onerror=()=>{console.warn(`No se pudo cargar ${src}`);resolve(false)};document.body.appendChild(script);
  });
}
async function loadModule({css,cssKey,script,scriptKey}){if(css)ensureStyle(css,cssKey);if(script)return ensureScript(script,scriptKey);return true}
function idleTurn(timeout=900){return new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(()=>resolve(),{timeout});else setTimeout(resolve,90)})}
async function afterFirstPaint(){await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))}

const deferredModules=[
  {css:'mvp.css?v=1',cssKey:'mvp',script:'mvp.js?v=1',scriptKey:'mvp'},
  {script:'season-input.js?v=1',scriptKey:'season-input'},
  {script:'season-extension.js?v=1',scriptKey:'season-extension'},
  {css:'history.css?v=1',cssKey:'history',script:'history.js?v=2',scriptKey:'history'},
  {css:'analytics.css?v=1',cssKey:'analytics',script:'analytics.js?v=2',scriptKey:'analytics'},
  {css:'lineuplab.css?v=1',cssKey:'lineuplab',script:'lineuplab.js?v=1',scriptKey:'lineuplab'},
  {css:'decisionradar.css?v=1',cssKey:'decisionradar',script:'decisionradar.js?v=1',scriptKey:'decisionradar'},
  {css:'intelligence.css?v=1',cssKey:'intelligence',script:'intelligence.js?v=1',scriptKey:'intelligence'},
  {css:'hierarchy.css?v=1',cssKey:'hierarchy',script:'hierarchy.js?v=2',scriptKey:'hierarchy'}
];
async function loadDeferredModules(){
  for(const mod of deferredModules){await idleTurn();await loadModule(mod)}
  document.dispatchEvent(new CustomEvent('rm-modules-ready'));
}
async function loadCriticalModules(){
  await afterFirstPaint();
  await loadModule({script:'matchday.js?v=3',scriptKey:'matchday'});
  await loadModule({css:'playerhub.css?v=2',cssKey:'playerhub',script:'playerhub.js?v=2',scriptKey:'playerhub'});
  await loadModule({css:'player-experience.css?v=1',cssKey:'player-experience',script:'player-experience.js?v=1',scriptKey:'player-experience'});
  document.dispatchEvent(new CustomEvent('rm-critical-modules-ready'));
  loadDeferredModules();
}
loadCriticalModules();
