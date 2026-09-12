# Auditoría PRO · RM 26/27

Fecha: 12-09-2026

## Estándar PRO del proyecto

Una sección se considera **PRO** cuando cumple, en lo aplicable, estos criterios:

1. Usa la fuente canónica de temporada y no duplica cálculos incompatibles.
2. Expone contexto de muestra, cobertura o confianza cuando una cifra pueda engañar por pocos minutos/datos.
3. Tiene filtros/controles útiles para tomar decisiones, no solo una tabla estática.
4. Conecta con el resto del producto: ficha de jugador, Comparador PRO, XI, Predicción o histórico cuando corresponda.
5. Tiene comportamiento responsive y estado vacío/indisponible explícito.
6. No convierte SC/ausencia de nota en 0.
7. Evita reconstrucciones retrospectivas que hagan parecer que el modelo sabía algo antes de tiempo.
8. Tiene API pública `window.RM...` o integración equivalente para que otras capas puedan reutilizarla.
9. Está incluida en la PWA cuando forma parte de la experiencia pública.
10. Evita observadores DOM permanentes y reintentos infinitos.

## Estado por superficie

| Superficie | Capa principal | Estado | Siguiente salto |
|---|---|---:|---|
| Inicio | `home-pro` | PRO | Más síntesis histórica cuando crezca la muestra |
| Plantilla | `squad-pro` | PRO | Contexto por rol específico |
| Ficha de jugador | `playerhub` + `player-experience` + `player-intelligence` | **PRO V2** | Ampliar histórico cuando haya más jornadas auditadas |
| Estadísticas | `stats-pro` | **PRO V2** | Vistas personales nombradas / exportación filtrada |
| Eficiencia | `efficiency-pro` | PRO | Comparativa histórica por ventanas |
| Power RM | `power-pro` | PRO | Calibración del Power con más jornadas |
| Comparador | `compare-pro` | PRO | Endurecer apertura del radar/lifecycle |
| Partidos | `match-history-pro` | PRO | Más comparaciones entre bloques de jornadas |
| Centro del partido | `matchday-pro` | PRO | Integrar señales post-XI oficial |
| Predicción | `prediction-pro` + capas de decisión | PRO+ | Seguir auditando calibración |
| Constructor XI | `lineup-pro` | PRO | Recomendaciones por compatibilidad táctica |
| Evolución | `evolution-pro` | PRO | Filtros por competición/periodo compartidos |
| Mi temporada | `personal-season-pro` | PRO | Más memoria de decisiones personales |
| Comunidad | `community-pro` | **PRO** | Histórico comunitario cuando el backend acumule jornadas |
| Jerarquías | `hierarchy` | PRO funcional | Renombrado técnico opcional, no necesario |
| Inteligencia | `intelligence` | PRO funcional | Más señales explicables con muestra suficiente |
| Laboratorio XI | `lineuplab` | PRO funcional | Escenarios tácticos más ricos |
| Radar de decisión | `decisionradar` | PRO funcional | Lifecycle/arranque más robusto |

## Cambios de esta revisión

### Player Experience V2

- La ficha de cada jugador incorpora una lectura específica del próximo partido.
- Cruza cuatro perspectivas sin convertirlas en una probabilidad ficticia: Proyecto, Tu XI, Comunidad y Datos.
- Distingue si el jugador está en nuestra propuesta, entra como alternativa activa o queda fuera del debate principal.
- Si existe un rival directo, permite saltar al Comparador PRO o al Radar con el duelo ya preparado.
- Reutiliza la Mesa de decisiones, Estabilidad del XI, Round Impact y Auditoría de decisiones: no crea una segunda fuente de verdad.
- Añade histórico auditado por jugador cuando existen snapshots previos y XI oficiales posteriores.
- Los enlaces compartidos con parámetro `player` pueden abrir directamente la ficha correspondiente.
- Los reintentos para abrir Comparador/Radar y para instalar la capa son finitos.
- La capa está incluida en la PWA y tiene API reutilizable `window.RMPlayerIntelligence`.

### Comunidad PRO

- Mapa de consenso de los 11 puestos ordenado desde los más divididos a los más firmes.
- Etiquetas: Consenso fuerte, Mayoría, Debate abierto y Muy dividido.
- Muestra total y acuerdo medio del líder de cada puesto.
- Diferencia entre porcentaje por posición y porcentaje global en jugadores votados en varios puestos.
- Comparación del XI comunitario con Proyecto y con el borrador del usuario, tanto por presencia como por posición.
- Snapshots locales del consenso para detectar cambios de líder y variaciones en puntos porcentuales sin inventar histórico.
- Estado explícito cuando GitHub Pages no tiene backend: no se fabrican datos comunitarios.

### Estadísticas PRO V2

- Ventanas dinámicas por competición y últimos 1/3/5 partidos.
- Las ventanas recalculan de verdad media ponderada por minutos, aporte, Min/punto, Power RM, forma, estabilidad y percentiles.
- Cobertura redefinida de forma explícita como apariciones con nota / apariciones jugadas dentro de la ventana.
- Participación separada conceptualmente de la cobertura de valoración.
- Presets rápidos: temporada completa, últimos 3, defensas 270+ y ataque por forma.
- Serie visual reciente por jugador.
- Comparación rápida que manda un duelo al Comparador PRO.
- Preferencias de filtros persistentes en el dispositivo.

## Huecos que siguen siendo prioritarios

1. **Filtros compartidos**: permitir que Estadísticas, Power, Evolución y Eficiencia usen la misma ventana temporal/competición.
2. **Comparador PRO lifecycle**: eliminar cualquier dependencia frágil de cargas tardías del Radar y acotar todos los reintentos.
3. **Calibración histórica**: cuando haya muestra suficiente, medir qué señales anticipan mejor titularidad/rendimiento y cuáles generan falsos positivos.
4. **Histórico de jugador**: enriquecer Player Experience V2 con tendencias de decisiones cuando haya varias jornadas auditadas.
5. **Auditoría E2E**: incorporar pruebas de navegación/acciones reales en navegador cuando el proyecto tenga un runner E2E disponible.

## Regla de mantenimiento

Una nueva función no debe denominarse PRO solo por añadir más información. Debe mejorar una decisión, explicar la muestra y mantener coherencia con la fuente canónica del proyecto.
