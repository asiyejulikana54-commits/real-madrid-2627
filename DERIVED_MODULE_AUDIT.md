# Auditoría de módulos derivados · RM 26/27

**Fecha:** 11-09-2026

## Objetivo

Comprobar que ninguna pantalla analítica activa mantiene una segunda verdad estadística después de la migración del ranking a SofaScore + FotMob + StatMuse.

## Arquitectura final

El orden de carga queda fijado en `index.html`:

1. `app.js` — estructura y fallback legado.
2. `season-data.js` v6 — fuente estadística central.
3. `minute-sync.js` v4 — migra `efficiencyRanking` al agregado oficial.
4. `community.js` y módulos de interfaz.

Así, los módulos derivados se inicializan cuando media, minutos, aporte y min/punto ya son oficiales.

## season-data.js · fuente central

`season-data.js` v6 expone:

- notas originales por fuente;
- minutos por partido;
- estados `SC`;
- `officialRatingEntry()`;
- `ratingSeries()` oficial;
- `recentRating()` oficial;
- `ratingDelta()` oficial;
- `aggregatePlayer()`;
- `aggregateRanking()`;
- auditoría de cobertura.

La serie temporal oficial aplica:

- 3/3 → media de SofaScore + FotMob + StatMuse;
- 2 notas + 1 SC → media de las dos notas publicadas;
- 3 SC → sin nota ni aporte.

## Power RM · OK

**Entrada:** `metricFor()` + `currentRating()` + minutos oficiales.

No mantiene notas propias. La fórmula sigue siendo:

`Power = media × (0,75 + 0,25 × min(minutos,450)/450)`

Estado: **conectado al agregado oficial**.

## Laboratorio XI · OK

Consume exclusivamente las métricas cargadas en el panel:

- media oficial;
- minutos oficiales;
- Power RM;
- min/punto oficial.

No lee notas históricas de una fuente concreta ni guarda un ranking paralelo. Sus diferencias son únicamente de ponderación y optimización posicional.

Estado: **sin base estadística duplicada**.

## Radar · OK

- Media actual → ranking oficial.
- Power → media y minutos oficiales.
- Minutos → fuente central.
- Eficiencia → min/punto oficial.
- Forma reciente → `season-data.js.recentRating()`; desde v6 es la serie multifuente oficial.
- Comunidad → votos reales independientes de la capa estadística.

Estado: **sin dependencia de FotMob aislado para forma**.

## Centro de Inteligencia · OK

- Power y muestra → ranking oficial.
- Mayor subida → `ratingDelta()` oficial.
- Forma → serie temporal oficial.
- XI por datos → mismas métricas que Laboratorio.
- Comunidad, encuestas y MVP → señales comunitarias separadas.

Estado: **conectado a la fuente central**.

## Evolución · CORREGIDO

Hallazgo de la auditoría: `analytics.js` todavía leía `ratingEntry()`, que es la nota original de FotMob usada como dato fuente.

Corrección aplicada:

- ahora usa `officialRatingEntry()`;
- muestra cobertura `3/3`, `2+SC` y `SC`;
- forma, top 5, movimientos y matriz usan la misma nota oficial que el ranking principal;
- las apariciones 3 SC aparecen como `SC`, nunca como cero.

Estado: **migrado a la serie oficial**.

## Historial de jugador · CORREGIDO

Hallazgo de la auditoría: la gráfica de las fichas también seguía usando la entrada histórica de FotMob.

Corrección aplicada:

- gráfica → nota oficial multifuente;
- tabla de partidos → nota oficial + cobertura;
- resumen → número de 3/3, 2+SC y SC;
- media acumulada → ranking oficial.

Estado: **migrado a la serie oficial**.

## Jerarquías · CORREGIDO

La fórmula ya usaba `recentRating()`, pero el texto metodológico seguía describiendo la capa histórica antigua.

Corrección aplicada:

- forma reciente → serie oficial de `season-data.js`;
- trazabilidad visible → cobertura 3/3 y 2+SC;
- eliminada la explicación de reconstruidos como señal activa.

Estado: **alineado con la arquitectura v6**.

## Datos que permanecen como legado

`app.js` todavía contiene el antiguo array `efficiencyRanking`. Se conserva temporalmente para que la interfaz pueda arrancar incluso si falla la carga de la capa histórica.

No es autoritativo: `minute-sync.js` lo sustituye en memoria con `season-data.js.aggregatePlayer()` antes de cargar los módulos analíticos.

También se conserva `ratingEntry()` dentro de `season-data.js` como acceso de bajo nivel a la nota FotMob original. Sirve para procedencia y auditoría, no como serie activa de forma.

## Resultado

Tras esta auditoría, las pantallas analíticas activas tienen una única cadena estadística:

`datos por partido → season-data.js → agregado oficial → Power / Evolución / Radar / Laboratorio / Inteligencia / Jerarquías / fichas`

No debe volver a añadirse una nota, minuto, media o ranking directamente dentro de un módulo derivado.
