const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

const sw=read('sw.js'),index=read('index.html'),pwa=read('pwa.js'),personalNav=read('personal-nav.js'),officialReview=read('official-xi-review.js'),quick=read('quick-picks.js'),activity=read('activity-center.js'),ctx=read('analysis-context.js');
try{new vm.Script(sw,{filename:'sw.js'})}catch(error){failures.push(`sw.js no compila: ${error.message}`)}
try{new vm.Script(pwa,{filename:'pwa.js'})}catch(error){failures.push(`pwa.js no compila: ${error.message}`)}
try{new vm.Script(officialReview,{filename:'official-xi-review.js'})}catch(error){failures.push(`official-xi-review.js no compila: ${error.message}`)}
try{new vm.Script(quick,{filename:'quick-picks.js'})}catch(error){failures.push(`quick-picks.js no compila: ${error.message}`)}
try{new vm.Script(activity,{filename:'activity-center.js'})}catch(error){failures.push(`activity-center.js no compila: ${error.message}`)}
let manifest=null;try{manifest=JSON.parse(read('manifest.webmanifest'))}catch(error){failures.push(`manifest.webmanifest no es JSON válido: ${error.message}`)}

if(!/const CACHE_VERSION=['"]rm2627-static-v\d+['"]/.test(sw))failures.push('sw.js necesita una versión de caché rm2627-static-vN');
if(!sw.includes("url.pathname.includes('/.netlify/functions/')"))failures.push('sw.js debe excluir el backend de Netlify de la caché');
if(!sw.includes('networkFirst')||!sw.includes('staleWhileRevalidate'))failures.push('sw.js debe conservar las estrategias de red y caché');
if(!index.includes('rel="manifest" href="manifest.webmanifest"'))failures.push('index.html no enlaza el manifest');
if(!index.includes('pwa.js?v=2')||!index.includes('pwa.css?v=2'))failures.push('index.html no carga la capa PWA esperada');
if(!pwa.includes('window.RMPWA')||!pwa.includes('showInstallGuide'))failures.push('pwa.js no conserva su API pública');
if(!personalNav.includes('official-xi-review.js?v=1')||!personalNav.includes('official-xi-review.css?v=1'))failures.push('personal-nav.js no carga la revisión del XI oficial');
if(!officialReview.includes('window.RMOfficialXIReview')||!officialReview.includes('REVISIÓN DEL XI OFICIAL'))failures.push('official-xi-review.js no conserva su API o interfaz principal');
if(!ctx.includes('quick-picks.js?v=1')||!ctx.includes('quick-picks.css?v=1'))failures.push('analysis-context.js no carga Quick Picks');
if(!ctx.includes('activity-center.js?v=1')||!ctx.includes('activity-center.css?v=1'))failures.push('analysis-context.js no carga el centro de novedades');
if(!quick.includes('window.RMQuickPicks')||!quick.includes('QUICK PICKS'))failures.push('quick-picks.js no conserva su API o interfaz principal');
if(!activity.includes('window.RMActivityCenter')||!activity.includes('AHORA EN RM 26/27'))failures.push('activity-center.js no conserva su API o interfaz principal');
if(manifest&&!Array.isArray(manifest.icons))failures.push('manifest.webmanifest no define icons');

const coreMatch=sw.match(/const CORE_PATHS=\[(.*?)\];/s);
let quoted=[];
if(!coreMatch)failures.push('sw.js no define CORE_PATHS');
else{
  quoted=[...coreMatch[1].matchAll(/(['"])(.*?)\1/g)].map(m=>m[2]);
  const unique=new Set(quoted);
  if(unique.size!==quoted.length)failures.push('CORE_PATHS contiene rutas duplicadas');
  for(const file of quoted){if(file&&!exists(file))failures.push(`CORE_PATHS apunta a un archivo inexistente: ${file}`)}
  for(const required of ['personal-hub.js','personal-nav.js','personal-home.js','engagement-loop.js','engagement-loop.css','engagement-rewards.js','engagement-rewards.css','quick-picks.js','quick-picks.css','favorite-watch.js','favorite-watch.css','activity-center.js','activity-center.css','community-league.js','community-league.css','official-xi-review.js','official-xi-review.css','stats-pro.js','compare-pro.js','player-experience.js','manifest.webmanifest','app-icon.svg'])if(!unique.has(required))failures.push(`PWA no incluye ${required}`);
}

if(failures.length){console.error('PWA audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PWA audit: OK · ${quoted.length} recursos · caché versionada · engagement, Quick Picks, watchlist, novedades y revisión oficial offline incluidos`);