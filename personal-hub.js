(()=>{
const HISTORY_KEY='rm_prediction_history_v1';
const PERSONAL_SECTION=['mi-temporada','◎','Mi temporada','Mi temporada','Tu historial de predicciones, aciertos, récords y nivel personal.'];
let installed=false,searchOpen=false,playerHooked=false;

function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch{}}
function display(name){try{return typeof displayName==='function'?displayName(name):name}catch{return name}}
function playerList(){try{return typeof players!=='undefined'?players:[]}catch{return []}}
function sectionList(){try{return typeof sections!=='undefined'?sections:[]}catch{return []}}
function activeSection(){return document.querySelector('.section.active')?.id||'inicio'}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function currentMatch(){try{return typeof predictionMatch!=='undefined'?predictionMatch:null}catch{return null}}
function currentOfficial(){try{return typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:null}catch{return null}}

function readLedger(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'{}')||{}}catch{return {}}}
function writeLedger(data){try{localStorage.setItem(HISTORY_KEY,JSON.stringify(data))}catch{}}
function predictionLabel(id){
  const raw=String(id||'partido');const m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const rival=m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${rival} · ${m[4]}/${m[3]}/${m[2]}`;
}
function syncLedger(){
  const ledger=readLedger();
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith('rm_prediction_')||key===HISTORY_KEY)continue;
      let data=null;try{data=JSON.parse(localStorage.getItem(key)||'null')}catch{}
      if(!data?.xi)continue;
      const matchId=data.matchId||key.slice('rm_prediction_'.length);const prior=ledger[matchId]||{};
      ledger[matchId]={...prior,matchId,label:prior.label||predictionLabel(matchId),savedAt:data.savedAt||prior.savedAt||null,name:data.name||prior.name||'',xi:data.xi};
    }
  }catch{}
  const match=currentMatch(),official=currentOfficial();
  if(match&&official&&ledger[match.id]?.xi){
    const predicted=new Set(values(ledger[match.id].xi)),actual=new Set(official);const hits=[...predicted].filter(n=>actual.has(n));
    ledger[match.id]={...ledger[match.id],rival:match.rival||ledger[match.id].rival,score:hits.length,possible:11,scoredAt:new Date().toISOString()};
  }
  writeLedger(ledger);return Object.values(ledger).sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||'')));
}
function stats(records){
  const scored=records.filter(r=>Number.isFinite(r.score));const hits=scored.reduce((s,r)=>s+r.score,0),avg=scored.length?hits/scored.length:null,best=scored.length?Math.max(...scored.map(r=>r.score)):null,perfect=scored.filter(r=>r.score===11).length;
  let level='Debutante';if(scored.length>=1)level='Analista';if(scored.length>=3)level=avg>=9?'Capitán':avg>=7.5?'Titular':'En progresión';if(scored.length>=8&&avg>=9)level='Leyenda del XI';
  return {total:records.length,scored:scored.length,hits,avg,best,perfect,level};
}
function badges(s){
  const items=[];if(s.total>=1)items.push(['✓','Primer pronóstico']);if((s.best||0)>=9)items.push(['9+','Ojo clínico']);if(s.perfect)items.push(['11','Pleno']);if(s.scored>=3)items.push(['◆','Constancia']);if(s.avg>=9&&s.scored>=3)items.push(['★','Media 9+']);return items;
}
function currentPredictionCard(records){
  const match=currentMatch();if(!match)return '';
  const rec=records.find(r=>r.matchId===match.id);
  if(!rec)return `<button class="ph-current empty" data-personal-go="prediccion"><span>PRÓXIMO RETO</span><b>Haz tu predicción contra ${esc(match.rival||'el próximo rival')}</b><small>Tu historial empezará en cuanto guardes tu primer XI.</small><strong>Predecir XI →</strong></button>`;
  const score=Number.isFinite(rec.score)?`${rec.score}/11`:'Pendiente';return `<button class="ph-current" data-personal-go="prediccion"><span>ÚLTIMA PREDICCIÓN</span><div><b>${esc(rec.label||predictionLabel(rec.matchId))}</b><em>${score}</em></div><small>${Number.isFinite(rec.score)?'Resultado guardado en tu historial.':'Esperando el XI oficial para calcular tus aciertos.'}</small><strong>Ver predicción →</strong></button>`;
}
function historyHtml(records){
  if(!records.length)return `<div class="ph-empty"><b>Aún no hay jornadas en tu historial</b><span>Haz una predicción y aparecerá aquí automáticamente.</span><button class="btn primary" data-personal-go="prediccion">Hacer mi primera predicción</button></div>`;
  return records.map(r=>`<article class="ph-history-row"><div><b>${esc(r.label||predictionLabel(r.matchId))}</b><small>${r.savedAt?new Date(r.savedAt).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'}):'Pronóstico guardado'}</small></div><strong class="${Number.isFinite(r.score)?(r.score>=9?'great':r.score>=7?'good':''):'pending'}">${Number.isFinite(r.score)?`${r.score}/11`:'Pendiente'}</strong></article>`).join('');
}
function ensureSection(){
  if(!sectionList().some(s=>s[0]==='mi-temporada'))sectionList().splice(1,0,PERSONAL_SECTION);
  if(document.getElementById('mi-temporada'))return;
  const section=document.createElement('section');section.id='mi-temporada';section.className='section ph-section';
  section.innerHTML='<div class="section-head"><div><h2>Mi temporada</h2><p>Tu historial personal vive en este dispositivo. No necesitas crear una cuenta.</p></div><span class="pill">Privado · local</span></div><div id="personalHubContent"></div>';
  const inicio=document.getElementById('inicio');if(inicio)inicio.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section);
}
function bindPersonal(root){root.querySelectorAll('[data-personal-go]').forEach(b=>b.addEventListener('click',()=>{if(typeof showSection==='function')showSection(b.dataset.personalGo)}))}
function renderPersonal(){
  ensureSection();const records=syncLedger(),s=stats(records),root=document.getElementById('personalHubContent');if(!root)return;
  const earned=badges(s);
  root.innerHTML=`<div class="ph-hero"><div><span>TU PERFIL DE PRONOSTICADOR</span><h2>${esc(s.level)}</h2><p>${s.scored?`Has puntuado ${s.scored} jornada${s.scored===1?'':'s'} con una media de ${s.avg.toFixed(2)} aciertos.`:'Tu nivel evolucionará cuando tengamos onces oficiales puntuados.'}</p></div><div class="ph-level-mark">${s.avg===null?'—':s.avg.toFixed(1)}<small>media /11</small></div></div><div class="ph-kpis"><div><span>Pronósticos</span><b>${s.total}</b><small>guardados</small></div><div><span>Media</span><b>${s.avg===null?'—':s.avg.toFixed(2)}</b><small>sobre 11</small></div><div><span>Mejor jornada</span><b>${s.best===null?'—':`${s.best}/11`}</b><small>${s.perfect?`${s.perfect} pleno${s.perfect===1?'':'s'}`:'récord personal'}</small></div><div><span>Aciertos</span><b>${s.hits}</b><small>acumulados</small></div></div>${currentPredictionCard(records)}<div class="ph-grid"><section class="card ph-history"><div class="ph-title"><div><span>HISTORIAL</span><h3>Jornada a jornada</h3></div></div><div>${historyHtml(records)}</div></section><section class="card ph-achievements"><div class="ph-title"><div><span>LOGROS</span><h3>Tu progreso</h3></div></div>${earned.length?`<div class="ph-badges">${earned.map(([icon,label])=>`<div><b>${icon}</b><span>${label}</span></div>`).join('')}</div>`:'<div class="ph-empty compact"><b>Primer logro bloqueado</b><span>Guarda tu primer pronóstico para desbloquearlo.</span></div>'}</section></div>`;
  bindPersonal(root);renderHomeCard(records,s);
}
function renderHomeCard(records,s){
  const home=document.getElementById('inicio');if(!home)return;let card=document.getElementById('personalHomeCard');
  if(!card){card=document.createElement('button');card.id='personalHomeCard';card.type='button';card.className='personal-home-card';card.addEventListener('click',()=>showSection('mi-temporada'));const pulse=document.getElementById('publicPulse');if(pulse)pulse.insertAdjacentElement('afterend',card);else home.querySelector('.hero')?.insertAdjacentElement('afterend',card)}
  const latest=records[0];card.innerHTML=`<span>MI TEMPORADA</span><div><b>${esc(s.level)}</b><em>${s.avg===null?'Sin jornadas puntuadas':`${s.avg.toFixed(2)}/11 de media`}</em></div><small>${latest?`${esc(latest.label||predictionLabel(latest.matchId))} · ${Number.isFinite(latest.score)?`${latest.score}/11`:'pendiente'}`:'Haz tu primer pronóstico para empezar'}</small><strong>Ver mi historial →</strong>`;
}

function ensureSearch(){
  if(document.getElementById('rmGlobalSearch'))return;
  const overlay=document.createElement('div');overlay.id='rmGlobalSearch';overlay.className='global-search';overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML='<button class="global-search-backdrop" type="button" aria-label="Cerrar búsqueda"></button><div class="global-search-panel" role="dialog" aria-modal="true" aria-label="Buscar en RM 26/27"><div class="global-search-input"><span>⌕</span><input id="rmSearchInput" autocomplete="off" placeholder="Busca jugador, Power, Radar, XI…"><kbd>ESC</kbd></div><div id="rmSearchResults" class="global-search-results"></div><div class="global-search-foot"><span>Escribe para buscar</span><span>↵ abrir</span></div></div>';
  document.body.appendChild(overlay);overlay.querySelector('.global-search-backdrop').addEventListener('click',closeSearch);overlay.querySelector('#rmSearchInput').addEventListener('input',e=>renderSearch(e.target.value));
}
function ensureSearchButton(){
  const actions=document.querySelector('.topbar .actions');if(!actions||document.getElementById('globalSearchBtn'))return;
  const b=document.createElement('button');b.id='globalSearchBtn';b.type='button';b.className='btn global-search-btn';b.innerHTML='<span>⌕</span><em>Buscar</em>';b.addEventListener('click',openSearch);actions.prepend(b);
}
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function searchItems(q){
  const query=normalize(q).trim();const sectionsOut=sectionList().filter(s=>!query||normalize(`${s[2]} ${s[3]} ${s[4]}`).includes(query)).slice(0,7).map(s=>({type:'section',id:s[0],title:s[2],sub:s[4],icon:s[1]}));
  const playersOut=playerList().filter(p=>!query||normalize(`${p.name} ${p.short||''} ${p.pos} ${p.role}`).includes(query)).slice(0,8).map(p=>({type:'player',id:p.name,title:p.short||p.name,sub:`${p.pos} · ${p.role}`,icon:'◉'}));return [...sectionsOut,...playersOut];
}
function renderSearch(q=''){
  const root=document.getElementById('rmSearchResults');if(!root)return;const items=searchItems(q);
  if(!items.length){root.innerHTML='<div class="global-search-empty">No encuentro nada con ese término.</div>';return}
  let last='';root.innerHTML=items.map((item,i)=>{const group=item.type==='section'?'Secciones':'Jugadores',head=group!==last?`<div class="global-search-group">${group}</div>`:'';last=group;return `${head}<button data-search-type="${item.type}" data-search-id="${esc(item.id)}" ${i===0?'data-search-first="1"':''}><span>${esc(item.icon)}</span><div><b>${esc(item.title)}</b><small>${esc(item.sub)}</small></div><strong>›</strong></button>`}).join('');
  root.querySelectorAll('[data-search-type]').forEach(b=>b.addEventListener('click',()=>activateSearch(b.dataset.searchType,b.dataset.searchId)));
}
function openPlayerWhenReady(name,attempt=0){
  try{if(typeof openPlayerHub==='function'){openPlayerHub(name);return}}catch{}
  if(attempt<30)setTimeout(()=>openPlayerWhenReady(name,attempt+1),100);else toastSafe('Abre Plantilla para ver la ficha del jugador');
}
function activateSearch(type,id){closeSearch();if(type==='section'){showSection(id);return}showSection('plantilla');openPlayerWhenReady(id)}
function openSearch(){ensureSearch();const root=document.getElementById('rmGlobalSearch');root.classList.add('open');root.setAttribute('aria-hidden','false');document.body.classList.add('global-search-open');searchOpen=true;renderSearch('');setTimeout(()=>document.getElementById('rmSearchInput')?.focus(),40)}
function closeSearch(){const root=document.getElementById('rmGlobalSearch');if(!root)return;root.classList.remove('open');root.setAttribute('aria-hidden','true');document.body.classList.remove('global-search-open');searchOpen=false}

function urlFor(section=activeSection(),player=null){const url=new URL(location.href);url.searchParams.set('section',section);if(player)url.searchParams.set('player',player);else url.searchParams.delete('player');return url}
function syncUrl(section){try{history.replaceState(null,'',urlFor(section).href)}catch{}}
async function shareCurrent(){
  const url=location.href,title=`RM 26/27 · ${document.getElementById('pageTitle')?.textContent||'Real Madrid'}`;
  try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(url);toastSafe('Enlace copiado');return}}catch(e){if(e?.name==='AbortError')return}toastSafe('No se pudo compartir el enlace')
}
function addPlayerLinkAction(name){
  const actions=document.querySelector('#playerHubContent .player-sheet-actions');if(!actions||actions.querySelector('[data-player-link]'))return;
  const btn=document.createElement('button');btn.className='btn';btn.dataset.playerLink='1';btn.textContent='Compartir enlace';btn.addEventListener('click',async()=>{const url=urlFor('plantilla',name).href;try{if(navigator.share)await navigator.share({title:`RM 26/27 · ${display(name)}`,url});else{await navigator.clipboard.writeText(url);toastSafe('Enlace del jugador copiado')}}catch(e){if(e?.name!=='AbortError')toastSafe('No se pudo compartir')}});actions.appendChild(btn)
}
function hookPlayerHub(attempt=0){
  if(playerHooked)return;
  try{
    if(typeof openPlayerHub==='function'&&typeof closePlayerHub==='function'){
      const openBase=openPlayerHub,closeBase=closePlayerHub;
      openPlayerHub=function(name){openBase(name);try{history.replaceState(null,'',urlFor('plantilla',name).href)}catch{};setTimeout(()=>addPlayerLinkAction(name),0)};
      closePlayerHub=function(){closeBase();syncUrl(activeSection())};playerHooked=true;return;
    }
  }catch{}
  if(attempt<50)setTimeout(()=>hookPlayerHub(attempt+1),150);
}
function openDeepLink(attempt=0){const url=new URL(location.href),player=url.searchParams.get('player');if(!player)return;if(playerList().some(p=>p.name===player)){if(activeSection()!=='plantilla')showSection('plantilla');openPlayerWhenReady(player);return}if(attempt<30)setTimeout(()=>openDeepLink(attempt+1),150)}
function hookNavigation(){
  const base=showSection;showSection=function(id){base(id);syncUrl(id);if(id==='mi-temporada')renderPersonal()};
  const saveBase=savePrediction;savePrediction=async function(...args){const out=await saveBase.apply(this,args);setTimeout(renderPersonal,30);return out};
}
function keyHandler(e){
  const tag=e.target?.tagName?.toLowerCase();if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!['input','textarea','select'].includes(tag)){e.preventDefault();openSearch();return}
  if(e.key==='Escape'&&searchOpen){e.preventDefault();closeSearch();return}
  if(e.key==='Enter'&&searchOpen&&document.activeElement?.id==='rmSearchInput'){document.querySelector('#rmSearchResults [data-search-first="1"]')?.click()}
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||typeof savePrediction!=='function'||!document.getElementById('inicio')){setTimeout(install,80);return}
  installed=true;ensureSection();ensureSearch();ensureSearchButton();hookNavigation();renderPersonal();hookPlayerHub();openDeepLink();
  document.addEventListener('keydown',keyHandler);window.addEventListener('storage',e=>{if(e.key?.startsWith('rm_prediction_'))renderPersonal()});document.addEventListener('rm-modules-ready',()=>{hookPlayerHub();renderPersonal()});
  [400,1200,2600].forEach(ms=>setTimeout(()=>{ensureSearchButton();renderPersonal()},ms));
  window.rmOpenSearch=openSearch;window.rmShareCurrent=shareCurrent;window.RMPersonal=Object.freeze({openSearch,closeSearch,render:renderPersonal,shareCurrent,records:()=>syncLedger()});
}
setTimeout(install,30);
})();
