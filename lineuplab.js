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
let labCriterion='balance',labMinMinutes=0,labResult=null;

function lEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function lMetric(p){return metricFor(p)}
function lRating(p){const m=lMetric(p);return currentRating(m)}
function lPower(p){const m=lMetric(p),r=lRating(p);if(!m||r===null)return null;const sample=Math.min(m.minutes,450)/450;return r*(.75+.25*sample)}
const LAB_METRICS=players.map(p=>{const m=lMetric(p),r=lRating(p);return m&&r!==null?{p,m,r,power:lPower(p)}:null}).filter(Boolean);
const rMin=Math.min(...LAB_METRICS.map(x=>x.r)),rMax=Math.max(...LAB_METRICS.map(x=>x.r));
const eMin=Math.min(...LAB_METRICS.map(x=>x.m.minPerPoint)),eMax=Math.max(...LAB_METRICS.map(x=>x.m.minPerPoint));
function norm(v,min,max){return max===min?10:10*(v-min)/(max-min)}
function lScore(p,criterion=labCriterion){
  const m=lMetric(p),r=lRating(p);if(!m||r===null)return null;
  if(criterion==='power')return lPower(p);
  if(criterion==='rating')return r;
  if(criterion==='minutes')return m.minutes;
  if(criterion==='efficiency')return 20-m.minPerPoint;
  const ratingScore=norm(r,rMin,rMax),sampleScore=Math.min(m.minutes,450)/45,effScore=norm(eMax-m.minPerPoint,0,eMax-eMin);
  return .45*ratingScore+.30*sampleScore+.25*effScore;
}
function lScoreDisplay(p,criterion=labCriterion){
  const m=lMetric(p),r=lRating(p);if(!m||r===null)return '—';
  if(criterion==='minutes')return `${m.minutes}'`;
  if(criterion==='efficiency')return m.minPerPoint.toFixed(2);
  return lScore(p,criterion).toFixed(2);
}
function eligibleForSlot(p,slot){return p.eligible.includes(slot[4])}
function candidates(slot,criterion,minMinutes){
  let list=players.filter(p=>eligibleForSlot(p,slot)&&lMetric(p)&&lRating(p)!==null);
  const filtered=list.filter(p=>lMetric(p).minutes>=minMinutes);
  const fallback=filtered.length?filtered:list;
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
function xiValues(xi){return slots.map(s=>xi[s[0]]).filter(Boolean)}
function overlap(a,b){const A=new Set(xiValues(a)),B=new Set(xiValues(b));return [...A].filter(x=>B.has(x)).length}
function criterionRank(){return [...players].filter(p=>lScore(p)!==null).sort((a,b)=>lScore(b)-lScore(a))}
function whyText(p){const m=lMetric(p),r=lRating(p),power=lPower(p);if(!m||r===null)return 'Sin muestra';
  if(labCriterion==='minutes')return `${m.minutes} min acumulados`;
  if(labCriterion==='efficiency')return `${m.minPerPoint.toFixed(2)} min/punto`;
  if(labCriterion==='rating')return `Media ${r.toFixed(2)}`;
  if(labCriterion==='power')return `Power ${power.toFixed(2)} · ${m.minutes} min`;
  return `Media ${r.toFixed(2)} · ${m.minutes} min · ${m.minPerPoint.toFixed(2)} min/p`;
}
function ensureLab(){
  if(document.getElementById('laboratorio'))return;
  const section=document.createElement('section');section.className='section';section.id='laboratorio';
  const once=document.getElementById('once');if(once)once.insertAdjacentElement('beforebegin',section);else document.querySelector('main')?.appendChild(section);
  const active=document.querySelector('.section.active')?.id||'inicio';
  document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
  document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active));
}
function labPitch(xi){
  return `<div class="lab-pitch">${slots.map(s=>{const name=xi[s[0]],p=players.find(x=>x.name===name);return `<button class="lab-slot" style="left:${s[2]}%;top:${s[3]}%" onclick="openPlayerHub('${(name||'').replace(/'/g,"\\'")}')"><small>${s[1]}</small><b>${name?lEsc(displayName(name)):'—'}</b><span>${p?lEsc(whyText(p)):'Sin selección'}</span></button>`}).join('')}</div>`;
}
function bench(xi){
  const chosen=new Set(xiValues(xi));return criterionRank().filter(p=>!chosen.has(p.name)).slice(0,6);
}
function renderLab(){
  const section=document.getElementById('laboratorio');if(!section)return;
  labResult=optimizeXI(labCriterion,labMinMinutes);const xi=labResult.xi,criterion=LAB_CRITERIA[labCriterion],benchRows=bench(xi);
  section.innerHTML=`
    <div class="section-head"><div><h2>Laboratorio de XI</h2><p>Construye automáticamente el mejor once posible según el criterio elegido, respetando posiciones y sin repetir jugadores.</p></div><span class="pill">Datos actuales</span></div>
    <div class="card lab-controls"><div><div class="eyebrow">CRITERIO</div><div class="lab-criteria">${Object.entries(LAB_CRITERIA).map(([id,c])=>`<button class="${id===labCriterion?'active':''}" onclick="setLabCriterion('${id}')"><b>${c.label}</b><small>${c.short}</small></button>`).join('')}</div></div><div class="lab-filter"><label>Muestra mínima</label><select class="select" onchange="setLabMinutes(this.value)"><option value="0" ${labMinMinutes===0?'selected':''}>Sin filtro</option><option value="90" ${labMinMinutes===90?'selected':''}>90 min</option><option value="180" ${labMinMinutes===180?'selected':''}>180 min</option><option value="300" ${labMinMinutes===300?'selected':''}>300 min</option></select><small>Si una posición se queda sin candidatos, el laboratorio recupera automáticamente la mejor opción disponible.</small></div></div>
    <div class="card lab-method"><div><div class="eyebrow">${criterion.label.toUpperCase()}</div><h3>${criterion.desc}</h3><p>El algoritmo busca la mejor combinación global: no elige simplemente al mejor de cada posición por separado, porque un jugador polivalente puede ser más valioso en otra demarcación.</p></div><div class="lab-score"><span>Puntuación XI</span><b>${labResult.score.toFixed(2)}</b><small>${labResult.fallbacks.length?`${labResult.fallbacks.length} posición(es) usaron excepción de muestra`:'Filtro de muestra respetado en todo el XI'}</small></div></div>
    <div class="lab-layout"><div class="card">${labPitch(xi)}</div><div class="card lab-side"><div class="lab-overlap"><div><span>Coincide con XI base</span><b>${overlap(xi,baseXI)}<small>/11</small></b></div><div><span>Coincide con idea Rayo</span><b>${overlap(xi,rayoXI)}<small>/11</small></b></div></div><div class="lab-actions"><button class="btn primary" onclick="labToConstructor()">Mandar al Constructor</button><button class="btn" onclick="labToPrediction()">Usar en Predicción</button></div><div class="lab-note"><b>Importante</b><span>Es un XI por datos, no una predicción de Mourinho. Sirve para contrastar nuestras decisiones con el rendimiento acumulado.</span></div></div></div>
    <div class="lab-bottom"><div class="card"><div class="section-head" style="margin-top:0"><div><h2>Detalle del XI</h2><p>Por qué entra cada jugador según el criterio seleccionado.</p></div></div><div class="lab-detail">${slots.map((s,i)=>{const name=xi[s[0]],p=players.find(x=>x.name===name);return `<button onclick="openPlayerHub('${(name||'').replace(/'/g,"\\'")}')"><span>${s[1]}</span><b>${name?lEsc(displayName(name)):'—'}</b><small>${p?lEsc(whyText(p)):'—'}</small><strong>${p?lScoreDisplay(p):'—'}</strong></button>`}).join('')}</div></div><div class="card"><div class="section-head" style="margin-top:0"><div><h2>Banquillo por datos</h2><p>Los seis siguientes del ranking que no entraron en el XI.</p></div></div><div class="lab-bench">${benchRows.map((p,i)=>`<button onclick="openPlayerHub('${p.name.replace(/'/g,"\\'")}')"><b>#${i+1}</b><span>${lEsc(p.short||p.name)}<small>${p.pos}</small></span><strong>${lScoreDisplay(p)}</strong></button>`).join('')}</div></div></div>
    <div class="lab-integrity"><b>Lectura recomendada</b><span>Compara este XI con Power, Evolución, nuestra idea y Comunidad. Si varios métodos coinciden en un jugador, su candidatura gana mucha más fuerza; si discrepan, ahí tenemos un debate interesante.</span></div>`;
}
window.setLabCriterion=function(id){if(!LAB_CRITERIA[id])return;labCriterion=id;renderLab()};
window.setLabMinutes=function(v){labMinMinutes=Number(v)||0;renderLab()};
window.labToConstructor=function(){if(!labResult)return;setXI(labResult.xi);const name=document.getElementById('lineupName');if(name)name.value=`XI datos · ${LAB_CRITERIA[labCriterion].label}`;const comment=document.getElementById('lineupComment');if(comment)comment.value=`Generado por Laboratorio XI con criterio ${LAB_CRITERIA[labCriterion].label}${labMinMinutes?` y muestra mínima ${labMinMinutes} min`:''}.`;showSection('once');toast('XI enviado al Constructor')};
window.labToPrediction=function(){if(!labResult)return;if(predictionIsClosed()){toast('La predicción está cerrada');return}setPredictionXI(labResult.xi);const comment=document.getElementById('predictionComment');if(comment)comment.value=`XI generado por datos · ${LAB_CRITERIA[labCriterion].label}.`;showSection('prediccion');toast('XI cargado en Predicción. Revísalo antes de publicar')};
function install(){if(typeof sections==='undefined'||typeof players==='undefined'||typeof slots==='undefined'){setTimeout(install,100);return}ensureLab();renderLab()}
install();
})();
