const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const js=read('post-xi-center.js'),css=read('post-xi-center.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
try{new vm.Script(js,{filename:'post-xi-center.js'})}catch(error){failures.push(`post-xi-center.js no compila: ${error.message}`)}
for(const marker of ['CENTRO POST-XI','QUÉ CAMBIÓ DE VERDAD','QUÉ APRENDEMOS','No reconstruimos tu XI','RMPostXiCenter','RMLineupSemantics.compare','snapshotLate','attempts<140'])if(!js.includes(marker))failures.push(`post-xi-center.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('post-xi-center.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('post-xi-center.js no debe usar MutationObserver');
if(!js.includes('const projectXi=rec?.projectXI||null'))failures.push('el centro post-XI no debe reconstruir el Proyecto desde el estado actual');
if(!js.includes('rec.snapshotLate'))failures.push('el centro post-XI debe distinguir snapshots tardíos');
for(const marker of ['.post-xi-center','.pxc-official-mode #decisionCenter','.pxc-score-grid','.pxc-change-list','.pxc-verdict-grid'])if(!css.includes(marker))failures.push(`post-xi-center.css: falta ${marker}`);
if(!ctx.includes('loadPostXiCenter')||!ctx.includes('post-xi-center.js?v=1')||!ctx.includes('post-xi-center.css?v=1'))failures.push('analysis-context.js no carga el centro post-XI');
if(!sw.includes("'post-xi-center.js'")||!sw.includes("'post-xi-center.css'"))failures.push('PWA no incluye el centro post-XI');
const cache=sw.match(/rm2627-static-v(\d+)/);if(!cache||Number(cache[1])<41)failures.push('el centro post-XI requiere caché PWA v41 o superior');
if(failures.length){console.error('Post-XI center audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Post-XI center audit: OK · transición post-cierre + cambios por rol + auditoría estricta + Quick Picks + offline');
