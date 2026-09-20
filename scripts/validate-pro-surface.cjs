const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));
const compile=file=>{try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}};
const sw=read('sw.js'),polish=read('public-polish.js'),personalNav=read('personal-nav.js'),communityLoader=read('community.js');

const surfaces=[
  ['Inicio','home-pro.js','home-pro.css','RMHomePro','loadHomePro','public'],
  ['Plantilla','squad-pro.js','squad-pro.css','RMSquadPro','loadSquadPro','public'],
  ['Estadísticas','stats-pro.js','stats-pro.css','RMStatsPro','loadStatsPro','public'],
  ['Eficiencia','efficiency-pro.js','efficiency-pro.css','RMEfficiencyPro','loadEfficiencyPro','public'],
  ['Power RM','power-pro.js','power-pro.css','RMPowerPro','loadPowerPro','public'],
  ['Comparador','compare-pro.js','compare-pro.css','RMComparePro','loadComparePro','public'],
  ['Partidos','match-history-pro.js','match-history-pro.css','RMMatchHistoryPro','loadMatchHistoryPro','public'],
  ['Evolución','evolution-pro.js','evolution-pro.css','RMEvolutionPro','loadEvolutionPro','public'],
  ['Mi temporada','personal-season-pro.js','personal-season-pro.css','RMPersonalSeasonPro','loadPersonalSeasonPro','personal'],
  ['Comunidad','community-pro.js','community-pro.css','RMCommunityPro','loadCommunityPro','personal']
];
for(const [name,js,css,api,loader,where] of surfaces){
  if(!exists(js))failures.push(`${name}: falta ${js}`);if(!exists(css))failures.push(`${name}: falta ${css}`);if(!exists(js)||!exists(css))continue;
  compile(js);const code=read(js);if(!code.includes(api))failures.push(`${name}: falta API ${api}`);if(/MutationObserver\s*\(/.test(code))failures.push(`${name}: usa MutationObserver`);
  const src=where==='personal'?personalNav:polish;if(!src.includes(loader))failures.push(`${name}: falta loader ${loader}`);
  if(!sw.includes(`'${js}'`)||!sw.includes(`'${css}'`))failures.push(`${name}: no está completo en la PWA`);
}

for(const file of ['app.js','community.js','matchday.js','community-pro.js','personal-nav.js','public-polish.js','site-guide.js','ux-cleanup.js'])compile(file);
for(const marker of ['renderSimpleXiComparison','Tu XI · Comunidad · Oficial','simpleOfficialScore'])if(!communityLoader.includes(marker))failures.push(`Comparación XI: falta ${marker}`);
const matchday=read('matchday.js');for(const marker of ['TU PREDICCIÓN','COMUNIDAD','XI OFICIAL','Tu XI y la comunidad frente al oficial'])if(!matchday.includes(marker))failures.push(`Partido: falta ${marker}`);
const communityPro=read('community-pro.js');for(const marker of ['COMUNIDAD PRO','Comunidad vs tu XI','Tu XI'])if(!communityPro.includes(marker))failures.push(`Comunidad PRO: falta ${marker}`);
if(/\bfetch\s*\(/.test(communityPro))failures.push('Comunidad PRO debe consumir RMCommunityData sin red propia');

const runtimeFiles=['index.html','app.js','community.js','matchday.js','community-pro.js','personal-nav.js','public-polish.js','site-guide.js','ux-cleanup.js'];
for(const file of runtimeFiles){const code=read(file);if(/\bProyecto\b|\bproyecto\b|nuestra propuesta|nuestra idea/i.test(code))failures.push(`${file}: conserva lenguaje o lógica visible de Proyecto`)}
const retiredLoaders=['loadDecisionBoard','loadScenarioLab','loadConsensusXI','loadOfficialXiReview','loadPredictionAnalytics','loadPredictionPro','loadMatchdayPro','loadLineupPro','loadPlayerIntelligence'];
const activeLoaders=personalNav+'\n'+polish+'\n'+communityLoader;
for(const loader of retiredLoaders)if(new RegExp(`\\b${loader}\\(\\)`).test(activeLoaders))failures.push(`Sigue activo el loader retirado ${loader}`);
if(communityLoader.includes("lineuplab.js")||communityLoader.includes("intelligence.js"))failures.push('community.js sigue cargando Laboratorio/Inteligencia de la capa Proyecto');

if(!exists('analysis-context.js'))failures.push('Falta analysis-context.js');else{
  compile('analysis-context.js');const ctx=read('analysis-context.js');for(const marker of ['RMAnalysisContext','rm_analysis_context_v1','rm-analysis-context-updated','spCompetition','spHorizon','syncStats'])if(!ctx.includes(marker))failures.push(`Contexto compartido: falta ${marker}`);
  if(!polish.includes('loadAnalysisContext')||!sw.includes("'analysis-context.js'"))failures.push('Contexto compartido no está conectado/caché PWA');
}

const semantic=[['Jerarquías','hierarchy.js','RMHierarchyPro','JERARQUÍAS PRO'],['Radar de decisión','decisionradar.js','RMDecisionRadar','VENTAJA EN EL RADAR']];
for(const [name,file,api,marker] of semantic){if(!exists(file)){failures.push(`${name}: falta ${file}`);continue}compile(file);const code=read(file);if(!code.includes(api)||!code.includes(marker))failures.push(`${name}: no conserva su contrato funcional`)}

if(failures.length){console.error('PRO surface audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PRO surface audit: OK · ${surfaces.length} superficies + comparación Tu XI/Comunidad/Oficial + jerarquías/radar sin capa Proyecto`);