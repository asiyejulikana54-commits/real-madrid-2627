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
})();
