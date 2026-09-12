const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['decision-coach.js','personal-nav.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('decision-coach.js'),css=read('decision-coach.css'),nav=read('personal-nav.js'),sw=read('sw.js');
for(const marker of ['COACH DE DECISIÓN','TU HISTORIAL, NO UNA PROBABILIDAD','Histórico favorable','Revisar primero','RMDecisionCoach','MIN_ZONE=3','MIN_STRONG=3','attempts<120'])if(!js.includes(marker))failures.push(`decision-coach.js: falta ${marker}`);
for(const marker of ['RMDecisionProfile?.state','RMDecisionBoard?.state','snapshot','strict','userDiff'])if(!js.includes(marker))failures.push(`decision-coach.js: falta protección/semántica ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('decision-coach.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('decision-coach.js no debe usar MutationObserver');
if(!js.includes("z.rate>=.65")||!js.includes("z.rate<=.35"))failures.push('decision-coach.js debe mantener umbrales prudentes para histórico favorable/revisión');
if(!js.includes('El coach nunca modifica tu XI automáticamente'))failures.push('decision-coach.js debe dejar claro que no modifica el XI');
for(const marker of ['.decision-coach','.dc-kpis','.dc-list','.dc-row','.dc-summary'])if(!css.includes(marker))failures.push(`decision-coach.css: falta ${marker}`);
for(const marker of ['loadDecisionCoach','decision-coach.js?v=1','decision-coach.css?v=1','RMDecisionCoach?.render'])if(!nav.includes(marker))failures.push(`personal-nav.js: falta ${marker}`);
if(!sw.includes("'decision-coach.js'")||!sw.includes("'decision-coach.css'"))failures.push('PWA no incluye el coach de decisiones');
const cacheMatch=sw.match(/rm2627-static-v(\d+)/),cacheVersion=cacheMatch?Number(cacheMatch[1]):0;
if(cacheVersion<36)failures.push('PWA no ha incrementado la versión de caché para el coach');
if(failures.length){console.error('Decision coach audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Decision coach audit: OK · historial personal aplicado al XI actual sin convertirlo en probabilidad futura');
