const communitySection=['comunidad','♟','Comunidad','La comunidad','XI más votado, porcentajes y ranking de aciertos.'];
const predictionIndex=sections.findIndex(s=>s[0]==='prediccion');
if(!sections.some(s=>s[0]==='comunidad'))sections.splice(predictionIndex,0,communitySection);
document.getElementById('navDesktop').innerHTML=navHtml(false);
document.getElementById('navMobile').innerHTML=navHtml(true);

const participantStorageKey='rm_community_participant_id';
function getParticipantId(){let id=localStorage.getItem(participantStorageKey);if(!id){id=(crypto.randomUUID?crypto.randomUUID():`rm_${Date.now()}_${Math.random().toString(36).slice(2)}`);localStorage.setItem(participantStorageKey,id)}return id}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}

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
  const btn=document.getElementById('savePredictionBtn');btn.disabled=true;btn.textContent='Publicando…';
  try{
    const response=await fetch('/.netlify/functions/community-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:getParticipantId(),alias,matchId:predictionMatch.id,xi})});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);
    toast(result.updated?'Predicción comunitaria actualizada':'Predicción publicada en la comunidad');communityCache=null;await loadCommunity(true);setTimeout(()=>showSection('comunidad'),350)
  }catch(error){toast(`Guardada en tu móvil · ${error.message||'sin conexión con la comunidad'}`)}
  finally{btn.textContent='Publicar predicción';btn.disabled=predictionIsClosed()}
};

document.getElementById('savePredictionBtn').textContent='Publicar predicción';
const resultBox=document.getElementById('predictionResult');if(resultBox)resultBox.innerHTML=resultBox.innerHTML.replace('Guardar predicción','Publicar predicción');

let communityCache=null;
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
  communityCache=data;const total=data.totalPredictions||0;
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
  if(communityCache&&!force){renderCommunity(communityCache);return}
  try{const response=await fetch('/.netlify/functions/community-v2',{headers:{accept:'application/json'}});const data=await response.json();if(!response.ok)throw new Error(data.error||'Error');renderCommunity(data)}
  catch{const total=document.getElementById('communityTotal');if(total)total.textContent='—';const polls=document.getElementById('communityPolls');if(polls)polls.innerHTML='<div class="result-pending"><b>No se pudo cargar la comunidad</b><span>Pulsa “Actualizar” para volver a intentarlo.</span></div>'}
}
loadCommunity();

if(!document.querySelector('script[data-matchday]')){
  const script=document.createElement('script');script.async=false;script.src='matchday.js?v=1';script.dataset.matchday='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-playerhub]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='playerhub.css?v=1';link.dataset.playerhub='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-playerhub]')){
  const script=document.createElement('script');script.async=false;script.src='playerhub.js?v=1';script.dataset.playerhub='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-mvp]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='mvp.css?v=1';link.dataset.mvp='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-mvp]')){
  const script=document.createElement('script');script.async=false;script.src='mvp.js?v=1';script.dataset.mvp='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-history]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='history.css?v=1';link.dataset.history='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-history]')){
  const script=document.createElement('script');script.async=false;script.src='history.js?v=1';script.dataset.history='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-analytics]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='analytics.css?v=1';link.dataset.analytics='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-analytics]')){
  const script=document.createElement('script');script.async=false;script.src='analytics.js?v=1';script.dataset.analytics='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-lineuplab]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='lineuplab.css?v=1';link.dataset.lineuplab='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-lineuplab]')){
  const script=document.createElement('script');script.async=false;script.src='lineuplab.js?v=1';script.dataset.lineuplab='1';document.body.appendChild(script);
}
if(!document.querySelector('link[data-decisionradar]')){
  const link=document.createElement('link');link.rel='stylesheet';link.href='decisionradar.css?v=1';link.dataset.decisionradar='1';document.head.appendChild(link);
}
if(!document.querySelector('script[data-decisionradar]')){
  const script=document.createElement('script');script.async=false;script.src='decisionradar.js?v=1';script.dataset.decisionradar='1';document.body.appendChild(script);
}
