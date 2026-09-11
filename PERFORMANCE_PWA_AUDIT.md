# Auditoría de rendimiento móvil y PWA

Fecha: 11-09-2026

## Problemas detectados

1. `community.js` cargaba de forma inmediata toda la capa analítica al abrir la web, aunque el visitante permaneciera en Inicio. La cadena incluía MVP, entrada/extensión de temporada, historial, Evolución, Laboratorio, Radar, Inteligencia y Jerarquías.
2. Solo esos módulos diferibles suponían aproximadamente **93 KB de JavaScript** y más de **32 KB de CSS** sin minificar, además del resto del frontend.
3. `ux-cleanup.js`, `ux-refine.js`, `visual-system.js`, `ux-dedupe.js` y `mobile-ux.js` mantenían observadores globales del DOM. Un cambio en una tarjeta podía provocar varias pasadas completas de clasificación, búsqueda y modificación de nodos.
4. `share-cards.js` (~17 KB) se cargaba siempre, aunque el usuario no fuera a compartir ninguna ficha, comparativa, XI o resultado.
5. La web no tenía manifest, service worker ni modo standalone.

## Cambios aplicados

### Carga progresiva

- `matchday.js` y `playerhub.js` se cargan después del primer render porque son los dos módulos necesarios para la navegación pública principal.
- El resto de módulos analíticos se cargan **secuencialmente durante tiempos de inactividad** mediante `requestIdleCallback` con fallback a temporizador.
- Al terminar la cola se emite `rm-modules-ready`, que actualiza navegación y capas visuales una sola vez.
- La Comunidad ya no hace una petición de red automática desde `community.js` al arrancar; se carga al entrar en la sección o desde la capa pública cuando el backend está disponible.

### Menos repintados

Se eliminaron los `MutationObserver` globales de:

- `ux-cleanup.js`
- `ux-refine.js`
- `visual-system.js`
- `ux-dedupe.js`
- `mobile-ux.js`

Ahora esas capas se actualizan por:

- cambio explícito de sección;
- `rm-critical-modules-ready`;
- `rm-modules-ready`;
- eventos oficiales de ranking/temporada/comunidad/partido;
- unos pocos refrescos iniciales controlados.

El observador específico del grid de jugadores puede mantenerse porque está acotado a un único contenedor y solo redecora tarjetas cuando cambia ese grid.

### Tarjetas compartibles bajo demanda

`share-cards.js` y `share-cards.css` ya no forman parte del arranque. Se cargan al entrar en Plantilla, Comparador, Constructor XI o Predicción.

## PWA

Se añadieron:

- `manifest.webmanifest`
- `app-icon.svg`
- `sw.js`
- `pwa.js`
- `pwa.css`

Características:

- instalación en pantalla de inicio cuando el navegador lo permita;
- modo `standalone`;
- accesos directos a Predicción, Power RM y Constructor XI;
- soporte de `safe-area` en móviles instalados;
- aviso de modo sin conexión;
- caché local del shell básico;
- navegación y scripts/estilos con estrategia **network-first** para evitar ejecutar una versión antigua después de una actualización;
- imágenes y fuentes con `stale-while-revalidate`;
- las rutas `/.netlify/functions/` quedan fuera del service worker para no cachear respuestas de la comunidad.

## Protección en CI

GitHub Pages ahora bloquea el despliegue si:

- falla la sintaxis de cualquiera de las capas modificadas;
- el manifest deja de ser JSON válido;
- desaparecen los enlaces PWA del HTML;
- se reintroduce un `MutationObserver` global en las cinco capas de presentación auditadas;
- desaparece la carga progresiva por `requestIdleCallback`;
- el service worker deja de excluir las funciones de Netlify.

## Resultado esperado

La primera interacción móvil deja de competir con la carga y ejecución simultánea de todos los módulos avanzados. Inicio queda utilizable antes, el trabajo pesado se reparte en ventanas de inactividad y las capas visuales dejan de reaccionar varias veces al mismo cambio de DOM. La web puede instalarse como aplicación y conservar el shell básico para aperturas posteriores y uso sin conexión parcial.
