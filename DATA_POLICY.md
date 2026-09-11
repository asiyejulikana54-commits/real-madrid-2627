# Política de datos · RM 26/27

## Fuente única

Los datos históricos partido a partido viven en `season-data.js`. Historial, Evolución, Radar, Jerarquías y Centro de Inteligencia deben leer esa fuente y no mantener copias propias de notas o minutos.

La base acumulada que todavía usa `app.js` queda **congelada como legado** hasta completar la auditoría multifuente y reconciliar el criterio de minutos. No se recalcula silenciosamente con una cobertura desigual.

## Estados de fiabilidad

- **confirmed**: dato respaldado por una fuente identificable y comprobado de forma explícita.
- **reconstructed**: valor existente en el seguimiento pero pendiente de contrastar. Puede mostrarse con `≈`, pero no influye en forma, jerarquías ni decisiones.
- **pending**: dato no disponible con suficiente fiabilidad. Nunca se estima automáticamente.

## Serie histórica de forma

La curva histórica y la forma reciente siguen usando **FotMob** como serie homogénea partido a partido. Esto evita mezclar escalas distintas dentro de una misma trayectoria temporal.

Los minutos históricos usan una capa autoritativa de FotMob y, cuando procede, UEFA para ausencias/sanciones. **No se promedian minutos de varias webs**. Si dos fuentes difieren por uno o dos minutos, se investiga y se conserva un único criterio antes de actualizar el acumulado.

## Modelo acumulado objetivo · 3 fuentes

La valoración general definitiva del panel combinará **SofaScore + FotMob + StatMuse** con el mismo peso, pero solo se considerará un partido **3/3 completo** cuando estén confirmadas las tres notas.

Fórmulas:

- `nota_combinada = (SofaScore + FotMob + StatMuse) / 3`
- `aporte_partido = nota_combinada × minutos / 90`
- `puntos_totales = suma(aporte_partido)`
- `media_acumulada = puntos_totales × 90 / minutos_totales_incluidos`
- `min_por_punto = minutos_totales_incluidos / puntos_totales`

El modelo actual es **sin corte de 45 minutos**: una aparición corta puede aportar, siempre que disponga de la cobertura de fuentes requerida para el cálculo que se esté mostrando.

Una aparición `2/3` o `1/3` puede mostrarse para auditoría, pero **no puede etiquetarse como media completa de 3 fuentes**. Las funciones de `season-data.js` permiten inspeccionar esos parciales sin mezclarlos con el ranking definitivo.

## Ranking principal congelado

El `efficiencyRanking` actual de `app.js` no se sustituirá hasta que se cumplan dos condiciones:

1. cobertura de fuentes suficientemente cerrada para que la comparación sea homogénea;
2. reconciliación de los minutos históricos con los minutos acumulados oficiales ya utilizados por el panel.

Hasta entonces, Power RM, media acumulada, puntos y min/punto que dependan de esa tabla siguen representando el corte legado ya publicado en el proyecto. La nueva capa multifuente es una **auditoría preparada**, no una sustitución parcial.

## Metodología anterior

La hoja antigua de **50% SofaScore + 50% FotMob y solo partidos de 45+ minutos** se conserva como fotografía histórica del proyecto, pero queda **superada** por el modelo objetivo de tres fuentes sin corte de minutos.

## Prioridad de evidencias

Cuando haya conflicto, se prioriza la evidencia más cercana al partido y más explícita. Una captura directa de la ficha del encuentro prevalece sobre una ficha agregada posterior o un resumen editorial. Si una comprobación contradice un valor previo, se corrige el dato; no se fuerza a coincidir con la reconstrucción.

## Actualización

Cuando se recupera un dato nuevo, se modifica una sola vez en `season-data.js`, con su procedencia. El resto de módulos deben recalcularse a partir de esa fuente. Nunca se rellena un hueco por promedio, inferencia o aproximación silenciosa.
