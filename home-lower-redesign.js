(()=>{
let installed=false,timer=null,readyQueued=false;
const HIDDEN_IDS=['personalizedHome','publicPulse','intelligenceHome','uxHomeMore'];
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function go(id){if(id==='mi-liga'&&typeof openMiLiga==='function')return openMiLiga();if(typeof showSection==='function')showSection(id)}
function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')??fallback}catch{return fallback}}
function playersList(){return safe(()=>typeof players!=='undefined'?players:[],[])||[]}
function ranking(){return safe(()=>typeof efficiencyRanking!=='undefined'?efficiencyRanking:[],[])||[]}
function season(){return window.RMSeasonData||null}
function predictionRecords(){
  const ledger=parse('rm_prediction_history_v1',{})||{},out={...ledger};
  try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith('rm_prediction_')||key==='rm_prediction_history_v1')continue;const item=parse(key,null);if(item?.xi){const id=item.matchId||key.slice('rm_prediction_'.length);out[id]={...(out[id]||{}),...item,matchId:id}}}}catch{}
  return Object.values(out).filter(Boolean).sort((a,b)=>String(b.scoredAt||b.savedAt||'').localeCompare(String(a.scoredAt||a.savedAt||'')));
}
function favorites(){const value=parse('rm_player_favorites_v1',[]);return Array.isArray(value)?value:[]}
function powerRows(){
  const migrated=window.RMPowerMigration?.official;if(Array.isArray(migrated)&&migrated.length)return [...migrated].filter(x=>Number.isFinite(x.power)).sort((a,b)=>b.power-a.power);
  return ranking().map(row=>{const minutes=row.ratedMinutes||row.minutes||0,rating=Number.isFinite(row.rating)?row.rating:(minutes&&Number.isFinite(row.points)?row.points*90/minutes:null),power=Number.isFinite(rating)?rating*(.75+.25*Math.min(row.minutes||0,450)/450):null;return {...row,power}}).filter(x=>Number.isFinite(x.power)).sort((a,b)=>b.power-a.power);
}
function formLeader(){
  const data=season();if(!data)return null;
  return playersList().map(p=>{const recent=safe(()=>data.recentRating(p.name,3),null),metric=ranking().find(r=>String(r.name)===String(p.name)||String(r.short||'')===String(p.short||''));return recent&&recent.n>=2&&(metric?.minutes||0)>=90?{name:p.name,value:recent.value,n:recent.n}:null}).filter(Boolean).sort((a,b)=>b.value-a.value)[0]||null;
}
function topRiser(){
  const data=season();if(!data)return null;
  return playersList().map(p=>{const d=safe(()=>data.ratingDelta(p.name),null);return Number.isFinite(d?.delta)?{name:p.name,delta:d.delta}:null}).filter(x=>x&&x.delta>0).sort((a,b)=>b.delta-a.delta)[0]||null;
}
function personalSummary(){
  const records=predictionRecords(),scored=records.filter(r=>Number.isFinite(r.score)),best=scored.length?Math.max(...scored.map(r=>r.score)):null,latest=records[0],fav=favorites();
  return {records,scored,best,latest,fav};
}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function featuredPollPlayers(){
  return [...document.querySelectorAll('#homePollTeaser .home-poll-option span')].map(span=>{const text=[...span.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);return text?.nodeValue?.trim()||''}).filter(Boolean);
}
function duelInfo(){
  const source=document.querySelector('#publicPulse .pulse-duel'),title=source?.querySelector('b')?.textContent?.trim()||'Abre un duelo entre dos jugadores',copy=source?.querySelector('small')?.textContent?.trim()||'Compara rendimiento, forma y contexto antes de decidir.',featured=featuredPollPlayers(),normalizedTitle=norm(title),repeated=featured.length>1&&featured.every(name=>normalizedTitle.includes(norm(name)));
  if(!repeated)return {title,copy,action:'Abrir Radar'};
  const candidates=[
    {players:['Rüdiger','Huijsen','Konaté'],title:'¿Rüdiger, Huijsen o Konaté?',copy:'Tres perfiles para decidir la pareja de centrales del próximo XI.'},
    {players:['Cucurella','Carreras'],title:'¿Cucurella o Carreras?',copy:'El lateral izquierdo sigue siendo uno de los puestos con más competencia.'},
    {players:['Camavinga','Valverde'],title:'¿Camavinga o Valverde?',copy:'Dos opciones para equilibrar el centro del campo según el partido.'},
    {players:['Diomandé','Brahim'],title:'¿Diomandé o Brahim?',copy:'Profundidad y desborde frente a asociación y juego interior.'}
  ];
  const alt=candidates.find(c=>c.players.every(p=>!featured.some(f=>norm(f)===norm(p))));
  return alt?{title:alt.title,copy:alt.copy,action:'Abrir Radar'}:{title:'Otro duelo abierto',copy:'Entra en Radar para comparar un debate distinto al de la encuesta destacada.',action:'Abrir Radar'};
}
function communityInfo(){
  const source=document.querySelector('#publicPulse .pulse-community');
  const total=source?.querySelector('.pulse-community-total b')?.textContent?.trim();
  return {title:total?`${total} pronósticos en la comunidad`:'Mira qué está eligiendo la comunidad',copy:source?.querySelector('small')?.textContent?.trim()||'Porcentajes, tendencias y debates por posición.'};
}
function styles(){
  if(document.getElementById('rmHomeLowerCss'))return;const s=document.createElement('style');s.id='rmHomeLowerCss';s.textContent=`
#inicio.home-lower-redesigned>${HIDDEN_IDS.map(id=>`#${id}`).join(',#inicio.home-lower-redesigned>')}{display:none!important}
.ux-home-below{display:grid;gap:18px;margin:18px 0 28px}.ux-lower-section{display:grid;gap:10px}.ux-lower-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.ux-lower-head span{font-size:9px;font-weight:950;letter-spacing:.14em;color:var(--gold)}.ux-lower-head h2{margin:3px 0 0;font-size:22px;letter-spacing:-.03em}.ux-lower-head p{margin:0;color:var(--muted);font-size:10px}.ux-lower-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ux-lower-card{border:1px solid var(--line);background:linear-gradient(155deg,var(--surface-1),rgba(255,255,255,.018));border-radius:16px;padding:14px;min-width:0;color:inherit;text-align:left}.ux-lower-card.button{cursor:pointer;transition:.18s ease}.ux-lower-card.button:hover{border-color:#38516c;transform:translateY(-1px)}.ux-lower-card .k{display:block;color:#7f93aa;font-size:8px;font-weight:900;letter-spacing:.11em;margin-bottom:7px}.ux-lower-card strong{display:block;color:#fff;font-size:19px;line-height:1.05}.ux-lower-card small{display:block;color:var(--muted);font-size:9px;line-height:1.4;margin-top:6px}.ux-lower-card em{font-style:normal;color:var(--gold);font-size:10px;font-weight:900}.ux-lower-now{margin:18px 0 0}.ux-lower-now .ux-lower-card strong{font-size:18px}.ux-lower-now .ux-lower-card:nth-child(2) em{color:#8fc0ff}.ux-lower-now .ux-lower-card:nth-child(3) em{color:#73dfa8}.ux-lower-community{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ux-lower-community .ux-lower-card{min-height:126px;display:flex;flex-direction:column;justify-content:space-between}.ux-lower-community .ux-lower-card b{font-size:15px;line-height:1.2;color:#fff}.ux-lower-community .ux-lower-card span{color:var(--muted);font-size:9px;line-height:1.4}.ux-lower-community .ux-lower-card i{font-style:normal;color:var(--gold);font-size:9px;font-weight:900;margin-top:10px}.ux-lower-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ux-lower-links button{border:1px solid var(--line);background:#091522;color:#c8d5e4;border-radius:13px;padding:11px 10px;text-align:left;cursor:pointer;display:grid;gap:3px}.ux-lower-links button b{font-size:11px;color:#fff}.ux-lower-links button small{font-size:8px;color:var(--muted)}.ux-lower-links button:hover{border-color:#38516c}.ux-lower-note{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px dashed rgba(123,150,180,.25);border-radius:14px;padding:12px 14px;color:var(--muted);font-size:9px}.ux-lower-note button{border:0;background:transparent;color:#bdd8fb;font-weight:900;cursor:pointer;white-space:nowrap}
@media(max-width:780px){.ux-home-below{gap:16px;margin-top:15px}.ux-lower-now{margin-top:15px}.ux-lower-head h2{font-size:19px}.ux-lower-head p{display:none}.ux-lower-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.ux-lower-card{padding:11px 10px;border-radius:13px}.ux-lower-card strong,.ux-lower-now .ux-lower-card strong{font-size:15px}.ux-lower-card small{font-size:8px}.ux-lower-community{grid-template-columns:1fr}.ux-lower-community .ux-lower-card{min-height:104px}.ux-lower-links{grid-template-columns:repeat(2,minmax(0,1fr))}.ux-lower-note{align-items:flex-start;flex-direction:column}}
@media(max-width:430px){.ux-lower-grid{grid-template-columns:1fr 1fr}.ux-lower-grid>.ux-lower-card:last-child{grid-column:1/-1}.ux-lower-card strong,.ux-lower-now .ux-lower-card strong{font-size:16px}}
`;document.head.appendChild(s)}
function navButton(id,title,copy){return `<button type="button" data-lower-go="${id}"><b>${esc(title)}</b><small>${esc(copy)}</small></button>`}
function bindRoutes(root){root.querySelectorAll('[data-lower-go]').forEach(btn=>{if(btn.dataset.lowerBound)return;btn.dataset.lowerBound='1';btn.addEventListener('click',()=>go(btn.dataset.lowerGo))})}
function revealWhenReady(){
  if(readyQueued||document.body.classList.contains('home-ready'))return;readyQueued=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.classList.add('home-ready');document.dispatchEvent(new CustomEvent('rm-home-final-ready'))}));
}
function enforceOrder(home,routes,mvp,now,poll,root){
  if(home.firstElementChild!==routes)home.prepend(routes);
  if(mvp.previousElementSibling!==routes)routes.insertAdjacentElement('afterend',mvp);
  if(now.previousElementSibling!==mvp)mvp.insertAdjacentElement('afterend',now);
  if(poll.previousElementSibling!==now)now.insertAdjacentElement('afterend',poll);
  if(root.previousElementSibling!==poll)poll.insertAdjacentElement('afterend',root);
}
function render(){
  const home=document.getElementById('inicio'),routes=document.getElementById('uxHomeRoutes'),mvp=document.getElementById('uxHomeMvp'),poll=document.getElementById('homePollTeaser');if(!home||!routes||!mvp||!poll)return false;styles();home.classList.add('home-lower-redesigned');
  HIDDEN_IDS.forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute('aria-hidden','true')});
  let root=document.getElementById('uxHomeBelow');if(!root){root=document.createElement('section');root.id='uxHomeBelow';root.className='ux-home-below'}
  const p=personalSummary(),power=powerRows()[0],form=formLeader(),riser=topRiser(),duel=duelInfo(),community=communityInfo();
  const latestScore=p.latest?(Number.isFinite(p.latest.score)?`${p.latest.score}/11`:'Pendiente'):'Sin XI';
  let now=document.getElementById('uxHomeNow');if(!now){now=document.createElement('section');now.id='uxHomeNow';now.className='ux-lower-section ux-lower-now'}
  const nowMarkup=`<div class="ux-lower-head"><div><span>AHORA MISMO</span><h2>Quién está marcando la temporada.</h2></div><p>Rendimiento puro, sin llenar Inicio de tablas.</p></div><div class="ux-lower-grid">
    <button class="ux-lower-card button" type="button" data-lower-go="power"><span class="k">LÍDER POWER</span><strong>${esc(display(power?.name||'—'))}</strong><em>${Number.isFinite(power?.power)?Number(power.power).toFixed(2):'—'}</em><small>El jugador más fuerte en el ranking actual.</small></button>
    <button class="ux-lower-card button" type="button" data-lower-go="evolucion"><span class="k">MEJOR FORMA</span><strong>${esc(display(form?.name||'—'))}</strong><em>${Number.isFinite(form?.value)?Number(form.value).toFixed(2):'—'}</em><small>${form?`media en sus últimos ${form.n} partidos`:'Esperando más muestra'}</small></button>
    <button class="ux-lower-card button" type="button" data-lower-go="evolucion"><span class="k">MAYOR SUBIDA</span><strong>${esc(display(riser?.name||'—'))}</strong><em>${Number.isFinite(riser?.delta)?`+${riser.delta.toFixed(2)}`:'—'}</em><small>El cambio positivo más fuerte del último corte.</small></button>
  </div>`;
  if(now.dataset.markup!==nowMarkup){now.innerHTML=nowMarkup;now.dataset.markup=nowMarkup;bindRoutes(now)}
  const rootMarkup=`
  <section class="ux-lower-section"><div class="ux-lower-head"><div><span>DEBATE Y COMUNIDAD</span><h2>Dos cosas para mirar rápido.</h2></div><p>Sin repetir toda la sección Comunidad.</p></div><div class="ux-lower-community">
    <button class="ux-lower-card button" type="button" data-lower-go="radar"><span class="k">DUELO ABIERTO</span><b>${esc(duel.title)}</b><span>${esc(duel.copy)}</span><i>${esc(duel.action)} →</i></button>
    <button class="ux-lower-card button" type="button" data-lower-go="comunidad"><span class="k">PULSO DE LA COMUNIDAD</span><b>${esc(community.title)}</b><span>${esc(community.copy)}</span><i>Ver comunidad →</i></button>
  </div></section>
  <section class="ux-lower-section"><div class="ux-lower-head"><div><span>TU RM</span><h2>Tu seguimiento, en pequeño.</h2></div><p>Solo lo que te afecta a ti.</p></div><div class="ux-lower-grid">
    <button class="ux-lower-card button" type="button" data-lower-go="mi-temporada"><span class="k">MI TEMPORADA</span><strong>${p.records.length}</strong><small>pronóstico${p.records.length===1?'':'s'}${p.best!==null?` · mejor ${p.best}/11`:''}</small></button>
    <button class="ux-lower-card button" type="button" data-lower-go="prediccion"><span class="k">ÚLTIMO XI</span><strong>${esc(latestScore)}</strong><small>${p.latest?'Consulta o revisa tu última predicción.':'Haz tu primera predicción.'}</small></button>
    <button class="ux-lower-card button" type="button" data-lower-go="plantilla"><span class="k">TUS JUGADORES</span><strong>${p.fav.length}</strong><small>${p.fav.length?'favoritos bajo seguimiento':'Marca favoritos desde la plantilla'}</small></button>
  </div></section>
  <section class="ux-lower-section"><div class="ux-lower-head"><div><span>SEGUIR EXPLORANDO</span><h2>Atajos secundarios.</h2></div></div><div class="ux-lower-links">${navButton('power','Power RM','Ranking y forma')}${navButton('evolucion','Evolución','Cambios por jornada')}${navButton('comparador','Comparador','Jugador contra jugador')}${navButton('partidos','Partidos','Archivo y análisis')}</div><div class="ux-lower-note"><span>El resto de herramientas sigue disponible desde <b>•••</b>. Inicio se queda solo con lo útil para volver cada día.</span><button type="button" data-lower-more>Ver todo el panel →</button></div></section>`;
  if(root.dataset.markup!==rootMarkup){root.innerHTML=rootMarkup;root.dataset.markup=rootMarkup;bindRoutes(root);root.querySelector('[data-lower-more]')?.addEventListener('click',()=>{if(typeof window.openUxMore==='function')window.openUxMore();else if(typeof openUxMore==='function')openUxMore()})}
  enforceOrder(home,routes,mvp,now,poll,root);revealWhenReady();return true;
}
function schedule(delay=35){clearTimeout(timer);timer=setTimeout(render,delay)}
function install(){
  if(installed)return;if(!render()){setTimeout(install,70);return}
  installed=true;
  ['rm-critical-modules-ready','rm-modules-ready','rm-ranking-official-ready','rm-season-data-ready','rm-community-updated','rm-matchday-polls-updated','rm-mvp-personal-updated','rm-player-favorites-updated'].forEach(name=>document.addEventListener(name,()=>schedule(20)));
  [250,800,1800,3600].forEach(ms=>setTimeout(render,ms));
  window.RMHomeLower=Object.freeze({refresh:render});
}
setTimeout(install,40);
})();