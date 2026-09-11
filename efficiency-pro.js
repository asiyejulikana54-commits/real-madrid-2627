(()=>{
const SECTION=['eficiencia','⏱','Eficiencia','Eficiencia PRO','Minutos por punto, aporte, muestra y contexto para interpretar la eficiencia sin atajos.'];
const state={position:'ALL',minMinutes:0,sort:'efficiency',query:''};
let installed=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function list(){return typeof players==='undefined'?[]:players}
function season(){return window.RMSeasonData||null}
function display(name){const p=list().find(x=>x.name===name||x.short===name);return p?(p.short||p.name):safe(()=>displayName(name),name)||name}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function aggregate(name){
  const row=safe(()=>season()?.aggregatePlayer?.(name),null);if(row)return row;
  const p=list().find(x=>x.name===name),m=p&&typeof metricFor==='function'?metricFor(p):null,r=m&&typeof currentRating==='function'?currentRating(m):null;
  return {player:name,totalMinutes:m?.minutes||0,ratedMinutes:m?.minutes||0,unratedMinutes:0,totalPoints:m?.points||0,rating:r,minPerPoint:m?.minPerPoint??null,ratedMatches:m?1:0};
}
function rowFor(p){
  const a=aggregate(p.name),recent=safe(()=>season()?.recentRating?.(p.name,3),null),delta=safe(()=>season()?.ratingDelta?.(p.name),null),sample=Math.min(a.totalMinutes||0,450)/450;
  const power=Number.isFinite(a.rating)?a.rating*(.75+.25*sample):null;
  return {p,name:p.name,pos:p.pos,minutes:a.totalMinutes||0,ratedMinutes:a.ratedMinutes||0,unratedMinutes:a.unratedMinutes||0,points:a.totalPoints||0,rating:a.rating,minPerPoint:a.minPerPoint,recent:Number.isFinite(recent?.value)?recent.value:null,recentN:recent?.n||0,delta:Number.isFinite(delta?.delta)?delta.delta:null,power,sample,ratedMatches:a.ratedMatches||0};
}
function allRows(){return list().map(rowFor).filter(r=>Number.isFinite(r.minPerPoint)&&r.points>0)}
function rankMap(rows,key,asc=false){const sorted=[...rows].filter(r=>Number.isFinite(r[key])).sort((a,b)=>asc?a[key]-b[key]:b[key]-a[key]);return new Map(sorted.map((r,i)=>[r.name,i+1]))}
function sampleLabel(r){if(r.minutes>=270)return 'Muestra consolidada';if(r.minutes>=90)return 'Muestra en desarrollo';return 'Muestra corta'}
function sampleClass(r){return r.minutes>=270?'strong':r.minutes>=90?'medium':'short'}
function reading(r,effRank,powerRank){
  if(r.minutes<90)return 'Eficiencia prometedora, pero todavía muy sensible a pocos minutos.';
  const gap=(powerRank||0)-(effRank||0);if(gap>=3)return 'Su eficiencia bruta destaca más que su Power: la muestra todavía le resta respaldo.';
  if(gap<=-3)return 'Su Power queda mejor posicionado que su eficiencia pura gracias al conjunto de rendimiento y muestra.';
  return 'Eficiencia y Power cuentan una historia bastante alineada.';
}
function ensureSection(){
  if(typeof sections==='undefined')return null;
  if(!sections.some(s=>s[0]==='eficiencia')){const i=sections.findIndex(s=>s[0]==='estadisticas');sections.splice(i>=0?i+1:2,0,SECTION)}
  let section=document.getElementById('eficiencia');if(!section){section=document.createElement('section');section.id='eficiencia';section.className='section';const stats=document.getElementById('estadisticas');if(stats)stats.insertAdjacentElement('afterend',section);else document.querySelector('main')?.appendChild(section)}
  const active=document.querySelector('.section.active')?.id||'inicio';
  if(typeof navHtml==='function'){const d=document.getElementById('navDesktop'),m=document.getElementById('navMobile');if(d)d.innerHTML=navHtml(false);if(m)m.innerHTML=navHtml(true);document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===active))}
  return section;
}
function filtered(rows){
  const q=state.query.trim().toLowerCase();let out=rows.filter(r=>(state.position==='ALL'||r.pos===state.position)&&r.minutes>=state.minMinutes&&(!q||r.name.toLowerCase().includes(q)||String(r.p.short||'').toLowerCase().includes(q)));
  const sorters={efficiency:(a,b)=>a.minPerPoint-b.minPerPoint,power:(a,b)=>(b.power??-Infinity)-(a.power??-Infinity),rating:(a,b)=>(b.rating??-Infinity)-(a.rating??-Infinity),points:(a,b)=>b.points-a.points,minutes:(a,b)=>b.minutes-a.minutes};
  return out.sort(sorters[state.sort]||sorters.efficiency);
}
function leaders(rows){
  const eff=[...rows].sort((a,b)=>a.minPerPoint-b.minPerPoint)[0]||null,stable=[...rows].filter(r=>r.minutes>=270).sort((a,b)=>a.minPerPoint-b.minPerPoint)[0]||null,points=[...rows].sort((a,b)=>b.points-a.points)[0]||null,short=[...rows].filter(r=>r.minutes<90).sort((a,b)=>a.minPerPoint-b.minPerPoint)[0]||null;
  return {eff,stable,points,short};
}
function leaderCard(label,row,value,sub){return `<div class="efp-kpi"><span>${label}</span><b>${row?esc(display(row.name)):'—'}</b><strong>${row?value(row):'—'}</strong><small>${row?sub(row):'Sin dato comparable'}</small></div>`}
function openPlayer(name){safe(()=>showSection('plantilla'));setTimeout(()=>safe(()=>openPlayerHub(name)),80)}
function comparisonRival(name,rows){const sorted=[...rows].sort((a,b)=>a.minPerPoint-b.minPerPoint);return (sorted.find(r=>r.name!==name)||null)?.name||null}
function openCompare(name,rows){const rival=comparisonRival(name,rows);if(!rival)return;safe(()=>showSection('comparador'));setTimeout(()=>{if(window.RMComparePro?.setDuel)window.RMComparePro.setDuel(name,rival);else{const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A)A.value=name;if(B)B.value=rival;safe(()=>renderCompare())}},100)}
function openRadar(name,rows){const rival=comparisonRival(name,rows);if(!rival)return;safe(()=>showSection('radar'));setTimeout(()=>safe(()=>window.setRadarPlayers?.(name,rival)),100)}
function rowHtml(r,effRanks,powerRanks,min,max,all){
  const er=effRanks.get(r.name),pr=powerRanks.get(r.name),range=Math.max(.001,max-min),bar=30+70*((max-r.minPerPoint)/range),trend=Number.isFinite(r.delta)?`${r.delta>=0?'▲':'▼'} ${Math.abs(r.delta).toFixed(2)}`:'—';
  return `<article class="efp-row ${sampleClass(r)}"><div class="efp-rank"><b>#${er||'—'}</b><small>EFIC.</small></div><button class="efp-player" type="button" data-efp-player="${esc(r.name)}"><span>${esc(r.pos)}</span><strong>${esc(display(r.name))}</strong><small>${r.minutes} min · ${r.ratedMatches} partido${r.ratedMatches===1?'':'s'} con nota</small></button><div class="efp-main"><div><span>Min/punto</span><b>${fmt(r.minPerPoint)}</b></div><div class="efp-track"><i style="width:${bar.toFixed(1)}%"></i></div><small>+${fmt(r.minPerPoint-min,2)} vs líder</small></div><div class="efp-metrics"><div><span>Media</span><b>${fmt(r.rating)}</b></div><div><span>Power</span><b>${fmt(r.power)}</b><small>#${pr||'—'}</small></div><div><span>Aporte</span><b>${fmt(r.points)}</b></div><div><span>Forma</span><b>${fmt(r.recent)}</b><small>${r.recentN||0} notas</small></div><div><span>Tendencia</span><b class="${Number.isFinite(r.delta)?r.delta>=0?'up':'down':''}">${trend}</b></div></div><div class="efp-sample"><div><span>${sampleLabel(r)}</span><b>${Math.round(r.sample*100)}%</b></div><div><i style="width:${Math.round(r.sample*100)}%"></i></div>${r.unratedMinutes?`<small>${r.unratedMinutes} min con SC</small>`:'<small>Sin minutos SC</small>'}</div><p class="efp-reading">${esc(reading(r,er,pr))}</p><div class="efp-actions"><button class="btn" type="button" data-efp-player="${esc(r.name)}">Ficha</button><button class="btn" type="button" data-efp-compare="${esc(r.name)}">Comparar</button><button class="btn" type="button" data-efp-radar="${esc(r.name)}">Radar</button></div></article>`;
}
function methodology(){return `<div class="card efp-method"><div><span>FÓRMULA</span><b>Min/punto = minutos totales ÷ aporte total</b><p>Menor es mejor. Aporte = nota oficial combinada × minutos valorados / 90.</p></div><div><span>LECTURA CORRECTA</span><b>Eficiencia no significa automáticamente “mejor jugador”</b><p>Con todos los minutos valorados, Min/punto está muy ligado a la media (aprox. 90 ÷ media). Power y muestra ayudan a ponerlo en contexto.</p></div><div><span>SC</span><b>SC nunca se convierte en nota 0</b><p>Los minutos SC se conservan como tiempo jugado y no generan puntos de valoración; por eso se muestran de forma explícita.</p></div></div>`}
function render(){
  const section=ensureSection();if(!section)return;const rows=allRows(),view=filtered(rows),effRanks=rankMap(rows,'minPerPoint',true),powerRanks=rankMap(rows,'power',false),lead=leaders(rows),vals=rows.map(r=>r.minPerPoint),min=Math.min(...vals),max=Math.max(...vals);
  section.innerHTML=`<div class="section-head"><div><div class="eyebrow">EFICIENCIA PRO</div><h2>¿Quién necesita menos minutos para generar aporte?</h2><p>Ranking completo sin corte oculto, con muestra y Power al lado para no sobrerreaccionar a apariciones cortas.</p></div><button class="btn" id="efpEvolution" type="button">Ver Evolución</button></div><div class="efp-kpis">${leaderCard('MEJOR EFICIENCIA',lead.eff,r=>fmt(r.minPerPoint),r=>`${r.minutes} min · media ${fmt(r.rating)}`)}${leaderCard('MEJOR 270+ MIN',lead.stable,r=>fmt(r.minPerPoint),r=>'muestra consolidada')}${leaderCard('MAYOR APORTE',lead.points,r=>fmt(r.points),r=>`${r.minutes} min · ${fmt(r.minPerPoint)} min/punto`)}${leaderCard('MUESTRA CORTA',lead.short,r=>fmt(r.minPerPoint),r=>`${r.minutes} min · interpretar con cautela`)}</div>${methodology()}<div class="card efp-toolbar"><div class="efp-position"><button data-pos="ALL" class="${state.position==='ALL'?'active':''}">Todos</button><button data-pos="POR" class="${state.position==='POR'?'active':''}">POR</button><button data-pos="DEF" class="${state.position==='DEF'?'active':''}">DEF</button><button data-pos="MED" class="${state.position==='MED'?'active':''}">MED</button><button data-pos="ATA" class="${state.position==='ATA'?'active':''}">ATA</button></div><input class="input" id="efpSearch" value="${esc(state.query)}" placeholder="Buscar jugador…" aria-label="Buscar jugador en Eficiencia PRO"><select class="select" id="efpMin" aria-label="Mínimo de minutos"><option value="0" ${state.minMinutes===0?'selected':''}>Toda la muestra</option><option value="90" ${state.minMinutes===90?'selected':''}>90+ min</option><option value="180" ${state.minMinutes===180?'selected':''}>180+ min</option><option value="270" ${state.minMinutes===270?'selected':''}>270+ min</option></select><select class="select" id="efpSort" aria-label="Ordenar Eficiencia PRO"><option value="efficiency" ${state.sort==='efficiency'?'selected':''}>Min/punto</option><option value="power" ${state.sort==='power'?'selected':''}>Power</option><option value="rating" ${state.sort==='rating'?'selected':''}>Media</option><option value="points" ${state.sort==='points'?'selected':''}>Aporte</option><option value="minutes" ${state.sort==='minutes'?'selected':''}>Minutos</option></select><span class="efp-count">${view.length}/${rows.length}</span></div><div class="efp-list">${view.length?view.map(r=>rowHtml(r,effRanks,powerRanks,min,max,rows)).join(''):'<div class="card efp-empty">No hay jugadores que cumplan este filtro.</div>'}</div><p class="efp-foot">El ranking no usa “partido válido” ni mínimo automático. Los filtros de minutos son solo herramientas de lectura elegidas por ti.</p>`;
  section.querySelectorAll('[data-pos]').forEach(b=>b.addEventListener('click',()=>{state.position=b.dataset.pos;render()}));
  section.querySelector('#efpSearch')?.addEventListener('input',e=>{state.query=e.target.value;render()});
  section.querySelector('#efpMin')?.addEventListener('change',e=>{state.minMinutes=Number(e.target.value)||0;render()});
  section.querySelector('#efpSort')?.addEventListener('change',e=>{state.sort=e.target.value;render()});
  section.querySelectorAll('[data-efp-player]').forEach(b=>b.addEventListener('click',()=>openPlayer(b.dataset.efpPlayer)));
  section.querySelectorAll('[data-efp-compare]').forEach(b=>b.addEventListener('click',()=>openCompare(b.dataset.efpCompare,rows)));
  section.querySelectorAll('[data-efp-radar]').forEach(b=>b.addEventListener('click',()=>openRadar(b.dataset.efpRadar,rows)));
  section.querySelector('#efpEvolution')?.addEventListener('click',()=>safe(()=>showSection('evolucion')));
  window.RMAccessibility?.refresh?.();
}
function decorateHome(){
  const bars=document.getElementById('ratingBars'),card=bars?.closest('.card'),head=card?.querySelector('.section-head');if(!bars||!head||head.querySelector('[data-efp-home]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.dataset.efpHome='1';btn.textContent='Abrir Eficiencia PRO';btn.addEventListener('click',()=>safe(()=>showSection('eficiencia')));head.appendChild(btn);
}
function deepLink(){try{if(new URL(location.href).searchParams.get('section')==='eficiencia')setTimeout(()=>safe(()=>showSection('eficiencia')),0)}catch{}}
function install(){
  if(installed)return;if(typeof sections==='undefined'||typeof players==='undefined'||!season()){setTimeout(install,100);return}installed=true;ensureSection();render();decorateHome();deepLink();
  document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-extension-ready',render);document.addEventListener('rm-modules-ready',()=>{decorateHome();render()});
  window.RMEfficiencyPro=Object.freeze({render,state:()=>({...state}),rows:allRows});
}
install();
})();