const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const sw=read('sw.js');
const polish=read('public-polish.js');
const personalNav=read('personal-nav.js');

const surfaces=[
  ['Inicio','home-pro.js','home-pro.css','RMHomePro','loadHomePro','public'],
  ['Plantilla','squad-pro.js','squad-pro.css','RMSquadPro','loadSquadPro','public'],
  ['Ficha de jugador','player-intelligence.js','player-intelligence.css','RMPlayerIntelligence','loadPlayerIntelligence','public'],
  ['Estadísticas','stats-pro.js','stats-pro.css','RMStatsPro','loadStatsPro','public'],
  ['Eficiencia','efficiency-pro.js','efficiency-pro.css','RMEfficiencyPro','loadEfficiencyPro','public'],
  ['Power RM','power-pro.js','power-pro.css','RMPowerPro','loadPowerPro','public'],
  ['Comparador','compare-pro.js','compare-pro.css','RMComparePro','loadComparePro','public'],
  ['Partidos','match-history-pro.js','match-history-pro.css','RMMatchHistoryPro','loadMatchHistoryPro','public'],
  ['Partido','matchday-pro.js','matchday-pro.css','RMMatchdayPro','loadMatchdayPro','public'],
  ['Predicción','prediction-pro.js','prediction-pro.css','RMPredictionPro','loadPredictionPro','public'],
  ['Constructor XI','lineup-pro.js','lineup-pro.css','RMLineupPro','loadLineupPro','public'],
  ['Evolución','evolution-pro.js','evolution-pro.css','RMEvolutionPro','loadEvolutionPro','public'],
  ['Mi temporada','personal-season-pro.js','personal-season-pro.css','RMPersonalSeasonPro','loadPersonalSeasonPro','personal'],
  ['Comunidad','community-pro.js','community-pro.css','RMCommunityPro','loadCommunityPro','personal']
];

for(const [name,js,css,api,loader,where] of surfaces){
  if(!exists(js))failures.push(`${name}: falta ${js}`);
  if(!exists(css))failures.push(`${name}: falta ${css}`);
  if(!exists(js)||!exists(css))continue;
  const code=read(js);
  try{new vm.Script(code,{filename:js})}catch(error){failures.push(`${name}: ${js} no compila: ${error.message}`)}
  if(!code.includes(api))failures.push(`${name}: falta API ${api}`);
  if(/MutationObserver\s*\(/.test(code))failures.push(`${name}: usa MutationObserver`);
  const loaderSource=where==='personal'?personalNav:polish;
  if(!loaderSource.includes(loader))failures.push(`${name}: falta loader ${loader}`);
  if(!sw.includes(`'${js}'`)||!sw.includes(`'${css}'`))failures.push(`${name}: no está completo en la PWA`);
}

const stats=read('stats-pro.js');
for(const marker of ['VENTANA DINÁMICA','spCompetition','spHorizon','COMPARACIÓN RÁPIDA','rm_stats_pro_v2_state','SC no equivale a 0']){
  if(!stats.includes(marker))failures.push(`Estadísticas PRO V2: falta ${marker}`);
}
const community=read('community-pro.js');
for(const marker of ['COMUNIDAD PRO','MAPA DE CONSENSO','VOTO GLOBAL MULTIPOSICIÓN','rm_community_pro_snapshots_v1','Consenso fuerte']){
  if(!community.includes(marker))failures.push(`Comunidad PRO: falta ${marker}`);
}
if(/\bfetch\s*\(/.test(community))failures.push('Comunidad PRO no debe hacer llamadas de red propias; debe consumir RMCommunityData');

const playerIntelligence=read('player-intelligence.js');
for(const marker of ['PLAYER EXPERIENCE V2 · PRÓXIMO PARTIDO','HISTÓRICO AUDITADO','RMDecisionBoard','RMDecisionAudit','attempts<100','rm-player-intelligence-rendered']){
  if(!playerIntelligence.includes(marker))failures.push(`Player Experience V2: falta ${marker}`);
}
if(/\bfetch\s*\(/.test(playerIntelligence))failures.push('Player Experience V2 no debe hacer llamadas de red propias; debe reutilizar las capas de datos existentes');

if(!exists('analysis-context.js'))failures.push('Contexto compartido: falta analysis-context.js');
else{
  const ctx=read('analysis-context.js');
  try{new vm.Script(ctx,{filename:'analysis-context.js'})}catch(error){failures.push(`Contexto compartido: no compila: ${error.message}`)}
  for(const marker of ['RMAnalysisContext','rm_analysis_context_v1','rm-analysis-context-updated','spCompetition','spHorizon','syncStats'])if(!ctx.includes(marker))failures.push(`Contexto compartido: falta ${marker}`);
  if(/MutationObserver\s*\(/.test(ctx))failures.push('Contexto compartido: usa MutationObserver');
  if(!polish.includes('loadAnalysisContext')||!polish.includes('analysis-context.js?v=1'))failures.push('Contexto compartido: no se carga desde public-polish');
  if(!sw.includes("'analysis-context.js'"))failures.push('Contexto compartido: no está en la PWA');
  for(const file of ['power-pro.js','efficiency-pro.js','evolution-pro.js']){
    const code=read(file);if(!code.includes('RMAnalysisContext')||!code.includes('rm-analysis-context-updated'))failures.push(`Contexto compartido: ${file} no está conectado`);
  }
}

if(!exists('lineup-semantics.js'))failures.push('Semántica XI: falta lineup-semantics.js');
else{
  const code=read('lineup-semantics.js');
  try{new vm.Script(code,{filename:'lineup-semantics.js'})}catch(error){failures.push(`Semántica XI: no compila: ${error.message}`)}
  for(const marker of ['RMLineupSemantics','normalizeAgainst','roleScore','equivalent','rm-lineup-semantics-ready'])if(!code.includes(marker))failures.push(`Semántica XI: falta ${marker}`);
  if(!sw.includes("'lineup-semantics.js'"))failures.push('Semántica XI: no está en la PWA');
  for(const [file,marker] of [['xi-stability.js','RMLineupSemantics'],['consensus-xi.js','normalizeAgainst'],['prediction-pro.js','equivalent'],['prediction-analytics.js','roleScore']])if(!read(file).includes(marker))failures.push(`Semántica XI: ${file} no está conectado a ${marker}`);
  try{
    const slots=[['gk','POR',0,0,'POR'],['lb','LI',0,0,'LI'],['lcb','DFC',0,0,'DFC'],['rcb','DFC',0,0,'DFC'],['rb','LD',0,0,'LD'],['dm1','MC',0,0,'MC'],['dm2','MC',0,0,'MC'],['am','MP',0,0,'MP'],['lw','EI',0,0,'EI'],['rw','ED',0,0,'ED'],['st','DC',0,0,'DC']];
    const sandbox={window:{RMSeasonData:{canonical:n=>n}},slots,document:{dispatchEvent(){}},CustomEvent:function(){}};vm.createContext(sandbox);new vm.Script(code).runInContext(sandbox);const api=sandbox.window.RMLineupSemantics;
    const base={gk:'Courtois',lb:'Carreras',lcb:'Rüdiger',rcb:'Huijsen',rb:'Trent',dm1:'Valverde',dm2:'Güler',am:'Bellingham',lw:'Vini',rw:'Diomande',st:'Mbappé'};
    const swapped={...base,lcb:'Huijsen',rcb:'Rüdiger',dm1:'Güler',dm2:'Valverde'},swapResult=api.compare(base,swapped);
    if(swapResult.count!==0||!swapResult.equivalent)failures.push('Semántica XI: una permuta DFC/MC se sigue contando como cambio');
    const changed={...swapped,lcb:'Konaté',rcb:'Huijsen'},changeResult=api.compare(base,changed);
    if(changeResult.count!==1||changeResult.bySlot.lcb.user!=='Konaté'||changeResult.bySlot.rcb.changed)failures.push('Semántica XI: no identifica correctamente un cambio real de central');
    const roleSwap={...base,rb:'Valverde',dm1:'Trent'};if(api.compare(base,roleSwap).count!==2)failures.push('Semántica XI: una permuta entre roles distintos debe seguir siendo cambio');
  }catch(error){failures.push(`Semántica XI: prueba funcional falló: ${error.message}`)}
}

if(!exists('consensus-xi.js')||!exists('scenario-audit.js'))failures.push('Síntesis auditable: faltan módulos');
else{
  const consensus=read('consensus-xi.js'),audit=read('scenario-audit.js');
  try{new vm.Script(consensus,{filename:'consensus-xi.js'})}catch(error){failures.push(`Síntesis auditable: consensus-xi.js no compila: ${error.message}`)}
  try{new vm.Script(audit,{filename:'scenario-audit.js'})}catch(error){failures.push(`Síntesis auditable: scenario-audit.js no compila: ${error.message}`)}
  for(const marker of ['auditableState','finalCommunityOnly','provisionalCommunity','EXPLORATORIO','AUDITABLE'])if(!consensus.includes(marker))failures.push(`Síntesis auditable: consensus-xi.js carece de ${marker}`);
  if(!audit.includes('auditableState'))failures.push('Síntesis auditable: Scenario Audit no consume auditableState');
  if(!audit.includes('auditSafe:true'))failures.push('Síntesis auditable: Scenario Audit no marca los nuevos snapshots seguros');
  if(!audit.includes('no modifica snapshots históricos')&&!audit.includes('no se reescriben'))failures.push('Síntesis auditable: falta política de no reescritura histórica');
  if(!sw.includes("'consensus-xi.js'")||!sw.includes("'scenario-audit.js'"))failures.push('Síntesis auditable: módulos fuera de la PWA');
}

const semantic=[
  ['Jerarquías','hierarchy.js','RMHierarchyPro','JERARQUÍAS PRO'],
  ['Inteligencia','intelligence.js','RMIntelligencePro','CENTRO DE INTELIGENCIA PRO'],
  ['Laboratorio XI','lineuplab.js','RMLineupLabPro','LABORATORIO XI PRO'],
  ['Radar de decisión','decisionradar.js','RMDecisionRadar','VENTAJA REAL']
];
for(const [name,file,api,marker] of semantic){
  if(!exists(file)){failures.push(`${name}: falta ${file}`);continue}
  const code=read(file);try{new vm.Script(code,{filename:file})}catch(error){failures.push(`${name}: no compila: ${error.message}`)}
  if(!code.includes(api)||!code.includes(marker))failures.push(`${name}: no conserva su contrato PRO funcional`);
}

if(!exists('PRO_AUDIT.md'))failures.push('Falta PRO_AUDIT.md');
if(failures.length){console.error('PRO surface audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PRO surface audit: OK · ${surfaces.length} superficies con capa PRO + ${semantic.length} capas PRO funcionales + contexto compartido + semántica XI + síntesis auditable`);
