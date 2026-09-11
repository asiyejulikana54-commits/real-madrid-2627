# Política de datos · RM 26/27

## Fuente única

Todos los datos históricos partido a partido viven en `season-data.js`.

Desde la versión 6, esa fuente no solo almacena las notas originales: también define la **nota oficial de partido**, la serie temporal de forma y los agregados de temporada. Historial, Evolución, Radar, Jerarquías, Centro de Inteligencia, Power y Laboratorio deben derivar sus cálculos de esta capa y no mantener copias estadísticas independientes.

Los valores escritos en `app.js` quedan únicamente como fallback de compatibilidad durante la carga. Cuando `season-data.js` está disponible, el ranking oficial sustituye esos valores en memoria.

## Fuentes de valoración

Las tres fuentes objetivo son:

- SofaScore
- FotMob
- StatMuse

Los minutos se mantienen como un único dato autoritativo por partido; no se promedian entre páginas.

## Estados de cobertura

- **3/3:** existen las tres notas. La nota oficial es la media aritmética de SofaScore + FotMob + StatMuse.
- **2 + SC:** una fuente fue comprobada y no publicó valoración. La nota oficial es la media de las dos notas publicadas.
- **SC:** las tres fuentes fueron comprobadas y ninguna publicó nota. La aparición conserva sus minutos, pero no genera nota ni aporte.
- **pending:** una fuente todavía no ha sido comprobada. No se estima ni se rellena automáticamente.

`SC` nunca equivale a cero.

## Serie histórica de forma

La forma reciente ya **no usa FotMob de manera aislada**.

`season-data.js` expone `officialRatingEntry`, `ratingSeries`, `recentRating` y `ratingDelta`. Estas funciones usan exactamente la misma nota oficial multifuente que alimenta el ranking principal.

Por tanto, Historial, Evolución, Radar, Jerarquías y Centro de Inteligencia comparten la misma trayectoria temporal.

## Ranking oficial

Para cada aparición valorada:

- `nota_oficial = media de las notas publicadas según la política 3/3 o 2+SC`
- `aporte_partido = nota_oficial × minutos / 90`

Para cada jugador:

- `puntos_totales = suma(aporte_partido)`
- `media_acumulada = puntos_totales × 90 / minutos_con_valoración`
- `min_por_punto = todos_los_minutos_jugados / puntos_totales`

Una aparición con **3 SC** no entra en el denominador de la media acumulada, porque no existe valoración; sus minutos sí cuentan en `min/punto`, ya que fueron minutos realmente jugados.

No existe corte de 45 minutos ni ningún otro mínimo de participación.

## Power RM

Power usa la media oficial y los minutos centrales:

`Power = media × (0,75 + 0,25 × min(minutos, 450) / 450)`

El límite de 450 minutos pertenece a la fórmula actual de Power y no modifica la nota oficial ni el ranking de eficiencia.

## Jerarquías

La jerarquía posicional combina:

- 45% Power RM
- 20% muestra de minutos
- 20% forma reciente oficial
- 15% decisiones internas del proyecto

Si falta una señal, su peso se redistribuye entre las disponibles. La forma reciente procede de la serie oficial multifuente de `season-data.js`.

## Laboratorio XI

Laboratorio no tiene una base estadística propia. Consume las métricas oficiales ya cargadas en el panel: media, minutos, Power y min/punto. Sus criterios solo cambian la ponderación y la optimización posicional.

## Evidencia directa y conflictos

Cuando existe una captura directa del partido conservada en el proyecto, esa evidencia prevalece sobre perfiles agregados o resúmenes posteriores si aparece un conflicto.

Si una comprobación contradice un valor previo, se corrige el dato; no se fuerza a coincidir con una reconstrucción anterior.

## Regla de actualización

Al incorporar un nuevo partido:

1. registrar los minutos en `season-data.js`;
2. registrar las notas disponibles de SofaScore, FotMob y StatMuse;
3. clasificar explícitamente cualquier ausencia como `SC` solo después de comprobarla;
4. no editar manualmente Power, forma, puntos, media, min/punto, Radar, Jerarquías o Inteligencia;
5. dejar que los módulos derivados recalculen sus resultados desde la fuente central.

La regla del proyecto es: **un dato se introduce una vez; sus consecuencias se calculan en todas partes**.

## Metodología anterior

Quedan superados como metodología activa:

- el modelo de 50% SofaScore + 50% FotMob;
- el corte de 45+ minutos;
- la forma histórica basada solo en FotMob;
- los acumulados manuales independientes de `app.js`.

Pueden conservarse como referencia histórica del desarrollo del proyecto, pero no deben volver a alimentar las pantallas actuales.
