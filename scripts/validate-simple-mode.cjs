const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const js=read('simple-mode.js'),css=read('simple-mode.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
try{new vm.Script(js,{filename:'simple-mode.js'})}catch(error){failures.push(`simple-mode.js no compila: ${error.message}`)}
for(const marker of ['rm_simple_experience_v1','RMSimpleExperience','Más análisis','Ver modo PRO','Tres accesos y listo','Revisión del XI oficial','attempts<120'])if(!js.includes(marker))failures.push(`simple-mode.js: falta ${marker}`);
if(!js.includes("localStorage.getItem(KEY)==='pro'?'pro':'simple'"))failures.push('el modo sencillo debe ser la experiencia por defecto');
for(const id of ['inicio','partido','prediccion','plantilla','mi-temporada'])if(!js.includes(`id:'${id}'`))failures.push(`navegación sencilla: falta ${id}`);
if(/\bfetch\s*\(/.test(js))failures.push('simple-mode.js no debe hacer llamadas de red');
if(/MutationObserver\s*\(/.test(js))failures.push('simple-mode.js no debe usar MutationObserver');
for(const marker of ['body.rm-simple-mode','#inicio>.hero','#homePro','#publicPulse','#prediccion.pxc-official-mode','#sxModeToggle'])if(!css.includes(marker))failures.push(`simple-mode.css: falta ${marker}`);
if(!ctx.includes('loadSimpleMode')||!ctx.includes('simple-mode.js?v=1')||!ctx.includes('simple-mode.css?v=1'))failures.push('analysis-context.js no carga el modo sencillo');
if(!sw.includes("'simple-mode.js'")||!sw.includes("'simple-mode.css'"))failures.push('PWA no incluye el modo sencillo');
const version=Number(sw.match(/rm2627-static-v(\d+)/)?.[1]||0);if(version<42)failures.push('la caché PWA debe ser v42 o superior');
if(failures.length){console.error('Simple mode audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Simple mode audit: OK · navegación principal + lenguaje claro + modo PRO recuperable + post-XI simplificado');