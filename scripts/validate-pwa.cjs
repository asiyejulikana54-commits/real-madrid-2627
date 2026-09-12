const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

const sw=read('sw.js'),index=read('index.html'),pwa=read('pwa.js');
try{new vm.Script(sw,{filename:'sw.js'})}catch(error){failures.push(`sw.js no compila: ${error.message}`)}
try{new vm.Script(pwa,{filename:'pwa.js'})}catch(error){failures.push(`pwa.js no compila: ${error.message}`)}
let manifest=null;try{manifest=JSON.parse(read('manifest.webmanifest'))}catch(error){failures.push(`manifest.webmanifest no es JSON válido: ${error.message}`)}

if(!/const CACHE_VERSION=['"]rm2627-static-v\d+['"]/.test(sw))failures.push('sw.js necesita una versión de caché rm2627-static-vN');
if(!sw.includes("url.pathname.includes('/.netlify/functions/')"))failures.push('sw.js debe excluir el backend de Netlify de la caché');
if(!sw.includes('networkFirst')||!sw.includes('staleWhileRevalidate'))failures.push('sw.js debe conservar las estrategias de red y caché');
if(!index.includes('rel="manifest" href="manifest.webmanifest"'))failures.push('index.html no enlaza el manifest');
if(!index.includes('pwa.js?v=2')||!index.includes('pwa.css?v=2'))failures.push('index.html no carga la capa PWA esperada');
if(!pwa.includes('window.RMPWA')||!pwa.includes('showInstallGuide'))failures.push('pwa.js no conserva su API pública');
if(manifest&&!Array.isArray(manifest.icons))failures.push('manifest.webmanifest no define icons');

const coreMatch=sw.match(/const CORE_PATHS=\[(.*?)\];/s);
if(!coreMatch)failures.push('sw.js no define CORE_PATHS');
else{
  const quoted=[...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m=>m[1]);
  const unique=new Set(quoted);
  if(unique.size!==quoted.length)failures.push('CORE_PATHS contiene rutas duplicadas');
  for(const file of quoted){if(file&&!exists(file))failures.push(`CORE_PATHS apunta a un archivo inexistente: ${file}`)}
  for(const required of ['personal-hub.js','personal-nav.js','personal-home.js','engagement-loop.js','engagement-loop.css','engagement-rewards.js','engagement-rewards.css','community-league.js','community-league.css','stats-pro.js','compare-pro.js','player-experience.js','manifest.webmanifest','app-icon.svg'])if(!unique.has(required))failures.push(`PWA no incluye ${required}`);
}

if(failures.length){console.error('PWA audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PWA audit: OK · ${coreMatch?[...coreMatch[1].matchAll(/['"]([^'"]+)['"]/g)].length:0} recursos · caché versionada · engagement offline incluido`);
