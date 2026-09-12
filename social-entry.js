(()=>{
const VOTE_KEY='rm_shared_entry_votes_v1';
const SEEN_KEY='rm_shared_entry_seen_v1';
let installed=false,attempts=0,currentSignature='';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function params(){return new URL(location.href).searchParams}
function routeState(){
  const q=params(),requested=q.get('section'),player=q.get('player'),a=q.get('a'),b=q.get('b'),anchor=q.get('anchor'),pick=q.get('pick');
  if(!requested&&!player&&!a&&!b&&!anchor)return null;
  const section=requested||(player?'plantilla':a&&b?'comparador':'inicio');
  return {section,player,a,b,anchor,pick:matchOption(pick,a,b)};
}
function signature(s){return s?[s.section,s.player,s.a,s.b,s.anchor,s.pick].map(x=>x||'').join('|'):''}
function readSeen(){try{const rows=JSON.parse(sessionStorage.getItem(SEEN_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
function markSeen(sig){if(!sig)return;try{const rows=[sig,...readSeen().filter(x=>x!==sig)].slice(0,20);sessionStorage.setItem(SEEN_KEY,JSON.stringify(rows))}catch{}}
function wasSeen(sig){return readSeen().includes(sig)}
function readVotes(){try{const value=JSON.parse(localStorage.getItem(VOTE_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch{return {}}}
function pairKey(a,b){return [canonical(a),canonical(b)].sort((x,y)=>String(x).localeCompare(String(y),'es')).join('|')}
function matchOption(value,a,b){if(!value||!a||!b)return null;const c=canonical(value);if(c===canonical(a))return a;if(c===canonical(b))return b;return null}
function localVote(a,b){if(!a||!b)return null;const row=readVotes()[pairKey(a,b)];return matchOption(row?.pick,a,b)}
function saveVote(a,b,pick){
  const matched=matchOption(pick,a,b);if(!matched)return false;
  try{const all=readVotes();all[pairKey(a,b)]={pick:matched,at:Date.now()};localStorage.setItem(VOTE_KEY,JSON.stringify(all))}catch{}
  document.dispatchEvent(new CustomEvent('rm-shared-entry-voted',{detail:{a,b,pick:matched}}));return true;
}
function sectionLabel(id){return safe(()=>sections.find(s=>s[0]===id)?.[2],id)||id||'RM 26/27'}
function playerPeer(name){return safe(()=>window.RMPlayerExperience?.context?.(name)?.peer,null)}
function isFavorite(name){return Boolean(safe(()=>window.RMPlayerExperience?.isFavorite?.(name),false))}
function toggleFavorite(name){const result=safe(()=>window.RMPlayerExperience?.toggle?.(name),null);setTimeout(()=>render(true),20);return result}
function senderLine(s,vote){
  if(!s.pick)return '';
  if(!vote)return `Quien te lo envió eligió a <b>${esc(display(s.pick))}</b>. ¿Coincides?`;
  return canonical(vote)===canonical(s.pick)?`Coincides: los dos elegís a <b>${esc(display(vote))}</b>.`:`No coincidís: te quedas con <b>${esc(display(vote))}</b> frente a <b>${esc(display(s.pick))}</b>.`;
}
function duelBody(s){
  const vote=localVote(s.a,s.b),a=display(s.a),b=display(s.b),sender=senderLine(s,vote);
  return `<div class="se-kicker">TE HAN COMPARTIDO UN DUELO</div><h2>${esc(a)} <span>vs</span> ${esc(b)}</h2><p>${sender||'Elige tú primero y después mira qué dicen los datos.'}</p><div class="se-vote-label">¿CON QUIÉN TE QUEDAS?</div><div class="se-vote-grid"><button type="button" class="${vote&&canonical(vote)===canonical(s.a)?'selected':''}" data-se-vote="${esc(s.a)}"><span>${esc(a)}</span><small>${vote&&canonical(vote)===canonical(s.a)?'Tu elección':'Elegir'}</small></button><button type="button" class="${vote&&canonical(vote)===canonical(s.b)?'selected':''}" data-se-vote="${esc(s.b)}"><span>${esc(b)}</span><small>${vote&&canonical(vote)===canonical(s.b)?'Tu elección':'Elegir'}</small></button></div><small class="se-privacy">Tu elección es local: no altera los porcentajes de la comunidad.</small><div class="se-actions"><button type="button" class="btn primary" data-se-open="compare">Ver comparativa PRO</button>${vote?'<button type="button" class="btn" data-se-share-vote>Compartir mi elección</button>':''}</div>`;
}
function playerBody(s){
  const peer=playerPeer(s.player),favorite=isFavorite(s.player),name=display(s.player);
  return `<div class="se-kicker">TE HAN COMPARTIDO UN JUGADOR</div><h2>${esc(name)}</h2><p>Abre su ficha PRO para ver forma, Power RM, evolución, muestra y contexto de temporada.</p><div class="se-actions"><button type="button" class="btn primary" data-se-open="player">Ver ficha</button><button type="button" class="btn ${favorite?'se-following':''}" data-se-favorite>${favorite?'★ Siguiendo':`☆ Seguir a ${esc(name)}`}</button>${peer?`<button type="button" class="btn" data-se-peer="${esc(peer)}">Comparar con ${esc(display(peer))}</button>`:''}</div><small class="se-privacy">Favoritos y actividad se guardan únicamente en este dispositivo.</small>`;
}
function genericBody(s){
  const review=s.anchor==='officialXiReview'||s.anchor==='officialXiReviewMatchday',label=review?'Revisión del XI oficial':sectionLabel(s.section);
  return `<div class="se-kicker">TE HAN COMPARTIDO ESTA VISTA</div><h2>${esc(label)}</h2><p>${review?'Comprueba quién acertó más y qué decisiones anticiparon el XI real.':'Has llegado directamente a una parte concreta de RM 26/27.'}</p><div class="se-actions"><button type="button" class="btn primary" data-se-open="generic">${review?'Ver revisión':'Abrir contenido'}</button></div>`;
}
function ensure(){
  let root=document.getElementById('sharedEntry');if(root)return root;
  root=document.createElement('div');root.id='sharedEntry';root.className='shared-entry-layer';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Contenido compartido');document.body.appendChild(root);return root;
}
function close(mark=true){const root=document.getElementById('sharedEntry');if(mark)markSeen(currentSignature);if(root){root.classList.remove('open');setTimeout(()=>{if(!root.classList.contains('open'))root.remove()},180)}document.body.classList.remove('shared-entry-open')}
function openTarget(s){
  close();
  if(s.a&&s.b){safe(()=>showSection('comparador'));setTimeout(()=>safe(()=>window.RMComparePro?.setDuel?.(s.a,s.b,false)),60);return}
  if(s.player){safe(()=>showSection('plantilla'));setTimeout(()=>{if(window.RMPlayerExperience?.open)window.RMPlayerExperience.open(s.player);else if(typeof openPlayerHub==='function')openPlayerHub(s.player)},60);return}
  safe(()=>showSection(s.section));if(s.anchor)setTimeout(()=>document.getElementById(s.anchor)?.scrollIntoView?.({behavior:'smooth',block:'start'}),100);
}
async function shareVote(s,pick){
  if(!s.a||!s.b||!pick)return false;
  const link=safe(()=>window.RMDeepLinks?.compareUrl?.(s.a,s.b,pick),null)||(()=>{const u=new URL(location.href);u.searchParams.set('section','comparador');u.searchParams.set('a',s.a);u.searchParams.set('b',s.b);u.searchParams.set('pick',pick);return u.href})();
  const title=`${display(s.a)} vs ${display(s.b)} · RM 26/27`,text=`Yo me quedo con ${display(pick)}. ¿Tú con quién?`;
  try{if(navigator.share){await navigator.share({title,text,url:link});return true}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link);safe(()=>toast('Enlace con tu elección copiado'));return true}}catch(e){if(e?.name==='AbortError')return false}
  safe(()=>toast('No se pudo compartir tu elección'));return false;
}
function bind(root,s){
  root.querySelector('[data-se-close]')?.addEventListener('click',()=>close());root.querySelector('.shared-entry-backdrop')?.addEventListener('click',()=>close());
  root.querySelectorAll('[data-se-vote]').forEach(btn=>btn.addEventListener('click',()=>{saveVote(s.a,s.b,btn.dataset.seVote);render(true)}));
  root.querySelector('[data-se-share-vote]')?.addEventListener('click',()=>shareVote(s,localVote(s.a,s.b)));
  root.querySelector('[data-se-open]')?.addEventListener('click',()=>openTarget(s));
  root.querySelector('[data-se-favorite]')?.addEventListener('click',()=>toggleFavorite(s.player));
  root.querySelector('[data-se-peer]')?.addEventListener('click',()=>{const peer=root.querySelector('[data-se-peer]')?.dataset.sePeer;if(!peer)return;close();safe(()=>showSection('comparador'));setTimeout(()=>safe(()=>window.RMComparePro?.setDuel?.(s.player,peer,false)),80)});
}
function render(force=false){
  const s=routeState();if(!s){close(false);return false}const sig=signature(s);if(!force&&wasSeen(sig))return false;currentSignature=sig;
  const root=ensure(),body=s.a&&s.b?duelBody(s):s.player?playerBody(s):genericBody(s);
  root.innerHTML=`<div class="shared-entry-backdrop"></div><section class="shared-entry-sheet"><button type="button" class="se-close" data-se-close aria-label="Cerrar">×</button><div class="se-brand"><b>RM 26/27</b><span>Proyecto independiente · sin registro</span></div>${body}<div class="se-foot">Responde primero, mira los datos después.</div></section>`;
  bind(root,s);requestAnimationFrame(()=>root.classList.add('open'));document.body.classList.add('shared-entry-open');return true;
}
function state(){const s=routeState();return s?{...s,vote:s.a&&s.b?localVote(s.a,s.b):null,signature:signature(s)}:null}
function install(){
  if(installed)return;const initial=routeState();if(!window.RMDeepLinks||typeof showSection!=='function'||(initial?.player&&!window.RMPlayerExperience&&attempts<60)){if(++attempts<100)setTimeout(install,80);return}
  installed=true;render(false);document.addEventListener('rm-deep-link-routed',()=>setTimeout(()=>render(false),40));window.addEventListener('popstate',()=>setTimeout(()=>render(false),50));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('sharedEntry'))close()});
  window.RMSharedEntry=Object.freeze({render,state,close,shareVote});
  document.dispatchEvent(new CustomEvent('rm-shared-entry-ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
