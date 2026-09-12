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
| Inicio | `home-pro` + `personal-home` + `engagement-loop` | **PRO V2** | Afinar el briefing conforme crezca el histórico |
| Plantilla | `squad-pro` | PRO | Contexto por rol específico |
| Ficha de jugador | `playerhub` + `player-experience` + `player-intelligence` | **PRO V2** | Ampliar histórico cuando haya más jornadas auditadas |
| Estadísticas | `stats-pro` | **PRO V2** | Vistas personales nombradas / exportación filtrada |
| Eficiencia | `efficiency-pro` | **PRO V2** | Comparar dos ventanas entre sí |
| Power RM | `power-pro` | **PRO V2** | Calibración del Power con más jornadas |
| Comparador | `compare-pro` | PRO | Endurecer apertura del radar/lifecycle |
| Partidos | `match-history-pro` | PRO | Más comparaciones entre bloques de jornadas |
| Centro del partido | `matchday-pro` | PRO | Integrar señales post-XI oficial |
| Predicción | `prediction-pro` + capas de decisión | PRO+ | Seguir auditando calibración |
| Constructor XI | `lineup-pro` | PRO | Recomendaciones por compatibilidad táctica |
| Evolución | `evolution-pro` | **PRO V2** | Comparar ventanas y competiciones lado a lado |
| Mi temporada | `personal-season-pro` + `engagement-loop` | **PRO V2** | Clasificación global cuando exista backend histórico suficiente |
| Comunidad | `community-pro` | **PRO** | Histórico comunitario cuando el backend acumule jornadas |
| Jerarquías | `hierarchy` | PRO funcional | Renombrado técnico opcional, no necesario |
| Inteligencia | `intelligence` | PRO funcional | Más señales explicables con muestra suficiente |
| Laboratorio XI | `lineuplab` | PRO funcional | Escenarios tácticos más ricos |
| Radar de decisión | `decisionradar` | PRO funcional | Lifecycle/arranque más robusto |

## Cambios de esta revisión

### Bucle de retorno diario

- Nueva capa `engagement-loop` orientada a retención, no a añadir más métricas aisladas.
- Inicio muestra un **marcador personal** con media de aciertos, récord, racha de pronósticos 8+ y balance frente al Proyecto.
- Cuando existe muestra auditada, el usuario ve también su posición dentro de la liga local de escenarios del proyecto.
- Se incorpora un **Duelo del día** de un toque, construido a partir de debates reales de `RMDecisionBoard`; no se inventan enfrentamientos.
- El voto diario se guarda solo en el dispositivo mediante `rm_daily_debate_votes_v1` y puede modificarse mientras el debate siga abierto.
- Si existe `RMCommunityData`, el duelo muestra porcentajes reales por posición; si no, la ausencia de backend no se presenta como consenso.
- El duelo abre directamente el Comparador PRO con los dos jugadores elegidos.
- Inicio añade un briefing **Hoy en RM 26/27** reutilizando los cambios detectados por `RMPersonalHome` y el estado real de la predicción.
- Mi temporada incorpora un perfil ampliado: media, récord, racha 8+, última variación, balance frente a Proyecto y posición en la Liga de escenarios.
- La capa no hace llamadas de red propias, no usa `MutationObserver`, tiene reintentos finitos y queda incluida en la PWA.
- Existe una auditoría automática específica en `scripts/validate-engagement.cjs` y `.github/workflows/engagement-audit.yml`.

### Contexto compartido de análisis

- Nueva API `window.RMAnalysisContext` con estado persistente de competición y periodo.
- Un cambio de contexto se propaga mediante `rm-analysis-context-updated` y recalcula Power, Eficiencia y Evolución.
- Estadísticas PRO sigue siendo compatible con sus controles existentes y queda sincronizada con el mismo estado global.
- Cambiar a últimos 1/3/5 partidos o a una competición concreta recalcula las métricas: no se limita a esconder filas.
- Power recalcula media ponderada por minutos, muestra, Power, forma, tendencia y estabilidad dentro de la ventana.
- Eficiencia recalcula minutos, aporte, Min/punto, Power y forma dentro de la misma ventana.
- Evolución limita series, Momentum, rachas, extremos y comparaciones de jornada al contexto seleccionado, conservando la numeración real de las jornadas.
- El contexto compartido se guarda localmente, no hace llamadas de red y está incluido en la PWA.
- La auditoría automática comprueba sintaxis, API, carga, PWA y conexión de las tres capas dinámicas.

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

1. **Clasificación social real**: cuando el backend acumule XI oficiales y puntuaciones, convertir el marcador personal en ranking global y ligas privadas sin reconstruir resultados pasados.
2. **Comparador PRO lifecycle**: eliminar cualquier dependencia frágil de cargas tardías del Radar y acotar todos los reintentos.
3. **Calibración histórica**: cuando haya muestra suficiente, medir qué señales anticipan mejor titularidad/rendimiento y cuáles generan falsos positivos.
4. **Comparación entre ventanas**: permitir comparar, por ejemplo, temporada completa vs últimos 3 partidos para un jugador o grupo.
5. **Auditoría E2E**: incorporar pruebas de navegación/acciones reales en navegador cuando el proyecto tenga un runner E2E disponible.

## Regla de mantenimiento

Una nueva función no debe denominarse PRO solo por añadir más información. Debe mejorar una decisión, explicar la muestra y mantener coherencia con la fuente canónica del proyecto.
