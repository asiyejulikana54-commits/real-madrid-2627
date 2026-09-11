# Auditoría de datos · RM 26/27

**Fecha de corte:** 11-09-2026

## Estado de la base histórica

La fuente única `season-data.js` mantiene cinco partidos: Málaga, Real Sociedad, Espanyol, Betis e Inter.

- Notas históricas FotMob confirmadas: **70**
- Registros de minutos confirmados: **96**
- Registros reconstruidos activos: **0**
- Apariciones pendientes de clasificar por fuente: **0**

`SC · Sin calificación` significa que la fuente fue comprobada y no publicó una nota para esa aparición. No se interpreta como 0, ni como dato pendiente, ni se inventa una valoración.

## Cobertura multifuente cerrada

Fuentes objetivo del modelo acumulado:

- SofaScore: **75** valoraciones recuperadas
- FotMob: **70** valoraciones recuperadas
- StatMuse: **75** valoraciones recuperadas

Sobre **77 apariciones con minutos > 0**:

- **70** tienen las tres fuentes con nota (`3/3`)
- **5** tienen dos notas + una fuente `SC`
- **2** tienen las tres fuentes `SC`
- **0** apariciones quedan pendientes de comprobar

En total están resueltos los **231 estados fuente-aparición** posibles (77 × 3): 220 con valoración y 11 como `SC`.

## Casos cerrados como SC

### Málaga

- Arda Güler — 3': SofaScore 7,6 + StatMuse 8,9; FotMob `SC`.

### Real Sociedad

- Diomande — 6': SofaScore 6,6 + StatMuse 6,7; FotMob `SC`.
- Carlos Espí — 4': SofaScore 6,4 + StatMuse 6,6; FotMob `SC`.

### Betis

- Álvaro Carreras — 2': SofaScore 6,9 + StatMuse 7,0; FotMob `SC`.
- Carlos Espí — 8': SofaScore 6,4 + StatMuse 6,9; FotMob `SC`.

### Inter

- Álvaro Carreras — 3': SofaScore `SC`, FotMob `SC`, StatMuse `SC`.
- Carlos Espí — 1': SofaScore `SC`, FotMob `SC`, StatMuse `SC`.

Las capturas directas aportadas el 11-09-2026 cerraron SofaScore de Real Sociedad y Espanyol y corrigieron Carlos Espí vs Espanyol a **7,8** en SofaScore. Las capturas posteriores cerraron Brahim vs Real Sociedad (**7,0 StatMuse**), Bernardo vs Betis (**6,8 StatMuse**), Carreras vs Betis (**7,0 StatMuse**), Espí vs Betis (**6,9 StatMuse**) y Güler vs Málaga (**7,6 SofaScore**).

## Política oficial para SC

La política estadística queda fijada de forma definitiva:

1. **3 notas publicadas:** media aritmética de SofaScore + FotMob + StatMuse.
2. **2 notas + 1 SC:** media aritmética de las dos notas que sí fueron publicadas.
3. **3 SC:** la aparición conserva sus minutos oficiales, pero no genera nota ni aporte.
4. La **media acumulada** usa solo los minutos de apariciones con al menos una valoración publicada.
5. `min/punto` usa **todos los minutos jugados**, incluidos los minutos de una aparición 3 SC.
6. No existe corte mínimo de 45 minutos ni ningún otro umbral de participación.

Así se evita tratar un `SC` como cero y, al mismo tiempo, los minutos realmente jugados siguen formando parte de la eficiencia temporal del futbolista.

## Evidencia directa y conflictos

Cuando existe una captura directa del partido conservada en el proyecto, esa evidencia prevalece sobre perfiles agregados o resúmenes posteriores si aparece un conflicto.

La auditoría ha servido para corregir valoraciones y minutajes reconstruidos anteriores. Los cambios verificados se incorporan a `season-data.js` y cualquier reconstrucción incompatible se descarta.

## Minutos acumulados: reconciliación cerrada

La comparación jugador por jugador entre el antiguo `efficiencyRanking` y la suma de los minutos confirmados de los cinco partidos ha quedado cerrada.

- Jugadores del ranking comprobados: **19**
- Coincidencias exactas: **17/19**
- Diferencias reales: **2**
- Total antiguo del ranking: **4.950 minutos**
- Total histórico central: **4.950 minutos**
- Total por partido: **990 minutos** (11 × 90) en cada uno de los cinco encuentros

Las dos diferencias eran el mismo minuto del Inter asignado de forma distinta:

- **Mbappé:** 450 → **449 minutos**. Inter queda confirmado en 89'.
- **Carlos Espí:** 22 → **23 minutos**. Inter queda confirmado en 1'.

Por tanto, no existía una discrepancia de convención global ni minutos perdidos: el total de equipo ya era correcto y solo había que reasignar un minuto entre ambos jugadores.

## Ranking oficial migrado

Desde el 11-09-2026, el ranking principal deja de usar los puntos heredados de `app.js` como fuente autoritativa. `minute-sync.js` aplica el modelo oficial cuando `RMSeasonData` está disponible:

- suma los minutos históricos confirmados;
- calcula la nota de cada aparición según la política 3/3, 2+SC o 3SC;
- calcula `aporte = nota × minutos / 90`;
- calcula la media acumulada con minutos valorados;
- calcula `min/punto` con todos los minutos jugados;
- sustituye en memoria los puntos, la media y la eficiencia del ranking legado;
- reordena el ranking;
- expone `RMRankingMigration` y `RMMinuteAudit` para poder auditar cualquier cambio futuro.

Los datos escritos dentro de `app.js` quedan como **fallback de compatibilidad**; la fuente oficial en ejecución es `season-data.js` + la política de migración.

### Comparación de posiciones

La migración no produce ningún cambio de posición respecto al ranking legado ya reconciliado:

| # | Jugador | Media oficial | Min/punto oficial |
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

`*` La media de Espí y Carreras excluye de su denominador la micro-aparición del Inter con 3 SC; sus minutos sí cuentan en `min/punto`.

## Lectura del cambio frente al legado

La migración cambia ligeramente varias medias y aportes, porque ahora las tres fuentes están centralizadas y las micro-apariciones SC tienen una regla explícita. Sin embargo, **el orden completo 1–19 permanece exactamente igual**, por lo que no aparece ninguna anomalía estructural ni salto artificial de jerarquía.

Los cambios más visibles de media son:

- Álvaro Carreras: aproximadamente 6,51 → **6,89**.
- Carlos Espí: aproximadamente 6,97 → **7,24** en minutos valorados.
- Diomande: aproximadamente 6,50 → **6,56**.
- Tchouaméni: aproximadamente 6,30 → **6,40**.

El resto de jugadores se mueve solo unas centésimas.

## Estado final

La **cobertura multifuente**, la **clasificación de SC**, la **reconciliación de minutos** y la **migración del ranking principal** están cerradas.

A partir de este punto, cualquier nuevo partido debe añadirse primero a `season-data.js`. El ranking, Power, fichas, comparadores y módulos derivados deben consumir esa fuente central y no volver a mantener acumulados independientes.
