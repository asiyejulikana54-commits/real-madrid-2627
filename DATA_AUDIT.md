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

## Regla para SC

Una aparición `SC` está **cerrada documentalmente**, pero no se convierte artificialmente en `3/3`. Para un ranking que exija tres notas reales, esa aparición no entra en el cálculo estricto. Si en el futuro se usa una política de dos fuentes para micro-apariciones, deberá indicarse expresamente en la interfaz y en la metodología.

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

Desde esta auditoría, `minute-sync.js` toma `RMSeasonData.MINUTES` como fuente de verdad para el ranking. Al cargarse la base histórica:

1. suma automáticamente los minutos partido a partido de cada jugador;
2. sustituye cualquier acumulado legado distinto;
3. recalcula `min/punto` con esos minutos;
4. reordena el ranking de eficiencia si procede;
5. expone `RMMinuteAudit` para detectar futuras desviaciones.

Los minutos almacenados dentro de `app.js` pasan a ser únicamente un **fallback de compatibilidad** y dejan de ser la fuente estadística autoritativa.

## Motor de tres fuentes

`season-data.js` v5 distingue entre valoración publicada, `SC` y pendiente; consulta las tres fuentes por partido y jugador; calcula notas combinadas; construye agregados; y audita tanto cobertura de notas como estados `SC`.

Modelo estricto cuando existen tres notas:

`nota combinada = (SofaScore + FotMob + StatMuse) / 3`

`aporte = nota combinada × minutos / 90`

`media acumulada = suma(aportes) × 90 / suma(minutos incluidos)`

`min/punto = suma(minutos incluidos) / suma(aportes)`

No se aplica corte de 45 minutos.

## Estado de la migración del ranking

La **cobertura multifuente** y la **reconciliación de minutos** están cerradas.

Antes de sustituir definitivamente los puntos y la media del ranking legado solo queda fijar y documentar la política estadística para las siete micro-apariciones `SC` y comparar el ranking recalculado con el legado para explicar cualquier cambio relevante.
