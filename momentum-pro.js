(()=>{
const STORAGE='rm_momentum_pro_v1';
const DEFAULTS={window:3,minRecent:45,minSeason:90};
let installed=false,attempts=0,state=loadState();
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function playerList(){return safe(()=>players,[])||[]}
function season(){return window.RMSeasonData||null}
function loadState(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return {...DEFAULTS}}}
function saveState(){try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}}
function context(){return safe(()=>window.RMAnalysisContext?.state?.(),{competition:'ALL',horizon:'ALL'})||{competition:'ALL',horizon:'ALL'}}
function allMatches(){return safe(()=>season()?.matches||[],[])||[]}
function matchHasData(match){return playerList().some(p=>Number(safe(()=>season()?.minutes?.(match.id,p.name),0))>0||Number.isFinite(safe(()=>season()?.officialRatingEntry?.(match.id,p.name)?.value,null)))}
function completedMatches(){const comp=context().competition;return allMatches().filter(m=>(comp==='ALL'||m.comp===comp)&&matchHasData(m))}
function currentWindow(){const all=completedMatches(),n=Math.max(1,Math.min(Number(state.window)||3,all.length||1));return all.slice(-n)}
function weighted(name,matches){
  let ratedMinutes=0,totalPoints=0,minutes=0,appearances=0,ratedMatches=0,complete=0,unrated=0;
  for(const match of matches){
    const min=Number(safe(()=>season()?.minutes?.(match.id,name),0))||0;if(min<=0)continue;appearances++;minutes+=min;
    const entry=safe(()=>season()?.officialRatingEntry?.(match.id,name),null);
    if(Number.isFinite(entry?.value)){ratedMinutes+=min;totalPoints+=entry.value*min/90;ratedMatches++;if(entry.sourceCount===3)complete++}
    else if(entry?.status==='unrated')unrated++;
  }
  return {rating:ratedMinutes?totalPoints*90/ratedMinutes:null,ratedMinutes,totalPoints,minutes,appearances,ratedMatches,complete,unrated,coverage:appearances?ratedMatches/appearances:null};
}
function support(recent,full){
  if(recent.ratedMinutes>=135&&full.ratedMinutes>=270)return {level:'strong',label:'Alta'};
  if(recent.ratedMinutes>=90&&full.ratedMinutes>=180)return {level:'good',label:'Media'};
  if(recent.ratedMinutes>=45&&full.ratedMinutes>=90)return {level:'provisional',label:'Provisional'};
  return {level:'short',label:'Muestra corta'};
}
function row(p){
  const full=weighted(p.name,completedMatches()),recent=weighted(p.name,currentWindow()),delta=Number.isFinite(recent.rating)&&Number.isFinite(full.rating)?recent.rating-full.rating:null,s=support(recent,full);
  return {p,full,recent,delta,support:s,eligible:Number.isFinite(delta)&&recent.ratedMinutes>=state.minRecent&&full.ratedMinutes>=state.minSeason};
}
function rows(){return playerList().map(row).filter(r=>r.full.minutes>0||r.recent.minutes>0)}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function signed(v,d=2){return Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(d)}`:'—'}
function trendClass(v){if(!Number.isFinite(v)||Math.abs(v)<.05)return 'flat';return v>0?'up':'down'}
function labelWindow(){const ms=currentWindow();if(!ms.length)return 'sin jornadas con datos';return `${ms.length===1?'última jornada':`últimas ${ms.length} jornadas`}`}
function competitionLabel(){const c=context().competition;return c==='ALL'?'todas las competiciones':c}
function leaders(){
  const valid=rows().filter(r=>r.eligible).sort((a,b)=>b.delta-a.delta||b.recent.ratedMinutes-a.recent.ratedMinutes);
  return {riser:valid[0]&&valid[0].delta>0?valid[0]:null,faller:valid.at(-1)&&valid.at(-1).delta<0?valid.at(-1):null,valid};
}
function debateRows(){
  const board=safe(()=>window.RMDecisionBoard?.state?.(),null);if(!board)return [];
  const win=currentWindow(),fullMatches=completedMatches();
  return (board.rows||[]).filter(r=>r.primary?.name&&canonical(r.primary.name)!==canonical(r.project)).map(r=>{
    const projectRecent=weighted(r.project,win),altRecent=weighted(r.primary.name,win),projectFull=weighted(r.project,fullMatches),altFull=weighted(r.primary.name,fullMatches);
    const recentEdge=Number.isFinite(projectRecent.rating)&&Number.isFinite(altRecent.rating)?projectRecent.rating-altRecent.rating:null;
    const seasonEdge=Number.isFinite(projectFull.rating)&&Number.isFinite(altFull.rating)?projectFull.rating-altFull.rating:null;
    const comparable=projectRecent.ratedMinutes>=state.minRecent&&altRecent.ratedMinutes>=state.minRecent&&Number.isFinite(recentEdge);
    const favored=comparable&&Math.abs(recentEdge)>=.15?(recentEdge>0?r.project:r.primary.name):null;
    const seasonFavored=Number.isFinite(seasonEdge)&&Math.abs(seasonEdge)>=.15?(seasonEdge>0?r.project:r.primary.name):null;
    return {slot:r.slot?.label||r.slot?.role||r.slot?.key||'Puesto',project:r.project,alternative:r.primary.name,projectRecent,altRecent,projectFull,altFull,recentEdge,seasonEdge,comparable,favored,seasonFavored,turn:Boolean(favored&&seasonFavored&&canonical(favored)!==canonical(seasonFavored)),level:r.decisionLevel};
  }).sort((a,b)=>Number(b.turn)-Number(a.turn)||Math.abs(b.recentEdge||0)-Math.abs(a.recentEdge||0));
}
function openPlayer(name){safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}if(typeof openPlayerHub==='function'){openPlayerHub(name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function openCompare(a,b){safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;A.dispatchEvent(new Event('change',{bubbles:true}));B.dispatchEvent(new Event('change',{bubbles:true}));return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function ensureStats(){
  const section=document.getElementById('estadisticas');if(!section)return null;let root=document.getElementById('momentumPro');if(root)return root;
  root=document.createElement('section');root.id='momentumPro';root.className='momentum-pro card';const anchor=document.getElementById('statsPro')||section.querySelector('.section-head');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('momentumDebates');if(root)return root;
  root=document.createElement('section');root.id='momentumDebates';root.className='momentum-debates card';const anchor=document.getElementById('decisionBoard')||document.getElementById('xiStability')||document.getElementById('predictionAnalytics');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function controls(){return `<div class="mp-controls"><div><span>VENTANA RECIENTE</span><div class="mp-window">${[1,3,5].map(n=>`<button type="button" data-mp-window="${n}" class="${Number(state.window)===n?'active':''}">${n===1?'Último':`Últimos ${n}`}</button>`).join('')}</div></div><button type="button" class="btn" data-mp-apply>${String(context().horizon)===String(state.window)?'Ventana aplicada al análisis':'Aplicar al análisis global'}</button></div>`}
function leaderCard(label,r,kind){
  if(!r)return `<article class="mp-leader neutral"><span>${esc(label)}</span><b>Sin señal suficiente</b><small>Se exige al menos ${state.minRecent} min recientes y ${state.minSeason} min de temporada con nota.</small></article>`;
  return `<button type="button" class="mp-leader ${kind}" data-mp-player="${esc(r.p.name)}"><span>${esc(label)}</span><b>${esc(display(r.p.name))}</b><strong>${signed(r.delta)}</strong><small>${fmt(r.recent.rating)} reciente · ${fmt(r.full.rating)} temporada · ${r.recent.ratedMinutes} min con nota</small></button>`;
}
function statsTable(rs){
  const visible=[...rs].filter(r=>Number.isFinite(r.delta)).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||b.recent.ratedMinutes-a.recent.ratedMinutes).slice(0,12);
  if(!visible.length)return '<div class="mp-empty"><b>Sin comparación disponible.</b><span>Necesitamos al menos una nota reciente y una media de temporada para el mismo jugador.</span></div>';
  return `<div class="mp-table"><div class="mp-row head"><span>Jugador</span><span>Reciente</span><span>Temporada</span><span>Δ forma</span><span>Respaldo</span></div>${visible.map(r=>`<button type="button" class="mp-row" data-mp-player="${esc(r.p.name)}"><span><b>${esc(display(r.p.name))}</b><small>${esc(r.p.pos)}</small></span><span><b>${fmt(r.recent.rating)}</b><small>${r.recent.ratedMinutes} min</small></span><span><b>${fmt(r.full.rating)}</b><small>${r.full.ratedMinutes} min</small></span><span class="${trendClass(r.delta)}"><b>${signed(r.delta)}</b><small>${Math.abs(r.delta)<.05?'estable':r.delta>0?'por encima de su media':'por debajo de su media'}</small></span><span class="support ${r.support.level}"><b>${esc(r.support.label)}</b><small>cobertura ${Number.isFinite(r.recent.coverage)?`${Math.round(r.recent.coverage*100)}%`:'—'}</small></span></button>`).join('')}</div>`;
}
function renderStats(){
  const root=ensureStats();if(!root||!season())return;const rs=rows(),lead=leaders(),matches=currentWindow();
  root.innerHTML=`<div class="mp-head"><div><span>MOMENTUM PRO · FORMA VS TEMPORADA</span><h3>Quién está jugando por encima o por debajo de su nivel habitual</h3><p>Comparamos la media ponderada por minutos de ${esc(labelWindow())} con la media de temporada del mismo jugador. La ventana reciente forma parte de la media de temporada: esto mide desviación respecto a su nivel habitual, no dos muestras independientes.</p></div><small>${esc(competitionLabel())} · ${matches.length} jornada${matches.length===1?'':'s'} con datos</small></div>${controls()}<div class="mp-leaders">${leaderCard('MAYOR SUBIDA RELATIVA',lead.riser,'up')}${leaderCard('MAYOR BAJADA RELATIVA',lead.faller,'down')}</div>${statsTable(rs)}<p class="mp-note">SC, ausencia y partido sin calificación nunca se convierten en 0. Las señales con menos de ${state.minRecent} minutos recientes o ${state.minSeason} minutos de temporada se muestran, pero no entran en “mayor subida/bajada”. Esto es forma relativa, no probabilidad de titularidad.</p>`;
  bind(root);document.dispatchEvent(new CustomEvent('rm-momentum-pro-rendered',{detail:{window:state.window,competition:context().competition,valid:lead.valid.length}}));
}
function debateCard(d){
  const label=!d.comparable?'MUESTRA INSUFICIENTE':!d.favored?'MUY IGUALADO':d.turn?'GIRO RECIENTE':canonical(d.favored)===canonical(d.project)?'FORMA APOYA PROYECTO':'FORMA APOYA ALTERNATIVA';
  const cls=!d.comparable?'muted':d.turn?'turn':d.favored&&canonical(d.favored)===canonical(d.alternative)?'challenge':'project';
  const copy=!d.comparable?`Se necesitan ${state.minRecent}+ min recientes con nota para ambos.`:d.favored?`${display(d.favored)} tiene ventaja reciente de ${Math.abs(d.recentEdge).toFixed(2)} puntos${d.turn?' y cambia el sentido del duelo respecto a la media de temporada.':'.'}`:'La diferencia reciente es menor de 0,15 puntos.';
  return `<button type="button" class="mp-debate ${cls}" data-mp-duel="${esc(d.project)}|${esc(d.alternative)}"><div><span>${esc(d.slot)} · ${esc(label)}</span><b>${esc(display(d.project))} <i>vs</i> ${esc(display(d.alternative))}</b><small>${esc(copy)}</small></div><div class="mp-debate-score"><p><span>Reciente</span><b>${fmt(d.projectRecent.rating)} · ${fmt(d.altRecent.rating)}</b></p><p><span>Temporada</span><b>${fmt(d.projectFull.rating)} · ${fmt(d.altFull.rating)}</b></p></div></button>`;
}
function renderPrediction(){
  const root=ensurePrediction();if(!root)return;const ds=debateRows();
  root.innerHTML=`<div class="mp-debate-head"><div><span>MOMENTUM EN LOS DEBATES</span><h3>¿La forma reciente cambia alguno de nuestros duelos?</h3><p>Cruzamos la misma ventana de Momentum PRO con la Mesa de decisiones. Solo compara rendimiento; no sustituye descanso, encaje táctico, rival ni jerarquía.</p></div><button type="button" class="btn" data-mp-stats>Ver Momentum PRO</button></div><div class="mp-debate-list">${ds.length?ds.slice(0,4).map(debateCard).join(''):'<div class="mp-empty"><b>Sin debates comparables.</b><span>Cuando la Mesa de decisiones tenga una alternativa real, aquí veremos si la forma reciente empuja el duelo.</span></div>'}</div><p class="mp-note">Ventana: ${esc(labelWindow())} · ${esc(competitionLabel())}. Diferencia mínima para señalar ventaja: 0,15 puntos con ${state.minRecent}+ minutos recientes con nota por jugador.</p>`;
  bind(root);
}
function bind(root){
  root.querySelectorAll('[data-mp-window]').forEach(btn=>btn.addEventListener('click',()=>{state.window=Number(btn.dataset.mpWindow)||3;saveState();render()}));
  root.querySelector('[data-mp-apply]')?.addEventListener('click',()=>safe(()=>window.RMAnalysisContext?.set?.({horizon:String(state.window)},'momentum-ui')));
  root.querySelectorAll('[data-mp-player]').forEach(btn=>btn.addEventListener('click',()=>openPlayer(btn.dataset.mpPlayer)));
  root.querySelectorAll('[data-mp-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.mpDuel.split('|');openCompare(a,b)}));
  root.querySelector('[data-mp-stats]')?.addEventListener('click',()=>{safe(()=>showSection('estadisticas'));setTimeout(()=>document.getElementById('momentumPro')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)});
}
function render(){renderStats();renderPrediction()}
function syncFromContext(){const h=String(context().horizon);if(['1','3','5'].includes(h)){state.window=Number(h);saveState()}render()}
function install(){
  if(installed)return;if(!season()||typeof players==='undefined'||!document.getElementById('estadisticas')){if(++attempts<100)setTimeout(install,80);return}
  installed=true;render();
  ['rm-analysis-context-updated','rm-season-data-ready','rm-season-extension-ready','rm-season-order-corrected','rm-decision-board-rendered'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(ev==='rm-analysis-context-updated'?syncFromContext:render,50)));
  window.RMMomentumPro=Object.freeze({render,rows,debates:debateRows,state:()=>({...state,context:context(),windowMatches:currentWindow().map(m=>m.id)}),setWindow:n=>{if([1,3,5].includes(Number(n))){state.window=Number(n);saveState();render()}return state.window}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
