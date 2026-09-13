(()=>{
const SESSION_KEY='rm_web_analytics_session_v1';
let installed=false,lastPing=0;
function api(){return window.RMCommunityApi||null}
function participantId(){try{return api()?.participantId?.()||''}catch{return ''}}
function sessionId(){let id=sessionStorage.getItem(SESSION_KEY);if(!id){id=(crypto.randomUUID?crypto.randomUUID():`s_${Date.now()}_${Math.random().toString(36).slice(2)}`);sessionStorage.setItem(SESSION_KEY,id)}return id}
function activeSection(){return document.querySelector('.section.active')?.id||new URLSearchParams(location.search).get('section')||'inicio'}
async function post(body){
  const endpoint=api()?.url?.();if(!endpoint)return null;
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||`Error ${response.status}`);return data;
}
async function ping(force=false){
  if(document.visibilityState==='hidden')return;
  const now=Date.now();if(!force&&now-lastPing<30000)return;lastPing=now;
  try{await post({action:'analyticsPing',participantId:participantId(),sessionId:sessionId(),section:activeSection()})}catch{}
}
function fmtDate(value){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'})}
function ensureAdminRoot(){
  const section=document.getElementById('mi-liga');if(!section)return null;
  let root=document.getElementById('webAnalyticsAdmin');if(root)return root;
  root=document.createElement('section');root.id='webAnalyticsAdmin';root.className='card';root.style.marginTop='16px';root.hidden=true;section.appendChild(root);return root;
}
function renderAdmin(data){
  const root=ensureAdminRoot();if(!root)return;
  if(!data?.ok){root.hidden=true;return}
  root.hidden=false;
  root.innerHTML=`<div class="section-head" style="margin-top:0"><div><h2>Actividad de la web</h2><p>Estadísticas privadas y anónimas desde que activamos el contador.</p></div><button class="btn" id="webAnalyticsRefresh">Actualizar</button></div>
  <div class="grid cols-4" style="margin-top:14px">
    <div class="kpi"><div class="label">Visitantes únicos</div><div class="value">${data.uniqueVisitors??0}</div><div class="hint">dispositivos distintos</div></div>
    <div class="kpi"><div class="label">Visitas totales</div><div class="value">${data.totalVisits??0}</div><div class="hint">sesiones iniciadas</div></div>
    <div class="kpi"><div class="label">Visitas hoy</div><div class="value">${data.visitsToday??0}</div><div class="hint">${data.uniqueToday??0} únicos hoy</div></div>
    <div class="kpi"><div class="label">Activos ahora</div><div class="value">${data.activeNow??0}</div><div class="hint">actividad en últimos 10 min</div></div>
  </div>
  <div class="grid cols-3" style="margin-top:14px">
    <div class="kpi"><div class="label">Actividad registrada</div><div class="value">${data.pageviews??0}</div><div class="hint">cargas y cambios de sección</div></div>
    <div class="kpi"><div class="label">Nuevos 24 h</div><div class="value">${data.newLast24h??0}</div><div class="hint">primer acceso reciente</div></div>
    <div class="kpi"><div class="label">Última visita</div><div class="value" style="font-size:18px">${fmtDate(data.lastVisit)}</div><div class="hint">última actividad detectada</div></div>
  </div>
  <p class="muted" style="margin:12px 0 0">No guardamos nombres ni direcciones IP: solo un identificador anónimo del dispositivo, sesiones y actividad básica.</p>`;
  root.querySelector('#webAnalyticsRefresh')?.addEventListener('click',loadSummary);
}
async function loadSummary(){
  try{const data=await post({action:'analyticsSummary',participantId:participantId()});renderAdmin(data)}catch{renderAdmin(null)}
}
function maybeSummary(){if(document.getElementById('mi-liga')?.classList.contains('active'))loadSummary()}
function install(){
  if(installed)return;installed=true;
  ping(true);setInterval(()=>ping(false),60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){ping(true);maybeSummary()}});
  document.addEventListener('click',e=>{const nav=e.target.closest?.('[data-section]');if(nav)setTimeout(()=>{ping(true);maybeSummary()},50)});
  window.addEventListener('popstate',()=>setTimeout(()=>ping(true),50));
  document.addEventListener('rm-community-updated',maybeSummary);
  [700,1800].forEach(ms=>setTimeout(()=>{ping(false);maybeSummary()},ms));
  setInterval(maybeSummary,60000);
  window.RMWebAnalytics=Object.freeze({ping,summary:loadSummary,sessionId});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
