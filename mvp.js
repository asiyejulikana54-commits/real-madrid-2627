const mvpSection=['mvp','🏆','MVP','MVP de la comunidad','Vota al mejor de cada partido y sigue el ranking de MVP de la temporada.'];
const mvpInsertAt=Math.max(0,sections.findIndex(s=>s[0]==='partidos')+1);
if(!sections.some(s=>s[0]==='mvp'))sections.splice(mvpInsertAt,0,mvpSection);

function mvpEsc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function mvpDisplay(name){return typeof displayName==='function'?displayName(name):name}
function mvpPlayerOptions(selected=''){
  return '<option value="">Elige jugador…</option>'+players.map(p=>`<option value="${mvpEsc(p.name)}" ${p.name===selected?'selected':''}>${mvpEsc(p.short||p.name)} · ${p.pos}</option>`).join('');
}

function ensureMvpSection(){
  if(document.getElementById('mvp'))return;
  const section=document.createElement('section');section.className='section';section.id='mvp';
  const matchesSection=document.getElementById('partidos');
  if(matchesSection)matchesSection.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';
  document.getElementById('navDesktop').innerHTML=navHtml(false);
  document.getElementById('navMobile').innerHTML=navHtml(true);
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}

let mvpCache=null;
function mvpMatchCard(match){
  const top=(match.ranking||[]).slice(0,3);
  return `<article class="card mvp-match-card" id="mvp_${match.id}">
    <div class="eyebrow">${mvpEsc(match.comp)}</div><h3>${mvpEsc(match.label)}</h3>
    <div class="muted">${match.totalVotes} voto${match.totalVotes===1?'':'s'} comunitario${match.totalVotes===1?'':'s'}</div>
    <div class="mvp-vote-box"><select class="select" id="mvpSelect_${match.id}">${mvpPlayerOptions(match.selected||'')}</select><button class="btn primary" onclick="voteMvp('${match.id}')">${match.selected?'Cambiar voto':'Votar MVP'}</button></div>
    ${match.selected?`<div class="mvp-selected">Tu voto actual: <b>${mvpEsc(mvpDisplay(match.selected))}</b></div>`:''}
    <div class="mvp-ranking">${top.length?top.map((row,i)=>`<div class="mvp-rank-row"><div class="mvp-rank-head"><b>${i+1}. ${mvpEsc(mvpDisplay(row.player))}</b><span>${row.percentage}% · ${row.count}</span></div><div class="mvp-track"><i style="width:${row.percentage}%"></i></div></div>`).join(''):'<div class="mvp-empty">Todavía no hay votos. Puedes inaugurar el MVP de este partido.</div>'}</div>
  </article>`;
}
function renderMvp(data){
  mvpCache=data;const section=document.getElementById('mvp');if(!section)return;
  const season=data.season||[],leader=season[0]||null,total=data.totalVotes||0;
  section.innerHTML=`
    <div class="section-head"><div><h2>MVP de la comunidad</h2><p>Un voto por dispositivo en cada partido. Puedes cambiarlo cuando quieras.</p></div><button class="btn" onclick="loadMvp(true)">Actualizar</button></div>
    <div class="card mvp-hero"><div><div class="eyebrow">TEMPORADA 2026/27</div><h2>¿Quién está siendo el jugador de la gente?</h2><p class="muted">Vota retrospectivamente en los partidos ya analizados. El ranking separa votos totales y jornadas ganadas como MVP.</p></div><div class="mvp-hero-stat"><div><span>Votos emitidos</span><b>${total}</b></div><div><span>Líder temporada</span><b>${leader?mvpEsc(mvpDisplay(leader.player)):'—'}</b></div></div></div>
    <div class="section-head"><div><h2>Vota partido a partido</h2><p>Elige el futbolista que para ti fue el mejor de cada encuentro.</p></div></div>
    <div class="mvp-match-grid">${(data.matches||[]).map(mvpMatchCard).join('')}</div>
    <div class="card" style="margin-top:16px"><div class="section-head" style="margin-top:0"><div><h2>Ranking MVP de la temporada</h2><p>Las victorias cuentan también los empates en el primer puesto de una jornada.</p></div></div>${season.length?`<div class="mvp-season"><div class="mvp-season-head"><span>#</span><span>Jugador</span><span>Victorias</span><span>Votos</span></div>${season.map((row,i)=>`<div class="mvp-season-row"><b>${i+1}</b><span>${mvpEsc(mvpDisplay(row.player))}</span><strong>${row.wins}</strong><span>${row.votes}</span></div>`).join('')}</div>`:'<div class="mvp-empty">El ranking aparecerá en cuanto llegue el primer voto.</div>'}</div>`;
  renderMvpHome(data);decorateMatchMvpButtons();
}
async function loadMvp(force=false){
  if(mvpCache&&!force){renderMvp(mvpCache);return}
  try{
    const response=await fetch(`/.netlify/functions/mvp?participantId=${encodeURIComponent(getParticipantId())}`,{headers:{accept:'application/json'}});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'Error');renderMvp(data);
  }catch(error){
    const section=document.getElementById('mvp');if(section)section.innerHTML='<div class="card"><h2>MVP de la comunidad</h2><div class="result-pending"><b>No se pudo cargar la votación</b><span>Prueba de nuevo en unos segundos.</span></div><button class="btn" style="margin-top:12px" onclick="loadMvp(true)">Reintentar</button></div>';
  }
}
async function voteMvp(matchId){
  const select=document.getElementById(`mvpSelect_${matchId}`),player=select?.value;
  if(!player){toast('Elige un jugador antes de votar');return}
  try{
    const response=await fetch('/.netlify/functions/mvp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:getParticipantId(),matchId,player})});
    const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);
    toast(result.updated?'Voto MVP actualizado':'Voto MVP registrado');mvpCache=null;await loadMvp(true);
    document.getElementById(`mvp_${matchId}`)?.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(error){toast(error.message||'No se pudo registrar el voto')}
}
function openMvpMatch(matchId){showSection('mvp');loadMvp().then(()=>setTimeout(()=>document.getElementById(`mvp_${matchId}`)?.scrollIntoView({behavior:'smooth',block:'center'}),100))}

function ensureMvpHome(){
  let block=document.getElementById('mvpHome');if(block)return block;
  const inicio=document.getElementById('inicio');if(!inicio)return null;
  block=document.createElement('div');block.id='mvpHome';block.className='card mvp-home';inicio.appendChild(block);return block;
}
function renderMvpHome(data){
  const block=ensureMvpHome();if(!block)return;const leader=(data.season||[])[0],total=data.totalVotes||0;
  block.innerHTML=`<div class="mvp-home-line"><div class="mvp-home-trophy">🏆</div><div><div class="eyebrow">MVP COMUNIDAD</div><h3>${leader?`${mvpEsc(mvpDisplay(leader.player))} lidera`:'Abre la votación MVP'}</h3><p>${leader?`${leader.wins} victoria${leader.wins===1?'':'s'} de jornada · ${leader.votes} voto${leader.votes===1?'':'s'} total${leader.votes===1?'':'es'}`:`Ya puedes votar los ${data.matches?.length||0} partidos analizados.`}</p></div><button class="btn" onclick="showSection('mvp')">${total?'Ver ranking':'Votar'}</button></div>`;
}
function decorateMatchMvpButtons(){
  const cards=[...document.querySelectorAll('#matchesList .match-card')];
  const ids=(mvpCache?.matches||[]).map(m=>m.id);
  cards.forEach((card,i)=>{
    if(card.querySelector('.match-mvp-btn')||!ids[i])return;
    const target=card.querySelector('.status')||card;
    const button=document.createElement('button');button.className='btn match-mvp-btn';button.textContent='Votar MVP';button.onclick=()=>openMvpMatch(ids[i]);target.appendChild(button);
  });
}

ensureMvpSection();decorateMatchMvpButtons();
const mvpBaseShowSection=showSection;
showSection=function(id){mvpBaseShowSection(id);if(id==='mvp')loadMvp()};
const matchesList=document.getElementById('matchesList');if(matchesList)new MutationObserver(()=>decorateMatchMvpButtons()).observe(matchesList,{childList:true,subtree:true});
loadMvp();
