(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function avg(rows,key){const vals=(rows||[]).map(r=>Number(r?.[key])).filter(Number.isFinite);return vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}
function signed(v,digits=2){return Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(digits)}`:'—'}
function pct(v){return Number.isFinite(v)?`${Math.round(v*100)}%`:'—'}
function zoneLabel(id){return id==='POR'?'Portería':id==='DEF'?'Defensa':id==='MED'?'Medio':id==='ATA'?'Ataque':id}
function profile(){return safe(()=>window.RMDecisionProfile?.state?.(),null)}
function archive(){return safe(()=>window.RMReviewArchive?.state?.(),null)}
function sampleLabel(n){return n>=6?'MUESTRA ALTA':n>=3?'MUESTRA ÚTIL':n>=1?'PROVISIONAL':'SIN MUESTRA'}
function trendInsight(strict){
  const recent=strict.slice(0,3),prior=strict.slice(3);if(recent.length<3||prior.length<2)return {priority:15,kind:'learning',title:'Tendencia reciente aún en construcción',copy:`Necesitamos 3 jornadas recientes y al menos 2 anteriores para comparar evolución sin confundir una racha corta con una tendencia.`,sample:`${recent.length}/3 recientes · ${prior.length}/2 anteriores`};
  const recentAvg=avg(recent,'userScore'),priorAvg=avg(prior,'userScore'),delta=recentAvg-priorAvg,edgeRecent=avg(recent,'edge'),edgePrior=avg(prior,'edge'),edgeDelta=edgeRecent-edgePrior;
  if(delta>=.5)return {priority:80,kind:'positive',title:'Tu acierto reciente está subiendo',copy:`En las últimas 3 jornadas promedias ${recentAvg.toFixed(2)}/11, ${signed(delta)} respecto a las anteriores. Tu ventaja relativa frente al Proyecto cambia ${signed(edgeDelta)} aciertos.`,sample:`n=3 vs n=${prior.length}`};
  if(delta<=-.5)return {priority:78,kind:'caution',title:'Conviene revisar la racha reciente',copy:`En las últimas 3 jornadas promedias ${recentAvg.toFixed(2)}/11, ${signed(delta)} respecto a las anteriores. No lo tratamos como tendencia estable todavía: es una señal para revisar decisiones, no una predicción.`,sample:`n=3 vs n=${prior.length}`};
  return {priority:55,kind:'neutral',title:'Rendimiento reciente estable',copy:`Tus últimas 3 jornadas (${recentAvg.toFixed(2)}/11) están cerca de tu tramo anterior (${priorAvg.toFixed(2)}/11). La diferencia frente al Proyecto cambia ${signed(edgeDelta)} aciertos.`,sample:`n=3 vs n=${prior.length}`};
}
function zoneInsight(p){
  const ready=(p?.zones||[]).filter(z=>z.resolved>=3&&Number.isFinite(z.rate)).sort((a,b)=>b.rate-a.rate||b.resolved-a.resolved);if(!ready.length)return {priority:20,kind:'learning',title:'Aún no hay una línea suficientemente entrenada',copy:'Esperamos al menos 3 cambios resueltos en una misma línea antes de convertir Portería, Defensa, Medio o Ataque en una conclusión.',sample:`mejor muestra actual n=${Math.max(0,...(p?.zones||[]).map(z=>z.resolved||0))}`};
  const best=ready[0],worst=ready[ready.length-1],gap=best.rate-worst.rate;
  if(ready.length>=2&&gap>=.25)return {priority:86,kind:'positive',title:`Tu mejor terreno es ${zoneLabel(best.id)}`,copy:`Tus cambios en ${zoneLabel(best.id).toLowerCase()} ganan ${best.wins}/${best.resolved} (${pct(best.rate)}). En ${zoneLabel(worst.id).toLowerCase()} vas ${worst.wins}/${worst.resolved} (${pct(worst.rate)}): ahí merece la pena exigir más evidencia antes de romper con el Proyecto.`,sample:`n=${best.resolved} vs n=${worst.resolved}`};
  return {priority:62,kind:'neutral',title:`${zoneLabel(best.id)} es tu línea con mejor registro`,copy:`Tus cambios resueltos allí van ${best.wins}/${best.resolved} (${pct(best.rate)}). No destacamos una línea débil porque todavía no hay una diferencia suficientemente clara entre muestras útiles.`,sample:`n=${best.resolved}`};
}
function differentialInsight(strict){
  const you=strict.reduce((n,r)=>n+(r.youSaw?.length||0),0),project=strict.reduce((n,r)=>n+(r.projectSaw?.length||0),0),n=strict.length;if(n<2)return {priority:10,kind:'learning',title:'Diferenciales todavía sin muestra',copy:'Necesitamos al menos 2 jornadas estrictas para comparar cuántos titulares exclusivos viste tú y cuántos vio el Proyecto.',sample:`n=${n}/2`};
  const delta=you-project;
  if(delta>=2)return {priority:74,kind:'positive',title:'Estás encontrando titulares que el Proyecto deja fuera',copy:`En ${n} jornadas estrictas detectaste ${you} titulares diferenciales frente a ${project} del Proyecto. Esta lectura mide aciertos exclusivos, no todos los aciertos del XI.`,sample:`${you} vs ${project} diferenciales`};
  if(delta<=-2)return {priority:72,kind:'caution',title:'El Proyecto está ganando los diferenciales',copy:`En ${n} jornadas estrictas el Proyecto detectó ${project} titulares exclusivos frente a ${you} tuyos. Es la zona más clara para revisar por qué te estás separando de su XI.`,sample:`${you} vs ${project} diferenciales`};
  return {priority:50,kind:'neutral',title:'Los diferenciales están equilibrados',copy:`Tú has detectado ${you} titulares exclusivos y el Proyecto ${project}. De momento ninguno está creando una ventaja sostenida por esta vía.`,sample:`n=${n}`};
}
function strongInsight(p){
  const n=p?.strongResolved?.length||0,w=p?.strongWins?.length||0;if(n<3)return null;const rate=w/n;
  if(rate>=.67)return {priority:76,kind:'positive',title:'Tus cambios en debates fuertes están funcionando',copy:`Cuando te separas del Proyecto en un debate fuerte, tus elecciones han ganado ${w}/${n} duelos resueltos (${pct(rate)}).`,sample:`n=${n} debates fuertes`};
  if(rate<=.33)return {priority:75,kind:'caution',title:'Los debates fuertes piden más prudencia',copy:`Tus cambios en debates fuertes han ganado ${w}/${n} duelos resueltos (${pct(rate)}). Antes de romper con el Proyecto aquí, conviene revisar Comparador y señales recientes.`,sample:`n=${n} debates fuertes`};
  return {priority:48,kind:'neutral',title:'Debates fuertes sin ventaja clara',copy:`Tus cambios van ${w}/${n} en debates fuertes. El histórico todavía no favorece de forma clara ni desafiar ni mantener el Proyecto.`,sample:`n=${n}`};
}
function calibrationInsight(p){
  const n=p?.resolved?.length||0;if(n<4)return null;const rate=p.changeRate;
  if(rate>=.65)return {priority:58,kind:'positive',title:'Tu ruptura con el Proyecto tiene buen retorno',copy:`Tus cambios resolubles ganan ${p.wins.length}/${n} (${pct(rate)}). Seguimos mostrando el tamaño de muestra porque esta tasa describe el pasado, no garantiza el próximo XI.`,sample:`n=${n} cambios resueltos`};
  if(rate<=.35)return {priority:60,kind:'caution',title:'Estás pagando algunos cambios de más',copy:`Tus cambios resolubles ganan ${p.wins.length}/${n} (${pct(rate)}). El histórico sugiere revisar mejor las rupturas antes de guardar el XI.`,sample:`n=${n} cambios resueltos`};
  return null;
}
function state(){
  const p=profile(),a=archive();if(!p||!a)return null;const strict=(a.strict||[]).slice(),recent=strict.slice(0,3),recentAvg=avg(recent,'userScore'),seasonAvg=avg(strict,'userScore'),recentEdge=avg(recent,'edge'),seasonEdge=avg(strict,'edge');
  const candidates=[trendInsight(strict),zoneInsight(p),differentialInsight(strict),strongInsight(p),calibrationInsight(p)].filter(Boolean).sort((x,y)=>y.priority-x.priority),insights=candidates.slice(0,3);
  const headline=insights[0]?.copy||'Todavía estamos construyendo una muestra suficiente para aprender de tu temporada.';
  const diffYou=strict.reduce((n,r)=>n+(r.youSaw?.length||0),0),diffProject=strict.reduce((n,r)=>n+(r.projectSaw?.length||0),0);
  const signature=`${strict.length}:${p.resolved?.length||0}:${insights.map(i=>i.title).join('|')}`;
  return {profile:p,archive:a,strict,recent,strictCount:strict.length,recentAvg,seasonAvg,recentEdge,seasonEdge,diffYou,diffProject,insights,headline,signature};
}
function ensure(){const root=document.getElementById('personalHubContent');if(!root)return null;let block=document.getElementById('seasonLearning');if(block)return block;block=document.createElement('section');block.id='seasonLearning';block.className='card season-learning';const anchor=document.getElementById('decisionProfile')||document.getElementById('reviewArchive')||root.querySelector('.psp-kpis');if(anchor)anchor.insertAdjacentElement('afterend',block);else root.appendChild(block);return block}
function insightCard(i){return `<article class="sl-insight ${esc(i.kind)}"><div><span>${esc(i.kind==='positive'?'SEÑAL FAVORABLE':i.kind==='caution'?'REVISAR':'LECTURA')}</span><em>${esc(i.sample)}</em></div><h4>${esc(i.title)}</h4><p>${esc(i.copy)}</p></article>`}
function render(){
  if(!document.getElementById('mi-temporada')?.classList.contains('active'))return false;const root=ensure(),s=state();if(!root||!s)return false;
  if(!s.strictCount){root.innerHTML='<div class="sl-empty"><b>APRENDIZAJE DE TEMPORADA</b><span>Empezará cuando tengamos jornadas congeladas antes del XI oficial. No reconstruimos el pasado ni aprendemos de borradores vistos a posteriori.</span></div>';return true}
  const recent=s.recentAvg===null?'—':s.recentAvg.toFixed(2),season=s.seasonAvg===null?'—':s.seasonAvg.toFixed(2),edge=s.recentEdge===null?'—':signed(s.recentEdge);
  root.innerHTML=`<div class="sl-head"><div><span>APRENDIZAJE DE TEMPORADA</span><h3>Qué está aprendiendo la app de tus decisiones</h3><p>Convierte el histórico auditado en conclusiones accionables, siempre con tamaño de muestra visible. Describe tu comportamiento pasado; no inventa probabilidades futuras.</p></div><b>${s.strictCount}<small> jornadas estrictas</small></b></div><div class="sl-kpis"><div><span>Últimas 3</span><b>${recent}</b><small>media de aciertos</small></div><div><span>Temporada</span><b>${season}</b><small>media estricta</small></div><div><span>Ventaja reciente</span><b>${edge}</b><small>vs Proyecto · aciertos</small></div><div><span>Diferenciales</span><b>${s.diffYou}-${s.diffProject}</b><small>tú vs Proyecto</small></div></div><div class="sl-grid">${s.insights.map(insightCard).join('')}</div><div class="sl-actions"><button type="button" class="btn" data-sl-profile>Ver perfil de decisiones</button><button type="button" class="btn" data-sl-archive>Ver jornadas</button></div><p class="sl-note">Una lectura por línea solo se considera útil desde 3 cambios resueltos. Las tendencias recientes necesitan 3 jornadas recientes y al menos 2 anteriores. Los snapshots tardíos quedan fuera.</p>`;
  root.querySelector('[data-sl-profile]')?.addEventListener('click',()=>document.getElementById('decisionProfile')?.scrollIntoView?.({behavior:'smooth',block:'start'}));root.querySelector('[data-sl-archive]')?.addEventListener('click',()=>document.getElementById('reviewArchive')?.scrollIntoView?.({behavior:'smooth',block:'start'}));
  document.dispatchEvent(new CustomEvent('rm-season-learning-rendered',{detail:{strict:s.strictCount,recentAvg:s.recentAvg,seasonAvg:s.seasonAvg,headline:s.headline,signature:s.signature}}));return true;
}
function install(){
  if(installed)return;if(!window.RMDecisionProfile||!window.RMReviewArchive||!document.getElementById('mi-temporada')){if(++attempts<140)setTimeout(install,100);return}
  installed=true;render();['rm-decision-profile-rendered','rm-review-archive-rendered','rm-decision-audit-updated','rm-prediction-analytics-updated','rm-season-data-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,100)));document.addEventListener('click',e=>{if(e.target?.closest?.('[data-section="mi-temporada"]'))setTimeout(render,760)},true);window.RMSeasonLearning=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
