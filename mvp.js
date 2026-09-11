(()=>{
const MVP_KEY='rm_mvp_personal_v2';
const mvpSection=['mvp','🏆','MVP','MVP PRO','MVP por nota oficial, tu elección y evolución de la temporada.'];
let installed=false,communityCache=null,selectedMatchId=null;

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function season(){return window.RMSeasonData||null}
function playerList(){return safe(()=>typeof players==='undefined'?[]:players,[])||[]}
function backendAvailable(){return /^https?:$/.test(location.protocol)&&!location.hostname.endsWith('github.io')}
function canonical(name){return safe(()=>season()?.canonical?.(name),name)||name}
function fmt(v){return Number.isFinite(v)?Number(v).toFixed(2):'—'}
function readPicks(){try{const x=JSON.parse(localStorage.getItem(MVP_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function writePicks(x){try{localStorage.setItem(MVP_KEY,JSON.stringify(x))}catch{}}
function pickFor(matchId){return readPicks()[matchId]||''}

function ensureSection(){
  if(!safe(()=>sections.some(s=>s[0]==='mvp'),false)){
    const at=Math.max(0,safe(()=>sections.findIndex(s=>s[0]==='partidos')+1,1));safe(()=>sections.splice(at,0,mvpSection));
  }
  if(!document.getElementById('mvp')){
    const section=document.createElement('section');section.className='section';section.id='mvp';
    const matches=document.getElementById('partidos');if(matches)matches.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section);
  }
  const active=document.querySelector('.section.active')?.id||'inicio';
  safe(()=>{document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true)});
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}

function ratingRows(match){
  const data=season();if(!data||!match)return [];
  return playerList().map(p=>{
    const entry=safe(()=>data.officialRatingEntry?.(match.id,p.name),null);
    if(!Number.isFinite(entry?.value))return null;
    return {name:p.name,short:p.short||p.name,pos:p.pos||'',value:Number(entry.value),entry};
  }).filter(Boolean).sort((a,b)=>b.value-a.value||display(a.name).localeCompare(display(b.name),'es'));
}
function analyzedMatches(){
  const matches=season()?.matches||[];
  return matches.map(match=>({match,rows:ratingRows(match)})).filter(x=>x.rows.length);
}
function winners(rows){if(!rows.length)return [];const top=rows[0].value;return rows.filter(x=>Math.abs(x.value-top)<0.005)}
function isWinner(rows,name){const c=canonical(name);return winners(rows).some(x=>canonical(x.name)===c)}
function communityMatch(matchId){return (communityCache?.matches||[]).find(m=>m.id===matchId)||null}

function officialSeasonRanking(matches){
  const map=new Map();
  for(const {rows} of matches){
    rows.slice(0,3).forEach((row,i)=>{const key=canonical(row.name),cur=map.get(key)||{name:row.name,wins:0,podiums:0,ratings:[],best:0};cur.podiums++;if(i===0||isWinner(rows,row.name))cur.wins++;cur.ratings.push(row.value);cur.best=Math.max(cur.best,row.value);map.set(key,cur)});
  }
  return [...map.values()].map(x=>({...x,avg:x.ratings.reduce((a,b)=>a+b,0)/x.ratings.length})).sort((a,b)=>b.wins-a.wins||b.podiums-a.podiums||b.avg-a.avg);
}
function personalSummary(matches){
  const picks=readPicks();let total=0,agree=0;
  for(const {match,rows} of matches){const pick=picks[match.id];if(!pick)continue;total++;if(isWinner(rows,pick))agree++}
  return {total,agree,pct:total?Math.round(agree*100/total):null};
}
function latestSummary(matches){
  const latest=matches[matches.length-1];if(!latest)return null;const top=latest.rows[0],runner=latest.rows[1];return {latest,top,runner,gap:runner?top.value-runner.value:null};
}
function options(rows,selected){return '<option value="">Elige tu MVP…</option>'+rows.map(r=>`<option value="${esc(r.name)}" ${canonical(r.name)===canonical(selected)?'selected':''}>${esc(display(r.name))} · ${r.pos} · ${fmt(r.value)}</option>`).join('')}

function podRow(row,i,matchId){return `<button class="mvp-pro-podium-row" type="button" data-mvp-player="${esc(row.name)}"><i>#${i+1}</i><div><b>${esc(display(row.name))}</b><small>${esc(row.pos)} · nota oficial</small></div><strong>${fmt(row.value)}</strong></button>`}
function communityMini(matchId){
  if(!backendAvailable())return '<div class="mvp-pro-community-note"><b>Comunidad en pausa</b><span>GitHub Pages no hace llamadas a Netlify.</span></div>';
  const cm=communityMatch(matchId);if(!cm)return '<div class="mvp-pro-community-note"><b>Comunidad no cargada</b><span>Se consultará al abrir/actualizar MVP en la versión conectada.</span></div>';
  const top=(cm.ranking||[]).slice(0,3);return `<div class="mvp-pro-community-note"><b>${cm.totalVotes||0} votos comunitarios</b><span>${top.length?`Líder: ${esc(display(top[0].player))} · ${top[0].percentage}%`:'Aún sin votos'}</span></div>`;
}
function matchCard(item){
  const {match,rows}=item,pick=pickFor(match.id),top=rows.slice(0,3),win=winners(rows),agree=pick?isWinner(rows,pick):false;
  return `<article class="card mvp-pro-match" id="mvp_${esc(match.id)}"><div class="mvp-pro-match-head"><div><span>${esc(match.comp||'PARTIDO')}</span><h3>${esc(match.label||match.short||match.id)}</h3></div><div class="mvp-pro-winner"><small>MEJOR NOTA</small><b>${esc(win.map(x=>display(x.name)).join(' / '))}</b><strong>${fmt(rows[0].value)}</strong></div></div><div class="mvp-pro-podium">${top.map((r,i)=>podRow(r,i,match.id)).join('')}</div><div class="mvp-pro-pick ${pick?(agree?'agree':'different'):''}"><div><span>TU MVP</span><b>${pick?esc(display(pick)):'Todavía sin elegir'}</b><small>${pick?(agree?'Coincide con la mejor nota oficial':'Tu elección es distinta del líder por nota'):'Tu elección es personal y no altera las notas oficiales.'}</small></div><div class="mvp-pro-pick-controls"><select class="select" data-mvp-select="${esc(match.id)}">${options(rows,pick)}</select><button class="btn ${pick?'':'primary'}" type="button" data-mvp-save="${esc(match.id)}">${pick?'Cambiar':'Guardar mi MVP'}</button></div></div>${communityMini(match.id)}</article>`;
}
function timeline(matches){return `<section class="card mvp-pro-timeline"><div class="mvp-pro-title"><div><span>EVOLUCIÓN MVP</span><h3>Ganadores por nota, jornada a jornada</h3></div><button class="btn" type="button" data-mvp-go="evolucion">Ver Evolución PRO</button></div><div class="mvp-pro-timeline-track">${matches.map(({match,rows})=>{const win=winners(rows);return `<button type="button" data-mvp-match="${esc(match.id)}"><small>${esc(match.short||match.label||match.id)}</small><b>${esc(win.map(x=>display(x.name)).join(' / '))}</b><strong>${fmt(rows[0].value)}</strong></button>`}).join('')}</div></section>`}
function seasonTable(matches){
  const ranking=officialSeasonRanking(matches);if(!ranking.length)return '';
  return `<section class="card mvp-pro-season"><div class="mvp-pro-title"><div><span>TEMPORADA</span><h3>MVP por nota oficial</h3><p>Cuenta cuántas jornadas lidera cada jugador por valoración. Los empates en la mejor nota cuentan para ambos.</p></div></div><div class="mvp-pro-season-head"><span>#</span><span>Jugador</span><span>MVP</span><span>Podios</span><span>Media podios</span></div>${ranking.map((r,i)=>`<button type="button" class="mvp-pro-season-row" data-mvp-player="${esc(r.name)}"><b>${i+1}</b><span>${esc(display(r.name))}</span><strong>${r.wins}</strong><span>${r.podiums}</span><span>${fmt(r.avg)}</span></button>`).join('')}</section>`;
}
function hero(matches){
  const latest=latestSummary(matches),ranking=officialSeasonRanking(matches),leader=ranking[0],personal=personalSummary(matches),pick=latest?pickFor(latest.latest.match.id):'';
  return `<section class="card mvp-pro-hero"><div><span>MVP PRO · TEMPORADA 2026/27</span><h2>Mejor nota, tu MVP y evolución de cada jornada.</h2><p>El ganador por datos sale exclusivamente de la nota oficial combinada. Tu MVP se guarda aparte en este dispositivo: una opinión personal nunca modifica las estadísticas.</p></div><div class="mvp-pro-kpis"><div><span>Último MVP por nota</span><b>${latest?esc(display(latest.top.name)):'—'}</b><small>${latest?`${fmt(latest.top.value)} · ${esc(latest.latest.match.short||latest.latest.match.label)}`:'Sin partidos analizados'}</small></div><div><span>Líder de temporada</span><b>${leader?esc(display(leader.name)):'—'}</b><small>${leader?`${leader.wins} MVP · ${leader.podiums} podios`:'Pendiente'}</small></div><div><span>Tu criterio vs datos</span><b>${personal.pct===null?'—':`${personal.pct}%`}</b><small>${personal.total?`${personal.agree}/${personal.total} elecciones coinciden`:'Elige tu primer MVP'}</small></div><div><span>Tu último MVP</span><b>${pick?esc(display(pick)):'—'}</b><small>${pick&&latest?(isWinner(latest.latest.rows,pick)?'Coincide con la mejor nota':'Elección personal distinta'):'Sin elegir'}</small></div></div></section>`;
}
function methodology(){return `<div class="mvp-pro-method"><b>Cómo leer MVP PRO</b><span><strong>Mejor nota</strong> = líder de la valoración oficial combinada de ese partido.</span><span><strong>Tu MVP</strong> = elección personal guardada solo en tu dispositivo.</span><span><strong>SC</strong> o ausencia de nota nunca se convierten en 0 ni pueden ganar “por datos”.</span></div>`}

function render(){
  ensureSection();const section=document.getElementById('mvp');if(!section)return;const matches=analyzedMatches();
  if(!matches.length){section.innerHTML='<div class="section-head"><div><h2>MVP PRO</h2><p>Mejor nota oficial, tu MVP y evolución de la temporada.</p></div></div><div class="card mvp-empty"><b>Aún no hay partidos con valoración oficial.</b><span>Esta pantalla se completará cuando entren notas a la base de temporada.</span></div>';return}
  section.innerHTML=`<div class="section-head"><div><h2>MVP PRO</h2><p>Separa el rendimiento oficial, tu elección personal y —cuando esté conectada— la opinión de la comunidad.</p></div>${backendAvailable()?'<button class="btn" type="button" id="mvpRefreshCommunity">Actualizar comunidad</button>':'<span class="pill">Modo local · sin Netlify</span>'}</div>${hero(matches)}${methodology()}${timeline(matches)}<div class="section-head"><div><h2>Partido a partido</h2><p>Podio por nota oficial y tu elección personal independiente.</p></div></div><div class="mvp-pro-match-grid">${matches.map(matchCard).join('')}</div>${seasonTable(matches)}`;
  bind(section);if(selectedMatchId)setTimeout(()=>document.getElementById(`mvp_${CSS.escape(selectedMatchId)}`)?.scrollIntoView({behavior:'smooth',block:'center'}),20);
}
function bind(root){
  root.querySelectorAll('[data-mvp-save]').forEach(btn=>btn.addEventListener('click',()=>savePick(btn.dataset.mvpSave)));
  root.querySelectorAll('[data-mvp-player]').forEach(btn=>btn.addEventListener('click',()=>{safe(()=>showSection('plantilla'));setTimeout(()=>safe(()=>openPlayerHub(btn.dataset.mvpPlayer)),60)}));
  root.querySelectorAll('[data-mvp-match]').forEach(btn=>btn.addEventListener('click',()=>document.getElementById(`mvp_${CSS.escape(btn.dataset.mvpMatch)}`)?.scrollIntoView({behavior:'smooth',block:'center'})));
  root.querySelectorAll('[data-mvp-go]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>showSection(btn.dataset.mvpGo))));
  document.getElementById('mvpRefreshCommunity')?.addEventListener('click',()=>loadCommunityMvp(true));
}
async function savePick(matchId){
  const select=document.querySelector(`[data-mvp-select="${CSS.escape(matchId)}"]`),name=select?.value;if(!name){safe(()=>toast('Elige un jugador antes de guardar tu MVP'));return}
  const picks=readPicks();picks[matchId]=name;writePicks(picks);safe(()=>toast(`Tu MVP: ${display(name)}`));document.dispatchEvent(new CustomEvent('rm-mvp-personal-updated',{detail:{matchId,player:name}}));
  if(backendAvailable()){
    try{const response=await fetch('/.netlify/functions/mvp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:safe(()=>getParticipantId(),''),matchId,player:name})});if(response.ok){communityCache=null;await loadCommunityMvp(true)}}catch{}
  }
  render();
}
async function loadCommunityMvp(force=false){
  if(!backendAvailable()){render();return null}
  if(communityCache&&!force){render();return communityCache}
  try{const response=await fetch(`/.netlify/functions/mvp?participantId=${encodeURIComponent(safe(()=>getParticipantId(),''))}`,{headers:{accept:'application/json'}});const data=await response.json();if(!response.ok)throw new Error(data.error||'Error');communityCache=data;render();return data}catch{safe(()=>toast('No se pudo cargar la comunidad MVP'));render();return null}
}
function openMatch(matchId){selectedMatchId=matchId;safe(()=>showSection('mvp'));setTimeout(render,0)}
function sectionOpened(){render();if(backendAvailable())loadCommunityMvp(false)}
function install(){
  if(installed)return;if(typeof sections==='undefined'||typeof showSection!=='function'){setTimeout(install,100);return}installed=true;ensureSection();render();
  const base=showSection;showSection=function(id){base(id);if(id==='mvp')setTimeout(sectionOpened,0)};
  document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-mvp-personal-updated',render);
  window.RMMvpPro=Object.freeze({render,openMatch,picks:()=>({...readPicks()}),loadCommunity:loadCommunityMvp});
}
install();
})();
