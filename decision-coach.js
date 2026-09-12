(()=>{
const MIN_ZONE=3,MIN_STRONG=3;
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function zone(slot){const s=String(slot||'').toLowerCase();if(s==='gk'||s.includes('por'))return 'POR';if(['lb','lcb','rcb','rb'].includes(s)||/lateral|central|defensa/.test(s))return 'DEF';if(['dm1','dm2','am'].includes(s)||/medio|interior|mediapunta/.test(s))return 'MED';if(['lw','rw','st'].includes(s)||/extremo|delantero|ataque/.test(s))return 'ATA';return 'OTR'}
function zoneLabel(id){return id==='POR'?'Portería':id==='DEF'?'Defensa':id==='MED'?'Medio':id==='ATA'?'Ataque':id}
function profile(){return safe(()=>window.RMDecisionProfile?.state?.(),null)}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function trained(z){return Boolean(z&&z.resolved>=MIN_ZONE&&Number.isFinite(z.rate))}
function zoneSignal(z){
  if(!trained(z))return {kind:'learning',label:'Aprendiendo',detail:z?.resolved?`${z.wins}/${z.resolved} cambios resueltos`:`sin casos resueltos`};
  if(z.rate>=.65)return {kind:'support',label:'Histórico favorable',detail:`${z.wins}/${z.resolved} cambios ganados`};
  if(z.rate<=.35)return {kind:'review',label:'Revisar primero',detail:`${z.wins}/${z.resolved} cambios ganados`};
  return {kind:'neutral',label:'Histórico mixto',detail:`${z.wins}/${z.resolved} cambios ganados`};
}
function state(){
  const p=profile(),b=board();if(!p||!b)return null;const zoneMap=new Map((p.zones||[]).map(z=>[z.id,z]));
  const changes=(b.rows||[]).filter(r=>r.userDiff&&r.user).map(r=>{const z=zone(r.slot?.key||r.slot?.label),stats=zoneMap.get(z)||null,signal=zoneSignal(stats);return {...r,coachZone:z,coachZoneStats:stats,coachSignal:signal}});
  const changedStrong=changes.filter(r=>r.decisionLevel==='strong'),trainedChanges=changes.filter(r=>trained(r.coachZoneStats)),support=trainedChanges.filter(r=>r.coachSignal.kind==='support'),review=trainedChanges.filter(r=>r.coachSignal.kind==='review'),neutral=trainedChanges.filter(r=>r.coachSignal.kind==='neutral'),learning=changes.filter(r=>!trained(r.coachZoneStats));
  const strongReady=p.strongResolved?.length>=MIN_STRONG&&Number.isFinite(p.strongRate),strongLabel=!strongReady?'Aprendiendo':p.strongRate>=.65?'Favorable':p.strongRate<=.35?'Débil':'Mixto';
  const reviewDebates=(b.rows||[]).filter(r=>!r.userDiff&&r.decisionLevel==='strong'&&r.primary?.name&&!same(r.primary.name,r.project)).slice(0,3);
  return {profile:p,board:b,changes,changedStrong,trainedChanges,support,review,neutral,learning,strongReady,strongLabel,reviewDebates};
}
function ensure(){const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('decisionCoach');if(root)return root;root=document.createElement('section');root.id='decisionCoach';root.className='card decision-coach';const anchor=document.getElementById('decisionBoard')||document.getElementById('xiStability')||document.getElementById('predictionAnalytics');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function summary(s){
  if(!s.changes.length)return s.reviewDebates.length?'Tu XI no se separa del proyecto, pero hay debates fuertes que merece la pena revisar antes del cierre.':'Tu XI está alineado con el proyecto y ahora mismo no hay un cambio personal que necesite contraste histórico.';
  const parts=[];if(s.review.length)parts.push(`${s.review.length} para revisar primero`);if(s.support.length)parts.push(`${s.support.length} con histórico favorable`);if(s.neutral.length)parts.push(`${s.neutral.length} con histórico mixto`);if(s.learning.length)parts.push(`${s.learning.length} todavía sin muestra suficiente`);return parts.join(' · ')+'.';
}
function rowCard(r){const stats=r.coachZoneStats,rate=trained(stats)?`${Math.round(stats.rate*100)}%`:'—',level=r.decisionLevel==='strong'?'DEBATE FUERTE':r.decisionLevel==='open'?'DEBATE ABIERTO':'CONSENSO';return `<article class="dc-row ${r.coachSignal.kind}"><div class="dc-row-head"><span>${esc(zoneLabel(r.coachZone))}</span><em>${esc(r.coachSignal.label)}</em></div><b>${esc(display(r.project))} → ${esc(display(r.user))}</b><small>${esc(r.slot?.label||r.slot?.role||r.slot?.key||'Puesto')} · ${level}</small><div class="dc-row-history"><strong>${rate}</strong><span>${esc(r.coachSignal.detail)}</span></div><button type="button" data-dc-duel="${esc(r.project)}|${esc(r.user)}">Comparar este cambio</button></article>`}
function debateCard(r){return `<article class="dc-row watch"><div class="dc-row-head"><span>${esc(r.slot?.label||r.slot?.role||r.slot?.key||'Puesto')}</span><em>DEBATE FUERTE</em></div><b>${esc(display(r.project))} ↔ ${esc(display(r.primary.name))}</b><small>Mantienes el proyecto en este puesto.</small><button type="button" data-dc-duel="${esc(r.project)}|${esc(r.primary.name)}">Revisar duelo</button></article>`}
function priorityRows(s){return [...s.review,...s.changedStrong.filter(r=>!s.review.includes(r)),...s.support,...s.neutral,...s.learning].filter((r,i,a)=>a.indexOf(r)===i).slice(0,5)}
function openDuel(a,b){safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;safe(()=>renderCompare());return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function bind(root){root.querySelectorAll('[data-dc-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.dcDuel.split('|');openDuel(a,b)}));root.querySelector('[data-dc-board]')?.addEventListener('click',()=>document.getElementById('decisionBoard')?.scrollIntoView?.({behavior:'smooth',block:'start'}))}
function render(){
  const s=state();if(!s)return false;const root=ensure();if(!root)return false;const rows=priorityRows(s),fallback=!s.changes.length?s.reviewDebates:[];
  const strongText=s.profile.strongResolved?.length?`${s.profile.strongWins?.length||0}/${s.profile.strongResolved.length}`:'0/0';
  root.innerHTML=`<div class="dc-head"><div><span>COACH DE DECISIÓN</span><h3>Tu historial aplicado al XI que estás haciendo ahora</h3><p>Contrasta tus cambios actuales con decisiones tuyas ya auditadas. Es <b>TU HISTORIAL, NO UNA PROBABILIDAD</b> de que un jugador vaya a ser titular.</p></div><b>${s.changes.length}<small>cambios actuales</small></b></div><div class="dc-kpis"><div><span>Zonas entrenadas</span><b>${s.trainedChanges.length}/${s.changes.length||0}</b><small>${MIN_ZONE}+ cambios resueltos por línea</small></div><div class="support"><span>Histórico favorable</span><b>${s.support.length}</b><small>entre tus cambios de hoy</small></div><div class="review"><span>Revisar primero</span><b>${s.review.length}</b><small>registro ≤35% con muestra</small></div><div><span>Debates fuertes</span><b>${strongText}</b><small>${s.strongReady?`registro ${s.strongLabel.toLowerCase()}`:`aprendiendo · mínimo ${MIN_STRONG}`}</small></div></div><div class="dc-summary"><span>PRIORIDAD DE REVISIÓN</span><b>${esc(summary(s))}</b><small>El coach nunca modifica tu XI automáticamente y no convierte un historial personal en una predicción futura.</small></div>${rows.length||fallback.length?`<div class="dc-list">${rows.length?rows.map(rowCard).join(''):fallback.map(debateCard).join('')}</div>`:'<div class="dc-empty"><b>Sin conflictos relevantes ahora mismo.</b><span>Cuando cambies un jugador respecto al proyecto, aparecerá aquí con su contexto histórico.</span></div>'}<div class="dc-foot"><button type="button" class="btn" data-dc-board>Ver Mesa de decisiones</button><span>Solo se usan jornadas estrictamente auditadas; los snapshots tardíos quedan fuera de las tasas.</span></div>`;
  bind(root);document.dispatchEvent(new CustomEvent('rm-decision-coach-rendered',{detail:{changes:s.changes.length,trained:s.trainedChanges.length,support:s.support.length,review:s.review.length,learning:s.learning.length}}));return true;
}
function install(){
  if(installed)return;if(!window.RMDecisionProfile||!window.RMDecisionBoard||!document.getElementById('prediccion')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;render();['rm-decision-board-rendered','rm-decision-profile-rendered','rm-decision-audit-updated','rm-local-prediction-updated','rm-community-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,100)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,80)});
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-section="prediccion"]'))setTimeout(render,500)},true);
  window.RMDecisionCoach=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
