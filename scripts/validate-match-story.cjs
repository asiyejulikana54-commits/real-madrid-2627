const fs=require('fs');const vm=require('vm');
const fail=[];const read=p=>fs.readFileSync(p,'utf8');
const js=read('match-story.js'),css=read('match-story.css'),pub=read('public-polish.js'),sw=read('sw.js');
for(const [name,src] of [['match-story.js',js],['public-polish.js',pub],['sw.js',sw]]){try{new vm.Script(src,{filename:name})}catch(e){fail.push(`${name} no compila: ${e.message}`)}}
for(const marker of ['MEMORIA DEL PARTIDO','1.ª PARTE','2.ª PARTE','PUNTO DE INFLEXIÓN','MVP · NUESTRA LECTURA','CONCLUSIÓN','DATOS','FUENTES','NUESTRA LECTURA','Arda Güler','Bellingham','Bernardo Silva'])if(!js.includes(marker))fail.push(`Falta marcador narrativo: ${marker}`);
for(const marker of ['Notas externas pendientes de cierre','nunca se rellenará con una estimación','minutos finales y las notas multifuente','alrededor del minuto 70'])if(!js.includes(marker))fail.push(`Falta separación metodológica: ${marker}`);
if(/\bfetch\s*\(/.test(js))fail.push('La memoria del partido no debe hacer peticiones de red');
if(js.includes('MutationObserver'))fail.push('La memoria del partido no debe usar MutationObserver');
if(!js.includes('attempts<120'))fail.push('La instalación debe tener reintentos acotados');
if(!js.includes('window.RMMatchStory=Object.freeze'))fail.push('Falta API RMMatchStory');
if(!js.includes("surface:'partido'")||!js.includes("surface:'partidos'"))fail.push('La ficha debe renderizar en Partido e Historial');
if(!pub.includes('function loadMatchStory()')||!pub.includes("id==='partido'){loadMatchdayPro();loadMatchStory()}")||!pub.includes("id==='partidos'){loadMatchHistoryPro();loadMatchStory()}"))fail.push('public-polish no integra la memoria en ambas superficies');
if(!css.includes('.ms-evidence-grid')||!css.includes('.ms-halves')||!css.includes('.ms-player-grid'))fail.push('Faltan estilos estructurales de la ficha');
if(!sw.includes("CACHE_VERSION='rm2627-static-v43'"))fail.push('La PWA no ha incrementado la caché a v43');
if(!sw.includes("'match-story.css'")||!sw.includes("'match-story.js'"))fail.push('La PWA no precachea la memoria del partido');
if(fail.length){console.error('Match story audit: FAIL');for(const f of fail)console.error(`- ${f}`);process.exit(1)}
console.log('Match story audit: OK · hechos, fuentes y lectura quedan separados sin inventar notas ni backfill');