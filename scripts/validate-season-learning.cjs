const fs=require('fs');
function read(path){return fs.readFileSync(path,'utf8')}
function must(ok,msg){if(!ok)throw new Error(msg)}
const js=read('season-learning.js'),css=read('season-learning.css'),nav=read('personal-nav.js'),sw=read('sw.js'),activity=read('activity-center.js');
must(js.includes('RMSeasonLearning'),'Falta API RMSeasonLearning');
must(js.includes('RMDecisionProfile')&&js.includes('RMReviewArchive'),'El aprendizaje debe reutilizar histórico auditado');
must(js.includes('snapshot')||js.includes('strict'),'Debe excluir snapshots tardíos');
must(js.includes('resolved>=3'),'Las conclusiones por línea deben exigir al menos 3 casos resueltos');
must(js.includes('recent.length<3')&&js.includes('prior.length<2'),'La tendencia reciente debe exigir 3 jornadas recientes y 2 anteriores');
must(js.includes('describe')||js.includes('Describe'),'Debe aclarar que describe el pasado y no predice');
must(!js.includes('MutationObserver'),'No usar MutationObserver');
must(css.includes('.season-learning')&&css.includes('.sl-grid'),'Falta estilo del aprendizaje');
must(nav.includes('loadSeasonLearning')&&nav.includes('season-learning.js'),'Falta loader en personal-nav');
must(sw.includes('season-learning.js')&&sw.includes('season-learning.css'),'Falta caché PWA');
must(activity.includes('RMSeasonLearning')&&activity.includes('rm-season-learning-rendered'),'Falta integración con Novedades');
console.log('Season learning OK');
