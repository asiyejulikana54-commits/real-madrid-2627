const fs=require('fs');
const vm=require('vm');
const code=fs.readFileSync('power-pro.js','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const failures=[];
try{new vm.Script(code,{filename:'power-pro.js'})}catch(error){failures.push(`power-pro.js no compila: ${error.message}`)}
for(const marker of [
  'function sortConfig()',
  'sortRank',
  "power:{head:'Power'",
  "form:{head:'Forma'",
  "rating:{head:'Media'",
  "minutes:{head:'Minutos'",
  "stability:{head:'Estabilidad'",
  'Forma · últimas 3 apariciones',
  'Media oficial',
  'Minutos jugados',
  'Estabilidad (σ)',
  'Power #${row.rank}',
  'Último: ${esc(last)}',
  'El número # y el valor grande de cada fila pertenecen a la clasificación seleccionada',
  '<span>${esc(cfg.head)}</span>'
])if(!code.includes(marker))failures.push(`falta marcador: ${marker}`);
if(/MutationObserver\s*\(/.test(code))failures.push('Power PRO usa MutationObserver');
if(/\bfetch\s*\(/.test(code))failures.push('Power PRO hace llamadas de red propias');
if(!sw.includes("'power-pro.js'")||!sw.includes("'power-pro.css'"))failures.push('Power PRO no está completo en la PWA');
const version=Number((sw.match(/rm2627-static-v(\d+)/)||[])[1]||0);if(version<46)failures.push(`La caché PWA debe ser v46 o superior; actual: v${version}`);
if(failures.length){console.error('Power sorting audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Power sorting audit: OK · posición y valor siguen Power/Forma/Media/Minutos/Estabilidad');
