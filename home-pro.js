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
function formLeader(){
  return rows().map(r=>{const form=safe(()=>data()?.recentRating?.(r.p.name,3),null);return Number.isFinite(form?.value)&&r.minutes>=90?{...r,form}:null}).filter(Boolean).sort((a,b)=>b.form.value-a.form.value||b.form.n-a.form.n||b.minutes-a.minutes)[0]||null;
}
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
function matchState(){
  const stage=safe(()=>window.RMPublicEngagement?.stage?.(),null);if(stage)return stage;
  const match=safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null);if(!match)return {eyebrow:'PRÓXIMO PARTIDO',title:'Calendario pendiente',copy:'El siguiente partido aparecerá aquí cuando esté registrado.',action:'Ver partidos',section:'partidos',count:''};
  const deadline=Date.parse(match.deadline),kickoff=Date.parse(match.kickoff),now=Date.now(),rival=match.rival||'próximo rival';
  if(Number.isFinite(deadline)&&now<deadline)return {eyebrow:'PREDICCIÓN ABIERTA',title:`Real Madrid–${rival}`,copy:'Tu XI todavía puede guardarse o modificarse antes del cierre.',action:'Hacer mi XI',section:'prediccion',count:remaining(deadline)};
  if(Number.isFinite(kickoff)&&now<kickoff)return {eyebrow:'EN BREVE',title:`Real Madrid–${rival}`,copy:'La predicción ya está cerrada. Consulta la previa del partido.',action:'Ver previa',section:'partido',count:remaining(kickoff)};
  if(Number.isFinite(kickoff)&&now<kickoff+3*60*60*1000)return {eyebrow:'PARTIDO',title:`Real Madrid–${rival}`,copy:'Centro del partido activo. No se inventan marcador ni eventos.',action:'Centro del partido',section:'partido',count:'En juego'};
  return {eyebrow:'DATOS PENDIENTES',title:`Real Madrid–${rival}`,copy:'Esperando minutos y notas oficiales para incorporar el partido al análisis.',action:'Ver evolución',section:'evolucion',count:''};
}
function remaining(target){const ms=target-Date.now();if(ms<=0)return '';const min=Math.max(1,Math.floor(ms/60000)),days=Math.floor(min/1440),hours=Math.floor((min%1440)/60),mins=min%60;if(days)return `${days}d ${hours}h`;if(hours)return `${hours}h ${mins}m`;return `${mins} min`}
function go(id){safe(()=>showSection(id))}
function openPlayer(name){go('plantilla');setTimeout(()=>{if(window.RMPlayerExperience?.open)window.RMPlayerExperience.open(name);else safe(()=>openPlayerHub(name))},60)}
function openDuel(a,b){
  go('comparador');let tries=0;const apply=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}if(++tries<20)setTimeout(apply,80)};setTimeout(apply,0);
}
function signalCard(kind,label,title,value,copy,action){return `<button type="button" class="hpro-signal ${kind}" ${action?`data-hpro-${action.type}="${esc(action.value)}"`:''}><span>${esc(label)}</span><h3>${esc(title)}</h3><b>${esc(value)}</b><small>${esc(copy)}</small></button>`}
function signals(){
  const leader=powerLeader(),form=formLeader(),rise=strictRiser(),watch=sampleWatch();
  return {leader,form,rise,watch};
}
function coverageText(){const a=audit(),matches=data()?.matches?.length||0;if(!a)return `${matches} jornadas en la fuente canónica`;const pending=Number(a.pendingAppearances)||0;return pending===0?`${matches} jornadas · fuentes cerradas`:`${matches} jornadas · ${pending} apariciones pendientes`}
function signalsHtml(s){
  const leader=s.leader?signalCard('gold','LÍDER POWER',display(s.leader.p.name),fmt(s.leader.power),`${s.leader.minutes} min · media ${fmt(s.leader.r)}`,{type:'player',value:s.leader.p.name}):signalCard('neutral','LÍDER POWER','Sin datos','—','Esperando una muestra oficial.');
  const form=s.form?signalCard('blue','MEJOR FORMA · 90+ MIN',display(s.form.p.name),fmt(s.form.form.value),`${s.form.form.n} últimas notas · ${s.form.minutes} min`,{type:'player',value:s.form.p.name}):signalCard('neutral','MEJOR FORMA','Sin muestra suficiente','—','Se exige al menos 90 minutos acumulados.');
  let rise;if(s.rise.row){const r=s.rise.row;rise=signalCard('green','MAYOR SUBIDA · ESTRICTA',display(r.p.name),`+${r.delta.toFixed(2)}`,`${s.rise.previous.short||s.rise.previous.label} ${fmt(r.from)} → ${s.rise.current.short||s.rise.current.label} ${fmt(r.to)}`,{type:'evolution',value:r.p.name})}else{const pair=s.rise.previous&&s.rise.current?`${s.rise.previous.short||s.rise.previous.label} → ${s.rise.current.short||s.rise.current.label}`:'Sin par comparable';rise=signalCard('neutral','MAYOR SUBIDA · ESTRICTA','Sin subidas positivas','—',pair)}
  const watch=s.watch?signalCard('warn','MUESTRA A VIGILAR',display(s.watch.p.name),fmt(s.watch.r),`${s.watch.minutes} min · dato alto con muestra corta`,{type:'player',value:s.watch.p.name}):signalCard('neutral','MUESTRA A VIGILAR','Sin alerta','—','No hay un jugador con nota y menos de 90 minutos.');
  return leader+form+rise+watch;
}
function decisionHtml(){
  const match=matchState(),duel=closestDuel();
  return `<div class="hpro-decisions"><button type="button" class="hpro-next" data-hpro-go="${esc(match.section||'partido')}"><div><span>${esc(match.eyebrow||'PRÓXIMO PARTIDO')}</span><h3>${esc(match.title||'Próximo partido')}</h3><p>${esc(match.copy||'Consulta el estado del próximo encuentro.')}</p></div><div>${match.count?`<b>${esc(match.count)}</b>`:''}<strong>${esc(match.action||'Abrir')} →</strong></div></button>${duel?`<button type="button" class="hpro-duel" data-hpro-duel="${esc(duel.a.p.name)}|${esc(duel.b.p.name)}"><div><span>DUELO MÁS CERRADO · POWER</span><h3>${esc(display(duel.a.p.name))} <i>vs</i> ${esc(display(duel.b.p.name))}</h3><p>${esc(duel.pos)} · diferencia Power ${duel.gap.toFixed(2)}. Solo mide cercanía en Power, no decide titularidad.</p></div><strong>Comparar →</strong></button>`:`<div class="hpro-duel empty"><div><span>DUELO MÁS CERRADO</span><h3>Sin comparación disponible</h3><p>Se mostrará cuando haya Power comparable en alguno de los debates registrados.</p></div></div>`}</div>`;
}
function ensureRoot(){
  const home=document.getElementById('inicio'),intro=document.getElementById('publicIntro');if(!home||!intro)return null;let root=document.getElementById('homePro');if(!root){root=document.createElement('section');root.id='homePro';root.className='home-pro';intro.insertAdjacentElement('afterend',root)}return root;
}
function bind(root){
  root.querySelectorAll('[data-hpro-player]').forEach(btn=>btn.addEventListener('click',()=>openPlayer(btn.dataset.hproPlayer)));
  root.querySelectorAll('[data-hpro-evolution]').forEach(btn=>btn.addEventListener('click',()=>go('evolucion')));
  root.querySelectorAll('[data-hpro-go]').forEach(btn=>btn.addEventListener('click',()=>go(btn.dataset.hproGo)));
  root.querySelectorAll('[data-hpro-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.hproDuel.split('|');openDuel(a,b)}));
}
function render(){
  const root=ensureRoot();if(!root||!data())return false;const s=signals();document.body.classList.add('home-pro-ready');
  root.innerHTML=`<div class="hpro-head"><div><span>INICIO PRO · DATOS CANÓNICOS</span><h2>Qué importa ahora.</h2><p>Rendimiento, cambio de jornada, muestra y próximo partido sin crear una puntuación nueva.</p></div><small>${esc(coverageText())}</small></div><div class="hpro-signals">${signalsHtml(s)}</div>${decisionHtml()}<p class="hpro-method">Power, forma y eficiencia conservan sus fórmulas originales. “Mayor subida” compara exclusivamente las dos últimas jornadas del calendario con nota en ambas; SC y ausencia nunca son 0.</p>`;
  bind(root);return true;
}
function schedule(){clearInterval(timer);timer=setInterval(()=>{if(document.getElementById('inicio')?.classList.contains('active'))render()},60000)}
function install(){
  if(installed)return;if(!document.getElementById('publicIntro')||!data()||typeof showSection!=='function'){setTimeout(install,100);return}
  installed=true;render();schedule();
  ['rm-ranking-official-ready','rm-season-data-ready','rm-season-order-corrected','rm-community-updated'].forEach(name=>document.addEventListener(name,render));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  window.RMHomePro=Object.freeze({render,signals,duel:closestDuel,match:matchState});
}
setTimeout(install,180);
})();