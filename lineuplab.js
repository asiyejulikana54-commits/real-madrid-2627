(()=>{
const LAB_SECTION=['laboratorio','⚗','Laboratorio XI','Laboratorio de XI','Genera onces por datos y compáralos con nuestras ideas tácticas.'];
let insertAt=sections.findIndex(s=>s[0]==='once');
if(!sections.some(s=>s[0]==='laboratorio'))sections.splice(Math.max(0,insertAt),0,LAB_SECTION);

const LAB_CRITERIA={
  balance:{label:'Equilibrio',desc:'45% rendimiento · 30% muestra · 25% eficiencia.',short:'Balance'},
  power:{label:'Power RM',desc:'Media ajustada progresivamente por tamaño de muestra.',short:'Power'},
  rating:{label:'Media',desc:'Prioriza la media acumulada actual del panel.',short:'Media'},
  minutes:{label:'Minutos',desc:'Prioriza a quienes más han jugado.',short:'Minutos'},
  efficiency:{label:'Eficiencia',desc:'Prioriza menor número de minutos por punto de aporte.',short:'Min/punto'}
};
const LAB_BASELINES={rayo:'Nuestra idea Rayo',base:'XI base',current:'Constructor actual'};
let labCriterion='balance',labMinMinutes=0,labBaseline='rayo',labResult=null;

function lEsc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function lMetric(p){return metricFor(p)}
function lRating(p){const m=lMetric(p);return currentRating(m)}
function lPower(p){const m=lMetric(p),r=lRating(p);if(!m||r===null)return null;const sample=Math.min(m.minutes,450)/450;return r*(.75+.25*sample)}
function lSample(p){const m=lMetric(p);return m?Math.min(m.minutes,450)/450:0}
const LAB_METRICS=players.map(p=>{const m=lMetric(p),r=lRating(p);return m&&r!==null?{p,m,r,power:lPower(p)}:null}).filter(Boolean);
const rMin=Math.min(...LAB_METRICS.map(x=>x.r)),rMax=Math.max(...LAB_METRICS.map(x=>x.r));
const eMin=Math.min(...LAB_METRICS.map(x=>x.m.minPerPoint)),eMax=Math.max(...LAB_METRICS.map(x=>x.m.minPerPoint));
function norm(v,min,max){return max===min?10:10*(v-min)/(max-min)}
function factors(p){
  const m=lMetric(p),r=lRating(p);if(!m||r===null)return null;
  return {rating:norm(r,rMin,rMax),sample:Math.min(m.minutes,450)/45,efficiency:norm(eMax-m.minPerPoint,0,eMax-eMin)};
}
function lScore(p,criterion=labCriterion){
  const m=lMetric(p),r=lRating(p);if(!m||r===null)return null;
  if(criterion==='power')return lPower(p);
  if(criterion==='rating')return r;
  if(criterion==='minutes')return m.minutes;
  if(criterion==='efficiency')return 20-m.minPerPoint;
  const f=factors(p);return .45*f.rating+.30*f.sample+.25*f.efficiency;
}
function lScoreDisplay(p,criterion=labCriterion){
  const m=lMetric(p),r=lRating(p);if(!m||r===null)return '—';
  if(criterion==='minutes')return `${m.minutes}'`;
  if(criterion==='efficiency')return m.minPerPoint.toFixed(2);
  return lScore(p,criterion).toFixed(2);
}
function eligibleForSlot(p,slot){return p.eligible.includes(slot[4])}
function candidates(slot,criterion,minMinutes){
  const list=players.filter(p=>eligibleForSlot(p,slot)&&lMetric(p)&&lRating(p)!==null);
  const filtered=list.filter(p=>lMetric(p).minutes>=minMinutes),fallback=filtered.length?filtered:list;
  return fallback.map(p=>({p,score:lScore(p,criterion)})).filter(x=>x.score!==null).sort((a,b)=>b.score-a.score);
}
function optimizeXI(criterion,minMinutes){
  const ordered=slots.map((slot,index)=>({slot,index,cands:candidates(slot,criterion,minMinutes)})).sort((a,b)=>a.cands.length-b.cands.length);
  let best=null,bestScore=-Infinity;
  const maxRemain=ordered.map((_,i)=>ordered.slice(i).reduce((s,x)=>s+(x.cands[0]?.score||0),0));
  function dfs(i,used,assign,total,fallbacks){
    if(i===ordered.length){if(total>bestScore){bestScore=total;best={...assign};best.__fallbacks=[...fallbacks]}return}
    if(total+maxRemain[i]<=bestScore)return;
    const item=ordered[i];
    for(const c of item.cands){
      if(used.has(c.p.name))continue;
      const m=lMetric(c.p),isFallback=minMinutes>0&&m.minutes<minMinutes;
      used.add(c.p.name);assign[item.slot[0]]=c.p.name;if(isFallback)fallbacks.push(item.slot[0]);
      dfs(i+1,used,assign,total+c.score,fallbacks);
      if(isFallback)fallbacks.pop();delete assign[item.slot[0]];used.delete(c.p.name);
    }
  }
  dfs(0,new Set(),{},0,[]);
  if(!best)return {xi:{},score:0,fallbacks:[]};
  const fallbacks=best.__fallbacks||[];delete best.__fallbacks;return {xi:best,score:bestScore,fallbacks};
}
function xiValues(xi){return slots.map(s=>xi?.[s[0]]).filter(Boolean)}
function overlap(a,b){const A=new Set(xiValues(a)),B=new Set(xiValues(b));return [...A].filter(x=>B.has(x)).length}
function sameXI(a,b){return slots.every(s=>(a?.[s[0]]||'')===(b?.[s[0]]||''))}
function criterionRank(){return [...players].filter(p=>lScore(p)!==null).sort((a,b)=>lScore(b)-lScore(a))}
function whyText(p){const m=lMetric(p),r=lRating(p),power=lPower(p);if(!m||r===null)return 'Sin muestra';
  if(labCriterion==='minutes')return `${m.minutes} min acumulados`;
  if(labCriterion==='efficiency')return `${m.minPerPoint.toFixed(2)} min/punto`;
  if(labCriterion==='rating')return `Media ${r.toFixed(2)}`;
  if(labCriterion==='power')return `Power ${power.toFixed(2)} · ${m.minutes} min`;
  const f=factors(p),dominant=[['Rendimiento',f.rating],['Muestra',f.sample],['Eficiencia',f.efficiency]].sort((a,b)=>b[1]-a[1])[0][0];
  return `${dominant} · media ${r.toFixed(2)} · ${m.minutes} min`;
}
function safeCurrentXI(){try{return typeof currentXI==='function'?currentXI():{}}catch{return {}}}
function safePredictionXI(){try{return typeof currentPredictionXI==='function'?currentPredictionXI():{}}catch{return {}}}
function baselineXI(){if(labBaseline==='base')return baseXI;if(labBaseline==='current'){const xi=safeCurrentXI();return xiValues(xi).length?xi:baseXI}return rayoXI}
function xiSummary(xi){
  const rows=xiValues(xi).map(name=>players.find(p=>p.name===name)).filter(Boolean).map(p=>({p,m:lMetric(p),r:lRating(p),power:lPower(p),sample:lSample(p)})).filter(x=>x.m&&x.r!==null);
  const avg=key=>rows.length?rows.reduce((s,x)=>s+x[key],0)/rows.length:null;
  const effRows=rows.filter(x=>Number.isFinite(x.m.minPerPoint));
  return {n:rows.length,rating:avg('r'),power:avg('power'),sample:avg('sample'),minutes:rows.reduce((s,x)=>s+x.m.minutes,0),efficiency:effRows.length?effRows.reduce((s,x)=>s+x.m.minPerPoint,0)/effRows.length:null,short:rows.filter(x=>x.m.minutes<90).length};
}
function confidence(summary,fallbacks=[]){
  if(fallbacks.length||summary.short>=2||(summary.sample??0)<.45)return {label:'MUESTRA LIMITADA',cls:'low',text:'Varias decisiones dependen todavía de pocos minutos.'};
  if((summary.sample??0)<.72)return {label:'RESPALDO MEDIO',cls:'mid',text:'La combinación tiene datos útiles, pero aún no toda la muestra está consolidada.'};
  return {label:'RESPALDO ALTO',cls:'high',text:'La mayor parte del XI está respaldada por una muestra amplia.'};
}
function signed(v,d=2,suffix=''){if(!Number.isFinite(v))return '—';return `${v>0?'+':''}${v.toFixed(d)}${suffix}`}
function deltaClass(v,betterPositive=true){if(!Number.isFinite(v)||Math.abs(v)<.005)return 'flat';return (betterPositive?v>0:v<0)?'up':'down'}
function compareSummary(lab,base){return {power:lab.power-base.power,rating:lab.rating-base.rating,sample:(lab.sample-base.sample)*100,minutes:lab.minutes-base.minutes,efficiency:base.efficiency-lab.efficiency}}
function slotChanges(xi,baseline){return slots.map(s=>{const incoming=xi[s[0]],outgoing=baseline?.[s[0]];if(!incoming||incoming===outgoing)return null;const pin=players.find(p=>p.name===incoming),pout=players.find(p=>p.name===outgoing),mi=pin?lMetric(pin):null,mo=pout?lMetric(pout):null;return {slot:s,label:s[1],incoming,outgoing,pin,pout,power:pin&&pout?lPower(pin)-lPower(pout):null,rating:pin&&pout?lRating(pin)-lRating(pout):null,sample:pin&&pout?(lSample(pin)-lSample(pout))*100:null,efficiency:mi&&mo?mo.minPerPoint-mi.minPerPoint:null,short:Boolean(mi&&mi.minutes<90)}}).filter(Boolean)}
function changeHtml(change){return `<div class="lab-change ${change.short?'short':''}"><div class="lab-change-head"><span>${change.label}</span><b>${lEsc(displayName(change.outgoing||'—'))} → ${lEsc(displayName(change.incoming))}</b>${change.short?'<em>Muestra corta</em>':''}</div><div class="lab-change-metrics"><span class="${deltaClass(change.power)}"><small>Power</small><b>${signed(change.power)}</b></span><span class="${deltaClass(change.rating)}"><small>Media</small><b>${signed(change.rating)}</b></span><span class="${deltaClass(change.sample)}"><small>Muestra</small><b>${signed(change.sample,0,' pp')}</b></span><span class="${deltaClass(change.efficiency)}"><small>Eficiencia</small><b>${signed(change.efficiency)}</b></span></div></div>`}
function ensureLab(){
  if(document.getElementById('laboratorio'))return;
  const section=document.createElement('section');section.className='section';section.id='laboratorio';
  const once=document.getElementById('once');if(once)once.insertAdjacentElement('beforebegin',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';
  document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
function labPitch(xi){return `<div class="lab-pitch">${slots.map(s=>{const name=xi[s[0]],p=players.find(x=>x.name===name);return `<button class="lab-slot" style="left:${s[2]}%;top:${s[3]}%" onclick="openPlayerHub('${(name||'').replace(/'/g,"\\'")}')"><small>${s[1]}</small><b>${name?lEsc(displayName(name)):'—'}</b><span>${p?lEsc(whyText(p)):'Sin selección'}</span></button>`}).join('')}</div>`}
function bench(xi){const chosen=new Set(xiValues(xi));return criterionRank().filter(p=>!chosen.has(p.name)).slice(0,6)}
function renderLab(){
  const section=document.getElementById('laboratorio');if(!section)return;
  labResult=optimizeXI(labCriterion,labMinMinutes);const xi=labResult.xi,criterion=LAB_CRITERIA[labCriterion],benchRows=bench(xi),baseline=baselineXI(),summary=xiSummary(xi),baseSummary=xiSummary(baseline),delta=compareSummary(summary,baseSummary),changes=slotChanges(xi,baseline),conf=confidence(summary,labResult.fallbacks);
  section.innerHTML=`
    <div class="section-head"><div><div class="eyebrow">LABORATORIO XI PRO</div><h2>Laboratorio de XI</h2><p>Genera un XI por datos y mide exactamente qué ganas y qué pierdes frente a otra alineación.</p></div><span class="pill">Sin repetir · Posiciones válidas</span></div>
    <div class="card lab-controls"><div><div class="eyebrow">CRITERIO DEL XI</div><div class="lab-criteria">${Object.entries(LAB_CRITERIA).map(([id,c])=>`<button class="${id===labCriterion?'active':''}" onclick="setLabCriterion('${id}')"><b>${c.label}</b><small>${c.short}</small></button>`).join('')}</div></div><div class="lab-filter"><label>Muestra mínima</label><select class="select" onchange="setLabMinutes(this.value)"><option value="0" ${labMinMinutes===0?'selected':''}>Sin filtro</option><option value="90" ${labMinMinutes===90?'selected':''}>90+ min</option><option value="180" ${labMinMinutes===180?'selected':''}>180+ min</option><option value="270" ${labMinMinutes===270?'selected':''}>270+ min</option></select><small>Si una demarcación no tiene candidato suficiente, el algoritmo conserva una combinación válida y marca la excepción.</small></div></div>
    <div class="card lab-method"><div><div class="eyebrow">${criterion.label.toUpperCase()}</div><h3>${criterion.desc}</h3><p>Busca la mejor combinación global, no once ganadores independientes. La polivalencia puede hacer que un jugador aporte más en otra demarcación.</p></div><div class="lab-score"><span>Puntuación del criterio</span><b>${labResult.score.toFixed(2)}</b><small>${labResult.fallbacks.length?`${labResult.fallbacks.length} excepción(es) de muestra`:'Filtro respetado en todo el XI'}</small></div></div>
    <div class="lab-confidence ${conf.cls}"><div><span>CONFIANZA DE MUESTRA</span><b>${conf.label}</b><small>${conf.text}</small></div><strong>${Math.round((summary.sample||0)*100)}%</strong></div>
    <div class="lab-layout"><div class="card">${labPitch(xi)}</div><div class="card lab-side">
      <div class="lab-compare-head"><div><div class="eyebrow">COMPARAR CONTRA</div><select class="select" onchange="setLabBaseline(this.value)">${Object.entries(LAB_BASELINES).map(([id,label])=>`<option value="${id}" ${id===labBaseline?'selected':''}>${label}</option>`).join('')}</select></div><b>${changes.length}<small> cambios</small></b></div>
      <div class="lab-overlap"><div><span>Coincidencias</span><b>${overlap(xi,baseline)}<small>/11</small></b></div><div><span>Jugadores distintos</span><b>${11-overlap(xi,baseline)}</b></div></div>
      <div class="lab-deltas"><div class="${deltaClass(delta.power)}"><span>Power medio</span><b>${signed(delta.power)}</b><small>${summary.power?.toFixed(2)??'—'} vs ${baseSummary.power?.toFixed(2)??'—'}</small></div><div class="${deltaClass(delta.rating)}"><span>Media</span><b>${signed(delta.rating)}</b><small>${summary.rating?.toFixed(2)??'—'} vs ${baseSummary.rating?.toFixed(2)??'—'}</small></div><div class="${deltaClass(delta.sample)}"><span>Muestra</span><b>${signed(delta.sample,0,' pp')}</b><small>${Math.round((summary.sample||0)*100)}% vs ${Math.round((baseSummary.sample||0)*100)}%</small></div><div class="${deltaClass(delta.efficiency)}"><span>Eficiencia</span><b>${signed(delta.efficiency)}</b><small>positivo = menos min/punto</small></div></div>
      <div class="lab-actions"><button class="btn primary" onclick="labToConstructor()">Revisar en Constructor</button><button class="btn" onclick="labToPrediction()">Revisar en Predicción</button></div><div class="lab-note"><b>No es una predicción de Mourinho</b><span>Es una propuesta algorítmica para contrastar rendimiento, muestra y eficiencia con nuestras decisiones tácticas.</span></div>
    </div></div>
    <div class="lab-comparison card"><div class="section-head" style="margin-top:0"><div><h2>Impacto de los cambios</h2><p>Cada sustitución se compara en la misma posición. En eficiencia, un valor positivo significa necesitar menos minutos por punto.</p></div><span class="pill">${LAB_BASELINES[labBaseline]}</span></div>${changes.length?`<div class="lab-changes">${changes.map(changeHtml).join('')}</div>`:'<div class="lab-no-changes">Los dos onces son idénticos posición por posición.</div>'}</div>
    <div class="lab-bottom"><div class="card"><div class="section-head" style="margin-top:0"><div><h2>Detalle del XI</h2><p>Qué factor empuja a cada jugador dentro del criterio seleccionado.</p></div></div><div class="lab-detail">${slots.map(s=>{const name=xi[s[0]],p=players.find(x=>x.name===name);return `<button onclick="openPlayerHub('${(name||'').replace(/'/g,"\\'")}')"><span>${s[1]}</span><b>${name?lEsc(displayName(name)):'—'}</b><small>${p?lEsc(whyText(p)):'—'}</small><strong>${p?lScoreDisplay(p):'—'}</strong></button>`}).join('')}</div></div><div class="card"><div class="section-head" style="margin-top:0"><div><h2>Banquillo por datos</h2><p>Los seis siguientes del ranking que no entraron en el XI.</p></div></div><div class="lab-bench">${benchRows.map((p,i)=>`<button onclick="openPlayerHub('${p.name.replace(/'/g,"\\'")}')"><b>#${i+1}</b><span>${lEsc(p.short||p.name)}<small>${p.pos}</small></span><strong>${lScoreDisplay(p)}</strong></button>`).join('')}</div></div></div>
    <div class="lab-integrity"><b>Cómo interpretar el resultado</b><span>Una mejora pequeña de Power con una caída grande de muestra no es una ventaja segura. Laboratorio PRO enseña ambas cosas para que el algoritmo no oculte la incertidumbre.</span></div>`;
  document.body.classList.add('lineuplab-pro-ready');
}
window.setLabCriterion=function(id){if(!LAB_CRITERIA[id])return;labCriterion=id;renderLab()};
window.setLabMinutes=function(v){labMinMinutes=Number(v)||0;renderLab()};
window.setLabBaseline=function(id){if(!LAB_BASELINES[id])return;labBaseline=id;renderLab()};
window.labToConstructor=function(){
  if(!labResult)return;const existing=safeCurrentXI(),hasExisting=xiValues(existing).length>0;
  if(hasExisting&&!sameXI(existing,labResult.xi)&&!window.confirm('El Constructor ya contiene un XI. ¿Quieres sustituirlo por esta variante del Laboratorio?'))return;
  setXI(labResult.xi);const name=document.getElementById('lineupName');if(name)name.value=`XI datos · ${LAB_CRITERIA[labCriterion].label}`;const comment=document.getElementById('lineupComment');if(comment)comment.value=`Generado por Laboratorio XI PRO con criterio ${LAB_CRITERIA[labCriterion].label}${labMinMinutes?` y muestra mínima ${labMinMinutes} min`:''}.`;showSection('once');toast('XI enviado al Constructor para revisión')
};
window.labToPrediction=function(){
  if(!labResult)return;if(predictionIsClosed()){toast('La predicción está cerrada');return}const existing=safePredictionXI(),hasExisting=xiValues(existing).length>0;
  if(hasExisting&&!sameXI(existing,labResult.xi)&&!window.confirm('Tu Predicción ya contiene jugadores. ¿Quieres sustituirla por esta variante del Laboratorio?'))return;
  setPredictionXI(labResult.xi);const comment=document.getElementById('predictionComment');if(comment)comment.value=`XI generado por datos · ${LAB_CRITERIA[labCriterion].label}.`;showSection('prediccion');toast('XI cargado en Predicción. Revísalo antes de publicar')
};
window.RMLineupLabPro=Object.freeze({render:renderLab,optimize:optimizeXI,summary:xiSummary,changes:slotChanges,setBaseline:window.setLabBaseline});
function install(){if(typeof sections==='undefined'||typeof players==='undefined'||typeof slots==='undefined'){setTimeout(install,100);return}ensureLab();renderLab()}
install();
})();
