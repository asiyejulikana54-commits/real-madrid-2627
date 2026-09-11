const path=require('path');
const fs=require('fs');
const vm=require('vm');
global.window=global;
global.document={dispatchEvent(){}};
global.CustomEvent=function(type,init={}){this.type=type;this.detail=init.detail};

require(path.join(__dirname,'..','season-input.js'));

// Prueba sintética: simula exactamente el alta de un sexto partido completo.
const XI=['Courtois','Dumfries','Konaté','Huijsen','Cucurella','Valverde','Bellingham','Arda Güler','Mbappé','Vini Jr.','Diomande'];
const players=Object.fromEntries(XI.map(name=>[name,{minutes:90,sofascore:7,fotmob:7,statmuse:7}]));
global.RMSeasonMatchEntries=[{id:'__smoke__',label:'Smoke Test',short:'TST',comp:'Test',date:'2099-01-01',duration:90,final:true,players}];

require(path.join(__dirname,'..','season-data.js'));
const baseMatches=global.RMSeasonData.matches.length;
require(path.join(__dirname,'..','season-extension.js'));
const data=global.RMSeasonData;
const failures=[];
if(data.version!==7)failures.push(`versión esperada 7, recibida ${data.version}`);
if(!data.validation?.ok)failures.push(`validación fallida: ${JSON.stringify(data.validation?.errors||[])}`);
if(data.matches.length!==baseMatches+1)failures.push('el partido nuevo no se añadió exactamente una vez');
if(data.matches.at(-1)?.id!=='__smoke__')failures.push('el nuevo partido no quedó como último encuentro');
if(data.officialRatingEntry('__smoke__','Courtois')?.value!==7)failures.push('la nota oficial 3/3 no se calculó correctamente');
if(data.aggregatePlayer('Courtois').totalMinutes!==540)failures.push(`Courtois debería acumular 540 minutos y acumula ${data.aggregatePlayer('Courtois').totalMinutes}`);
if(data.recentRating('Courtois',1)?.rows?.[0]?.match?.id!=='__smoke__')failures.push('la forma reciente no incorpora el partido nuevo');
if(data.sourceAudit().pendingAppearances!==0)failures.push('la prueba deja apariciones pendientes');
const courtoisAgg=data.aggregatePlayer('Courtois');
if(!Number.isFinite(courtoisAgg.minPerPoint)||Math.abs(courtoisAgg.minPerPoint-courtoisAgg.totalMinutes/courtoisAgg.totalPoints)>.000001)failures.push('la eficiencia agregada no respeta minutos / aporte');

const root=path.join(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

// MVP PRO: valida que la capa compile, sea local-first y esté disponible offline.
const mvpJs=fs.readFileSync(path.join(root,'mvp.js'),'utf8');
const mvpCss=fs.readFileSync(path.join(root,'mvp.css'),'utf8');
try{new vm.Script(mvpJs,{filename:'mvp.js'})}catch(error){failures.push(`MVP PRO no compila: ${error.message}`)}
if(!mvpJs.includes('RMMvpPro'))failures.push('MVP PRO no expone su API pública');
if(!mvpJs.includes('MEJOR NOTA')||!mvpJs.includes('TU MVP'))failures.push('MVP PRO no separa mejor nota y elección personal');
if(!mvpJs.includes('rm_mvp_personal_v2'))failures.push('MVP PRO no conserva la elección personal local');
if(!mvpJs.includes('GitHub Pages no hace llamadas a Netlify'))failures.push('MVP PRO no documenta el modo local sin backend');
if(/MutationObserver\s*\(/.test(mvpJs))failures.push('MVP PRO vuelve a usar MutationObserver');
if(!mvpCss.includes('.mvp-pro-match-grid')||!mvpCss.includes('.mvp-pro-kpis'))failures.push('faltan estilos estructurales de MVP PRO');
if(!sw.includes("'mvp.js'")||!sw.includes("'mvp.css'"))failures.push('MVP PRO no está incluido en la PWA');

// EFICIENCIA PRO: valida fórmula, contexto de muestra, integración y PWA.
const efficiencyJs=fs.readFileSync(path.join(root,'efficiency-pro.js'),'utf8');
const efficiencyCss=fs.readFileSync(path.join(root,'efficiency-pro.css'),'utf8');
const polish=fs.readFileSync(path.join(root,'public-polish.js'),'utf8');
try{new vm.Script(efficiencyJs,{filename:'efficiency-pro.js'})}catch(error){failures.push(`Eficiencia PRO no compila: ${error.message}`)}
if(!efficiencyJs.includes('RMEfficiencyPro'))failures.push('Eficiencia PRO no expone su API pública');
if(!efficiencyJs.includes('Min/punto = minutos totales ÷ aporte total'))failures.push('Eficiencia PRO no explica la fórmula');
if(!efficiencyJs.includes('MUESTRA CORTA')||!efficiencyJs.includes('MEJOR 270+ MIN'))failures.push('Eficiencia PRO no contextualiza la muestra');
if(!efficiencyJs.includes('SC nunca se convierte en nota 0'))failures.push('Eficiencia PRO no protege la semántica de SC');
if(!efficiencyJs.includes('no usa “partido válido”'))failures.push('Eficiencia PRO no documenta la ausencia de corte oculto');
if(/MutationObserver\s*\(/.test(efficiencyJs))failures.push('Eficiencia PRO usa MutationObserver');
if(!efficiencyCss.includes('.efp-row')||!efficiencyCss.includes('.efp-sample')||!efficiencyCss.includes('.efp-method'))failures.push('faltan estilos estructurales de Eficiencia PRO');
if(!polish.includes('loadEfficiencyPro')||!polish.includes('efficiency-pro.js?v=1')||!polish.includes('efficiency-pro.css?v=1'))failures.push('Eficiencia PRO no está integrada en la experiencia pública');
if(!sw.includes("'efficiency-pro.js'")||!sw.includes("'efficiency-pro.css'"))failures.push('Eficiencia PRO no está incluida en la PWA');

if(failures.length){console.error('Season update smoke test: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`Season update smoke test: OK · ${data.matches.length} partidos · entrada única conectada · MVP PRO + Eficiencia PRO validados`);
