(()=>{
/**
 * ÚNICO PUNTO DE ENTRADA PARA NUEVOS PARTIDOS (desde Rayo en adelante).
 *
 * Regla:
 * - minutes: minutos oficiales del jugador.
 * - sofascore / fotmob / statmuse: nota numérica 0–10 o 'SC' si la fuente
 *   fue comprobada y no publicó valoración.
 * - Un campo de fuente vacío en un jugador con minutos significa PENDIENTE.
 * - final:true exige que los 3 estados de fuente estén cerrados y que la suma
 *   de minutos sea 11 × duration (990 para un partido de 90').
 * - final:false permite guardar un borrador, pero ese partido NO entra en
 *   cálculos ni aparece publicado hasta cerrarlo.
 *
 * Para añadir Rayo, basta con introducir UN bloque dentro de RMSeasonMatchEntries.
 */
window.RMSeasonMatchEntries=Object.freeze([
  // Próximo bloque: Rayo (12-09-2026). Se añadirá aquí cuando tengamos
  // minutos y las tres fuentes cerradas.
]);

// Plantilla de referencia. NO se publica: el motor solo consume
// RMSeasonMatchEntries.
window.RMSeasonMatchTemplate=Object.freeze({
  id:'rayo',
  label:'Rayo',
  short:'RAY',
  comp:'LaLiga',
  date:'2026-09-12',
  duration:90,
  final:true,
  players:Object.freeze({
    'EJEMPLO 3/3':Object.freeze({minutes:90,sofascore:7.2,fotmob:7.1,statmuse:7.3}),
    'EJEMPLO 2+SC':Object.freeze({minutes:8,sofascore:6.8,fotmob:'SC',statmuse:7.0}),
    'EJEMPLO 3SC':Object.freeze({minutes:1,sofascore:'SC',fotmob:'SC',statmuse:'SC'}),
    'EJEMPLO NO JUGÓ':Object.freeze({minutes:0})
  })
});

// Comprobación en navegador: espera a que todos los módulos hayan cargado,
// selecciona automáticamente el último partido en Evolución y verifica que
// cada jugador con minutos tenga una métrica agregada disponible.
let attempts=0;
function auditDerivedFlow(){
  attempts++;
  const data=window.RMSeasonData;
  if(!data||data.version<7||typeof metricFor!=='function'||typeof efficiencyRanking==='undefined'||typeof players==='undefined'||typeof selectEvolutionMatch!=='function'){
    if(attempts<80)setTimeout(auditDerivedFlow,100);return;
  }
  const latest=data.matches.at(-1)||null;
  if(latest)selectEvolutionMatch(latest.id);
  const missingMetrics=players.filter(p=>data.aggregatePlayer(p.name).totalMinutes>0&&!metricFor(p)).map(p=>p.name);
  const archiveHasLatest=!latest||typeof matches==='undefined'||matches.some(m=>String(m.rival).toLowerCase()===String(latest.label).toLowerCase());
  const sourceAudit=data.sourceAudit();
  const validation=data.validation||{ok:true,errors:[],warnings:[]};
  const ok=validation.ok&&missingMetrics.length===0&&archiveHasLatest&&sourceAudit.pendingAppearances===0;
  window.RMSeasonDerivedAudit=Object.freeze({
    status:ok?'ready':'review',
    matchCount:data.matches.length,
    latestMatch:latest?.id||null,
    rankingRows:efficiencyRanking.length,
    missingMetrics:Object.freeze(missingMetrics),
    archiveHasLatest,
    pendingAppearances:sourceAudit.pendingAppearances,
    validation
  });
  document.dispatchEvent(new CustomEvent('rm-season-derived-audit-ready',{detail:window.RMSeasonDerivedAudit}));
}
setTimeout(auditDerivedFlow,100);
})();
