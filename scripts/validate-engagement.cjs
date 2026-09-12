const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['engagement-loop.js','analysis-context.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('engagement-loop.js'),css=read('engagement-loop.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
for(const marker of ['TU MARCADOR','DUELO DEL DÍA','HOY EN RM 26/27','PERFIL DE PREDICCIÓN','rm_daily_debate_votes_v1','RMScenarioAudit','RMDecisionBoard','attempts<100'])if(!js.includes(marker))failures.push(`engagement-loop.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('engagement-loop.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('engagement-loop.js no debe usar MutationObserver');
for(const marker of ['.egl-grid','.egl-vote-pair','.egs-grid'])if(!css.includes(marker))failures.push(`engagement-loop.css: falta ${marker}`);
if(!ctx.includes('loadEngagementLoop')||!ctx.includes('engagement-loop.js?v=1')||!ctx.includes('engagement-loop.css?v=1'))failures.push('analysis-context.js no carga el bucle de retorno');
if(!sw.includes("'engagement-loop.js'")||!sw.includes("'engagement-loop.css'"))failures.push('PWA no incluye el bucle de retorno');
if(!js.includes('Tu voto es local'))failures.push('el debate diario no explica que el voto es local');
if(!js.includes('la comunidad solo aparece si tenemos datos reales'))failures.push('el debate diario no protege la lectura de comunidad');
if(!js.includes('No reconstruimos predicciones')&&!js.includes('no reconstruimos predicciones'))failures.push('el perfil no protege la auditoría histórica');
if(failures.length){console.error('Engagement audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Engagement audit: OK · marcador personal + duelo diario + briefing dinámico + perfil histórico');