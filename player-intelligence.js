(()=>{
let installed=false,attempts=0,lastName=null,deepLinked=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function player(name){return safe(()=>players.find(p=>same(p.name,name)||same(p.short,name)),null)}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function slotDefs(){return safe(()=>slots.map(([key,label])=>({key,label})),[])||[]}
function slotLabel(key){return slotDefs().find(s=>s.key===key)?.label||key||'—'}
function currentUserXi(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function stability(){return safe(()=>window.RMXIStability?.state?.(),null)}
function levelRank(level){return level==='strong'?3:level==='open'?2:level==='consensus'?1:0}
function rowForProject(name){return [...(board()?.rows||[])].filter(r=>same(r.project,name)).sort((a,b)=>levelRank(b.decisionLevel)-levelRank(a.decisionLevel))[0]||null}
function rowForAlternative(name){return [...(board()?.rows||[])].filter(r=>same(r.primary?.name,name)||(r.alternatives||[]).some(a=>same(a.name,name))||same(r.challenger?.p?.name,name)).sort((a,b)=>levelRank(b.decisionLevel)-levelRank(a.decisionLevel))[0]||null}
function userSlots(name){const xi=currentUserXi();return slotDefs().filter(s=>same(xi?.[s.key],name))}
function communityRows(name){return (board()?.rows||[]).filter(r=>r.communityAvailable&&same(r.community?.name,name))}
function communityContext(name){
  const rows=communityRows(name);if(!rows.length)return {available:false,final:false,total:0,percentage:null,globalPercentage:null,slots:[]};
  const globals=rows.map(r=>Number(r.community?.globalPercentage)).filter(Number.isFinite),positionals=rows.map(r=>Number(r.community?.percentage)).filter(Number.isFinite);
  return {available:true,final:rows.some(r=>r.community?.final),total:Math.max(...rows.map(r=>Number(r.community?.total)||0),0),percentage:positionals.length?Math.max(...positionals):null,globalPercentage:globals.length?Math.max(...globals):null,slots:rows.map(r=>r.slot?.label||r.slot?.key).filter(Boolean)};
}
function roundSignal(name){
  const api=window.RMRoundImpact;if(!api?.snapshot||!api?.signalFor)return null;const snap=safe(()=>api.snapshot(),null);return snap?safe(()=>api.signalFor(name,snap),null):null;
}
function auditContext(name){
  const records=safe(()=>window.RMDecisionAudit?.records?.(),[])||[];let involved=0,starter=0,project=0,alternative=0,user=0,altResolved=0,altWins=0;
  for(const rec of records){const rows=rec.rows||[],mine=rows.filter(r=>same(r.project,name)||same(r.alternative,name)||same(r.user,name)||same(r.community,name));if(!mine.length)continue;involved++;if((rec.officialXI||[]).some(n=>same(n,name)))starter++;
    for(const r of mine){if(same(r.project,name))project++;if(same(r.alternative,name)){alternative++;if(r.debateOutcome==='alternative'||r.debateOutcome==='project'){altResolved++;if(r.debateOutcome==='alternative')altWins++}}if(same(r.user,name)&&r.userDiff)user++}
  }
  return {involved,starter,project,alternative,user,altResolved,altWins};
}
function decisionContext(name){
  const p=player(name),projectRow=rowForProject(name),alternativeRow=rowForAlternative(name),mine=userSlots(name),community=communityContext(name),audit=auditContext(name),sig=roundSignal(name);
  const kind=projectRow?'project':alternativeRow?'alternative':'outside';
  const opponent=projectRow?.primary?.name||projectRow?.challenger?.p?.name||alternativeRow?.project||safe(()=>window.RMPlayerExperience?.context?.(name)?.peer,null);
  const stabilityRow=(stability()?.rows||[]).find(r=>same(r.current,name))||null;
  return {player:p,kind,projectRow,alternativeRow,mine,community,audit,sig,stabilityRow,opponent,match:currentMatch()};
}
function dataSignal(ctx){
  if(ctx.stabilityRow)return {title:ctx.stabilityRow.label||'ESTABLE',text:ctx.stabilityRow.detail||'Sin presión fuerte detectada.'};
  if(ctx.alternativeRow)return {title:ctx.alternativeRow.decisionLabel==='DEBATE FUERTE'?'PRESIONA FUERTE':'ENTRA EN DEBATE',text:`Compite por ${ctx.alternativeRow.slot?.label||ctx.alternativeRow.slot?.key||'un puesto'} frente a ${display(ctx.alternativeRow.project)}.`};
  if(Number.isFinite(ctx.sig?.momentum)){const m=ctx.sig.momentum,title=m>=.18?'IMPULSO POSITIVO':m<=-.18?'IMPULSO NEGATIVO':'SEÑAL NEUTRA',support=Number.isFinite(ctx.sig.confidence)?` · respaldo ${ctx.sig.confidence>=.76?'alto':ctx.sig.confidence>=.52?'medio':'bajo'}`:'';return {title,text:`Momentum ${m>0?'+':''}${m.toFixed(2)}${support}`}}
  return {title:'SIN SEÑAL',text:'No hay suficiente información reciente para una lectura fuerte.'};
}
function projectSignal(ctx){
  const r=ctx.projectRow;if(r)return {title:'EN NUESTRO XI',text:`${r.slot?.label||r.slot?.key||'Puesto'} · ${r.decisionLabel||'CONSENSO'}`};
  const a=ctx.alternativeRow;if(a)return {title:'ALTERNATIVA',text:`${a.slot?.label||a.slot?.key||'Puesto'} · frente a ${display(a.project)}`};
  return {title:'FUERA DE LA PROPUESTA',text:'Ahora mismo no aparece en nuestra mesa principal de los 11 puestos.'};
}
function mineSignal(ctx){
  if(ctx.mine.length)return {title:'EN TU XI',text:ctx.mine.map(s=>s.label).join(' · ')};
  return {title:'FUERA DE TU BORRADOR',text:'No está seleccionado ahora mismo en tu predicción.'};
}
function communitySignal(ctx){
  const c=ctx.community;if(!c.available)return {title:'SIN DATO',text:'La comunidad no está disponible para este jugador en el partido actual.'};
  const pct=Number.isFinite(c.globalPercentage)?`${Math.round(c.globalPercentage)}% global`:Number.isFinite(c.percentage)?`${Math.round(c.percentage)}% por puesto`:'Con votos';
  return {title:pct,text:`${c.final?'Consenso final':'Consenso provisional'}${c.slots.length?` · ${[...new Set(c.slots)].join(' / ')}`:''}`};
}
function badge(ctx){if(ctx.kind==='project')return {cls:ctx.projectRow?.decisionLevel||'project',label:ctx.projectRow?.decisionLabel||'EN PROYECTO'};if(ctx.kind==='alternative')return {cls:'alternative',label:'ALTERNATIVA ACTIVA'};return {cls:'outside',label:'FUERA DEL DEBATE'};}
function historyHtml(a){
  if(!a.involved)return '<div class="pi-history-empty"><b>HISTÓRICO AUDITADO</b><span>Todavía no aparece en un debate congelado con XI oficial posterior.</span></div>';
  const alt=a.altResolved?`${a.altWins}/${a.altResolved}`:'—';return `<div class="pi-history"><div><span>HISTÓRICO AUDITADO</span><b>${a.involved}</b><small>partidos con contexto</small></div><div><span>Titular después</span><b>${a.starter}/${a.involved}</b><small>presencia en XI oficial</small></div><div><span>Como alternativa</span><b>${alt}</b><small>duelos resueltos ganados</small></div><div><span>Roles congelados</span><b>${a.project}·${a.alternative}·${a.user}</b><small>proyecto · alt · tu XI</small></div></div>`;
}
function ensureRoot(){
  const content=document.getElementById('playerHubContent');if(!content)return null;let root=content.querySelector('.pi-shell');if(root)return root;
  root=document.createElement('section');root.className='pi-shell';const anchor=content.querySelector('.px-modal-top-actions')||content.querySelector('.player-sheet-tags')||content.querySelector('.player-sheet-head');if(anchor)anchor.insertAdjacentElement('afterend',root);else content.prepend(root);return root;
}
function render(name=lastName){
  if(!name)return;const ctx=decisionContext(name),root=ensureRoot();if(!ctx.player||!root)return;lastName=ctx.player.name;
  const p=projectSignal(ctx),m=mineSignal(ctx),c=communitySignal(ctx),d=dataSignal(ctx),b=badge(ctx),rival=ctx.match?.rival||'próximo rival';
  root.innerHTML=`<div class="pi-head"><div><span>PLAYER EXPERIENCE V2 · PRÓXIMO PARTIDO</span><h3>${esc(display(ctx.player.name))} ante ${esc(rival)}</h3><p>Una sola lectura de rendimiento, papel en nuestro XI, tu borrador, comunidad y presión de datos.</p></div><em class="${esc(b.cls)}">${esc(b.label)}</em></div><div class="pi-lenses"><div><span>PROYECTO</span><b>${esc(p.title)}</b><small>${esc(p.text)}</small></div><div><span>TU XI</span><b>${esc(m.title)}</b><small>${esc(m.text)}</small></div><div><span>COMUNIDAD</span><b>${esc(c.title)}</b><small>${esc(c.text)}</small></div><div><span>DATOS</span><b>${esc(d.title)}</b><small>${esc(d.text)}</small></div></div>${historyHtml(ctx.audit)}<div class="pi-actions">${ctx.opponent&&!same(ctx.opponent,ctx.player.name)?`<button type="button" class="btn primary" data-pi-duel="${esc(ctx.player.name)}|${esc(ctx.opponent)}">Comparar con ${esc(display(ctx.opponent))}</button><button type="button" class="btn" data-pi-radar="${esc(ctx.player.name)}|${esc(ctx.opponent)}">Abrir radar</button>`:''}<button type="button" class="btn" data-pi-prediction>Ver decisiones del XI</button></div><p class="pi-note">Esta capa no calcula una probabilidad de titularidad. Resume señales reales disponibles y mantiene separado lo provisional de lo auditado después del XI oficial.</p>`;
  bind(root);
  document.dispatchEvent(new CustomEvent('rm-player-intelligence-rendered',{detail:{player:ctx.player.name,kind:ctx.kind,opponent:ctx.opponent||null,auditedMatches:ctx.audit.involved}}));
}
function retryAction(action,max=24){let n=0;const go=()=>{if(action())return;if(++n<max)setTimeout(go,90)};go()}
function openDuel(a,b){safe(()=>closePlayerHub());safe(()=>showSection('comparador'));retryAction(()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return true}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;safe(()=>renderCompare());return true}return false})}
function openRadar(a,b){safe(()=>closePlayerHub());safe(()=>showSection('radar'));retryAction(()=>{if(window.RMDecisionRadar?.set){window.RMDecisionRadar.set(a,b);return true}if(typeof window.selectRadarPreset==='function'){safe(()=>window.selectRadarPreset(a,b));return true}return false})}
function openPrediction(){safe(()=>closePlayerHub());safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('decisionBoard')?.scrollIntoView?.({behavior:'smooth',block:'start'}),120)}
function bind(root){root.querySelectorAll('[data-pi-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.piDuel.split('|');openDuel(a,b)}));root.querySelectorAll('[data-pi-radar]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.piRadar.split('|');openRadar(a,b)}));root.querySelector('[data-pi-prediction]')?.addEventListener('click',openPrediction)}
function hookPlayerHub(){
  if(typeof openPlayerHub!=='function')return false;if(openPlayerHub.__piWrapped)return true;const base=openPlayerHub;
  const wrapped=function(name){const out=base(name);lastName=player(name)?.name||name;setTimeout(()=>render(lastName),40);return out};wrapped.__piWrapped=true;wrapped.__piBase=base;openPlayerHub=wrapped;return true;
}
function refresh(){if(lastName&&document.getElementById('playerHubModal')?.classList.contains('open'))render(lastName)}
function openDeepLink(){
  if(deepLinked)return;const name=safe(()=>new URL(location.href).searchParams.get('player'),'');if(!name)return;deepLinked=true;safe(()=>showSection('plantilla'));retryAction(()=>{if(typeof openPlayerHub==='function'){openPlayerHub(name);return true}return false},30);
}
function bindEvents(){
  ['rm-decision-board-rendered','rm-xi-stability-rendered','rm-community-updated','rm-local-prediction-updated','rm-decision-audit-updated','rm-round-impact-rendered','rm-season-data-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(refresh,70)));
  document.addEventListener('rm-modules-ready',()=>{hookPlayerHub();setTimeout(refresh,80)});
}
function install(){
  if(installed)return;if(typeof players==='undefined'||typeof openPlayerHub!=='function'||!document.getElementById('plantilla')){if(++attempts<100)setTimeout(install,100);return}
  installed=true;hookPlayerHub();bindEvents();openDeepLink();window.RMPlayerIntelligence=Object.freeze({render,refresh,context:decisionContext,open:name=>{safe(()=>showSection('plantilla'));retryAction(()=>{if(typeof openPlayerHub==='function'){openPlayerHub(name);return true}return false})}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();