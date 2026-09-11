# Auditoría Power RM y Jerarquías · 11-09-2026

Esta auditoría compara el estado previo del proyecto con el modelo oficial ya migrado a **SofaScore + FotMob + StatMuse**, aplicando la política `3/3`, `2 + SC` y `3 SC` definida en `DATA_AUDIT.md`.

## Power RM

La fórmula de Power no cambia:

`Power = media × (0,75 + 0,25 × min(minutos, 450) / 450)`

Lo que cambia es la **media que alimenta la fórmula**: deja de ser el acumulado legado y pasa a ser la media oficial derivada de la base central.

### Clasificación oficial de Power

| # | Jugador | Power oficial |
|---:|---|---:|
| 1 | Mbappé | 8,06 |
| 2 | Bellingham | 8,02 |
| 3 | Valverde | 7,57 |
| 4 | Vini Jr. | 7,52 |
| 5 | Huijsen | 7,29 |
| 6 | Arda Güler | 7,10 |
| 7 | Courtois | 6,83 |
| 8 | Cucurella | 6,78 |
| 9 | Konaté | 6,75 |
| 10 | Brahim Díaz | 6,49 |
| 11 | Trent Alexander-Arnold | 6,44 |
| 12 | Dumfries | 6,28 |
| 13 | Rüdiger | 6,03 |
| 14 | Bernardo Silva | 5,97 |
| 15 | Camavinga | 5,97 |
| 16 | Álvaro Carreras | 5,61 |
| 17 | Carlos Espí | 5,52 |
| 18 | Diomande | 5,26 |
| 19 | Tchouaméni | 4,84 |

### Cambio de posiciones

Solo cambia una pareja respecto al Power anterior:

- **Álvaro Carreras: #17 → #16**.
- **Carlos Espí: #16 → #17**.

El Top 15 y los puestos 18–19 permanecen exactamente igual.

Los mayores cambios de Power absoluto son:

- Álvaro Carreras: aproximadamente **+0,31**.
- Carlos Espí: aproximadamente **+0,21**.
- Tchouaméni: aproximadamente **+0,08**.
- Diomande: aproximadamente **+0,05**.
- Brahim Díaz: aproximadamente **+0,03**.

La explicación principal es que las medias de Carreras y Espí cambian al aplicar correctamente la política de micro-apariciones `SC`.

## Forma reciente oficial

Desde esta migración, la señal de **forma reciente** usada por los módulos derivados deja de depender únicamente de FotMob.

Cada partido usa:

- 3 notas publicadas → media de las 3 fuentes.
- 2 notas + 1 SC → media de las 2 publicadas.
- 3 SC → no existe nota de forma para ese partido.

La forma reciente sigue tomando como máximo las **3 últimas apariciones valoradas**, pero ahora trabaja con la nota combinada oficial.

## Mapa de Jerarquías

La fórmula se mantiene:

- **45% Power RM**
- **20% minutos / muestra**
- **20% forma reciente**
- **15% nuestras decisiones de XI**

Cambian dos entradas de la fórmula: Power y forma reciente pasan a utilizar el modelo oficial centralizado.

### Resultado global

La migración es estable:

- **No cambia el líder de ninguna posición**.
- **No cambia el orden de candidatos en ninguna posición**.
- **No cambia la categoría de ningún jugador salvo un caso**.

### Único cambio de categoría

En **lateral derecho (LD)**:

- Valverde continúa 1.º.
- Dumfries continúa 2.º.
- Trent continúa 3.º.
- **Dumfries pasa de `Duelo abierto` a `Rotación`** porque la distancia con Valverde supera ligeramente el umbral de duelo al combinar Power y forma con el modelo oficial.

El margen de la frontera del LD pasa aproximadamente de **0,45 a 0,47 puntos**.

### Fronteras principales

- **Puesto más abierto:** banda derecha (ED). La frontera sigue siendo Valverde / Arda Güler y el margen baja aproximadamente de **0,34 a 0,32**.
- **Puesto más claro:** mediapunta (MP). Bellingham conserva una ventaja muy amplia; la frontera permanece alrededor de **2,76 puntos**.
- LI, DFC, MC, EI y DC mantienen la misma estructura de titularidad, ventaja, rotación y fondo.

## Cambios mayores en el índice de jerarquía

Los movimientos más visibles del índice, sin alterar el orden, son aproximadamente:

- Álvaro Carreras en LI: **+0,12** frente al modelo anterior completo.
- Carlos Espí en DC: cambio pequeño al compensarse la mejora de Power con la nueva forma combinada.
- Tchouaméni: mejora leve por la nueva media oficial.
- Diomande: mejora leve gracias a la forma combinada.

## Corrección de carga de Power

`playerhub.js` dibuja la sección Power antes de que `season-data.js` termine de cargar. Para evitar que la pantalla conserve visualmente el ranking legado, `minute-sync.js` ahora fuerza el repintado de:

- Plantilla.
- Estadísticas.
- Comparador.
- Power RM completo.
- Resumen Power de Inicio.

También expone `RMPowerMigration` con el Power anterior, el oficial y los cambios de posición para futuras auditorías.

## Estado final

Desde este punto:

1. **Ranking de eficiencia:** oficial de tres fuentes.
2. **Power RM:** usa la media oficial y minutos centrales.
3. **Forma reciente:** usa la valoración combinada oficial por partido.
4. **Jerarquías:** reciben Power y forma del modelo oficial.
5. Las cifras legado de `app.js` quedan únicamente como fallback de compatibilidad.

No es necesario mantener dos versiones del Power ni de las jerarquías.