(()=>{
const ALIAS_KEY='rm_league_alias_v1';
const XI_LAYOUT={gk:[50,91,'POR'],lb:[14,73,'LI'],lcb:[38,75,'DFC'],rcb:[62,75,'DFC'],rb:[86,73,'LD'],dm1:[36,55,'MC'],dm2:[64,55,'MC'],am:[50,37,'MP'],lw:[20,25,'EI'],rw:[80,25,'ED'],st:[50,12,'DC']};
let installed=false,attempts=0,tab='general',selectedLeague='',leagueViews=new Map(),loading=false,selectedMemberByLeague=new Map();
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function api(){return window.RMCommunityApi||null}
function data(){return window.RMCommunityData||null}
function participantId(){return safe(()=>api()?.participantId?.(),safe(()=>getParticipantId(),''))||''}
function mine(row){return Boolean(row&&row.participantId===participantId())}
function display(v){return safe(()=>typeof displayName==='function'?displayName(v):v,v)||v}
function savedAlias(){
  const stored=safe(()=>localStorage.getItem(ALIAS_KEY),'')||'';if(stored)return stored;
  const pred=safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null),input=document.getElementById('predictionName');return String(pred?.name||input?.value||'').trim();
}
function setAlias(value){const alias=String(value||'').trim().slice(0,24);if(alias)safe(()=>localStorage.setItem(ALIAS_KEY,alias));return alias}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function rankLabel(row){return row?.rank?`#${row.rank}`:'—'}
function perfectBadge(count){const n=Number(count)||0;return n>0?`<span class="cgl-perfect" title="${n} pleno${n===1?'':'s'}">★${n>1?`×${n}`:''}</span>`:''}
function scoredLabel(d){const n=Number(d?.scoredMatches)||0;return `${n} jornada${n===1?'':'s'} puntuada${n===1?'':'s'}`}
function currentUser(d=data()){return d?.myCompetition||d?.leaderboard?.find(mine)||null}
function ensureRoot(){
  const section=document.getElementById('comunidad');if(!section)return null;let root=document.getElementById('communityLeague');if(root)return root;
  root=document.createElement('section');root.id='communityLeague';root.className='card cgl-shell';const board=document.getElementById('communityLeaderboard')?.closest('.card');if(board)board.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function ensurePulse(){
  const anchor=document.getElementById('engagementLoop')||document.getElementById('personalizedHome');if(!anchor)return null;let root=document.getElementById('communityLeaguePulse');if(root)return root;
  root=document.createElement('button');root.type='button';root.id='communityLeaguePulse';root.className='cgl-pulse';root.addEventListener('click',()=>safe(()=>showSection('comunidad')));anchor.insertAdjacentElement('afterend',root);return root;
}
function personalCard(d){
  const me=currentUser(d),round=d?.roundLeaderboard?.find(mine)||null;
  if(!Number(d?.scoredMatches))return `<div class="cgl-my pending"><span>TU CLASIFICACIÓN</span><b>La liga empieza con el primer XI oficial</b><small>Tu predicción ya puede quedar registrada para la jornada.</small></div>`;
  if(!me)return `<div class="cgl-my pending"><span>TU CLASIFICACIÓN</span><b>Aún no tienes una jornada puntuada</b><small>Publica tu XI antes del cierre para entrar en la clasificación.</small></div>`;
  return `<div class="cgl-my"><span>TU CLASIFICACIÓN</span><strong>${rankLabel(me)}<small>general</small></strong><b>${fmt(me.avg)} / 11 de media</b><div><em>${me.hits}</em><small>aciertos</small><em>${me.streak8||0}</em><small>racha 8+</small><em>${round?.rank?`#${round.rank}`:'—'}</em><small>última jornada</small></div></div>`;
}
function generalTable(d){
  const rows=(d?.leaderboard||[]).slice(0,50);if(!rows.length)return `<div class="cgl-empty"><b>Clasificación todavía sin resultados</b><span>Se activará en cuanto exista un XI oficial para una jornada con pronósticos reales.</span></div>`;
  return `<div class="cgl-table"><div class="cgl-tr head"><span>#</span><span>Pronosticador</span><span>Puntos</span><span>Media</span><span>Racha 8+</span><span>J.</span></div>${rows.map(r=>`<div class="cgl-tr ${mine(r)?'me':''}"><b>${r.rank}</b><span class="cgl-user">${esc(r.alias)}${perfectBadge(r.perfect)}${mine(r)?'<small>Tú</small>':''}</span><strong>${r.hits}</strong><em>${fmt(r.avg)}</em><em>${r.streak8||0}</em><em>${r.scoredMatches||0}</em></div>`).join('')}</div><p class="cgl-method">La general ordena por puntos acumulados; cada acierto vale 1 punto y un pleno vale 11. En empate, los plenos sirven como desempate. Solo cuentan predicciones realmente publicadas antes del cierre.</p>`;
}
function roundTable(d){
  const rows=d?.roundLeaderboard||[],m=d?.latestScoredMatch;if(!m||!rows.length)return `<div class="cgl-empty"><b>Ranking de jornada pendiente</b><span>Aparecerá al publicarse el primer XI oficial puntuable.</span></div>`;
  return `<div class="cgl-round-head"><div><span>ÚLTIMA JORNADA PUNTUADA</span><b>Real Madrid · ${esc(m.rival||m.id)}</b></div><strong>${rows.length}<small>participantes</small></strong></div><div class="cgl-table round"><div class="cgl-tr head"><span>#</span><span>Pronosticador</span><span>Aciertos</span><span></span><span></span><span></span></div>${rows.slice(0,50).map(r=>`<div class="cgl-tr ${mine(r)?'me':''}"><b>${r.rank}</b><span class="cgl-user">${esc(r.alias)}${perfectBadge(r.perfect?1:0)}${mine(r)?'<small>Tú</small>':''}</span><strong>${r.hits}/11</strong><em></em><em></em><em></em></div>`).join('')}</div>`;
}
function leagueCards(d){
  const leagues=d?.myLeagues||[];if(!leagues.length)return `<div class="cgl-empty compact"><b>No encontramos ligas vinculadas a este navegador</b><span>Actualizamos la pertenencia al abrir esta sección. Si tienes un código de invitación, introdúcelo debajo para entrar.</span></div>`;
  return `<div class="cgl-leagues">${leagues.map(l=>`<button type="button" class="${selectedLeague===l.code?'active':''}" data-cgl-league="${esc(l.code)}"><span>${esc(l.name)}</span><b>${esc(l.code)}</b><small>${l.memberCount} miembro${l.memberCount===1?'':'s'}${l.owner?' · creada por ti':''}</small></button>`).join('')}</div>`;
}
function predTime(value){if(!value)return '';const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})}
function selectedLeagueMember(view){
  const members=view?.members||[];if(!members.length)return null;let id=selectedMemberByLeague.get(view.code);
  if(!members.some(m=>m.participantId===id)){
    const preferred=members.find(m=>mine(m)&&m.currentPrediction?.xi)||members.find(m=>m.currentPrediction?.xi)||members.find(m=>mine(m))||members[0];id=preferred?.participantId||'';if(id)selectedMemberByLeague.set(view.code,id);
  }
  return members.find(m=>m.participantId===id)||null;
}
function memberPitch(member){
  const pred=member?.currentPrediction,xi=pred?.xi;if(!xi)return `<div class="cgl-empty compact cgl-xi-empty"><b>${esc(member?.alias||'Este usuario')} todavía no ha publicado su XI</b><span>Cuando publique su predicción para el próximo partido aparecerá aquí.</span></div>`;
  const players=Object.entries(XI_LAYOUT).filter(([slot])=>xi[slot]).map(([slot,[left,top,role]])=>`<div class="cgl-xi-player" style="left:${left}%;top:${top}%"><i>${role}</i><b>${esc(display(xi[slot]))}</b></div>`).join('');
  const when=predTime(pred.updatedAt);return `<div class="cgl-xi-card"><div class="cgl-xi-meta"><div><span>XI DE ${esc(member.alias||'USUARIO')}</span><b>${mine(member)?'Tu predicción':`Predicción de ${esc(member.alias||'Usuario')}`}</b></div>${when?`<small>Actualizado ${esc(when)}</small>`:''}</div><div class="pitch cgl-xi-pitch">${players}</div></div>`;
}
function leaguePredictions(view){
  if(!view?.amMember)return `<div class="cgl-empty compact cgl-xi-locked"><b>Los XI son privados para los miembros de la liga</b><span>Entra en la liga para poder ver las predicciones de sus participantes.</span></div>`;
  const members=view.members||[];if(!members.length)return '';
  const selected=selectedLeagueMember(view),rival=data()?.match?.rival||'el próximo partido';
  return `<section class="cgl-xi-section"><div class="cgl-xi-head"><div><span>ONCES DE TU LIGA</span><b>Predicciones contra ${esc(rival)}</b><small>Toca un usuario para ver su XI publicado.</small></div><strong>${members.filter(m=>m.currentPrediction?.xi).length}/${members.length}<small>con XI</small></strong></div><div class="cgl-xi-members">${members.map(m=>`<button type="button" class="${selected?.participantId===m.participantId?'active':''} ${m.currentPrediction?.xi?'has-xi':'no-xi'}" data-cgl-member="${esc(m.participantId)}"><span>${esc(m.alias||'Usuario')}${mine(m)?'<small>Tú</small>':''}</span><b>${m.currentPrediction?.xi?'Ver XI':'Sin XI'}</b></button>`).join('')}</div>${memberPitch(selected)}</section>`;
}
function leagueRanking(view){
  if(!view)return `<div class="cgl-empty compact"><b>Elige una liga</b><span>Verás su clasificación general y el resultado de la última jornada.</span></div>`;
  const rows=view.ranking||[];
  const ranking=rows.length?`<div class="cgl-table private"><div class="cgl-tr head"><span>#</span><span>Pronosticador</span><span>Puntos</span><span>Media</span><span>Racha 8+</span><span>J.</span></div>${rows.map(r=>`<div class="cgl-tr ${mine(r)?'me':''}"><b>${r.rank}</b><span>${esc(r.alias)}${mine(r)?'<small>Tú</small>':''}</span><strong>${r.hits}</strong><em>${fmt(r.avg)}</em><em>${r.streak8||0}</em><em>${r.scoredMatches||0}</em></div>`).join('')}</div>`:`<div class="cgl-empty compact"><b>La liga está preparada</b><span>La clasificación empezará cuando sus miembros tengan jornadas puntuadas.</span></div>`;
  return `<div class="cgl-private-head"><div><span>LIGA PRIVADA</span><h3>${esc(view.name)}</h3><small>Código ${esc(view.code)} · ${view.memberCount} miembro${view.memberCount===1?'':'s'}</small></div><div class="cgl-private-actions"><button type="button" data-cgl-share="${esc(view.code)}">Compartir código</button>${view.amMember&&!view.amOwner?`<button type="button" class="danger" data-cgl-leave="${esc(view.code)}">Salir</button>`:''}</div></div>${ranking}${leaguePredictions(view)}`;
}
function privatePanel(d){
  const alias=savedAlias(),view=selectedLeague?leagueViews.get(selectedLeague):null;
  return `<div class="cgl-private-grid"><section><div class="cgl-form-head"><span>TUS LIGAS</span><b>Compite con amigos</b></div>${leagueCards(d)}<div class="cgl-form"><label>Tu apodo<input id="cglAlias" maxlength="24" value="${esc(alias)}" placeholder="Ej.: Pedro"></label><label>Crear una liga<input id="cglName" maxlength="32" placeholder="Ej.: Peña Bernabéu"></label><button type="button" data-cgl-create>Crear liga</button><div class="cgl-or">o</div><label>Entrar con código<input id="cglCode" maxlength="8" value="${esc(queryLeague())}" placeholder="ABC123"></label><button type="button" data-cgl-join>Unirme</button></div></section><section id="cglLeagueView">${leagueRanking(view)}</section></div>`;
}
function queryLeague(){return safe(()=>new URL(location.href).searchParams.get('league'),'')||''}
function tabsHtml(){return `<div class="cgl-tabs"><button type="button" class="${tab==='general'?'active':''}" data-cgl-tab="general">General</button><button type="button" class="${tab==='round'?'active':''}" data-cgl-tab="round">Jornada</button><button type="button" class="${tab==='private'?'active':''}" data-cgl-tab="private">Ligas privadas</button></div>`}
function renderRoot(){
  const root=ensureRoot(),d=data();if(!root)return false;
  if(!d){root.innerHTML='<div class="cgl-empty"><b>LIGA RM</b><span>Cargando clasificación y ligas…</span></div>';return false}
  root.innerHTML=`<div class="cgl-head"><div><span>LIGA RM</span><h2>Que cada jornada cuente</h2><p>Clasificación real por aciertos, ranking de cada jornada, rachas y ligas privadas. Nada se reconstruye después del XI oficial.</p></div><b>${scoredLabel(d)}</b></div>${personalCard(d)}${tabsHtml()}<div class="cgl-body">${tab==='general'?generalTable(d):tab==='round'?roundTable(d):privatePanel(d)}</div>`;
  bind(root);return true;
}
function renderPulse(){
  const root=ensurePulse(),d=data();if(!root||!d)return false;const me=currentUser(d),leagueCount=d.myLeagues?.length||0;
  root.innerHTML=Number(d.scoredMatches)?`<span>LIGA RM</span><b>${me?`${rankLabel(me)} · ${fmt(me.avg)} de media`:'Entra en la clasificación'}</b><small>${leagueCount?`${leagueCount} liga${leagueCount===1?'':'s'} privada${leagueCount===1?'':'s'} · `:''}ver general y jornada →</small>`:`<span>LIGA RM</span><b>La competición empieza con el primer XI oficial</b><small>${leagueCount?`${leagueCount} liga${leagueCount===1?'':'s'} preparada${leagueCount===1?'':'s'} · `:''}crea tu liga privada →</small>`;return true
}
function render(){renderRoot();renderPulse()}
async function refresh(force=false){
  if(loading)return data();if(!api()?.available?.())return null;loading=true;
  try{if(force||!data())await api().refresh?.();render();return data()}finally{loading=false}
}
async function post(body){
  const response=await fetch(api().url(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);return result
}
async function createLeague(){
  const alias=setAlias(document.getElementById('cglAlias')?.value),name=document.getElementById('cglName')?.value?.trim();if(alias.length<2){safe(()=>toast('Pon un apodo de al menos 2 caracteres'));return}if((name||'').length<3){safe(()=>toast('Pon un nombre de liga de al menos 3 caracteres'));return}
  try{const result=await post({action:'createLeague',participantId:participantId(),alias,name});selectedLeague=result.league.code;tab='private';leagueViews.delete(selectedLeague);await refresh(true);await loadLeague(selectedLeague,true);safe(()=>toast(`Liga creada · código ${selectedLeague}`))}catch(error){safe(()=>toast(error.message||'No se pudo crear la liga'))}
}
async function joinWith(aliasValue,codeValue){
  const alias=setAlias(aliasValue),code=String(codeValue||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);if(alias.length<2){safe(()=>toast('Pon un apodo de al menos 2 caracteres'));return null}if(!code){safe(()=>toast('Introduce el código de la liga'));return null}
  try{const result=await post({action:'joinLeague',participantId:participantId(),alias,code});selectedLeague=result.league.code;tab='private';leagueViews.delete(selectedLeague);await refresh(true);await loadLeague(selectedLeague,true);safe(()=>toast(`Ya estás en ${result.league.name}`));return result}catch(error){safe(()=>toast(error.message||'No se pudo entrar en la liga'));return null}
}
async function joinLeague(){
  return joinWith(document.getElementById('cglAlias')?.value,document.getElementById('cglCode')?.value);
}
async function leaveLeague(code){
  try{await post({action:'leaveLeague',participantId:participantId(),code});leagueViews.delete(code);selectedMemberByLeague.delete(code);selectedLeague='';await refresh(true);safe(()=>toast('Has salido de la liga'))}catch(error){safe(()=>toast(error.message||'No se pudo salir'))}
}
async function loadLeague(code,force=false){
  code=String(code||'').toUpperCase();if(!code)return null;selectedLeague=code;if(!force&&leagueViews.has(code)){render();return leagueViews.get(code)}
  const target=document.getElementById('cglLeagueView');if(target)target.innerHTML='<div class="cgl-empty compact"><b>Cargando liga…</b></div>';
  try{const response=await fetch(api().url({league:code,participantId:participantId()}),{headers:{accept:'application/json'}}),result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);leagueViews.set(code,result.league);render();return result.league}catch(error){if(target)target.innerHTML=`<div class="cgl-empty compact"><b>No se pudo cargar la liga</b><span>${esc(error.message)}</span></div>`;return null}
}
async function shareCode(code){
  const text=`Liga RM 26/27 · código ${code}`;const url=new URL(location.href);url.searchParams.set('league',code);url.hash='';
  try{if(navigator.share){await navigator.share({title:'Liga privada RM 26/27',text,url:url.href});return}await navigator.clipboard.writeText(`${text}\n${url.href}`);safe(()=>toast('Código y enlace copiados'))}catch{}
}
function bind(root){
  root.querySelectorAll('[data-cgl-tab]').forEach(b=>b.addEventListener('click',async()=>{tab=b.dataset.cglTab;if(tab==='private'){root.querySelector('.cgl-body').innerHTML='<div class="cgl-empty compact"><b>Sincronizando tus ligas…</b><span>Comprobando la pertenencia con el servidor.</span></div>';await refresh(true)}else render()}));
  root.querySelectorAll('[data-cgl-league]').forEach(b=>b.addEventListener('click',()=>loadLeague(b.dataset.cglLeague)));
  root.querySelectorAll('[data-cgl-member]').forEach(b=>b.addEventListener('click',()=>{if(!selectedLeague)return;selectedMemberByLeague.set(selectedLeague,b.dataset.cglMember);render()}));
  root.querySelector('[data-cgl-create]')?.addEventListener('click',createLeague);root.querySelector('[data-cgl-join]')?.addEventListener('click',joinLeague);
  root.querySelectorAll('[data-cgl-share]').forEach(b=>b.addEventListener('click',()=>shareCode(b.dataset.cglShare)));root.querySelectorAll('[data-cgl-leave]').forEach(b=>b.addEventListener('click',()=>leaveLeague(b.dataset.cglLeave)));
}
function install(){
  if(installed)return;if(!document.getElementById('comunidad')||!api()){if(++attempts<100)setTimeout(install,90);return}
  installed=true;const sharedLeague=queryLeague();if(sharedLeague){tab='private';selectedLeague=sharedLeague}render();if(sharedLeague)setTimeout(()=>loadLeague(sharedLeague,true),80);
  document.addEventListener('rm-community-updated',()=>setTimeout(()=>{render();if(selectedLeague)loadLeague(selectedLeague,true)},50));document.addEventListener('rm-local-prediction-updated',()=>setTimeout(()=>refresh(true),120));window.addEventListener('storage',()=>setTimeout(render,40));
  const idle=()=>refresh(false);if('requestIdleCallback'in window)requestIdleCallback(idle,{timeout:2200});else setTimeout(idle,1400);
  window.RMCommunityLeague=Object.freeze({render,refresh,loadLeague,join:joinWith,state:()=>({tab,selectedLeague,data:data(),mine:currentUser()})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
