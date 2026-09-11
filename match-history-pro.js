(()=>{
let installed=false,filter='ALL',selectedId=null,compareAId=null,compareBId=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function season(){return window.RMSeasonData||null}
function allMatches(){return season()?.matches||[]}
function roster(){return safe(()=>players,[])||[]}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(n){return safe(()=>season()?.canonical?.(n),n)||n}
function display(n){return safe(()=>displayName(n),n)||n}
function ratingEntry(matchId,name){return safe(()=>season()?.officialRatingEntry?.(matchId,name),null)}
function minuteEntry(matchId,name){return safe(()=>season()?.minuteEntry?.(matchId,name),null)}
function sourceRatings(matchId,name){return safe(()=>season()?.sourceRatings?.(matchId,name),{})||{}}
function sourceUnrated(matchId,name){return safe(()=>season()?.sourceUnrated?.(matchId,name),{})||{}}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function signed(v,d=2){return Number.isFinite(v)?`${v>0?'+':''}${v.toFixed(d)}`:'—'}
function compKey(comp){const s=String(comp||'').toLowerCase();if(s.includes('champ'))return 'Champions';if(s.includes('liga'))return 'LaLiga';return comp||'Otra'}
function parseDateOnly(value){
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
  const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);if(month<1||month>12||day<1||day>31)return null;
  return {year,month,day};
}
function dateLabel(m,index){
  const pure=parseDateOnly(m?.date);if(pure){const months=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];return `${String(pure.day).padStart(2,'0')} ${months[pure.month-1]}`}
  if(m?.date){const d=new Date(m.date);if(Number.isFinite(d.getTime()))return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'short'}).format(d).toUpperCase()}
  return `PARTIDO ${index+1}`;
}
function dateLong(m,index){const pure=parseDateOnly(m?.date);if(pure)return `${String(pure.day).padStart(2,'0')}/${String(pure.month).padStart(2,'0')}/${pure.year}`;return dateLabel(m,index)}
function coverageLabel(entry){if(!entry)return 'Pendiente';if(entry.status==='unrated')return 'SC';if(entry.complete)return '3/3';if(entry.status==='closed-partial')return '2+SC';return 'Parcial'}
function coverageClass(entry){const label=coverageLabel(entry);if(label==='3/3')return 'cov-33';if(label==='2+SC')return 'cov-2sc';if(label==='SC')return 'cov-sc';if(label==='Pendiente')return 'cov-pending';return 'cov-partial'}
function appearances(m){
  return roster().map(p=>{const min=minuteEntry(m.id,p.name),rating=ratingEntry(m.id,p.name);if(!min||min.value<=0)return null;return {player:p,minutes:min.value,rating:rating?.value??null,entry:rating}}).filter(Boolean)
}
function sourceCoverage(m){
  const out={sofascore:{rated:0,sc:0,pending:0},fotmob:{rated:0,sc:0,pending:0},statmuse:{rated:0,sc:0,pending:0}};
  for(const row of appearances(m)){
    const rated=sourceRatings(m.id,row.player.name),unrated=sourceUnrated(m.id,row.player.name);
    for(const key of Object.keys(out)){if(rated[key])out[key].rated++;else if(unrated[key])out[key].sc++;else out[key].pending++}
  }
  return out
}
function summary(m){
  const rows=appearances(m),rated=rows.filter(x=>Number.isFinite(x.rating)),top=[...rated].sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes).slice(0,3),minuteTop=[...rows].sort((a,b)=>b.minutes-a.minutes||String(a.player.name).localeCompare(String(b.player.name),'es')).slice(0,3),full=rows.filter(x=>x.entry?.complete).length,partial=rows.filter(x=>x.entry?.status==='closed-partial').length,sc=rows.filter(x=>x.entry?.status==='unrated').length,pending=rows.filter(x=>!x.entry||(!x.entry.complete&&x.entry.status!=='closed-partial'&&x.entry.status!=='unrated')).length,avg=rated.length?rated.reduce((s,x)=>s+x.rating,0)/rated.length:null,totalMinutes=rows.reduce((s,x)=>s+x.minutes,0),coveragePct=rows.length?Math.round(full/rows.length*100):0;
  return {rows,rated,top,minuteTop,full,partial,sc,pending,avg,totalMinutes,coveragePct,closed:pending===0,source:sourceCoverage(m)}
}
function previousMatch(m){const list=allMatches(),idx=list.findIndex(x=>x.id===m?.id);return idx>0?list[idx-1]:null}
function strictTrend(name,m){
  const prev=previousMatch(m);if(!prev)return null;const cur=ratingEntry(m.id,name)?.value,before=ratingEntry(prev.id,name)?.value;
  if(!Number.isFinite(cur)||!Number.isFinite(before))return null;const delta=cur-before;if(Math.abs(delta)<.05)return {label:'→',delta:0,previousMatch:prev};return {label:delta>0?'▲':'▼',delta,previousMatch:prev}
}
function topAcross(matches){let best=null;for(const m of matches)for(const row of appearances(m)){if(!Number.isFinite(row.rating))continue;if(!best||row.rating>best.rating)best={...row,match:m}}return best}
function comparisonData(a,b){
  if(!a||!b)return null;const sa=summary(a),sb=summary(b),common=[];
  for(const p of roster()){
    const av=ratingEntry(a.id,p.name)?.value,bv=ratingEntry(b.id,p.name)?.value;if(!Number.isFinite(av)||!Number.isFinite(bv))continue;
    common.push({player:p,a:av,b:bv,delta:bv-av});
  }
  const meanDelta=common.length?common.reduce((s,x)=>s+x.delta,0)/common.length:null;
  const rises=[...common].filter(x=>x.delta>.049).sort((x,y)=>y.delta-x.delta).slice(0,3),falls=[...common].filter(x=>x.delta<-.049).sort((x,y)=>x.delta-y.delta).slice(0,3);
  return {a,b,sa,sb,common,meanDelta,rises,falls,avgDelta:Number.isFinite(sa.avg)&&Number.isFinite(sb.avg)?sb.avg-sa.avg:null,coverageDelta:sb.coveragePct-sa.coveragePct,ratedDelta:sb.rated.length-sa.rated.length}
}
function defaultComparison(){
  const list=allMatches(),selected=list.find(m=>m.id===selectedId)||list.at(-1);if(!selected)return;
  compareBId=selected.id;compareAId=previousMatch(selected)?.id||list.find(m=>m.id!==selected.id)?.id||selected.id;
}
function normalizeComparison(){
  const list=allMatches();if(list.length<2){compareAId=list[0]?.id||null;compareBId=list[0]?.id||null;return}
  if(!list.some(m=>m.id===compareBId))compareBId=selectedId&&list.some(m=>m.id===selectedId)?selectedId:list.at(-1).id;
  if(!list.some(m=>m.id===compareAId)||compareAId===compareBId){const b=list.find(m=>m.id===compareBId),prev=previousMatch(b);compareAId=prev?.id||list.find(m=>m.id!==compareBId)?.id||compareBId}
}
function filterButtons(matches){const comps=[...new Set(matches.map(m=>compKey(m.comp)))];return `<div class="mhp-filters"><button class="${filter==='ALL'?'active':''}" data-mhp-filter="ALL">Todos <b>${matches.length}</b></button>${comps.map(c=>{const n=matches.filter(m=>compKey(m.comp)===c).length;return `<button class="${filter===c?'active':''}" data-mhp-filter="${esc(c)}">${esc(c)} <b>${n}</b></button>`}).join('')}</div>`}
function archiveSummary(matches){
  const best=topAcross(matches),totalApps=matches.reduce((n,m)=>n+appearances(m).length,0),full=matches.reduce((n,m)=>n+summary(m).full,0),last=matches[matches.length-1];
  return `<div class="mhp-kpis"><div><span>Partidos analizados</span><b>${matches.length}</b><small>${new Set(matches.map(m=>compKey(m.comp))).size} competiciones</small></div><div><span>Mejor nota de partido</span><b>${best?fmt(best.rating):'—'}</b><small>${best?`${esc(display(best.player.name))} · ${esc(best.match.label)}`:'Sin datos'}</small></div><div><span>Apariciones</span><b>${totalApps}</b><small>Con minutos registrados</small></div><div><span>Cobertura completa</span><b>${full}</b><small>Apariciones con 3/3</small></div><div><span>Último incorporado</span><b>${last?esc(last.short||last.label):'—'}</b><small>${last?esc(last.comp):'Sin partidos'}</small></div></div>`
}
function matchCard(m,index){
  const s=summary(m),leader=s.top[0],status=s.closed?'Datos cerrados':'Revisión abierta';
  return `<button class="mhp-match ${selectedId===m.id?'selected':''}" data-mhp-match="${esc(m.id)}"><div class="mhp-match-head"><span>${esc(dateLabel(m,index))}</span><em>${esc(m.comp)}</em></div><div class="mhp-match-title"><div><small>REAL MADRID</small><h3>${esc(m.label)}</h3></div><strong>${leader?fmt(leader.rating,1):'—'}</strong></div><div class="mhp-match-meta"><span>${leader?`★ ${esc(display(leader.player.name))}`:'Sin líder'}</span><span>${s.rows.length} jugadores</span><span>${s.coveragePct}% 3/3</span><span class="${s.closed?'ok':'warn'}">${status}</span></div></button>`
}
function coveragePills(s){return `<div class="mhp-coverage"><span><b>${s.full}</b> 3/3</span><span><b>${s.partial}</b> 2+SC</span><span><b>${s.sc}</b> SC</span>${s.pending?`<span class="warn"><b>${s.pending}</b> pendientes</span>`:''}<span><b>${s.coveragePct}%</b> cobertura 3/3</span></div>`}
function sourceBlocks(s){const labels={sofascore:'SofaScore',fotmob:'FotMob',statmuse:'StatMuse'};return `<div class="mhp-sources">${Object.entries(s.source).map(([key,v])=>`<div><span>${labels[key]||key}</span><b>${v.rated} notas</b><small>${v.sc} SC${v.pending?` · ${v.pending} pendientes`:''}</small></div>`).join('')}</div>`}
function podium(s,m){return `<div class="mhp-podium"><span>MEJORES NOTAS</span>${s.top.length?s.top.map((x,i)=>{const t=strictTrend(x.player.name,m);return `<button data-mhp-player="${esc(x.player.name)}"><i>#${i+1}</i><div><b>${esc(display(x.player.name))}</b><small>${x.minutes}' · ${coverageLabel(x.entry)}</small></div><strong>${fmt(x.rating,2)}${t?` <em class="${t.delta>0?'up':t.delta<0?'down':''}">${t.label}${t.delta?Math.abs(t.delta).toFixed(1):''}</em>`:''}</strong></button>`}).join(''):'<p>Sin valoraciones.</p>'}</div>`}
function minutesBlock(s){return `<div class="mhp-minutes"><span>MÁS MINUTOS</span>${s.minuteTop.map(x=>`<button data-mhp-player="${esc(x.player.name)}"><div><b>${esc(display(x.player.name))}</b><small>${esc(x.player.pos)}</small></div><strong>${x.minutes}'</strong></button>`).join('')}</div>`}
function strictChanges(m){
  const prev=previousMatch(m);if(!prev)return '';
  const data=comparisonData(prev,m);if(!data||!data.common.length)return `<div class="mhp-strict-change"><div><span>VS JORNADA ANTERIOR</span><h3>Sin muestra comparable</h3><p>No hay jugadores con nota oficial en ambos partidos.</p></div></div>`;
  const riser=data.rises[0],faller=data.falls[0];
  return `<div class="mhp-strict-change"><div><span>COMPARACIÓN ESTRICTA · VS JORNADA ANTERIOR</span><h3>${esc(prev.label)} → ${esc(m.label)}</h3><p>Solo jugadores con nota oficial en ambos partidos. No se salta ninguna jornada buscando una nota anterior.</p></div><div class="mhp-strict-kpis"><div><small>Media común</small><b class="${data.meanDelta>0?'up':data.meanDelta<0?'down':''}">${signed(data.meanDelta,2)}</b><span>${data.common.length} jugadores</span></div><div><small>Mayor subida</small><b>${riser?esc(display(riser.player.name)):'—'}</b><span>${riser?signed(riser.delta,2):'Sin subida > 0,05'}</span></div><div><small>Mayor bajada</small><b>${faller?esc(display(faller.player.name)):'—'}</b><span>${faller?signed(faller.delta,2):'Sin bajada > 0,05'}</span></div></div></div>`
}
function tableRows(s,m){
  const rows=[...s.rows].sort((a,b)=>(Number.isFinite(b.rating)?b.rating:-Infinity)-(Number.isFinite(a.rating)?a.rating:-Infinity)||b.minutes-a.minutes);
  return rows.map(x=>{const t=strictTrend(x.player.name,m);return `<button class="mhp-row" data-mhp-player="${esc(x.player.name)}"><span><b>${esc(display(x.player.name))}</b><small>${esc(x.player.pos)}</small></span><span>${x.minutes}'</span><strong>${Number.isFinite(x.rating)?fmt(x.rating,2):'SC'}</strong><span class="mhp-cov ${coverageClass(x.entry)}">${coverageLabel(x.entry)}</span><em class="${t?.delta>0?'up':t?.delta<0?'down':''}">${t?`${t.label}${t.delta?Math.abs(t.delta).toFixed(1):''}`:'—'}</em></button>`}).join('')
}
function detail(m){
  if(!m)return '<div class="mhp-empty">Selecciona un partido para abrir el análisis.</div>';
  const s=summary(m),idx=allMatches().findIndex(x=>x.id===m.id),leader=s.top[0],prev=previousMatch(m);
  return `<article class="mhp-detail"><div class="mhp-detail-head"><div><span>${esc(dateLong(m,idx))} · ${esc(m.comp)}</span><h2>Real Madrid · ${esc(m.label)}</h2><p>${s.closed?'Las fuentes de las apariciones registradas están cerradas.':'Todavía quedan apariciones con fuentes pendientes.'}</p></div><div class="mhp-detail-score"><span>Media de notas</span><b>${fmt(s.avg,2)}</b><small>${s.rated.length} jugadores calificados</small></div></div>${coveragePills(s)}${strictChanges(m)}<div class="mhp-detail-grid">${podium(s,m)}${minutesBlock(s)}</div>${sourceBlocks(s)}<div class="mhp-table"><div class="mhp-table-head"><span>Jugador</span><span>Min.</span><span>Nota</span><span>Cobertura</span><span>Vs anterior</span></div>${tableRows(s,m)}</div><div class="mhp-actions"><button class="btn" data-mhp-go="evolucion">Ver evolución</button><button class="btn" data-mhp-go="estadisticas">Abrir estadísticas</button><button class="btn" data-mhp-mvp="${esc(m.id)}">Abrir MVP</button>${leader?`<button class="btn primary" data-mhp-player="${esc(leader.player.name)}">Ficha de ${esc(display(leader.player.name))}</button>`:''}</div><p class="mhp-note">“Vs anterior” compara exclusivamente con ${prev?esc(prev.label):'la jornada inmediatamente anterior'} del calendario. Si falta nota oficial en cualquiera de los dos partidos, se muestra —. La nota es la oficial multifuente del proyecto: 3/3 = SofaScore + FotMob + StatMuse; 2+SC = dos notas y una fuente comprobada sin calificación. SC nunca equivale a 0.</p></article>`
}
function compareOptions(selected){return allMatches().map((m,i)=>`<option value="${esc(m.id)}" ${m.id===selected?'selected':''}>${esc(dateLabel(m,i))} · ${esc(m.short||m.label)} · ${esc(m.comp)}</option>`).join('')}
function movementRows(rows,type){
  if(!rows.length)return `<div class="mhp-move-empty">Sin cambios ${type==='up'?'positivos':'negativos'} superiores a 0,05.</div>`;
  return rows.map(x=>`<button data-mhp-player="${esc(x.player.name)}"><span>${type==='up'?'▲':'▼'}</span><b>${esc(display(x.player.name))}</b><strong class="${type}">${signed(x.delta,2)}</strong></button>`).join('')
}
function comparisonPanel(){
  normalizeComparison();const a=allMatches().find(m=>m.id===compareAId),b=allMatches().find(m=>m.id===compareBId);if(!a||!b)return '';
  const d=comparisonData(a,b),leaderA=d.sa.top[0],leaderB=d.sb.top[0];
  return `<section class="mhp-compare card"><div class="mhp-compare-head"><div><span>COMPARADOR DE PARTIDOS</span><h2>¿Cómo cambió el equipo entre dos jornadas?</h2><p>Compara media de notas, cobertura y cambios individuales usando solo datos oficiales comparables.</p></div><button class="btn" data-mhp-swap="1">⇄ Invertir</button></div><div class="mhp-compare-selects"><label>Partido A<select class="select" id="mhpCompareA">${compareOptions(compareAId)}</select></label><span>VS</span><label>Partido B<select class="select" id="mhpCompareB">${compareOptions(compareBId)}</select></label></div><div class="mhp-compare-score"><article><span>${esc(a.short||a.label)}</span><h3>${esc(a.label)}</h3><div><b>${fmt(d.sa.avg,2)}</b><small>media</small></div><p>${d.sa.rated.length} notas · ${d.sa.coveragePct}% 3/3</p><em>${leaderA?`★ ${esc(display(leaderA.player.name))} ${fmt(leaderA.rating,2)}`:'Sin líder'}</em></article><div class="mhp-compare-delta"><span>CAMBIO B − A</span><b class="${d.avgDelta>0?'up':d.avgDelta<0?'down':''}">${signed(d.avgDelta,2)}</b><small>media de notas</small><p>${signed(d.coverageDelta,0)} pp cobertura 3/3 · ${signed(d.ratedDelta,0)} jugadores con nota</p></div><article><span>${esc(b.short||b.label)}</span><h3>${esc(b.label)}</h3><div><b>${fmt(d.sb.avg,2)}</b><small>media</small></div><p>${d.sb.rated.length} notas · ${d.sb.coveragePct}% 3/3</p><em>${leaderB?`★ ${esc(display(leaderB.player.name))} ${fmt(leaderB.rating,2)}`:'Sin líder'}</em></article></div><div class="mhp-compare-common"><div><span>JUGADORES COMPARABLES</span><b>${d.common.length}</b><small>con nota oficial en A y B</small></div><div><span>CAMBIO MEDIO COMÚN</span><b class="${d.meanDelta>0?'up':d.meanDelta<0?'down':''}">${signed(d.meanDelta,2)}</b><small>solo sobre esos ${d.common.length}</small></div></div><div class="mhp-movement-grid"><div><span>MAYORES SUBIDAS</span>${movementRows(d.rises,'up')}</div><div><span>MAYORES BAJADAS</span>${movementRows(d.falls,'down')}</div></div><p class="mhp-compare-note">La comparación entre partidos no rellena huecos: un jugador solo entra en la variación individual si tiene nota oficial en ambos encuentros. SC, ausencia y 0 minutos quedan fuera, nunca como 0.</p></section>`
}
function syncUrl(){try{const u=new URL(location.href);u.searchParams.set('section','partidos');if(selectedId)u.searchParams.set('match',selectedId);else u.searchParams.delete('match');if(compareAId)u.searchParams.set('compareA',compareAId);if(compareBId)u.searchParams.set('compareB',compareBId);history.replaceState(null,'',u.href)}catch{}}
function select(id,update=true){if(!allMatches().some(m=>m.id===id))return;selectedId=id;const m=allMatches().find(x=>x.id===id);compareBId=id;compareAId=previousMatch(m)?.id||allMatches().find(x=>x.id!==id)?.id||id;if(update)syncUrl();render()}
function bind(root){
  root.querySelectorAll('[data-mhp-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.mhpFilter;const visible=allMatches().filter(m=>filter==='ALL'||compKey(m.comp)===filter);if(!visible.some(m=>m.id===selectedId))select(visible[visible.length-1]?.id||selectedId,false);render()}));
  root.querySelectorAll('[data-mhp-match]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.mhpMatch)));
  root.querySelectorAll('[data-mhp-player]').forEach(b=>b.addEventListener('click',()=>safe(()=>openPlayerHub(b.dataset.mhpPlayer))));
  root.querySelectorAll('[data-mhp-go]').forEach(b=>b.addEventListener('click',()=>safe(()=>showSection(b.dataset.mhpGo))));
  root.querySelectorAll('[data-mhp-mvp]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.mhpMvp;if(typeof openMvpMatch==='function')safe(()=>openMvpMatch(id));else safe(()=>showSection('mvp'))}));
  root.querySelector('[data-mhp-swap]')?.addEventListener('click',()=>{const t=compareAId;compareAId=compareBId;compareBId=t;syncUrl();render()});
  document.getElementById('mhpCompareA')?.addEventListener('change',e=>{compareAId=e.target.value;if(compareAId===compareBId){const alt=allMatches().find(m=>m.id!==compareAId);compareBId=alt?.id||compareBId}syncUrl();render()});
  document.getElementById('mhpCompareB')?.addEventListener('change',e=>{compareBId=e.target.value;if(compareAId===compareBId){const alt=allMatches().find(m=>m.id!==compareBId);compareAId=alt?.id||compareAId}syncUrl();render()});
}
function render(){
  const section=document.getElementById('partidos'),list=document.getElementById('matchesList'),data=allMatches();if(!section||!list||!data.length)return;
  section.classList.add('match-history-pro-ready');if(!selectedId||!data.some(m=>m.id===selectedId))selectedId=data[data.length-1].id;if(!compareAId||!compareBId)defaultComparison();normalizeComparison();
  let shell=document.getElementById('mhpShell');if(!shell){shell=document.createElement('div');shell.id='mhpShell';const head=section.querySelector(':scope>.section-head');head?.insertAdjacentElement('afterend',shell);list.hidden=true}
  const visible=data.filter(m=>filter==='ALL'||compKey(m.comp)===filter),chosen=data.find(m=>m.id===selectedId)||visible[visible.length-1];
  shell.innerHTML=`${archiveSummary(data)}<div class="mhp-toolbar"><div><span>HISTORIAL PRO</span><h2>Jornada a jornada</h2><p>Abre un partido para ver notas, minutos, cobertura de fuentes y comparación estricta frente al encuentro inmediatamente anterior.</p></div>${filterButtons(data)}</div>${comparisonPanel()}<div class="mhp-layout"><div class="mhp-list">${visible.map(m=>matchCard(m,data.findIndex(x=>x.id===m.id))).join('')||'<div class="mhp-empty">No hay partidos en este filtro.</div>'}</div><div class="mhp-detail-wrap">${detail(chosen)}</div></div>`;
  bind(shell);window.RMAccessibility?.refresh?.();document.dispatchEvent(new CustomEvent('rm-match-history-rendered',{detail:{matchId:selectedId,filter,compareAId,compareBId}}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,m=q.get('match'),a=q.get('compareA'),b=q.get('compareB');if(m&&allMatches().some(x=>x.id===m))selectedId=m;if(a&&allMatches().some(x=>x.id===a))compareAId=a;if(b&&allMatches().some(x=>x.id===b))compareBId=b}catch{}}
function install(){if(installed)return;if(!document.getElementById('partidos')||!season()||!allMatches().length){setTimeout(install,100);return}installed=true;applyUrl();render();document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-ranking-official-ready',render);window.RMMatchHistoryPro=Object.freeze({render,select,compare:(a,b)=>{compareAId=a;compareBId=b;normalizeComparison();syncUrl();render()},get selected(){return selectedId},get comparison(){return [compareAId,compareBId]}})}
install();
})();