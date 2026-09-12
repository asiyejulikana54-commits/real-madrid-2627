const fs=require('fs');
const vm=require('vm');
function read(path){return fs.readFileSync(path,'utf8')}
function ok(cond,msg){if(!cond)throw new Error(msg)}
const js=read('compare-lifecycle.js'),css=read('compare-lifecycle.css'),ux=read('ux-cleanup.js'),sw=read('sw.js');
new vm.Script(js,{filename:'compare-lifecycle.js'});
for(const marker of ['RMCompareLifecycle','MAX_ATTEMPTS','rm-compare-pro-duel-set','#cpRadar','radarToComparator','RMDecisionRadar?.set','setRadarPlayers','cpl-expanded','LECTURA RÁPIDA'])ok(js.includes(marker),`Falta marcador JS: ${marker}`);
ok(!/\bfetch\s*\(/.test(js),'El puente no debe hacer peticiones de red');
ok(!js.includes('MutationObserver'),'El puente no debe usar MutationObserver');
ok(js.includes('n>=MAX_ATTEMPTS'),'Los reintentos de duelo deben estar acotados');
ok(js.includes('attempts<120'),'La instalación debe estar acotada');
for(const marker of ['rm-simple-mode','#comparador:not(.cpl-expanded)','.cp-common','.cp-footnote','.cpl-static-extra'])ok(css.includes(marker),`Falta regla CSS: ${marker}`);
ok(ux.includes('loadCompareLifecycle'),'ux-cleanup no carga el puente');
ok(ux.includes("compare-lifecycle.css?v=1")&&ux.includes("compare-lifecycle.js?v=1"),'Faltan assets del puente en el loader');
ok(sw.includes("'compare-lifecycle.css'")&&sw.includes("'compare-lifecycle.js'"),'El puente no está incluido en la PWA');
const version=Number((sw.match(/rm2627-static-v(\d+)/)||[])[1]||0);ok(version>=44,`La caché PWA debe ser v44 o superior; actual: v${version}`);
console.log('Compare lifecycle audit: OK · puente bilateral + cola acotada + modo sencillo');
