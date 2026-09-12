(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function pct(n,d){return d?`${Math.round(n/d*100)}%`:'—'}
function zone(slot){const s=String(slot||'').toLowerCase();if(s==='gk'||s.includes('por'))return 'POR';if(['lb','lcb','rcb','rb'].includes(s)||/lateral|central|defensa/.test(s))return 'DEF';if(['dm1','dm2','am'].includes(s)||/medio|interior|mediapunta/.test(s))return 'MED';if(['lw','rw','st'].includes(s)||/extremo|delantero|ataque/.test(s))return 'ATA';return 'OTR'}
function records(){return safe(()=>window.RMDecisionAudit?.records?.(),[])||[]}
function strictRecords(){return records().filter(r=>r?.summary&&!r.snapshotLate)}
function lateRecords(){return records().filter(r=>r?.summary&&r.snapshotLate)}
function flatten(){return strictRecords().flatMap(r=>(r.rows||[]).map(row=>({...row,matchId:r.matchId,label:r.label||r.matchId,zone:zone(row.slot||row.slotLabel)})))}
function profile(){
  const audited=strictRecords(),late=lateRecords(),rows=flatten(),totalSlots=rows.length;
  const changes=rows.filter(r=>r.userDiff&&r.user),resolved=changes.filter(r=>r.userOutcome==='user'||r.userOutcome==='project'),wins=resolved.filter(r=>r.userOutcome==='user');
  const follows=rows.filter(r=>!r.userDiff&&r.project),followHits=follows.filter(r=>r.projectIn);
  const strong=changes.filter(r=>r.level==='strong'),strongResolved=strong.filter(r=>r.userOutcome==='user'||r.userOutcome==='project'),strongWins=strongResolved.filter(r=>r.userOutcome==='user');
  const zones=['POR','DEF','MED','ATA'].map(id=>{const c=changes.filter(r=>r.zone===id),rr=c.filter(r=>r.userOutcome==='user'||r.userOutcome==='project'),ww=rr.filter(r=>r.userOutcome==='user');return {id,changes:c.length,resolved:rr.length,wins:ww.length,rate:rr.length?ww.length/rr.length:null}});
  const eligible=zones.filter(z=>z.resolved>=2).sort((a,b)=>b.rate-a.rate||b.resolved-a.resolved),bestZone=eligible[0]||null;
  const recent=audited.slice(0,6).map(r=>({label:r.label||r.matchId,changes:r.summary?.userChanges||0,resolved:r.summary?.userResolved||0,wins:r.summary?.userWins||0}));
  return {audited,late,rows,totalSlots,changes,resolved,wins,follows,followHits,strong,strongResolved,strongWins,zones,bestZone,recent,challengeRate:totalSlots?changes.length/totalSlots:null,changeRate:resolved.length?wins.length/resolved.length:null,followRate:follows.length?followHits.length/follows.length:null,strongRate:strongResolved.length?strongWins.length/strongResolved.length:null,changesPerMatch:audited.length?changes.length/audited.length:null};
}
function ensure(){
  const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('decisionProfile');if(block)return block;
  block=document.createElement('section');block.id='decisionProfile';block.className='card decision-profile';const anchor=document.getElementById('decisionAuditSeason')||root.querySelector('.psp-kpis')||root.querySelector('.ph-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.prepend(block);return block;
}
function zoneLabel(id){return id==='POR'?'Portería':id==='DEF'?'Defensa':id==='MED'?'Medio':id==='ATA'?'Ataque':id}
function insight(p){
  if(!p.audited.length)return 'Todavía no hay jornadas estrictamente auditables para construir tu perfil.';
  if(!p.resolved.length)return 'Ya hay decisiones congeladas, pero aún no tenemos cambios tuyos resolubles contra el XI oficial.';
  if(p.bestZone)return `Tu zona con mejor registro comparable es ${zoneLabel(p.bestZone.id).toLowerCase()}: ${p.bestZone.wins}/${p.bestZone.resolved} cambios resueltos ganados.`;
  return 'Aún necesitamos al menos 2 cambios resolubles en una misma zona para destacar una tendencia por línea.';
}
function zoneCard(z){const rate=z.rate===null?'—':`${Math.round(z.rate*100)}%`;return `<article class="dp-zone ${z.resolved>=2?'ready':'short'}"><span>${esc(zoneLabel(z.id))}</span><b>${rate}</b><small>${z.wins}/${z.resolved} cambios resueltos · ${z.changes} totales</small></article>`}
function history(p){if(!p.recent.length)return '<div class="dp-empty">Sin jornadas auditadas todavía.</div>';return `<div class="dp-history">${p.recent.map(r=>`<div><span>${esc(r.label)}</span><b>${r.wins}/${r.resolved}</b><small>${r.changes} cambio${r.changes===1?'':'s'} · ${r.resolved?'duelos resueltos':'sin resolución'}</small></div>`).join('')}</div>`}
function render(){
  if(!document.getElementById('mi-temporada')?.classList.contains('active'))return false;const root=ensure();if(!root)return false;const p=profile();
  if(!p.audited.length&&!p.late.length){root.innerHTML='<div class="dp-empty"><b>PERFIL DE DECISIONES</b><span>Empezará cuando una predicción quede congelada antes del XI oficial y podamos auditar tus cambios sin mirar el resultado.</span></div>';return true}
  root.innerHTML=`<div class="dp-head"><div><span>PERFIL DE DECISIONES · AUDITADO</span><h3>Cómo decides cuando te separas del proyecto</h3><p>No puntúa intuiciones a posteriori. Solo usa snapshots previos al XI oficial y separa cambios resueltos, mantenimientos y muestras insuficientes.</p></div><b>${p.audited.length}<small> jornada${p.audited.length===1?'':'s'} estricta${p.audited.length===1?'':'s'}</small></b></div><div class="dp-kpis"><div><span>Ruptura con proyecto</span><b>${p.challengeRate===null?'—':`${Math.round(p.challengeRate*100)}%`}</b><small>${p.changes.length}/${p.totalSlots} puestos congelados</small></div><div class="accent"><span>Tus cambios ganan</span><b>${pct(p.wins.length,p.resolved.length)}</b><small>${p.wins.length}/${p.resolved.length} cambios resolubles</small></div><div><span>Al mantener proyecto</span><b>${pct(p.followHits.length,p.follows.length)}</b><small>${p.followHits.length}/${p.follows.length} jugadores terminaron titulares</small></div><div><span>Cambios por partido</span><b>${Number.isFinite(p.changesPerMatch)?p.changesPerMatch.toFixed(1):'—'}</b><small>${p.changes.length} cambios en ${p.audited.length} jornadas</small></div></div><div class="dp-insight"><span>LECTURA PERSONAL</span><b>${esc(insight(p))}</b>${p.strongResolved.length?`<small>En debates fuertes: ${p.strongWins.length}/${p.strongResolved.length} cambios tuyos ganaron (${pct(p.strongWins.length,p.strongResolved.length)}).</small>`:'<small>Los debates fuertes aparecerán aquí cuando haya una muestra resoluble.</small>'}</div><div class="dp-zones"><div class="dp-subhead"><span>POR LÍNEA</span><small>Se destaca una tendencia solo desde 2 casos resueltos</small></div><div class="dp-zone-grid">${p.zones.map(zoneCard).join('')}</div></div><div class="dp-recent"><div class="dp-subhead"><span>ÚLTIMAS JORNADAS</span><button type="button" class="btn" data-dp-audit>Ver auditoría completa</button></div>${history(p)}</div>${p.late.length?`<p class="dp-note">${p.late.length} jornada${p.late.length===1?'':'s'} con snapshot tardío se conserva${p.late.length===1?'':'n'} en el histórico, pero no entra${p.late.length===1?'':'n'} en estas tasas para evitar falsa precisión.</p>`:'<p class="dp-note">Las tasas usan únicamente snapshots capturados antes del XI oficial. “Mantener proyecto” mide presencia del jugador en el XI real; no es el mismo denominador que un duelo resuelto.</p>'}`;
  root.querySelector('[data-dp-audit]')?.addEventListener('click',()=>document.getElementById('decisionAuditSeason')?.scrollIntoView?.({behavior:'smooth',block:'start'}));
  document.dispatchEvent(new CustomEvent('rm-decision-profile-rendered',{detail:{matches:p.audited.length,changes:p.changes.length,resolved:p.resolved.length,wins:p.wins.length,bestZone:p.bestZone?.id||null}}));return true;
}
function install(){
  if(installed)return;if(!window.RMDecisionAudit||!document.getElementById('mi-temporada')){if(++attempts<100)setTimeout(install,100);return}
  installed=true;render();['rm-decision-audit-updated','rm-local-prediction-updated','rm-prediction-analytics-updated','rm-season-data-ready','rm-season-extension-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,120)));
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-section="mi-temporada"]'))setTimeout(render,600)},true);
  window.RMDecisionProfile=Object.freeze({render,state:profile});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
