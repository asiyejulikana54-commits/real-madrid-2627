(()=>{
const css=document.createElement('link');css.rel='stylesheet';css.href='matchday.css?v=3';css.dataset.matchdayCss='3';document.head.appendChild(css);
const matchSection=['partido','⚽','Partido','Centro del partido','Previa, XI oficial, aciertos, dudas clave y análisis de la jornada.'];
if(!sections.some(s=>s[0]==='partido'))sections.splice(1,0,matchSection);
document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);

const PHASE_SEEN_KEY='rm_matchday_seen_phase_v1';
const KEY_DEBATES=Object.freeze([
  {id:'rb',label:'Lateral derecho',slots:['rb'],options:['Dumfries','Trent Alexander-Arnold']},
  {id:'lb',label:'Lateral izquierdo',slots:['lb'],options:['Cucurella','Álvaro Carreras']},
  {id:'cb',label:'Pareja de centrales',slots:['lcb','rcb'],options:['Rüdiger','Huijsen','Konaté']},
  {id:'rw',label:'Banda derecha',slots:['rw'],options:['Diomande','Brahim Díaz','Arda Güler']},
  {id:'rest',label:'Gestión de descanso',slots:[],options:['Valverde','Bellingham']}
]);
let pollCache=window.RMMatchdayPollData||null,communityData=window.RMCommunityData||null,clockTimer=null,installed=false,phaseNoticeText='';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function display(name){return safe(()=>displayName(name),name)||name}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function match(){return safe(()=>predictionMatch,null)||{id:'proximo-partido',rival:'Próximo rival',kickoff:null,deadline:null}}
function official(){return safe(()=>Array.isArray(officialXI)?officialXI:null,null)}
function ourXi(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>rayoXI,{})||{}}
function savedPrediction(){return safe(()=>getSavedPrediction(),null)}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function backendAvailable(){return /^https?:$/.test(location.protocol)&&!location.hostname.endsWith('github.io')}
function normalized(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function analyzedMatch(){
  const rival=normalized(match().rival),rows=window.RMSeasonData?.matches||[];
  return [...rows].reverse().find(m=>normalized(m.label||m.id).includes(rival)||rival.includes(normalized(m.label||m.id)))||null;
}
function scoreNames(names){const xi=official();if(!xi)return null;const real=new Set(xi.map(canonical));return names.filter(Boolean).map(canonical).filter(n=>real.has(n)).length}
function diffNames(names){
  const xi=official();if(!xi)return null;const predicted=new Set(names.filter(Boolean).map(canonical)),real=new Set(xi.map(canonical));
  const misses=names.filter(n=>n&&!real.has(canonical(n))),surprises=xi.filter(n=>!predicted.has(canonical(n)));return {misses,surprises};
}
function formatKickoff(){
  const raw=Date.parse(match().kickoff);if(!Number.isFinite(raw))return 'Horario pendiente';
  return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(raw)).replace(',',' ·').toUpperCase();
}
function countdown(target){
  const ms=target-Date.now();if(!Number.isFinite(ms)||ms<=0)return '00:00';const total=Math.floor(ms/60000),d=Math.floor(total/1440),h=Math.floor((total%1440)/60),m=total%60;return `${d?`${d}d `:''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function phase(){
  const m=match(),now=Date.now(),deadline=Date.parse(m.deadline),kickoff=Date.parse(m.kickoff),hasOfficial=Boolean(official()),done=Boolean(analyzedMatch());
  if(done)return {id:'analysis',index:4,label:'Analizado',eyebrow:'POSTPARTIDO',title:'La jornada ya forma parte del análisis',copy:'Notas, forma, Power y jerarquías ya pueden reflejar este partido.',action:'Ver evolución',section:'evolucion',clock:'Datos incorporados'};
  if(Number.isFinite(kickoff)&&now>=kickoff+3*60*60*1000)return {id:'waiting',index:3,label:'Datos pendientes',eyebrow:'POSTPARTIDO',title:'Esperando los datos finales',copy:'Cuando entren minutos y valoraciones, la web recalculará automáticamente toda la temporada.',action:'Ver temporada',section:'evolucion',clock:'Análisis pendiente'};
  if(Number.isFinite(kickoff)&&now>=kickoff)return {id:'live',index:3,label:'Partido',eyebrow:'EN JUEGO',title:`Real Madrid–${m.rival}`,copy:hasOfficial?'El XI oficial ya está publicado. Tus aciertos quedan fijados.':'Partido iniciado. El análisis llegará con los datos finales.',action:'Ver mi predicción',section:'prediccion',clock:'EN JUEGO'};
  if(hasOfficial)return {id:'official',index:2,label:'XI oficial',eyebrow:'XI OFICIAL',title:'Ya conocemos los once titulares',copy:'Compara el once real con nuestra idea, tus dudas y tu predicción.',action:'Ver mis aciertos',section:'prediccion',clock:Number.isFinite(kickoff)?`Empieza en ${countdown(kickoff)}`:'XI publicado'};
  if(Number.isFinite(deadline)&&now>=deadline)return {id:'closed',index:1,label:'Predicción cerrada',eyebrow:'PREDICCIONES CERRADAS',title:'Ahora toca esperar el XI oficial',copy:'Tu pronóstico ya no se puede modificar. En cuanto publiquemos el once, calcularemos los aciertos.',action:backendAvailable()?'Ver comunidad':'Revisar mi predicción',section:backendAvailable()?'comunidad':'prediccion',clock:Number.isFinite(kickoff)?`Empieza en ${countdown(kickoff)}`:'Cerrado'};
  return {id:'pre',index:0,label:'Previa abierta',eyebrow:'PREVIA',title:`Prepara tu XI contra el ${m.rival}`,copy:'Haz tu predicción, compárala con nuestra idea y sigue las dudas clave antes del cierre.',action:savedPrediction()?'Revisar mi XI':'Hacer mi predicción',section:'prediccion',clock:Number.isFinite(deadline)?`Cierra en ${countdown(deadline)}`:'Predicción abierta'};
}
function noticeFor(p){
  if(p.id==='closed')return 'Las predicciones ya están cerradas.';
  if(p.id==='official')return 'Ya está publicado el XI oficial: puedes comprobar tus aciertos y resolver las dudas de la previa.';
  if(p.id==='live')return 'El partido ya ha comenzado.';
  if(p.id==='waiting')return 'El partido terminó y estamos esperando los datos finales.';
  if(p.id==='analysis')return 'El análisis de este partido ya está incorporado a la temporada.';
  return 'La previa ya está abierta.';
}
function capturePhaseNotice(){
  const current=phase();let prior=null;try{prior=JSON.parse(localStorage.getItem(PHASE_SEEN_KEY)||'null')}catch{}
  if(prior&&prior.id!==current.id&&current.index>=Number(prior.index||0))phaseNoticeText=noticeFor(current);else phaseNoticeText='';
  try{localStorage.setItem(PHASE_SEEN_KEY,JSON.stringify({id:current.id,index:current.index,at:Date.now()}))}catch{}
}
function phaseNotice(){return phaseNoticeText?`<div class="md-phase-notice"><span>NUEVO DESDE TU ÚLTIMA VISITA</span><b>${esc(phaseNoticeText)}</b></div>`:''}
function stageSteps(current){
  const steps=[['Previa','pre'],['Cierre','closed'],['XI oficial','official'],['Partido','live'],['Análisis','analysis']];
  return `<div class="md-steps">${steps.map(([label,id],i)=>`<div class="md-step ${i<current.index?'done':i===current.index?'current':''}"><i>${i<current.index?'✓':i+1}</i><span>${label}</span></div>`).join('')}</div>`;
}
function ensureSection(){
  if(document.getElementById('partido'))return;
  const pred=document.getElementById('prediccion');if(!pred)return;
  pred.insertAdjacentHTML('beforebegin',`<section class="section" id="partido"><div id="matchdayDynamic"></div></section>`);
}
function lineupChips(names,kind=''){return names.length?`<div class="md-lineup-chips ${kind}">${names.map(n=>`<span>${esc(display(n))}</span>`).join('')}</div>`:'<div class="md-empty">Todavía no disponible.</div>'}
function userCard(){
  const data=savedPrediction(),xi=values(data?.xi),score=scoreNames(xi);
  if(!data)return `<article class="card md-xi-card empty"><span class="md-label">TU PREDICCIÓN</span><h3>Aún no has guardado tu XI</h3><p>Elige tus once antes del cierre para poder comparar después tus aciertos.</p><button class="btn primary" data-md-go="prediccion">Hacer mi predicción</button></article>`;
  return `<article class="card md-xi-card"><div class="md-card-head"><span class="md-label">TU PREDICCIÓN</span><b>${score===null?'Guardada':`${score}/11`}</b></div><h3>${esc(data.name||'Mi XI')}</h3>${lineupChips(xi,score!==null?'scored':'')}<button class="btn" data-md-go="prediccion">${score===null?'Revisar XI':'Ver resultado'}</button></article>`;
}
function ourCard(){
  const names=values(ourXi()),score=scoreNames(names);
  return `<article class="card md-xi-card"><div class="md-card-head"><span class="md-label">NUESTRA IDEA</span><b>${score===null?'11 jugadores':`${score}/11`}</b></div><h3>XI que estamos valorando</h3>${lineupChips(names)}<button class="btn" data-md-current-idea="1">Abrir en Constructor</button></article>`;
}
function officialCard(){
  const xi=official();if(!xi)return `<article class="card md-xi-card waiting"><span class="md-label">XI OFICIAL</span><h3>Pendiente de publicación</h3><p>No mostraremos nombres aquí hasta tener el once confirmado.</p><div class="md-official-wait"><i></i><span>Esperando confirmación</span></div></article>`;
  return `<article class="card md-xi-card official"><div class="md-card-head"><span class="md-label">XI OFICIAL</span><b>CONFIRMADO</b></div><h3>Los once titulares</h3>${lineupChips(xi,'official')}<small>La puntuación de las predicciones se calcula por titular acertado, sin exigir posición exacta.</small></article>`;
}
function selectedFrom(names,options){const set=new Set(names.map(canonical));return options.filter(n=>set.has(canonical(n)))}
function communityLeader(debate){
  if(!communityData||!debate.slots.length)return null;let best=null;
  for(const slot of debate.slots){for(const row of communityData.slotShares?.[slot]||[]){if(!debate.options.some(n=>canonical(n)===canonical(row.name)))continue;const pct=Number.isFinite(row.globalPercentage)?row.globalPercentage:row.percentage;if(!best||pct>best.pct)best={name:row.name,pct}}}
  return best;
}
function debateCard(debate){
  const ours=selectedFrom(values(ourXi()),debate.options),user=selectedFrom(values(savedPrediction()?.xi),debate.options),real=official()?selectedFrom(official(),debate.options):[],leader=communityLeader(debate),resolved=Boolean(official());
  const oursText=ours.length?ours.map(display).join(' · '):'Ninguno';
  const userText=user.length?user.map(display).join(' · '):'Sin XI guardado';
  let officialText='Pendiente del XI oficial';
  if(resolved){if(debate.id==='rest'){const absent=debate.options.filter(n=>!real.some(x=>canonical(x)===canonical(n)));officialText=absent.length===0?'Juegan ambos':absent.length===1?`Descansa ${display(absent[0])}`:`No salen ${absent.map(display).join(' / ')}`}else officialText=real.length?`Titular${real.length>1?'es':''}: ${real.map(display).join(' · ')}`:'Ninguna opción fue titular'}
  return `<article class="md-debate-card ${resolved?'resolved':''}"><div class="md-debate-head"><span>${esc(debate.label)}</span><b>${resolved?'RESUELTO':'ABIERTO'}</b></div><h3>${debate.options.map(display).join(' / ')}</h3><div class="md-debate-lines"><div><small>Nuestra idea</small><strong>${esc(oursText)}</strong></div><div><small>Tu XI</small><strong>${esc(userText)}</strong></div>${leader?`<div><small>Comunidad</small><strong>${esc(display(leader.name))} · ${leader.pct}%</strong></div>`:''}<div class="${resolved?'official':''}"><small>XI oficial</small><strong>${esc(officialText)}</strong></div></div></article>`;
}
function keyDebates(){
  return `<section class="card md-debates"><div class="section-head" style="margin-top:0"><div><span class="md-label">DUDAS CLAVE</span><h2>Los debates que pueden cambiar el once</h2><p>Antes del partido mostramos nuestras elecciones y las tuyas; al salir el XI oficial quedan resueltas automáticamente.</p></div></div><div class="md-debate-grid">${KEY_DEBATES.map(debateCard).join('')}</div></section>`;
}
function diffBlock(label,names){
  const d=diffNames(names);if(!d)return '';
  return `<div class="md-diff"><div class="md-diff-head"><span>${label}</span><b>${scoreNames(names)}/11 aciertos</b></div><div><small>No salieron titulares</small>${d.misses.length?lineupChips(d.misses,'bad'):'<strong class="md-perfect">✓ Once perfecto</strong>'}</div><div><small>Entraron en el XI oficial</small>${d.surprises.length?lineupChips(d.surprises,'good'):'<span class="md-muted">Sin diferencias</span>'}</div></div>`;
}
function differences(){
  if(!official())return '';
  const user=values(savedPrediction()?.xi),ours=values(ourXi());
  return `<section class="card md-comparison"><div class="section-head" style="margin-top:0"><div><span class="md-label">COMPARACIÓN CON EL XI REAL</span><h2>¿Dónde acertamos y dónde cambió el once?</h2></div></div><div class="md-diff-grid">${user.length===11?diffBlock('Tu predicción',user):'<div class="md-diff empty"><b>Tu predicción</b><span>No había un XI completo guardado.</span></div>'}${diffBlock('Nuestra idea',ours)}</div></section>`;
}
function matchRows(){
  const data=window.RMSeasonData,m=analyzedMatch();if(!data||!m)return [];
  return (safe(()=>players,[])||[]).map(p=>{
    const rows=safe(()=>data.ratingSeries(p.name),[])||[],row=rows.find(x=>x.match?.id===m.id);if(!row)return null;
    const delta=safe(()=>data.ratingDelta(p.name),null);return {name:p.name,value:row.entry.value,delta:delta?.currentMatch?.id===m.id?delta.delta:null};
  }).filter(Boolean).sort((a,b)=>b.value-a.value);
}
function postAnalysis(){
  const m=analyzedMatch();if(!m)return '';
  const rows=matchRows(),top=rows.slice(0,3),withDelta=rows.filter(x=>Number.isFinite(x.delta)),riser=[...withDelta].sort((a,b)=>b.delta-a.delta)[0],faller=[...withDelta].sort((a,b)=>a.delta-b.delta)[0];
  return `<section class="card md-post"><div class="section-head" style="margin-top:0"><div><span class="md-label">ANÁLISIS INCORPORADO</span><h2>Lo que deja el ${esc(m.label)}</h2><p>Resumen generado únicamente con las valoraciones oficiales que ya forman parte de la temporada.</p></div><button class="btn" data-md-go="evolucion">Ver evolución completa</button></div><div class="md-post-grid"><div class="md-top-three"><span>MEJORES NOTAS</span>${top.length?top.map((x,i)=>`<button data-md-player="${esc(x.name)}"><i>#${i+1}</i><b>${esc(display(x.name))}</b><strong>${x.value.toFixed(2)}</strong></button>`).join(''):'<p class="md-muted">Sin notas disponibles.</p>'}</div><div class="md-movement"><span>MOVIMIENTOS</span>${riser?`<button data-md-player="${esc(riser.name)}"><i>▲</i><div><small>Mayor subida</small><b>${esc(display(riser.name))}</b></div><strong>${riser.delta>=0?'+':''}${riser.delta.toFixed(2)}</strong></button>`:'<div class="md-muted">Sin comparación previa suficiente.</div>'}${faller&&faller.delta<0?`<button data-md-player="${esc(faller.name)}"><i>▼</i><div><small>Mayor bajada</small><b>${esc(display(faller.name))}</b></div><strong>${faller.delta.toFixed(2)}</strong></button>`:''}</div></div></section>`;
}
function communitySummary(){
  if(!backendAvailable()&&!communityData)return `<section class="card md-community md-community-local"><div><span class="md-label">COMUNIDAD EN VIVO</span><h2>La capa comunitaria está en espera</h2><p>En esta versión de GitHub Pages no hacemos llamadas al backend de Netlify. Predicción local, XI oficial, dudas y análisis siguen funcionando con normalidad.</p></div><button class="btn" data-md-go="prediccion">Ver mi predicción</button></section>`;
  const data=communityData,total=data?.totalPredictions||0;let fixed=null,debate=null;
  for(const [slot,rows] of Object.entries(data?.slotShares||{})){
    if(rows?.[0]&&(!fixed||rows[0].percentage>fixed.percentage))fixed={...rows[0],slot};
    if(rows?.length>=2){const margin=Math.abs(rows[0].percentage-rows[1].percentage);if(!debate||margin<debate.margin)debate={margin,slot,a:rows[0],b:rows[1]}}
  }
  const popular=Object.values(data?.popularXI||{}).map(x=>x?.name).filter(Boolean),communityScore=scoreNames(popular);
  return `<section class="card md-community"><div class="section-head" style="margin-top:0"><div><span class="md-label">COMUNIDAD</span><h2>El pulso antes y después del partido</h2></div><button class="btn" data-md-go="comunidad">Ver comunidad</button></div><div class="md-community-kpis"><div><span>Pronósticos</span><b>${total||'—'}</b><small>${total?'registrados':'sin datos cargados'}</small></div><div><span>Jugador más fijo</span><b>${fixed?esc(display(fixed.name)):'—'}</b><small>${fixed?`${fixed.percentage}%`:'pendiente'}</small></div><div><span>Debate más cerrado</span><b>${debate?`${esc(display(debate.a.name))} / ${esc(display(debate.b.name))}`:'—'}</b><small>${debate?`${debate.a.percentage}% · ${debate.b.percentage}%`:'pendiente'}</small></div><div><span>XI comunidad</span><b>${communityScore===null?(popular.length===11?'11 listos':'—'):`${communityScore}/11`}</b><small>${communityScore===null?'antes del oficial':'aciertos'}</small></div></div></section>`;
}
function pollCard(poll,closed){return `<div class="quick-poll"><h3>${esc(poll.question)}</h3><p>${poll.total||0} voto${poll.total===1?'':'s'}${closed?' · cerrada':''}</p><div class="poll-options">${(poll.options||[]).map(opt=>`<button class="poll-vote ${poll.selected===opt.label?'selected':''}" ${closed?'disabled':''} data-poll="${esc(poll.id)}" data-option="${esc(opt.label)}"><span>${esc(opt.label)}</span><span class="pct">${opt.percentage||0}%</span><span class="barline"><i style="width:${opt.percentage||0}%"></i></span></button>`).join('')}</div></div>`}
function pollsHtml(){
  if(!backendAvailable()&&!pollCache)return `<div class="md-polls-offline"><b>Encuestas comunitarias no cargadas en esta versión</b><span>No hacemos peticiones fallidas al backend desde GitHub Pages.</span></div>`;
  if(!pollCache)return '<div class="card muted">Las encuestas se cargarán al abrir Partido.</div>';
  return (pollCache.polls||[]).map(p=>pollCard(p,pollCache.closed)).join('')||'<div class="card muted">Todavía no hay encuestas.</div>';
}
function hero(p){
  const m=match(),titleRival=String(m.rival||'Próximo rival').toUpperCase(),secondary=backendAvailable()?['comunidad','Comunidad']:['power','Ver Power RM'];
  return `<div class="section-head md-section-head"><div><h2>Centro del partido</h2><p>La pantalla cambia automáticamente a medida que avanza la jornada.</p></div><span class="pill ${p.id==='pre'?'open':p.id==='closed'?'closed':''}" id="matchdayState">${esc(p.label)}</span></div>${phaseNotice()}${stageSteps(p)}<div class="matchday-hero"><div class="matchday-scoreboard"><div class="eyebrow">${esc(p.eyebrow)}</div><h2>REAL MADRID <span>vs</span> ${esc(titleRival)}</h2><div class="matchday-meta"><span class="pill">${esc(formatKickoff())}</span><span class="pill">${esc(m.comp||'LaLiga')}</span></div><h3 class="md-stage-title">${esc(p.title)}</h3><p class="md-stage-copy">${esc(p.copy)}</p><div class="matchday-actions"><button class="btn primary" data-md-go="${esc(p.section)}">${esc(p.action)}</button><button class="btn" data-md-go="${secondary[0]}">${secondary[1]}</button></div></div><div class="card countdown-card"><div class="eyebrow">ESTADO DE LA JORNADA</div><div class="clock" id="matchdayClock">${esc(p.clock)}</div><b>${esc(p.label)}</b><small>${official()?'XI oficial disponible':savedPrediction()?'Tu predicción está guardada':'Sin predicción guardada todavía'}</small></div></div>`;
}
function render(){
  ensureSection();const root=document.getElementById('matchdayDynamic');if(!root)return;const p=phase();
  root.innerHTML=`${hero(p)}<div class="md-xi-grid">${userCard()}${ourCard()}${officialCard()}</div>${keyDebates()}${differences()}${postAnalysis()}${communitySummary()}<div class="section-head md-poll-head"><div><h2>Encuestas rápidas</h2><p>Un voto por dispositivo. Puedes cambiarlo hasta el cierre.</p></div>${backendAvailable()?'<button class="btn" id="mdPollRefresh">Actualizar</button>':''}</div><div class="quick-polls" id="quickPolls">${pollsHtml()}</div>`;
  root.querySelectorAll('[data-md-go]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>showSection(btn.dataset.mdGo))));
  root.querySelector('[data-md-current-idea]')?.addEventListener('click',()=>{safe(()=>showSection('once'));setTimeout(()=>{safe(()=>setXI(ourXi()));const n=document.getElementById('lineupName');if(n)n.value=`${match().rival} · nuestra idea actual`},0)});
  root.querySelectorAll('[data-md-player]').forEach(btn=>btn.addEventListener('click',()=>{safe(()=>showSection('plantilla'));setTimeout(()=>safe(()=>openPlayerHub(btn.dataset.mdPlayer)),80)}));
  root.querySelectorAll('[data-poll]').forEach(btn=>btn.addEventListener('click',()=>voteQuickPoll(btn.dataset.poll,btn.dataset.option)));
  document.getElementById('mdPollRefresh')?.addEventListener('click',()=>loadQuickPolls(true));
}
async function loadCommunityIfNeeded(force=false){
  if(window.RMCommunityData&&!force){communityData=window.RMCommunityData;render();return}
  if(!backendAvailable()||typeof loadCommunity!=='function')return;
  try{await loadCommunity(force);communityData=window.RMCommunityData||communityData;render()}catch{}
}
window.loadQuickPolls=async function(force=false){
  if(pollCache&&!force){render();return pollCache}if(!backendAvailable())return null;
  try{const id=safe(()=>getParticipantId(),'');const r=await fetch(`/.netlify/functions/matchday?participantId=${encodeURIComponent(id)}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`Error ${r.status}`);pollCache=await r.json();window.RMMatchdayPollData=pollCache;document.dispatchEvent(new CustomEvent('rm-matchday-polls-updated',{detail:pollCache}));render();return pollCache}catch(e){safe(()=>toast('No se pudieron cargar las encuestas'));return null}
};
window.voteQuickPoll=async function(pollId,option){
  if(!backendAvailable()){safe(()=>toast('Las votaciones requieren conexión con la versión comunitaria'));return}
  try{const r=await fetch('/.netlify/functions/matchday',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({matchId:match().id,participantId:safe(()=>getParticipantId(),''),pollId,option})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Error ${r.status}`);safe(()=>toast(data.updated?'Voto actualizado':'Voto registrado'));pollCache=null;await loadQuickPolls(true)}catch(e){safe(()=>toast(e.message||'No se pudo registrar el voto'))}
};
function startClock(){if(clockTimer)return;clockTimer=setInterval(()=>{if(document.getElementById('partido')?.classList.contains('active'))render()},30000)}
function sectionOpened(){capturePhaseNotice();loadQuickPolls(false);loadCommunityIfNeeded(false);render()}
function install(){
  if(installed)return;ensureSection();if(!document.getElementById('partido')){setTimeout(install,100);return}installed=true;render();startClock();
  const base=showSection;showSection=function(id){base(id);if(id==='partido')setTimeout(sectionOpened,0)};
  document.addEventListener('rm-community-updated',e=>{communityData=e.detail||window.RMCommunityData||communityData;if(document.getElementById('partido')?.classList.contains('active'))render()});
  document.addEventListener('rm-matchday-polls-updated',e=>{pollCache=e.detail||pollCache;if(document.getElementById('partido')?.classList.contains('active'))render()});
  document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-ranking-official-ready',render);
  if(document.getElementById('partido')?.classList.contains('active'))sectionOpened();
  window.RMMatchdayCenter=Object.freeze({render,phase,refresh:sectionOpened,debates:KEY_DEBATES});
}
install();
})();