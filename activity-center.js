(()=>{
const READ_KEY='rm_activity_center_read_v1';
const MAX_READ=240;
let installed=false,attempts=0,open=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function readIds(){try{const v=JSON.parse(localStorage.getItem(READ_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function writeIds(ids){try{localStorage.setItem(READ_KEY,JSON.stringify([...new Set(ids)].slice(-MAX_READ)))}catch{}}
function isRead(id){return readIds().includes(id)}
function markRead(id){if(!id)return;writeIds([...readIds(),id]);render()}
function markAll(){writeIds([...readIds(),...events().map(e=>e.id)]);render()}
function canonical(v){return safe(()=>window.RMSeasonData?.canonical?.(v),v)||v}
function display(v){return safe(()=>typeof displayName==='function'?displayName(v):v,v)||v}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length?officialXI:null,null)}
function closed(){return Boolean(official()||safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false))}
function savedPrediction(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function predictionResult(){const data=savedPrediction();return data?safe(()=>typeof scoreSavedPrediction==='function'?scoreSavedPrediction(data):null,null):null}
function dayKey(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function slug(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function event(id,type,title,copy,action,priority=1,meta=''){return {id,type,title,copy,action,priority,meta}}
function predictionEvents(){
  const m=match();if(!m)return [];const data=savedPrediction(),result=predictionResult(),out=[];
  if(!closed()&&!data)out.push(event(`prediction:missing:${m.id}`,'prediction','Tu XI sigue pendiente',`Todavía puedes guardar tu predicción contra ${m.rival||'el próximo rival'}.`,{type:'section',section:'prediccion',anchor:'predictionPitch'},5,'PRÓXIMO PARTIDO'));
  if(official()&&data&&result&&Number.isFinite(result.score))out.push(event(`prediction:result:${m.id}:${result.score}`,'result',`${result.score}/11 en tu predicción`,`El XI oficial ya permite revisar qué acertaste y dónde te separaste del Proyecto.`,{type:'section',section:'prediccion',anchor:'officialXiReview'},6,'RESULTADO'));
  return out;
}
function quickPickEvents(){
  const rec=safe(()=>window.RMQuickPicks?.current?.(),null);if(!rec)return [];
  if(rec.settledAt&&Number.isFinite(rec.correct)&&Number.isFinite(rec.resolved))return [event(`quick:result:${rec.matchId}:${rec.correct}:${rec.resolved}`,'quick',`${rec.correct}/${rec.resolved} en Quick Picks`,rec.perfect?'Perfecto: acertaste las 3 decisiones resueltas.':'Ya puedes revisar qué duelos acertaste antes del XI oficial.',{type:'section',section:'inicio',anchor:'quickPicks'},5,'QUICK PICKS')];
  const qs=rec.questions||[],answered=qs.filter(q=>rec.picks?.[q.id]).length;if(!closed()&&qs.length&&answered<qs.length)return [event(`quick:pending:${rec.matchId}:${answered}`,'quick',`Te faltan ${qs.length-answered} Quick Picks`,`Puedes completar las decisiones rápidas sin montar un XI entero.`,{type:'section',section:'inicio',anchor:'quickPicks'},2,'20 SEGUNDOS')];
  return [];
}
function debateEvents(){
  const row=safe(()=>window.RMEngagementLoop?.debate?.(),null);if(!row)return [];const vote=safe(()=>window.RMEngagementLoop?.currentVote?.(row),null);if(vote)return [];
  const a=row.project,b=row.primary?.name;if(!a||!b)return [];
  return [event(`debate:${match()?.id||'sin-partido'}:${dayKey()}:${row.slot?.key||'slot'}`,'debate',`${display(a)} o ${display(b)}?`,`El Duelo del día está abierto. Tu voto se guarda solo en este dispositivo.`,{type:'section',section:'inicio',anchor:'engagementLoop'},3,'DUELO DEL DÍA')];
}
function watchEvents(){
  const rows=safe(()=>window.RMFavoriteWatch?.rows?.(),[])||[],changes=safe(()=>window.RMFavoriteWatch?.changes?.(rows),[])||[];
  return changes.slice(0,5).map(c=>event(`watch:${canonical(c.name)}:${slug(c.text)}`,'watch',display(c.name),c.text,{type:'player',name:c.name},Math.min(5,Math.max(2,Number(c.priority)||2)),'WATCHLIST'));
}
function seasonEvents(){
  const changes=safe(()=>window.RMPersonalHome?.changes?.(),[])||[];return changes.filter(x=>x&&!/No hay cambios grandes|seguimiento se está preparando/i.test(x)).slice(0,2).map((text,i)=>event(`season:${slug(text)}`,'season','Cambio en la temporada',text,{type:'section',section:text.toLowerCase().includes('comunidad')?'comunidad':'evolucion'},2-i,'DESDE TU ÚLTIMA VISITA'));
}
function events(){
  const seen=new Set(),all=[...predictionEvents(),...quickPickEvents(),...debateEvents(),...watchEvents(),...seasonEvents()];
  return all.filter(e=>e?.id&&!seen.has(e.id)&&seen.add(e.id)).sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title,'es'));
}
function unread(){return events().filter(e=>!isRead(e.id))}
function icon(type){return type==='result'?'✓':type==='prediction'?'11':type==='quick'?'⚡':type==='watch'?'★':type==='debate'?'VS':'↗'}
function ensureButton(){
  const actions=document.querySelector('.topbar .actions');if(!actions)return null;let btn=document.getElementById('activityCenterBtn');if(btn)return btn;
  btn=document.createElement('button');btn.id='activityCenterBtn';btn.type='button';btn.className='btn activity-center-btn';btn.setAttribute('aria-label','Abrir novedades');btn.innerHTML='<span class="ac-bell">◌</span><em>Novedades</em><b class="ac-count" hidden>0</b>';btn.addEventListener('click',toggle);actions.prepend(btn);return btn;
}
function ensurePanel(){
  let root=document.getElementById('activityCenter');if(root)return root;
  root=document.createElement('div');root.id='activityCenter';root.className='activity-center';root.setAttribute('aria-hidden','true');root.innerHTML='<button type="button" class="ac-backdrop" aria-label="Cerrar novedades"></button><aside class="ac-panel" role="dialog" aria-modal="true" aria-label="Centro de novedades"><div class="ac-panel-head"><div><span>AHORA EN RM 26/27</span><h2>Novedades</h2><p>Solo señales útiles de tu temporada, tus jugadores y tus pronósticos.</p></div><button type="button" class="ac-close" aria-label="Cerrar">×</button></div><div id="activityCenterContent"></div></aside>';
  document.body.appendChild(root);root.querySelector('.ac-backdrop').addEventListener('click',close);root.querySelector('.ac-close').addEventListener('click',close);return root;
}
function render(){
  const btn=ensureButton(),root=ensurePanel();if(!btn||!root)return false;const all=events(),newOnes=all.filter(e=>!isRead(e.id)),count=btn.querySelector('.ac-count');
  if(count){count.hidden=!newOnes.length;count.textContent=newOnes.length>9?'9+':String(newOnes.length)}btn.classList.toggle('has-unread',Boolean(newOnes.length));
  const content=document.getElementById('activityCenterContent');if(!content)return false;
  content.innerHTML=`<div class="ac-summary"><div><b>${newOnes.length}</b><span>${newOnes.length===1?'novedad pendiente':'novedades pendientes'}</span></div>${newOnes.length?'<button type="button" data-ac-read-all>Marcar todo como leído</button>':''}</div>${all.length?`<div class="ac-list">${all.map(e=>`<button type="button" class="ac-item ${isRead(e.id)?'read':'unread'}" data-ac-id="${esc(e.id)}"><i>${esc(icon(e.type))}</i><div><span>${esc(e.meta)}</span><b>${esc(e.title)}</b><small>${esc(e.copy)}</small></div><strong>›</strong></button>`).join('')}</div>`:'<div class="ac-empty"><b>Todo al día</b><span>Cuando cambie algo relevante en tus jugadores, pronósticos o decisiones aparecerá aquí.</span></div>'}<p class="ac-note">Este centro no envía notificaciones push ni crea datos nuevos: resume únicamente información que ya existe en la aplicación.</p>`;
  content.querySelector('[data-ac-read-all]')?.addEventListener('click',markAll);content.querySelectorAll('[data-ac-id]').forEach(b=>b.addEventListener('click',()=>activate(all.find(e=>e.id===b.dataset.acId))));
  document.dispatchEvent(new CustomEvent('rm-activity-center-rendered',{detail:{total:all.length,unread:newOnes.length}}));return true;
}
function activate(e){if(!e)return;markRead(e.id);close();const a=e.action||{};
  if(a.type==='player'){safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(a.name);return}if(typeof openPlayerHub==='function'){openPlayerHub(a.name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,70);return}
  if(a.section){safe(()=>showSection(a.section));if(a.anchor)setTimeout(()=>document.getElementById(a.anchor)?.scrollIntoView?.({behavior:'smooth',block:'start'}),180)}
}
function openPanel(){const root=ensurePanel();render();root.classList.add('open');root.setAttribute('aria-hidden','false');document.body.classList.add('activity-center-open');open=true}
function close(){const root=document.getElementById('activityCenter');if(!root)return;root.classList.remove('open');root.setAttribute('aria-hidden','true');document.body.classList.remove('activity-center-open');open=false}
function toggle(){open?close():openPanel()}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.querySelector('.topbar .actions')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;ensureButton();ensurePanel();render();
  ['rm-favorite-watch-rendered','rm-player-favorites-updated','rm-quick-picks-rendered','rm-quick-picks-updated','rm-daily-debate-voted','rm-local-prediction-updated','rm-official-xi-review-rendered','rm-community-updated','rm-season-data-ready','rm-ranking-official-ready','rm-personal-home-rendered'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,80)));
  window.addEventListener('storage',e=>{if(!e.key||e.key===READ_KEY)setTimeout(render,50)});document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(render,80)});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)close()});
  window.RMActivityCenter=Object.freeze({render,events,unread,open:openPanel,close,markRead,markAll});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,300);
})();