(()=>{
let installed=false,filter='ALL',selectedId=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function season(){return window.RMSeasonData||null}
function allMatches(){return season()?.matches||[]}
function roster(){return safe(()=>players,[])||[]}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(n){return safe(()=>season()?.canonical?.(n),n)||n}
function display(n){return safe(()=>displayName(n),n)||n}
function ratingEntry(matchId,name){return safe(()=>season()?.officialRatingEntry?.(matchId,name),null)}
function minuteEntry(matchId,name){return safe(()=>season()?.minuteEntry?.(matchId,name),null)}
function sourceRatings(matchId,name){return safe(()=>season()?.sourceRatings?.(matchId,name),{})||{}}
function sourceUnrated(matchId,name){return safe(()=>season()?.sourceUnrated?.(matchId,name),{})||{}}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function compKey(comp){const s=String(comp||'').toLowerCase();if(s.includes('champ'))return 'Champions';if(s.includes('liga'))return 'LaLiga';return comp||'Otra'}
function dateLabel(m,index){
  if(m?.date){const d=new Date(m.date);if(Number.isFinite(d.getTime()))return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'}).format(d).toUpperCase()}
  return `PARTIDO ${index+1}`;
}
function coverageLabel(entry){if(!entry)return 'Pendiente';if(entry.status==='unrated')return 'SC';if(entry.complete)return '3/3';if(entry.status==='closed-partial')return '2+SC';return 'Parcial'}
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
  const rows=appearances(m),rated=rows.filter(x=>Number.isFinite(x.rating)),top=[...rated].sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes).slice(0,3),minuteTop=[...rows].sort((a,b)=>b.minutes-a.minutes||String(a.player.name).localeCompare(String(b.player.name),'es')).slice(0,3),full=rows.filter(x=>x.entry?.complete).length,partial=rows.filter(x=>x.entry?.status==='closed-partial').length,sc=rows.filter(x=>x.entry?.status==='unrated').length,pending=rows.filter(x=>!x.entry||(!x.entry.complete&&x.entry.status!=='closed-partial'&&x.entry.status!=='unrated')).length,avg=rated.length?rated.reduce((s,x)=>s+x.rating,0)/rated.length:null;
  return {rows,rated,top,minuteTop,full,partial,sc,pending,avg,closed:pending===0,source:sourceCoverage(m)}
}
function previousRating(name,matchId){
  const list=allMatches(),idx=list.findIndex(m=>m.id===matchId);if(idx<=0)return null;
  for(let i=idx-1;i>=0;i--){const e=ratingEntry(list[i].id,name);if(Number.isFinite(e?.value))return e.value}
  return null
}
function trend(name,m){const cur=ratingEntry(m.id,name)?.value,prev=previousRating(name,m.id);if(!Number.isFinite(cur)||!Number.isFinite(prev))return null;const delta=cur-prev;if(Math.abs(delta)<.05)return {label:'→',delta:0};return {label:delta>0?'▲':'▼',delta}}
function topAcross(matches){
  let best=null;for(const m of matches)for(const row of appearances(m)){if(!Number.isFinite(row.rating))continue;if(!best||row.rating>best.rating)best={...row,match:m}}
  return best
}
function filterButtons(matches){const comps=[...new Set(matches.map(m=>compKey(m.comp)))];return `<div class="mhp-filters"><button class="${filter==='ALL'?'active':''}" data-mhp-filter="ALL">Todos <b>${matches.length}</b></button>${comps.map(c=>{const n=matches.filter(m=>compKey(m.comp)===c).length;return `<button class="${filter===c?'active':''}" data-mhp-filter="${esc(c)}">${esc(c)} <b>${n}</b></button>`}).join('')}</div>`}
function archiveSummary(matches){
  const best=topAcross(matches),totalApps=matches.reduce((n,m)=>n+appearances(m).length,0),full=matches.reduce((n,m)=>n+summary(m).full,0),last=matches[matches.length-1];
  return `<div class="mhp-kpis"><div><span>Partidos analizados</span><b>${matches.length}</b><small>${new Set(matches.map(m=>compKey(m.comp))).size} competiciones</small></div><div><span>Mejor nota de partido</span><b>${best?fmt(best.rating):'—'}</b><small>${best?`${esc(display(best.player.name))} · ${esc(best.match.label)}`:'Sin datos'}</small></div><div><span>Apariciones</span><b>${totalApps}</b><small>Con minutos registrados</small></div><div><span>Cobertura completa</span><b>${full}</b><small>Apariciones con 3/3</small></div><div><span>Último incorporado</span><b>${last?esc(last.short||last.label):'—'}</b><small>${last?esc(last.comp):'Sin partidos'}</small></div></div>`
}
function matchCard(m,index){
  const s=summary(m),leader=s.top[0],status=s.closed?'Datos cerrados':'Revisión abierta';
  return `<button class="mhp-match ${selectedId===m.id?'selected':''}" data-mhp-match="${esc(m.id)}"><div class="mhp-match-head"><span>${esc(dateLabel(m,index))}</span><em>${esc(m.comp)}</em></div><div class="mhp-match-title"><div><small>REAL MADRID</small><h3>${esc(m.label)}</h3></div><strong>${leader?fmt(leader.rating,1):'—'}</strong></div><div class="mhp-match-meta"><span>${leader?`★ ${esc(display(leader.player.name))}`:'Sin líder'}</span><span>${s.rows.length} jugadores</span><span class="${s.closed?'ok':'warn'}">${status}</span></div></button>`
}
function coveragePills(s){return `<div class="mhp-coverage"><span><b>${s.full}</b> 3/3</span><span><b>${s.partial}</b> 2+SC</span><span><b>${s.sc}</b> SC</span>${s.pending?`<span class="warn"><b>${s.pending}</b> pendientes</span>`:''}</div>`}
function sourceBlocks(s){const labels={sofascore:'SofaScore',fotmob:'FotMob',statmuse:'StatMuse'};return `<div class="mhp-sources">${Object.entries(s.source).map(([key,v])=>`<div><span>${labels[key]||key}</span><b>${v.rated} notas</b><small>${v.sc} SC${v.pending?` · ${v.pending} pendientes`:''}</small></div>`).join('')}</div>`}
function podium(s,m){return `<div class="mhp-podium"><span>MEJORES NOTAS</span>${s.top.length?s.top.map((x,i)=>{const t=trend(x.player.name,m);return `<button data-mhp-player="${esc(x.player.name)}"><i>#${i+1}</i><div><b>${esc(display(x.player.name))}</b><small>${x.minutes}' · ${coverageLabel(x.entry)}</small></div><strong>${fmt(x.rating,2)}${t?` <em class="${t.delta>0?'up':t.delta<0?'down':''}">${t.label}${t.delta?Math.abs(t.delta).toFixed(1):''}</em>`:''}</strong></button>`}).join(''):'<p>Sin valoraciones.</p>'}</div>`}
function minutesBlock(s){return `<div class="mhp-minutes"><span>MÁS MINUTOS</span>${s.minuteTop.map(x=>`<button data-mhp-player="${esc(x.player.name)}"><div><b>${esc(display(x.player.name))}</b><small>${esc(x.player.pos)}</small></div><strong>${x.minutes}'</strong></button>`).join('')}</div>`}
function tableRows(s,m){
  const rows=[...s.rows].sort((a,b)=>(Number.isFinite(b.rating)?b.rating:-Infinity)-(Number.isFinite(a.rating)?a.rating:-Infinity)||b.minutes-a.minutes);
  return rows.map(x=>{const t=trend(x.player.name,m);return `<button class="mhp-row" data-mhp-player="${esc(x.player.name)}"><span><b>${esc(display(x.player.name))}</b><small>${esc(x.player.pos)}</small></span><span>${x.minutes}'</span><strong>${Number.isFinite(x.rating)?fmt(x.rating,2):'SC'}</strong><span class="mhp-cov ${coverageLabel(x.entry).replace(/[^a-z0-9]/gi,'').toLowerCase()}">${coverageLabel(x.entry)}</span><em class="${t?.delta>0?'up':t?.delta<0?'down':''}">${t?`${t.label}${t.delta?Math.abs(t.delta).toFixed(1):''}`:'—'}</em></button>`}).join('')
}
function detail(m){
  if(!m)return '<div class="mhp-empty">Selecciona un partido para abrir el análisis.</div>';
  const s=summary(m),idx=allMatches().findIndex(x=>x.id===m.id),leader=s.top[0];
  return `<article class="mhp-detail"><div class="mhp-detail-head"><div><span>${esc(dateLabel(m,idx))} · ${esc(m.comp)}</span><h2>Real Madrid · ${esc(m.label)}</h2><p>${s.closed?'Las fuentes de las apariciones registradas están cerradas.':'Todavía quedan apariciones con fuentes pendientes.'}</p></div><div class="mhp-detail-score"><span>Media de notas</span><b>${fmt(s.avg,2)}</b><small>${s.rated.length} jugadores calificados</small></div></div>${coveragePills(s)}<div class="mhp-detail-grid">${podium(s,m)}${minutesBlock(s)}</div>${sourceBlocks(s)}<div class="mhp-table"><div class="mhp-table-head"><span>Jugador</span><span>Min.</span><span>Nota</span><span>Cobertura</span><span>Vs anterior</span></div>${tableRows(s,m)}</div><div class="mhp-actions"><button class="btn" data-mhp-go="evolucion">Ver evolución</button><button class="btn" data-mhp-go="estadisticas">Abrir estadísticas</button>${leader?`<button class="btn primary" data-mhp-player="${esc(leader.player.name)}">Ficha de ${esc(display(leader.player.name))}</button>`:''}</div><p class="mhp-note">La nota mostrada es la oficial multifuente del proyecto. 3/3 = SofaScore + FotMob + StatMuse; 2+SC = dos notas y una fuente comprobada sin calificación. SC nunca equivale a 0.</p></article>`
}
function syncUrl(){try{const u=new URL(location.href);u.searchParams.set('section','partidos');if(selectedId)u.searchParams.set('match',selectedId);else u.searchParams.delete('match');history.replaceState(null,'',u.href)}catch{}}
function select(id,update=true){if(!allMatches().some(m=>m.id===id))return;selectedId=id;if(update)syncUrl();render()}
function bind(root){
  root.querySelectorAll('[data-mhp-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.mhpFilter;const visible=allMatches().filter(m=>filter==='ALL'||compKey(m.comp)===filter);if(!visible.some(m=>m.id===selectedId))selectedId=visible[visible.length-1]?.id||null;render()}));
  root.querySelectorAll('[data-mhp-match]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.mhpMatch)));
  root.querySelectorAll('[data-mhp-player]').forEach(b=>b.addEventListener('click',()=>safe(()=>openPlayerHub(b.dataset.mhpPlayer))));
  root.querySelectorAll('[data-mhp-go]').forEach(b=>b.addEventListener('click',()=>safe(()=>showSection(b.dataset.mhpGo))));
}
function render(){
  const section=document.getElementById('partidos'),list=document.getElementById('matchesList'),data=allMatches();if(!section||!list||!data.length)return;
  section.classList.add('match-history-pro-ready');if(!selectedId||!data.some(m=>m.id===selectedId))selectedId=data[data.length-1].id;
  let shell=document.getElementById('mhpShell');if(!shell){shell=document.createElement('div');shell.id='mhpShell';const head=section.querySelector(':scope>.section-head');head?.insertAdjacentElement('afterend',shell);list.hidden=true}
  const visible=data.filter(m=>filter==='ALL'||compKey(m.comp)===filter),chosen=data.find(m=>m.id===selectedId)||visible[visible.length-1];
  shell.innerHTML=`${archiveSummary(data)}<div class="mhp-toolbar"><div><span>HISTORIAL PRO</span><h2>Jornada a jornada</h2><p>Abre un partido para ver notas, minutos, cobertura de fuentes y evolución frente al encuentro anterior.</p></div>${filterButtons(data)}</div><div class="mhp-layout"><div class="mhp-list">${visible.map(m=>matchCard(m,data.findIndex(x=>x.id===m.id))).join('')||'<div class="mhp-empty">No hay partidos en este filtro.</div>'}</div><div class="mhp-detail-wrap">${detail(chosen)}</div></div>`;
  bind(shell);document.dispatchEvent(new CustomEvent('rm-match-history-rendered',{detail:{matchId:selectedId,filter}}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,m=q.get('match');if(m&&allMatches().some(x=>x.id===m))selectedId=m}catch{}}
function install(){if(installed)return;if(!document.getElementById('partidos')||!season()||!allMatches().length){setTimeout(install,100);return}installed=true;applyUrl();render();document.addEventListener('rm-season-data-ready',render);document.addEventListener('rm-ranking-official-ready',render);window.RMMatchHistoryPro=Object.freeze({render,select,get selected(){return selectedId}})}
install();
})();