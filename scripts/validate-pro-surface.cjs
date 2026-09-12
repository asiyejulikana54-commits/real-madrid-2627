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
console.log(`PRO surface audit: OK · ${surfaces.length} superficies con capa PRO + ${semantic.length} capas PRO funcionales`);
