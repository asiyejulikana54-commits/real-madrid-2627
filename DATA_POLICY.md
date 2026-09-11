# Política de datos · RM 26/27

## Fuente única

Los datos históricos de partido a partido viven en `season-data.js`. Historial, Evolución, Radar, Jerarquías y Centro de Inteligencia deben leer esa fuente y no mantener copias propias de notas o minutos.

Los datos acumulados actuales de rendimiento (media, minutos, aporte, min/punto y Power derivado) siguen partiendo de la base acumulada del panel en `app.js`. Esa base ya es única para las pantallas actuales.

## Estados

- **confirmed**: el dato y su procedencia han sido recuperados de forma explícita en el proyecto. Puede entrar en forma, tendencias, jerarquías y decisiones.
- **reconstructed**: el valor existía o fue reconstruido durante el seguimiento, pero falta volver a comprobar la evidencia original. Puede mostrarse con `≈`, pero no debe alterar forma, jerarquías ni el asalto de forma del Radar.
- **pending**: no existe un valor suficientemente fiable. Se muestra como pendiente y nunca se estima automáticamente.

## Reglas de cálculo

1. La **forma reciente** utiliza únicamente ratings `confirmed`.
2. La **jerarquía posicional** puede usar Power/minutos acumulados actuales y forma histórica confirmada. Si falta forma, su peso se redistribuye entre señales disponibles.
3. El **Radar** no concede un punto de forma si uno de los dos jugadores no tiene una forma confirmada comparable.
4. El **Centro de Inteligencia** calcula subidas y bajadas solo con ratings históricos confirmados.
5. Los datos `reconstructed` pueden verse en Historial/Evolución para facilitar la auditoría, siempre identificados con `≈` o una etiqueta equivalente.
6. Nunca se rellena un hueco por promedio, estimación o inferencia silenciosa.

## Actualización de un dato

Cuando se recupere la fuente original, se edita únicamente `season-data.js`: se corrige el valor si hace falta, se deja constancia de la fuente y se cambia `status` de `reconstructed` a `confirmed`. El resto de la web debe recalcularse sin duplicar el cambio en otros archivos.
