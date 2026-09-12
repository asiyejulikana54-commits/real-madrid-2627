(()=>{
const KEY='rm_scenario_audit_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function saved(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:null,null)}
function lab(){return safe(()=>window.RMScenarioLab?.state?.(),null)}
function consensus(){const api=window.RMConsensusXI;if(!api||typeof api.auditableState!=='function')return null;return safe(()=>api.auditableState(),null)}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function write(db){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
function values(xi){return Object.values(xi||{}).filter(Boolean)}
function validXi(xi){const v=values(xi);return v.length===11&&new Set(v.map(canonical)).size===11}
function cloneXi(xi){return Object.fromEntries(Object.entries(xi||{}).map(([k,v])=>[k,v||'']))}
function scoreXi(xi,actual){if(!validXi(xi)||!Array.isArray(actual))return null;const set=new Set(actual.map(canonical));return values(xi).filter(n=>set.has(canonical(n))).length}
function label(id){const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`}
function scenarioMap(state){
  const out={};for(const s of state?.scenarios||[]){if(s?.valid&&validXi(s.xi))out[s.id]={id:s.id,title:s.title,xi:cloneXi(s.xi),meta:s.meta||'',capturedAt:new Date().toISOString()}}
  return out;
}
function consensusSnapshot(){
  const c=consensus();if(!c||!validXi(c.xi))return null;
  return {id:'consensus',title:'XI síntesis',xi:cloneXi(c.xi),meta:`${c.total} perspectivas auditables · ${c.unanimous} unánimes · ${c.split} divididos`,capturedAt:new Date().toISOString(),sources:c.sources.map(s=>s.id),auditSafe:true};
}
function capture(source='save'){
  const m=match(),mine=saved(),state=lab();if(!m||!mine?.xi||!validXi(mine.xi)||!state)return null;
  if(official())return read()[m.id]||null;
  const db=read(),prior=db[m.id]||null,savedAt=mine.savedAt||new Date().toISOString();
  if(source!=='save'&&prior)return prior;
  if(prior&&prior.savedAt===savedAt&&prior.scenarios?.project&&prior.scenarios?.strong)return prior;
  const scenarios=scenarioMap(state),cx=consensusSnapshot();
  if(!scenarios.project||!scenarios.strong)return prior;
  if(scenarios.community&&!state.community?.final)delete scenarios.community;
  if(cx)scenarios.consensus=cx;
  db[m.id]={matchId:m.id,rival:m.rival||prior?.rival||'',label:prior?.label||label(m.id),savedAt,capturedAt:new Date().toISOString(),snapshotLate:source!=='save',user:{id:'user',title:'Tu XI',xi:cloneXi(mine.xi),capturedAt:savedAt},scenarios};
  write(db);emit();return db[m.id];
}
function captureConsensus(){
  const m=match(),actual=official(),cx=consensusSnapshot();if(!m||actual||!cx)return null;
  const db=read(),rec=db[m.id];if(!rec||rec.scenarios?.consensus)return rec||null;
  rec.scenarios={...(rec.scenarios||{}),consensus:cx};write(db);emit();return rec;
}
function captureFinalCommunity(){
  const m=match(),state=lab(),actual=official();if(!m||!state||actual)return null;
  const c=state.scenarios?.find?.(s=>s.id==='community');if(!c?.valid||!state.community?.final||!validXi(c.xi))return null;
  const db=read(),rec=db[m.id];if(!rec||rec.scenarios?.community)return rec||null;
  rec.scenarios={...(rec.scenarios||{}),community:{id:'community',title:'Comunidad',xi:cloneXi(c.xi),meta:c.meta||'',capturedAt:new Date().toISOString(),final:true}};write(db);emit();return rec;
}
function settle(id=null,db=null){
  const actual=official(),m=match();if(!actual)return null;const store=db||read(),target=id||m?.id,rec=store[target];if(!rec)return null;
  const scores={user:scoreXi(rec.user?.xi,actual)};for(const [key,s] of Object.entries(rec.scenarios||{}))scores[key]=scoreXi(s.xi,actual);
  const finite=Object.entries(scores).filter(([,v])=>Number.isFinite(v)),best=finite.length?Math.max(...finite.map(([,v])=>v)):null,winners=best===null?[]:finite.filter(([,v])=>v===best).map(([k])=>k);
  store[target]={...rec,officialXI:[...actual],scores,winnerScore:best,winners,auditedAt:rec.auditedAt||new Date().toISOString()};write(store);return store[target];
}
function records(){const db=read(),m=match();if(m&&db[m.id])settle(m.id,db);return Object.values(read()).sort((a,b)=>String(b.savedAt||b.capturedAt||'').localeCompare(String(a.savedAt||a.capturedAt||'')))}
function current(){const m=match();return m?records().find(r=>r.matchId===m.id)||null:null}
function titleFor(id){return id==='user'?'Tú':id==='project'?'Proyecto':id==='strong'?'Señales fuertes':id==='consensus'?'XI síntesis':id==='community'?'Comunidad':id}
function aggregate(){
  const audited=records().filter(r=>r.scores),core=audited.filter(r=>['user','project','strong','consensus'].every(k=>Number.isFinite(r.scores?.[k]))),keys=['user','project','strong','consensus'];
  const rows=keys.map(id=>{const vals=core.map(r=>r.scores[id]);return {id,title:titleFor(id),n:vals.length,avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,wins:core.filter(r=>{const max=Math.max(r.scores.user,r.scores.project,r.scores.strong,r.scores.consensus);return r.scores[id]===max}).length}}).sort((a,b)=>(b.avg??-1)-(a.avg??-1)||b.wins-a.wins||a.title.localeCompare(b.title,'es'));
  const communityRows=audited.filter(r=>Number.isFinite(r.scores?.community)),communityAvg=communityRows.length?communityRows.reduce((n,r)=>n+r.scores.community,0)/communityRows.length:null;
  return {audited,core,n:core.length,rows,communityN:communityRows.length,communityAvg};
}
function winnerText(rec){if(!rec?.winners?.length)return 'Pendiente';return rec.winners.map(titleFor).join(' + ')}
function ensurePrediction(){const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('scenarioAudit');if(root)return root;root=document.createElement('section');root.id='scenarioAudit';root.className='card sa-shell';const anchor=document.getElementById('consensusXI')||document.getElementById('scenarioLab')||document.getElementById('decisionAudit')||document.getElementById('predictionAnalytics');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function ensureSeason(){const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('scenarioAuditSeason');if(block)return block;block=document.createElement('section');block.id='scenarioAuditSeason';block.className='card sa-season';const anchor=document.getElementById('decisionAuditSeason')||document.getElementById('predictionAnalyticsSeason')||root.querySelector('.psp-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.prepend(block);return block}
function scenarioCard(id,rec){const item=id==='user'?rec.user:rec.scenarios?.[id],score=rec.scores?.[id];if(!item)return `<div class="sa-score unavailable"><span>${esc(titleFor(id))}</span><b>—</b><small>No congelado</small></div>`;return `<div class="sa-score ${Number.isFinite(score)?'scored':'pending'}"><span>${esc(titleFor(id))}</span><b>${Number.isFinite(score)?`${score}/11`:'✓'}</b><small>${Number.isFinite(score)?'aciertos':id==='community'?'consenso final congelado':id==='consensus'?'síntesis auditable congelada':'snapshot congelado'}</small></div>`}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const rec=current();
  if(!rec){root.innerHTML='<div class="sa-empty"><b>LIGA DE ESCENARIOS</b><span>Guarda tu XI y congelaremos Proyecto + Señales fuertes + XI síntesis auditable para compararlos después con el once oficial.</span></div>';return}
  const settled=Boolean(rec.scores),hasCommunity=Boolean(rec.scenarios?.community),hasConsensus=Boolean(rec.scenarios?.consensus),safeConsensus=Boolean(rec.scenarios?.consensus?.auditSafe);
  root.innerHTML=`<div class="sa-head"><div><span>LIGA DE ESCENARIOS</span><h3>${settled?'Qué escenario leyó mejor el XI oficial':'Escenarios congelados antes del XI oficial'}</h3><p>${settled?'Misma regla 0–11 para todos: cuenta si el jugador fue titular, independientemente de la posición.':'Tu XI, Proyecto, Señales fuertes y XI síntesis quedan ligados al guardado. La síntesis auditable excluye Comunidad mientras sea provisional.'}</p></div><b>${settled?`Ganador: ${esc(winnerText(rec))}`:`${Object.keys(rec.scenarios||{}).length+1} congelados`}</b></div><div class="sa-scores">${['user','project','strong','consensus','community'].map(id=>scenarioCard(id,rec)).join('')}</div><p class="sa-note">${rec.snapshotLate?'Primera captura creada después de un guardado previo, pero todavía antes del XI oficial. ':''}${hasConsensus?(safeConsensus?'El XI síntesis fue congelado con política auditable. ':'Este registro de XI síntesis es anterior a la política auditable y se conserva sin reescribirlo. '):'El XI síntesis se añadirá si existe una versión auditable antes del once oficial. '}${hasCommunity?'La Comunidad usada es final; no se usa una foto provisional.':'La Comunidad no se añade hasta disponer de consenso final.'} No se reconstruyen escenarios a posteriori.</p>`;
}
function renderSeason(){
  const root=ensureSeason();if(!root)return;const a=aggregate();if(!a.audited.length){root.innerHTML='<div class="sa-empty"><b>LIGA HISTÓRICA DE ESCENARIOS</b><span>Empezará cuando un escenario congelado tenga XI oficial para poder puntuarse.</span></div>';return}
  const history=a.audited.slice(0,6),fmt=v=>v===null?'—':v.toFixed(2);
  root.innerHTML=`<div class="sa-season-head"><div><span>LIGA HISTÓRICA DE ESCENARIOS</span><h3>Tú vs Proyecto vs Señales vs Síntesis</h3><p>La clasificación usa solo jornadas donde los cuatro tienen snapshot previo y resultado. Las nuevas síntesis excluyen Comunidad provisional; los registros antiguos no se reescriben.</p></div><b>${a.n} jornada${a.n===1?'':'s'} común${a.n===1?'':'es'}</b></div><div class="sa-leaderboard">${a.rows.map((r,i)=>`<div><em>${i+1}</em><span>${esc(r.title)}</span><b>${fmt(r.avg)}</b><small>${r.wins} victoria${r.wins===1?'':'s'} / empate en cabeza</small></div>`).join('')}</div><div class="sa-community"><span>Comunidad</span><b>${fmt(a.communityAvg)}</b><small>${a.communityN} jornada${a.communityN===1?'':'s'} con consenso final disponible</small></div><div class="sa-history">${history.map(r=>`<div><span>${esc(r.label||label(r.matchId))}</span><b>Tú ${Number.isFinite(r.scores.user)?r.scores.user:'—'}</b><b>Proyecto ${Number.isFinite(r.scores.project)?r.scores.project:'—'}</b><b>Señales ${Number.isFinite(r.scores.strong)?r.scores.strong:'—'}</b><b>Síntesis ${Number.isFinite(r.scores.consensus)?r.scores.consensus:'—'}</b><small>${esc(winnerText(r))}</small></div>`).join('')}</div><p class="sa-note">No hay backfill inventado: una jornada solo entra si el escenario fue congelado antes de conocer el XI oficial. La nueva política auditable no modifica snapshots históricos ya guardados.</p>`;
}
function render(){renderPrediction();if(document.getElementById('mi-temporada')?.classList.contains('active'))setTimeout(renderSeason,40)}
function emit(){document.dispatchEvent(new CustomEvent('rm-scenario-audit-updated'))}
function onSaved(){setTimeout(()=>{capture('save');captureConsensus();captureFinalCommunity();settle();render()},180)}
function bootstrap(){const m=match(),mine=saved(),db=read();if(m&&mine?.xi&&!db[m.id]&&!official())setTimeout(()=>{capture('late');captureConsensus();captureFinalCommunity();render()},220);else{captureConsensus();captureFinalCommunity();settle();render()}}
function install(){
  if(installed)return;if(!window.RMScenarioLab||!window.RMConsensusXI||typeof showSection!=='function'){if(++attempts<100)setTimeout(install,100);return}
  installed=true;bootstrap();
  document.addEventListener('rm-local-prediction-updated',onSaved);
  document.addEventListener('rm-scenario-lab-rendered',()=>setTimeout(()=>{captureConsensus();captureFinalCommunity();settle();render()},70));
  document.addEventListener('rm-consensus-xi-rendered',()=>setTimeout(()=>{captureConsensus();settle();render()},80));
  document.addEventListener('rm-community-updated',()=>setTimeout(()=>{captureFinalCommunity();captureConsensus();settle();render()},90));
  ['rm-season-data-ready','rm-season-extension-ready','rm-prediction-analytics-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(()=>{settle();render()},100)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){captureConsensus();captureFinalCommunity();settle();render()}});
  window.RMScenarioAudit=Object.freeze({render,capture,captureConsensus,captureFinalCommunity,settle,records,aggregate,current});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();