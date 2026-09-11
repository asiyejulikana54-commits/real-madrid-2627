(()=>{
const I_HISTORY={
  malaga:{'Bellingham':8.8,'Mbappé':8.7,'Trent Alexander-Arnold':8.5,'Vini Jr.':8.3,'Camavinga':7.8,'Cucurella':7.7,'Huijsen':7.5,'Diomande':6.6},
  'real-sociedad':{'Mbappé':9.8,'Bellingham':9.0,'Vini Jr.':8.6,'Arda Güler':8.2,'Valverde':8.1,'Huijsen':7.8},
  espanyol:{'Arda Güler':8.6,'Bellingham':8.3,'Valverde':8.1,'Konaté':7.7,'Mbappé':7.4,'Diomande':6.0},
  betis:{'Vini Jr.':7.8,'Arda Güler':7.5,'Huijsen':7.5,'Bellingham':7.4,'Cucurella':6.8,'Mbappé':6.7,'Courtois':6.7,'Valverde':6.6,'Konaté':6.6,'Dumfries':6.6,'Camavinga':6.1},
  inter:{}
};
const I_MATCHES=['malaga','real-sociedad','espanyol','betis','inter'];
let intelCommunity=null,intelPolls=null,intelMvp=null,intelLoading=false;

function iEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function iMetric(p){return metricFor(p)}
function iRating(p){const m=iMetric(p);return currentRating(m)}
function iPower(p){const m=iMetric(p),r=iRating(p);if(!m||r===null)return null;const sample=Math.min(m.minutes,450)/450;return r*(.75+.25*sample)}
function iPowerRows(){return players.map(p=>{const m=iMetric(p),rating=iRating(p),power=iPower(p);return m&&rating!==null?{p,m,rating,power}:null}).filter(Boolean).sort((a,b)=>b.power-a.power||b.rating-a.rating)}
function iHistoryVals(name){return I_MATCHES.map(id=>I_HISTORY[id]?.[name]).filter(v=>typeof v==='number')}
function iRecentAvg(name){const vals=iHistoryVals(name).slice(-3);return vals.length?{value:vals.reduce((a,b)=>a+b,0)/vals.length,n:vals.length}:null}
function iBiggestRise(){
  const rows=players.map(p=>{const vals=iHistoryVals(p.name);if(vals.length<2)return null;const prev=vals[vals.length-2],last=vals[vals.length-1];return {p,prev,last,delta:last-prev,n:vals.length}}).filter(Boolean).sort((a,b)=>b.delta-a.delta);
  return rows[0]||null;
}
function iShortSample(){
  return iPowerRows().filter(x=>x.m.minutes<90).sort((a,b)=>b.rating-a.rating)[0]||null;
}
function iBestBench(){const base=new Set(Object.values(baseXI));return iPowerRows().find(x=>!base.has(x.p.name))||null}

function iNorm(v,min,max){return max===min?10:10*(v-min)/(max-min)}
function iBalanceScore(p){
  const rows=iPowerRows(),m=iMetric(p),r=iRating(p);if(!m||r===null)return null;
  const ratings=rows.map(x=>x.rating),effs=rows.map(x=>x.m.minPerPoint),rMin=Math.min(...ratings),rMax=Math.max(...ratings),eMin=Math.min(...effs),eMax=Math.max(...effs);
  const ratingScore=iNorm(r,rMin,rMax),sampleScore=Math.min(m.minutes,450)/45,effScore=iNorm(eMax-m.minPerPoint,0,eMax-eMin);
  return .45*ratingScore+.30*sampleScore+.25*effScore;
}
function iCandidates(slot){return players.filter(p=>p.eligible.includes(slot[4])&&iBalanceScore(p)!==null).map(p=>({p,score:iBalanceScore(p)})).sort((a,b)=>b.score-a.score)}
function iDataXI(){
  const ordered=slots.map(slot=>({slot,cands:iCandidates(slot)})).sort((a,b)=>a.cands.length-b.cands.length);let best=null,bestScore=-Infinity;
  const maxRemain=ordered.map((_,i)=>ordered.slice(i).reduce((s,x)=>s+(x.cands[0]?.score||0),0));
  function dfs(i,used,assign,total){if(i===ordered.length){if(total>bestScore){bestScore=total;best={...assign}}return}if(total+maxRemain[i]<=bestScore)return;const item=ordered[i];for(const c of item.cands){if(used.has(c.p.name))continue;used.add(c.p.name);assign[item.slot[0]]=c.p.name;dfs(i+1,used,assign,total+c.score);delete assign[item.slot[0]];used.delete(c.p.name)}}
  dfs(0,new Set(),{},0);return best||{};
}
function iOverlap(a,b){const A=new Set(Object.values(a||{}).filter(Boolean)),B=new Set(Object.values(b||{}).filter(Boolean));return [...A].filter(x=>B.has(x)).length}
function iDifferences(a,b){const A=new Set(Object.values(a||{}).filter(Boolean));return Object.values(b||{}).filter(Boolean).filter(x=>!A.has(x))}

function iBiggestCommunityDebate(){
  let best=null;for(const [slot,rows] of Object.entries(intelCommunity?.slotShares||{})){if(!rows||rows.length<2)continue;const margin=Math.abs(rows[0].percentage-rows[1].percentage);if(!best||margin<best.margin)best={slot,margin,a:rows[0],b:rows[1]}}
  return best;
}
function iMostUnanimous(){let best=null;for(const rows of Object.values(intelCommunity?.slotShares||{})){if(!rows?.[0])continue;if(!best||rows[0].percentage>best.percentage)best=rows[0]}return best}
function iMvpLeader(){return intelMvp?.season?.[0]||null}
function iPoll(id){return (intelPolls?.polls||[]).find(p=>p.id===id)||null}
function iPollLead(id){const p=iPoll(id);if(!p||!p.total)return null;const rows=[...(p.options||[])].sort((a,b)=>b.percentage-a.percentage);return {poll:p,first:rows[0],second:rows[1]||null}}
function iDecisionCards(){
  const defs=[
    {id:'ld',title:'Lateral derecho',fallback:'Dumfries vs Trent',section:'radar'},
    {id:'central',title:'Jerarquía de centrales',fallback:'Rüdiger vs Konaté vs Huijsen',section:'radar'},
    {id:'banda',title:'Banda derecha',fallback:'Diomandé vs Brahim',section:'radar'}
  ];
  return defs.map(d=>{const lead=iPollLead(d.id);if(!lead)return {...d,text:d.fallback,sub:'Pendiente de voto comunitario'};const gap=lead.second?Math.abs(lead.first.percentage-lead.second.percentage):lead.first.percentage;return {...d,text:`${lead.first.label} · ${lead.first.percentage}%`,sub:lead.second?`${lead.second.label} ${lead.second.percentage}% · margen ${gap.toFixed(1)} pts`:`${lead.poll.total} votos`}})
}
function iConsensusPlayer(dataXI){
  const dataSet=new Set(Object.values(dataXI));
  return iPowerRows().find(x=>dataSet.has(x.p.name)&&Object.values(rayoXI).includes(x.p.name))||null;
}
function iConfidence(){
  const dataXI=iDataXI(),overlap=iOverlap(dataXI,rayoXI);return overlap>=9?'Muy alta':overlap>=7?'Alta':overlap>=5?'Media':'Baja';
}
function iXiChips(xi){return slots.map(s=>xi[s[0]]).filter(Boolean).map(n=>`<span>${iEsc(displayName(n))}</span>`).join('')}

function ensureIntel(){
  if(document.getElementById('intelligenceHome'))return;
  const inicio=document.getElementById('inicio');if(!inicio)return;
  const block=document.createElement('div');block.id='intelligenceHome';block.className='intelligence-home';
  const hero=inicio.querySelector('.hero');if(hero)hero.insertAdjacentElement('afterend',block);else inicio.prepend(block);
}
function renderIntel(){
  const root=document.getElementById('intelligenceHome');if(!root)return;
  const power=iPowerRows(),top=power[0]||null,rise=iBiggestRise(),short=iShortSample(),bench=iBestBench(),dataXI=iDataXI(),overlap=iOverlap(dataXI,rayoXI),changes=iDifferences(rayoXI,dataXI),debate=iBiggestCommunityDebate(),unanimous=iMostUnanimous(),mvp=iMvpLeader(),consensus=iConsensusPlayer(dataXI),decisions=iDecisionCards();
  const communityReady=Boolean(intelCommunity?.totalPredictions),pollReady=Boolean((intelPolls?.polls||[]).some(p=>p.total)),mvpReady=Boolean(intelMvp?.totalVotes);
  root.innerHTML=`
    <div class="intel-head"><div><div class="eyebrow">🧠 CENTRO DE INTELIGENCIA RM</div><h2>La temporada explicada en 20 segundos</h2><p>Cruza rendimiento, muestra, forma, nuestro XI, datos y comunidad. Cada tarjeta te lleva al análisis que hay detrás.</p></div><button class="btn" onclick="refreshIntelligence()">${intelLoading?'Actualizando…':'Actualizar señales'}</button></div>
    <div class="intel-signal-grid">
      <button class="card intel-signal hero-signal" onclick="openPlayerHub('${top?.p.name?.replace(/'/g,"\\'")||''}')"><span>⚡ Poder actual</span><b>${top?iEsc(top.p.short||top.p.name):'—'}</b><strong>${top?top.power.toFixed(2):'—'}</strong><small>${top?`#1 Power · media ${top.rating.toFixed(2)} · ${top.m.minutes} min`:'Sin datos'}</small></button>
      <button class="card intel-signal" onclick="${rise?`openPlayerHub('${rise.p.name.replace(/'/g,"\\'")}')`:`showSection('evolucion')`}"><span>↗ Mayor subida reciente</span><b>${rise?iEsc(rise.p.short||rise.p.name):'—'}</b><strong>${rise?`${rise.delta>=0?'+':''}${rise.delta.toFixed(1)}`:'—'}</strong><small>${rise?`${rise.prev.toFixed(1)} → ${rise.last.toFixed(1)} · notas confirmadas`:'Necesitamos dos notas'}</small></button>
      <button class="card intel-signal" onclick="${bench?`openPlayerHub('${bench.p.name.replace(/'/g,"\\'")}')`:`showSection('power')`}"><span>🪑 Mejor fuera del XI base</span><b>${bench?iEsc(bench.p.short||bench.p.name):'—'}</b><strong>${bench?bench.power.toFixed(2):'—'}</strong><small>${bench?`Power · ${bench.m.minutes} min`:'Sin candidato'}</small></button>
      <button class="card intel-signal warning" onclick="${short?`openPlayerHub('${short.p.name.replace(/'/g,"\\'")}')`:`showSection('power')`}"><span>🔬 Muestra a vigilar</span><b>${short?iEsc(short.p.short||short.p.name):'—'}</b><strong>${short?short.m.minutes:'—'}<em> min</em></strong><small>${short?`Media ${short.rating.toFixed(2)} · aún por debajo de 90 min`:'Sin muestras cortas'}</small></button>
    </div>
    <div class="intel-main-grid">
      <div class="card intel-xi-card"><div class="intel-card-head"><div><div class="eyebrow">⚗ XI RECOMENDADO POR DATOS</div><h3>Equilibrio del Laboratorio</h3></div><button class="btn" onclick="showSection('laboratorio')">Abrir Laboratorio</button></div><div class="intel-xi-pitch">${slots.map(s=>`<div style="left:${s[2]}%;top:${s[3]}%"><small>${s[1]}</small><b>${iEsc(displayName(dataXI[s[0]]||'—'))}</b></div>`).join('')}</div><div class="intel-xi-summary"><div><span>Coincide con nuestra idea</span><b>${overlap}<small>/11</small></b></div><div><span>Cambios que propone</span><b>${11-overlap}</b></div><div><span>Confianza de consenso</span><b>${iConfidence()}</b></div></div>${changes.length?`<div class="intel-change-line"><span>Entrarían por datos:</span>${changes.map(n=>`<button onclick="openPlayerHub('${n.replace(/'/g,"\\'")}')">${iEsc(displayName(n))}</button>`).join('')}</div>`:''}</div>
      <div class="card intel-community-card"><div class="intel-card-head"><div><div class="eyebrow">👥 PULSO DE LA COMUNIDAD</div><h3>Qué está diciendo la gente</h3></div><button class="btn" onclick="showSection('comunidad')">Ver comunidad</button></div><div class="intel-community-signals"><div><span>Mayor debate</span><b>${debate?`${iEsc(displayName(debate.a.name))} ${debate.a.percentage}% · ${iEsc(displayName(debate.b.name))} ${debate.b.percentage}%`:'—'}</b><small>${debate?`Solo ${debate.margin.toFixed(1)} pts de margen`:(communityReady?'Sin duelo con dos opciones':'Esperando pronósticos')}</small></div><div><span>Más unánime</span><b>${unanimous?`${iEsc(displayName(unanimous.name))} · ${unanimous.percentage}%`:'—'}</b><small>${communityReady?`${intelCommunity.totalPredictions} pronóstico${intelCommunity.totalPredictions===1?'':'s'}`:'Comunidad pendiente'}</small></div><div><span>MVP de la comunidad</span><b>${mvp?iEsc(displayName(mvp.player)):'—'}</b><small>${mvpReady?`${mvp.wins||0} victorias · ${mvp.votes||0} votos`:'Esperando votos MVP'}</small></div><div><span>Consenso datos + nuestro XI</span><b>${consensus?iEsc(consensus.p.short||consensus.p.name):'—'}</b><small>${consensus?`Power ${consensus.power.toFixed(2)} · aparece en ambos XI`:'Sin coincidencia destacada'}</small></div></div></div>
    </div>
    <div class="intel-decisions-head"><div><div class="eyebrow">🎯 PRÓXIMO PARTIDO</div><h2>3 decisiones que pueden cambiar el XI</h2></div><button class="btn" onclick="showSection('radar')">Abrir Radar</button></div>
    <div class="intel-decisions">${decisions.map((d,i)=>`<button class="card" onclick="showSection('${d.section}')"><span>0${i+1}</span><div><small>${iEsc(d.title)}</small><b>${iEsc(d.text)}</b><p>${iEsc(d.sub)}</p></div><strong>→</strong></button>`).join('')}</div>
    <div class="intel-status"><div><span>Power</span><b class="on">Conectado</b></div><div><span>Forma</span><b class="on">Conectada</b></div><div><span>Laboratorio</span><b class="on">Conectado</b></div><div><span>Comunidad</span><b class="${communityReady?'on':'wait'}">${communityReady?'Conectada':'Esperando votos'}</b></div><div><span>Encuestas</span><b class="${pollReady?'on':'wait'}">${pollReady?'Conectadas':'Esperando votos'}</b></div><div><span>MVP</span><b class="${mvpReady?'on':'wait'}">${mvpReady?'Conectado':'Esperando votos'}</b></div></div>`;
}

async function iFetchJson(url){try{const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)return null;return await r.json()}catch{return null}}
window.refreshIntelligence=async function(){
  if(intelLoading)return;intelLoading=true;renderIntel();
  const pid=typeof getParticipantId==='function'?getParticipantId():'';
  const [c,p,m]=await Promise.all([
    iFetchJson('/.netlify/functions/community-v2'),
    iFetchJson(`/.netlify/functions/matchday?participantId=${encodeURIComponent(pid)}`),
    iFetchJson(`/.netlify/functions/mvp?participantId=${encodeURIComponent(pid)}`)
  ]);
  if(c)intelCommunity=c;if(p)intelPolls=p;if(m)intelMvp=m;intelLoading=false;renderIntel();
};
function hookCommunity(){
  if(typeof renderCommunity!=='function'||window.__rmIntelCommunityHook)return;
  window.__rmIntelCommunityHook=true;const base=renderCommunity;renderCommunity=function(data){base(data);intelCommunity=data;renderIntel()};
}
function install(){
  if(typeof players==='undefined'||typeof slots==='undefined'||typeof phRows!=='function'){setTimeout(install,120);return}
  ensureIntel();hookCommunity();renderIntel();refreshIntelligence();
}
install();
})();
