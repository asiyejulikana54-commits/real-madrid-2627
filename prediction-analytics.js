(()=>{
const KEY='rm_prediction_analytics_v1';
let installed=false,wrapAttempts=0,navWrapped=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function saved(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:null,null)}
function officialSlots(){return safe(()=>window.RMOfficialXIBySlot,null)||safe(()=>typeof officialXIBySlot!=='undefined'&&officialXIBySlot?officialXIBySlot:null,null)}
function project(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>typeof rayoXI!=='undefined'?rayoXI:null,null)||safe(()=>typeof baseXI!=='undefined'?baseXI:null,null)||null}
function cloneXi(xi){return xi&&typeof xi==='object'?Object.fromEntries(Object.entries(xi).map(([k,v])=>[k,v||''])):null}
function xiValues(xi){return Object.values(xi||{}).filter(Boolean)}
function validXi(xi){const v=xiValues(xi);return v.length===11&&new Set(v.map(canonical)).size===11}
function setScore(xi,actual){
  if(!validXi(xi)||!Array.isArray(actual))return null;
  const actualSet=new Set(actual.map(canonical)),pred=xiValues(xi),hits=pred.filter(n=>actualSet.has(canonical(n))),misses=pred.filter(n=>!actualSet.has(canonical(n)));
  return {score:hits.length,hits,misses};
}
function exactScore(xi,slots){
  if(!xi||!slots||typeof slots!=='object')return null;
  const keys=Object.keys(slots).filter(k=>slots[k]);if(!keys.length)return null;
  const hits=keys.filter(k=>xi[k]&&canonical(xi[k])===canonical(slots[k]));
  return {score:hits.length,possible:keys.length,hits};
}
function label(id){
  const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`;
}
function capture(source='save'){
  const m=match(),mine=saved(),idea=project();if(!m||!validXi(mine?.xi)||!validXi(idea))return null;
  const db=read(),prior=db[m.id]||{},savedAt=mine.savedAt||new Date().toISOString(),late=source!=='save';
  db[m.id]={...prior,matchId:m.id,rival:m.rival||prior.rival||'',label:prior.label||label(m.id),userXI:cloneXi(mine.xi),projectXI:cloneXi(idea),userSavedAt:savedAt,capturedAt:new Date().toISOString(),snapshotLate:late};
  write(db);settle(m.id,db);emit();return db[m.id];
}
function settle(id=null,db=null){
  const m=match(),actual=official();if(!actual)return null;const store=db||read(),target=id||m?.id;if(!target||!store[target])return null;
  const rec=store[target],u=setScore(rec.userXI,actual),p=setScore(rec.projectXI,actual),slots=officialSlots(),ue=exactScore(rec.userXI,slots),pe=exactScore(rec.projectXI,slots);
  if(!u||!p)return null;
  store[target]={...rec,userScore:u.score,projectScore:p.score,edge:u.score-p.score,userHits:u.hits,userMisses:u.misses,projectHits:p.hits,projectMisses:p.misses,exactUser:ue?.score??null,exactProject:pe?.score??null,exactPossible:ue?.possible??pe?.possible??null,scoredAt:rec.scoredAt||new Date().toISOString()};
  write(store);return store[target];
}
function records(){
  const db=read(),m=match();if(m&&db[m.id])settle(m.id,db);
  return Object.values(read()).sort((a,b)=>String(b.userSavedAt||b.capturedAt||'').localeCompare(String(a.userSavedAt||a.capturedAt||'')));
}
function stats(){
  const rows=records().filter(r=>Number.isFinite(r.userScore)&&Number.isFinite(r.projectScore)),n=rows.length;
  const userAvg=n?rows.reduce((s,r)=>s+r.userScore,0)/n:null,projectAvg=n?rows.reduce((s,r)=>s+r.projectScore,0)/n:null;
  const wins=rows.filter(r=>r.userScore>r.projectScore).length,draws=rows.filter(r=>r.userScore===r.projectScore).length,losses=rows.filter(r=>r.userScore<r.projectScore).length;
  return {rows,n,userAvg,projectAvg,wins,draws,losses,edge:userAvg===null?null:userAvg-projectAvg};
}
function currentRecord(){const m=match();return m?records().find(r=>r.matchId===m.id)||null:null}
function resultText(rec){
  if(!Number.isFinite(rec?.userScore)||!Number.isFinite(rec?.projectScore))return 'Esperando el XI oficial';
  if(rec.edge>0)return `Tú +${rec.edge}`;if(rec.edge<0)return `Proyecto +${Math.abs(rec.edge)}`;return 'Empate';
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('predictionAnalytics');if(root)return root;
  root=document.createElement('section');root.id='predictionAnalytics';root.className='card pa-card';const anchor=document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const rec=currentRecord(),mine=saved(),idea=project(),hasBoth=validXi(mine?.xi)&&validXi(idea);
  if(!rec){
    root.innerHTML=`<div class="pa-head"><div><span>MEDIDOR DE ACIERTO</span><h3>Tú vs nuestra propuesta</h3><p>${hasBoth?'La próxima vez que guardes, congelaremos ambos XI para compararlos con el oficial.':'Completa y guarda tu XI para preparar la comparación.'}</p></div><b>0 jornadas</b></div><div class="pa-empty">La comparación histórica empieza al guardar un pronóstico completo.</div>`;return;
  }
  const scored=Number.isFinite(rec.userScore)&&Number.isFinite(rec.projectScore),late=rec.snapshotLate;
  root.innerHTML=`<div class="pa-head"><div><span>MEDIDOR DE ACIERTO</span><h3>Tú vs nuestra propuesta</h3><p>${scored?'Ya podemos medir quién estuvo más cerca del once oficial.':'Ambos XI quedan congelados y se puntuarán cuando aparezca el once oficial.'}</p></div><b>${esc(resultText(rec))}</b></div><div class="pa-score-grid"><article><span>TU XI</span><strong>${scored?rec.userScore:'—'}<small>/11</small></strong><small>${scored?'titulares acertados':'guardado'}</small></article><article><span>NUESTRA PROPUESTA</span><strong>${scored?rec.projectScore:'—'}<small>/11</small></strong><small>${scored?'titulares acertados':'referencia congelada'}</small></article><article><span>DIFERENCIA</span><strong>${scored?(rec.edge>0?`+${rec.edge}`:rec.edge):'—'}</strong><small>${scored?(rec.edge>0?'a tu favor':rec.edge<0?'a favor del proyecto':'empate'):'pendiente'}</small></article></div>${Number.isFinite(rec.exactUser)&&Number.isFinite(rec.exactProject)?`<div class="pa-exact"><span>COINCIDENCIA POR PUESTO</span><b>Tú ${rec.exactUser}/${rec.exactPossible} · Proyecto ${rec.exactProject}/${rec.exactPossible}</b></div>`:''}${late?'<p class="pa-note">La referencia del proyecto se capturó al activar esta función porque tu XI ya estaba guardado; desde el próximo guardado la foto será exacta al momento del pronóstico.</p>':'<p class="pa-note">Medimos presencia en el XI oficial, no posición. Si en el futuro registramos el once oficial por puestos, añadiremos también esa precisión sin cambiar la puntuación principal.</p>'}`;
}
function ensureSeason(){
  const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('predictionAnalyticsSeason');if(block)return block;
  block=document.createElement('section');block.id='predictionAnalyticsSeason';block.className='card pa-season';const anchor=root.querySelector('.psp-kpis')||root.querySelector('.ph-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.prepend(block);return block;
}
function renderSeason(){
  const root=ensureSeason();if(!root)return;const s=stats(),pending=records().filter(r=>!Number.isFinite(r.userScore)).length;
  const recent=s.rows.slice(0,5);
  root.innerHTML=`<div class="pa-season-head"><div><span>TÚ VS PROYECTO</span><h3>¿Quién predice mejor el XI?</h3><p>Comparamos exactamente la predicción que guardaste con la propuesta del proyecto congelada ese mismo día.</p></div><b>${s.n?s.edge>0?`Tú +${s.edge.toFixed(2)}`:s.edge<0?`Proyecto +${Math.abs(s.edge).toFixed(2)}`:'Empate':'Sin jornadas cerradas'}</b></div><div class="pa-season-kpis"><div><span>Tu media</span><b>${s.userAvg===null?'—':s.userAvg.toFixed(2)}</b><small>/11</small></div><div><span>Proyecto</span><b>${s.projectAvg===null?'—':s.projectAvg.toFixed(2)}</b><small>/11</small></div><div><span>Balance</span><b>${s.wins}-${s.draws}-${s.losses}</b><small>ganas · empates · pierdes</small></div><div><span>Pendientes</span><b>${pending}</b><small>sin XI oficial</small></div></div>${recent.length?`<div class="pa-history">${recent.map(r=>`<div><span>${esc(r.label||label(r.matchId))}</span><b>${r.userScore}/11</b><i>vs</i><b>${r.projectScore}/11</b><em class="${r.edge>0?'win':r.edge<0?'loss':'draw'}">${r.edge>0?`+${r.edge}`:r.edge<0?`${r.edge}`:'='}</em></div>`).join('')}</div>`:'<div class="pa-empty">Cuando tengamos el primer XI oficial cerrado aparecerá aquí la comparación jornada a jornada.</div>'}`;
}
function renderAll(){renderPrediction();if(document.getElementById('mi-temporada')?.classList.contains('active'))setTimeout(renderSeason,60)}
function emit(){document.dispatchEvent(new CustomEvent('rm-prediction-analytics-updated'))}
function wrapSave(){
  if(wrapAttempts++>40)return;const base=window.savePrediction;if(typeof base!=='function'){setTimeout(wrapSave,100);return}if(base.__paWrapped)return;
  const wrapped=function(...args){const out=base.apply(this,args);setTimeout(()=>{capture('save');renderAll()},0);return out};wrapped.__paWrapped=true;window.savePrediction=wrapped;
}
function wrapNav(){
  if(navWrapped||typeof showSection!=='function')return;navWrapped=true;const base=showSection;showSection=function(id){const out=base(id);if(id==='prediccion')setTimeout(renderPrediction,0);if(id==='mi-temporada')setTimeout(renderSeason,120);return out}
}
function bootstrap(){
  const m=match(),mine=saved();if(m&&validXi(mine?.xi)&&!read()[m.id])capture('late');else settle();renderAll();
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('prediccion')){setTimeout(install,100);return}
  installed=true;wrapSave();wrapNav();bootstrap();
  ['rm-local-prediction-updated','rm-community-updated','rm-season-data-ready','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(()=>{settle();renderAll()},80)));
  document.addEventListener('rm-prediction-analytics-updated',()=>setTimeout(renderAll,0));
  window.addEventListener('storage',e=>{if(!e.key||e.key===KEY||e.key.startsWith('rm_prediction_'))setTimeout(renderAll,0)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){settle();renderAll()}});
  window.RMPredictionAnalytics=Object.freeze({render:renderAll,records,stats,capture,settle});
}
setTimeout(install,120);
})();
