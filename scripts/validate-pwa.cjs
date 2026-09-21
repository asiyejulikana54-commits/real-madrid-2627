const fs=require('fs');const path=require('path');const vm=require('vm');
const root=path.join(__dirname,'..'),failures=[];const read=f=>fs.readFileSync(path.join(root,f),'utf8'),exists=f=>fs.existsSync(path.join(root,f));
const sw=read('sw.js'),index=read('index.html'),pwa=read('pwa.js'),ctx=read('analysis-context.js'),personal=read('personal-nav.js'),community=read('community.js'),miLiga=read('mi-liga.js');
for(const [name,src] of [['sw.js',sw],['pwa.js',pwa],['analysis-context.js',ctx],['personal-nav.js',personal],['community.js',community],['mi-liga.js',miLiga]])try{new vm.Script(src,{filename:name})}catch(e){failures.push(`${name} no compila: ${e.message}`)}
let manifest=null;try{manifest=JSON.parse(read('manifest.webmanifest'))}catch(e){failures.push(`manifest.webmanifest no es JSON válido: ${e.message}`)}
if(!/const CACHE_VERSION=['"]rm2627-static-v\d+['"]/.test(sw))failures.push('sw.js necesita caché versionada');
if(!sw.includes("url.hostname.endsWith('.supabase.co')"))failures.push('sw.js debe excluir las peticiones del backend de Supabase');
if(!sw.includes('networkFirst')||!sw.includes('staleWhileRevalidate'))failures.push('sw.js debe conservar estrategias de red/caché');
if(!index.includes('rel="manifest" href="manifest.webmanifest"')||!/<script src="pwa\.js\?v=\d+"><\/script>/.test(index))failures.push('index.html no carga correctamente PWA/manifest');
if(!index.includes('mi-liga.js?v=5'))failures.push('index.html no carga la corrección actual de Mi Liga');
const cacheVersion=sw.match(/rm2627-static-v(\d+)/)?.[1],workerVersion=pwa.match(/SW_VERSION=['"](\d+)['"]/)?.[1];
if(!cacheVersion||cacheVersion!==workerVersion)failures.push('PWA y service worker no comparten la versión restaurada');
if(miLiga.includes("observe(document.body,{childList:true,subtree:true})"))failures.push('Mi Liga vuelve a observar todo el documento y puede bloquear la app');
if(!miLiga.includes("if(btn.innerHTML!==html)btn.innerHTML=html"))failures.push('Mi Liga debe evitar reescrituras recursivas del botón móvil');
if(!pwa.includes('window.RMPWA')||!pwa.includes('showInstallGuide'))failures.push('pwa.js no conserva su API pública');
if(!ctx.includes('deep-links.js?v=1'))failures.push('analysis-context.js no carga deep links');
if(!/community-pro\.js\?v=\d+/.test(personal)||!/community-league\.js\?v=\d+/.test(personal))failures.push('personal-nav.js no integra la capa de comunidad');
if(!community.includes('renderSimpleXiComparison'))failures.push('community.js no integra la comparación simple de XI');
if(manifest&&!Array.isArray(manifest.icons))failures.push('manifest.webmanifest no define icons');
const coreMatch=sw.match(/const CORE_PATHS=\[(.*?)\];/s);let quoted=[];
if(!coreMatch)failures.push('sw.js no define CORE_PATHS');else{
  quoted=[...coreMatch[1].matchAll(/(['"])(.*?)\1/g)].map(m=>m[2]);const unique=new Set(quoted);if(unique.size!==quoted.length)failures.push('CORE_PATHS contiene rutas duplicadas');
  for(const file of quoted)if(file&&!exists(file))failures.push(`CORE_PATHS apunta a archivo inexistente: ${file}`);
  for(const required of ['personal-hub.js','personal-nav.js','personal-home.js','deep-links.js','community.js','community-pro.js','community-pro.css','community-league.js','community-league.css','matchday.js','matchday.css','hierarchy.js','hierarchy.css','stats-pro.js','compare-pro.js','player-experience.js','manifest.webmanifest','app-icon.svg'])if(!unique.has(required))failures.push(`PWA no incluye ${required}`);
  const retired=['decision-board.js','scenario-lab.js','consensus-xi.js','official-xi-review.js','prediction-analytics.js','matchday-pro.js','prediction-pro.js','lineup-pro.js','player-intelligence.js','lineuplab.js','intelligence.js','post-xi-center.js'];
  for(const file of retired)if(unique.has(file))failures.push(`PWA aún precachea módulo retirado: ${file}`);
}
if(failures.length){console.error('PWA audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`PWA audit: OK · ${quoted.length} recursos · flujo simplificado Tu XI/Comunidad/Oficial`);
