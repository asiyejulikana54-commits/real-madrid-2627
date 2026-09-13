const fs=require('fs'),vm=require('vm');const fail=[];const read=f=>fs.readFileSync(f,'utf8');
const community=read('community.js'),matchday=read('matchday.js'),personal=read('personal-hub.js'),sw=read('sw.js');
for(const [n,s] of [['community.js',community],['matchday.js',matchday],['personal-hub.js',personal],['sw.js',sw]])try{new vm.Script(s,{filename:n})}catch(e){fail.push(`${n} no compila: ${e.message}`)}
for(const marker of ['renderSimpleXiComparison','Tu XI · Comunidad · Oficial','simpleOfficialScore'])if(!community.includes(marker))fail.push(`Comparación simple: falta ${marker}`);
for(const marker of ['TU PREDICCIÓN','COMUNIDAD','XI OFICIAL','Tu XI y la comunidad frente al oficial'])if(!matchday.includes(marker))fail.push(`Centro del partido: falta ${marker}`);
if(!personal.includes('TU PERFIL DE PRONOSTICADOR')||!personal.includes('historial'))fail.push('Mi temporada no conserva historial personal');
for(const src of [community,matchday])if(/\bProyecto\b|\bproyecto\b|nuestra propuesta|nuestra idea/i.test(src))fail.push('El flujo principal conserva referencias a Proyecto');
for(const file of ['community.js','matchday.js','personal-hub.js'])if(!sw.includes(`'${file}'`))fail.push(`PWA no incluye ${file}`);
if(fail.length){console.error('XI comparison audit: FAIL');for(const f of fail)console.error(`- ${f}`);process.exit(1)}
console.log('XI comparison audit: OK · Tu XI ↔ Comunidad ↔ XI oficial, sin capa Proyecto');