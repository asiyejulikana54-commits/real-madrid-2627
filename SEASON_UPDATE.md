# Flujo de actualización por partido · RM 26/27

Desde el partido contra el Rayo, cada encuentro nuevo se incorpora **una sola vez** en `season-input.js`.

## Qué hay que introducir

Un bloque de partido contiene:

- `id`, `label`, `short`, `comp`, `date` y `duration`;
- un único objeto `players`;
- por cada jugador: `minutes`, `sofascore`, `fotmob` y `statmuse`;
- una fuente sin nota confirmada se escribe como `SC`, nunca como 0;
- un jugador que no participa puede figurar con `minutes: 0` y sin valoraciones.

`final:false` sirve para guardar un borrador y lo deja fuera de todos los cálculos. Al completar minutos y fuentes se cambia a `final:true`.

## Validaciones antes de publicar

Para un partido final el sistema exige:

1. identificador de partido único;
2. minutos válidos por jugador;
3. los tres estados de fuente cerrados en cada jugador con minutos: nota o `SC`;
4. suma de minutos igual a `11 × duration` (990 en un partido de 90 minutos).

GitHub Actions ejecuta `scripts/validate-season-update.cjs` antes de publicar GitHub Pages. La prueba simula un sexto partido completo y comprueba que entra en la serie, la forma reciente y el agregado de temporada. Si falla, Pages no se publica.

## Qué se recalcula automáticamente

`season-extension.js` incorpora la entrada al motor oficial y vuelve a ejecutar el ranking. A partir de ahí se actualizan sin editar sus archivos:

- minutos acumulados;
- nota oficial y aporte;
- min/punto y ranking de eficiencia;
- Power RM;
- fichas y Estadísticas;
- Evolución y forma reciente;
- Radar de decisiones;
- Laboratorio XI;
- Centro de Inteligencia;
- Jerarquías;
- archivo de Partidos.

Si un futbolista juega por primera vez y todavía no existía en `efficiencyRanking`, se crea automáticamente su fila de métricas antes del recálculo.

En Evolución se selecciona automáticamente el último partido incorporado.

## Auditoría en ejecución

El navegador expone dos objetos de diagnóstico:

- `RMSeasonUpdateFlow`: estado de la entrada, errores/avisos, partidos añadidos y nuevos jugadores incorporados al ranking.
- `RMSeasonDerivedAudit`: comprueba que el último partido está conectado, que todo jugador con minutos tiene métricas, que aparece en el archivo y que no quedan apariciones pendientes.

El estado esperado después de una actualización cerrada es `ready`.

## Rayo

El bloque de referencia de Rayo ya está preparado como plantilla en `season-input.js`. Cuando termine el encuentro, solo habrá que sustituir los ejemplos por los jugadores reales y sus datos; no habrá que editar Power, Evolución, Radar, Laboratorio, Inteligencia ni Jerarquías.
