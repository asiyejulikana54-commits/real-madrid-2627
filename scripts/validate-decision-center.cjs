const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['decision-center.js','personal-nav.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('decision-center.js'),css=read('decision-center.css'),nav=read('personal-nav.js'),sw=read('sw.js');
for(const marker of ['CENTRO DE DECISIÓN','Esto es lo importante hoy','DECIDE','CONSTRUYE','CIERRA','ANÁLISIS AVANZADO','RMDecisionCenter','auditableState','RMPredictionReadiness','RMDecisionBoard','MAX']){}
for(const marker of ['CENTRO DE DECISIÓN','Esto es lo importante hoy','ANÁLISIS AVANZADO','RMDecisionCenter','auditableState','RMPredictionReadiness','RMDecisionBoard','attempts<140'])if(!js.includes(marker))failures.push(`decision-center.js: falta ${marker}`);
for(const marker of ['No guarda nada automáticamente','Máximo 3','setPredictionXI','data-dc-center-mode','dc-focus-mode'])if(!js.includes(marker))failures.push(`decision-center.js: falta protección/UX ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('decision-center.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('decision-center.js no debe usar MutationObserver');
if(!js.includes("window.RMConsensusXI?.auditableState"))failures.push('El XI guía debe preferir la síntesis auditable');
if(!js.includes("if(!r.complete)")||!js.includes("if(!r.reviewed)"))failures.push('El centro debe derivar la siguiente acción del estado real de cierre');
for(const marker of ['.decision-center','.dc-center-grid','.dc-center-xi','.dc-focus-mode','.dc-center-close'])if(!css.includes(marker))failures.push(`decision-center.css: falta ${marker}`);
for(const marker of ['loadDecisionCenter','decision-center.js?v=1','decision-center.css?v=1','RMDecisionCenter?.render'])if(!nav.includes(marker))failures.push(`personal-nav.js: falta ${marker}`);
if(!sw.includes("'decision-center.js'")||!sw.includes("'decision-center.css'"))failures.push('PWA no incluye el Centro de decisión');
const version=Number((sw.match(/rm2627-static-v(\d+)/)||[])[1]);if(!Number.isFinite(version)||version<38)failures.push('PWA debe usar caché v38 o superior para el Centro de decisión');
if(failures.length){console.error('Decision center audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Decision center audit: OK · prioridades + XI guía auditable + siguiente acción + modo esencial/avanzado');
