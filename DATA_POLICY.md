# Política de datos · RM 26/27

## Fuente única

Los datos históricos de partido a partido viven en `season-data.js`. Historial, Evolución, Radar, Jerarquías y Centro de Inteligencia deben leer esa fuente y no mantener copias propias de notas o minutos.

Los datos acumulados actuales de rendimiento (media, minutos, aporte, min/punto y Power derivado) siguen partiendo de la base acumulada del panel en `app.js`. Esa base ya es única para las pantallas actuales.

## Estados

- **confirmed**: el dato está respaldado por una fuente identificable y ha sido comprobado de forma explícita. Puede entrar en forma, tendencias, jerarquías y decisiones.
- **reconstructed**: el valor existía o fue reconstruido durante el seguimiento, pero falta volver a comprobarlo contra una fuente externa suficientemente clara. Puede mostrarse con `≈`, pero no debe alterar forma, jerarquías ni el asalto de forma del Radar.
- **pending**: no existe un valor suficientemente fiable. Se muestra como pendiente y nunca se estima automáticamente.

## Reglas de cálculo

1. La **forma reciente** utiliza únicamente ratings `confirmed`.
2. La **jerarquía posicional** puede usar Power/minutos acumulados actuales y forma histórica confirmada. Si falta forma, su peso se redistribuye entre señales disponibles.
3. El **Radar** no concede un punto de forma si uno de los dos jugadores no tiene una forma confirmada comparable.
4. El **Centro de Inteligencia** calcula subidas y bajadas solo con ratings históricos confirmados.
5. Los datos `reconstructed` pueden verse en Historial/Evolución para facilitar la auditoría, siempre identificados con `≈` o una etiqueta equivalente.
6. Nunca se rellena un hueco por promedio, estimación o inferencia silenciosa.
7. Un dato reconstruido **no se convierte automáticamente en confirmado por coincidir con lo esperado**: debe existir evidencia externa o una fuente original recuperada.
8. Si la comprobación externa contradice la reconstrucción, prevalece la fuente comprobada y se corrige el valor antes de marcarlo `confirmed`.

## Fuentes históricas

Para la serie de notas partido a partido se prioriza **FotMob**, de forma que la curva histórica mantenga una metodología homogénea. Los minutos también pueden confirmarse desde la ficha de partido/jugador cuando la fuente los muestra de forma explícita.

La media acumulada principal del panel sigue siendo un dato distinto: combina las fuentes definidas para el ranking general y no debe confundirse con la serie histórica FotMob.

## Actualización de un dato

Cuando se recupera una fuente fiable, se edita únicamente `season-data.js`: se comprueba el valor, se corrige si hace falta, se registra la procedencia y se cambia `status` de `reconstructed` a `confirmed` cuando corresponda. El resto de la web debe recalcularse sin duplicar el cambio en otros archivos.

Si una fuente solo permite confirmar una parte del registro —por ejemplo minutos pero no nota— se confirma únicamente esa parte y el resto permanece pendiente o reconstruido.
