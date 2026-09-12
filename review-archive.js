(()=>{
let installed=false,attempts=0,activeFilter='all';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function finite(v){return Number.isFinite(v)}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function label(id){const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`}
function scenarioTitle(id){return id==='user'?'Tú':id==='project'?'Proyecto':id==='strong'?'Señales fuertes':id==='consensus'?'XI síntesis':id==='community'?'Comunidad':id}
function analyticsRecords(){return safe(()=>window.RMPredictionAnalytics?.records?.(),[])||[]}
function decisionRecords(){return safe(()=>window.RMDecisionAudit?.records?.(),[])||[]}
function scenarioRecords(){return safe(()=>window.RMScenarioAudit?.records?.(),[])||[]}
function byId(rows){return new Map((rows||[]).filter(r=>r?.matchId).map(r=>[r.matchId,r]))}
function uniqActual(primary,other,actual){
  if(!primary||!other||!actual?.length)return [];
  const otherSet=new Set(values(other).map(canonical)),actualSet=new Set(actual.map(canonical)),seen=new Set(),out=[];
  for(const name of values(primary)){const key=canonical(name);if(!key||seen.has(key)||otherSet.has(key)||!actualSet.has(key))continue;seen.add(key);out.push(name)}
  return out;
}
function scenarioResult(rec){
  if(!rec?.scores)return null;const finiteScores=Object.entries(rec.scores).filter(([,v])=>finite(v));if(!finiteScores.length)return null;
  const best=finite(rec.winnerScore)?rec.winnerScore:Math.max(...finiteScores.map(([,v])=>v));const winners=(rec.winners?.length?rec.winners:finiteScores.filter(([,v])=>v===best).map(([id])=>id)).map(scenarioTitle);
  return {score:best,winners,text:winners.join(' + ')};
}
function merged(){
  const aMap=byId(analyticsRecords()),dMap=byId(decisionRecords()),sMap=byId(scenarioRecords()),ids=new Set([...aMap.keys(),...dMap.keys(),...sMap.keys()]),rows=[];
  for(const id of ids){
    const a=aMap.get(id)||null,d=dMap.get(id)||null,s=sMap.get(id)||null,official=s?.officialXI||d?.officialXI||null;
    const userScore=finite(a?.userScore)?a.userScore:(finite(s?.scores?.user)?s.scores.user:null),projectScore=finite(a?.projectScore)?a.projectScore:(finite(s?.scores?.project)?s.scores.project:null);
    if(!official?.length||!finite(userScore)||!finite(projectScore))continue;
    const userXI=a?.userXI||s?.user?.xi||null,projectXI=a?.projectXI||s?.scenarios?.project?.xi||null,communityScore=finite(a?.communityScore)?a.communityScore:(finite(s?.scores?.community)?s.scores.community:null);
    const result=userScore>projectScore?'win':userScore<projectScore?'loss':'draw',scoreStrict=!(a?.snapshotLate||s?.snapshotLate),decisionStrict=Boolean(d?.summary&&!d.snapshotLate),scenarioStrict=Boolean(s?.scores&&!s.snapshotLate),scenario=scenarioResult(s);
    rows.push({
      matchId:id,label:a?.label||s?.label||d?.label||label(id),dateKey:a?.userSavedAt||s?.savedAt||d?.savedAt||a?.capturedAt||s?.capturedAt||d?.capturedAt||'',
      userScore,projectScore,communityScore,edge:userScore-projectScore,result,scoreStrict,decisionStrict,scenarioStrict,
      exactUser:finite(a?.exactUser)?a.exactUser:null,exactProject:finite(a?.exactProject)?a.exactProject:null,exactCommunity:finite(a?.exactCommunity)?a.exactCommunity:null,exactPossible:finite(a?.exactPossible)?a.exactPossible:null,
      youSaw:uniqActual(userXI,projectXI,official),projectSaw:uniqActual(projectXI,userXI,official),decision:d?.summary||null,scenario,official:[...official]
    });
  }
  return rows.sort((x,y)=>String(y.dateKey).localeCompare(String(x.dateKey)));
}
function stats(rows){
  const strict=rows.filter(r=>r.scoreStrict),wins=strict.filter(r=>r.result==='win').length,draws=strict.filter(r=>r.result==='draw').length,losses=strict.filter(r=>r.result==='loss').length;
  const avg=key=>strict.length?strict.reduce((n,r)=>n+r[key],0)/strict.length:null,best=strict.slice().sort((a,b)=>b.userScore-a.userScore||b.edge-a.edge)[0]||null;
  return {rows,strict,wins,draws,losses,userAvg:avg('userScore'),projectAvg:avg('projectScore'),edge:strict.length?strict.reduce((n,r)=>n+r.edge,0)/strict.length:null,best,late:rows.length-strict.length};
}
function state(){return stats(merged())}
function ensure(){
  const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('reviewArchive');if(block)return block;
  block=document.createElement('section');block.id='reviewArchive';block.className='card review-archive';const anchor=document.getElementById('scenarioAuditSeason')||document.getElementById('decisionProfile')||document.getElementById('predictionAnalyticsSeason')||root.querySelector('.psp-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.appendChild(block);return block;
}
function resultLabel(r){return r.result==='win'?'Tú ganas':r.result==='loss'?'Proyecto gana':'Empate'}
function chips(names,empty){return names.length?`<div class="ra-chips">${names.map(n=>`<span>${esc(display(n))}</span>`).join('')}</div>`:`<small class="ra-empty-line">${esc(empty)}</small>`}
function decisionText(r){
  const d=r.decision;if(!d)return '<small class="ra-empty-line">Sin auditoría de decisiones congelada para esta jornada.</small>';
  const user=Number(d.userResolved)||0,uw=Number(d.userWins)||0,res=Number(d.resolved)||0,alt=Number(d.alternativeWins)||0;
  return `<div class="ra-mini-kpis"><div><span>Tus cambios</span><b>${uw}/${user}</b><small>ganan entre resolubles</small></div><div><span>Alternativas</span><b>${alt}/${res}</b><small>vencen al proyecto</small></div><div><span>Debates fuertes</span><b>${Number(d.strongAlternativeWins)||0}/${Number(d.strongResolved)||0}</b><small>cambio confirmado</small></div></div>${r.decisionStrict?'':'<p class="ra-warning">La auditoría de decisiones de esta jornada fue capturada tarde: se conserva, pero no debe usarse para calibrar tasas.</p>'}`
}
function scenarioText(r){if(!r.scenario)return '<small class="ra-empty-line">Sin Liga de escenarios auditada en esta jornada.</small>';return `<div class="ra-scenario"><span>Mejor escenario</span><b>${esc(r.scenario.text)} · ${r.scenario.score}/11</b><small>${r.scenarioStrict?'snapshot previo al XI oficial':'registro conservado con captura tardía'}</small></div>`}
function roundCard(r){
  const community=finite(r.communityScore)?` · Comunidad ${r.communityScore}/11`:'',exact=finite(r.exactUser)&&finite(r.exactProject)&&finite(r.exactPossible)?`<div class="ra-exact"><span>Coincidencia por rol</span><b>Tú ${r.exactUser}/${r.exactPossible} · Proyecto ${r.exactProject}/${r.exactPossible}${finite(r.exactCommunity)?` · Comunidad ${r.exactCommunity}/${r.exactPossible}`:''}</b></div>`:'';
  return `<details class="ra-round ${r.result}"><summary><div><span>${esc(r.label)}</span><small>${r.scoreStrict?'AUDITORÍA ESTRICTA':'SNAPSHOT TARDÍO'}</small></div><strong>Tú ${r.userScore}/11 · Proyecto ${r.projectScore}/11${community}</strong><em>${esc(resultLabel(r))}</em></summary><div class="ra-detail">${exact}<div class="ra-diff-grid"><section><span>TÚ VISTE Y PROYECTO NO</span>${chips(r.youSaw,'Ningún acierto diferencial tuyo.')}</section><section><span>PROYECTO VIO Y TÚ NO</span>${chips(r.projectSaw,'Ningún acierto diferencial del proyecto.')}</section></div><section class="ra-block"><span>ESCENARIOS</span>${scenarioText(r)}</section><section class="ra-block"><span>DECISIONES</span>${decisionText(r)}</section>${r.scoreStrict?'':'<p class="ra-warning">Esta jornada se muestra por transparencia, pero queda fuera de los KPIs del archivo porque la foto principal no fue estrictamente previa al XI oficial.</p>'}</div></details>`;
}
function filterRows(rows){return activeFilter==='all'?rows:rows.filter(r=>r.result===activeFilter)}
function render(){
  if(!document.getElementById('mi-temporada')?.classList.contains('active'))return false;const root=ensure();if(!root)return false;const s=state(),visible=filterRows(s.rows);
  if(!s.rows.length){root.innerHTML='<div class="ra-empty"><b>ARCHIVO DE REVISIONES OFICIALES</b><span>Empezará cuando una predicción congelada tenga XI oficial y pueda compararse sin reconstruir el pasado.</span></div>';return true}
  const fmt=v=>v===null?'—':v.toFixed(2),best=s.best?`${s.best.userScore}/11 · ${s.best.label}`:'—';
  root.innerHTML=`<div class="ra-head"><div><span>ARCHIVO DE REVISIONES OFICIALES</span><h3>Cada jornada, qué acertaste tú y qué acertó el proyecto</h3><p>Une el 0–11, los diferenciales reales, la Liga de escenarios y la Auditoría de decisiones. Los KPIs usan solo snapshots estrictos previos al XI oficial.</p></div><b>${s.strict.length}<small> jornadas estrictas</small></b></div><div class="ra-kpis"><div><span>Balance vs Proyecto</span><b>${s.wins}-${s.draws}-${s.losses}</b><small>victorias · empates · derrotas</small></div><div><span>Tu media</span><b>${fmt(s.userAvg)}</b><small>Proyecto ${fmt(s.projectAvg)}</small></div><div><span>Ventaja media</span><b>${s.edge===null?'—':`${s.edge>0?'+':''}${s.edge.toFixed(2)}`}</b><small>aciertos por jornada</small></div><div><span>Mejor jornada</span><b>${esc(best)}</b><small>${s.late?`${s.late} registro${s.late===1?'':'s'} tardío${s.late===1?'':'s'} fuera de KPI`:'sin snapshots tardíos'}</small></div></div><div class="ra-filters"><button type="button" data-ra-filter="all" class="${activeFilter==='all'?'active':''}">Todas <b>${s.rows.length}</b></button><button type="button" data-ra-filter="win" class="${activeFilter==='win'?'active':''}">Tú ganas <b>${s.rows.filter(r=>r.result==='win').length}</b></button><button type="button" data-ra-filter="draw" class="${activeFilter==='draw'?'active':''}">Empates <b>${s.rows.filter(r=>r.result==='draw').length}</b></button><button type="button" data-ra-filter="loss" class="${activeFilter==='loss'?'active':''}">Proyecto <b>${s.rows.filter(r=>r.result==='loss').length}</b></button></div><div class="ra-list">${visible.length?visible.map(roundCard).join(''):'<div class="ra-empty"><span>No hay jornadas en este filtro.</span></div>'}</div><p class="ra-note">No reconstruimos jornadas ni completamos retrospectivamente XIs que no fueron congelados. Los registros tardíos pueden consultarse, pero no contaminan los KPIs estrictos.</p>`;
  root.querySelectorAll('[data-ra-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.raFilter||'all';render()}));
  document.dispatchEvent(new CustomEvent('rm-review-archive-rendered',{detail:{total:s.rows.length,strict:s.strict.length,wins:s.wins,draws:s.draws,losses:s.losses}}));return true;
}
function install(){
  if(installed)return;if(!window.RMPredictionAnalytics||!window.RMDecisionAudit||!window.RMScenarioAudit||!document.getElementById('mi-temporada')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;render();['rm-prediction-analytics-updated','rm-decision-audit-updated','rm-scenario-audit-updated','rm-season-data-ready','rm-season-extension-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,140)));
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-section="mi-temporada"]'))setTimeout(render,650)},true);
  window.RMReviewArchive=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
