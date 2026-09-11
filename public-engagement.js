(()=>{
const SNAPSHOT_KEY='rm_public_visit_snapshot_v2';
let installed=false,pollData=window.RMMatchdayPollData||null,communityData=window.RMCommunityData||null,previousSnapshot=null;
try{previousSnapshot=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null')}catch{}

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function go(id){if(typeof showSection==='function')showSection(id)}
function display(name){try{return typeof displayName==='function'?displayName(name):name}catch{return name}}
function canonical(name){try{return window.RMSeasonData?.canonical?window.RMSeasonData.canonical(name):name}catch{return name}}
function participant(){try{return typeof getParticipantId==='function'?getParticipantId():''}catch{return ''}}
function season(){return window.RMSeasonData||null}
function playerList(){try{return typeof players!=='undefined'?players:[]}catch{return []}}
function ranking(){try{return typeof efficiencyRanking!=='undefined'?efficiencyRanking:[]}catch{return []}}
function currentMatch(){
  try{if(typeof predictionMatch!=='undefined')return predictionMatch}catch{}
  return {id:'rayo-2026-09-12',rival:'Rayo',kickoff:'2026-09-12T21:00:00+02:00',deadline:'2026-09-12T19:55:00+02:00'};
}
function canUseFunctions(){return typeof location!=='undefined'&&!location.hostname.endsWith('github.io')&&/^https?:$/.test(location.protocol)}
function powerRows(){
  if(Array.isArray(window.RMPowerMigration?.official)&&window.RMPowerMigration.official.length)return window.RMPowerMigration.official;
  return ranking().map(row=>{
    const ratedMinutes=row.ratedMinutes||row.minutes||0;
    const rating=Number.isFinite(row.rating)?row.rating:(ratedMinutes&&Number.isFinite(row.points)?row.points*90/ratedMinutes:null);
    const power=Number.isFinite(rating)?rating*(.75+.25*Math.min(row.minutes||0,450)/450):null;
    return {name:canonical(row.name),power,rating,minutes:row.minutes||0};
  }).filter(x=>Number.isFinite(x.power)).sort((a,b)=>b.power-a.power||b.rating-a.rating||b.minutes-a.minutes);
}
function playerMoment(){
  const data=season();if(!data)return null;
  return playerList().map(p=>{
    const recent=data.recentRating(p.name,3),delta=data.ratingDelta(p.name),metric=ranking().find(r=>canonical(r.name)===canonical(p.name));
    return recent&&recent.n>=2&&(metric?.minutes||0)>=90?{player:p,recent,delta,minutes:metric.minutes}:null;
  }).filter(Boolean).sort((a,b)=>b.recent.value-a.recent.value||b.minutes-a.minutes)[0]||null;
}
function currentAnalyzed(){
  const data=season(),match=currentMatch(),latest=data?.matches?.at?.(-1);if(!latest)return false;
  const a=String(latest.label||latest.id||'').toLowerCase(),b=String(match.rival||'').toLowerCase();return Boolean(b&&a.includes(b));
}
function countdown(target){
  const ms=target-Date.now();if(!Number.isFinite(ms)||ms<=0)return '';
  const total=Math.floor(ms/60000),days=Math.floor(total/1440),hours=Math.floor((total%1440)/60),mins=total%60;
  if(days>0)return `${days}d ${hours}h`;if(hours>0)return `${hours}h ${mins}m`;return `${Math.max(1,mins)} min`;
}
function stageInfo(){
  const match=currentMatch(),rival=match.rival||'próximo rival',deadline=Date.parse(match.deadline),kickoff=Date.parse(match.kickoff),now=Date.now();
  if(currentAnalyzed())return {eyebrow:'ÚLTIMA JORNADA',title:`${rival} ya está dentro del análisis`,copy:'Mira quién subió, quién bajó y cómo cambió la jerarquía.',action:'Ver evolución',section:'evolucion',tone:'post',count:''};
  if(Number.isFinite(deadline)&&now<deadline)return {eyebrow:'PREDICCIÓN ABIERTA',title:`¿Qué XI sacarías contra el ${rival}?`,copy:'Elige tus 11 titulares y compárate con la comunidad.',action:'Hacer mi XI',section:'prediccion',tone:'pre',count:`Cierra en ${countdown(deadline)}`};
  if(Number.isFinite(kickoff)&&now<kickoff)return {eyebrow:'EN BREVE',title:'Predicciones cerradas',copy:'Consulta el pulso de la comunidad antes del inicio.',action:'Ver previa',section:'partido',tone:'locked',count:`Empieza en ${countdown(kickoff)}`};
  if(Number.isFinite(kickoff)&&now<kickoff+3*60*60*1000)return {eyebrow:'PARTIDO',title:`Real Madrid–${rival}`,copy:'Vuelve después para ver cómo cambia todo el análisis.',action:'Centro del partido',section:'partido',tone:'live',count:'En juego'};
  return {eyebrow:'PRÓXIMA ACTUALIZACIÓN',title:`Esperando los datos del ${rival}`,copy:'En cuanto entren minutos y notas, toda la web se recalculará automáticamente.',action:'Ver temporada',section:'evolucion',tone:'post',count:'Datos pendientes'};
}
function stageHtml(){const s=stageInfo();return `<button class="pulse-card pulse-stage ${s.tone}" data-go="${s.section}"><span class="pulse-eyebrow">${s.eyebrow}</span>${s.count?`<span class="pulse-countdown">${esc(s.count)}</span>`:''}<b>${esc(s.title)}</b><small>${esc(s.copy)}</small><strong>${esc(s.action)} →</strong></button>`}
function momentHtml(){
  const m=playerMoment();if(!m)return `<div class="pulse-card"><span class="pulse-eyebrow">FORMA</span><b>Calculando jugador del momento…</b><small>Se mostrará cuando haya suficiente muestra.</small></div>`;
  const delta=m.delta?.delta,deltaText=Number.isFinite(delta)?`${delta>=0?'▲':'▼'} ${Math.abs(delta).toFixed(1)} en su última nota`:`${m.recent.n} partidos con nota`;
  return `<button class="pulse-card pulse-player" data-player="${esc(m.player.name)}"><span class="pulse-eyebrow">JUGADOR DEL MOMENTO</span><div class="pulse-player-score"><b>${esc(display(m.player.name))}</b><em>${m.recent.value.toFixed(2)}</em></div><small>Forma media en sus últimos ${m.recent.n} partidos · mínimo 90 minutos de muestra.</small><strong>${esc(deltaText)} →</strong></button>`;
}
function fallbackDuel(){return `<div class="pulse-card pulse-duel"><span class="pulse-eyebrow">DUELO RÁPIDO</span><b>¿Dumfries o Trent?</b><small>Uno de los debates abiertos para el próximo XI.</small><button class="pulse-mini-action" data-go="partido">Ver debates →</button></div>`}
function duelHtml(){
  const polls=pollData?.polls||[],available=polls.filter(p=>Array.isArray(p.options)&&p.options.length===2);if(!available.length)return fallbackDuel();
  const poll=[...available].sort((a,b)=>Math.abs((a.options[0]?.percentage||0)-(a.options[1]?.percentage||0))-Math.abs((b.options[0]?.percentage||0)-(b.options[1]?.percentage||0)))[0],closed=Boolean(pollData?.closed);
  return `<div class="pulse-card pulse-duel"><span class="pulse-eyebrow">DUELO RÁPIDO${closed?' · CERRADO':''}</span><b>${esc(poll.question)}</b><small>${poll.total||0} voto${poll.total===1?'':'s'}${closed?'':' · toca una opción'}</small><div class="pulse-votes">${poll.options.map(o=>`<button class="${poll.selected===o.label?'selected':''}" data-poll="${esc(poll.id)}" data-option="${esc(o.label)}" ${closed?'disabled':''}><span>${esc(o.label)}</span><strong>${o.percentage||0}%</strong></button>`).join('')}</div></div>`;
}
function debate(data){let best=null;for(const [slot,rows] of Object.entries(data?.slotShares||{})){if(!rows||rows.length<2)continue;const margin=Math.abs(rows[0].percentage-rows[1].percentage);if(!best||margin<best.margin)best={slot,margin,a:rows[0],b:rows[1]}}return best}
function unanimous(data){let best=null;for(const rows of Object.values(data?.slotShares||{})){if(rows?.[0]&&(!best||rows[0].percentage>best.percentage))best=rows[0]}return best}
function communityHtml(){
  if(!communityData)return `<button class="pulse-card pulse-community" data-go="comunidad"><span class="pulse-eyebrow">COMUNIDAD</span><b>Descubre qué XI está eligiendo la gente</b><small>Predicciones, porcentajes y debates por posición.</small><strong>Ver comunidad →</strong></button>`;
  const total=communityData.totalPredictions||0,d=debate(communityData),u=unanimous(communityData),line=d?`${display(d.a.name)} ${d.a.percentage}% · ${display(d.b.name)} ${d.b.percentage}%`:u?`${display(u.name)} lidera con ${u.percentage}%`:'Todavía no hay un debate destacado';
  return `<button class="pulse-card pulse-community" data-go="comunidad"><span class="pulse-eyebrow">TENDENCIA DE LA COMUNIDAD</span><div class="pulse-community-total"><b>${total}</b><span>pronóstico${total===1?'':'s'}</span></div><small>${esc(line)}</small><strong>Ver todos los porcentajes →</strong></button>`;
}
function currentSnapshot(){
  const data=season(),powers=powerRows(),rank=ranking(),moment=playerMoment();let total=0,fixed=null;
  if(communityData){total=communityData.totalPredictions||0;for(const rows of Object.values(communityData.slotShares||{}))for(const row of rows||[]){const pct=Number.isFinite(row.globalPercentage)?row.globalPercentage:row.percentage;if(!fixed||pct>fixed.pct)fixed={name:canonical(row.name),pct}}}
  return {at:Date.now(),matchCount:data?.matches?.length||0,latestLabel:data?.matches?.at?.(-1)?.label||null,powerLeader:powers[0]?.name||null,efficiencyLeader:canonical(rank[0]?.name||''),formLeader:moment?canonical(moment.player.name):null,top5:rank.slice(0,5).map(x=>canonical(x.name)),communityTotal:total,communityFixed:fixed?.name||null,communityFixedPct:fixed?.pct||0};
}
function changeItems(){
  const now=currentSnapshot(),prev=previousSnapshot,items=[];
  if(!prev){if(now.matchCount)items.push(`Ya hay ${now.matchCount} partidos dentro del análisis.`);if(now.powerLeader)items.push(`${display(now.powerLeader)} lidera el Power RM.`);if(now.formLeader)items.push(`${display(now.formLeader)} es el jugador con mejor forma reciente.`);return {items,first:true,now}}
  if(now.matchCount>prev.matchCount)items.push(`Nuevo partido analizado: ${now.latestLabel||'última jornada'}.`);
  if(now.powerLeader&&prev.powerLeader&&now.powerLeader!==prev.powerLeader)items.push(`Nuevo líder de Power: ${display(now.powerLeader)}.`);
  if(now.efficiencyLeader&&prev.efficiencyLeader&&now.efficiencyLeader!==prev.efficiencyLeader)items.push(`Nuevo líder de eficiencia: ${display(now.efficiencyLeader)}.`);
  if(now.formLeader&&prev.formLeader&&now.formLeader!==prev.formLeader)items.push(`${display(now.formLeader)} pasa a ser el jugador más en forma.`);
  const moved=now.top5.filter((name,i)=>prev.top5?.[i]&&prev.top5[i]!==name).length;if(moved)items.push(`${moved} cambio${moved===1?'':'s'} dentro del Top 5 de eficiencia.`);
  const voteDelta=(now.communityTotal||0)-(prev.communityTotal||0);if(voteDelta>0)items.push(`+${voteDelta} nuevo${voteDelta===1?'':'s'} pronóstico${voteDelta===1?'':'s'} en la comunidad.`);
  if(now.communityFixed&&prev.communityFixed&&now.communityFixed!==prev.communityFixed)items.push(`${display(now.communityFixed)} es ahora el jugador más fijo de la comunidad.`);
  if(!items.length)items.push('No hay cambios importantes en rankings o comunidad desde tu última visita.');
  return {items,first:false,now};
}
function changesHtml(){const c=changeItems();return `<div class="pulse-changes"><div><span>${c.first?'PRIMERA VISITA':'DESDE TU ÚLTIMA VISITA'}</span><b>${c.first?'Tu temporada empieza aquí':'Esto es lo que ha cambiado'}</b></div><div class="pulse-change-list">${c.items.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`}
function saveSnapshot(){try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(currentSnapshot()))}catch{}}
function bind(root){
  root.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-poll]'))return;go(el.dataset.go)}));
  root.querySelectorAll('[data-player]').forEach(el=>el.addEventListener('click',()=>{try{typeof openPlayerHub==='function'?openPlayerHub(el.dataset.player):go('plantilla')}catch{go('plantilla')}}));
  root.querySelectorAll('[data-poll]').forEach(btn=>btn.addEventListener('click',async e=>{e.stopPropagation();if(typeof voteQuickPoll!=='function'){go('partido');return}btn.disabled=true;try{await voteQuickPoll(btn.dataset.poll,btn.dataset.option);await fetchPolls(true);render()}finally{btn.disabled=false}}));
}
function render(){
  const home=document.getElementById('inicio'),intro=document.getElementById('publicIntro');if(!home||!intro)return;
  let pulse=document.getElementById('publicPulse');if(!pulse){pulse=document.createElement('section');pulse.id='publicPulse';pulse.className='public-pulse';intro.insertAdjacentElement('afterend',pulse)}
  pulse.innerHTML=`<div class="pulse-head"><div><span>EL PULSO DE LA TEMPORADA</span><h2>Lo importante, nada más entrar.</h2></div><button class="pulse-refresh" type="button">Actualizar</button></div><div class="pulse-grid">${stageHtml()}${momentHtml()}${duelHtml()}${communityHtml()}</div>${changesHtml()}`;
  pulse.querySelector('.pulse-refresh')?.addEventListener('click',()=>refresh(true));bind(pulse);
}
async function fetchPolls(force=false){if(!canUseFunctions())return null;if(pollData&&!force)return pollData;try{const r=await fetch(`/.netlify/functions/matchday?participantId=${encodeURIComponent(participant())}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error();pollData=await r.json();window.RMMatchdayPollData=pollData}catch{pollData=null}return pollData}
async function fetchCommunity(force=false){if(!canUseFunctions())return null;if(communityData&&!force)return communityData;try{const r=await fetch('/.netlify/functions/community-v2',{headers:{accept:'application/json'}});if(!r.ok)throw new Error();communityData=await r.json();window.RMCommunityData=communityData}catch{communityData=null}return communityData}
async function refresh(force=false){render();await Promise.all([fetchPolls(force),fetchCommunity(force)]);render()}
function install(){
  if(installed)return;if(!document.getElementById('publicIntro')||!season()||typeof showSection!=='function'){setTimeout(install,120);return}
  installed=true;document.body.classList.add('public-engagement-ready');if(previousSnapshot)document.body.classList.add('public-returning');render();refresh(false);
  document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-data-ready',render);
  document.addEventListener('rm-community-updated',e=>{communityData=e.detail||communityData;render()});document.addEventListener('rm-matchday-polls-updated',e=>{pollData=e.detail||pollData;render()});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveSnapshot()});window.addEventListener('pagehide',saveSnapshot);
  setInterval(()=>{if(document.getElementById('inicio')?.classList.contains('active'))render()},60000);
  window.RMPublicEngagement=Object.freeze({refresh:()=>refresh(true),snapshot:currentSnapshot,stage:stageInfo});
}
setTimeout(install,180);
})();