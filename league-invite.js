(()=>{
const CODE=(()=>{try{return String(new URL(location.href).searchParams.get('league')||'').replace(/[^A-Za-z0-9]/g,'').slice(0,8).toUpperCase()}catch{return ''}})();
if(!CODE)return;
const ALIAS_KEY='rm_league_alias_v1';
let installed=false,league=null,joining=false;
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function api(){return window.RMCommunityApi||null}
function participantId(){try{return api()?.participantId?.()||''}catch{return ''}}
function savedAlias(){
  try{const stored=localStorage.getItem(ALIAS_KEY)||'';if(stored)return stored}catch{}
  try{const pred=typeof getSavedPrediction==='function'?getSavedPrediction():null;if(pred?.name)return String(pred.name).trim()}catch{}
  return String(document.getElementById('predictionName')?.value||'').trim();
}
function setAlias(v){const alias=String(v||'').trim().slice(0,24);if(alias)try{localStorage.setItem(ALIAS_KEY,alias)}catch{}return alias}
function ensureStyle(){
  if(document.querySelector('link[href*="league-invite.css"]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='league-invite.css?v=1';link.dataset.leagueInvite='1';document.head.appendChild(link);
}
function ensureRoot(){
  let root=document.getElementById('leagueInvite');if(root)return root;
  root=document.createElement('div');root.id='leagueInvite';root.className='linvite';root.setAttribute('aria-live','polite');document.body.appendChild(root);return root;
}
function close(){document.getElementById('leagueInvite')?.remove();document.body.classList.remove('linvite-open')}
function openCommunity(){try{if(typeof showSection==='function')showSection('comunidad')}catch{}}
function renderLoading(){
  const root=ensureRoot();document.body.classList.add('linvite-open');
  root.innerHTML='<div class="linvite-backdrop"></div><section class="linvite-card"><div class="linvite-mark">RM</div><div class="linvite-kicker">INVITACIÓN A LIGA</div><h2>Cargando liga…</h2><p>Estamos preparando el acceso directo.</p></section>';
}
function renderError(message){
  const root=ensureRoot();document.body.classList.add('linvite-open');
  root.innerHTML=`<div class="linvite-backdrop"></div><section class="linvite-card"><button type="button" class="linvite-close" aria-label="Cerrar">×</button><div class="linvite-mark">RM</div><div class="linvite-kicker">INVITACIÓN A LIGA</div><h2>No se pudo abrir la liga</h2><p>${esc(message||'Comprueba el enlace e inténtalo de nuevo.')}</p><button type="button" class="linvite-secondary" data-linvite-close>Seguir en la web</button></section>`;
  root.querySelectorAll('.linvite-close,[data-linvite-close]').forEach(b=>b.addEventListener('click',close));
}
function renderJoin(){
  const root=ensureRoot(),alias=savedAlias(),members=Number(league?.memberCount)||0;document.body.classList.add('linvite-open');
  root.innerHTML=`<div class="linvite-backdrop"></div><section class="linvite-card"><button type="button" class="linvite-close" aria-label="Cerrar">×</button><div class="linvite-mark">RM</div><div class="linvite-kicker">TE HAN INVITADO</div><h2>${esc(league?.name||'Liga privada RM 26/27')}</h2><div class="linvite-meta"><span>Código <b>${esc(CODE)}</b></span><span>${members} miembro${members===1?'':'s'}</span></div><p>Entra directamente en la liga para competir por aciertos con el resto.</p><label>Tu apodo<input id="linviteAlias" maxlength="24" autocomplete="nickname" value="${esc(alias)}" placeholder="Ej.: Pedro"></label><button type="button" class="linvite-primary" id="linviteJoin">Unirme a esta liga</button><button type="button" class="linvite-secondary" data-linvite-close>Ahora no</button><small class="linvite-note">No necesitas buscar el código ni bajar por la sección Comunidad.</small></section>`;
  root.querySelectorAll('.linvite-close,[data-linvite-close]').forEach(b=>b.addEventListener('click',close));
  root.querySelector('#linviteJoin')?.addEventListener('click',join);
  root.querySelector('#linviteAlias')?.addEventListener('keydown',e=>{if(e.key==='Enter')join()});
  setTimeout(()=>root.querySelector('#linviteAlias')?.focus(),80);
}
async function post(body){
  const response=await fetch(api().url(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.error||`Error ${response.status}`);return result;
}
async function openLeague(){
  openCommunity();let tries=0;
  const go=()=>{
    if(window.RMCommunityLeague?.loadLeague){
      const tab=document.querySelector('#communityLeague [data-cgl-tab="private"]');tab?.click();
      window.RMCommunityLeague.loadLeague(CODE,true);
      setTimeout(()=>document.getElementById('communityLeague')?.scrollIntoView({behavior:'smooth',block:'start'}),100);
      return;
    }
    if(++tries<40)setTimeout(go,100);
  };
  go();
}
async function join(){
  if(joining)return;const alias=setAlias(document.getElementById('linviteAlias')?.value);
  if(alias.length<2){try{toast('Pon un apodo de al menos 2 caracteres')}catch{}document.getElementById('linviteAlias')?.focus();return}
  const btn=document.getElementById('linviteJoin');joining=true;if(btn){btn.disabled=true;btn.textContent='Uniéndote…'}
  try{
    const result=await post({action:'joinLeague',participantId:participantId(),alias,code:CODE});
    try{await api()?.refresh?.()}catch{}
    close();try{toast(`Ya estás en ${result?.league?.name||league?.name||'la liga'}`)}catch{}
    await openLeague();
  }catch(error){try{toast(error.message||'No se pudo entrar en la liga')}catch{}if(btn){btn.disabled=false;btn.textContent='Unirme a esta liga'}}
  finally{joining=false}
}
async function load(){
  ensureStyle();renderLoading();openCommunity();
  try{
    const response=await fetch(api().url({league:CODE,participantId:participantId()}),{headers:{accept:'application/json'}}),result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||`Error ${response.status}`);league=result.league;
    if(!league)throw new Error('La liga de este enlace no existe.');
    if(league.amMember){close();await openLeague();return}
    renderJoin();
  }catch(error){renderError(error.message||'No se pudo cargar la invitación')}
}
function install(){
  if(installed)return;if(!api()?.url||!participantId()){setTimeout(install,100);return}
  installed=true;load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
