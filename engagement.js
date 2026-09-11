(()=>{
const SNAPSHOT_KEY='rm_public_snapshot_v1';
const SLOT_LABELS={gk:'Portería',lb:'Lateral izquierdo',lcb:'Central',rcb:'Central',rb:'Lateral derecho',dm1:'Mediocentro',dm2:'Mediocentro',am:'Mediapunta',lw:'Banda izquierda',rw:'Banda derecha',st:'Delantero'};
let installed=false,communityData=window.RMCommunityData||null,pollData=window.RMMatchdayPollData||null;
let previousSnapshot=null;
try{previousSnapshot=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null')}catch{}

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function nameOf(v){try{return typeof displayName==='function'?displayName(v):v}catch{return v}}
function season(){return window.RMSeasonData||null}
function playerMetric(name){try{const p=players.find(x=>x.name===name);return p&&typeof metricFor==='function'?metricFor(p):null}catch{return null}}
function currentRatingFor(name){const m=playerMetric(name);if(!m)return null;try{return currentRating(m)}catch{return Number.isFinite(m.rating)?m.rating:(m.minutes?m.points*90/m.minutes:null)}}
function powerFor(name){const m=playerMetric(name),rating=currentRatingFor(name);if(!m||!Number.isFinite(rating))return null;return rating*(.75+.25*Math.min(m.minutes||0,450)/450)}
function powerRows(){
  try{return players.map(p=>({name:p.name,power:powerFor(p.name),rating:currentRatingFor(p.name),minutes:playerMetric(p.name)?.minutes||0})).filter(x=>Number.isFinite(x.power)).sort((a,b)=>b.power-a.power||b.rating-a.rating||b.minutes-a.minutes)}catch{return []}
}
function formRows(){
  const s=season();if(!s)return [];
  try{return players.map(p=>{const r=s.recentRating(p.name,3),m=playerMetric(p.name);return r&&r.n>=2&&(m?.minutes||0)>=90?{name:p.name,value:r.value,n:r.n,delta:s.ratingDelta(p.name)?.delta??null,minutes:m.minutes}:null}).filter(Boolean).sort((a,b)=>b.value-a.value||b.minutes-a.minutes)}catch{return []}
}
function phase(){
  const now=Date.now();let deadline=NaN,kickoff=NaN;
  try{deadline=Date.parse(predictionMatch.deadline);kickoff=Date.parse(predictionMatch.kickoff)}catch{}
  const s=season();const rayoAdded=Boolean(s?.matches?.some(m=>String(m.id||m.label).toLowerCase().includes('rayo')));
  let official=false;try{official=Array.isArray(officialXI)&&officialXI.length===11}catch{}
  if(rayoAdded)return 'post';
  if(Number.isFinite(deadline)&&now<deadline)return 'pre';
  if(Number.isFinite(kickoff)&&now<kickoff)return official?'official':'locked';
  if(official)return 'official';
  if(Number.isFinite(kickoff)&&now>=kickoff)return 'live';
  return 'pre';
}
function phaseContent(){
  const p=phase();
  if(p==='post')return {kicker:'DESPUÉS DEL PARTIDO',title:'Ya puedes ver qué cambió tras el Rayo',copy:'El nuevo partido entra automáticamente en forma, Power, jerarquías y comparaciones.',primary:'Ver evolución',primaryId:'evolucion',secondary:'Ver Power',secondaryId:'power'};
  if(p==='official')return {kicker:'XI OFICIAL',title:'Ya tenemos los once titulares',copy:'Compara tu predicción con el XI real y mira cuánto coincide la comunidad.',primary:'Ver partido',primaryId:'partido',secondary:'Ver comunidad',secondaryId:'comunidad'};
  if(p==='live')return {kicker:'PARTIDO EN JUEGO',title:'Real Madrid–Rayo ya está en marcha',copy:'Sigue el centro del partido y vuelve después para ver cómo cambia todo el análisis.',primary:'Abrir partido',primaryId:'partido',secondary:'Ver comunidad',secondaryId:'comunidad'};
  if(p==='locked')return {kicker:'PREDICCIÓN CERRADA',title:'La comunidad ya ha hablado',copy:'Elige tus debates, mira el XI más votado y espera al once oficial para comprobar los aciertos.',primary:'Ver comunidad',primaryId:'comunidad',secondary:'Centro del partido',secondaryId:'partido'};
  return {kicker:'PRÓXIMO PARTIDO · RAYO',title:'¿Qué XI sacarías mañana?',copy:'Haz tu pronóstico antes del cierre y compáralo con el de toda la comunidad.',primary:'Predecir el XI',primaryId:'prediccion',secondary:'Centro del partido',secondaryId:'partido'};
}
function ensureShell(){
  const home=document.getElementById('inicio'),intro=document.getElementById('publicIntro');if(!home||!intro)return null;
  let shell=document.getElementById('publicPulse');
  if(!shell){
    shell=document.createElement('section');shell.id='publicPulse';shell.className='public-pulse';
    shell.innerHTML='<div id="publicNow"></div><div class="public-pulse-grid"><div id="publicMoment"></div><div id="publicDuel"></div><div id="publicCommunityPulse"></div></div><div id="publicSince"></div>';
    intro.insertAdjacentElement('afterend',shell);
  }
  return shell;
}
function renderNow(){
  const box=document.getElementById('publicNow');if(!box)return;const c=phaseContent();
  box.innerHTML=`<div class="card public-now"><div><div class="public-pulse-kicker">${c.kicker}</div><h2>${c.title}</h2><p>${c.copy}</p></div><div class="public-now-actions"><button class="btn primary" data-go="${c.primaryId}">${c.primary}</button><button class="btn" data-go="${c.secondaryId}">${c.secondary}</button></div></div>`;
  box.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showSection(b.dataset.go));
}
function renderMoment(){
  const box=document.getElementById('publicMoment');if(!box)return;const top=formRows()[0];
  if(!top){box.innerHTML='<div class="card public-pulse-card"><span class="pulse-label">JUGADOR DEL MOMENTO</span><h3>Esperando más partidos</h3><p>La forma aparecerá cuando haya suficiente muestra.</p></div>';return}
  const pwr=powerFor(top.name),delta=top.delta;
  box.innerHTML=`<button class="card public-pulse-card pulse-click" id="momentPlayer"><span class="pulse-label">JUGADOR DEL MOMENTO</span><div class="pulse-player"><div class="pulse-avatar">${esc(nameOf(top.name)).slice(0,2).toUpperCase()}</div><div><h3>${esc(nameOf(top.name))}</h3><p>Forma reciente <b>${top.value.toFixed(2)}</b> · ${top.n} partidos</p></div></div><div class="pulse-stats"><span>Power <b>${Number.isFinite(pwr)?pwr.toFixed(2):'—'}</b></span><span>${delta===null?'Tendencia estable':delta>0?`▲ ${delta.toFixed(2)} último partido`:delta<0?`▼ ${Math.abs(delta).toFixed(2)} último partido`:'Sin cambio'}</span></div><small>Abre su ficha para ver la evolución completa ›</small></button>`;
  box.querySelector('#momentPlayer').onclick=()=>typeof openPlayerHub==='function'?openPlayerHub(top.name):showSection('plantilla');
}
function tightestPoll(data){
  const polls=data?.polls||[];if(!polls.length)return null;
  const withVotes=polls.filter(p=>p.options?.length>=2&&p.total>0);
  const pool=withVotes.length?withVotes:polls;
  return [...pool].sort((a,b)=>{const am=a.options?.length>=2?Math.abs(a.options[0].percentage-a.options[1].percentage):100;const bm=b.options?.length>=2?Math.abs(b.options[0].percentage-b.options[1].percentage):100;return am-bm})[0]||null;
}
function renderDuel(){
  const box=document.getElementById('publicDuel');if(!box)return;const poll=tightestPoll(pollData);
  if(!poll){box.innerHTML='<div class="card public-pulse-card"><span class="pulse-label">DUELO EXPRÉS</span><h3>¿Dumfries o Trent?</h3><p>Elige en una pulsación desde el Centro del partido.</p><button class="btn" onclick="showSection(\'partido\')">Ir a las encuestas</button></div>';return}
  const closed=Boolean(pollData?.closed);
  box.innerHTML=`<div class="card public-pulse-card public-duel-card"><span class="pulse-label">DUELO EXPRÉS${closed?' · CERRADO':''}</span><h3>${esc(poll.question)}</h3><p>${poll.total||0} voto${poll.total===1?'':'s'} · elige con una pulsación</p><div class="public-duel-options">${(poll.options||[]).map(opt=>`<button data-poll="${esc(poll.id)}" data-option="${esc(opt.label)}" class="${poll.selected===opt.label?'selected':''}" ${closed?'disabled':''}><span>${esc(opt.label)}</span><b>${opt.percentage}%</b><i style="width:${opt.percentage}%"></i>${poll.selected===opt.label?'<small>Tu voto</small>':''}</button>`).join('')}</div><button class="pulse-link" onclick="showSection('partido')">Ver todos los debates ›</button></div>`;
  box.querySelectorAll('[data-poll]').forEach(btn=>btn.onclick=()=>voteFromHome(btn.dataset.poll,btn.dataset.option));
}
async function voteFromHome(pollId,option){
  const box=document.getElementById('publicDuel');box?.classList.add('is-loading');
  try{
    const participant=typeof getParticipantId==='function'?getParticipantId():null;if(!participant)throw new Error('No se pudo identificar el dispositivo');
    let matchId=pollData?.matchId;try{matchId=matchId||predictionMatch.id}catch{}
    const response=await fetch('/.netlify/functions/matchday',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({matchId,participantId:participant,pollId,option})});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'No se pudo registrar el voto');
    if(typeof toast==='function')toast(result.updated?'Voto actualizado':'Voto registrado');
    await fetchPolls(true);if(typeof loadQuickPolls==='function')loadQuickPolls(true);
  }catch(error){if(typeof toast==='function')toast(error.message||'No se pudo registrar el voto')}
  finally{box?.classList.remove('is-loading')}
}
function communitySignals(data){
  if(!data)return {total:0,fixed:null,debate:null};
  const total=data.totalPredictions||0;let fixed=null,debate=null;const seen=new Map();
  for(const [slot,rows] of Object.entries(data.slotShares||{})){
    for(const row of rows||[]){const prev=seen.get(row.name);if(!prev||row.globalPercentage>prev.globalPercentage)seen.set(row.name,row)}
    if(rows?.length>=2){const margin=Math.abs(rows[0].percentage-rows[1].percentage);if(!debate||margin<debate.margin)debate={slot,margin,a:rows[0],b:rows[1]}}
  }
  for(const row of seen.values())if(!fixed||row.globalPercentage>fixed.globalPercentage)fixed=row;
  return {total,fixed,debate};
}
function renderCommunityPulse(){
  const box=document.getElementById('publicCommunityPulse');if(!box)return;const s=communitySignals(communityData);
  if(!communityData){box.innerHTML='<div class="card public-pulse-card"><span class="pulse-label">PULSO DE LA COMUNIDAD</span><h3>Cargando tendencias…</h3><p>Quién es fijo y dónde está el mayor debate.</p></div>';return}
  const debate=s.debate?`${SLOT_LABELS[s.debate.slot]||s.debate.slot}: ${nameOf(s.debate.a.name)} ${s.debate.a.percentage}% · ${nameOf(s.debate.b.name)} ${s.debate.b.percentage}%`:'Todavía no hay un duelo claro';
  box.innerHTML=`<button class="card public-pulse-card pulse-click" id="communityPulseBtn"><span class="pulse-label">PULSO DE LA COMUNIDAD</span><div class="community-pulse-total"><b>${s.total}</b><span>pronóstico${s.total===1?'':'s'}</span></div><div class="community-pulse-line"><small>Más fijo</small><strong>${s.fixed?`${esc(nameOf(s.fixed.name))} · ${s.fixed.globalPercentage}%`:'Esperando votos'}</strong></div><div class="community-pulse-line"><small>Mayor debate</small><strong>${esc(debate)}</strong></div><em>Ver el XI de la comunidad ›</em></button>`;
  box.querySelector('#communityPulseBtn').onclick=()=>showSection('comunidad');
}
function buildSnapshot(){
  const s=season(),power=powerRows(),form=formRows(),com=communitySignals(communityData);
  let ranking=[];try{ranking=efficiencyRanking.slice(0,5).map(x=>season()?.canonical?.(x.name)||x.name)}catch{}
  return {savedAt:Date.now(),matchCount:s?.matches?.length||0,lastMatch:s?.matches?.at(-1)?.label||null,ranking,powerTop:power[0]?.name||null,formTop:form[0]?.name||null,communityTotal:com.total||0,fixed:com.fixed?.name||null,fixedPct:com.fixed?.globalPercentage||0};
}
function diffSnapshot(prev,now){
  if(!prev)return [];
  const changes=[];
  if(now.matchCount>prev.matchCount)changes.push({icon:'＋',text:`Nuevo partido analizado: ${now.lastMatch||'último encuentro'}`});
  if(now.powerTop&&prev.powerTop&&now.powerTop!==prev.powerTop)changes.push({icon:'⚡',text:`Nuevo líder de Power: ${nameOf(now.powerTop)}`});
  if(now.formTop&&prev.formTop&&now.formTop!==prev.formTop)changes.push({icon:'↗',text:`${nameOf(now.formTop)} es ahora el jugador más en forma`});
  if(now.ranking?.length&&prev.ranking?.length){
    const moved=now.ranking.find((name,i)=>prev.ranking.indexOf(name)>i);
    if(moved){const pos=now.ranking.indexOf(moved)+1;changes.push({icon:'▲',text:`${nameOf(moved)} sube al #${pos} de eficiencia`})}
  }
  const newVotes=(now.communityTotal||0)-(prev.communityTotal||0);if(newVotes>0)changes.push({icon:'◉',text:`+${newVotes} nuevo${newVotes===1?'':'s'} pronóstico${newVotes===1?'':'s'} en la comunidad`});
  if(now.fixed&&prev.fixed&&now.fixed!==prev.fixed)changes.push({icon:'✓',text:`${nameOf(now.fixed)} pasa a ser el jugador más fijo de la comunidad`});
  else if(now.fixed&&prev.fixed===now.fixed&&Math.abs((now.fixedPct||0)-(prev.fixedPct||0))>=5)changes.push({icon:'%',text:`${nameOf(now.fixed)} está ahora en el ${now.fixedPct}% de los XI`});
  return changes.slice(0,3);
}
function timeAgo(ts){const diff=Date.now()-Number(ts||0);if(!ts||diff<0)return '';const min=Math.floor(diff/60000);if(min<60)return min<=1?'hace un momento':`hace ${min} min`;const h=Math.floor(min/60);if(h<24)return `hace ${h} h`;const d=Math.floor(h/24);return `hace ${d} día${d===1?'':'s'}`}
function renderSince(){
  const box=document.getElementById('publicSince');if(!box)return;const now=buildSnapshot(),changes=diffSnapshot(previousSnapshot,now);
  if(!previousSnapshot){box.innerHTML=`<div class="card public-since first"><div><span class="pulse-label">DESDE TU ÚLTIMA VISITA</span><h3>Esta es tu primera referencia</h3><p>Cuando vuelvas, aquí verás directamente qué jugadores subieron, qué cambió en Power y cómo se movió la comunidad.</p></div><span class="return-badge">Vuelve tras el Rayo</span></div>`;return}
  box.innerHTML=`<div class="card public-since"><div class="public-since-head"><div><span class="pulse-label">DESDE TU ÚLTIMA VISITA</span><h3>${changes.length?`${changes.length} cambio${changes.length===1?'':'s'} que merece${changes.length===1?'':'n'} la pena`:'Todo sigue estable'}</h3></div><small>${timeAgo(previousSnapshot.savedAt)}</small></div>${changes.length?`<div class="public-change-list">${changes.map(c=>`<div><b>${c.icon}</b><span>${esc(c.text)}</span></div>`).join('')}</div>`:'<p>No ha cambiado nada importante desde que estuviste aquí. Después del próximo partido este bloque se actualizará solo.</p>'}</div>`;
}
function saveSnapshot(){try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(buildSnapshot()))}catch{}}
async function fetchCommunity(force=false){
  if(communityData&&!force)return communityData;
  try{const r=await fetch('/.netlify/functions/community-v2',{headers:{accept:'application/json'}});const d=await r.json();if(!r.ok)throw new Error();communityData=d;window.RMCommunityData=d;renderCommunityPulse();renderSince();return d}catch{return null}
}
async function fetchPolls(force=false){
  if(pollData&&!force)return pollData;
  try{const pid=typeof getParticipantId==='function'?getParticipantId():'';const r=await fetch(`/.netlify/functions/matchday?participantId=${encodeURIComponent(pid)}`,{headers:{accept:'application/json'}});const d=await r.json();if(!r.ok)throw new Error();pollData=d;window.RMMatchdayPollData=d;renderDuel();return d}catch{return null}
}
function renderAll(){if(!ensureShell())return;renderNow();renderMoment();renderDuel();renderCommunityPulse();renderSince()}
function install(){
  if(installed)return;
  if(!document.getElementById('publicIntro')||typeof showSection!=='function'||!season()){setTimeout(install,120);return}
  installed=true;document.body.classList.add('engagement-ready');renderAll();
  fetchCommunity();fetchPolls();
  document.addEventListener('rm-community-updated',e=>{communityData=e.detail;renderCommunityPulse();renderSince()});
  document.addEventListener('rm-matchday-polls-updated',e=>{pollData=e.detail;renderDuel()});
  document.addEventListener('rm-ranking-official-ready',()=>{renderMoment();renderSince()});
  document.addEventListener('rm-season-data-ready',()=>{renderMoment();renderSince()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveSnapshot()});window.addEventListener('pagehide',saveSnapshot);
  setInterval(renderNow,30000);
}
setTimeout(install,180);
})();
