(()=>{
const css=document.createElement('link');css.rel='stylesheet';css.href='matchday.css?v=7';css.dataset.matchdayCss='6';document.head.appendChild(css);
const performanceCss=document.createElement('link');performanceCss.rel='stylesheet';performanceCss.href='matchday-performance.css?v=2';performanceCss.dataset.matchdayPerformanceCss='2';document.head.appendChild(performanceCss);
const entry=['partido','⚽','Partido','Centro del partido','XI oficial, notas medias y análisis del encuentro.'];
const existingEntry=sections.find(s=>s[0]==='partido');if(existingEntry){existingEntry.splice(0,existingEntry.length,...entry)}else{sections.splice(1,0,entry)}
document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
let installed=false,seasonLoader=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function xmlEsc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&apos;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function matchText(match){const rival=String(match?.rival||'Rival');return match?.home===false?`${rival} vs Real Madrid`:`Real Madrid vs ${rival}`}
function official(){return safe(()=>Array.isArray(officialXI)?officialXI:null,null)}
function officialSlots(){return safe(()=>window.RMOfficialXIBySlot,null)||safe(()=>typeof officialXIBySlot!=='undefined'?officialXIBySlot:null,null)}
function formatKickoff(value){
  const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Horario pendiente';
  try{return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(d)}catch{return d.toLocaleString('es-ES')}
}
function formatClock(value){
  const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
  try{return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(d)}catch{return d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}
}
function phase(){
  const m=safe(()=>predictionMatch,null),real=official(),now=Date.now(),deadline=Date.parse(m?.deadline||''),kickoff=Date.parse(m?.kickoff||''),analyzed=Boolean(performanceData());
  if(analyzed)return {id:'analyzed',label:'Analizado',clock:'Datos cerrados'};
  if(real&&Number.isFinite(kickoff)&&now<kickoff)return {id:'official',label:'XI oficial',clock:'Once confirmado'};
  if(Number.isFinite(kickoff)&&now>=kickoff&&now<kickoff+3*60*60*1000)return {id:'live',label:'Partido',clock:'En juego'};
  if(Number.isFinite(kickoff)&&now>=kickoff+3*60*60*1000)return {id:'post',label:'Postpartido',clock:real?'Esperando notas':'Esperando XI y datos'};
  if(Number.isFinite(deadline)&&now>=deadline)return {id:'locked',label:'Previa',clock:'Predicción cerrada'};
  return {id:'pre',label:'Previa',clock:'Predicción abierta'};
}
function previewHtml(){
  if(official())return '';
  const m=safe(()=>predictionMatch,null);if(!m)return '';
  const p=phase(),teams=matchText(m),kickoff=formatKickoff(m.kickoff),deadline=formatClock(m.deadline);
  return `<section class="card md-preview"><div class="md-preview-head"><div><span class="md-label">PRÓXIMO PARTIDO · ${esc(m.comp||'')}</span><h2>${esc(teams)}</h2><p>Previa del partido actual. No se muestran XI, marcador, notas ni eventos hasta que existan datos oficiales.</p></div><div class="md-preview-state"><b>${esc(p.label)}</b><small>${esc(p.clock)}</small></div></div><div class="md-preview-meta"><div><span>Fecha y hora</span><b>${esc(kickoff)}</b></div><div><span>Estadio</span><b>${esc(m.venue||'Pendiente')}</b></div><div><span>Cierre de predicción</span><b>${deadline?esc(deadline):'Pendiente'}</b></div></div><div class="actions md-preview-actions"><button class="btn primary" type="button" onclick="showSection('prediccion')">${p.id==='pre'?'Hacer / revisar mi XI':'Ver mi predicción'}</button><button class="btn" type="button" onclick="showSection('comunidad')">Ver comunidad</button></div></section>`;
}

function ensure(){if(document.getElementById('partido'))return document.getElementById('partido');const pred=document.getElementById('prediccion');if(!pred)return null;pred.insertAdjacentHTML('beforebegin','<section class="section" id="partido"><div id="matchdayDynamic"></div></section>');return document.getElementById('partido')}
function loadScriptOnce(src){return new Promise(resolve=>{const existing=[...document.scripts].find(s=>String(s.src||'').includes(src.split('?')[0]));if(existing){if(existing.dataset.rmLoaded==='1'||existing.readyState==='complete'){resolve();return}existing.addEventListener('load',resolve,{once:true});setTimeout(resolve,700);return}const s=document.createElement('script');s.src=src;s.async=false;s.addEventListener('load',()=>{s.dataset.rmLoaded='1';resolve()},{once:true});s.addEventListener('error',resolve,{once:true});document.head.appendChild(s)})}
function matchKey(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function currentSeasonMatch(){
  const data=window.RMSeasonData,current=safe(()=>predictionMatch,null);if(!data||!current)return null;
  const rivalKey=matchKey(current.rival),idKey=matchKey(current.id);
  return (data.matches||[]).find(m=>{
    const labelKey=matchKey(m.label),matchId=matchKey(m.id);
    return (rivalKey&&labelKey===rivalKey)||(matchId&&idKey.startsWith(matchId));
  })||null;
}
function seasonMatchReady(){return Boolean(currentSeasonMatch())}
function ensureSeasonExtension(){if(seasonMatchReady())return Promise.resolve(true);if(seasonLoader)return seasonLoader;seasonLoader=loadScriptOnce('season-input.js?v=3').then(()=>loadScriptOnce('season-extension.js?v=7')).then(()=>{setTimeout(render,0);return seasonMatchReady()});return seasonLoader}
function fmtRating(v){return Number.isFinite(v)?Number(v).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'}
function ratingTone(v){if(!Number.isFinite(v))return 'pending';if(v>=8)return 'elite';if(v>=7)return 'good';if(v<6.5)return 'low';return 'normal'}
function ratingColor(v){if(!Number.isFinite(v))return '#8ea2b5';if(v>=8)return '#d8b44a';if(v>=7)return '#47d18c';if(v<6.5)return '#eb6969';return '#72a8d9'}
function playerInitials(name){return String(name||'').split(/[ .-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'RM'}
function performanceData(){
  const data=window.RMSeasonData,match=currentSeasonMatch(),slotMap=officialSlots(),real=official(),slotDefs=safe(()=>slots,[])||[];if(!data||!match||!slotMap||!real||slotDefs.length!==11)return null;
  const starters=slotDefs.map(s=>{const name=slotMap[s[0]]||'';if(!name)return null;const entry=safe(()=>data.officialRatingEntry?.(match.id,name),null),minutes=safe(()=>data.minutes?.(match.id,name),null);return {key:s[0],label:s[1],x:s[2],y:s[3],name,display:display(name),rating:entry?.value??null,entry,minutes:Number.isFinite(minutes)?minutes:null}}).filter(Boolean);
  if(starters.length!==11)return null;
  const rated=starters.filter(x=>Number.isFinite(x.rating)),avg=rated.length?rated.reduce((sum,x)=>sum+x.rating,0)/rated.length:null,starterSet=new Set(starters.map(x=>canonical(x.name)));
  const bench=(safe(()=>players,[])||[]).map(p=>{if(starterSet.has(canonical(p.name)))return null;const minutes=safe(()=>data.minutes?.(match.id,p.name),null);if(!Number.isFinite(minutes)||minutes<=0)return null;const entry=safe(()=>data.officialRatingEntry?.(match.id,p.name),null);return {name:p.name,display:display(p.name),minutes,rating:entry?.value??null,entry}}).filter(Boolean).sort((a,b)=>b.minutes-a.minutes);
  return {data,match,starters,rated,avg,bench};
}
function lineupSvg(p){
  const current=safe(()=>predictionMatch,null),rival=xmlEsc(current?.rival||p.match?.label||'Rival'),fixture=xmlEsc(matchText(current));
  const playersSvg=p.starters.map(row=>{
    const cx=80+(Number(row.x)||50)*8.4,cy=105+(Number(row.y)||50)*10.15,tone=ratingColor(row.rating),name=xmlEsc(row.display),rating=xmlEsc(fmtRating(row.rating)),mins=row.minutes!==null?`${row.minutes}'`:'';
    return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})"><circle r="48" fill="#102438" stroke="${tone}" stroke-width="4"/><text x="0" y="8" text-anchor="middle" fill="#f6f8fb" font-size="25" font-weight="800" font-family="Arial, sans-serif">${xmlEsc(playerInitials(row.display))}</text><rect x="23" y="-64" width="70" height="38" rx="19" fill="${tone}"/><text x="58" y="-38" text-anchor="middle" fill="#071421" font-size="21" font-weight="900" font-family="Arial, sans-serif">${rating}</text><text x="0" y="79" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="800" font-family="Arial, sans-serif">${name}</text><text x="0" y="105" text-anchor="middle" fill="#9fb0c1" font-size="17" font-family="Arial, sans-serif">${xmlEsc(mins)}</text></g>`
  }).join('');
  const title=xmlEsc(matchText(safe(()=>predictionMatch,null))),avg=xmlEsc(fmtRating(p.avg));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1250" viewBox="0 0 1000 1250"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#153f35"/><stop offset="1" stop-color="#09251f"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".35"/></filter></defs><rect width="1000" height="1250" rx="34" fill="#071421"/><text x="60" y="62" fill="#d8b44a" font-size="24" font-weight="900" font-family="Arial, sans-serif" letter-spacing="2">XI OFICIAL · NOTA COMBINADA</text><text x="60" y="100" fill="#ffffff" font-size="34" font-weight="900" font-family="Arial, sans-serif">${fixture}</text><text x="940" y="78" text-anchor="end" fill="#ffffff" font-size="20" font-weight="700" font-family="Arial, sans-serif">Media XI</text><text x="940" y="108" text-anchor="end" fill="#d8b44a" font-size="34" font-weight="900" font-family="Arial, sans-serif">${avg}</text><rect x="54" y="138" width="892" height="1058" rx="28" fill="url(#bg)" stroke="#547a70" stroke-width="3"/><rect x="78" y="162" width="844" height="1010" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><line x1="78" y1="667" x2="922" y2="667" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><circle cx="500" cy="667" r="92" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><circle cx="500" cy="667" r="5" fill="#d8e9e3" fill-opacity=".45"/><rect x="333" y="162" width="334" height="130" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><rect x="408" y="162" width="184" height="55" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><rect x="333" y="1042" width="334" height="130" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><rect x="408" y="1117" width="184" height="55" fill="none" stroke="#d8e9e3" stroke-opacity=".32" stroke-width="3"/><g filter="url(#shadow)">${playersSvg}</g></svg>`
}
function lineupImageHtml(p){const svg=lineupSvg(p),src=`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;return `<figure class="md-official-lineup-image"><img src="${src}" alt="XI oficial del Real Madrid contra ${esc(p.match?.label||'el rival')} con la nota combinada de cada titular"><figcaption>Nota combinada de SofaScore + FotMob + StatMuse. La imagen se genera automáticamente con el XI y las notas de la jornada.</figcaption></figure>`}
function analysisHtml(p){
  const ordered=[...p.rated].sort((a,b)=>b.rating-a.rating||b.minutes-a.minutes),top=ordered.slice(0,3),low=[...ordered].sort((a,b)=>a.rating-b.rating||b.minutes-a.minutes).slice(0,3),complete=p.starters.filter(x=>x.entry?.complete).length;
  const topText=top.length?top.map((x,i)=>`${i?i===top.length-1?' y ':', ':''}${display(x.name)} (${fmtRating(x.rating)})`).join(''):'Sin notas cerradas';
  const lowText=low.length?low.map((x,i)=>`${i?i===low.length-1?' y ':', ':''}${display(x.name)} (${fmtRating(x.rating)})`).join(''):'Sin notas cerradas';
  return `<article class="md-match-analysis"><div class="md-analysis-head"><div><span class="md-label">ANÁLISIS DEL PARTIDO</span><h3>Lectura de las notas</h3></div><div class="md-analysis-average"><small>Media XI</small><b>${fmtRating(p.avg)}</b></div></div><p class="md-analysis-intro">Análisis objetivo a partir de las valoraciones combinadas de SofaScore, FotMob y StatMuse.</p><div class="md-analysis-points"><div><span>★</span><p><b>Mejores medias.</b> ${esc(topText)}.</p></div><div><span>↘</span><p><b>Zona más baja.</b> ${esc(lowText)}.</p></div><div><span>✓</span><p><b>Cobertura.</b> ${complete}/11 titulares tienen las tres fuentes cerradas${complete===11?' y la comparación del XI es completa.':'.'}</p></div></div></article>`
}
function subsHtml(p){if(!p.bench.length)return '';return `<details class="md-used-subs"><summary><span>SUPLENTES UTILIZADOS</span><b>${p.bench.length}</b><strong>+</strong></summary><div class="md-sub-list">${p.bench.map(x=>`<div><span><b>${esc(x.display)}</b><small>${x.minutes}'${x.entry?.complete?' · 3/3':x.entry?.status==='closed-partial'?` · ${x.entry.sourceCount}+SC`:''}</small></span><strong class="${ratingTone(x.rating)}">${fmtRating(x.rating)}</strong></div>`).join('')}</div></details>`}
function currentDraftEntry(){
  const current=safe(()=>predictionMatch,null),entries=window.RMSeasonMatchEntries;if(!current||!Array.isArray(entries))return null;
  const rival=matchKey(current.rival),id=matchKey(current.id);
  return entries.find(e=>matchKey(e.id)===id||matchKey(e.label)===rival||id.startsWith(matchKey(e.id)))||null;
}
function provisionalRatingsHtml(){
  if(!official())return '';
  const draft=currentDraftEntry();if(!draft||draft.final!==false||!draft.players)return '';
  const rows=Object.entries(draft.players).filter(([,r])=>Number(r?.minutes)>0).map(([name,r])=>({name,minutes:Number(r.minutes),rating:Number.isFinite(Number(r.statmuse))?Number(r.statmuse):null,note:r.note||''}));
  if(!rows.length)return '';
  const avg=rows.filter(r=>Number.isFinite(r.rating)).reduce((a,r)=>a+r.rating,0)/(rows.filter(r=>Number.isFinite(r.rating)).length||1);
  const body=rows.map(r=>`<tr><td><b>${esc(display(r.name))}</b>${r.note?`<small style="display:block;color:var(--muted);margin-top:2px">${esc(r.note)}</small>`:''}</td><td>${esc(r.minutes)}'</td><td>${Number.isFinite(r.rating)?r.rating.toFixed(1):'—'}</td></tr>`).join('');
  return `<section class="card md-performance" style="margin-top:16px"><div class="section-head" style="margin-top:0"><div><span class="md-label">MINUTOS · NOTA PROVISIONAL</span><h2>Atlético 2-1 Real Madrid</h2><p>Minutos y cambios ya verificados. La nota mostrada es únicamente la de StatMuse; no entra todavía en la media histórica de 3 fuentes.</p></div><div class="md-team-rating"><span>MEDIA STATMUSE</span><b>${avg.toFixed(2)}</b><small>provisional · 1/3 fuentes</small></div></div><div style="overflow:auto"><table class="table"><thead><tr><th>Jugador</th><th>Min.</th><th>StatMuse</th></tr></thead><tbody>${body}</tbody></table></div><p class="muted" style="margin:10px 0 0;font-size:11px">La media oficial del proyecto se cerrará cuando estén verificadas también SofaScore y FotMob para cada jugador.</p></section>`;
}
function performanceHtml(){
  const p=performanceData();if(!official())return '';
  if(!p){ensureSeasonExtension();return `<section class="card md-performance md-performance-wait"><div><span class="md-label">XI OFICIAL · NOTAS MEDIAS</span><h2>Cargando notas</h2><p>El XI oficial ya está publicado. Estamos cargando las valoraciones cerradas del partido.</p></div></section>`}
  return `<section class="card md-performance"><div class="section-head md-performance-title" style="margin-top:0"><div><span class="md-label">XI OFICIAL · NOTAS MEDIAS</span><h2>Once confirmado</h2><p>Representación visual del XI oficial con la media combinada de cada titular.</p></div><div class="md-team-rating"><span>MEDIA DEL XI</span><b>${fmtRating(p.avg)}</b><small>${p.starters.filter(x=>x.entry?.complete).length}/11 con 3/3</small></div></div><div class="md-performance-grid md-performance-image-grid">${lineupImageHtml(p)}${analysisHtml(p)}</div>${subsHtml(p)}</section>`
}
function headerHtml(){
  const real=official(),p=phase(),m=safe(()=>predictionMatch,null);
  return `<div class="section-head md-section-head"><div><h2>Centro del partido</h2><p>${real?'XI oficial, resultado, comparación de pronósticos y análisis cuando estén verificadas las notas.':`Previa de ${esc(matchText(m))}. Los datos del encuentro aparecerán solo cuando estén confirmados.`}</p></div><span class="pill ${real?'closed':'open'}">${esc(p.label)} · ${esc(p.clock)}</span></div>`
}
function finalResultHtml(){
  const m=safe(()=>predictionMatch,null),r=m?.result;if(!r)return '';
  const t=m.home===false?{home:m.rival,away:'Real Madrid'}:{home:'Real Madrid',away:m.rival};
  return `<section class="card" style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><span class="md-label">RESULTADO FINAL · ${esc(m.comp||'')}</span><h2 style="margin:5px 0 4px">${esc(t.home)} ${esc(r.home)} - ${esc(r.away)} ${esc(t.away)}</h2><p class="muted" style="margin:0">Jornada cerrada. El XI oficial ya está publicado y las predicciones se han puntuado.</p></div><span class="pill closed">FINAL</span></div></section>`;
}
function xiValues(xi){return Object.values(xi||{}).filter(Boolean)}
function validXi(xi){const values=xiValues(xi);return values.length===11&&new Set(values).size===11}
function communityXi(){
  const rows=window.RMCommunityData?.popularXI,defs=safe(()=>slots,[])||[];if(!rows||defs.length!==11)return null;
  const xi={};for(const s of defs){const row=rows[s[0]];xi[s[0]]=typeof row==='string'?row:row?.name||''}return validXi(xi)?xi:null;
}
function scoreVsOfficial(xi){const real=official();if(!validXi(xi)||!real)return null;const actual=new Set(real.map(canonical));return xiValues(xi).filter(name=>actual.has(canonical(name))).length}
function xiComparisonHtml(){
  const real=official();if(!real)return '';
  const saved=safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null),mine=validXi(saved?.xi)?saved.xi:null,community=communityXi(),mineScore=scoreVsOfficial(mine),communityScore=scoreVsOfficial(community);
  const mineSet=new Set(xiValues(mine).map(canonical)),communitySet=new Set(xiValues(community).map(canonical)),overlap=mine&&community?[...mineSet].filter(name=>communitySet.has(name)).length:null;
  const metric=(label,value,hint)=>`<div class="card kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="hint">${esc(hint)}</div></div>`;
  const mineValue=Number.isFinite(mineScore)?`${mineScore}/11`:'—',communityValue=Number.isFinite(communityScore)?`${communityScore}/11`:'—';
  const mineHint=mine?'titulares acertados':'No guardaste un XI para este partido',communityHint=community?'titulares acertados':'Consenso comunitario no disponible';
  return `<section class="card md-xi-compare" style="margin-top:16px"><div class="section-head" style="margin-top:0"><div><span class="md-label">TU PREDICCIÓN · COMUNIDAD · XI OFICIAL</span><h2>Tu XI y la comunidad frente al oficial</h2><p>Misma regla para ambos: 1 punto por cada jugador que aparezca en el once oficial, sin importar la posición exacta.</p></div></div><div class="grid cols-3">${metric('TU PREDICCIÓN',mineValue,mineHint)}${metric('COMUNIDAD',communityValue,communityHint)}${metric('COINCIDENCIA',Number.isFinite(overlap)?`${overlap}/11`:'—',Number.isFinite(overlap)?'jugadores que elegisteis ambos':'Se calcula cuando existen los dos XI')}</div><div class="actions" style="justify-content:flex-start;margin-top:14px"><button class="btn" onclick="showSection('prediccion')">Ver mi predicción</button><button class="btn" onclick="showSection('comunidad')">Ver comunidad</button></div></section>`
}
function writtenAnalysisHtml(){
  if(!official())return '';
  const current=safe(()=>predictionMatch,null);
  if(current?.id==='atletico-2026-09-20')return `<article class="card md-match-analysis" style="margin-top:16px"><div class="md-analysis-head"><div><span class="md-label">ANÁLISIS POSTPARTIDO</span><h3>Atlético 2-1 Real Madrid · la expulsión cambió el partido</h3></div></div><p style="margin:16px 0 0;color:#c7d3df;font-size:14px;line-height:1.72">La primera parte fue cerrada y con pocas ocasiones claras. El punto de ruptura llegó en el 52': Huijsen fue expulsado tras derribar a Giuliano cuando era último defensor. Grimaldo convirtió el penalti y, seis minutos después, Jonathan David hizo el 2-0. Con diez, Mourinho reaccionó de inmediato con Rüdiger y Diomande por Güler y Vinícius y el Madrid pasó a un 4-4-1.</p><p style="margin:14px 0 0;color:#c7d3df;font-size:14px;line-height:1.72">El Atlético controló territorialmente la segunda mitad. SofaScore registró un 61% de posesión total, 17 tiros a 8 y 2,28 xG frente a 0,32 del Madrid. Courtois sostuvo al equipo con cinco paradas y una nota SofaScore de 8,6. En ataque, Diomande fue el revulsivo más peligroso y tuvo la ocasión más clara en el 77'. Bernardo entró en el 82' y asistió a Rüdiger en el 89' para el 2-1, pero la reacción llegó demasiado tarde.</p><div class="md-analysis-points" style="margin-top:16px"><div><span>▥</span><p><b>Lectura del partido.</b> Antes de la roja el derbi estaba equilibrado y de poco volumen ofensivo; después, el Madrid perdió capacidad para presionar y atacar con continuidad. Los cambios mejoraron la amenaza individual, especialmente con Diomande y Bernardo, pero no compensaron la inferioridad numérica.</p></div><div><span>⚠</span><p><b>Contexto arbitral.</b> El club señaló dos acciones de la primera parte sobre Bellingham y Valverde que consideró merecedoras de expulsión. El análisis del proyecto las conserva como contexto, separado del rendimiento futbolístico.</p></div></div></article>`;
  const match=currentSeasonMatch();if(!match||match.id!=='elche')return '';
  return `<article class="card md-match-analysis" style="margin-top:16px"><div class="md-analysis-head"><div><span class="md-label">CRÓNICA</span><h3>Elche 2-3 Real Madrid · dos caras muy diferentes</h3></div></div><p style="margin:16px 0 0;color:#c7d3df;font-size:14px;line-height:1.72">El Real Madrid mostró dos caras muy diferentes en Elche. En la primera parte fue vertical, agresivo y generó numerosas situaciones de peligro. Tchouaméni dio equilibrio, Valverde encontró espacios para avanzar y Güler volvió a ser el principal foco creativo, mientras Diomandé firmó su actuación más influyente hasta ahora. El 0-2 al descanso pudo incluso quedarse corto.</p><p style="margin:14px 0 0;color:#c7d3df;font-size:14px;line-height:1.72">El problema volvió a aparecer tras el descanso. El Madrid perdió intensidad y, sobre todo, control del partido. El Elche fue creciendo hasta igualar un encuentro que parecía decidido. Con el 2-2, Mourinho arriesgó con los cambios y el talento individual terminó resolviendo: Bellingham inició la acción, Mbappé asistió y Carlos Espí apareció en el añadido para marcar el 2-3.</p><div class="md-analysis-points" style="margin-top:16px"><div><span>▥</span><p><b>Conclusión.</b> Tres puntos importantes, pero otro aviso. El Madrid genera mucho cuando acelera, aunque todavía necesita aprender a controlar los partidos cuando tiene ventaja.</p></div></div></article>`
}
function requestCommunity(){const loader=safe(()=>typeof loadCommunity==='function'?loadCommunity:null,null);if(!loader)return;Promise.resolve(loader(false)).then(()=>setTimeout(render,0)).catch(()=>{})}
function render(){
  const section=ensure();if(!section)return;let root=document.getElementById('matchdayDynamic');if(!root){root=document.createElement('div');root.id='matchdayDynamic';section.appendChild(root)}
  root.innerHTML=`${headerHtml()}${finalResultHtml()}${previewHtml()}${performanceHtml()}${provisionalRatingsHtml()}${writtenAnalysisHtml()}${xiComparisonHtml()}`;
}
function install(){if(installed)return;const section=ensure();if(!section){setTimeout(install,100);return}installed=true;render();ensureSeasonExtension();const base=showSection;showSection=function(id){base(id);if(id==='partido'){ensureSeasonExtension();requestCommunity();setTimeout(render,0)}};document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-data-ready',()=>{seasonLoader=null;setTimeout(render,20)});document.addEventListener('rm-season-extension-ready',()=>setTimeout(render,20));document.addEventListener('rm-community-updated',()=>setTimeout(render,0));window.RMMatchdayCenter=Object.freeze({render,phase,performance:performanceData,comparison:xiComparisonHtml})}
install();
})();