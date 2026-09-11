# Auditoría de datos · RM 26/27

**Fecha de corte:** 11-09-2026  
**Arquitectura activa:** `season-data.js` v6

## Estado final

La auditoría estadística y de módulos derivados queda cerrada sobre los cinco partidos trabajados: Málaga, Real Sociedad, Espanyol, Betis e Inter.

La regla de arquitectura es ahora única:

`datos por partido → season-data.js → agregado oficial → módulos derivados`

No hay que volver a introducir manualmente una media, un Power, una forma o una jerarquía en otro archivo.

## Cobertura multifuente

Fuentes de valoración:

- SofaScore: **75** valoraciones publicadas
- FotMob: **70** valoraciones publicadas
- StatMuse: **75** valoraciones publicadas

Sobre **77 apariciones con minutos > 0**:

- **70** tienen tres notas (`3/3`)
- **5** tienen dos notas + una fuente `SC`
- **2** tienen las tres fuentes `SC`
- **0** quedan pendientes de comprobar

Están resueltos los **231 estados fuente-aparición** posibles: **220 valoraciones + 11 SC**.

`SC · Sin calificación` significa que la fuente fue comprobada y no publicó nota. Nunca equivale a cero.

## Casos SC

- Málaga · Arda Güler 3': SofaScore 7,6 + StatMuse 8,9 + FotMob SC.
- Real Sociedad · Diomande 6': SofaScore 6,6 + StatMuse 6,7 + FotMob SC.
- Real Sociedad · Carlos Espí 4': SofaScore 6,4 + StatMuse 6,6 + FotMob SC.
- Betis · Álvaro Carreras 2': SofaScore 6,9 + StatMuse 7,0 + FotMob SC.
- Betis · Carlos Espí 8': SofaScore 6,4 + StatMuse 6,9 + FotMob SC.
- Inter · Álvaro Carreras 3': SC en las tres fuentes.
- Inter · Carlos Espí 1': SC en las tres fuentes.

## Política oficial

1. **3/3:** media aritmética de SofaScore + FotMob + StatMuse.
2. **2 + SC:** media aritmética de las dos notas publicadas.
3. **3 SC:** conserva minutos, pero no genera nota ni aporte.
4. **Aporte de partido:** `nota oficial × minutos / 90`.
5. **Media acumulada:** `puntos × 90 / minutos con valoración`.
6. **Min/punto:** `todos los minutos jugados / puntos`.
7. No existe corte de 45 minutos ni otro mínimo de participación.

## Minutos reconciliados

La comparación del acumulado legado con los minutos partido a partido quedó cerrada:

- 19 jugadores comprobados
- 17 coincidencias exactas
- 2 correcciones
- total legado: **4.950 min**
- total histórico central: **4.950 min**
- cada partido suma **990 min**

Correcciones:

- Mbappé: **450 → 449 min**
- Carlos Espí: **22 → 23 min**

Era el mismo minuto del Inter reasignado correctamente: Mbappé 89' y Espí 1'.

## Ranking oficial

`minute-sync.js` v4 ya no recalcula una metodología paralela. Consume directamente `season-data.js.aggregatePlayer()` y vuelca esos resultados sobre el antiguo `efficiencyRanking`, que queda únicamente como fallback de arranque.

El orden oficial permanece:

| # | Jugador | Media | Min/punto |
|---:|---|---:|---:|
| 1 | Arda Güler | 8,20 | 10,97 |
| 2 | Bellingham | 8,14 | 11,06 |
| 3 | Mbappé | 8,06 | 11,17 |
| 4 | Brahim Díaz | 7,76 | 11,60 |
| 5 | Valverde | 7,66 | 11,75 |
| 6 | Vini Jr. | 7,56 | 11,91 |
| 7 | Rüdiger | 7,53 | 11,95 |
| 8 | Trent Alexander-Arnold | 7,46 | 12,07 |
| 9 | Huijsen | 7,29 | 12,34 |
| 10 | Cucurella | 7,23 | 12,45 |
| 11 | Konaté | 7,10 | 12,68 |
| 12 | Camavinga | 7,04 | 12,79 |
| 13 | Carlos Espí | 7,24* | 13,00 |
| 14 | Bernardo Silva | 6,91 | 13,02 |
| 15 | Courtois | 6,83 | 13,17 |
| 16 | Dumfries | 6,75 | 13,34 |
| 17 | Álvaro Carreras | 6,89* | 13,41 |
| 18 | Diomande | 6,56 | 13,72 |
| 19 | Tchouaméni | 6,40 | 14,06 |

`*` En Carreras y Espí la media excluye la micro-aparición del Inter con 3 SC; esos minutos sí cuentan en eficiencia.

## Serie temporal oficial

Desde `season-data.js` v6, las funciones activas son:

- `officialRatingEntry()`
- `ratingSeries()`
- `recentRating()`
- `ratingDelta()`
- `aggregatePlayer()`
- `aggregateRanking()`

La forma reciente **ya no usa FotMob de manera aislada**. Usa la misma nota oficial multifuente que el ranking.

`ratingEntry()` se conserva únicamente como acceso de bajo nivel a la nota FotMob original para procedencia/auditoría.

## Auditoría de módulos derivados

### Power RM — correcto

Consume media y minutos oficiales. No mantiene notas propias.

### Laboratorio XI — correcto

Consume media, minutos, Power y min/punto oficiales. Solo cambia ponderaciones y optimización posicional.

### Radar — correcto

Media, Power, minutos y eficiencia salen del ranking oficial. Forma reciente sale de `recentRating()` oficial. Comunidad es una señal independiente.

### Centro de Inteligencia — correcto

Power/muestra proceden del ranking oficial; subidas y forma usan `ratingDelta()`/`recentRating()` oficiales; el XI por datos comparte las métricas del Laboratorio.

### Evolución — corregido

Era uno de los restos reales de la metodología antigua: leía directamente `ratingEntry()` (FotMob). Ahora usa `officialRatingEntry()` y muestra `3/3`, `2+SC` y `SC`.

Top 5 temporal, movimientos y matriz ya usan la serie oficial.

### Historial de jugador — corregido

La gráfica de las fichas también usaba FotMob como serie temporal. Ahora gráfica, tabla y resumen consumen la nota oficial multifuente.

### Jerarquías — corregido

El cálculo ya apuntaba a `recentRating()`, pero la explicación metodológica seguía describiendo la capa antigua. Queda alineada con la forma oficial y con la cobertura 3/3 / 2+SC.

## Orden de carga

`index.html` fija ahora este orden:

1. `app.js` — estructura + fallback
2. `season-data.js?v=6` — fuente oficial
3. `minute-sync.js?v=4` — migración del ranking
4. `community.js?v=2` — interfaz y carga de módulos derivados
5. `ux-cleanup.js`

Esto evita que Power, Laboratorio u otros módulos calculen constantes sobre el ranking legado antes de que se aplique la migración.

## Resultado

La cadena estadística activa queda unificada:

`season-data.js → ranking oficial → Power / fichas / Evolución / Radar / Laboratorio / Inteligencia / Jerarquías`

Para un nuevo partido solo deben incorporarse en `season-data.js` los minutos, las notas publicadas y los SC comprobados. El resto se recalcula automáticamente.

Para detalles técnicos por módulo, consultar `DERIVED_MODULE_AUDIT.md`.
