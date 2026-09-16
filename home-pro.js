(()=>{
let installed=false,timer=null;
const DUELS=[['Dumfries','Trent Alexander-Arnold','LD'],['Konaté','Rüdiger','DFC'],['Cucurella','Álvaro Carreras','LI'],['Diomande','Brahim Díaz','ED']];
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function data(){return window.RMSeasonData||null}
function list(){return safe(()=>players,[])||[]}
function canonical(name){return safe(()=>data()?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function player(name){const c=canonical(name);return list().find(p=>canonical(p.name)===c||canonical(p.short)===c)||null}
function aggregate(name){return safe(()=>data()?.aggregatePlayer?.(name),null)}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function currentRating(m){return m?safe(()=>typeof window.currentRating==='function'?window.currentRating(m):null,null):null}
function power(name){
  const c=canonical(name),official=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===c),null);
  if(Number.isFinite(official?.power))return official.power;
  const p=player(name),m=metric(p),r=currentRating(m),minutes=m?.minutes||0;
  return Number.isFinite(r)?r*(.75+.25*Math.min(minutes,450)/450):null;
}
function row(name){
  const p=player(name);if(!p)return null;const agg=aggregate(p.name),m=metric(p),r=currentRating(m),minutes=m?.minutes??agg?.totalMinutes??0;
  return {p,agg,m,r:Number.isFinite(r)?r:(Number.isFinite(agg?.rating)?agg.rating:null),minutes,power:power(p.name)};
}
function rows(){return list().map(p=>row(p.name)).filter(Boolean)}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function powerLeader(){return rows().filter(r=>Number.isFinite(r.power)).sort((a,b)=>b.power-a.power||b.minutes-a.minutes)[0]||null}
function formLeader(){return rows().map(r=>{const form=safe(()=>data()?.recentRating?.(r.p.name,3),null);return Number.isFinite(form?.value)&&r.minutes>=90?{...r,form}:null}).filter(Boolean).sort((a,b)=>b.form.value-a.form.value||b.form.n-a.form.n||b.minutes-a.minutes)[0]||null}
function strictLastPair(){const matches=data()?.matches||[];return matches.length>=2?[matches.at(-2),matches.at(-1)]:[]}
function strictRiser(){
  const [previous,current]=strictLastPair();if(!previous||!current)return {previous,current,row:null,delta:null};
  const candidates=list().map(p=>{const a=safe(()=>data()?.officialRatingEntry?.(previous.id,p.name),null),b=safe(()=>data()?.officialRatingEntry?.(current.id,p.name),null);if(!Number.isFinite(a?.value)||!Number.isFinite(b?.value))return null;return {p,from:a.value,to:b.value,delta:b.value-a.value}}).filter(Boolean).sort((a,b)=>b.delta-a.delta);
  const best=candidates[0]||null;return {previous,current,row:best&&best.delta>0?best:null,delta:best?.delta??null};
}
function sampleWatch(){return rows().filter(r=>r.minutes>0&&r.minutes<90&&Number.isFinite(r.r)).sort((a,b)=>b.r-a.r||b.power-a.power)[0]||null}
function audit(){return safe(()=>data()?.sourceAudit?.(),null)}
function closestDuel(){
  const candidates=DUELS.map(([a,b,pos])=>{const ar=row(a),br=row(b);if(!ar||!br||!Number.isFinite(ar.power)||!Number.isFinite(br.power))return null;return {a:ar,b:br,pos,gap:Math.abs(ar.power-br.power)}}).filter(Boolean).sort((a,b)=>a.gap-b.gap);
  return candidates[0]||null;
}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function seasonMatchFor(match){
  if(!match)return null;const rival=String(match.rival||'').trim().toLocaleLowerCase('es-ES');
  return (data()?.matches||[]).find(m=>String(m.label||'').trim().toLocaleLowerCase('es-ES')===rival)||null;
}
function isAnalyzed(match){
  const seasonMatch=seasonMatchFor(match),xi=safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:[],[]);
  if(!seasonMatch||xi.length!==11)return false;
  return xi.some(name=>Number.isFinite(safe(()=>data()?.officialRatingEntry?.(seasonMatch.id,name)?.value,null))||Number.isFinite(safe(()=>data()?.minutes?.(seasonMatch.id,name),null)));
}
function formatKickoff(value){
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
  return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date).replace(',',' ·').toUpperCase();
}
function formatClock(value){
  const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
  return new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date);
}
function syncLegacyMatchCopy(){
  const match=currentMatch();if(!match)return;const rival=String(match.rival||'Rival'),seasonMatch=seasonMatchFor(match),kickoff=formatKickoff(match.kickoff),deadline=formatClock(match.deadline),analyzed=isAnalyzed(match);
  const home=document.getElementById('inicio');if(home){
    const title=home.querySelector('.card.hero .match-title');if(title)title.innerHTML=`REAL MADRID <span>vs</span> ${esc(rival.toUpperCase())}`;
    const meta=home.querySelector('.card.hero .match-meta');if(meta)meta.innerHTML=[kickoff,seasonMatch?.comp].filter(Boolean).map(v=>`<span class="pill">${esc(v)}</span>`).join('');
    const focus=home.querySelector('.card.hero .focus-box h3');if(focus)focus.textContent=analyzed?`Claves del ${rival}`:`Debates abiertos para el ${rival}`;
    const note=home.querySelector('.quick-notes textarea');if(note&&/contra el Rayo/i.test(note.placeholder))note.placeholder=`Ej.: contra el ${rival} quiero anotar cambios, dudas tácticas o conclusiones del partido...`;
  }
  const pred=document.getElementById('prediccion');if(pred){
    const head=pred.querySelector('.section-head h2');if(head)head.textContent=analyzed?`XI oficial contra el ${rival}`:`Predice el XI contra el ${rival}`;
    const rules=pred.querySelector('.prediction-rules');if(rules){const strong=rules.querySelector('b');if(strong)strong.textContent=`REAL MADRID vs ${rival.toUpperCase()}`;const spans=rules.querySelectorAll('span');if(spans[0])spans[0].textContent=kickoff||'Horario pendiente';if(spans[1])spans[1].textContent=deadline?`Se cierra: ${deadline}`:'Cierre pendiente';}
    const status=pred.querySelector('#predictionStatus');if(status&&analyzed)status.textContent='Cerrada · XI oficial';
  }
  const route=analyzed?'partido':'prediccion',cta=analyzed?'Ver análisis':'Predecir XI';
  const topCta=[...document.querySelectorAll('.topbar .actions button')].find(b=>/predic|partido/i.test((b.getAttribute('onclick')||'')+' '+b.textContent));if(topCta){topCta.textContent=cta;topCta.setAttribute('onclick',`showSection('${route}')`)}
  const publicCta=document.getElementById('publicPredict');if(publicCta){publicCta.textContent=analyzed?'Ver análisis del partido':'Predecir el XI';publicCta.onclick=()=>safe(()=>showSection(route))}
  const heroCta=home?.querySelector('.next-match .actions .btn.primary');if(heroCta){heroCta.textContent=analyzed?'Ver análisis':'Haz tu predicción';heroCta.setAttribute('onclick',`showSection('${route}')`)}
}
function matchState(){
  const match=currentMatch();if(!match)return {eyebrow:'PRÓXIMO PARTIDO',title:'Calendario pendiente',copy:'El siguiente partido aparecerá aquí cuando esté registrado.',action:'Ver partidos',section:'partidos',count:''};
  const deadline=Date.parse(match.deadline),kickoff=Date.parse(match.kickoff),now=Date.now(),rival=match.rival||'próximo rival',analyzed=isAnalyzed(match);
  if(Number.isFinite(deadline)&&now<deadline)return {eyebrow:'PREDICCIÓN ABIERTA',title:`Real Madrid–${rival}`,copy:'Tu XI todavía puede guardarse o modificarse antes del cierre.',action:'Hacer mi XI',section:'prediccion',count:remaining(deadline)};
  if(Number.isFinite(kickoff)&&now<kickoff)return {eyebrow:'EN BREVE',title:`Real Madrid–${rival}`,copy:'La predicción ya está cerrada. Consulta la previa del partido.',action:'Ver previa',section:'partido',count:remaining(kickoff)};
  if(Number.isFinite(kickoff)&&now<kickoff+3*60*60*1000&&!analyzed)return {eyebrow:'PARTIDO',title:`Real Madrid–${rival}`,copy:'Centro del partido activo. No se inventan marcador ni eventos.',action:'Centro del partido',section:'partido',count:'En juego'};
  if(analyzed)return {eyebrow:'PARTIDO ANALIZADO',title:`Real Madrid–${rival}`,copy:'XI oficial, notas medias y análisis del encuentro ya disponibles.',action:'Ver análisis',section:'partido',count:'Cerrado'};
  const stage=safe(()=>window.RMPublicEngagement?.stage?.(),null);if(stage)return stage;
  return {eyebrow:'DATOS PENDIENTES',title:`Real Madrid–${rival}`,copy:'Esperando minutos y notas oficiales para incorporar el partido al análisis.',action:'Ver evolución',section:'evolucion',count:''};
}
function remaining(target){const ms=target-Date.now();if(ms<=0)return '';const min=Math.max(1,Math.floor(ms/60000)),days=Math.floor(min/1440),hours=Math.floor((min%1440)/60),mins=min%60;if(days)return `${days}d ${hours}h`;if(hours)return `${hours}h ${mins}m`;return `${mins} min`}
function go(id){safe(()=>showSection(id))}
function openPlayer(name){go('plantilla');setTimeout(()=>{if(window.RMPlayerExperience?.open)window.RMPlayerExperience.open(name);else safe(()=>openPlayerHub(name))},60)}
function openDuel(a,b){go('comparador');let tries=0;const apply=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}if(++tries<20)setTimeout(apply,80)};setTimeout(apply,0)}
function signals(){const leader=powerLeader(),form=formLeader(),rise=strictRiser(),watch=sampleWatch();return {leader,form,rise,watch}}
function coverageText(){const a=audit(),matches=data()?.matches?.length||0;if(!a)return `${matches} jornadas en la fuente canónica`;const pending=Number(a.pendingAppearances)||0;return pending===0?`${matches} jornadas · fuentes cerradas`:`${matches} jornadas · ${pending} apariciones pendientes`}
function sectionAvailable(id){return Boolean(document.getElementById(id)||safe(()=>typeof sections!=='undefined'&&sections.some(s=>s[0]===id),false))}
function communityTotal(){
  const direct=Number(window.RMCommunityData?.totalPredictions);if(Number.isFinite(direct))return direct;
  const text=document.getElementById('communityTotal')?.textContent||'',n=Number.parseInt(text,10);return Number.isFinite(n)?n:null;
}
function participationState(){
  const match=currentMatch(),state=matchState(),analyzed=isAnalyzed(match);
  if(analyzed&&sectionAvailable('mvp'))return {eyebrow:'PARTICIPA AHORA',title:'Vota al MVP',copy:'Elige a los mejores del partido y consulta cómo va la votación.',action:'Votar MVP',section:'mvp',meta:'★',tone:'warn'};
  if(state.section==='prediccion')return {eyebrow:'TU XI',title:'Haz tu predicción',copy:'Elige tus 11 titulares antes del cierre y compárate con la comunidad.',action:'Construir XI',section:'prediccion',meta:'11',tone:'green'};
  return {eyebrow:'PARTICIPACIÓN',title:'Tu jornada',copy:'Entra en la comunidad para votar, comparar y seguir tus resultados.',action:'Abrir comunidad',section:'comunidad',meta:'+',tone:'green'};
}
function quickCard({tone='',eyebrow,title,copy,meta,action,section,playerName}){
  const attr=playerName?`data-hpro-player="${esc(playerName)}"`:`data-hpro-go="${esc(section||'inicio')}"`;
  return `<button type="button" class="hpro-quick ${tone}" ${attr}><span>${esc(eyebrow)}</span><h3>${esc(title)}</h3><p>${esc(copy)}</p><b>${esc(meta)}</b><strong>${esc(action)} →</strong></button>`;
}
function dashboardHtml(s){
  const match=matchState(),participation=participationState(),leader=s.leader,total=communityTotal();
  const performance=leader?{tone:'blue',eyebrow:'RENDIMIENTO',title:display(leader.p.name),copy:`Líder Power · ${leader.minutes} min · media ${fmt(leader.r)}`,meta:fmt(leader.power),action:'Ver jugador',playerName:leader.p.name}:{tone:'blue',eyebrow:'RENDIMIENTO',title:'Power pendiente',copy:'Se mostrará el líder cuando haya muestra oficial suficiente.',meta:'—',action:'Ver datos',section:'estadisticas'};
  const community={eyebrow:'COMUNIDAD',title:total===null?'XI de la comunidad':`${total} pronóstico${total===1?'':'s'}`,copy:'Porcentajes por posición, debates y ranking de aciertos.',meta:total===null?'XI':String(total),action:'Ver comunidad',section:'comunidad'};
  return `<div class="hpro-dashboard"><button type="button" class="hpro-main" data-hpro-go="${esc(match.section||'partido')}"><div class="hpro-main-copy"><span>${esc(match.eyebrow||'JORNADA')}</span><h3>${esc(match.title||'Real Madrid')}</h3><p>${esc(match.copy||'Consulta el estado del partido y la jornada.')}</p></div><div class="hpro-main-cta">${match.count?`<b>${esc(match.count)}</b>`:''}<strong>${esc(match.action||'Abrir')} →</strong></div></button><div class="hpro-side">${quickCard(participation)}${quickCard(performance)}${quickCard(community)}</div></div>`;
}
function advancedSignalsHtml(s){
  const rise=s.rise?.row,watch=s.watch,duel=closestDuel();
  const riseName=rise?display(rise.p.name):'Sin subida comparable',riseValue=rise?`+${fmt(rise.delta)}`:'—';
  const riseCopy=rise&&s.rise.previous&&s.rise.current?`${s.rise.previous.label} ${fmt(rise.from,1)} → ${s.rise.current.label} ${fmt(rise.to,1)}`:'Solo se comparan las dos últimas jornadas con nota oficial en ambas.';
  const watchName=watch?display(watch.p.name):'Sin muestra corta',watchValue=watch?fmt(watch.r):'—',watchCopy=watch?`${watch.minutes} min · lectura provisional por muestra corta`:'No hay jugador con menos de 90 minutos y nota disponible.';
  const duelName=duel?`${display(duel.a.p.name)} ↔ ${display(duel.b.p.name)}`:'Sin duelo comparable',duelValue=duel?fmt(duel.gap):'—',duelAttr=duel?`data-hpro-duel="${esc(duel.a.p.name)}|${esc(duel.b.p.name)}"`:'';
  return `<div class="hpro-signals"><button type="button" ${rise?`data-hpro-player="${esc(rise.p.name)}"`:''}><span>MAYOR SUBIDA · ESTRICTA</span><b>${esc(riseName)}</b><strong>${esc(riseValue)}</strong><small>${esc(riseCopy)}</small></button><button type="button" ${watch?`data-hpro-player="${esc(watch.p.name)}"`:''}><span>MUESTRA A VIGILAR</span><b>${esc(watchName)}</b><strong>${esc(watchValue)}</strong><small>${esc(watchCopy)}</small></button></div><div class="hpro-decisions"><button type="button" ${duelAttr}><span>DUELO MÁS CERRADO · POWER</span><b>${esc(duelName)}</b><strong>${esc(duelValue)}</strong><small>Solo mide cercanía en Power, no decide titularidad.</small></button></div>`;
}
function ensureRoot(){
  const home=document.getElementById('inicio'),intro=document.getElementById('publicIntro');if(!home||!intro)return null;let root=document.getElementById('homePro');if(!root){root=document.createElement('section');root.id='homePro';root.className='home-pro';intro.insertAdjacentElement('afterend',root)}return root;
}
function parkSecondaryHome(s){
  const body=document.querySelector('#uxHomeMore .ux-home-more-body');if(!body)return false;
  const home=document.getElementById('inicio'),hero=home?.querySelector(':scope > .card.hero'),pulse=document.getElementById('publicPulse');
  [hero,pulse].filter(Boolean).forEach(el=>{if(el.parentElement!==body)body.appendChild(el)});
  let advanced=document.getElementById('homeProAdvanced');if(!advanced){advanced=document.createElement('section');advanced.id='homeProAdvanced';advanced.className='hpro-advanced';body.prepend(advanced)}
  advanced.innerHTML=advancedSignalsHtml(s);bind(advanced);return true;
}
function bind(root){
  root.querySelectorAll('[data-hpro-player]').forEach(btn=>btn.addEventListener('click',()=>openPlayer(btn.dataset.hproPlayer)));
  root.querySelectorAll('[data-hpro-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.hproGo)));
  root.querySelectorAll('[data-hpro-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.hproDuel.split('|');openDuel(a,b)}));
}
function render(){
  syncLegacyMatchCopy();const root=ensureRoot();if(!root||!data())return false;const s=signals();document.body.classList.add('home-pro-ready');
  root.innerHTML=`<div class="hpro-head"><div><span>JORNADA EN UN VISTAZO</span><h2>Lo importante, nada más entrar.</h2><p>Partido, participación y rendimiento sin bloques duplicados.</p></div><small>${esc(coverageText())}</small></div>${dashboardHtml(s)}`;
  bind(root);parkSecondaryHome(s);setTimeout(()=>parkSecondaryHome(s),120);return true;
}
function schedule(){clearInterval(timer);timer=setInterval(()=>{syncLegacyMatchCopy();if(document.getElementById('inicio')?.classList.contains('active'))render()},60000)}
function install(){
  syncLegacyMatchCopy();if(installed)return;if(!document.getElementById('publicIntro')||!data()||typeof showSection!=='function'){setTimeout(install,100);return}
  installed=true;render();schedule();
  ['rm-ranking-official-ready','rm-season-data-ready','rm-season-order-corrected','rm-community-updated','rm-season-extension-ready','rm-modules-ready','rm-mvp-personal-updated'].forEach(name=>document.addEventListener(name,render));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  window.RMHomePro=Object.freeze({render,signals,duel:closestDuel,match:matchState,sync:syncLegacyMatchCopy});
}
setTimeout(install,180);
})();