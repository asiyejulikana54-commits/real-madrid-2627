const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.join(__dirname,'..');
const failures=[];
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of ['engagement-loop.js','engagement-rewards.js','community-league.js','community.js','personal-nav.js','analysis-context.js','sw.js']){
  try{new vm.Script(read(file),{filename:file})}catch(error){failures.push(`${file} no compila: ${error.message}`)}
}
const js=read('engagement-loop.js'),css=read('engagement-loop.css'),rewards=read('engagement-rewards.js'),rewardsCss=read('engagement-rewards.css'),ctx=read('analysis-context.js'),sw=read('sw.js');
const league=read('community-league.js'),leagueCss=read('community-league.css'),community=read('community.js'),nav=read('personal-nav.js'),backend=read('netlify/functions/community-v2.mts');
for(const marker of ['TU MARCADOR','DUELO DEL DÍA','HOY EN RM 26/27','PERFIL DE PREDICCIÓN','rm_daily_debate_votes_v1','RMScenarioAudit','RMDecisionBoard','attempts<100'])if(!js.includes(marker))failures.push(`engagement-loop.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(js))failures.push('engagement-loop.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(js))failures.push('engagement-loop.js no debe usar MutationObserver');
for(const marker of ['.egl-grid','.egl-vote-pair','.egs-grid'])if(!css.includes(marker))failures.push(`engagement-loop.css: falta ${marker}`);
for(const marker of ['RACHAS E INSIGNIAS','RETOS DE HOY','rm_engagement_visit_days_v1','Compartir mi progreso','RMEngagementRewards','attempts<100'])if(!rewards.includes(marker))failures.push(`engagement-rewards.js: falta ${marker}`);
if(/\bfetch\s*\(/.test(rewards))failures.push('engagement-rewards.js no debe hacer llamadas de red propias');
if(/MutationObserver\s*\(/.test(rewards))failures.push('engagement-rewards.js no debe usar MutationObserver');
for(const marker of ['.er-home-card','.er-missions','.er-badges','.er-streaks'])if(!rewardsCss.includes(marker))failures.push(`engagement-rewards.css: falta ${marker}`);
if(!rewards.includes('no crean puntos ficticios')||!rewards.includes('no cambia tus estadísticas'))failures.push('las recompensas deben separar gamificación de estadísticas reales');
if(!ctx.includes('loadEngagementLoop')||!ctx.includes('engagement-loop.js?v=1')||!ctx.includes('engagement-loop.css?v=1'))failures.push('analysis-context.js no carga el bucle de retorno');
if(!ctx.includes('loadEngagementRewards')||!ctx.includes('engagement-rewards.js?v=1')||!ctx.includes('engagement-rewards.css?v=1'))failures.push('analysis-context.js no carga rachas e insignias');
if(!sw.includes("'engagement-loop.js'")||!sw.includes("'engagement-loop.css'"))failures.push('PWA no incluye el bucle de retorno');
if(!sw.includes("'engagement-rewards.js'")||!sw.includes("'engagement-rewards.css'"))failures.push('PWA no incluye rachas e insignias');
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
console.log('Engagement audit: OK · marcador + duelo diario + rachas + retos + insignias + clasificación + jornada + ligas privadas');
