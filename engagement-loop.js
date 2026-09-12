(()=>{
const HISTORY_KEY='rm_prediction_history_v1';
const VOTES_KEY='rm_daily_debate_votes_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function dayKey(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
function labelFromId(id){const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ');return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`}
function records(){
  const ledger={...read(HISTORY_KEY,{})};
  try{for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(!key?.startsWith('rm_prediction_')||key===HISTORY_KEY)continue;
    const row=read(key,null);if(!row?.xi)continue;const id=row.matchId||key.slice('rm_prediction_'.length),prior=ledger[id]||{};
    ledger[id]={...prior,...row,matchId:id,label:prior.label||row.label||labelFromId(id)};
  }}catch{}
  return Object.values(ledger).filter(r=>r?.matchId).sort((a,b)=>String(b.scoredAt||b.savedAt||'').localeCompare(String(a.scoredAt||a.savedAt||'')));
}
function profile(){
  const all=records(),scored=all.filter(r=>Number.isFinite(r.score)),avg=scored.length?scored.reduce((n,r)=>n+r.score,0)/scored.length:null,best=scored.length?Math.max(...scored.map(r=>r.score)):null;
  let streak8=0;for(const r of scored){if(r.score>=8)streak8++;else break}
  const scenario=safe(()=>window.RMScenarioAudit?.aggregate?.(),null),scenarioRows=scenario?.rows||[],mine=scenarioRows.find(r=>r.id==='user')||null,scenarioRank=mine?scenarioRows.findIndex(r=>r.id==='user')+1:null;
  const audited=safe(()=>window.RMScenarioAudit?.records?.(),[])||[];let wins=0,ties=0,losses=0;
  for(const r of audited){const u=r.scores?.user,p=r.scores?.project;if(!Number.isFinite(u)||!Number.isFinite(p))continue;if(u>p)wins++;else if(u===p)ties++;else losses++}
  let level='Debutante';if(scored.length>=1)level='Analista';if(scored.length>=3)level=avg>=9?'Capitán':avg>=7.5?'Titular':'En progresión';if(scored.length>=8&&avg>=9)level='Leyenda del XI';
  return {all,scored,avg,best,streak8,level,wins,ties,losses,duels:wins+ties+losses,scenarioRank,scenarioN:scenarioRows.length,scenarioAvg:mine?.avg??null};
}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function debateRows(){return (board()?.rows||[]).filter(r=>r?.project&&r?.primary?.name&&!same(r.project,r.primary.name)&&r.decisionLevel!=='consensus')}
function dateIndex(max){if(max<=1)return 0;const d=new Date(),start=new Date(d.getFullYear(),0,0),day=Math.floor((d-start)/86400000);return day%max}
function debate(){const rows=debateRows(),pool=rows.slice(0,Math.min(3,rows.length));return pool[dateIndex(pool.length)]||null}
function voteKey(row){return `${match()?.id||'sin-partido'}:${dayKey()}:${row?.slot?.key||'slot'}`}
function votes(){const v=read(VOTES_KEY,{});return v&&typeof v==='object'?v:{}}
function currentVote(row){return row?votes()[voteKey(row)]||null:null}
function vote(row,name){if(!row||(!same(name,row.project)&&!same(name,row.primary?.name)))return false;const db=votes();db[voteKey(row)]={choice:name,votedAt:new Date().toISOString(),matchId:match()?.id||null,slot:row.slot?.key||null};write(VOTES_KEY,db);document.dispatchEvent(new CustomEvent('rm-daily-debate-voted',{detail:{slot:row.slot?.key,choice:name}}));render();return true}
function communityShare(slot,name){
  const data=window.RMCommunityData,rows=data?.slotShares?.[slot];if(!Array.isArray(rows)||!name)return null;const row=rows.find(x=>same(x?.name,name));return Number.isFinite(row?.percentage)?row.percentage:null;
}
function sourceText(row,name){
  if(!row||!name)return '';
  if(same(name,row.project))return `${row.projectAligned}/${row.availableVoices} señales alineadas con Proyecto`;
  const src=row.primary?.sources||[];return src.length?`Alternativa apoyada por ${src.map(x=>x==='user'?'tu XI':x==='community'?'comunidad':'datos').join(' + ')}`:'Alternativa abierta';
}
function openDuel(a,b){
  safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;A.dispatchEvent(new Event('change',{bubbles:true}));B.dispatchEvent(new Event('change',{bubbles:true}));return}if(++n<24)setTimeout(go,90)};setTimeout(go,80)
}
function predictionStatus(){const m=match(),rows=records(),current=m?rows.find(r=>r.matchId===m.id):null,closed=safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false);if(!m)return {label:'Sin próximo partido',tone:'neutral'};if(current&&!closed)return {label:'XI guardado · aún editable',tone:'ready'};if(!current&&!closed)return {label:'Tu XI todavía no está guardado',tone:'warn'};if(current&&closed)return {label:'Predicción cerrada · esperando resultado',tone:'closed'};return {label:'Predicción cerrada',tone:'closed'}}
function profileHtml(p){
  const score=p.avg===null?'—':p.avg.toFixed(1),best=p.best===null?'—':`${p.best}/11`,duel=p.duels?`${p.wins}-${p.ties}-${p.losses}`:'—';
  return `<article class="egl-card profile"><div class="egl-card-head"><div><span>TU MARCADOR</span><h3>${esc(p.level)}</h3></div><strong>${score}<small>media /11</small></strong></div><div class="egl-profile-kpis"><div><b>${best}</b><span>récord</span></div><div><b>${p.streak8}</b><span>racha 8+</span></div><div><b>${duel}</b><span>vs Proyecto</span></div></div><p>${p.scored.length?`${p.scored.length} jornada${p.scored.length===1?'':'s'} puntuada${p.scored.length===1?'':'s'} · ${p.scored.reduce((n,r)=>n+r.score,0)} aciertos acumulados.`:'Guarda tu primer XI y empezaremos a construir tu historial.'}</p>${p.scenarioRank?`<div class="egl-scenario-rank"><b>#${p.scenarioRank}/${p.scenarioN}</b><span>en tu liga local de escenarios${Number.isFinite(p.scenarioAvg)?` · ${p.scenarioAvg.toFixed(2)}/11`:''}</span></div>`:''}<button type="button" class="btn" data-egl-go="mi-temporada">Ver mi temporada</button></article>`;
}
function debateHtml(row){
  if(!row)return `<article class="egl-card debate empty"><span>DUELO DEL DÍA</span><h3>No hay un debate fuerte abierto ahora mismo</h3><p>Cuando Proyecto, tu XI, la comunidad o los datos discrepen, aparecerá aquí un duelo de un toque.</p><button type="button" class="btn" data-egl-go="prediccion">Ver nuestra predicción</button></article>`;
  const a=row.project,b=row.primary.name,v=currentVote(row),aShare=communityShare(row.slot?.key,a),bShare=communityShare(row.slot?.key,b),hasCommunity=Number.isFinite(aShare)||Number.isFinite(bShare);
  const pct=name=>{const val=communityShare(row.slot?.key,name);return Number.isFinite(val)?`${val}%`:'—'};
  return `<article class="egl-card debate"><div class="egl-card-head"><div><span>DUELO DEL DÍA · ${esc(row.slot?.label||row.slot?.key||'XI')}</span><h3>${esc(display(a))} o ${esc(display(b))}?</h3></div><em class="${row.decisionLevel}">${esc(row.decisionLabel)}</em></div><p>Un toque y listo. Tu voto es local; la comunidad solo aparece si tenemos datos reales del partido.</p><div class="egl-vote-pair"><button type="button" class="${v&&same(v.choice,a)?'selected':''}" data-egl-vote="${esc(a)}"><b>${esc(display(a))}</b><small>${esc(sourceText(row,a))}</small>${hasCommunity?`<strong>${pct(a)}<i>comunidad</i></strong>`:''}</button><button type="button" class="${v&&same(v.choice,b)?'selected':''}" data-egl-vote="${esc(b)}"><b>${esc(display(b))}</b><small>${esc(sourceText(row,b))}</small>${hasCommunity?`<strong>${pct(b)}<i>comunidad</i></strong>`:''}</button></div>${v?`<div class="egl-voted">✓ Hoy elegiste <b>${esc(display(v.choice))}</b>. Puedes cambiar tu voto mientras siga abierto.</div>`:'<div class="egl-voted pending">Elige tu opción para dejar marcada tu postura de hoy.</div>'}<button type="button" class="egl-link" data-egl-duel="${esc(a)}|${esc(b)}">Abrir Comparador PRO →</button></article>`;
}
function changesHtml(){
  const items=safe(()=>window.RMPersonalHome?.changes?.(),[])||[],list=items.length?items:['El seguimiento se está preparando.'],status=predictionStatus();
  return `<article class="egl-card briefing"><div class="egl-card-head"><div><span>HOY EN RM 26/27</span><h3>Lo que merece tu atención</h3></div><em class="${status.tone}">${esc(status.label)}</em></div><div class="egl-brief-list">${list.slice(0,3).map((x,i)=>`<div><b>${i+1}</b><span>${esc(x)}</span></div>`).join('')}</div><div class="egl-brief-actions"><button type="button" class="btn" data-egl-go="prediccion">Mi XI</button><button type="button" class="btn" data-egl-go="evolucion">Qué cambió</button></div></article>`;
}
function ensureHome(){
  const parent=document.getElementById('personalizedHome');if(!parent)return null;let root=document.getElementById('engagementLoop');if(root)return root;root=document.createElement('section');root.id='engagementLoop';root.className='engagement-loop';const next=parent.querySelector('.personal-next');if(next)next.insertAdjacentElement('afterend',root);else parent.appendChild(root);return root;
}
function ensureSeason(){
  const content=document.getElementById('personalHubContent');if(!content)return null;let root=document.getElementById('engagementSeason');if(root)return root;root=document.createElement('section');root.id='engagementSeason';root.className='card engagement-season';const kpis=content.querySelector('.psp-kpis');if(kpis)kpis.insertAdjacentElement('afterend',root);else content.prepend(root);return root;
}
function seasonHtml(p){
  const latest=p.scored[0],delta=p.scored.length>1?latest.score-p.scored[1].score:null,scenario=p.scenarioRank?`#${p.scenarioRank} de ${p.scenarioN}`:'Sin jornadas comunes todavía';
  return `<div class="egs-head"><div><span>PERFIL DE PREDICCIÓN</span><h3>Tu rendimiento como predictor</h3><p>Solo usamos jornadas realmente puntuadas; no reconstruimos predicciones que no existían antes del XI oficial.</p></div><b>${p.avg===null?'—':p.avg.toFixed(2)}<small>media /11</small></b></div><div class="egs-grid"><div><span>Récord</span><b>${p.best===null?'—':`${p.best}/11`}</b><small>${p.scored.length} puntuadas</small></div><div><span>Racha 8+</span><b>${p.streak8}</b><small>pronósticos puntuados seguidos con 8 o más</small></div><div><span>Última variación</span><b class="${delta>0?'up':delta<0?'down':''}">${delta===null?'—':`${delta>0?'+':''}${delta}`}</b><small>${latest?`${latest.score}/11 en ${esc(latest.label||labelFromId(latest.matchId))}`:'Sin resultado todavía'}</small></div><div><span>Vs Proyecto</span><b>${p.duels?`${p.wins}-${p.ties}-${p.losses}`:'—'}</b><small>victorias · empates · derrotas</small></div><div><span>Liga de escenarios</span><b>${esc(scenario)}</b><small>${Number.isFinite(p.scenarioAvg)?`${p.scenarioAvg.toFixed(2)}/11 de media`:'esperando muestra auditada'}</small></div></div>`;
}
function bind(root,row){
  root?.querySelectorAll('[data-egl-go]').forEach(b=>b.addEventListener('click',()=>safe(()=>showSection(b.dataset.eglGo))));
  root?.querySelectorAll('[data-egl-vote]').forEach(b=>b.addEventListener('click',()=>vote(row,b.dataset.eglVote)));
  root?.querySelectorAll('[data-egl-duel]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.eglDuel.split('|');openDuel(a,c)}));
}
function renderHome(){const root=ensureHome();if(!root)return false;const p=profile(),row=debate();root.innerHTML=`<div class="egl-title"><div><span>VUELVE CADA JORNADA</span><h2>Tu marcador, el duelo del día y lo nuevo</h2></div><small>${esc(dayKey())}</small></div><div class="egl-grid">${profileHtml(p)}${debateHtml(row)}${changesHtml()}</div>`;bind(root,row);return true}
function renderSeason(){const section=document.getElementById('mi-temporada');if(!section?.classList.contains('active'))return false;const root=ensureSeason();if(!root)return false;root.innerHTML=seasonHtml(profile());return true}
function render(){const home=renderHome();renderSeason();if(home)document.body.classList.add('engagement-loop-ready');return home}
function install(){
  if(installed)return;if(!document.getElementById('inicio')||!window.RMPersonalHome){if(++attempts<100)setTimeout(install,90);return}
  installed=true;render();
  ['rm-personal-home-rendered','rm-decision-board-rendered','rm-community-updated','rm-local-prediction-updated','rm-scenario-audit-updated','rm-season-data-ready','rm-ranking-official-ready','rm-daily-debate-voted'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,60)));
  window.addEventListener('storage',()=>setTimeout(render,60));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(render,40)});
  window.RMEngagementLoop=Object.freeze({render,profile,debate,vote,currentVote});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();