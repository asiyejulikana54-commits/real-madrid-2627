(()=>{
let installed=false,installAttempts=0;
const SIGNAL_WEIGHTS=Object.freeze({power:.45,form:.35,latest:.20});
const SIGNAL_SCALES=Object.freeze({power:.25,form:.80,latest:1.20});
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function data(){return window.RMSeasonData||null}
function playerRows(){return safe(()=>players,[])||[]}
function canonical(name){return safe(()=>data()?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function player(name){const c=canonical(name);return playerRows().find(p=>canonical(p.name)===c||canonical(p.short)===c)||null}
function clamp(v,min=-1,max=1){return Math.max(min,Math.min(max,v))}
function aggregateThrough(name,end){
  const d=data(),matches=d?.matches||[];if(!d||end<0)return {name:canonical(name),minutes:0,ratedMinutes:0,points:0,rating:null,minPerPoint:null,power:null};
  let minutes=0,ratedMinutes=0,points=0;
  for(const match of matches.slice(0,end+1)){
    const minute=safe(()=>d.minuteEntry(match.id,name),null),m=Number.isFinite(minute?.value)?Number(minute.value):0;if(m<=0)continue;
    minutes+=m;const rating=safe(()=>d.officialRatingEntry(match.id,name),null);if(!Number.isFinite(rating?.value))continue;
    ratedMinutes+=m;points+=Number(rating.value)*m/90;
  }
  const rating=ratedMinutes?points*90/ratedMinutes:null,minPerPoint=points?minutes/points:null,power=Number.isFinite(rating)?rating*(.75+.25*Math.min(minutes,450)/450):null;
  return {name:canonical(name),minutes,ratedMinutes,points,rating,minPerPoint,power};
}
function rankingThrough(end){
  return playerRows().map(p=>aggregateThrough(p.name,end)).filter(r=>Number.isFinite(r.power)).sort((a,b)=>b.power-a.power||b.minutes-a.minutes||display(a.name).localeCompare(display(b.name),'es')).map((r,i)=>({...r,rank:i+1}));
}
function latestRows(match){
  const d=data();if(!d||!match)return [];
  return playerRows().map(p=>{
    const entry=safe(()=>d.officialRatingEntry(match.id,p.name),null),minute=safe(()=>d.minuteEntry(match.id,p.name),null),minutes=Number.isFinite(minute?.value)?Number(minute.value):0;
    if(minutes<=0||!Number.isFinite(entry?.value))return null;
    return {name:p.name,rating:Number(entry.value),minutes,coverage:entry.sourceCount||0};
  }).filter(Boolean).sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes);
}
function formRows(match){
  const d=data();if(!d||!match)return [];
  return playerRows().map(p=>{
    const delta=safe(()=>d.ratingDelta(p.name),null);
    if(!delta||delta.currentMatch?.id!==match.id||!Number.isFinite(delta.delta))return null;
    return {name:p.name,delta:Number(delta.delta),current:Number(delta.current),previous:Number(delta.previous)};
  }).filter(Boolean).sort((a,b)=>b.delta-a.delta);
}
function snapshot(){
  const d=data(),matches=d?.matches||[];if(!d||!matches.length)return null;
  const index=matches.length-1,match=matches[index],current=rankingThrough(index),previous=rankingThrough(index-1),previousMap=new Map(previous.map(r=>[canonical(r.name),r]));
  const movements=current.map(row=>{
    const prior=previousMap.get(canonical(row.name));
    return {...row,previousRank:prior?.rank??null,previousPower:prior?.power??null,rankDelta:prior?prior.rank-row.rank:null,powerDelta:prior&&Number.isFinite(prior.power)?row.power-prior.power:null,newEntry:!prior};
  });
  const movers=[...movements].filter(r=>r.previousRank!==null).sort((a,b)=>b.rankDelta-a.rankDelta||(b.powerDelta??-99)-(a.powerDelta??-99));
  const latest=latestRows(match),forms=formRows(match);
  const positiveMover=[...movements].filter(r=>Number.isFinite(r.powerDelta)&&r.powerDelta>0).sort((a,b)=>b.powerDelta-a.powerDelta)[0]||null;
  return {match,index,current,previous,movements,movers,latest,forms,best:latest[0]||null,formUp:forms.find(r=>r.delta>0)||null,formDown:[...forms].reverse().find(r=>r.delta<0)||null,powerMover:positiveMover};
}
function currentIdea(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>typeof rayoXI!=='undefined'?rayoXI:null,null)||safe(()=>typeof baseXI!=='undefined'?baseXI:null,null)||{}}
function nextMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)||null}
function lineupSlots(){
  const idea=currentIdea(),defs=safe(()=>typeof slots!=='undefined'?slots:[],[])||[];
  return defs.map(s=>({key:s[0],label:s[1],role:s[4]||s[1],name:idea?.[s[0]]||null})).filter(s=>s.name);
}
function confidenceLabel(v){return v>=.76?'Alta':v>=.52?'Media':'Baja'}
function signalStrength(v){return v>=.55?'fuerte':v>=.22?'positiva':v<=-.55?'caída fuerte':v<=-.22?'negativa':'neutra'}
function signalFor(name,s){
  const c=canonical(name),move=s.movements.find(x=>canonical(x.name)===c)||null,form=s.forms.find(x=>canonical(x.name)===c)||null,last=s.latest.find(x=>canonical(x.name)===c)||null,agg=aggregateThrough(name,s.index);
  const parts={
    power:Number.isFinite(move?.powerDelta)?clamp(move.powerDelta/SIGNAL_SCALES.power):null,
    form:Number.isFinite(form?.delta)?clamp(form.delta/SIGNAL_SCALES.form):null,
    latest:Number.isFinite(last?.rating)?clamp((last.rating-7)/SIGNAL_SCALES.latest):null
  };
  let weighted=0,availableWeight=0,evidence=0;
  for(const key of Object.keys(SIGNAL_WEIGHTS)){if(!Number.isFinite(parts[key]))continue;weighted+=parts[key]*SIGNAL_WEIGHTS[key];availableWeight+=SIGNAL_WEIGHTS[key];evidence++}
  const raw=availableWeight?weighted/availableWeight:0,sample=clamp((agg.minutes||0)/360,0,1),confidence=clamp(.55*availableWeight+.45*sample,0,1),momentum=raw*(.55+.45*confidence);
  const powerDir=Number.isFinite(move?.powerDelta)?(move.powerDelta>=.05?1:move.powerDelta<=-.05?-1:0):0;
  const formDir=Number.isFinite(form?.delta)?(form.delta>=.12?1:form.delta<=-.12?-1:0):0;
  const latestDir=Number.isFinite(last?.rating)?(last.rating>=7.5?1:last.rating<=6.5?-1:0):0;
  return {name,move,form,last,agg,parts,powerDir,formDir,latestDir,momentum,score:momentum,evidence,availableWeight,confidence,confidenceLabel:confidenceLabel(confidence),strength:signalStrength(momentum)};
}
function reasons(sig,{compact=false}={}){
  const out=[];
  if(Number.isFinite(sig.move?.powerDelta)&&Math.abs(sig.move.powerDelta)>=.03)out.push(`Power ${sig.move.powerDelta>0?'+':''}${sig.move.powerDelta.toFixed(2)}`);
  if(sig.move?.rankDelta>0)out.push(`ranking ↑${sig.move.rankDelta}`);
  else if(sig.move?.rankDelta<0)out.push(`ranking ↓${Math.abs(sig.move.rankDelta)}`);
  if(Number.isFinite(sig.form?.delta)&&Math.abs(sig.form.delta)>=.05)out.push(`forma ${sig.form.delta>0?'+':''}${sig.form.delta.toFixed(2)}`);
  if(Number.isFinite(sig.last?.rating))out.push(`última ${sig.last.rating.toFixed(2)}`);
  return (compact?out.slice(0,2):out).join(' · ')||'Sin cambio fuerte comparable';
}
function supportChip(sig){return `<span class="ri-support ${sig.confidenceLabel.toLowerCase()}">Respaldo ${sig.confidenceLabel.toLowerCase()}</span>`}
function compatibleSlots(p,ideaSlots){const eligible=p?.eligible||[];return ideaSlots.filter(slot=>eligible.includes(slot.role)&&canonical(slot.name)!==canonical(p.name))}
function selectionPressure(s){
  if(!s)return {idea:{},slots:[],challengers:[],reinforced:[],pressure:[],stable:0};
  const idea=currentIdea(),ideaNames=new Set(Object.values(idea||{}).filter(Boolean).map(canonical)),ideaSlots=lineupSlots(),movementBy=new Map(s.movements.map(x=>[canonical(x.name),x]));
  const all=playerRows().map(p=>({p,sig:signalFor(p.name,s),inIdea:ideaNames.has(canonical(p.name))}));
  const challengers=[];
  for(const row of all){
    if(row.inIdea||row.sig.momentum<.18||(!row.sig.powerDir&&!row.sig.formDir)||row.sig.confidence<.38)continue;
    const compatible=compatibleSlots(row.p,ideaSlots);if(!compatible.length)continue;
    let best=null;
    for(const slot of compatible){
      const candidateMove=movementBy.get(canonical(row.p.name)),occupantMove=movementBy.get(canonical(slot.name));
      const gap=Number.isFinite(candidateMove?.power)&&Number.isFinite(occupantMove?.power)?candidateMove.power-occupantMove.power:null;
      const powerEdge=Number.isFinite(gap)?clamp(gap/.60):0,challengeScore=.70*row.sig.momentum+.30*powerEdge;
      const item={...row,slot,occupant:slot.name,powerGap:gap,powerEdge,challengeScore};
      if(!best||item.challengeScore>best.challengeScore)best=item;
    }
    if(best&&(best.challengeScore>=.12||row.sig.momentum>=.38))challengers.push(best);
  }
  challengers.sort((a,b)=>b.challengeScore-a.challengeScore||b.sig.confidence-a.sig.confidence||(b.powerGap??-99)-(a.powerGap??-99));
  const byOccupant=new Map();
  for(const c of challengers){
    const key=canonical(c.occupant),prior=byOccupant.get(key);
    if(!prior||c.challengeScore>prior.challengeScore||(c.challengeScore===prior.challengeScore&&c.sig.confidence>prior.sig.confidence))byOccupant.set(key,c);
  }
  const pressure=[];
  for(const row of all.filter(x=>x.inIdea)){
    const challenger=byOccupant.get(canonical(row.p.name))||null,ownNegative=row.sig.momentum<=-.20,closeChallenge=Boolean(challenger&&challenger.challengeScore>=.20&&(challenger.powerGap===null||challenger.powerGap>=-.45));
    if(!ownNegative&&!closeChallenge)continue;
    pressure.push({...row,challenger,level:(ownNegative?1:0)+(closeChallenge?2:0),pressureScore:(ownNegative?Math.abs(row.sig.momentum):0)+(closeChallenge?challenger.challengeScore:0)});
  }
  pressure.sort((a,b)=>b.level-a.level||b.pressureScore-a.pressureScore);
  const pressureNames=new Set(pressure.map(x=>canonical(x.p.name)));
  const reinforced=all.filter(x=>x.inIdea&&!pressureNames.has(canonical(x.p.name))&&x.sig.momentum>=.18&&(x.sig.powerDir>0||x.sig.formDir>0)&&x.sig.confidence>=.42).sort((a,b)=>b.sig.momentum-a.sig.momentum||b.sig.confidence-a.sig.confidence).slice(0,5);
  const stable=[...ideaNames].filter(n=>!pressureNames.has(n)).length;
  return {idea,slots:ideaSlots,challengers:challengers.slice(0,5),reinforced,pressure:pressure.slice(0,5),stable,weights:SIGNAL_WEIGHTS};
}
function movementText(row){
  if(row.newEntry)return '<span class="ri-new">NUEVO</span>';
  if(row.rankDelta>0)return `<span class="ri-up">↑ ${row.rankDelta}</span>`;
  if(row.rankDelta<0)return `<span class="ri-down">↓ ${Math.abs(row.rankDelta)}</span>`;
  return '<span class="ri-flat">=</span>';
}
function playerButton(row,extra=''){return `<button type="button" class="ri-player" data-ri-player="${esc(row.name)}"><span><b>${esc(display(row.name))}</b>${extra}</span><strong>#${row.rank}</strong>${movementText(row)}</button>`}
function pressureCard(row,kind){
  if(kind==='challenge'){
    const role=row.slot?.role||row.slot?.label||'posición',gap=Number.isFinite(row.powerGap)?(row.powerGap>=0?` · Power actual +${row.powerGap.toFixed(2)}`:` · a ${Math.abs(row.powerGap).toFixed(2)} Power`):'';
    return `<button type="button" class="ri-xi-card gain" data-ri-duel="${esc(row.p.name)}|${esc(row.occupant)}"><span>GANA OPCIONES · ${esc(role)}</span><div class="ri-xi-name"><h4>${esc(display(row.p.name))}</h4>${supportChip(row.sig)}</div><p>Presiona a <b>${esc(display(row.occupant))}</b>${esc(gap)}.</p><small>${esc(reasons(row.sig))}</small><strong>Comparar →</strong></button>`;
  }
  if(kind==='reinforced')return `<button type="button" class="ri-xi-card strong" data-ri-player="${esc(row.p.name)}"><span>SE AFIANZA EN NUESTRA IDEA</span><div class="ri-xi-name"><h4>${esc(display(row.p.name))}</h4>${supportChip(row.sig)}</div><p>Las señales recientes respaldan su presencia actual.</p><small>${esc(reasons(row.sig))}</small><strong>Ver ficha →</strong></button>`;
  const challenger=row.challenger,challengeText=challenger?`${display(challenger.p.name)} empuja en ${challenger.slot?.role||challenger.slot?.label||'su posición'}.`:'Sus señales recientes pierden fuerza.';
  return `<button type="button" class="ri-xi-card risk" ${challenger?`data-ri-duel="${esc(row.p.name)}|${esc(challenger.p.name)}"`:`data-ri-player="${esc(row.p.name)}"`}><span>BAJO PRESIÓN POR DATOS</span><div class="ri-xi-name"><h4>${esc(display(row.p.name))}</h4>${supportChip(row.sig)}</div><p>${esc(challengeText)}</p><small>${esc(reasons(row.sig))}${challenger?` · rival: ${esc(reasons(challenger.sig,{compact:true}))}`:''}</small><strong>${challenger?'Comparar':'Ver ficha'} →</strong></button>`;
}
function nextXiHtml(selection){
  const match=nextMatch(),rival=match?.rival||'el próximo rival',challenge=selection.challengers.slice(0,3),reinforced=selection.reinforced.slice(0,3),pressure=selection.pressure.slice(0,3);
  const group=(title,copy,rows,kind,empty)=>`<section><div class="ri-xi-title"><span>${title}</span><small>${copy}</small></div><div class="ri-xi-list">${rows.length?rows.map(r=>pressureCard(r,kind)).join(''):`<div class="ri-empty">${empty}</div>`}</div></section>`;
  return `<div class="ri-next-xi"><div class="ri-next-head"><div><span>IMPACTO EN EL PRÓXIMO XI</span><h3>Qué empujan los datos contra ${esc(rival)}</h3><p>Conectamos el último partido con nuestra propuesta actual. No cambia el XI automáticamente: señala quién llega reforzado, quién llama a la puerta y dónde aparece presión real.</p></div><div class="ri-next-actions"><b>${selection.stable}/11</b><small>sin presión fuerte</small><button class="btn" type="button" data-ri-next="prediccion">Abrir predicción</button></div></div><div class="ri-xi-grid">${group('LLAMAN A LA PUERTA','Fuera de nuestra idea, pero con señales positivas.',challenge,'challenge','Ningún suplente reúne ahora suficientes señales positivas y encaje directo.')}${group('SE AFIANZAN','Titulares de nuestra idea respaldados por Power o forma.',reinforced,'reinforced','Nuestra idea no tiene ahora un refuerzo claro por datos recientes.')}${group('BAJO PRESIÓN','Titulares con caída propia o un rival directo muy cerca.',pressure,'pressure','No detectamos presión fuerte sobre nuestra idea actual.')}</div><p class="ri-note"><b>Peso de señales:</b> Power 45% · forma 35% · última nota 20%. Si falta una señal, los pesos disponibles se reajustan; la confianza baja con poca muestra. Subir puestos en el ranking no cuenta como mejora si el Power propio no ha subido.</p></div>`;
}
function matchdayPressureHtml(selection){
  const match=nextMatch(),rival=match?.rival||'el próximo rival',challenge=selection.challengers[0],risk=selection.pressure[0],strong=selection.reinforced[0];
  const chip=(label,row,text,kind)=>row?`<button type="button" class="ri-md-signal ${kind}" ${kind==='gain'&&row.occupant?`data-ri-duel="${esc(row.p.name)}|${esc(row.occupant)}"`:`data-ri-player="${esc(row.p.name)}"`}><span>${label}</span><b>${esc(display(row.p.name))}</b><small>${esc(text)} · respaldo ${row.sig.confidenceLabel.toLowerCase()}</small></button>`:`<div class="ri-md-signal empty"><span>${label}</span><b>Sin señal fuerte</b><small>La última jornada no fuerza una lectura.</small></div>`;
  return `<div class="ri-md-head"><div><span>SEÑALES DE LA ÚLTIMA JORNADA</span><h2>Cómo llegan los debates contra ${esc(rival)}</h2><p>La previa incorpora automáticamente el impacto reciente sin convertirlo en una predicción cerrada.</p></div><button class="btn" type="button" data-ri-next="prediccion">Revisar nuestro XI</button></div><div class="ri-md-grid">${chip('GANA OPCIONES',challenge,challenge?`${reasons(challenge.sig,{compact:true})} · vs ${display(challenge.occupant)}`:'','gain')}${chip('SE AFIANZA',strong,strong?reasons(strong.sig,{compact:true}):'','strong')}${chip('BAJO PRESIÓN',risk,risk?(risk.challenger?`${display(risk.challenger.p.name)} empuja · ${reasons(risk.sig,{compact:true})}`:reasons(risk.sig,{compact:true})):'','risk')}</div><p class="ri-note">La señal pondera Power, forma y última nota, y rebaja su confianza cuando la muestra es corta. El contexto táctico sigue mandando.</p>`;
}
function ensureUi(){
  const home=document.getElementById('inicio');if(!home)return null;let root=document.getElementById('roundImpactHome');if(root)return root;
  root=document.createElement('section');root.id='roundImpactHome';root.className='card ri-shell';const anchor=home.querySelector('.grid.cols-4');if(anchor)anchor.insertAdjacentElement('afterend',root);else home.querySelector('.hero')?.insertAdjacentElement('afterend',root);return root;
}
function ensureMatchdayUi(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('roundImpactMatchday');if(root)return root;
  root=document.createElement('section');root.id='roundImpactMatchday';root.className='card ri-matchday';const dynamic=document.getElementById('matchdayDynamic');if(dynamic)dynamic.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function openPlayerWhenReady(name,attempt=0){
  if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}
  if(typeof window.openPlayerHub==='function'){window.openPlayerHub(name);return}
  if(attempt<24)setTimeout(()=>openPlayerWhenReady(name,attempt+1),90);
}
function openDuel(a,b){
  safe(()=>showSection('comparador'));let tries=0;const apply=()=>{
    if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}
    const sa=document.getElementById('compareA'),sb=document.getElementById('compareB');if(sa&&sb){sa.value=a;sb.value=b;safe(()=>renderCompare());return}
    if(++tries<24)setTimeout(apply,90)
  };setTimeout(apply,0);
}
function bind(root){
  if(!root)return;
  root.querySelectorAll('[data-ri-player]').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.riPlayer;safe(()=>showSection('plantilla'));setTimeout(()=>openPlayerWhenReady(name),0)}));
  root.querySelectorAll('[data-ri-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.riDuel.split('|');openDuel(a,b)}));
  root.querySelectorAll('[data-ri-next]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>showSection(btn.dataset.riNext))));
  root.querySelector('[data-ri-go]')?.addEventListener('click',()=>{const target=document.getElementById('evolucion')?'evolucion':'estadisticas';safe(()=>showSection(target))});
}
function render(){
  const root=ensureUi();if(!root)return;const s=snapshot();if(!s){root.innerHTML='<div class="ri-empty">Esperando datos de temporada…</div>';return}
  const selection=selectionPressure(s),label=s.match.label||s.match.short||s.match.id,mover=s.powerMover,up=s.formUp,best=s.best;
  const movers=[...s.movements].sort((a,b)=>{const ad=a.newEntry?99:(a.rankDelta??-99),bd=b.newEntry?99:(b.rankDelta??-99);return bd-ad||(b.powerDelta??0)-(a.powerDelta??0)}).slice(0,5);
  const formTop=s.forms.filter(x=>Math.abs(x.delta)>=.05).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,5);
  root.innerHTML=`<div class="ri-head"><div><span>DESDE EL ÚLTIMO PARTIDO</span><h2>Qué cambió tras ${esc(label)}</h2><p>Comparamos la temporada justo antes y después de la última jornada: rendimiento del partido, forma y movimiento real en Power RM.</p></div><button class="btn" type="button" data-ri-go="1">Ver evolución</button></div><div class="ri-kpis"><article><span>MEJOR NOTA</span><b>${best?esc(display(best.name)):'—'}</b><strong>${best?best.rating.toFixed(2):'—'}</strong><small>${best?`${best.minutes}' · ${best.coverage}/3 fuentes`:'Sin nota oficial'}</small></article><article><span>MAYOR IMPULSO POWER</span><b>${mover?esc(display(mover.name)):'Sin subida'}</b><strong>${mover?`+${mover.powerDelta.toFixed(2)}`:'—'}</strong><small>${mover&&mover.previousRank?`Power propio · ranking #${mover.previousRank} → #${mover.rank}`:'Nadie aumentó su Power acumulado'}</small></article><article><span>FORMA QUE MÁS SUBE</span><b>${up?esc(display(up.name)):'—'}</b><strong>${up?`+${up.delta.toFixed(2)}`:'—'}</strong><small>${up?`${up.previous.toFixed(2)} → ${up.current.toFixed(2)}`:'Sin subida en la última nota'}</small></article></div><div class="ri-grid"><section><div class="ri-title"><span>POWER RM</span><h3>Movimientos de jerarquía</h3><small>Ranking acumulado antes → después de ${esc(label)}</small></div><div class="ri-list">${movers.length?movers.map(r=>playerButton(r,`<small>${Number.isFinite(r.powerDelta)?`${r.powerDelta>=0?'+':''}${r.powerDelta.toFixed(2)} Power`:'Primera muestra'}</small>`)).join(''):'<div class="ri-empty">Sin movimientos todavía.</div>'}</div></section><section><div class="ri-title"><span>FORMA</span><h3>Quién cambia de tendencia</h3><small>Diferencia entre sus dos últimas notas oficiales</small></div><div class="ri-form">${formTop.length?formTop.map(r=>`<button type="button" data-ri-player="${esc(r.name)}"><span><b>${esc(display(r.name))}</b><small>${r.previous.toFixed(2)} → ${r.current.toFixed(2)}</small></span><strong class="${r.delta>0?'up':'down'}">${r.delta>0?'+':''}${r.delta.toFixed(2)}</strong></button>`).join(''):'<div class="ri-empty">Aún no hay cambios de forma comparables.</div>'}</div></section></div>${nextXiHtml(selection)}`;
  bind(root);
  const matchdayRoot=ensureMatchdayUi();if(matchdayRoot){matchdayRoot.innerHTML=matchdayPressureHtml(selection);bind(matchdayRoot)}
  document.dispatchEvent(new CustomEvent('rm-round-impact-rendered',{detail:{match:s.match.id,best:s.best?.name||null,powerMover:s.powerMover?.name||null,formUp:s.formUp?.name||null,challengers:selection.challengers.map(x=>({name:x.p.name,confidence:x.sig.confidenceLabel,score:x.challengeScore})),pressure:selection.pressure.map(x=>({name:x.p.name,confidence:x.sig.confidenceLabel}))}}));
}
function completeInstall(){
  if(installed)return;installed=true;render();
  ['rm-season-extension-ready','rm-ranking-official-ready','rm-season-order-corrected','rm-season-data-ready','rm-current-match-idea-updated'].forEach(name=>document.addEventListener(name,render));
  document.addEventListener('rm-critical-modules-ready',()=>setTimeout(render,0));
  window.RMRoundImpact=Object.freeze({render,snapshot,selectionPressure,signalFor,weights:SIGNAL_WEIGHTS});
}
function tryInstall(){
  if(installed)return;
  if(data()&&document.getElementById('inicio')){completeInstall();return}
  if(++installAttempts<60)setTimeout(tryInstall,100);
}
document.addEventListener('rm-season-data-ready',tryInstall);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tryInstall,{once:true});
tryInstall();
})();