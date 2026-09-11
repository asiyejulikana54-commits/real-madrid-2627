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

- SofaScore: **50** valoraciones recuperadas
- FotMob: **70** valoraciones recuperadas
- StatMuse: **71** valoraciones recuperadas

Sobre **77 apariciones con minutos > 0**:

- **47** tienen las tres fuentes (`3/3`)
- **22** tienen dos fuentes (`2/3`)
- **6** tienen una fuente (`1/3`)
- **2** no tienen valoración recuperada

Por tanto, la cobertura todavía no permite sustituir de forma limpia el ranking acumulado principal por el cálculo nuevo de tres fuentes.

## Pendientes prioritarios

La prioridad de recuperación es SofaScore, especialmente en **Real Sociedad** y **Espanyol**, además de algunas apariciones muy cortas. No se asignará una nota a un jugador solo porque otra fuente la muestre o porque el valor parezca deducible.

Casos especialmente cortos, como Carreras/Carlos Espí ante el Inter, pueden aparecer sin nota si la fuente no publicó valoración; eso no se transforma en un cero ni en una estimación.

## Evidencia directa y conflictos

Para Inter se priorizan las capturas directas del partido conservadas en el proyecto frente a valores que puedan aparecer después en perfiles agregados. Esta regla se aplica a cualquier partido: **la evidencia directa del encuentro prevalece sobre un resumen posterior cuando existe conflicto**.

La auditoría ya ha servido para corregir minutajes reconstruidos anteriores. Los cambios verificados se incorporan a `season-data.js` y la reconstrucción se descarta.

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
