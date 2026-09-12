const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['engagement-loop.js','engagement-rewards.js','quick-picks.js','favorite-watch.js','activity-center.js','community-league.js','community.js','personal-nav.js','analysis-context.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('engagement-loop.js'),css=read('engagement-loop.css'),rewards=read('engagement-rewards.js'),rewardsCss=read('engagement-rewards.css'),quick=read('quick-picks.js'),quickCss=read('quick-picks.css'),watch=read('favorite-watch.js'),watchCss=read('favorite-watch.css'),activity=read('activity-center.js'),activityCss=read('activity-center.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
const rewardsLower=rewards.toLowerCase();
const league=read('community-league.js'),leagueCss=read('community-league.css'),community=read('community.js'),nav=read('personal-nav.js'),backend=read('netlify/functions/community-v2.mts');
for(const marker of ['TU MARCADOR','DUELO DEL DÍA','HOY EN RM 26/27','PERFIL DE PREDICCIÓN','rm_daily_debate_votes_v1','RMScenarioAudit','RMDecisionBoard','attempts<100'])if(!js.includes(marker))failures.push(`engagement-loop.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('engagement-loop.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('engagement-loop.js no debe usar MutationObserver');
for(const marker of ['.egl-grid','.egl-vote-pair','.egs-grid'])if(!css.includes(marker))failures.push(`engagement-loop.css: falta ${marker}`);
for(const marker of ['RACHAS E INSIGNIAS','RETOS DE HOY','rm_engagement_visit_days_v1','Compartir mi progreso','RMEngagementRewards','attempts<100'])if(!rewards.includes(marker))failures.push(`engagement-rewards.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(rewards))failures.push('engagement-rewards.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(rewards))failures.push('engagement-rewards.js no debe usar MutationObserver');
for(const marker of ['.er-home-card','.er-missions','.er-badges','.er-streaks'])if(!rewardsCss.includes(marker))failures.push(`engagement-rewards.css: falta ${marker}`);
if(!rewardsLower.includes('no crean puntos ficticios')||!rewardsLower.includes('no cambia tus estadísticas'))failures.push('las recompensas deben separar gamificación de estadísticas reales');
for(const marker of ['QUICK PICKS','rm_quick_picks_v1','freezeQuestions','perfect:resolved===3&&correct===3','ANULADA · JUEGAN AMBOS O NINGUNO','RMQuickPicks','attempts<120'])if(!quick.includes(marker))failures.push(`quick-picks.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(quick))failures.push('quick-picks.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(quick))failures.push('quick-picks.js no debe usar MutationObserver');
if(!quick.includes('if(!m||closed())return null'))failures.push('Quick Picks debe impedir crear preguntas después del cierre');
for(const marker of ['.qp-grid','.qp-option','.qp-result','.qp-season-kpis'])if(!quickCss.includes(marker))failures.push(`quick-picks.css: falta ${marker}`);

for(const marker of ['WATCHLIST PERSONAL','rm_favorite_watch_snapshot_v1','RMFavoriteWatch','rm-player-favorites-updated','Entra en nuestra propuesta de XI','Comunidad','attempts<120'])if(!watch.includes(marker))failures.push(`favorite-watch.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(watch))failures.push('favorite-watch.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(watch))failures.push('favorite-watch.js no debe usar MutationObserver');
if(!watch.includes("window.addEventListener('pagehide',commit)"))failures.push('favorite-watch.js debe congelar su snapshot al salir para comparar la siguiente visita');
if(!watch.includes('Math.abs(now-prev)>=min'))failures.push('favorite-watch.js debe aplicar umbrales y evitar ruido mínimo');
for(const marker of ['.favorite-watch','.fw-grid','.fw-alerts','.fw-player','.fw-metrics'])if(!watchCss.includes(marker))failures.push(`favorite-watch.css: falta ${marker}`);

for(const marker of ['rm_activity_center_read_v1','RMActivityCenter','Marcar todo como leído','Este centro no envía notificaciones push','Tu XI sigue pendiente','DUELO DEL DÍA','attempts<120'])if(!activity.includes(marker))failures.push(`activity-center.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(activity))failures.push('activity-center.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(activity))failures.push('activity-center.js no debe usar MutationObserver');
for(const marker of ['.activity-center','.activity-center-btn','.ac-panel','.ac-item','.ac-count'])if(!activityCss.includes(marker))failures.push(`activity-center.css: falta ${marker}`);

if(!ctx.includes('loadEngagementLoop')||!ctx.includes('engagement-loop.js?v=1')||!ctx.includes('engagement-loop.css?v=1'))failures.push('analysis-context.js no carga el bucle de retorno');
if(!ctx.includes('loadEngagementRewards')||!ctx.includes('engagement-rewards.js?v=1')||!ctx.includes('engagement-rewards.css?v=1'))failures.push('analysis-context.js no carga rachas e insignias');
if(!ctx.includes('loadQuickPicks')||!ctx.includes('quick-picks.js?v=1')||!ctx.includes('quick-picks.css?v=1'))failures.push('analysis-context.js no carga Quick Picks');
if(!ctx.includes('loadFavoriteWatch')||!ctx.includes('favorite-watch.js?v=1')||!ctx.includes('favorite-watch.css?v=1'))failures.push('analysis-context.js no carga la watchlist personal');
if(!ctx.includes('loadActivityCenter')||!ctx.includes('activity-center.js?v=1')||!ctx.includes('activity-center.css?v=1'))failures.push('analysis-context.js no carga el centro de novedades');
if(!sw.includes("'engagement-loop.js'")||!sw.includes("'engagement-loop.css'"))failures.push('PWA no incluye el bucle de retorno');
if(!sw.includes("'engagement-rewards.js'")||!sw.includes("'engagement-rewards.css'"))failures.push('PWA no incluye rachas e insignias');
if(!sw.includes("'quick-picks.js'")||!sw.includes("'quick-picks.css'"))failures.push('PWA no incluye Quick Picks');
if(!sw.includes("'favorite-watch.js'")||!sw.includes("'favorite-watch.css'"))failures.push('PWA no incluye la watchlist personal');
if(!sw.includes("'activity-center.js'")||!sw.includes("'activity-center.css'"))failures.push('PWA no incluye el centro de novedades');
if(!js.includes('Tu voto es local'))failures.push('el debate diario no explica que el voto es local');
if(!js.includes('la comunidad solo aparece si tenemos datos reales'))failures.push('el debate diario no protege la lectura de comunidad');
if(!js.includes('No reconstruimos predicciones')&&!js.includes('no reconstruimos predicciones'))failures.push('el perfil no protege la auditoría histórica');
for(const marker of ['LIGA RM','Ligas privadas','Racha 8+','createLeague','joinLeague','leaveLeague','RMCommunityLeague','attempts<100'])if(!league.includes(marker))failures.push(`community-league.js: falta ${marker}`);
if(/MutationObserver\s*\(/.test(league))failures.push('community-league.js no debe usar MutationObserver');
for(const marker of ['.cgl-shell','.cgl-table','.cgl-private-grid','.cgl-pulse'])if(!leagueCss.includes(marker))failures.push(`community-league.css: falta ${marker}`);
for(const marker of ['communityApiUrl','RMCommunityApi','participantId:getParticipantId()','github.io'])if(!community.includes(marker))failures.push(`community.js: falta ${marker}`);
if(community.includes('real-madrid-2627-panel.netlify.app/.netlify/functions'))failures.push('community.js no debe saltarse la política same-origin del backend');
for(const marker of ['loadCommunityLeague','community-league.js?v=1','community-league.css?v=1'])if(!nav.includes(marker))failures.push(`personal-nav.js: falta ${marker}`);
if(!sw.includes("'community-league.js'")||!sw.includes("'community-league.css'"))failures.push('PWA no incluye la Liga RM');
for(const marker of ['roundLeaderboard','participationStreak','streak8','createLeague','joinLeague','leaveLeague','participant-leagues/','league-members/','getDeployStore','Netlify.context'])if(!backend.includes(marker))failures.push(`community-v2.mts: falta ${marker}`);
if(/access-control-allow-origin/i.test(backend))failures.push('community-v2.mts añade CORS sin necesitarlo');
if(!backend.includes('Nunca se reconstruyen predicciones antiguas'))failures.push('backend no documenta la regla anti-backfill');
if(failures.length){console.error('Engagement audit: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log('Engagement audit: OK · marcador + duelo diario + Quick Picks + watchlist + centro de novedades + rachas + retos + insignias + clasificación + jornada + ligas privadas');