(()=>{
const FAVORITES_KEY='rm_player_favorites_v1';
const SNAPSHOT_KEY='rm_favorite_watch_snapshot_v1';
let installed=false,attempts=0,baseline=read(SNAPSHOT_KEY,{}),latestSnapshot={};

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function season(){return window.RMSeasonData||null}
function list(){return safe(()=>players,[])||[]}
function canonical(name){return safe(()=>season()?.canonical?.(name),name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function player(name){const key=canonical(name);return list().find(p=>canonical(p.name)===key||canonical(p.short)===key)||null}
function favorites(){const raw=read(FAVORITES_KEY,[]);return Array.isArray(raw)?raw.map(name=>player(name)?.name).filter(Boolean):[]}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function aggregate(name){return safe(()=>season()?.aggregatePlayer?.(name),null)}
function recent(name){return safe(()=>season()?.recentRating?.(name,3),null)}
function series(name){return safe(()=>season()?.ratingSeries?.(name),[])||[]}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function currentRating(m){return m?safe(()=>typeof window.currentRating==='function'?window.currentRating(m):null,null):null}
function power(name){
  const key=canonical(name),migrated=safe(()=>window.RMPowerMigration?.official?.find(row=>canonical(row.name)===key),null);
  if(Number.isFinite(migrated?.power))return migrated.power;
  const p=player(name),m=metric(p),r=currentRating(m),agg=aggregate(name),rating=Number.isFinite(r)?r:agg?.rating,minutes=m?.minutes??agg?.totalMinutes??0;
  return Number.isFinite(rating)?rating*(.75+.25*Math.min(minutes,450)/450):null;
}
function lastDelta(name){
  const rows=series(name).map(row=>({label:row.match?.short||row.match?.label||'',value:row.entry?.value})).filter(row=>Number.isFinite(row.value));
  if(rows.length<2)return {delta:null,from:null,to:rows.at(-1)?.value??null,label:rows.at(-1)?.label||''};
  const a=rows.at(-2),b=rows.at(-1);return {delta:b.value-a.value,from:a.value,to:b.value,label:b.label};
}
function rankPower(name){
  const rows=list().map(p=>({name:p.name,value:power(p.name)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);
  const index=rows.findIndex(row=>same(row.name,name));return index>=0?{rank:index+1,total:rows.length}:null;
}
function intelligence(name){
  const ctx=safe(()=>window.RMPlayerIntelligence?.context?.(name),null);
  if(ctx)return ctx;
  const board=safe(()=>window.RMDecisionBoard?.state?.(),null),project=(board?.rows||[]).find(r=>same(r.project,name))||null,alternative=(board?.rows||[]).find(r=>same(r.primary?.name,name)||(r.alternatives||[]).some(a=>same(a.name,name)))||null;
  return {kind:project?'project':alternative?'alternative':'outside',projectRow:project,alternativeRow:alternative,mine:[],community:{available:false},opponent:project?.primary?.name||alternative?.project||null};
}
function projectState(ctx){
  if(ctx?.kind==='project'){
    const level=ctx.projectRow?.decisionLevel||'consensus';
    return {kind:'project',label:level==='strong'?'DEBATE FUERTE':level==='open'?'EN DEBATE':'EN PROYECTO',tone:level==='strong'?'danger':level==='open'?'warn':'good'};
  }
  if(ctx?.kind==='alternative')return {kind:'alternative',label:'ALTERNATIVA',tone:'blue'};
  return {kind:'outside',label:'FUERA DEL XI',tone:'muted'};
}
function userInXi(name,ctx){if(Array.isArray(ctx?.mine)&&ctx.mine.length)return true;const xi=safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{},{});return Object.values(xi||{}).some(n=>same(n,name))}
function communityPct(ctx){
  const c=ctx?.community;if(!c?.available)return null;
  if(Number.isFinite(c.globalPercentage))return c.globalPercentage;
  if(Number.isFinite(c.percentage))return c.percentage;
  return null;
}
function row(name){
  const p=player(name);if(!p)return null;const ctx=intelligence(p.name),state=projectState(ctx),form=recent(p.name),delta=lastDelta(p.name),pow=power(p.name),rank=rankPower(p.name),community=communityPct(ctx);
  return {name:p.name,short:p.short||p.name,pos:p.pos,power:pow,powerRank:rank?.rank??null,powerTotal:rank?.total??null,form:Number.isFinite(form?.value)?form.value:null,formN:form?.n||0,lastDelta:delta.delta,lastRating:delta.to,lastLabel:delta.label,projectKind:state.kind,projectLabel:state.label,projectTone:state.tone,decisionLevel:ctx?.projectRow?.decisionLevel||ctx?.alternativeRow?.decisionLevel||null,opponent:ctx?.opponent||null,userIn:userInXi(p.name,ctx),community,communityFinal:Boolean(ctx?.community?.final)};
}
function snapshotRow(r){return {power:r.power,form:r.form,projectKind:r.projectKind,decisionLevel:r.decisionLevel,community:r.community,userIn:r.userIn}}
function currentRows(){return favorites().map(row).filter(Boolean)}
function buildSnapshot(rows=currentRows()){return Object.fromEntries(rows.map(r=>[canonical(r.name),snapshotRow(r)]))}
function deltaNumber(now,prev,min=.05){return Number.isFinite(now)&&Number.isFinite(prev)&&Math.abs(now-prev)>=min?now-prev:null}
function changes(r){
  const prev=baseline?.[canonical(r.name)];if(!prev)return [];
  const out=[];
  if(prev.projectKind!==r.projectKind){
    if(r.projectKind==='project')out.push({priority:5,text:'Entra en nuestra propuesta de XI'});
    else if(prev.projectKind==='project'&&r.projectKind==='alternative')out.push({priority:5,text:'Pasa de titular previsto a alternativa'});
    else if(prev.projectKind==='project'&&r.projectKind==='outside')out.push({priority:5,text:'Sale de nuestra propuesta principal'});
    else if(r.projectKind==='alternative')out.push({priority:4,text:'Entra en el debate como alternativa'});
  }
  if(prev.decisionLevel!==r.decisionLevel&&r.decisionLevel==='strong')out.push({priority:5,text:'Su puesto pasa a Debate fuerte'});
  const pd=deltaNumber(r.power,prev.power,.05);if(pd!==null)out.push({priority:3,text:`Power ${pd>0?'+':''}${pd.toFixed(2)}`});
  const fd=deltaNumber(r.form,prev.form,.05);if(fd!==null)out.push({priority:2,text:`Forma ${fd>0?'+':''}${fd.toFixed(2)}`});
  const cd=deltaNumber(r.community,prev.community,3);if(cd!==null)out.push({priority:2,text:`Comunidad ${cd>0?'+':''}${Math.round(cd)} pp`});
  if(prev.userIn!==r.userIn)out.push({priority:1,text:r.userIn?'Ahora está en tu XI':'Ya no está en tu borrador'});
  return out.sort((a,b)=>b.priority-a.priority);
}
function allChanges(rows){return rows.flatMap(r=>changes(r).map(c=>({...c,name:r.name}))).sort((a,b)=>b.priority-a.priority||display(a.name).localeCompare(display(b.name),'es'))}
function suggested(){
  const favSet=new Set(favorites().map(canonical)),projectRows=safe(()=>window.RMDecisionBoard?.state?.().rows,[])||[];
  const pool=[];
  for(const r of projectRows){for(const name of [r.project,r.primary?.name]){if(name&&!favSet.has(canonical(name))&&!pool.some(x=>same(x,name)))pool.push(name)}}
  const powerRows=list().map(p=>({name:p.name,power:power(p.name)})).filter(x=>Number.isFinite(x.power)&&!favSet.has(canonical(x.name))).sort((a,b)=>b.power-a.power);
  for(const r of powerRows){if(!pool.some(x=>same(x,r.name)))pool.push(r.name)}
  return pool.slice(0,3);
}
function toggle(name){
  if(window.RMPlayerExperience?.toggle)return window.RMPlayerExperience.toggle(name);
  const p=player(name);if(!p)return false;const raw=read(FAVORITES_KEY,[]),list=Array.isArray(raw)?raw:[],active=list.some(x=>same(x,p.name)),next=active?list.filter(x=>!same(x,p.name)):[p.name,...list];write(FAVORITES_KEY,next);document.dispatchEvent(new CustomEvent('rm-player-favorites-updated',{detail:{favorites:next}}));return !active;
}
function openPlayer(name){
  safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}if(typeof openPlayerHub==='function'){openPlayerHub(name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,60);
}
function openDuel(a,b){
  if(!a||!b)return;safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;A.dispatchEvent(new Event('change',{bubbles:true}));B.dispatchEvent(new Event('change',{bubbles:true}));return}if(++n<24)setTimeout(go,90)};setTimeout(go,80);
}
function ensureRoot(){
  const parent=document.getElementById('personalizedHome');if(!parent)return null;let root=document.getElementById('favoriteWatch');if(root)return root;
  root=document.createElement('section');root.id='favoriteWatch';root.className='favorite-watch';
  const engagement=document.getElementById('engagementLoop');if(engagement)engagement.insertAdjacentElement('afterend',root);else parent.appendChild(root);return root;
}
function trendHtml(r){
  const d=r.lastDelta,cls=d>0?'up':d<0?'down':'',text=Number.isFinite(d)?`${d>0?'+':''}${d.toFixed(2)}`:'—';
  return `<div><span>Última variación</span><b class="${cls}">${esc(text)}</b><small>${esc(r.lastLabel||'sin par comparable')}</small></div>`;
}
function rowHtml(r){
  const novelty=changes(r)[0]||null,community=Number.isFinite(r.community)?`${Math.round(r.community)}%${r.communityFinal?' final':' prov.'}`:'—',opp=r.opponent&&!same(r.opponent,r.name)?r.opponent:null;
  return `<article class="fw-player ${esc(r.projectTone)}"><div class="fw-player-head"><button type="button" data-fw-player="${esc(r.name)}"><span>${esc(r.pos)}</span><b>${esc(display(r.name))}</b></button><div class="fw-badges"><em class="${esc(r.projectTone)}">${esc(r.projectLabel)}</em>${r.userIn?'<em class="mine">EN TU XI</em>':''}</div></div><div class="fw-metrics"><div><span>Power</span><b>${fmt(r.power)}</b><small>${r.powerRank?`#${r.powerRank}/${r.powerTotal}`:'sin ranking'}</small></div><div><span>Forma</span><b>${fmt(r.form)}</b><small>${r.formN?`${r.formN} últimas notas`:'sin muestra'}</small></div>${trendHtml(r)}<div><span>Comunidad</span><b>${esc(community)}</b><small>${r.communityFinal?'cerrada':'si hay datos reales'}</small></div></div>${novelty?`<div class="fw-change"><span>NOVEDAD</span><b>${esc(novelty.text)}</b></div>`:''}<div class="fw-actions"><button type="button" data-fw-player="${esc(r.name)}">Abrir ficha</button>${opp?`<button type="button" data-fw-duel="${esc(r.name)}|${esc(opp)}">vs ${esc(display(opp))}</button>`:''}<button type="button" class="remove" data-fw-toggle="${esc(r.name)}">Dejar de seguir</button></div></article>`;
}
function emptyHtml(){
  const picks=suggested();
  return `<div class="fw-empty"><div><span>TUS JUGADORES</span><h3>Crea tu watchlist</h3><p>Sigue a tus jugadores y al volver verás si suben en Power, entran en un debate del XI o cambia el apoyo de la comunidad.</p></div>${picks.length?`<div class="fw-suggestions">${picks.map(name=>`<button type="button" data-fw-toggle="${esc(name)}"><span>☆</span><b>Seguir a ${esc(display(name))}</b></button>`).join('')}</div>`:''}<button type="button" class="btn" data-fw-go="plantilla">Elegir en Plantilla</button></div>`;
}
function render(){
  const root=ensureRoot();if(!root)return false;const rows=currentRows();latestSnapshot=buildSnapshot(rows);
  if(!rows.length){root.innerHTML=emptyHtml();bind(root);document.body.classList.add('favorite-watch-ready');return true}
  const alerts=allChanges(rows),headline=alerts.length?`${alerts.length} novedad${alerts.length===1?'':'es'} desde tu última visita`:`${rows.length} jugador${rows.length===1?'':'es'} bajo seguimiento`;
  root.innerHTML=`<div class="fw-head"><div><span>WATCHLIST PERSONAL</span><h2>Tus jugadores, en contexto.</h2><p>Power, forma y papel en el próximo XI. Los avisos comparan con la última sesión guardada en este dispositivo.</p></div><div class="fw-head-stat"><b>${alerts.length||rows.length}</b><small>${alerts.length?'novedades':'favoritos'}</small></div></div>${alerts.length?`<div class="fw-alerts">${alerts.slice(0,3).map(a=>`<button type="button" data-fw-player="${esc(a.name)}"><span>${esc(display(a.name))}</span><b>${esc(a.text)}</b></button>`).join('')}</div>`:''}<div class="fw-grid">${rows.map(rowHtml).join('')}</div><div class="fw-foot"><span>${esc(headline)}</span><button type="button" data-fw-go="plantilla">Gestionar favoritos →</button></div>`;
  bind(root);document.body.classList.add('favorite-watch-ready');document.dispatchEvent(new CustomEvent('rm-favorite-watch-rendered',{detail:{favorites:rows.length,alerts:alerts.length}}));return true;
}
function bind(root){
  root.querySelectorAll('[data-fw-player]').forEach(btn=>btn.addEventListener('click',()=>openPlayer(btn.dataset.fwPlayer)));
  root.querySelectorAll('[data-fw-duel]').forEach(btn=>btn.addEventListener('click',()=>{const [a,b]=btn.dataset.fwDuel.split('|');openDuel(a,b)}));
  root.querySelectorAll('[data-fw-toggle]').forEach(btn=>btn.addEventListener('click',()=>{toggle(btn.dataset.fwToggle);setTimeout(render,40)}));
  root.querySelectorAll('[data-fw-go]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>showSection(btn.dataset.fwGo))));
}
function commit(){if(Object.keys(latestSnapshot).length||favorites().length===0)write(SNAPSHOT_KEY,latestSnapshot)}
function install(){
  if(installed)return;if(!season()||!document.getElementById('personalizedHome')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;render();
  ['rm-player-favorites-updated','rm-decision-board-rendered','rm-xi-stability-rendered','rm-community-updated','rm-season-data-ready','rm-ranking-official-ready','rm-local-prediction-updated','rm-player-intelligence-rendered'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,70)));
  window.addEventListener('pagehide',commit);document.addEventListener('visibilitychange',()=>{if(document.hidden)commit();else setTimeout(render,50)});
  window.RMFavoriteWatch=Object.freeze({render,rows:currentRows,changes:allChanges,snapshot:()=>({...latestSnapshot}),commit});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,260);
})();