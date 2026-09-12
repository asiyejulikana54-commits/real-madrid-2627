(()=>{
const KEY='rm_decision_audit_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function saved(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:null,null)}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function write(db){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function label(id){const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`}
function boardState(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function snapshotRows(){
  const state=boardState();if(!state?.rows?.length)return null;
  return state.rows.map(r=>({slot:r.slot?.key||'',slotLabel:r.slot?.label||r.slot?.role||r.slot?.key||'',project:r.project||r.current||'',level:r.decisionLevel||'consensus',levelLabel:r.decisionLabel||'CONSENSO',alternative:r.primary?.name||null,alternativeSources:Array.isArray(r.primary?.sources)?[...r.primary.sources]:[],user:r.user||r.mineName||null,userDiff:Boolean(r.userDiff),community:r.community?.name||null,communityFinal:Boolean(r.community?.final)}));
}
function capture(source='save'){
  const m=currentMatch(),mine=saved(),rows=snapshotRows();if(!m||!mine?.xi||!rows)return null;
  const savedAt=mine.savedAt||new Date().toISOString(),db=read(),prior=db[m.id]||null;
  if(source!=='save'&&prior)return prior;
  if(prior&&prior.savedAt===savedAt&&prior.rows?.length)return prior;
  const late=source!=='save';
  db[m.id]={matchId:m.id,rival:m.rival||prior?.rival||'',label:prior?.label||label(m.id),savedAt,capturedAt:new Date().toISOString(),snapshotLate:late,rows};
  write(db);settle(m.id,db);emit();return db[m.id];
}
function rowOutcome(row,actualSet){
  const projectIn=actualSet.has(canonical(row.project)),alternativeIn=Boolean(row.alternative)&&actualSet.has(canonical(row.alternative)),userIn=Boolean(row.user)&&actualSet.has(canonical(row.user));
  let debateOutcome=null;
  if(row.alternative){if(projectIn&&!alternativeIn)debateOutcome='project';else if(!projectIn&&alternativeIn)debateOutcome='alternative';else if(projectIn&&alternativeIn)debateOutcome='both';else debateOutcome='neither'}
  let userOutcome=null;
  if(row.userDiff&&row.user){if(projectIn&&!userIn)userOutcome='project';else if(!projectIn&&userIn)userOutcome='user';else if(projectIn&&userIn)userOutcome='both';else userOutcome='neither'}
  return {...row,projectIn,alternativeIn,userIn,debateOutcome,userOutcome};
}
function settle(id=null,db=null){
  const actual=official(),m=currentMatch();if(!actual)return null;const store=db||read(),target=id||m?.id;if(!target||!store[target])return null;
  const actualSet=new Set(actual.map(canonical)),rec=store[target],rows=(rec.rows||[]).map(r=>rowOutcome(r,actualSet));
  const debates=rows.filter(r=>r.alternative),resolved=debates.filter(r=>r.debateOutcome==='project'||r.debateOutcome==='alternative'),projectWins=resolved.filter(r=>r.debateOutcome==='project').length,alternativeWins=resolved.filter(r=>r.debateOutcome==='alternative').length;
  const userChanges=rows.filter(r=>r.userDiff&&r.user),userResolved=userChanges.filter(r=>r.userOutcome==='project'||r.userOutcome==='user'),userWins=userResolved.filter(r=>r.userOutcome==='user').length;
  const strong=debates.filter(r=>r.level==='strong'),strongResolved=strong.filter(r=>r.debateOutcome==='project'||r.debateOutcome==='alternative'),strongAlternativeWins=strongResolved.filter(r=>r.debateOutcome==='alternative').length;
  store[target]={...rec,rows,officialXI:[...actual],auditedAt:rec.auditedAt||new Date().toISOString(),summary:{projectStarters:rows.filter(r=>r.projectIn).length,totalSlots:rows.length,debates:debates.length,resolved:resolved.length,projectWins,alternativeWins,unresolved:debates.length-resolved.length,userChanges:userChanges.length,userResolved:userResolved.length,userWins,strong:strong.length,strongResolved:strongResolved.length,strongAlternativeWins}};
  write(store);return store[target];
}
function records(){const db=read(),m=currentMatch();if(m&&db[m.id])settle(m.id,db);return Object.values(read()).sort((a,b)=>String(b.savedAt||b.capturedAt||'').localeCompare(String(a.savedAt||a.capturedAt||'')))}
function current(){const m=currentMatch();return m?records().find(r=>r.matchId===m.id)||null:null}
function aggregate(){
  const audited=records().filter(r=>r.summary),sum=(key)=>audited.reduce((n,r)=>n+(Number(r.summary?.[key])||0),0);
  const resolved=sum('resolved'),altWins=sum('alternativeWins'),projectWins=sum('projectWins'),userResolved=sum('userResolved'),userWins=sum('userWins'),strongResolved=sum('strongResolved'),strongAltWins=sum('strongAlternativeWins');
  return {matches:audited.length,debates:sum('debates'),resolved,altWins,projectWins,unresolved:sum('unresolved'),altRate:resolved?altWins/resolved:null,userChanges:sum('userChanges'),userResolved,userWins,userRate:userResolved?userWins/userResolved:null,strong:sum('strong'),strongResolved,strongAltWins,strongAltRate:strongResolved?strongAltWins/strongResolved:null,projectStarterHits:sum('projectStarters'),projectStarterPossible:audited.reduce((n,r)=>n+(Number(r.summary?.totalSlots)||0),0),audited};
}
function outcomeLabel(outcome){return outcome==='alternative'?'GANA ALTERNATIVA':outcome==='project'?'AGUANTA PROYECTO':outcome==='both'?'JUEGAN LOS DOS':outcome==='neither'?'ENTRA UN TERCERO':'PENDIENTE'}
function outcomeClass(outcome){return outcome==='alternative'?'alt':outcome==='project'?'project':outcome==='both'?'both':outcome==='neither'?'neither':'pending'}
function ensurePrediction(){const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('decisionAudit');if(root)return root;root=document.createElement('section');root.id='decisionAudit';root.className='card da-shell';const anchor=document.getElementById('decisionBoard')||document.getElementById('xiStability')||document.getElementById('predictionAnalytics');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function ensureSeason(){const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('decisionAuditSeason');if(block)return block;block=document.createElement('section');block.id='decisionAuditSeason';block.className='card da-season';const anchor=document.getElementById('predictionAnalyticsSeason')||root.querySelector('.psp-kpis')||root.querySelector('.ph-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.prepend(block);return block}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const rec=current();
  if(!rec){root.innerHTML='<div class="da-empty"><b>AUDITORÍA DE DECISIONES</b><span>Cuando guardes tu predicción, congelaremos también los debates de ese momento para revisarlos después contra el XI oficial.</span></div>';return}
  const rows=rec.rows||[],debates=rows.filter(r=>r.alternative),strong=debates.filter(r=>r.level==='strong').length;
  if(!rec.summary){root.innerHTML=`<div class="da-head"><div><span>AUDITORÍA DE DECISIONES</span><h3>Debates congelados antes del XI oficial</h3><p>Guardamos la foto de la Mesa de decisiones para que después no podamos reinterpretarla con el resultado ya conocido.</p></div><b>${debates.length} debate${debates.length===1?'':'s'}</b></div><div class="da-kpis"><div><span>Debates fuertes</span><b>${strong}</b></div><div><span>Debates abiertos</span><b>${debates.length-strong}</b></div><div><span>Tus cambios</span><b>${rows.filter(r=>r.userDiff).length}</b></div><div><span>Estado</span><b>Pendiente</b></div></div>${rec.snapshotLate?'<p class="da-note">Esta primera foto se creó después de que tu predicción ya estuviera guardada. Desde el siguiente guardado el snapshot queda ligado exactamente a ese momento.</p>':'<p class="da-note">Snapshot bloqueado al guardar. Los cambios posteriores de Power, forma, comunidad o nuestra propuesta no alteran esta auditoría.</p>'}`;return}
  const s=rec.summary,visible=debates.slice(0,6);
  root.innerHTML=`<div class="da-head"><div><span>AUDITORÍA DE DECISIONES</span><h3>Qué debates anticipamos bien</h3><p>Solo declaramos ganador entre proyecto y alternativa cuando exactamente uno de los dos entra en el XI oficial. Si juegan ambos o ninguno, el duelo queda sin resolver.</p></div><b>${s.resolved}/${s.debates} resueltos</b></div><div class="da-kpis"><div><span>Proyecto aguanta</span><b>${s.projectWins}</b></div><div class="alt"><span>Alternativa gana</span><b>${s.alternativeWins}</b></div><div><span>Sin resolver</span><b>${s.unresolved}</b></div><div><span>Tus cambios ganan</span><b>${s.userWins}/${s.userResolved}</b></div></div><div class="da-list">${visible.length?visible.map(r=>`<article class="${outcomeClass(r.debateOutcome)}"><div><span>${esc(r.slotLabel)}</span><em>${esc(r.levelLabel)}</em></div><b>${esc(display(r.project))} ↔ ${esc(display(r.alternative))}</b><small>${esc(outcomeLabel(r.debateOutcome))}</small><p>${r.debateOutcome==='alternative'?`${esc(display(r.alternative))} entra y ${esc(display(r.project))} no.`:r.debateOutcome==='project'?`${esc(display(r.project))} entra y la alternativa no.`:r.debateOutcome==='both'?'Los dos aparecen en el XI: no atribuimos el puesto a ninguno.':'Ninguno de los dos aparece en el XI: el puesto lo ocupa otra solución.'}</p></article>`).join(''):'<div class="da-empty"><span>No había duelos alternativos congelados.</span></div>'}</div><p class="da-note">Esto calibra nuestras alertas, no sustituye el 0–11 global del pronóstico. Con más jornadas veremos si “Debate fuerte” realmente anticipa cambios de titularidad.</p>`;
}
function renderSeason(){
  const root=ensureSeason();if(!root)return;const a=aggregate();
  if(!a.matches){root.innerHTML='<div class="da-empty"><b>CALIBRACIÓN DE DECISIONES</b><span>Empezará cuando tengamos al menos un snapshot previo y su XI oficial.</span></div>';return}
  const pct=v=>v===null?'—':`${Math.round(v*100)}%`,recent=a.audited.slice(0,5);
  root.innerHTML=`<div class="da-season-head"><div><span>CALIBRACIÓN DE DECISIONES</span><h3>¿Nuestras alertas de cambio sirven de verdad?</h3><p>Medimos únicamente duelos congelados antes del XI oficial y separamos los casos realmente resolubles.</p></div><b>${a.matches} partido${a.matches===1?'':'s'}</b></div><div class="da-season-kpis"><div><span>Alternativa vence</span><b>${pct(a.altRate)}</b><small>${a.altWins}/${a.resolved} duelos resueltos</small></div><div><span>Proyecto resiste</span><b>${a.resolved?pct(a.projectWins/a.resolved):'—'}</b><small>${a.projectWins}/${a.resolved}</small></div><div><span>Debate fuerte acierta cambio</span><b>${pct(a.strongAltRate)}</b><small>${a.strongAltWins}/${a.strongResolved} resueltos</small></div><div><span>Tus cambios vencen</span><b>${pct(a.userRate)}</b><small>${a.userWins}/${a.userResolved} comparables</small></div></div><div class="da-history">${recent.map(r=>`<div><span>${esc(r.label||label(r.matchId))}</span><b>${r.summary.alternativeWins} alt.</b><b>${r.summary.projectWins} proyecto</b><small>${r.summary.unresolved} sin resolver</small></div>`).join('')}</div><p class="da-note">Las tasas se calculan solo sobre duelos donde exactamente uno de los dos jugadores fue titular. “Ambos” y “ninguno” se conservan como información, pero no fuerzan un ganador.</p>`;
}
function render(){renderPrediction();if(document.getElementById('mi-temporada')?.classList.contains('active'))setTimeout(renderSeason,50)}
function emit(){document.dispatchEvent(new CustomEvent('rm-decision-audit-updated'))}
function onSaved(){setTimeout(()=>{capture('save');render()},140)}
function bootstrap(){const m=currentMatch(),mine=saved(),db=read();if(m&&mine?.xi&&!db[m.id])setTimeout(()=>{capture('late');render()},180);else{settle();render()}}
function install(){
  if(installed)return;if(!window.RMDecisionBoard||typeof showSection!=='function'){if(++attempts<90)setTimeout(install,100);return}
  installed=true;bootstrap();
  document.addEventListener('rm-local-prediction-updated',onSaved);
  document.addEventListener('rm-prediction-analytics-updated',()=>setTimeout(()=>{settle();render()},80));
  document.addEventListener('rm-decision-board-rendered',()=>{const m=currentMatch(),mine=saved(),db=read();if(m&&mine?.xi&&!db[m.id])setTimeout(()=>capture('late'),80)});
  ['rm-season-data-ready','rm-season-extension-ready','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(()=>{settle();render()},100)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){settle();render()}});
  window.RMDecisionAudit=Object.freeze({render,capture,settle,records,aggregate,current});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();