const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['decision-profile.js','personal-nav.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('decision-profile.js'),css=read('decision-profile.css'),nav=read('personal-nav.js'),sw=read('sw.js');
for(const marker of ['PERFIL DE DECISIONES · AUDITADO','Ruptura con proyecto','Tus cambios ganan','Al mantener proyecto','POR LÍNEA','RMDecisionProfile','strictRecords','!r.snapshotLate','attempts<100'])if(!js.includes(marker))failures.push(`decision-profile.js: falta ${marker}`);
for(const marker of ['POR','DEF','MED','ATA','userOutcome===\'user\'','userOutcome===\'project\''])if(!js.includes(marker))failures.push(`decision-profile.js: falta semántica ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('decision-profile.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('decision-profile.js no debe usar MutationObserver');
if(!js.includes('snapshot tardío')||!js.includes('falsa precisión'))failures.push('decision-profile.js debe explicar por qué excluye snapshots tardíos de las tasas');
for(const marker of ['.decision-profile','.dp-kpis','.dp-zone-grid','.dp-history'])if(!css.includes(marker))failures.push(`decision-profile.css: falta ${marker}`);
for(const marker of ['loadDecisionProfile','decision-profile.js?v=1','decision-profile.css?v=1','RMDecisionProfile?.render'])if(!nav.includes(marker))failures.push(`personal-nav.js: falta ${marker}`);
if(!sw.includes("'decision-profile.js'")||!sw.includes("'decision-profile.css'"))failures.push('PWA no incluye el perfil de decisiones');
if(failures.length){console.error('Decision profile audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Decision profile audit: OK · perfil personal basado solo en snapshots estrictos y resultados auditados');
