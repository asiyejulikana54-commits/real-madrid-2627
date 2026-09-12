const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const nav=read('navigation-history.js'),ctx=read('analysis-context.js'),sw=read('sw.js');
try{new vm.Script(nav,{filename:'navigation-history.js'})}catch(error){failures.push(`navigation-history.js no compila: ${error.message}`)}
for(const marker of ['history.pushState','history.replaceState','popstate','rmSection','RMNavigationHistory','shouldPush','restoring','attempts<100','rm-section-history-changed'])if(!nav.includes(marker))failures.push(`navigation-history.js: falta ${marker}`);
if(/MutationObserver\s*\(/.test(nav))failures.push('navigation-history.js no debe usar MutationObserver');
if(/\bfetch\s*\(/.test(nav))failures.push('navigation-history.js no debe hacer llamadas de red');
if(nav.indexOf('if(shouldPush)push(id)')>nav.indexOf('base.apply'))failures.push('el estado nuevo debe entrar en history antes de que las capas antiguas hagan replaceState');
if(!ctx.includes('loadNavigationHistory')||!ctx.includes('navigation-history.js?v=1'))failures.push('analysis-context.js no carga el historial de navegación');
if(ctx.indexOf('loadNavigationHistory();')>ctx.indexOf('loadDeepLinks();'))failures.push('el historial debe cargarse antes que los deep links');
if(!sw.includes("'navigation-history.js'"))failures.push('PWA no incluye navigation-history.js');
const version=Number(sw.match(/rm2627-static-v(\d+)/)?.[1]||0);if(version<47)failures.push('la caché PWA debe ser v47 o superior');
if(failures.length){console.error('Navigation history audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Navigation history audit: OK · atrás/adelante conserva secciones internas y evita salir antes de tiempo');
