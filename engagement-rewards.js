(()=>{
const VISITS_KEY='rm_engagement_visit_days_v1';
const FAVORITES_KEY='rm_player_favorites_v1';
const VOTES_KEY='rm_daily_debate_votes_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function dateKey(date=new Date()){const p=n=>String(n).padStart(2,'0');return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}`}
function parseDay(key){const m=String(key||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?new Date(Number(m[1]),Number(m[2])-1,Number(m[3])):null}
function dayDiff(a,b){return Math.round((a-b)/86400000)}
function recordVisit(){const today=dateKey(),days=read(VISITS_KEY,[]),next=[...new Set((Array.isArray(days)?days:[]).concat(today))].sort().slice(-90);write(VISITS_KEY,next);return next}
function visitDays(){const rows=read(VISITS_KEY,[]);return Array.isArray(rows)?rows.filter(Boolean).sort():[]}
function visitStreak(){const days=visitDays(),today=parseDay(dateKey());if(!days.includes(dateKey()))return 0;let streak=0,cursor=today;const set=new Set(days);while(set.has(dateKey(cursor))){streak++;cursor=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()-1)}return streak}
function bestVisitStreak(){const days=visitDays().map(parseDay).filter(Boolean).sort((a,b)=>a-b);if(!days.length)return 0;let best=1,cur=1;for(let i=1;i<days.length;i++){if(dayDiff(days[i],days[i-1])===1)cur++;else if(dayDiff(days[i],days[i-1])>1)cur=1;best=Math.max(best,cur)}return best}
function favorites(){const rows=read(FAVORITES_KEY,[]);return Array.isArray(rows)?rows.filter(Boolean):[]}
function votes(){const obj=read(VOTES_KEY,{});return obj&&typeof obj==='object'?obj:{}}
function voteDays(){return [...new Set(Object.values(votes()).map(v=>v?.votedAt?dateKey(new Date(v.votedAt)):null).filter(Boolean))]}
function profile(){return safe(()=>window.RMEngagementLoop?.profile?.(),{all:[],scored:[],best:null,streak8:0,wins:0})||{all:[],scored:[],best:null,streak8:0,wins:0}}
function currentMatchId(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch?.id:null,null)}
function hasCurrentPrediction(p){const id=currentMatchId();return Boolean(id&&p.all?.some?.(r=>r.matchId===id&&r.xi))}
function currentDebate(){return safe(()=>window.RMEngagementLoop?.debate?.(),null)}
function hasTodayVote(){return Object.keys(votes()).some(key=>key.includes(`:${dateKey()}:`))}
function badgeState(){
  const p=profile(),best=Number.isFinite(p.best)?p.best:null,fav=favorites().length,voteCount=voteDays().length,streak=visitStreak();
  return [
    {id:'first-xi',icon:'XI',title:'Primer XI',desc:'Guarda tu primera predicción.',unlocked:(p.all?.length||0)>=1},
    {id:'first-vote',icon:'VS',title:'Toma partido',desc:'Vota en un duelo del día.',unlocked:voteCount>=1},
    {id:'favorites-3',icon:'★',title:'Ojo clínico',desc:'Sigue al menos 3 jugadores.',unlocked:fav>=3,progress:Math.min(fav,3),goal:3},
    {id:'visit-3',icon:'↻',title:'Tres días',desc:'Vuelve 3 días consecutivos.',unlocked:streak>=3,progress:Math.min(streak,3),goal:3},
    {id:'eight',icon:'8',title:'Ocho aciertos',desc:'Consigue 8/11 o más.',unlocked:best!==null&&best>=8},
    {id:'nine',icon:'9',title:'Muy fino',desc:'Consigue 9/11 o más.',unlocked:best!==null&&best>=9},
    {id:'ten',icon:'10',title:'Casi perfecto',desc:'Consigue 10/11.',unlocked:best!==null&&best>=10},
    {id:'perfect',icon:'11',title:'Pleno',desc:'Clava los 11 titulares.',unlocked:best===11},
    {id:'project',icon:'↑',title:'Supera al Proyecto',desc:'Gana al XI del Proyecto en una jornada auditada.',unlocked:(p.wins||0)>=1}
  ];
}
function missions(){
  const p=profile(),debate=currentDebate(),items=[{id:'visit',title:'Entrar hoy',copy:'Mantén viva tu racha de visitas.',done:true,action:'inicio'}];
  items.push(debate?{id:'debate',title:'Duelo del día',copy:'Elige una de las dos opciones.',done:hasTodayVote(),action:'inicio'}:{id:'debate',title:'Duelo del día',copy:'Hoy no hay un debate abierto.',done:true,exempt:true,action:'inicio'});
  items.push({id:'prediction',title:'Tu XI',copy:'Guarda o revisa tu predicción del próximo partido.',done:hasCurrentPrediction(p),action:'prediccion'});
  return items;
}
function state(){const badges=badgeState(),unlocked=badges.filter(b=>b.unlocked).length,missionsNow=missions(),done=missionsNow.filter(m=>m.done).length;return {badges,unlocked,total:badges.length,missions:missionsNow,missionDone:done,missionTotal:missionsNow.length,visitStreak:visitStreak(),bestVisitStreak:bestVisitStreak(),voteDays:voteDays().length,favorites:favorites().length,profile:profile()}}
function ensureHome(){const anchor=document.getElementById('engagementLoop');if(!anchor)return null;let root=document.getElementById('engagementRewardsHome');if(root)return root;root=document.createElement('section');root.id='engagementRewardsHome';root.className='er-home';anchor.insertAdjacentElement('afterend',root);return root}
function ensureSeason(){const anchor=document.getElementById('engagementSeason')||document.getElementById('personalHubContent');if(!anchor)return null;let root=document.getElementById('engagementRewardsSeason');if(root)return root;root=document.createElement('section');root.id='engagementRewardsSeason';root.className='card er-season';if(anchor.id==='engagementSeason')anchor.insertAdjacentElement('afterend',root);else anchor.appendChild(root);return root}
function homeHtml(s){return `<button type="button" class="er-home-card" data-er-open><div><span>RACHA Y RETOS</span><b>${s.visitStreak} día${s.visitStreak===1?'':'s'} seguido${s.visitStreak===1?'':'s'}</b><small>${s.missionDone}/${s.missionTotal} retos de hoy · ${s.unlocked}/${s.total} insignias</small></div><strong>${s.unlocked===s.total?'Colección completa':'Seguir progreso'} →</strong></button>`}
function badgeHtml(b){return `<article class="${b.unlocked?'unlocked':'locked'}"><div class="er-badge-icon">${esc(b.icon)}</div><div><b>${esc(b.title)}</b><small>${esc(b.desc)}</small>${!b.unlocked&&Number.isFinite(b.progress)&&Number.isFinite(b.goal)?`<span>${b.progress}/${b.goal}</span>`:''}</div><em>${b.unlocked?'✓':'○'}</em></article>`}
function missionHtml(m){return `<button type="button" class="${m.done?'done':''} ${m.exempt?'exempt':''}" data-er-go="${esc(m.action)}"><em>${m.done?'✓':'○'}</em><span><b>${esc(m.title)}</b><small>${esc(m.copy)}</small></span><strong>${m.done?(m.exempt?'Sin acción':'Hecho'):'Ir'}</strong></button>`}
function seasonHtml(s){const p=s.profile,best=Number.isFinite(p.best)?`${p.best}/11`:'—';return `<div class="er-head"><div><span>RACHAS E INSIGNIAS</span><h3>Motivos para volver y seguir afinando</h3><p>Este progreso es local y lúdico. No cambia tus estadísticas ni la clasificación real de predicciones.</p></div><div class="er-head-score"><b>${s.unlocked}/${s.total}</b><small>insignias</small></div></div><div class="er-streaks"><div><span>Racha de visitas</span><b>${s.visitStreak}</b><small>mejor: ${s.bestVisitStreak}</small></div><div><span>Días con duelo votado</span><b>${s.voteDays}</b><small>en este dispositivo</small></div><div><span>Mejor predicción</span><b>${best}</b><small>${p.scored?.length||0} jornadas puntuadas</small></div><div><span>Jugadores seguidos</span><b>${s.favorites}</b><small>favoritos</small></div></div><div class="er-section-title"><span>RETOS DE HOY</span><b>${s.missionDone}/${s.missionTotal}</b></div><div class="er-missions">${s.missions.map(missionHtml).join('')}</div><div class="er-section-title"><span>INSIGNIAS</span><b>${s.unlocked} desbloqueadas</b></div><div class="er-badges">${s.badges.map(badgeHtml).join('')}</div><div class="er-footer"><p>Las insignias solo usan acciones o resultados que existen realmente en este dispositivo; no crean puntos ficticios ni modifican la Liga RM.</p><button type="button" data-er-share>Compartir mi progreso</button></div>`}
async function shareProgress(){const s=state(),best=Number.isFinite(s.profile.best)?`${s.profile.best}/11`:'sin resultado todavía',text=`RM 26/27 · ${s.unlocked}/${s.total} insignias · racha de ${s.visitStreak} día${s.visitStreak===1?'':'s'} · mejor predicción ${best}`;let url='';try{url=`${location.origin}${location.pathname}`.replace(/index\.html$/,'')}catch{}try{if(navigator.share){await navigator.share({title:'Mi progreso · RM 26/27',text,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(`${text}\n${url}`);safe(()=>toast('Progreso copiado para compartir'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el progreso'))}
function bind(root){root?.querySelector('[data-er-open]')?.addEventListener('click',()=>safe(()=>showSection('mi-temporada')));root?.querySelectorAll('[data-er-go]').forEach(b=>b.addEventListener('click',()=>safe(()=>showSection(b.dataset.erGo))));root?.querySelector('[data-er-share]')?.addEventListener('click',shareProgress)}
function render(){const s=state(),home=ensureHome();if(home){home.innerHTML=homeHtml(s);bind(home)}const active=document.getElementById('mi-temporada')?.classList.contains('active');if(active){const season=ensureSeason();if(season){season.innerHTML=seasonHtml(s);bind(season)}}document.dispatchEvent(new CustomEvent('rm-engagement-rewards-updated',{detail:{visitStreak:s.visitStreak,unlocked:s.unlocked,total:s.total,missionDone:s.missionDone}}));return s}
function install(){if(installed)return;if(!window.RMEngagementLoop||!document.getElementById('inicio')){if(++attempts<100)setTimeout(install,100);return}installed=true;recordVisit();render();document.addEventListener('click',e=>{if(e.target?.closest?.('[data-section="mi-temporada"], [onclick*="mi-temporada"]'))setTimeout(render,180)},true);['rm-daily-debate-voted','rm-local-prediction-updated','rm-player-favorites-updated','rm-scenario-audit-updated','rm-community-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,60)));window.addEventListener('storage',()=>setTimeout(render,50));document.addEventListener('visibilitychange',()=>{if(!document.hidden){recordVisit();setTimeout(render,40)}});window.RMEngagementRewards=Object.freeze({render,state,badges:badgeState,missions,recordVisit})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});install();
})();
