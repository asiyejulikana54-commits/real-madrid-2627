# Auditoría de datos · RM 26/27

**Fecha de corte:** 11-09-2026

## Estado de la base histórica

La fuente única `season-data.js` mantiene cinco partidos: Málaga, Real Sociedad, Espanyol, Betis e Inter.

- Notas históricas FotMob confirmadas: **70**
- Registros de minutos confirmados: **96**
- Registros reconstruidos activos: **0**

Los huecos no documentados permanecen ausentes/pending; no se inventan valores para completar tablas.

## Cobertura multifuente

Fuentes objetivo del modelo acumulado:

- SofaScore: **74** valoraciones recuperadas
- FotMob: **70** valoraciones recuperadas
- StatMuse: **71** valoraciones recuperadas

Sobre **77 apariciones con minutos > 0**:

- **68** tienen las tres fuentes (`3/3`)
- **4** tienen dos fuentes (`2/3`)
- **3** tienen una fuente (`1/3`)
- **2** no tienen valoración recuperada

Las capturas directas aportadas el 11-09-2026 permiten cerrar SofaScore de **Real Sociedad** y **Espanyol** para todas las apariciones calificadas mostradas. También corrigen a **Carlos Espí vs Espanyol: 7,8** en SofaScore.

La cobertura ha mejorado de 47 a 68 apariciones `3/3`, pero todavía no se sustituye automáticamente el ranking acumulado principal hasta reconciliar también los minutos acumulados.

## Casos que siguen sin 3/3

### Málaga

- Arda Güler — `1/3`: falta SofaScore + FotMob.

### Real Sociedad

- Brahim Díaz — `2/3`: falta StatMuse.
- Diomande — `2/3`: falta FotMob.
- Carlos Espí — `2/3`: falta FotMob.

### Betis

- Bernardo Silva — `2/3`: falta StatMuse.
- Álvaro Carreras — `1/3`: falta FotMob + StatMuse.
- Carlos Espí — `1/3`: falta FotMob + StatMuse.

### Inter

- Álvaro Carreras — `0/3`: sin nota recuperada en las tres fuentes.
- Carlos Espí — `0/3`: sin nota recuperada en las tres fuentes.

Los casos especialmente cortos pueden permanecer legítimamente sin nota si la fuente no publicó valoración; eso no se transforma en un cero ni en una estimación.

## Evidencia directa y conflictos

Cuando existe una captura directa del partido conservada en el proyecto, esa evidencia prevalece sobre perfiles agregados o resúmenes posteriores si aparece un conflicto.

La auditoría ya ha servido para corregir tanto valoraciones como minutajes reconstruidos anteriores. Los cambios verificados se incorporan a `season-data.js` y cualquier reconstrucción incompatible se descarta.

## Minutos acumulados: reconciliación pendiente

Los minutos acumulados que usa actualmente `app.js` no coinciden exactamente con la suma simple de los minutajes partido a partido de la nueva capa histórica. Esto puede deberse a convenciones distintas de registro, redondeos y/o a datos históricos que todavía no están reconciliados.

Por ese motivo **no se reemplaza todavía `efficiencyRanking`**. Los minutos acumulados actuales quedan congelados hasta disponer de una reconciliación jugador por jugador y decidir una única convención oficial para toda la web.

## Motor de tres fuentes preparado

`season-data.js` v4 incorpora funciones para:

- consultar las tres notas por partido y jugador;
- saber si la cobertura es `3/3`, `2/3` o `1/3`;
- calcular una nota combinada sin fingir que un parcial es completo;
- calcular aporte por partido;
- construir agregados y rankings a partir de una cobertura mínima configurable;
- auditar automáticamente el número de registros por fuente.

Estas funciones quedan **preparadas para auditoría**, pero el ranking público del panel no se recalculará hasta cerrar cobertura y minutos.

## Modelo definitivo previsto

Cuando un partido tenga las tres fuentes confirmadas:

`nota combinada = (SofaScore + FotMob + StatMuse) / 3`

`aporte = nota combinada × minutos / 90`

`media acumulada = suma(aportes) × 90 / suma(minutos incluidos)`

`min/punto = suma(minutos incluidos) / suma(aportes)`

No se aplica corte de 45 minutos en el modelo actual.

## Regla de cierre

No se dará por cerrada la migración del ranking principal hasta que:

1. la cobertura multifuente sea suficientemente homogénea;
2. los minutos acumulados estén reconciliados con la capa histórica;
3. cualquier diferencia relevante con el ranking legado esté explicada y trazable.
