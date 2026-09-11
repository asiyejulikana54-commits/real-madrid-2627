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

## Minutos acumulados: reconciliación pendiente

Los minutos acumulados que usa actualmente `app.js` no coinciden exactamente con la suma simple de los minutajes partido a partido de la nueva capa histórica. Esto puede deberse a convenciones distintas de registro, redondeos y/o a datos históricos todavía no reconciliados.

Por ese motivo **no se reemplaza todavía `efficiencyRanking`**. La cobertura por fuente ya está cerrada; el bloqueo pendiente para migrar el ranking principal es ahora la reconciliación de minutos y la comparación final con el ranking legado.

## Motor de tres fuentes

`season-data.js` v5 distingue entre valoración publicada, `SC` y pendiente; consulta las tres fuentes por partido y jugador; calcula notas combinadas; construye agregados; y audita tanto cobertura de notas como estados `SC`.

Modelo estricto cuando existen tres notas:

`nota combinada = (SofaScore + FotMob + StatMuse) / 3`

`aporte = nota combinada × minutos / 90`

`media acumulada = suma(aportes) × 90 / suma(minutos incluidos)`

`min/punto = suma(minutos incluidos) / suma(aportes)`

No se aplica corte de 45 minutos.

## Regla de cierre

La **cobertura multifuente queda cerrada**. La migración del ranking principal quedará cerrada cuando:

1. los minutos acumulados estén reconciliados con la capa histórica;
2. se defina explícitamente la política estadística para apariciones `SC`;
3. cualquier diferencia relevante con el ranking legado esté explicada y trazable.
