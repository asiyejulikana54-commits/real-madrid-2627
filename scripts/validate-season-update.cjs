const path=require('path');
const fs=require('fs');
const vm=require('vm');
global.window=global;
global.document={dispatchEvent(){},addEventListener(){}};
global.CustomEvent=function(type,init={}){this.type=type;this.detail=init.detail};

require(path.join(__dirname,'..','season-input.js'));

// Prueba sintética: simula exactamente el alta de un sexto partido completo.
const XI=['Courtois','Dumfries','Konaté','Huijsen','Cucurella','Valverde','Bellingham','Arda Güler','Mbappé','Vini Jr.','Diomande'];
const players=Object.fromEntries(XI.map(name=>[name,{minutes:90,sofascore:7,fotmob:7,statmuse:7}]));
global.RMSeasonMatchEntries=[{id:'__smoke__',label:'Smoke Test',short:'TST',comp:'Test',date:'2099-01-01',duration:90,final:true,players}];

require(path.join(__dirname,'..','season-data.js'));
const baseData=global.RMSeasonData;
const baseMatches=baseData.matches.length;
const expectedOrder=['espanyol','real-sociedad','malaga','betis','inter'];
const baseOrder=baseData.matches.slice(0,5).map(m=>m.id);
require(path.join(__dirname,'..','season-extension.js'));
const data=global.RMSeasonData;
const failures=[];
if(JSON.stringify(baseOrder)!==JSON.stringify(expectedOrder))failures.push(`season-data nace con orden incorrecto: ${baseOrder.join(' → ')}`);
if(baseData.chronology?.source!=='canonical')failures.push('season-data no declara la cronología como fuente canónica');
if(baseData.chronology?.labels?.[0]!=='Espanyol'||baseData.chronology?.labels?.[2]!=='Málaga')failures.push('season-data no identifica Espanyol J1 y Málaga J3 en metadatos');
if(data.version!==7)failures.push(`versión esperada 7, recibida ${data.version}`);
if(!data.validation?.ok)failures.push(`validación fallida: ${JSON.stringify(data.validation?.errors||[])}`);
if(data.matches.length!==baseMatches+1)failures.push('el partido nuevo no se añadió exactamente una vez');
if(data.matches.at(-1)?.id!=='__smoke__')failures.push('el partido nuevo no quedó como último encuentro');
if(JSON.stringify(data.matches.slice(0,5).map(m=>m.id))!==JSON.stringify(expectedOrder))failures.push('season-extension altera el orden canónico de las jornadas');
if(data.officialRatingEntry('__smoke__','Courtois')?.value!==7)failures.push('la nota oficial 3/3 no se calculó correctamente');
if(data.aggregatePlayer('Courtois').totalMinutes!==540)failures.push(`Courtois debería acumular 540 minutos y acumula ${data.aggregatePlayer('Courtois').totalMinutes}`);
if(data.recentRating('Courtois',1)?.rows?.[0]?.match?.id!=='__smoke__')failures.push('la forma reciente no incorpora el partido nuevo');
if(data.sourceAudit().pendingAppearances!==0)failures.push('la prueba deja apariciones pendientes');
const courtoisAgg=data.aggregatePlayer('Courtois');
if(!Number.isFinite(courtoisAgg.minPerPoint)||Math.abs(courtoisAgg.minPerPoint-courtoisAgg.totalMinutes/courtoisAgg.totalPoints)>.000001)failures.push('la eficiencia agregada no respeta minutos / aporte');

const root=path.join(__dirname,'..');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');

// CRONOLOGÍA: la fuente canónica ya nace correcta; minute-sync solo puentea la estructura antigua.
const minuteSync=fs.readFileSync(path.join(root,'minute-sync.js'),'utf8');
try{new vm.Script(minuteSync,{filename:'minute-sync.js'})}catch(error){failures.push(`Minute sync no compila: ${error.message}`)}
if(!minuteSync.includes("['espanyol','real-sociedad','malaga','betis','inter']"))failures.push('el puente legado no reconoce el orden canónico');
if(!minuteSync.includes('syncLegacyChronology')||!minuteSync.includes('rm-season-order-corrected'))failures.push('falta sincronizar y anunciar la cronología a estructuras antiguas');
if(minuteSync.includes('applyChronologyFix'))failures.push('minute-sync sigue parcheando RMSeasonData en lugar de respetar la fuente canónica');
if(!minuteSync.includes("source:'canonical'"))failures.push('minute-sync no identifica la procedencia canónica del orden');
if(!minuteSync.includes('Primera jornada del seguimiento histórico'))failures.push('la copia histórica de Espanyol sigue tratándolo como cuarto partido');
try{require(path.join(root,'minute-sync.js'))}catch(error){failures.push(`el puente cronológico no se puede ejecutar: ${error.message}`)}
const chronologicalData=global.RMSeasonData;
const actualOrder=(chronologicalData?.matches||[]).slice(0,5).map(m=>m.id);
if(JSON.stringify(actualOrder)!==JSON.stringify(expectedOrder))failures.push(`orden real incorrecto tras minute-sync: ${actualOrder.join(' → ')}`);
if(chronologicalData?.matches?.at(-1)?.id!=='__smoke__')failures.push('minute-sync desplaza incorrectamente partidos futuros');
if(chronologicalData?.chronology?.source!=='canonical')failures.push('minute-sync ha sustituido el metadato canónico de RMSeasonData');

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

// INICIO PRO: síntesis canónica sin crear un score nuevo ni depender de backend.
const homeJs=fs.readFileSync(path.join(root,'home-pro.js'),'utf8');
const homeCss=fs.readFileSync(path.join(root,'home-pro.css'),'utf8');
try{new vm.Script(homeJs,{filename:'home-pro.js'})}catch(error){failures.push(`Inicio PRO no compila: ${error.message}`)}
if(!homeJs.includes('RMHomePro'))failures.push('Inicio PRO no expone su API pública');
if(!homeJs.includes('MAYOR SUBIDA · ESTRICTA')||!homeJs.includes('strictLastPair'))failures.push('Inicio PRO no usa cambio estricto de última jornada');
if(!homeJs.includes('officialRatingEntry')||!homeJs.includes('MUESTRA A VIGILAR'))failures.push('Inicio PRO no protege la lectura oficial/muestra corta');
if(!homeJs.includes('DUELO MÁS CERRADO · POWER')||!homeJs.includes('Solo mide cercanía en Power, no decide titularidad'))failures.push('Inicio PRO no separa duelo Power de jerarquía');
if(!homeJs.includes('sourceAudit')||!homeJs.includes('fuentes cerradas'))failures.push('Inicio PRO no muestra procedencia/cierre de datos');
if(/\bfetch\s*\(/.test(homeJs))failures.push('Inicio PRO realiza llamadas de red propias');
if(/MutationObserver\s*\(/.test(homeJs))failures.push('Inicio PRO usa MutationObserver');
if(!homeCss.includes('.hpro-signals')||!homeCss.includes('.hpro-decisions')||!homeCss.includes('.home-pro-ready #powerHome'))failures.push('faltan estilos estructurales de Inicio PRO');
if(!polish.includes('loadHomePro')||!polish.includes('home-pro.js?v=1')||!polish.includes('home-pro.css?v=1'))failures.push('Inicio PRO no está integrado en la experiencia pública');
if(!sw.includes("'home-pro.js'")||!sw.includes("'home-pro.css'"))failures.push('Inicio PRO no está incluido en la PWA');

// HISTORIAL PRO: valida comparaciones estrictas, fechas date-only y PWA.
const historyJs=fs.readFileSync(path.join(root,'match-history-pro.js'),'utf8');
const historyCss=fs.readFileSync(path.join(root,'match-history-pro.css'),'utf8');
try{new vm.Script(historyJs,{filename:'match-history-pro.js'})}catch(error){failures.push(`Historial PRO no compila: ${error.message}`)}
if(!historyJs.includes('RMMatchHistoryPro'))failures.push('Historial PRO no expone su API pública');
if(!historyJs.includes('COMPARADOR DE PARTIDOS')||!historyJs.includes('COMPARACIÓN ESTRICTA'))failures.push('Historial PRO no incluye el comparador estricto entre jornadas');
if(!historyJs.includes('parseDateOnly')||!historyJs.includes("match(/^(\\d{4})-(\\d{2})-(\\d{2})$/)"))failures.push('Historial PRO no protege fechas YYYY-MM-DD frente a desplazamientos horarios');
if(!historyJs.includes('No se salta ninguna jornada buscando una nota anterior'))failures.push('Historial PRO no documenta la comparación inmediata de calendario');
if(!historyJs.includes('SC nunca equivale a 0'))failures.push('Historial PRO no protege la semántica de SC');
if(/MutationObserver\s*\(/.test(historyJs))failures.push('Historial PRO usa MutationObserver');
if(!historyCss.includes('.mhp-compare-score')||!historyCss.includes('.mhp-strict-change')||!historyCss.includes('.cov-33'))failures.push('faltan estilos estructurales del Historial PRO mejorado');
if(!sw.includes("'match-history-pro.js'")||!sw.includes("'match-history-pro.css'"))failures.push('Historial PRO no está incluido en la PWA');

// EVOLUCIÓN PRO: valida lectura cronológica real, cambio estricto y mapa de jornadas.
const evolutionJs=fs.readFileSync(path.join(root,'evolution-pro.js'),'utf8');
const evolutionCss=fs.readFileSync(path.join(root,'evolution-pro.css'),'utf8');
try{new vm.Script(evolutionJs,{filename:'evolution-pro.js'})}catch(error){failures.push(`Evolución PRO no compila: ${error.message}`)}
if(!evolutionJs.includes('RMEvolutionPro'))failures.push('Evolución PRO no expone su API pública');
if(!evolutionJs.includes('MAPA DE JORNADAS')||!evolutionJs.includes('La temporada en el orden real'))failures.push('Evolución PRO no muestra la cronología real');
if(!evolutionJs.includes('CAMBIO DE JORNADA · ESTRICTO')||!evolutionJs.includes('strictPair'))failures.push('Evolución PRO no exige comparación estricta entre jornadas');
if(!evolutionJs.includes('PROGRESO TEMPORADA')||!evolutionJs.includes('seasonDelta'))failures.push('Evolución PRO no incluye progreso J1→última jornada');
if(!evolutionJs.includes('jornadaLabel')||!evolutionJs.includes('rm-season-order-corrected'))failures.push('Evolución PRO no se sincroniza con la cronología corregida');
if(!evolutionJs.includes('Momentum usa las últimas notas disponibles')||!evolutionJs.includes('SC no entra como 0'))failures.push('Evolución PRO no distingue Momentum de cambio estricto o pierde semántica SC');
if(!evolutionJs.includes('sortName()')||!evolutionJs.includes('sortValue(stat)'))failures.push('Evolución PRO no adapta la lectura al criterio de ordenación');
if(/MutationObserver\s*\(/.test(evolutionJs))failures.push('Evolución PRO usa MutationObserver');
if(!evolutionCss.includes('.ep-journey-strip')||!evolutionCss.includes('.ep-journey-card')||!evolutionCss.includes('.ep-journey-main'))failures.push('faltan estilos del mapa de jornadas de Evolución PRO');
if(!sw.includes("'evolution-pro.js'")||!sw.includes("'evolution-pro.css'"))failures.push('Evolución PRO no está incluida en la PWA');

// NAVEGACIÓN MÓVIL: valida recuperación, accesibilidad y refresco de capas PRO.
const mobileUx=fs.readFileSync(path.join(root,'mobile-ux.js'),'utf8');
const predictionPro=fs.readFileSync(path.join(root,'prediction-pro.js'),'utf8');
try{new vm.Script(mobileUx,{filename:'mobile-ux.js'})}catch(error){failures.push(`Mobile UX no compila: ${error.message}`)}
try{new vm.Script(predictionPro,{filename:'prediction-pro.js'})}catch(error){failures.push(`Predicción PRO no compila: ${error.message}`)}
if(!mobileUx.includes('refreshActiveModule')||!mobileUx.includes('MODULE_APIS'))failures.push('Mobile UX no refresca la capa PRO activa tras navegación recuperada');
if(!mobileUx.includes("setAttribute('aria-current','page')"))failures.push('Mobile UX no sincroniza aria-current en la navegación recuperada');
if(!mobileUx.includes("u.searchParams.delete('match')")||!mobileUx.includes("u.searchParams.delete('player')"))failures.push('Mobile UX no limpia deep-links de secciones anteriores');
if(!mobileUx.includes('rm-mobile-nav-fallback'))failures.push('Mobile UX no emite el evento de recuperación');
if(!mobileUx.includes('RMMobileUX'))failures.push('Mobile UX no expone API de diagnóstico');
if(!predictionPro.includes("addEventListener('rm-mobile-nav-fallback',render)"))failures.push('Predicción PRO no sincroniza su estado visual tras fallback móvil');
if(/MutationObserver\s*\(/.test(mobileUx)||/MutationObserver\s*\(/.test(predictionPro))failures.push('la recuperación móvil introduce MutationObserver');

if(failures.length){console.error('Season update smoke test: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`Season update smoke test: OK · ${chronologicalData.matches.length} partidos · cronología canónica desde origen · Inicio PRO + MVP PRO + Eficiencia PRO + Historial PRO + Evolución PRO + navegación móvil validados`);
