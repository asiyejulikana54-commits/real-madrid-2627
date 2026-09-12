const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['review-archive.js','personal-nav.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('review-archive.js'),css=read('review-archive.css'),nav=read('personal-nav.js'),sw=read('sw.js');
for(const marker of ['ARCHIVO DE REVISIONES OFICIALES','TÚ VISTE Y PROYECTO NO','PROYECTO VIO Y TÚ NO','RMReviewArchive','scoreStrict','snapshotLate','No reconstruimos jornadas','attempts<120'])if(!js.includes(marker))failures.push(`review-archive.js: falta ${marker}`);
for(const marker of ['RMPredictionAnalytics','RMDecisionAudit','RMScenarioAudit','officialXI','communityScore','exactUser','scenarioResult'])if(!js.includes(marker))failures.push(`review-archive.js: falta integración ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('review-archive.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('review-archive.js no debe usar MutationObserver');
if(!js.includes("rows.filter(r=>r.scoreStrict)"))failures.push('los KPIs del archivo deben excluir snapshots tardíos');
for(const marker of ['.review-archive','.ra-kpis','.ra-round','.ra-diff-grid','.ra-filters'])if(!css.includes(marker))failures.push(`review-archive.css: falta ${marker}`);
for(const marker of ['loadReviewArchive','review-archive.js?v=1','review-archive.css?v=1','RMReviewArchive?.render'])if(!nav.includes(marker))failures.push(`personal-nav.js: falta ${marker}`);
if(!sw.includes("'review-archive.js'")||!sw.includes("'review-archive.css'"))failures.push('PWA no incluye el archivo de revisiones');
if(failures.length){console.error('Review archive audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Review archive audit: OK · histórico oficial sin backfill y KPIs solo sobre snapshots estrictos');
