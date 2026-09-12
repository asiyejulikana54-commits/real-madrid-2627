(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length?officialXI:null,null)}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function analyticsRecord(){
  const api=window.RMPredictionAnalytics,m=currentMatch();if(!api||!m)return null;
  safe(()=>api.settle?.(),null);
  return safe(()=>api.records?.().find(r=>r.matchId===m.id)||null,null);
}
function decisionRecord(){safe(()=>window.RMDecisionAudit?.settle?.(),null);return safe(()=>window.RMDecisionAudit?.current?.(),null)}
function scenarioRecord(){safe(()=>window.RMScenarioAudit?.settle?.(),null);return safe(()=>window.RMScenarioAudit?.current?.(),null)}
function sameSetDiff(a,b){
  const bSet=new Set((b||[]).map(canonical));return (a||[]).filter(n=>!bSet.has(canonical(n)));
}
function scoreWinner(rec){
  const rows=[['Tú',rec?.userScore],['Proyecto',rec?.projectScore],['Comunidad',rec?.communityScore]].filter(([,v])=>Number.isFinite(v));
  if(rows.length<2)return 'Resultado disponible';
  const best=Math.max(...rows.map(([,v])=>v)),leaders=rows.filter(([,v])=>v===best).map(([n])=>n);
  return leaders.length===1?`Gana ${leaders[0]}`:`Empate ${leaders.join(' · ')}`;
}
function chips(names,kind=''){
  const list=(names||[]).filter(Boolean);if(!list.length)return '<span class="oxr-none">Ninguno</span>';
  return `<div class="oxr-chips ${kind}">${list.map(n=>`<span>${esc(display(n))}</span>`).join('')}</div>`;
}
function differential(rec,actual){
  if(!rec?.userXI||!rec?.projectXI)return {youSaw:[],projectSaw:[],yourGambles:[],projectGambles:[]};
  const user=values(rec.userXI),project=values(rec.projectXI),actualSet=new Set(actual.map(canonical));
  const userOnly=sameSetDiff(user,project),projectOnly=sameSetDiff(project,user);
  return {
    youSaw:userOnly.filter(n=>actualSet.has(canonical(n))),
    projectSaw:projectOnly.filter(n=>actualSet.has(canonical(n))),
    yourGambles:userOnly.filter(n=>!actualSet.has(canonical(n))),
    projectGambles:projectOnly.filter(n=>!actualSet.has(canonical(n)))
  };
}
function scenarioWinner(rec){
  if(!rec?.scores)return null;
  const labels={user:'Tú',project:'Proyecto',strong:'Señales fuertes',consensus:'XI síntesis',community:'Comunidad'};
  const rows=Object.entries(rec.scores).filter(([,v])=>Number.isFinite(v)).map(([id,score])=>({id,label:labels[id]||id,score}));
  if(!rows.length)return null;const best=Math.max(...rows.map(r=>r.score));return {best,winners:rows.filter(r=>r.score===best),rows:rows.sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,'es'))};
}
function decisionSummary(rec){
  const s=rec?.summary;if(!s)return null;
  return {resolved:s.resolved||0,debates:s.debates||0,projectWins:s.projectWins||0,alternativeWins:s.alternativeWins||0,userWins:s.userWins||0,userResolved:s.userResolved||0,strongAlternativeWins:s.strongAlternativeWins||0,strongResolved:s.strongResolved||0};
}
function state(){
  const actual=official(),m=currentMatch();if(!actual||!m)return {available:false,match:m,official:actual};
  const analytics=analyticsRecord(),decision=decisionRecord(),scenario=scenarioRecord();
  return {available:true,match:m,official:actual,analytics,decision,scenario,diff:analytics?differential(analytics,actual):null,scenarioResult:scenarioWinner(scenario),decisionResult:decisionSummary(decision)};
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('officialXiReview');if(root)return root;
  root=document.createElement('section');root.id='officialXiReview';root.className='card oxr-shell';const anchor=document.getElementById('predictionAnalytics')||document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function ensureMatchday(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('officialXiReviewMatchday');if(root)return root;
  root=document.createElement('section');root.id='officialXiReviewMatchday';root.className='card oxr-compact';const anchor=document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function scoreCard(label,score,sub,kind=''){
  return `<article class="oxr-score ${kind}"><span>${esc(label)}</span><strong>${Number.isFinite(score)?score:'—'}<small>/11</small></strong><small>${esc(sub)}</small></article>`;
}
function exactLine(rec){
  if(!Number.isFinite(rec?.exactUser)||!Number.isFinite(rec?.exactProject)||!Number.isFinite(rec?.exactPossible))return '';
  return `<div class="oxr-exact"><span>COINCIDENCIA POR PUESTO</span><b>Tú ${rec.exactUser}/${rec.exactPossible} · Proyecto ${rec.exactProject}/${rec.exactPossible}${Number.isFinite(rec.exactCommunity)?` · Comunidad ${rec.exactCommunity}/${rec.exactPossible}`:''}</b></div>`;
}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const s=state();
  if(!s.available){root.hidden=true;root.innerHTML='';return}root.hidden=false;
  const rec=s.analytics;
  if(!rec||!Number.isFinite(rec.userScore)||!Number.isFinite(rec.projectScore)){
    root.innerHTML='<div class="oxr-empty"><b>REVISIÓN DEL XI OFICIAL</b><span>El once oficial ya está disponible, pero no existe una predicción congelada válida de este partido. No puntuamos el borrador actual a posteriori.</span></div>';return;
  }
  const d=s.diff||{},decision=s.decisionResult,scenario=s.scenarioResult;
  const edge=rec.userScore-rec.projectScore,edgeText=edge>0?`Tú +${edge}`:edge<0?`Proyecto +${Math.abs(edge)}`:'Empate';
  root.innerHTML=`<div class="oxr-head"><div><span>REVISIÓN DEL XI OFICIAL</span><h3>Qué acertaste tú y qué acertó el proyecto</h3><p>La lectura usa exclusivamente las fotos congeladas antes del XI oficial. La puntuación principal mide presencia entre los once titulares, no posición exacta.</p></div><b>${esc(scoreWinner(rec))}</b></div><div class="oxr-score-grid">${scoreCard('TU XI',rec.userScore,edgeText,'you')}${scoreCard('PROYECTO',rec.projectScore,edgeText==='Empate'?'Mismo resultado':edge>0?'Por detrás de ti':'Por delante','project')}${scoreCard('COMUNIDAD',rec.communityScore,Number.isFinite(rec.communityScore)?`${rec.communityTotal||0} pronósticos`:'Sin consenso final','community')}</div>${exactLine(rec)}<div class="oxr-diff-grid"><article><span>TÚ VISTE Y EL PROYECTO NO</span>${chips(d.youSaw,'good')}<small>${d.youSaw?.length?'Fueron titulares y solo estaban en tu XI congelado.':'No hubo un titular exclusivo de tu predicción frente al proyecto.'}</small></article><article><span>EL PROYECTO VIO Y TÚ NO</span>${chips(d.projectSaw,'warn')}<small>${d.projectSaw?.length?'Fueron titulares y solo estaban en la propuesta congelada.':'No hubo un titular exclusivo del proyecto frente a ti.'}</small></article></div>${decision?`<div class="oxr-audit"><div><span>DECISIONES CONGELADAS</span><b>${decision.resolved}/${decision.debates} debates resolubles</b></div><div class="oxr-audit-grid"><p><strong>${decision.alternativeWins}</strong><small>alternativas ganan</small></p><p><strong>${decision.projectWins}</strong><small>aguanta proyecto</small></p><p><strong>${decision.userWins}/${decision.userResolved}</strong><small>tus cambios ganan</small></p><p><strong>${decision.strongAlternativeWins}/${decision.strongResolved}</strong><small>señales fuertes cambian titular</small></p></div></div>`:''}${scenario?`<div class="oxr-scenario"><div><span>LIGA DE ESCENARIOS</span><b>${esc(scenario.winners.map(r=>r.label).join(' + '))} · ${scenario.best}/11</b></div><div>${scenario.rows.map((r,i)=>`<p class="${i===0?'leader':''}"><span>${esc(r.label)}</span><b>${r.score}/11</b></p>`).join('')}</div></div>`:''}<div class="oxr-actions"><button class="btn" data-oxr-go="mi-temporada">Ver historial</button><button class="btn" data-oxr-go="partido">Abrir centro del partido</button></div><p class="oxr-note">No se reconstruyen predicciones ni escenarios después de conocer el once. Si no había snapshot previo, esa comparación queda fuera de la auditoría.</p>`;
  root.querySelectorAll('[data-oxr-go]').forEach(b=>b.addEventListener('click',()=>showSection(b.dataset.oxrGo)));
}
function renderMatchday(){
  const root=ensureMatchday();if(!root)return;const s=state();
  if(!s.available){root.hidden=true;root.innerHTML='';return}root.hidden=false;const rec=s.analytics;
  if(!rec||!Number.isFinite(rec.userScore)||!Number.isFinite(rec.projectScore)){root.innerHTML='<div class="oxr-compact-row"><span>XI OFICIAL</span><b>Sin snapshot personal comparable</b></div>';return}
  const scenario=s.scenarioResult,lead=scenario?.winners?.map(r=>r.label).join(' + ');
  root.innerHTML=`<div class="oxr-compact-head"><div><span>REVISIÓN RÁPIDA</span><h3>XI oficial vs pronósticos congelados</h3></div><button class="btn" data-oxr-open="1">Ver detalle</button></div><div class="oxr-compact-grid"><p><span>Tú</span><b>${rec.userScore}/11</b></p><p><span>Proyecto</span><b>${rec.projectScore}/11</b></p><p><span>Comunidad</span><b>${Number.isFinite(rec.communityScore)?`${rec.communityScore}/11`:'—'}</b></p><p><span>Mejor escenario</span><b>${scenario?`${esc(lead)} · ${scenario.best}/11`:'—'}</b></p></div>`;
  root.querySelector('[data-oxr-open]')?.addEventListener('click',()=>showSection('prediccion'));
}
function render(){renderPrediction();renderMatchday();document.dispatchEvent(new CustomEvent('rm-official-xi-review-rendered'))}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('prediccion')){if(++attempts<120)setTimeout(install,100);return}
  if(!window.RMPredictionAnalytics||!window.RMDecisionAudit||!window.RMScenarioAudit){if(++attempts<120)setTimeout(install,100);return}
  installed=true;render();
  ['rm-prediction-analytics-updated','rm-decision-audit-updated','rm-scenario-audit-updated','rm-season-data-ready','rm-season-extension-ready','rm-community-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,80)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(render,60)});
  window.RMOfficialXIReview=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,140);
})();
