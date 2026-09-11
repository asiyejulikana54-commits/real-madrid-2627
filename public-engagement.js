(()=>{
const SNAPSHOT_KEY='rm_public_visit_snapshot_v1';
let previousSnapshot=null;
try{previousSnapshot=JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null')}catch{}
let pulseInstalled=false,pollData=null,communityData=null;

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function go(id){if(typeof showSection==='function')showSection(id)}
function display(name){try{return typeof displayName==='function'?displayName(name):name}catch{return name}}
function canonical(name){try{return window.RMSeasonData?.canonical?window.RMSeasonData.canonical(name):name}catch{return name}}
function participant(){try{return typeof getParticipantId==='function'?getParticipantId():''}catch{return ''}}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function playerList(){try{return typeof players!=='undefined'?players:[]}catch{return []}}
function ranking(){try{return typeof efficiencyRanking!=='undefined'?efficiencyRanking:[]}catch{return []}}
function season(){return window.RMSeasonData||null}

function powerRows(){
  if(window.RMPowerMigration?.official?.length)return window.RMPowerMigration.official;
  return ranking().map(row=>{
    const rating=Number.isFinite(row.rating)?row.rating:(row.minutes?row.points*90/(row.ratedMinutes||row.minutes):null);
    const power=Number.isFinite(rating)?rating*(.75+.25*Math.min(row.minutes||0,450)/450):null;
    return {name:canonical(row.name),displayName:row.name,power,rating,minutes:row.minutes||0};
  }).filter(x=>Number.isFinite(x.power)).sort((a,b)=>b.power-a.power);
}
function playerMoment(){
  const data=season();if(!data)return null;
  return playerList().map(p=>{
    const recent=data.recentRating(p.name,3),delta=data.ratingDelta(p.name);
    return recent&&recent.n>=2?{player:p,recent,delta}:null;
  }).filter(Boolean).sort((a,b)=>b.recent.value-a.recent.value||b.recent.n-a.recent.n)[0]||null;
}
function currentSnapshot(){
  const data=season(),powers=powerRows(),rank=ranking();
  return {
    at:Date.now(),matchCount:data?.matches?.length||0,latestMatch:data?.matches?.at?.(-1)?.id||null,
    latestLabel:data?.matches?.at?.(-1)?.label||null,powerLeader:powers[0]?.name||null,
    efficiencyLeader:canonical(rank[0]?.name||''),top5:rank.slice(0,5).map(x=>canonical(x.name))
  };
}
function changeItems(){
  const now=currentSnapshot(),prev=previousSnapshot,items=[];
  if(!prev){
    const power=powerRows()[0],moment=playerMoment();
    items.push(`Ya hay ${now.matchCount} partidos dentro del análisis.`);
    if(power)items.push(`${display(power.name)} lidera el Power RM.`);
    if(moment)items.push(`${display(moment.player.name)} es el jugador con mejor forma reciente.`);
    return {items,first:true,now};
  }
  if(now.matchCount>prev.matchCount)items.push(`Nuevo partido analizado: ${now.latestLabel||'última jornada'}.`);
  if(now.powerLeader&&prev.powerLeader&&now.powerLeader!==prev.powerLeader)items.push(`Nuevo líder de Power: ${display(now.powerLeader)}.`);
  if(now.efficiencyLeader&&prev.efficiencyLeader&&now.efficiencyLeader!==prev.efficiencyLeader)items.push(`Nuevo líder de eficiencia: ${display(now.efficiencyLeader)}.`);
  const moved=now.top5.filter((name,i)=>prev.top5?.[i]&&prev.top5[i]!==name).length;
  if(moved)items.push(`${moved} cambio${moved===1?'':'s'} dentro del Top 5 de eficiencia.`);
  if(!items.length)items.push('No hay cambios estructurales en los rankings desde tu última visita.');
  return {items,first:false,now};
}
function saveSnapshot(snapshot){
  try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(snapshot))}catch{}
}

function stageInfo(){
  const data=season(),latest=data?.matches?.at?.(-1)?.id||'';
  let deadline=Date.parse('2026-09-12T19:55:00+02:00'),kickoff=Date.parse('2026-09-12T21:00:00+02:00');
  try{if(typeof predictionMatch!=='undefined'){deadline=Date.parse(predictionMatch.deadline);kickoff=Date.parse(predictionMatch.kickoff)}}catch{}
  const now=Date.now();
  if(latest==='rayo')return {eyebrow:'ÚLTIMA JORNADA',title:'El Rayo ya está dentro del análisis',copy:'Mira qué jugadores subieron, quién cayó y cómo cambió la jerarquía.',action:'Ver evolución',section:'evolucion',tone:'post'};
  if(now<deadline)return {eyebrow:'AHORA',title:'La predicción del Rayo está abierta',copy:'Elige tus 11 titulares antes del cierre y compárate con la comunidad.',action:'Hacer mi XI',section:'prediccion',tone:'pre'};
  if(now<kickoff)return {eyebrow:'EN BREVE',title:'Predicciones cerradas',copy:'Ya no se puede cambiar el XI. Consulta el pulso de la comunidad antes del inicio.',action:'Ver previa',section:'partido',tone:'locked'};
  if(now<kickoff+3*60*60*1000)return {eyebrow:'PARTIDO',title:'Real Madrid–Rayo',copy:'La previa ya está cerrada. Después del partido incorporaremos minutos y notas.',action:'Centro del partido',section:'partido',tone:'live'};
  return {eyebrow:'PRÓXIMA ACTUALIZACIÓN',title:'Esperando los datos del Rayo',copy:'En cuanto entren minutos y notas, toda la web se recalculará automáticamente.',action:'Ver temporada',section:'evolucion',tone:'post'};
}
function stageHtml(){const s=stageInfo();return `<button class="pulse-card pulse-stage ${s.tone}" data-go="${s.section}"><span class="pulse-eyebrow">${s.eyebrow}</span><b>${esc(s.title)}</b><small>${esc(s.copy)}</small><strong>${esc(s.action)} →</strong></button>`}
function momentHtml(){
  const m=playerMoment();if(!m)return `<div class="pulse-card"><span class="pulse-eyebrow">FORMA</span><b>Calculando jugador del momento…</b></div>`;
  const delta=m.delta?.delta,deltaText=Number.isFinite(delta)?`${delta>=0?'▲':'▼'} ${Math.abs(delta).toFixed(1)} en su última nota`:`${m.recent.n} partidos con nota`;
  return `<button class="pulse-card pulse-player" data-player="${esc(m.player.name)}"><span class="pulse-eyebrow">JUGADOR DEL MOMENTO</span><div class="pulse-player-score"><b>${esc(display(m.player.name))}</b><em>${fmt(m.recent.value)}</em></div><small>Media de forma en sus últimos ${m.recent.n} partidos.</small><strong>${esc(deltaText)} →</strong></button>`;
}
function fallbackDuel(){return `<div class="pulse-card pulse-duel"><span class="pulse-eyebrow">DUELO RÁPIDO</span><b>¿Dumfries o Trent?</b><small>Uno de los debates del lateral derecho para el próximo XI.</small><button class="pulse-mini-action" data-go="partido">Votar en encuestas →</button></div>`}
function duelHtml(){
  const polls=pollData?.polls||[];
  const available=polls.filter(p=>Array.isArray(p.options)&&p.options.length>=2);
  if(!available.length)return fallbackDuel();
  const poll=[...available].sort((a,b)=>{
    const am=Math.abs((a.options[0]?.percentage||0)-(a.options[1]?.percentage||0));
    const bm=Math.abs((b.options[0]?.percentage||0)-(b.options[1]?.percentage||0));return am-bm;
  })[0];
  const opts=poll.options.slice(0,2);
  return `<div class="pulse-card pulse-duel"><span class="pulse-eyebrow">DUELO RÁPIDO</span><b>${esc(poll.question)}</b><small>${poll.total||0} voto${poll.total===1?'':'s'} · toca una opción</small><div class="pulse-votes">${opts.map(o=>`<button class="${poll.selected===o.label?'selected':''}" data-poll="${esc(poll.id)}" data-option="${esc(o.label)}"><span>${esc(o.label)}</span><strong>${o.percentage||0}%</strong></button>`).join('')}</div></div>`;
}
function debate(data){
  let best=null;for(const [slot,rows] of Object.entries(data?.slotShares||{})){
    if(!rows||rows.length<2)continue;const margin=Math.abs(rows[0].percentage-rows[1].percentage);
    if(!best||margin<best.margin)best={slot,margin,a:rows[0],b:rows[1]};
  }return best;
}
function unanimous(data){let best=null;for(const rows of Object.values(data?.slotShares||{})){if(rows?.[0]&&(!best||rows[0].percentage>best.percentage))best=rows[0]}return best}
function communityHtml(){
  if(!communityData)return `<button class="pulse-card pulse-community" data-go="comunidad"><span class="pulse-eyebrow">COMUNIDAD</span><b>Descubre qué XI está eligiendo la gente</b><small>Predicciones, porcentajes y debates por posición.</small><strong>Ver comunidad →</strong></button>`;
  const total=communityData.totalPredictions||0,d=debate(communityData),u=unanimous(communityData);
  const line=d?`${display(d.a.name)} ${d.a.percentage}% · ${display(d.b.name)} ${d.b.percentage}%`:u?`${display(u.name)} lidera con ${u.percentage}%`:'Todavía no hay un debate destacado';
  return `<button class="pulse-card pulse-community" data-go="comunidad"><span class="pulse-eyebrow">TENDENCIA DE LA COMUNIDAD</span><div class="pulse-community-total"><b>${total}</b><span>pronóstico${total===1?'':'s'}</span></div><small>${esc(line)}</small><strong>Ver todos los porcentajes →</strong></button>`;
}
function changesHtml(){
  const c=changeItems();
  return `<div class="pulse-changes"><div><span>${c.first?'PRIMERA VISITA':'DESDE TU ÚLTIMA VISITA'}</span><b>${c.first?'Tu temporada empieza aquí':'Esto es lo que ha cambiado'}</b></div><div class="pulse-change-list">${c.items.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`;
}
function bind(root){
  root.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-poll]'))return;go(el.dataset.go)}));
  root.querySelectorAll('[data-player]').forEach(el=>el.addEventListener('click',()=>{try{if(typeof openPlayerHub==='function')openPlayerHub(el.dataset.player);else go('plantilla')}catch{go('plantilla')}}));
  root.querySelectorAll('[data-poll]').forEach(btn=>btn.addEventListener('click',async e=>{
    e.stopPropagation();if(typeof voteQuickPoll!=='function'){go('partido');return}
    btn.disabled=true;
    try{await voteQuickPoll(btn.dataset.poll,btn.dataset.option);await fetchPolls(true)}finally{btn.disabled=false}
  }));
}
function render(){
  const home=document.getElementById('inicio'),intro=document.getElementById('publicIntro');if(!home||!intro)return;
  let pulse=document.getElementById('publicPulse');if(!pulse){pulse=document.createElement('section');pulse.id='publicPulse';pulse.className='public-pulse';intro.insertAdjacentElement('afterend',pulse)}
  pulse.innerHTML=`<div class="pulse-head"><div><span>EL PULSO DE LA TEMPORADA</span><h2>Lo importante, nada más entrar.</h2></div><button class="pulse-refresh" type="button">Actualizar</button></div><div class="pulse-grid">${stageHtml()}${momentHtml()}${duelHtml()}${communityHtml()}</div>${changesHtml()}`;
  pulse.querySelector('.pulse-refresh')?.addEventListener('click',()=>refresh(true));bind(pulse);
  const snapshot=changeItems().now;setTimeout(()=>saveSnapshot(snapshot),400);
}
async function fetchPolls(force=false){
  if(pollData&&!force){render();return pollData}
  try{const r=await fetch(`/.netlify/functions/matchday?participantId=${encodeURIComponent(participant())}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error();pollData=await r.json()}catch{pollData=null}
  render();return pollData;
}
async function fetchCommunity(force=false){
  if(communityData&&!force){render();return communityData}
  try{const r=await fetch('/.netlify/functions/community-v2',{headers:{accept:'application/json'}});if(!r.ok)throw new Error();communityData=await r.json()}catch{communityData=null}
  render();return communityData;
}
async function refresh(force=false){render();await Promise.all([fetchPolls(force),fetchCommunity(force)]);render()}
function install(){
  if(pulseInstalled)return;
  if(!document.getElementById('publicIntro')||!season()||typeof showSection!=='function'){setTimeout(install,120);return}
  pulseInstalled=true;document.body.classList.add('public-engagement-ready');refresh(false);
  document.addEventListener('rm-ranking-official-ready',()=>render());
  document.addEventListener('rm-season-data-ready',()=>render());
  setInterval(()=>{if(document.getElementById('inicio')?.classList.contains('active'))render()},60000);
}
setTimeout(install,180);
})();