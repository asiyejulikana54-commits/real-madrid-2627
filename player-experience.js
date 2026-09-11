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
function series(name){return safe(()=>seasonData()?.ratingSeries?.(name),[])||[]}
function recent(name){return safe(()=>seasonData()?.recentRating?.(name,3),null)}
function delta(name){return safe(()=>seasonData()?.ratingDelta?.(name),null)}
function format(v){return Number.isFinite(v)?Number(v).toFixed(2):'—'}
function extremes(rows){
  if(!rows.length)return {best:null,worst:null};let best=rows[0],worst=rows[0];for(const row of rows){if(row.entry.value>best.entry.value)best=row;if(row.entry.value<worst.entry.value)worst=row}return {best,worst};
}
function profileShareUrl(name){const url=new URL(location.href);url.searchParams.set('section','plantilla');url.searchParams.set('player',name);return url.href}
async function shareProfile(name){
  const url=profileShareUrl(name),title=`RM 26/27 · ${display(name)}`;
  try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(url);safe(()=>toast('Enlace del jugador copiado'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el perfil'));
}
function addProfileActions(name){
  const tags=document.querySelector('#playerHubContent .player-sheet-tags');if(!tags)return;
  let top=document.querySelector('#playerHubContent .px-modal-top-actions');if(!top){top=document.createElement('div');top.className='px-modal-top-actions';tags.insertAdjacentElement('afterend',top)}
  const active=isFavorite(name);top.innerHTML=`<button type="button" class="btn px-favorite-main${active?' active':''}" data-px-favorite>${active?'★ En favoritos':'☆ Añadir a favoritos'}</button><button type="button" class="btn px-profile-link" data-player-link>Compartir perfil</button>`;
  top.querySelector('[data-px-favorite]')?.addEventListener('click',()=>toggleFavorite(name));top.querySelector('[data-player-link]')?.addEventListener('click',()=>shareProfile(name));
}
function addSeasonSummary(name){
  const rows=series(name),form=recent(name),trend=delta(name),{best,worst}=extremes(rows);const sample=document.querySelector('#playerHubContent .sample-card');if(!sample)return;
  document.querySelector('#playerHubContent .px-season-summary')?.remove();
  const block=document.createElement('section');block.className='px-season-summary';
  const bestValue=best?.entry?.value;block.innerHTML=`<div class="px-season-title"><div><span>FORMA PARTIDO A PARTIDO</span><b>${rows.length?`${rows.length} partido${rows.length===1?'':'s'} con valoración`:'Sin valoraciones todavía'}</b></div><em>${form?format(form.value):'—'}<small>media últimos ${form?.n||0}</small></em></div><div class="px-match-form">${rows.length?rows.map(row=>`<div class="${row.entry.value===bestValue?'best':''}"><span>${esc(row.match.short||row.match.label)}</span><b>${format(row.entry.value)}</b></div>`).join(''):'<div><span>—</span><b>—</b></div>'}</div>${best?`<div class="px-extremes"><div class="px-extreme"><span>MEJOR PARTIDO</span><b>${esc(best.match.label)} <strong>${format(best.entry.value)}</strong></b></div>${rows.length>1?`<div class="px-extreme"><span>NOTA MÁS BAJA</span><b>${esc(worst.match.label)} <strong>${format(worst.entry.value)}</strong></b></div>`:''}</div>`:''}<div class="px-recent-note">${trend?`${trend.delta>=0?'▲':'▼'} ${Math.abs(trend.delta).toFixed(2)} respecto a ${esc(trend.previousMatch.label)} · última nota: ${format(trend.current)}.`:'La tendencia aparecerá cuando haya al menos dos partidos con valoración.'}</div>`;
  sample.insertAdjacentElement('afterend',block);
}
function addEvolutionAction(){
  if(!document.getElementById('evolucion'))return;const actions=document.querySelector('#playerHubContent .player-sheet-actions');if(!actions||actions.querySelector('[data-px-evolution]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.dataset.pxEvolution='1';btn.textContent='Ver evolución';btn.addEventListener('click',()=>{safe(()=>closePlayerHub());safe(()=>showSection('evolucion'))});actions.appendChild(btn);
}
function enhanceModal(name){const p=playerByName(name);if(!p||!document.getElementById('playerHubContent'))return;lastOpened=p.name;addProfileActions(p.name);addSeasonSummary(p.name);addEvolutionAction()}
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
}
function install(){
  if(installed)return;if(typeof players==='undefined'||typeof openPlayerHub!=='function'){setTimeout(install,100);return}installed=true;document.body.classList.add('player-experience-ready');hookPlayerHub();renderShelf();decorateCards();bindRefreshes();[250,900,1800].forEach(ms=>setTimeout(()=>{hookPlayerHub();renderShelf();decorateCards()},ms));
  window.RMPlayerExperience=Object.freeze({favorites,recents,isFavorite,toggle:toggleFavorite,open:openProfile,refresh:()=>{renderShelf();decorateCards()}});
}
setTimeout(install,40);
})();
