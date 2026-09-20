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
 * Cada partido se añade una sola vez a RMSeasonMatchEntries.
 */
window.RMSeasonMatchEntries=Object.freeze([
  Object.freeze({
    id:'rayo',
    label:'Rayo',
    short:'RAY',
    comp:'LaLiga',
    date:'2026-09-12',
    duration:90,
    final:true,
    sourceNote:'Cierre directo de SofaScore, FotMob y StatMuse · 12-09-2026.',
    players:Object.freeze({
      'Courtois':Object.freeze({minutes:90,sofascore:7.8,fotmob:7.8,statmuse:7.4}),
      'Dumfries':Object.freeze({minutes:90,sofascore:6.5,fotmob:7.3,statmuse:6.8}),
      'Konaté':Object.freeze({minutes:90,sofascore:6.4,fotmob:6.7,statmuse:6.3}),
      'Rüdiger':Object.freeze({minutes:90,sofascore:7.7,fotmob:7.4,statmuse:7.4}),
      'Álvaro Carreras':Object.freeze({minutes:90,sofascore:8.8,fotmob:8.9,statmuse:8.0}),
      'Valverde':Object.freeze({minutes:45,sofascore:7.1,fotmob:6.9,statmuse:7.2}),
      'Camavinga':Object.freeze({minutes:45,sofascore:7.1,fotmob:6.8,statmuse:6.9}),
      'Bernardo Silva':Object.freeze({minutes:69,sofascore:6.8,fotmob:7.1,statmuse:7.4}),
      'Tchouaméni':Object.freeze({minutes:21,sofascore:6.9,fotmob:6.6,statmuse:7.1}),
      'Diomande':Object.freeze({minutes:72,sofascore:7.3,fotmob:7.8,statmuse:7.4}),
      'Arda Güler':Object.freeze({minutes:18,sofascore:7.8,fotmob:8.1,statmuse:8.7}),
      'Bellingham':Object.freeze({minutes:90,sofascore:8.1,fotmob:8.5,statmuse:8.9}),
      'Vini Jr.':Object.freeze({minutes:89,sofascore:7.6,fotmob:7.8,statmuse:7.2}),
      'Cucurella':Object.freeze({minutes:1,sofascore:'SC',fotmob:'SC',statmuse:6.7}),
      'Mbappé':Object.freeze({minutes:90,sofascore:9.4,fotmob:9.5,statmuse:9.5})
    })
  }),
  Object.freeze({
    id:'elche',
    label:'Elche',
    short:'ELC',
    comp:'LaLiga',
    date:'2026-09-15',
    duration:90,
    final:true,
    sourceNote:'Capturas directas de SofaScore, FotMob y StatMuse · 16-09-2026.',
    players:Object.freeze({
      'Courtois':Object.freeze({minutes:90,sofascore:6.3,fotmob:6.1,statmuse:5.6}),
      'Trent Alexander-Arnold':Object.freeze({minutes:87,sofascore:7.1,fotmob:7.5,statmuse:7.5}),
      'Konaté':Object.freeze({minutes:90,sofascore:6.8,fotmob:6.5,statmuse:6.9}),
      'Huijsen':Object.freeze({minutes:90,sofascore:6.5,fotmob:6.9,statmuse:7.3}),
      'Cucurella':Object.freeze({minutes:90,sofascore:5.8,fotmob:5.9,statmuse:6.3}),
      'Tchouaméni':Object.freeze({minutes:86,sofascore:6.9,fotmob:7.6,statmuse:7.7}),
      'Valverde':Object.freeze({minutes:90,sofascore:7.0,fotmob:7.4,statmuse:7.7}),
      'Diomande':Object.freeze({minutes:90,sofascore:7.3,fotmob:8.5,statmuse:7.9}),
      'Arda Güler':Object.freeze({minutes:68,sofascore:7.2,fotmob:7.6,statmuse:8.3}),
      'Vini Jr.':Object.freeze({minutes:68,sofascore:5.8,fotmob:6.9,statmuse:5.3}),
      'Mbappé':Object.freeze({minutes:90,sofascore:8.6,fotmob:8.7,statmuse:8.9}),
      'Bellingham':Object.freeze({minutes:22,sofascore:6.7,fotmob:6.6,statmuse:7.5}),
      'Brahim Díaz':Object.freeze({minutes:22,sofascore:6.4,fotmob:6.5,statmuse:7.1}),
      'Endrick':Object.freeze({minutes:4,sofascore:6.4,fotmob:'SC',statmuse:6.8}),
      'Carlos Espí':Object.freeze({minutes:3,sofascore:7.8,fotmob:'SC',statmuse:8.2}),
      'Dumfries':Object.freeze({minutes:0})
    })
  }),
  Object.freeze({
    id:'atletico',
    label:'Atlético de Madrid',
    short:'ATM',
    comp:'LaLiga',
    date:'2026-09-20',
    duration:90,
    final:false,
    sourceNote:'Borrador postpartido · minutos y cambios verificados en StatMuse/Sofascore; notas StatMuse disponibles. SofaScore/FotMob pendientes para cerrar la media 3/3.',
    players:Object.freeze({
      'Courtois':Object.freeze({minutes:90,statmuse:6.5}),
      'Dumfries':Object.freeze({minutes:90,statmuse:6.8}),
      'Konaté':Object.freeze({minutes:90,statmuse:6.9}),
      'Huijsen':Object.freeze({minutes:52,statmuse:5.0,note:'Expulsado en el 52.'}),
      'Cucurella':Object.freeze({minutes:90,statmuse:6.8}),
      'Tchouaméni':Object.freeze({minutes:71,statmuse:7.1}),
      'Valverde':Object.freeze({minutes:90,statmuse:7.1}),
      'Arda Güler':Object.freeze({minutes:54,statmuse:6.4}),
      'Vini Jr.':Object.freeze({minutes:54,statmuse:5.4}),
      'Bellingham':Object.freeze({minutes:82,statmuse:7.2}),
      'Mbappé':Object.freeze({minutes:90,statmuse:6.3}),
      'Rüdiger':Object.freeze({minutes:36,statmuse:7.4,note:'Entró en el 54; gol en el 89.'}),
      'Diomande':Object.freeze({minutes:36,statmuse:6.9,note:'Entró en el 54.'}),
      'Camavinga':Object.freeze({minutes:19,statmuse:7.0,note:'Entró en el 71.'}),
      'Bernardo Silva':Object.freeze({minutes:8,statmuse:7.6,note:'Entró en el 82; asistencia a Rüdiger.'})
    })
  })
]);

// Plantilla de referencia. NO se publica: el motor solo consume
// RMSeasonMatchEntries.
window.RMSeasonMatchTemplate=Object.freeze({
  id:'siguiente-partido',
  label:'Rival',
  short:'RIV',
  comp:'LaLiga',
  date:'YYYY-MM-DD',
  duration:90,
  final:false,
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