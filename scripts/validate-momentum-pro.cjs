const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

for(const file of ['momentum-pro.js','momentum-pro.css','analysis-context.js','sw.js'])if(!exists(file))failures.push(`Falta ${file}`);
if(!failures.length){
  const js=read('momentum-pro.js'),css=read('momentum-pro.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
  try{new vm.Script(js,{filename:'momentum-pro.js'})}catch(error){failures.push(`momentum-pro.js no compila: ${error.message}`)}
  for(const marker of ['MOMENTUM PRO · FORMA VS TEMPORADA','MOMENTUM EN LOS DEBATES','rm_momentum_pro_v1','RMMomentumPro','minRecent:45','minSeason:90','SC, ausencia y partido sin calificación nunca se convierten en 0','RMDecisionBoard','RMAnalysisContext','attempts<100'])if(!js.includes(marker))failures.push(`Momentum PRO: falta ${marker}`);
  if(/\bfetch\s*\(/.test(js))failures.push('Momentum PRO no debe hacer llamadas de red propias');
  if(/MutationObserver\s*\(/.test(js))failures.push('Momentum PRO no debe usar MutationObserver');
  for(const marker of ['.momentum-pro','.mp-leaders','.mp-table','.mp-debate-list','.mp-debate-score'])if(!css.includes(marker))failures.push(`Momentum PRO CSS: falta ${marker}`);
  if(!ctx.includes('loadMomentumPro')||!ctx.includes('momentum-pro.js?v=1')||!ctx.includes('momentum-pro.css?v=1'))failures.push('Momentum PRO no se carga desde el contexto compartido');
  if(!sw.includes("'momentum-pro.js'")||!sw.includes("'momentum-pro.css'"))failures.push('Momentum PRO no está completo en la PWA');
  if(!js.includes("['1','3','5'].includes(h)"))failures.push('Momentum PRO no sincroniza la ventana con el contexto global');
  if(!js.includes("Math.abs(recentEdge)>=.15"))failures.push('Momentum PRO no conserva el umbral explícito de 0,15 para debates');
}

if(failures.length){console.error('Momentum PRO audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Momentum PRO audit: OK · forma reciente vs temporada + soporte de muestra + cruce de debates + contexto compartido + PWA');
