(()=>{
const FAVORITES_KEY='rm_player_favorites_v1';
const RECENTS_KEY='rm_player_recents_v1';
const HISTORY_KEY='rm_prediction_history_v1';
const SNAPSHOT_KEY='rm_public_visit_snapshot_v2';
let installed=false,predictionHooked=false;

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')??fallback}catch{return fallback}}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function playerList(){return safe(()=>players,[])||[]}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function go(id){if(typeof showSection==='function')showSection(id)}
function currentStage(){return safe(()=>window.RMPublicEngagement?.stage?.(),null)}
function currentSnapshot(){return safe(()=>window.RMPublicEngagement?.snapshot?.(),null)}
function readArray(key){const value=parse(key,[]);return Array.isArray(value)?value:[]}
function favorites(){return readArray(FAVORITES_KEY).filter(Boolean)}
function recents(){return readArray(RECENTS_KEY).filter(Boolean).slice(0,5)}

function predictionRecords(){
  const ledger=parse(HISTORY_KEY,{})||{},out={...ledger};
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith('rm_prediction_')||key===HISTORY_KEY)continue;
      const data=parse(key,null);if(!data?.xi)continue;
      const matchId=data.matchId||key.slice('rm_prediction_'.length),prior=out[matchId]||{};
      out[matchId]={...prior,...data,matchId,label:prior.label||data.label||labelFromId(matchId)};
    }
  }catch{}
  return Object.values(out).filter(x=>x?.matchId).sort((a,b)=>String(b.scoredAt||b.savedAt||'').localeCompare(String(a.scoredAt||a.savedAt||'')));
}
function labelFromId(id){
  const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ');
  const rival=m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${rival} · ${m[4]}/${m[3]}/${m[2]}`;
}
function player(name){return playerList().find(p=>p.name===name||p.short===name||canonical(p.name)===canonical(name))||null}
function metric(name){const p=player(name);return p?safe(()=>metricFor(p),null):null}
function rating(m){return m?safe(()=>currentRating(m),Number.isFinite(m.rating)?m.rating:null):null}
function power(name){
  const key=canonical(name),migrated=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===key),null);
  if(Number.isFinite(migrated?.power))return migrated.power;
  const m=metric(name),r=rating(m);return m&&Number.isFinite(r)?r*(.75+.25*Math.min(m.minutes||0,450)/450):null;
}
function recent(name){return safe(()=>window.RMSeasonData?.recentRating?.(name,3),null)}
function trend(name){return safe(()=>window.RMSeasonData?.ratingDelta?.(name),null)}
function fmt(v){return Number.isFinite(v)?Number(v).toFixed(2):'—'}

function actionState(){
  const stage=currentStage(),m=match(),records=predictionRecords(),current=m?records.find(r=>r.matchId===m.id):null;
  if(!stage)return {eyebrow:'AHORA',title:'Explora la temporada a tu manera',copy:'Consulta rendimiento, compara jugadores o construye tu propio XI.',label:'Ver Power RM',section:'power',tone:'neutral'};
  if(stage.eyebrow==='PREDICCIÓN ABIERTA'){
    if(current)return {eyebrow:'TU SIGUIENTE PASO',title:'Tu XI ya está guardado',copy:`Puedes revisarlo o cambiarlo antes del cierre${m?.rival?` contra el ${m.rival}`:''}.`,label:'Revisar mi XI',section:'prediccion',tone:'gold'};
    return {eyebrow:'TU SIGUIENTE PASO',title:`Elige tu XI${m?.rival?` contra el ${m.rival}`:''}`,copy:'Guárdalo para compararlo después con el once oficial y medir tus aciertos.',label:'Hacer mi predicción',section:'prediccion',tone:'gold'};
  }
  if(stage.eyebrow==='EN BREVE')return {eyebrow:'AHORA',title:'La predicción ya está cerrada',copy:current?'Tu XI queda guardado. Consulta la previa antes de que empiece el partido.':'Consulta la previa y los debates antes del inicio.',label:'Ver previa',section:'partido',tone:'blue'};
  if(stage.eyebrow==='PARTIDO')return {eyebrow:'AHORA',title:'El partido está en juego',copy:'Entra al centro del partido. El análisis se actualizará cuando tengamos los datos finales.',label:'Centro del partido',section:'partido',tone:'live'};
  if(stage.eyebrow==='ÚLTIMA JORNADA')return {eyebrow:'NUEVO ANÁLISIS',title:'Ya puedes ver qué cambió tras el partido',copy:'Revisa la evolución, la forma reciente y los movimientos en los rankings.',label:'Ver evolución',section:'evolucion',tone:'blue'};
  return {eyebrow:'AHORA',title:stage.title||'Temporada actualizada',copy:stage.copy||'Consulta el último estado del seguimiento.',label:stage.action||'Ver temporada',section:stage.section||'inicio',tone:'neutral'};
}

function favoriteRows(){
  const names=favorites().slice(0,4);if(!names.length)return '';
  return names.map(name=>{
    const p=player(name),pow=power(name),form=recent(name),d=trend(name),delta=Number.isFinite(d?.delta)?`${d.delta>=0?'▲':'▼'} ${Math.abs(d.delta).toFixed(1)}`:'—';
    return `<button type="button" class="personal-favorite-row" data-home-player="${esc(p?.name||name)}"><span><b>${esc(display(p?.name||name))}</b><small>${esc(p?.pos||'Jugador')} · ${Number.isFinite(pow)?`Power ${fmt(pow)}`:'Power —'}</small></span><em>${form?fmt(form.value):'—'}<small>forma</small></em><strong class="${d?.delta>0?'up':d?.delta<0?'down':''}">${delta}</strong></button>`;
  }).join('');
}
function favoritesCard(){
  const fav=favorites();if(!fav.length){const recentName=recents()[0];return `<article class="personal-home-card favorites empty"><span class="personal-home-label">TUS JUGADORES</span><h3>Aún no tienes favoritos</h3><p>Marca la ☆ de cualquier jugador para tener aquí su Power, forma y tendencia.</p><div class="personal-home-actions"><button type="button" class="btn" data-home-go="plantilla">Elegir favoritos</button>${recentName?`<button type="button" class="btn ghost" data-home-player="${esc(recentName)}">Volver a ${esc(display(recentName))}</button>`:''}</div></article>`}
  return `<article class="personal-home-card favorites"><div class="personal-card-head"><div><span class="personal-home-label">TUS FAVORITOS</span><h3>${fav.length} jugador${fav.length===1?'':'es'} bajo seguimiento</h3></div><button type="button" data-home-go="plantilla">Ver plantilla</button></div><div class="personal-favorite-list">${favoriteRows()}</div></article>`;
}
function predictionCard(){
  const records=predictionRecords(),latest=records[0];if(!latest)return `<article class="personal-home-card prediction empty"><span class="personal-home-label">TU ÚLTIMA PREDICCIÓN</span><h3>Todavía no has guardado ningún XI</h3><p>Cuando hagas tu primera predicción, su resultado y tu historial aparecerán aquí.</p><button type="button" class="btn" data-home-go="prediccion">Hacer mi XI</button></article>`;
  const score=Number.isFinite(latest.score)?`${latest.score}/11`:'Pendiente',scored=Number.isFinite(latest.score);
  return `<article class="personal-home-card prediction"><div class="personal-card-head"><div><span class="personal-home-label">TU ÚLTIMA PREDICCIÓN</span><h3>${esc(latest.label||labelFromId(latest.matchId))}</h3></div><em class="personal-prediction-score ${scored&&latest.score>=9?'great':''}">${score}</em></div><p>${scored?'Resultado guardado en Mi temporada.':'Esperando el XI oficial para calcular tus aciertos.'}</p><div class="personal-home-actions"><button type="button" class="btn" data-home-go="prediccion">Ver predicción</button><button type="button" class="btn ghost" data-home-go="mi-temporada">Mi historial</button></div></article>`;
}
function visitChanges(){
  const prev=parse(SNAPSHOT_KEY,null),now=currentSnapshot(),items=[];
  if(!now)return ['El seguimiento se está preparando.'];
  if(!prev){
    if(now.powerLeader)items.push(`${display(now.powerLeader)} lidera actualmente el Power RM.`);
    if(now.formLeader)items.push(`${display(now.formLeader)} es el jugador con mejor forma reciente.`);
    if(!items.length)items.push('En tu próxima visita te resumiremos aquí los cambios importantes.');
    return items.slice(0,3);
  }
  if((now.matchCount||0)>(prev.matchCount||0))items.push(`Nuevo partido incorporado: ${now.latestLabel||'última jornada'}.`);
  if(now.powerLeader&&prev.powerLeader&&canonical(now.powerLeader)!==canonical(prev.powerLeader))items.push(`${display(now.powerLeader)} pasa a liderar el Power RM.`);
  if(now.formLeader&&prev.formLeader&&canonical(now.formLeader)!==canonical(prev.formLeader))items.push(`${display(now.formLeader)} es ahora el jugador más en forma.`);
  if(now.efficiencyLeader&&prev.efficiencyLeader&&canonical(now.efficiencyLeader)!==canonical(prev.efficiencyLeader))items.push(`${display(now.efficiencyLeader)} pasa a liderar la eficiencia.`);
  const newPredictions=(now.communityTotal||0)-(prev.communityTotal||0);if(newPredictions>0)items.push(`La comunidad suma ${newPredictions} pronóstico${newPredictions===1?'':'s'} nuevo${newPredictions===1?'':'s'}.`);
  if(!items.length)items.push('No hay cambios grandes en rankings o comunidad desde tu última visita.');
  return items.slice(0,3);
}
function changesCard(){const items=visitChanges();return `<article class="personal-home-card changes"><span class="personal-home-label">DESDE TU ÚLTIMA VISITA</span><h3>Lo que merece tu atención</h3><div class="personal-change-list">${items.map((item,i)=>`<div><b>${i+1}</b><span>${esc(item)}</span></div>`).join('')}</div></article>`}
function nextCard(){const a=actionState();return `<button type="button" class="personal-next ${a.tone}" data-home-go="${esc(a.section)}"><div><span>${esc(a.eyebrow)}</span><h2>${esc(a.title)}</h2><p>${esc(a.copy)}</p></div><strong>${esc(a.label)} <i>→</i></strong></button>`}

function bind(root){
  root.querySelectorAll('[data-home-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.homeGo)));
  root.querySelectorAll('[data-home-player]').forEach(btn=>btn.addEventListener('click',()=>{
    const name=btn.dataset.homePlayer;go('plantilla');setTimeout(()=>{if(window.RMPlayerExperience?.open)window.RMPlayerExperience.open(name);else if(typeof openPlayerHub==='function')openPlayerHub(name)},50);
  }));
}
function ensureRoot(){
  const home=document.getElementById('inicio'),pulse=document.getElementById('publicPulse'),intro=document.getElementById('publicIntro');if(!home||!intro||!pulse)return null;
  let root=document.getElementById('personalizedHome');if(!root){root=document.createElement('section');root.id='personalizedHome';root.className='personalized-home';pulse.insertAdjacentElement('beforebegin',root)}return root;
}
function render(){
  const root=ensureRoot();if(!root)return false;document.body.classList.add('personal-home-ready');
  const hasPersonal=favorites().length||recents().length||predictionRecords().length;
  root.innerHTML=`<div class="personal-home-head"><div><span>${hasPersonal?'TU RM 26/27':'HAZLO TUYO'}</span><h2>${hasPersonal?'Tu temporada, nada más entrar.':'Empieza tu seguimiento personal.'}</h2></div><small>Privado · guardado en este dispositivo</small></div>${nextCard()}<div class="personal-home-grid">${favoritesCard()}${predictionCard()}${changesCard()}</div>`;
  bind(root);return true;
}
function hookPrediction(){
  if(predictionHooked||typeof savePrediction!=='function')return;predictionHooked=true;const base=savePrediction;
  savePrediction=async function(...args){const out=await base.apply(this,args);setTimeout(render,180);return out};
}
function install(){
  if(installed)return;if(!document.getElementById('inicio')||!window.RMPublicEngagement){setTimeout(install,100);return}
  installed=true;hookPrediction();render();
  document.addEventListener('rm-player-favorites-updated',render);document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-community-updated',render);document.addEventListener('rm-matchday-polls-updated',render);
  [350,1100,2400].forEach(ms=>setTimeout(()=>{hookPrediction();render()},ms));
  window.RMPersonalHome=Object.freeze({refresh:render,action:actionState,changes:visitChanges});
}
setTimeout(install,220);
})();
