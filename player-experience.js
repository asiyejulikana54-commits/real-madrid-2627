(()=>{
const FAVORITES_KEY='rm_player_favorites_v1';
const RECENTS_KEY='rm_player_recents_v1';
const MAX_RECENTS=5;
let installed=false,lastOpened=null;

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function playerList(){return safe(()=>players,[])||[]}
function playerByName(name){return playerList().find(p=>p.name===name||p.short===name)||null}
function display(name){const p=playerByName(name);return p?(p.short||p.name):name}
function readArray(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
function writeArray(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function favorites(){return readArray(FAVORITES_KEY).filter(name=>playerByName(name))}
function recents(){return readArray(RECENTS_KEY).filter(name=>playerByName(name)).slice(0,MAX_RECENTS)}
function isFavorite(name){return favorites().includes(playerByName(name)?.name||name)}
function remember(name){
  const p=playerByName(name);if(!p)return;
  const next=[p.name,...recents().filter(x=>x!==p.name)].slice(0,MAX_RECENTS);writeArray(RECENTS_KEY,next);lastOpened=p.name;renderShelf();
}
function toggleFavorite(name){
  const p=playerByName(name);if(!p)return false;const list=favorites(),active=list.includes(p.name),next=active?list.filter(x=>x!==p.name):[p.name,...list];writeArray(FAVORITES_KEY,next);decorateCards();renderShelf();if(lastOpened===p.name)enhanceModal(p.name);
  document.dispatchEvent(new CustomEvent('rm-player-favorites-updated',{detail:{favorites:next}}));
  safe(()=>toast(active?`${display(p.name)} quitado de favoritos`:`${display(p.name)} añadido a favoritos`));return !active;
}
function ensureShelf(){
  const section=document.getElementById('plantilla'),grid=document.getElementById('playersGrid');if(!section||!grid)return null;
  let shelf=document.getElementById('playerPersonalShelf');if(shelf)return shelf;
  shelf=document.createElement('div');shelf.id='playerPersonalShelf';shelf.className='player-personal-shelf';grid.insertAdjacentElement('beforebegin',shelf);return shelf;
}
function chips(names,favorite=false){return names.map(name=>`<button type="button" class="px-chip${favorite?' favorite':''}" data-px-open="${esc(name)}">${esc(display(name))}</button>`).join('')}
function renderShelf(){
  const shelf=ensureShelf();if(!shelf)return;const fav=favorites(),recent=recents();
  if(!fav.length&&!recent.length){shelf.hidden=true;shelf.innerHTML='';return}
  shelf.hidden=false;shelf.innerHTML=`${fav.length?`<div class="px-shelf-row"><div class="px-shelf-head"><span>TUS FAVORITOS</span><small>${fav.length} jugador${fav.length===1?'':'es'}</small></div><div class="px-chips">${chips(fav,true)}</div></div>`:''}${recent.length?`<div class="px-shelf-row"><div class="px-shelf-head"><span>VISTOS RECIENTEMENTE</span><small>acceso rápido</small></div><div class="px-chips">${chips(recent)}</div></div>`:''}`;
  shelf.querySelectorAll('[data-px-open]').forEach(btn=>btn.addEventListener('click',()=>openProfile(btn.dataset.pxOpen)));
}
function decorateCards(){
  document.querySelectorAll('#playersGrid .player').forEach(card=>{
    const name=card.querySelector('h3')?.textContent?.trim(),p=playerByName(name);if(!p)return;
    let btn=card.querySelector('.px-favorite-card');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='px-favorite-card';btn.setAttribute('aria-label',`Marcar ${display(p.name)} como favorito`);btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFavorite(p.name)});card.appendChild(btn)}
    const active=isFavorite(p.name);btn.classList.toggle('active',active);btn.textContent=active?'★':'☆';btn.setAttribute('aria-pressed',String(active));btn.title=active?'Quitar de favoritos':'Añadir a favoritos';
  });
}
function seasonData(){return window.RMSeasonData||null}
function schedule(){return safe(()=>seasonData()?.matches,[])||[]}
function series(name){return safe(()=>seasonData()?.ratingSeries?.(name),[])||[]}
function recent(name){return safe(()=>seasonData()?.recentRating?.(name,3),null)}
function official(matchId,name){return safe(()=>seasonData()?.officialRatingEntry?.(matchId,name),null)}
function minute(matchId,name){return safe(()=>seasonData()?.minuteEntry?.(matchId,name)?.value,null)}
function aggregate(name){return safe(()=>seasonData()?.aggregatePlayer?.(name),null)}
function format(v){return Number.isFinite(v)?Number(v).toFixed(2):'—'}
function powerValue(name,agg){
  const canonical=safe(()=>seasonData()?.canonical?.(name),name)||name;
  const officialPower=safe(()=>window.RMPowerMigration?.official?.find(row=>(safe(()=>seasonData()?.canonical?.(row.name),row.name)||row.name)===canonical)?.power,null);
  if(Number.isFinite(officialPower))return officialPower;
  return agg&&Number.isFinite(agg.rating)?agg.rating*(.75+.25*Math.min(agg.totalMinutes||0,450)/450):null;
}
function allContextRows(){
  return playerList().map(p=>{const agg=aggregate(p.name);if(!agg)return null;return {p,agg,power:powerValue(p.name,agg),rating:agg.rating,efficiency:Number.isFinite(agg.minPerPoint)?agg.minPerPoint:null,minutes:agg.totalMinutes||0}}).filter(Boolean);
}
function rankOf(name,key,{lower=false,pos=null}={}){
  const p=playerByName(name);if(!p)return null;const rows=allContextRows().filter(row=>(!pos||row.p.pos===pos)&&Number.isFinite(row[key])).sort((a,b)=>lower?a[key]-b[key]:b[key]-a[key]);const index=rows.findIndex(row=>row.p.name===p.name);return index>=0?{position:index+1,total:rows.length}:null;
}
function stability(name){
  const values=series(name).map(row=>row.entry?.value).filter(Number.isFinite);if(values.length<2)return {value:null,label:'Sin muestra'};
  const mean=values.reduce((s,v)=>s+v,0)/values.length,variance=values.reduce((s,v)=>s+(v-mean)**2,0)/values.length,sd=Math.sqrt(variance);
  return {value:sd,label:sd<=.25?'Muy estable':sd<=.45?'Estable':sd<=.70?'Variable':'Volátil'};
}
function extremes(rows){
  if(!rows.length)return {best:null,worst:null};let best=rows[0],worst=rows[0];for(const row of rows){if(row.entry.value>best.entry.value)best=row;if(row.entry.value<worst.entry.value)worst=row}return {best,worst};
}
function strictProgress(name){
  const matches=schedule();if(matches.length<2)return null;const first=matches[0],last=matches.at(-1),a=official(first.id,name),b=official(last.id,name);if(!Number.isFinite(a?.value)||!Number.isFinite(b?.value))return {first,last,value:null};return {first,last,from:a.value,to:b.value,value:b.value-a.value};
}
function scheduleRows(name){
  return schedule().map((match,index)=>{const entry=official(match.id,name),minutes=minute(match.id,name),value=Number.isFinite(entry?.value)?entry.value:null,status=value!==null?'rated':entry?.status==='unrated'?'sc':'missing';return {match,index,value,minutes:Number.isFinite(minutes)?minutes:null,status}});
}
function compatiblePeer(name){
  const p=playerByName(name);if(!p)return null;const ownPower=powerValue(p.name,aggregate(p.name));const candidates=allContextRows().filter(row=>row.p.name!==p.name&&row.p.pos===p.pos&&(p.eligible||[]).some(slot=>(row.p.eligible||[]).includes(slot))&&Number.isFinite(row.power));
  if(!candidates.length)return null;candidates.sort((a,b)=>{const da=Number.isFinite(ownPower)?Math.abs(a.power-ownPower):0,db=Number.isFinite(ownPower)?Math.abs(b.power-ownPower):0;return da-db||b.power-a.power});return candidates[0];
}
function profileShareUrl(name){const url=new URL(location.href);url.searchParams.set('section','plantilla');url.searchParams.set('player',name);return url.href}
async function shareProfile(name){
  const url=profileShareUrl(name),title=`RM 26/27 · ${display(name)}`;
  try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(url);safe(()=>toast('Enlace del jugador copiado'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el perfil'));
}
function addProfileActions(name){
  const tags=document.querySelector('#playerHubContent .player-sheet-tags');if(!tags)return;
  let top=document.querySelector('#playerHubContent .px-modal-top-actions');if(!top){top=document.createElement('div');top.className='px-modal-top-actions';tags.insertAdjacentElement('afterend',top)}
  const active=isFavorite(name);top.innerHTML=`<button type="button" class="btn px-favorite-main${active?' active':''}" data-px-favorite>${active?'★ En favoritos':'☆ Añadir a favoritos'}</button>`;
  top.querySelector('[data-px-favorite]')?.addEventListener('click',()=>toggleFavorite(name));
  const actions=document.querySelector('#playerHubContent .player-sheet-actions');if(actions&&!actions.querySelector('[data-player-link]')){const share=document.createElement('button');share.type='button';share.className='btn px-profile-link';share.dataset.playerLink='1';share.textContent='Compartir perfil';share.addEventListener('click',()=>shareProfile(name));actions.appendChild(share)}
}
function rankText(rank){return rank?`#${rank.position}/${rank.total}`:'—'}
function progressionText(progress){if(!progress)return '—';if(!Number.isFinite(progress.value))return '—';return `${progress.value>0?'+':''}${progress.value.toFixed(2)}`}
function addProContext(name){
  const p=playerByName(name),sample=document.querySelector('#playerHubContent .sample-card');if(!p||!sample)return;
  document.querySelector('#playerHubContent .px-pro-context')?.remove();
  const agg=aggregate(p.name),rows=scheduleRows(p.name),rated=rows.filter(row=>row.value!==null),{best,worst}=extremes(series(p.name)),progress=strictProgress(p.name),stable=stability(p.name),peer=compatiblePeer(p.name);
  const globalPower=rankOf(p.name,'power'),groupPower=rankOf(p.name,'power',{pos:p.pos}),groupRating=rankOf(p.name,'rating',{pos:p.pos}),groupEff=rankOf(p.name,'efficiency',{pos:p.pos,lower:true}),samplePct=Math.min(100,Math.round((agg?.totalMinutes||0)/450*100));
  const block=document.createElement('section');block.className='px-pro-context';
  block.innerHTML=`<div class="px-pro-head"><div><span>FICHA PRO · CONTEXTO DE TEMPORADA</span><h3>${esc(p.pos)} · ${rated.length}/${rows.length} jornadas con nota</h3><p>Los puestos por grupo comparan únicamente con jugadores de ${esc(p.pos)} que tienen dato en esa métrica. No son una probabilidad de titularidad.</p></div><div class="px-pro-sample"><b>${samplePct}%</b><small>muestra 450 min</small></div></div><div class="px-context-grid"><div><span>Power global</span><b>${rankText(globalPower)}</b></div><div><span>Power · ${esc(p.pos)}</span><b>${rankText(groupPower)}</b></div><div><span>Media · ${esc(p.pos)}</span><b>${rankText(groupRating)}</b></div><div><span>Eficiencia · ${esc(p.pos)}</span><b>${rankText(groupEff)}</b></div><div><span>Estabilidad</span><b>${esc(stable.label)}</b><small>${Number.isFinite(stable.value)?`σ ${stable.value.toFixed(2)}`:'menos de 2 notas'}</small></div><div><span>${progress?`J1→J${rows.length}`:'Progreso'}</span><b class="${progress?.value>0?'up':progress?.value<0?'down':''}">${progressionText(progress)}</b><small>${progress&&Number.isFinite(progress.value)?`${format(progress.from)} → ${format(progress.to)}`:'solo si hay nota en ambos extremos'}</small></div></div><div class="px-journey-head"><span>JORNADA A JORNADA · ESTRICTO</span><small>SC y ausencia nunca son 0</small></div><div class="px-journey">${rows.map(row=>`<div class="px-journey-cell ${row.status}"><span>J${row.index+1}</span><small>${esc(row.match.short||row.match.label||row.match.id)}</small><b>${row.value!==null?format(row.value):row.status==='sc'?'SC':'—'}</b><em>${row.minutes===null?'—':`${row.minutes}'`}</em></div>`).join('')}</div><div class="px-pro-bottom"><div class="px-pro-extremes"><div><span>MEJOR JORNADA</span><b>${best?`${esc(best.match.label)} · ${format(best.entry.value)}`:'—'}</b></div><div><span>NOTA MÁS BAJA</span><b>${worst?`${esc(worst.match.label)} · ${format(worst.entry.value)}`:'—'}</b></div></div>${peer?`<div class="px-peer"><div><span>REFERENCIA COMPARABLE</span><b>${esc(display(peer.p.name))}</b><small>${esc(peer.p.pos)} · ${format(peer.power)} Power · comparte ${(p.eligible||[]).filter(slot=>(peer.p.eligible||[]).includes(slot)).join(' / ')}</small></div><div><button type="button" class="btn" data-px-peer-compare>Comparar</button><button type="button" class="btn" data-px-peer-radar>Radar</button></div></div>`:''}</div><p class="px-pro-note">Progreso J1→última jornada es estricto: si falta nota oficial en cualquiera de los dos extremos se muestra —. La estabilidad usa desviación estándar poblacional de las notas disponibles y es descriptiva, no una jerarquía.</p>`;
  sample.insertAdjacentElement('afterend',block);
  block.querySelector('[data-px-peer-compare]')?.addEventListener('click',()=>openPeerCompare(p.name,peer.p.name));
  block.querySelector('[data-px-peer-radar]')?.addEventListener('click',()=>openPeerRadar(p.name,peer.p.name));
}
function addSeasonSummary(name){
  const rows=series(name),form=recent(name),{best}=extremes(rows);const anchor=document.querySelector('#playerHubContent .px-pro-context')||document.querySelector('#playerHubContent .sample-card');if(!anchor)return;
  document.querySelector('#playerHubContent .px-season-summary')?.remove();
  const block=document.createElement('section');block.className='px-season-summary';
  const bestValue=best?.entry?.value;block.innerHTML=`<div class="px-season-title"><div><span>FORMA PARTIDO A PARTIDO · DISPONIBLE</span><b>${rows.length?`${rows.length} partido${rows.length===1?'':'s'} con valoración`:'Sin valoraciones todavía'}</b></div><em>${form?format(form.value):'—'}<small>media últimas ${form?.n||0} notas</small></em></div><div class="px-match-form">${rows.length?rows.map(row=>`<div class="${row.entry.value===bestValue?'best':''}"><span>${esc(row.match.short||row.match.label)}</span><b>${format(row.entry.value)}</b></div>`).join(''):'<div><span>—</span><b>—</b></div>'}</div><div class="px-recent-note">Forma disponible usa hasta las 3 últimas notas oficiales publicadas. A diferencia del progreso estricto de arriba, puede saltar jornadas sin calificación y por eso se muestra como una lectura distinta.</div>`;
  anchor.insertAdjacentElement('afterend',block);
}
function addEvolutionAction(){
  if(!document.getElementById('evolucion'))return;const actions=document.querySelector('#playerHubContent .player-sheet-actions');if(!actions||actions.querySelector('[data-px-evolution]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.dataset.pxEvolution='1';btn.textContent='Ver evolución';btn.addEventListener('click',()=>{safe(()=>closePlayerHub());safe(()=>showSection('evolucion'))});actions.appendChild(btn);
}
function openPeerCompare(a,b){safe(()=>closePlayerHub());safe(()=>showSection('comparador'));setTimeout(()=>{if(window.RMComparePro?.setDuel)window.RMComparePro.setDuel(a,b);else{const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A)A.value=a;if(B)B.value=b;safe(()=>renderCompare())}},0)}
function openPeerRadar(a,b){safe(()=>closePlayerHub());safe(()=>showSection('radar'));setTimeout(()=>{if(window.RMDecisionRadar?.set)window.RMDecisionRadar.set(a,b);else if(typeof window.selectRadarPreset==='function')safe(()=>window.selectRadarPreset(a,b))},0)}
function enhanceModal(name){const p=playerByName(name);if(!p||!document.getElementById('playerHubContent'))return;lastOpened=p.name;addProfileActions(p.name);addProContext(p.name);addSeasonSummary(p.name);addEvolutionAction()}
function openProfile(name){if(typeof showSection==='function'&&!document.getElementById('plantilla')?.classList.contains('active'))showSection('plantilla');if(typeof openPlayerHub==='function')openPlayerHub(name)}
function hookPlayerHub(){
  if(typeof openPlayerHub!=='function'||openPlayerHub.__pxWrapped)return false;const base=openPlayerHub;
  const wrapped=function(name){const out=base(name);remember(name);setTimeout(()=>enhanceModal(name),0);return out};wrapped.__pxWrapped=true;wrapped.__pxBase=base;openPlayerHub=wrapped;return true;
}
function bindRefreshes(){
  const search=document.getElementById('playerSearch'),filter=document.getElementById('positionFilter');
  search?.addEventListener('input',()=>setTimeout(()=>{decorateCards();renderShelf()},0));filter?.addEventListener('change',()=>setTimeout(()=>{decorateCards();renderShelf()},0));
  document.addEventListener('rm-ranking-official-ready',()=>setTimeout(()=>{decorateCards();renderShelf();if(lastOpened)enhanceModal(lastOpened)},0));
  document.addEventListener('rm-season-data-ready',()=>setTimeout(()=>{if(lastOpened)enhanceModal(lastOpened)},0));
  document.addEventListener('rm-season-order-corrected',()=>setTimeout(()=>{if(lastOpened)enhanceModal(lastOpened)},0));
  document.addEventListener('rm-modules-ready',()=>setTimeout(()=>{if(lastOpened)enhanceModal(lastOpened)},0));
}
function install(){
  if(installed)return;if(typeof players==='undefined'||typeof openPlayerHub!=='function'){setTimeout(install,100);return}installed=true;document.body.classList.add('player-experience-ready');hookPlayerHub();renderShelf();decorateCards();bindRefreshes();[250,900,1800].forEach(ms=>setTimeout(()=>{hookPlayerHub();renderShelf();decorateCards()},ms));
  window.RMPlayerExperience=Object.freeze({favorites,recents,isFavorite,toggle:toggleFavorite,open:openProfile,refresh:()=>{renderShelf();decorateCards();if(lastOpened)enhanceModal(lastOpened)},context:name=>({player:playerByName(name),aggregate:aggregate(name),powerGlobal:rankOf(name,'power'),powerGroup:rankOf(name,'power',{pos:playerByName(name)?.pos}),stability:stability(name),progress:strictProgress(name),peer:compatiblePeer(name)?.p?.name||null})});
}
setTimeout(install,40);
})();