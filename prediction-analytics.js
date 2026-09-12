(()=>{
const KEY='rm_prediction_analytics_v1';
let installed=false,wrapAttempts=0,navWrapped=false,communityTimer=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function saved(){return safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:null,null)}
function officialSlots(){return safe(()=>window.RMOfficialXIBySlot,null)||safe(()=>typeof officialXIBySlot!=='undefined'&&officialXIBySlot?officialXIBySlot:null,null)}
function project(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>typeof rayoXI!=='undefined'?rayoXI:null,null)||safe(()=>typeof baseXI!=='undefined'?baseXI:null,null)||null}
function communityData(){return window.RMCommunityData||null}
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
function deadlineMs(){const m=match();return m?Date.parse(m.deadline||m.closesAt||''):NaN}
function communityXiFromData(data){
  const popular=data?.popularXI;if(!popular||typeof popular!=='object')return null;
  const xi=Object.fromEntries(Object.entries(popular).map(([slot,row])=>[slot,typeof row==='string'?row:row?.name||'']));
  return validXi(xi)?xi:null;
}
function communityIsFinal(data){
  const m=match(),same=!data?.match?.id||!m||data.match.id===m.id;
  return Boolean(same&&data?.match?.closed===true);
}
function captureCommunity(data=communityData(),source='community'){
  const m=match(),xi=communityXiFromData(data);if(!m||!xi||!communityIsFinal(data))return null;
  const db=read(),prior=db[m.id]||{};if(validXi(prior.communityXI))return prior;
  db[m.id]={...prior,matchId:m.id,rival:m.rival||prior.rival||'',label:prior.label||label(m.id),communityXI:cloneXi(xi),communityTotal:Number(data?.totalPredictions)||0,communityCapturedAt:new Date().toISOString(),communitySource:source};
  write(db);settle(m.id,db);emit();return db[m.id];
}
function capture(source='save'){
  const m=match(),mine=saved(),idea=project();if(!m||!validXi(mine?.xi)||!validXi(idea))return null;
  const db=read(),prior=db[m.id]||{},savedAt=mine.savedAt||new Date().toISOString(),late=source!=='save';
  db[m.id]={...prior,matchId:m.id,rival:m.rival||prior.rival||'',label:prior.label||label(m.id),userXI:cloneXi(mine.xi),projectXI:cloneXi(idea),userSavedAt:savedAt,capturedAt:new Date().toISOString(),snapshotLate:late};
  write(db);captureCommunity(communityData(),'capture');settle(m.id);emit();return read()[m.id]||db[m.id];
}
function settle(id=null,db=null){
  const m=match(),actual=official();if(!actual)return null;const store=db||read(),target=id||m?.id;if(!target||!store[target])return null;
  const rec=store[target],u=setScore(rec.userXI,actual),p=setScore(rec.projectXI,actual),c=setScore(rec.communityXI,actual),slots=officialSlots(),ue=exactScore(rec.userXI,slots),pe=exactScore(rec.projectXI,slots),ce=exactScore(rec.communityXI,slots);
  if(!u||!p)return null;
  store[target]={...rec,userScore:u.score,projectScore:p.score,edge:u.score-p.score,userHits:u.hits,userMisses:u.misses,projectHits:p.hits,projectMisses:p.misses,communityScore:c?.score??rec.communityScore??null,communityHits:c?.hits??rec.communityHits??[],communityMisses:c?.misses??rec.communityMisses??[],exactUser:ue?.score??null,exactProject:pe?.score??null,exactCommunity:ce?.score??rec.exactCommunity??null,exactPossible:ue?.possible??pe?.possible??ce?.possible??null,scoredAt:rec.scoredAt||new Date().toISOString()};
  write(store);return store[target];
}
function records(){
  const db=read(),m=match();if(m&&db[m.id])settle(m.id,db);
  return Object.values(read()).sort((a,b)=>String(b.userSavedAt||b.capturedAt||'').localeCompare(String(a.userSavedAt||a.capturedAt||'')));
}
function avg(rows,key){return rows.length?rows.reduce((s,r)=>s+r[key],0)/rows.length:null}
function triWinner(rows){
  if(!rows.length)return {leaders:[],text:'Sin muestra común'};
  const values=[['Tú',avg(rows,'userScore')],['Proyecto',avg(rows,'projectScore')],['Comunidad',avg(rows,'communityScore')]],best=Math.max(...values.map(([,v])=>v)),leaders=values.filter(([,v])=>v===best).map(([name])=>name);
  return {leaders,text:leaders.length===1?leaders[0]:`Empate ${leaders.join(' · ')}`};
}
function stats(){
  const pairRows=records().filter(r=>Number.isFinite(r.userScore)&&Number.isFinite(r.projectScore)),n=pairRows.length;
  const userAvg=n?avg(pairRows,'userScore'):null,projectAvg=n?avg(pairRows,'projectScore'):null,wins=pairRows.filter(r=>r.userScore>r.projectScore).length,draws=pairRows.filter(r=>r.userScore===r.projectScore).length,losses=pairRows.filter(r=>r.userScore<r.projectScore).length;
  const triRows=pairRows.filter(r=>Number.isFinite(r.communityScore)),tri={rows:triRows,n:triRows.length,userAvg:avg(triRows,'userScore'),projectAvg:avg(triRows,'projectScore'),communityAvg:avg(triRows,'communityScore')};tri.winner=triWinner(triRows);
  return {rows:pairRows,n,userAvg,projectAvg,wins,draws,losses,edge:userAvg===null?null:userAvg-projectAvg,tri};
}
function currentRecord(){const m=match();return m?records().find(r=>r.matchId===m.id)||null:null}
function roundWinner(rec){
  const candidates=[['Tú',rec?.userScore],['Proyecto',rec?.projectScore],['Comunidad',rec?.communityScore]].filter(([,v])=>Number.isFinite(v));if(candidates.length<2)return 'Esperando resultados';
  const best=Math.max(...candidates.map(([,v])=>v)),leaders=candidates.filter(([,v])=>v===best).map(([name])=>name);return leaders.length===1?`Gana ${leaders[0]}`:`Empate ${leaders.join(' · ')}`;
}
function communityStatus(rec){
  if(validXi(rec?.communityXI))return `${rec.communityTotal||0} pronósticos`;
  if(Date.now()<deadlineMs())return 'se congela al cierre';
  return 'consenso final pendiente';
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('predictionAnalytics');if(root)return root;
  root=document.createElement('section');root.id='predictionAnalytics';root.className='card pa-card';const anchor=document.getElementById('predictionPro')||section.querySelector('.prediction-hero');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const rec=currentRecord(),mine=saved(),idea=project(),hasBoth=validXi(mine?.xi)&&validXi(idea);
  if(!rec){
    root.innerHTML=`<div class="pa-head"><div><span>MEDIDOR DE ACIERTO</span><h3>Tú · Proyecto · Comunidad</h3><p>${hasBoth?'Al guardar congelaremos tu XI y la propuesta. El consenso de la comunidad quedará fijado al cierre.':'Completa y guarda tu XI para preparar la comparación.'}</p></div><b>0 jornadas</b></div><div class="pa-empty">La comparación histórica empieza al guardar un pronóstico completo.</div>`;return;
  }
  const scored=Number.isFinite(rec.userScore)&&Number.isFinite(rec.projectScore),communityScored=Number.isFinite(rec.communityScore),late=rec.snapshotLate;
  root.innerHTML=`<div class="pa-head"><div><span>MEDIDOR DE ACIERTO</span><h3>Tú · Proyecto · Comunidad</h3><p>${scored?'Tres referencias con la misma regla: 1 punto por cada titular acertado.':'Tu XI y el proyecto están congelados; la comunidad se fijará con su consenso final al cierre.'}</p></div><b>${scored?esc(roundWinner(rec)):'Pendiente'}</b></div><div class="pa-score-grid"><article><span>TU XI</span><strong>${scored?rec.userScore:'—'}<small>/11</small></strong><small>${scored?'titulares acertados':'guardado'}</small></article><article><span>PROYECTO</span><strong>${scored?rec.projectScore:'—'}<small>/11</small></strong><small>${scored?'titulares acertados':'referencia congelada'}</small></article><article><span>COMUNIDAD</span><strong>${communityScored?rec.communityScore:'—'}<small>/11</small></strong><small>${communityScored?`${rec.communityTotal||0} pronósticos`:esc(communityStatus(rec))}</small></article></div>${scored?`<div class="pa-round"><span>RESULTADO DE LA JORNADA</span><b>${esc(roundWinner(rec))}</b><small>Tú vs Proyecto: ${rec.edge>0?`+${rec.edge}`:rec.edge}</small></div>`:''}${Number.isFinite(rec.exactUser)&&Number.isFinite(rec.exactProject)?`<div class="pa-exact"><span>COINCIDENCIA POR PUESTO</span><b>Tú ${rec.exactUser}/${rec.exactPossible} · Proyecto ${rec.exactProject}/${rec.exactPossible}${Number.isFinite(rec.exactCommunity)?` · Comunidad ${rec.exactCommunity}/${rec.exactPossible}`:''}</b></div>`:''}${late?'<p class="pa-note">La referencia del proyecto se capturó al activar esta función porque tu XI ya estaba guardado; desde el próximo guardado la foto será exacta al momento del pronóstico.</p>':'<p class="pa-note">Tu XI y el proyecto se congelan al guardar. La comunidad se congela al cierre, cuando ya no admite más votos. Así el consenso final no puede cambiar después de conocer el once oficial.</p>'}`;
}
function ensureSeason(){
  const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('predictionAnalyticsSeason');if(block)return block;
  block=document.createElement('section');block.id='predictionAnalyticsSeason';block.className='card pa-season';const anchor=root.querySelector('.psp-kpis')||root.querySelector('.ph-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.prepend(block);return block;
}
function leaderboard(tri){
  if(!tri.n)return '<div class="pa-empty">La clasificación de tres empezará cuando tengamos un consenso comunitario final y el XI oficial del mismo partido.</div>';
  const rows=[{name:'Tú',avg:tri.userAvg},{name:'Proyecto',avg:tri.projectAvg},{name:'Comunidad',avg:tri.communityAvg}].sort((a,b)=>b.avg-a.avg||a.name.localeCompare(b.name,'es'));
  return `<div class="pa-leaderboard">${rows.map((r,i)=>`<div><span>#${i+1}</span><b>${r.name}</b><strong>${r.avg.toFixed(2)}<small>/11</small></strong></div>`).join('')}</div>`;
}
function renderSeason(){
  const root=ensureSeason();if(!root)return;const s=stats(),tri=s.tri,pending=records().filter(r=>!Number.isFinite(r.userScore)).length,recent=s.rows.slice(0,6);
  root.innerHTML=`<div class="pa-season-head"><div><span>TÚ · PROYECTO · COMUNIDAD</span><h3>¿Quién predice mejor el XI?</h3><p>La clasificación usa solo jornadas en las que existen resultados para los tres, para que las medias sean comparables.</p></div><b>${tri.n?esc(tri.winner.text):'Sin muestra común'}</b></div><div class="pa-season-kpis"><div><span>Tu media</span><b>${tri.userAvg===null?'—':tri.userAvg.toFixed(2)}</b><small>/11 · muestra común</small></div><div><span>Proyecto</span><b>${tri.projectAvg===null?'—':tri.projectAvg.toFixed(2)}</b><small>/11 · muestra común</small></div><div><span>Comunidad</span><b>${tri.communityAvg===null?'—':tri.communityAvg.toFixed(2)}</b><small>/11 · consenso final</small></div><div><span>Jornadas comunes</span><b>${tri.n}</b><small>${pending} pendientes de XI oficial</small></div></div>${leaderboard(tri)}${recent.length?`<div class="pa-history">${recent.map(r=>`<div><span>${esc(r.label||label(r.matchId))}</span><b>Tú ${r.userScore}/11</b><b>Proyecto ${r.projectScore}/11</b><b>Comunidad ${Number.isFinite(r.communityScore)?`${r.communityScore}/11`:'—'}</b><em class="${roundWinner(r).includes('Tú')?'win':roundWinner(r).includes('Proyecto')&&!roundWinner(r).includes('Empate')?'loss':'draw'}">${esc(roundWinner(r))}</em></div>`).join('')}</div>`:'<div class="pa-empty">Cuando tengamos el primer XI oficial cerrado aparecerá aquí la comparación jornada a jornada.</div>'}${s.n>tri.n?`<p class="pa-note">Hay ${s.n-tri.n} jornada${s.n-tri.n===1?'':'s'} anterior${s.n-tri.n===1?'':'es'} con Tú vs Proyecto pero sin consenso comunitario congelado; no entra${s.n-tri.n===1?'':'n'} en la clasificación de tres.</p>`:''}`;
}
function renderAll(){renderPrediction();if(document.getElementById('mi-temporada')?.classList.contains('active'))setTimeout(renderSeason,60)}
function emit(){document.dispatchEvent(new CustomEvent('rm-prediction-analytics-updated'))}
function wrapSave(){
  if(wrapAttempts++>40)return;const base=window.savePrediction;if(typeof base!=='function'){setTimeout(wrapSave,100);return}if(base.__paWrapped)return;
  const wrapped=function(...args){const before=saved()?.savedAt||null,out=base.apply(this,args);setTimeout(()=>{const after=saved();if(after?.savedAt&&after.savedAt!==before)capture('save');renderAll()},0);return out};wrapped.__paWrapped=true;window.savePrediction=wrapped;
}
function wrapNav(){
  if(navWrapped||typeof showSection!=='function')return;navWrapped=true;const base=showSection;showSection=function(id){const out=base(id);if(id==='prediccion')setTimeout(renderPrediction,0);if(id==='mi-temporada')setTimeout(renderSeason,120);return out}
}
async function refreshCommunityFreeze(){
  const m=match();if(!m||Date.now()<deadlineMs())return;
  if(captureCommunity(communityData(),'cached')){renderAll();return}
  const backend=safe(()=>typeof communityBackendAvailable==='function'&&communityBackendAvailable(),false);
  if(backend&&typeof window.loadCommunity==='function'){
    const data=await safe(()=>window.loadCommunity(true),null);if(data)captureCommunity(data,'deadline');
  }
  settle();renderAll();
}
function scheduleCommunityFreeze(){
  clearTimeout(communityTimer);const ts=deadlineMs();if(!Number.isFinite(ts))return;
  const delay=ts-Date.now()+1500;if(delay>0&&delay<2147483647)communityTimer=setTimeout(refreshCommunityFreeze,delay);else if(delay<=0)setTimeout(refreshCommunityFreeze,250);
}
function bootstrap(){
  const m=match(),mine=saved();if(m&&validXi(mine?.xi)&&!read()[m.id])capture('late');captureCommunity(communityData(),'bootstrap');settle();renderAll();scheduleCommunityFreeze();
}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('prediccion')){setTimeout(install,100);return}
  installed=true;wrapSave();wrapNav();bootstrap();
  ['rm-local-prediction-updated','rm-season-data-ready','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(()=>{settle();renderAll()},80)));
  document.addEventListener('rm-community-updated',ev=>setTimeout(()=>{captureCommunity(ev.detail||communityData(),'event');settle();renderAll()},80));
  document.addEventListener('rm-prediction-analytics-updated',()=>setTimeout(renderAll,0));
  window.addEventListener('storage',e=>{if(!e.key||e.key===KEY||e.key.startsWith('rm_prediction_'))setTimeout(renderAll,0)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshCommunityFreeze();settle();renderAll()}});
  window.RMPredictionAnalytics=Object.freeze({render:renderAll,records,stats,capture,captureCommunity,settle,refreshCommunityFreeze});
}
setTimeout(install,120);
})();