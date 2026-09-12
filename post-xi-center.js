(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length===11?officialXI:null,null)}
function officialSlots(){return safe(()=>window.RMOfficialXIBySlot,null)||safe(()=>typeof officialXIBySlot!=='undefined'?officialXIBySlot:null,null)}
function review(){return safe(()=>window.RMOfficialXIReview?.state?.(),null)}
function analytics(){const s=review();return s?.analytics||safe(()=>window.RMPredictionAnalytics?.current?.(),null)||null}
function quick(){safe(()=>window.RMQuickPicks?.settle?.(),null);return safe(()=>window.RMQuickPicks?.current?.(),null)}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1],position:s[4]})),[])||[]}
function validXi(xi){const d=defs(),vals=d.map(s=>xi?.[s.key]).filter(Boolean);return d.length===11&&vals.length===11&&new Set(vals.map(canonical)).size===11}
function setScore(xi,actual){if(!validXi(xi)||!Array.isArray(actual))return null;const set=new Set(actual.map(canonical)),vals=Object.values(xi).filter(Boolean);return vals.filter(n=>set.has(canonical(n))).length}
function compare(reference,candidate){
  if(!validXi(reference)||!validXi(candidate))return null;
  if(window.RMLineupSemantics)return safe(()=>window.RMLineupSemantics.compare(reference,candidate),null);
  const ref=Object.values(reference),cand=Object.values(candidate),R=new Set(ref.map(canonical)),C=new Set(cand.map(canonical));const playerOut=ref.filter(n=>!C.has(canonical(n))),playerIn=cand.filter(n=>!R.has(canonical(n)));
  return {count:Math.max(playerOut.length,playerIn.length),playerOut,playerIn,changes:playerOut.map((out,i)=>({role:'XI',out,in:playerIn[i]||''}))};
}
function winner(rec){
  const rows=[['Tú',rec?.userScore],['Proyecto',rec?.projectScore],['Comunidad',rec?.communityScore]].filter(([,v])=>Number.isFinite(v));if(rows.length<2)return 'XI oficial publicado';
  const best=Math.max(...rows.map(([,v])=>v)),leaders=rows.filter(([,v])=>v===best).map(([n])=>n);return leaders.length===1?`Gana ${leaders[0]}`:`Empate ${leaders.join(' · ')}`;
}
function roleLines(xi){
  if(!xi)return '';
  const groups=[['POR',['gk']],['DEF',['lb','lcb','rcb','rb']],['MED',['dm1','dm2','am']],['ATA',['lw','rw','st']]];
  return groups.map(([label,keys])=>`<div><span>${label}</span><p>${keys.map(k=>xi[k]).filter(Boolean).map(n=>`<b>${esc(display(n))}</b>`).join('')}</p></div>`).join('');
}
function auditTag(rec){if(!rec)return {label:'SIN SNAPSHOT',tone:'muted',copy:'No existe una foto congelada comparable de esta jornada.'};if(rec.snapshotLate)return {label:'SNAPSHOT TARDÍO',tone:'warn',copy:'Se conserva para consulta, pero queda fuera de los KPIs estrictos.'};return {label:'AUDITADO',tone:'good',copy:'La comparación procede de una foto congelada antes del XI oficial.'}}
function ensure(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('postXiCenter');if(root)return root;
  root=document.createElement('section');root.id='postXiCenter';root.className='card post-xi-center';const anchor=document.getElementById('officialXiReview')||document.getElementById('decisionCenter')||document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor){if(anchor.id==='officialXiReview')anchor.insertAdjacentElement('beforebegin',root);else anchor.insertAdjacentElement('afterend',root)}else section.prepend(root);return root;
}
function scoreCard(label,value,sub,kind=''){return `<article class="pxc-score ${esc(kind)}"><span>${esc(label)}</span><strong>${Number.isFinite(value)?value:'—'}<small>/11</small></strong><small>${esc(sub)}</small></article>`}
function changesHtml(diff){
  if(!diff)return '<div class="pxc-empty">Sin snapshot de Proyecto congelado: no reconstruimos los cambios después de conocer el XI.</div>';
  if(!diff.count)return '<div class="pxc-calm"><b>Proyecto clavó el XI por roles.</b><span>No hubo cambios reales respecto a la foto congelada.</span></div>';
  return `<div class="pxc-change-list">${diff.changes.map(c=>`<article><span>${esc(c.role||'PUESTO')}</span><p><del>${esc(display(c.out||'—'))}</del><b>→</b><ins>${esc(display(c.in||'—'))}</ins></p></article>`).join('')}</div><p class="pxc-change-note">${diff.count} cambio${diff.count===1?'':'s'} real${diff.count===1?'':'es'} · salen ${diff.playerOut.map(display).join(', ')||'—'} · entran ${diff.playerIn.map(display).join(', ')||'—'}.</p>`;
}
function verdictHtml(s){
  const decision=s.review?.decisionResult,scenario=s.review?.scenarioResult,qp=s.quick;
  const scenarioText=scenario?`${scenario.winners.map(r=>r.label).join(' + ')} · ${scenario.best}/11`:'Sin escenario auditado';
  const decisionText=decision?`${decision.alternativeWins} alternativas · ${decision.projectWins} aguanta Proyecto`:'Sin auditoría de debates';
  const qpText=qp?.settledAt?`${qp.correct}/${qp.resolved} aciertos`:(qp?'Sin duelos resueltos':'Sin participación');
  return `<div class="pxc-verdict-grid"><article><span>DECISIONES</span><b>${esc(decisionText)}</b><small>${decision?`${decision.userWins}/${decision.userResolved} de tus cambios ganan`:'Solo usamos debates congelados'}</small></article><article><span>ESCENARIOS</span><b>${esc(scenarioText)}</b><small>Mejor lectura frente al XI oficial</small></article><article><span>QUICK PICKS</span><b>${esc(qpText)}</b><small>${qp?.perfect?'Jornada perfecta 3/3':qp?.settledAt?`${qp.answered||0}/3 respondidas`:'Solo cuentan votos previos al cierre'}</small></article></div>`;
}
function state(){
  const actual=official(),slotMap=officialSlots(),r=review(),rec=r?.analytics||analytics(),qp=quick();if(!actual)return {available:false};
  const projectXi=rec?.projectXI||null,userXi=rec?.userXI||null,projectDiff=slotMap?compare(projectXi,slotMap):null,userDiff=slotMap?compare(userXi,slotMap):null;
  const projectScore=Number.isFinite(rec?.projectScore)?rec.projectScore:setScore(projectXi,actual),userScore=Number.isFinite(rec?.userScore)?rec.userScore:setScore(userXi,actual);
  return {available:true,actual,slotMap,review:r,rec,quick:qp,projectDiff,userDiff,projectScore,userScore,audit:auditTag(rec),match:match()};
}
function share(s){
  const rec=s.rec,parts=[`XI oficial del Real Madrid vs ${s.match?.rival||'rival'}`];if(Number.isFinite(rec?.userScore))parts.push(`Mi XI: ${rec.userScore}/11`);if(Number.isFinite(rec?.projectScore))parts.push(`Proyecto: ${rec.projectScore}/11`);if(s.quick?.settledAt)parts.push(`Quick Picks: ${s.quick.correct}/${s.quick.resolved}`);const text=`${parts.join(' · ')} · RM 26/27`;
  if(navigator.share){safe(()=>navigator.share({title:'RM 26/27 · Revisión del XI',text}));return}if(navigator.clipboard?.writeText){safe(()=>navigator.clipboard.writeText(text));safe(()=>toast('Resultado copiado'))}
}
function bind(root,s){
  root.querySelector('[data-pxc-detail]')?.addEventListener('click',()=>{const target=document.getElementById('officialXiReview');if(target)target.scrollIntoView?.({behavior:'smooth',block:'start'});else safe(()=>showSection('prediccion'))});
  root.querySelector('[data-pxc-season]')?.addEventListener('click',()=>safe(()=>showSection('mi-temporada')));
  root.querySelector('[data-pxc-match]')?.addEventListener('click',()=>safe(()=>showSection('partido')));
  root.querySelector('[data-pxc-share]')?.addEventListener('click',()=>share(s));
}
function render(){
  const section=document.getElementById('prediccion'),root=ensure();if(!section||!root)return false;const s=state();section.classList.toggle('pxc-official-mode',Boolean(s.available));
  if(!s.available){root.hidden=true;root.innerHTML='';return false}root.hidden=false;
  const rec=s.rec,tag=s.audit,edge=Number.isFinite(s.userScore)&&Number.isFinite(s.projectScore)?s.userScore-s.projectScore:null,edgeText=edge===null?'Sin comparativa personal':edge>0?`Tú +${edge}`:edge<0?`Proyecto +${Math.abs(edge)}`:'Empate';
  root.innerHTML=`<div class="pxc-head"><div><span>CENTRO POST-XI</span><h2>El pronóstico ya se resolvió</h2><p>La app cambia de modo: dejamos de decidir y pasamos a revisar qué ocurrió, qué señales funcionaron y qué entra en tu histórico.</p></div><div class="pxc-audit ${esc(tag.tone)}"><b>${esc(tag.label)}</b><small>${esc(tag.copy)}</small></div></div><div class="pxc-official"><div><span>XI OFICIAL · ${esc(s.match?.rival||'PARTIDO')}</span><h3>La alineación confirmada</h3></div><div class="pxc-xi">${roleLines(s.slotMap)}</div></div><div class="pxc-score-grid">${scoreCard('TU XI',s.userScore,edgeText,'you')}${scoreCard('PROYECTO',s.projectScore,Number.isFinite(s.projectScore)?'foto congelada':'sin snapshot','project')}${scoreCard('COMUNIDAD',rec?.communityScore,Number.isFinite(rec?.communityScore)?`${rec.communityTotal||0} pronósticos`:'sin consenso final','community')}${scoreCard('QUICK PICKS',s.quick?.settledAt?s.quick.correct:null,s.quick?.settledAt?`de ${s.quick.resolved} resueltos`:'sin resultado','quick')}</div><section class="pxc-changes"><div class="pxc-subhead"><div><span>QUÉ CAMBIÓ DE VERDAD</span><h3>Proyecto → XI oficial</h3></div><b>${s.projectDiff?`${s.projectDiff.count} cambio${s.projectDiff.count===1?'':'s'}`:'—'}</b></div>${changesHtml(s.projectDiff)}</section><section class="pxc-verdict"><div class="pxc-subhead"><div><span>QUÉ APRENDEMOS</span><h3>${esc(rec?winner(rec):'Esperando histórico comparable')}</h3></div><small>${esc(edgeText)}</small></div>${verdictHtml(s)}</section><div class="pxc-actions"><button type="button" class="primary" data-pxc-detail>Ver revisión completa</button><button type="button" data-pxc-season>Mi temporada</button><button type="button" data-pxc-match>Centro del partido</button><button type="button" data-pxc-share>Compartir resultado</button></div><p class="pxc-note">No reconstruimos tu XI, el Proyecto, escenarios ni votos después de conocer la alineación. Si no existía una foto previa, esa comparación queda expresamente sin puntuar.</p>`;
  bind(root,s);document.dispatchEvent(new CustomEvent('rm-post-xi-center-rendered',{detail:{matchId:s.match?.id||null,userScore:s.userScore,projectScore:s.projectScore,projectChanges:s.projectDiff?.count??null,strict:Boolean(rec&&!rec.snapshotLate)}}));return true;
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('prediccion')||!window.RMLineupSemantics){if(++attempts<140)setTimeout(install,100);return}
  if(!window.RMOfficialXIReview||!window.RMQuickPicks){if(++attempts<140)setTimeout(install,100);return}
  installed=true;render();['rm-official-xi-review-rendered','rm-quick-picks-rendered','rm-prediction-analytics-updated','rm-decision-audit-updated','rm-scenario-audit-updated','rm-season-data-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,90)));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(render,80)});window.RMPostXiCenter=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,180);
})();
