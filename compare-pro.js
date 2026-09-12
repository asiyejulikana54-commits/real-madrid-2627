(()=>{
let installed=false;
const DUELS=[
  ['Dumfries','Trent Alexander-Arnold','LD'],
  ['Konaté','Rüdiger','DFC'],
  ['Huijsen','Konaté','DFC'],
  ['Cucurella','Álvaro Carreras','LI'],
  ['Diomande','Brahim Díaz','ED']
];
const PERFORMANCE_KEYS=new Set(['rating','power','recent','efficiency']);
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function player(name){return safe(()=>players.find(p=>p.name===name||p.short===name),null)}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function rating(m){return m?safe(()=>currentRating(m),Number.isFinite(m.rating)?m.rating:null):null}
function recent(name){return safe(()=>window.RMSeasonData?.recentRating?.(name,3),null)}
function seasonMatches(){return safe(()=>window.RMSeasonData?.matches,[])||[]}
function official(matchId,name){return safe(()=>window.RMSeasonData?.officialRatingEntry?.(matchId,name),null)}
function matchMinutes(matchId,name){
  const data=window.RMSeasonData,entry=safe(()=>data?.minuteEntry?.(matchId,name),null),direct=safe(()=>data?.minutes?.(matchId,name),null),value=Number.isFinite(entry?.value)?Number(entry.value):Number.isFinite(direct)?Number(direct):0;
  return Math.max(0,value);
}
function power(name,m,r){
  const c=canonical(name),officialRow=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===c),null);
  if(Number.isFinite(officialRow?.power))return officialRow.power;
  return m&&Number.isFinite(r)?r*(.75+.25*Math.min(m.minutes||0,450)/450):null;
}
function efficiencyRank(name){const c=canonical(name),rows=[...safe(()=>efficiencyRanking,[])].sort((a,b)=>(a.minPerPoint??Infinity)-(b.minPerPoint??Infinity));const i=rows.findIndex(x=>canonical(x.name)===c);return i>=0?i+1:null}
function powerRank(name){
  const c=canonical(name),rows=safe(()=>players,[]).map(p=>{const m=metric(p),r=rating(m),pow=power(p.name,m,r);return Number.isFinite(pow)?{name:p.name,power:pow}:null}).filter(Boolean).sort((a,b)=>b.power-a.power);const i=rows.findIndex(x=>canonical(x.name)===c);return i>=0?i+1:null;
}
function roles(p){
  const eligible=Array.isArray(p?.eligible)?p.eligible.filter(Boolean):[];
  return eligible.length?[...new Set(eligible)]:p?.pos?[p.pos]:[];
}
function roleLabel(p){const r=roles(p);return r.length?r.join(' / '):(p?.pos||'')}
function row(name){
  const p=player(name),m=metric(p),r=rating(m),form=recent(p?.name),minutes=m?.minutes||0;
  return {p,m,r,power:power(p?.name,m,r),recent:Number.isFinite(form?.value)?form.value:null,recentN:form?.n||0,efficiency:Number.isFinite(m?.minPerPoint)?m.minPerPoint:null,minutes,sample:Math.min(minutes,450)/450,effRank:efficiencyRank(p?.name),powerRank:powerRank(p?.name)};
}
function cmp(a,b,higher=true,tolerance=0){if(!Number.isFinite(a)||!Number.isFinite(b))return 0;const d=a-b;if(Math.abs(d)<=tolerance)return 0;return higher?(d>0?1:-1):(d<0?1:-1)}
const METRICS=[
  {key:'rating',label:'Media',get:x=>x.r,higher:true,tol:.05,impact:.22,weight:.30,fmt:v=>fmt(v,2),help:'Media combinada de las fuentes disponibles.'},
  {key:'power',label:'Power RM',get:x=>x.power,higher:true,tol:.05,impact:.22,weight:.15,fmt:v=>fmt(v,2),help:'Rendimiento ajustado por tamaño de muestra.'},
  {key:'recent',label:'Forma reciente',get:x=>x.recent,higher:true,tol:.05,impact:.30,weight:.30,fmt:v=>fmt(v,2),help:'Media de hasta los 3 últimos partidos con nota.'},
  {key:'efficiency',label:'Min / punto',get:x=>x.efficiency,higher:false,tol:.15,impactRatio:.15,weight:.25,fmt:v=>fmt(v,2),help:'Menor es mejor: minutos necesarios para generar un punto de aporte.'},
  {key:'minutes',label:'Minutos',get:x=>x.minutes,higher:true,tol:15,fmt:v=>Number.isFinite(v)?String(Math.round(v)):'—',help:'Volumen total jugado; sirve como contexto de fiabilidad.'},
  {key:'sample',label:'Muestra',get:x=>x.sample,higher:true,tol:.03,fmt:v=>Number.isFinite(v)?`${Math.round(v*100)}%`:'—',help:'Peso de muestra hasta 450 minutos.'}
];
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function avg(values){return values.length?values.reduce((s,v)=>s+v,0)/values.length:null}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function signedImpact(m,av,bv){
  if(!Number.isFinite(av)||!Number.isFinite(bv)||!PERFORMANCE_KEYS.has(m.key))return null;
  const oriented=m.higher?av-bv:bv-av;
  if(Number.isFinite(m.impactRatio)){const base=Math.max((Math.abs(av)+Math.abs(bv))/2,1);return clamp(oriented/(base*m.impactRatio),-2,2)}
  return clamp(oriented/Math.max(m.impact||1,m.tol||0),-2,2);
}
function weightedImpact(details){
  const weighted=details.filter(x=>Number.isFinite(x.impact)&&Number.isFinite(x.m.weight)&&x.m.weight>0),weight=weighted.reduce((s,x)=>s+x.m.weight,0);
  return weight?weighted.reduce((s,x)=>s+x.impact*x.m.weight,0)/weight:0;
}
function impactBand(score,available){
  if(!available)return {winner:0,key:'none',label:'Sin lectura suficiente'};
  const abs=available===1?Math.min(Math.abs(score),.44):Math.abs(score),winner=score>.18?1:score<-.18?-1:0;
  if(!winner)return {winner:0,key:'balanced',label:'Duelo equilibrado'};
  if(abs<.45)return {winner,key:'slight',label:'Ventaja ligera'};
  if(abs<.85)return {winner,key:'clear',label:'Ventaja clara'};
  return {winner,key:'strong',label:'Ventaja fuerte'};
}
function metricImpactBand(impact,c){
  if(!Number.isFinite(impact))return {key:'missing',label:'Sin comparación'};
  if(c===0)return {key:'tie',label:'Empate técnico'};
  const abs=Math.abs(impact);
  if(abs<.45)return {key:'slight',label:'Ventaja ligera'};
  if(abs<.85)return {key:'clear',label:'Ventaja clara'};
  return {key:'strong',label:'Ventaja fuerte'};
}
function sharedWeightedAvg(rows,valueKey){
  const weighted=rows.map(r=>({value:r[valueKey],weight:r.sharedWeight})).filter(r=>Number.isFinite(r.value)&&Number.isFinite(r.weight)&&r.weight>0),weight=weighted.reduce((s,r)=>s+r.weight,0);if(!weight)return null;
  return weighted.reduce((s,r)=>s+r.value*r.weight,0)/weight;
}
function jornadaLabel(match,index){return `J${index+1} · ${match.short||match.label||match.id}`}
function globalWinner(v){return Number.isFinite(v?.impactWinner)?v.impactWinner:(v.aw>v.bw?1:v.bw>v.aw?-1:0)}
function commonSample(a,b){
  const rows=seasonMatches().map((match,index)=>{
    const ae=official(match.id,a.p?.name),be=official(match.id,b.p?.name),av=Number.isFinite(ae?.value)?Number(ae.value):null,bv=Number.isFinite(be?.value)?Number(be.value):null;
    const comparable=av!==null&&bv!==null,am=comparable?matchMinutes(match.id,a.p?.name):0,bm=comparable?matchMinutes(match.id,b.p?.name):0,sharedWeight=comparable?Math.max(1,Math.min(am||1,bm||1)):0,c=comparable?cmp(av,bv,true,.05):0;
    return {match,index,av,bv,am,bm,sharedWeight,comparable,winner:comparable?c:null,delta:comparable?av-bv:null};
  });
  const shared=rows.filter(x=>x.comparable),aw=shared.filter(x=>x.winner>0).length,bw=shared.filter(x=>x.winner<0).length,ties=shared.filter(x=>x.winner===0).length;
  const aAvg=avg(shared.map(x=>x.av)),bAvg=avg(shared.map(x=>x.bv)),simpleDelta=Number.isFinite(aAvg)&&Number.isFinite(bAvg)?aAvg-bAvg:null,simpleWinner=cmp(aAvg,bAvg,true,.05);
  const aMinutes=shared.reduce((s,x)=>s+x.am,0),bMinutes=shared.reduce((s,x)=>s+x.bm,0),sharedMinutes=shared.reduce((s,x)=>s+x.sharedWeight,0),aWeighted=sharedWeightedAvg(shared,'av'),bWeighted=sharedWeightedAvg(shared,'bv'),weightedDelta=Number.isFinite(aWeighted)&&Number.isFinite(bWeighted)?aWeighted-bWeighted:null,winner=cmp(aWeighted,bWeighted,true,.05);
  return {rows,shared,aw,bw,ties,aAvg,bAvg,simpleDelta,simpleWinner,aWeighted,bWeighted,weightedDelta,winner,aMinutes,bMinutes,sharedMinutes,coverage:rows.length?shared.length/rows.length:0};
}
function verdictConfidence(a,b,available,common,countWinner,impactWinner){
  const ar=roles(a.p),br=roles(b.p),sharedRoles=ar.filter(pos=>br.includes(pos)),minSample=Math.min(a.sample||0,b.sample||0),coverage=available/PERFORMANCE_KEYS.size,commonDepth=Math.min((common?.shared?.length||0)/3,1),roleFactor=sharedRoles.length?1:.75,agreement=countWinner&&impactWinner&&countWinner!==impactWinner?.78:1;
  let score=(.42*minSample+.28*coverage+.18*commonDepth+.12*roleFactor)*agreement;
  if(available<=1)score=Math.min(score,.44);else if(available===2)score=Math.min(score,.68);
  score=clamp(score,0,1);
  const label=score>=.78?'Confianza alta':score>=.55?'Confianza media':'Confianza baja';
  return {score,label,sharedRoles};
}
function verdict(a,b,common){
  let aw=0,bw=0,ties=0;const details=[];
  for(const m of METRICS.filter(x=>PERFORMANCE_KEYS.has(x.key))){
    const av=m.get(a),bv=m.get(b);if(!Number.isFinite(av)||!Number.isFinite(bv))continue;
    const c=cmp(av,bv,m.higher,m.tol),impact=signedImpact(m,av,bv);if(c>0)aw++;else if(c<0)bw++;else ties++;
    details.push({m,av,bv,c,impact:Number.isFinite(impact)?impact:0});
  }
  const available=details.length,impactScore=available?weightedImpact(details):0,band=impactBand(impactScore,available),impactWinner=band.winner,countWinner=aw>bw?1:bw>aw?-1:0;
  const strongest=[...details].sort((x,y)=>Math.abs(y.impact*y.m.weight)-Math.abs(x.impact*x.m.weight))[0]||null,an=display(a.p?.name||''),bn=display(b.p?.name||''),impactLeader=impactWinner>0?an:impactWinner<0?bn:null,countLeader=countWinner>0?an:countWinner<0?bn:null;
  const conf=verdictConfidence(a,b,available,common,countWinner,impactWinner);
  let title='Duelo prácticamente igualado',copy=available?`${an} y ${bn} están muy cerca cuando además de contar categorías medimos cuánto se separan realmente en cada indicador.`:'Todavía no hay métricas de rendimiento suficientes para comparar a ambos jugadores.';
  if(impactWinner){
    title=`${impactLeader}: ${band.label.toLowerCase()}`;
    if(countWinner===impactWinner)copy=`El ${aw}-${bw} por categorías y la magnitud ponderada apuntan al mismo jugador. La mayor separación útil aparece en ${strongest?.m?.label||'los indicadores disponibles'}.`;
    else if(!countWinner)copy=`El marcador por categorías queda ${aw}-${bw}, pero al medir la magnitud ponderada de cada diferencia el duelo se inclina hacia ${impactLeader}. La mayor separación útil aparece en ${strongest?.m?.label||'los indicadores disponibles'}.`;
    else copy=`El recuento de categorías favorece a ${countLeader} (${aw}-${bw}), pero ${impactLeader} compensa con diferencias de mayor tamaño. La separación más influyente está en ${strongest?.m?.label||'los indicadores disponibles'}.`;
  }else if(countWinner){
    copy=`El marcador por categorías favorece a ${countLeader} (${aw}-${bw}), pero las diferencias son demasiado pequeñas en conjunto para hablar de una ventaja práctica clara.`;
  }
  const min=Math.min(a.minutes,b.minutes),max=Math.max(a.minutes,b.minutes);let note='La confianza combina tamaño de muestra, cobertura de métricas, jornadas comunes y compatibilidad de rol.';
  if(min<90)note+=' Al menos uno está por debajo de 90 minutos, así que el resultado puede moverse mucho.';
  else if(min<270)note+=' La muestra todavía es intermedia y puede cambiar con pocos partidos.';
  if(available===1)note+=' Solo existe una métrica de rendimiento comparable, por lo que la intensidad queda limitada a ventaja ligera.';
  if(max-min>=180)note+=' Hay una diferencia importante de minutos totales entre ambos.';
  if(available<PERFORMANCE_KEYS.size)note+=` Se usan ${available} de ${PERFORMANCE_KEYS.size} métricas; las ausentes no cuentan como empate.`;
  if(countWinner&&impactWinner&&countWinner!==impactWinner)note+=' El recuento y la magnitud apuntan a jugadores distintos, reduciendo la confianza del veredicto.';
  if(!conf.sharedRoles.length)note+=' Sus roles no son directamente equivalentes, así que no debe leerse como un “mejor jugador” universal.';
  else note+=` Comparten rol comparable: ${conf.sharedRoles.join(' / ')}.`;
  return {aw,bw,ties,available,countWinner,impactWinner,impactScore,bandKey:band.key,bandLabel:band.label,strongestMetric:strongest?.m?.key||null,title,copy,confidence:conf.label,confidenceScore:conf.score,sharedRoles:conf.sharedRoles,note};
}
function metricRow(m,a,b){
  const av=m.get(a),bv=m.get(b),both=Number.isFinite(av)&&Number.isFinite(bv),c=both?cmp(av,bv,m.higher,m.tol):0,aWin=both&&c>0,bWin=both&&c<0,tie=both&&c===0,impact=PERFORMANCE_KEYS.has(m.key)&&both?signedImpact(m,av,bv):null,impactInfo=PERFORMANCE_KEYS.has(m.key)?metricImpactBand(impact,c):null;
  const reading=impactInfo?`<em>${esc(impactInfo.label)}</em>`:(tie?'<em>Empate técnico</em>':'');
  return `<div class="cp-metric"><div class="cp-value ${aWin?'winner':''}"><b>${m.fmt(av)}</b>${aWin?'<span>✓</span>':''}</div><div class="cp-metric-mid"><strong>${esc(m.label)}</strong><small>${esc(m.help)}</small>${reading}</div><div class="cp-value right ${bWin?'winner':''}">${bWin?'<span>✓</span>':''}<b>${m.fmt(bv)}</b></div></div>`;
}
function playerHead(x,side){const rank=x.powerRank?`#${x.powerRank} Power`:'Sin Power';return `<div class="cp-player ${side}"><div class="avatar">${esc(initials(x.p?.short||x.p?.name||''))}</div><div><span>${esc(roleLabel(x.p))}</span><h3>${esc(display(x.p?.name||''))}</h3><small>${esc(rank)} · ${x.minutes} min</small></div></div>`}
function presets(){return `<div class="cp-presets"><span>Duelos rápidos</span><div>${DUELS.map(([a,b,pos])=>`<button type="button" data-cp-a="${esc(a)}" data-cp-b="${esc(b)}"><small>${esc(pos)}</small>${esc(display(a))} <i>vs</i> ${esc(display(b))}</button>`).join('')}</div></div>`}
function commonReading(common,global,a,b){
  const an=display(a.p?.name||''),bn=display(b.p?.name||''),gw=globalWinner(global),cw=common.winner;
  if(!common.shared.length)return {tone:'limited',title:'Sin muestra común',copy:'Todavía no hay ninguna jornada con nota oficial para ambos jugadores. El duelo global se mantiene, pero no puede contrastarse frente a los mismos partidos.'};
  if(common.shared.length===1)return {tone:'limited',title:'Muestra común muy corta',copy:`Solo comparten una jornada con nota oficial. ${common.aw>common.bw?an:common.bw>common.aw?bn:'Ninguno'} sale por delante en ese partido; la ponderación común se muestra como contexto, no como conclusión estable.`};
  if(common.simpleWinner&&cw&&common.simpleWinner!==cw)return {tone:'split',title:'La participación cambia la lectura',copy:`La media simple de las jornadas compartidas favorece a ${common.simpleWinner>0?an:bn}, pero al ponderar cada partido con el mismo peso común de minutos para ambos la ventaja pasa a ${cw>0?an:bn}.`};
  if(gw&&cw&&gw!==cw)return {tone:'split',title:'Lectura dividida',copy:`El veredicto global por magnitud favorece a ${gw>0?an:bn}, pero la muestra común simétrica favorece a ${cw>0?an:bn}. Conviene mirar jornada por jornada antes de decidir.`};
  if(gw&&cw===gw)return {tone:'aligned',title:'La muestra común confirma el global',copy:`La ventaja global de ${gw>0?an:bn} también aparece al comparar solo jornadas compartidas con exactamente los mismos pesos por partido para ambos.`};
  if(!gw&&cw)return {tone:'shared',title:'El global está equilibrado, la muestra común separa',copy:`La magnitud global no ofrece una ventaja práctica clara, pero en la muestra común simétrica ${cw>0?an:bn} obtiene mejor rendimiento.`};
  return {tone:'balanced',title:'Duelo equilibrado también en muestra común',copy:'Ni el agregado global por magnitud ni la muestra común simétrica ofrecen una ventaja clara con la tolerancia actual.'};
}
function commonHtml(common,global,a,b){
  const reading=commonReading(common,global,a,b),total=common.rows.length,an=display(a.p.name),bn=display(b.p.name),minuteGap=Math.abs(common.aMinutes-common.bMinutes);
  return `<section class="cp-common"><div class="cp-common-head"><div><span>MUESTRA COMÚN · ESTRICTA</span><h3>${common.shared.length}/${total} jornadas comparables</h3><p>Solo entra una jornada si ambos tienen nota oficial en ese mismo partido. SC, ausencia o partido sin nota quedan como — y nunca como 0.</p></div><div class="cp-common-score"><small>H2H por jornada</small><b>${common.aw}<i>–</i>${common.bw}</b><em>${common.ties} empate${common.ties===1?'':'s'}</em></div></div><div class="cp-common-kpis"><div><span>${esc(an)}</span><b>${fmt(common.aWeighted,2)}</b><small>${common.aMinutes} min propios</small></div><div><span>Diferencia común</span><b class="${common.weightedDelta>0.049?'a':common.weightedDelta<-.049?'b':'tie'}">${Number.isFinite(common.weightedDelta)?`${common.weightedDelta>0?'+':''}${common.weightedDelta.toFixed(2)}`:'—'}</b><small>${common.sharedMinutes} min de peso común</small></div><div><span>${esc(bn)}</span><b>${fmt(common.bWeighted,2)}</b><small>${common.bMinutes} min propios</small></div></div><div class="cp-common-method"><span>Media simple de las mismas jornadas: <b>${fmt(common.aAvg,2)} – ${fmt(common.bAvg,2)}</b></span><span>La ponderada usa en cada jornada el menor número de minutos de los dos como peso idéntico para ambos. Así la muestra es realmente simétrica y ningún jugador obtiene ventaja solo por acumular más minutos.${minuteGap>=90?' La diferencia de minutos propios entre ambos sigue mostrándose como contexto.':''}</span></div><div class="cp-common-reading ${reading.tone}"><span>${esc(reading.title)}</span><p>${esc(reading.copy)}</p></div><div class="cp-common-grid">${common.rows.map(x=>`<div class="cp-common-row ${x.comparable?'':'missing'}"><span>${esc(jornadaLabel(x.match,x.index))}</span><b class="${x.winner>0?'winner':''}"><strong>${x.av===null?'—':x.av.toFixed(2)}</strong>${x.comparable?`<small>${x.am} min</small>`:''}</b><i>${x.comparable?(x.winner>0?'←':x.winner<0?'→':'='):'·'}</i><b class="${x.winner<0?'winner':''}"><strong>${x.bv===null?'—':x.bv.toFixed(2)}</strong>${x.comparable?`<small>${x.bm} min</small>`:''}</b></div>`).join('')}</div></section>`;
}
function actions(a,b){return `<div class="cp-actions"><button class="btn" id="cpSwap" type="button">⇄ Intercambiar</button><button class="btn" id="cpRadar" type="button">Abrir en Radar</button><button class="btn" id="cpOpenA" type="button">Ficha de ${esc(display(a.p?.name||''))}</button><button class="btn" id="cpOpenB" type="button">Ficha de ${esc(display(b.p?.name||''))}</button><button class="btn" id="cpShareLink" type="button">Compartir duelo</button></div>`}
function syncUrl(a,b){try{const u=new URL(location.href);u.searchParams.set('section','comparador');u.searchParams.set('a',a);u.searchParams.set('b',b);u.searchParams.delete('player');history.replaceState(null,'',u.href)}catch{}}
function setDuel(a,b,update=true){const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(!A||!B)return;if([...A.options].some(o=>o.value===a))A.value=a;if([...B.options].some(o=>o.value===b))B.value=b;renderPro();if(update)syncUrl(A.value,B.value)}
async function shareLink(){
  const A=document.getElementById('compareA')?.value,B=document.getElementById('compareB')?.value;if(!A||!B)return;syncUrl(A,B);const url=location.href,title=`${display(A)} vs ${display(B)} · RM 26/27`;
  try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(url);safe(()=>toast('Enlace de la comparativa copiado'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el enlace'))
}
function openRadar(a,b){
  safe(()=>window.showSection?.('radar'));
  setTimeout(()=>{if(window.RMDecisionRadar?.set)window.RMDecisionRadar.set(a.p.name,b.p.name);else if(typeof window.selectRadarPreset==='function')safe(()=>window.selectRadarPreset(a.p.name,b.p.name))},0);
}
function bind(root,a,b){
  root.querySelectorAll('[data-cp-a]').forEach(btn=>btn.addEventListener('click',()=>setDuel(btn.dataset.cpA,btn.dataset.cpB)));
  root.querySelector('#cpSwap')?.addEventListener('click',()=>setDuel(b.p.name,a.p.name));
  root.querySelector('#cpRadar')?.addEventListener('click',()=>openRadar(a,b));
  root.querySelector('#cpOpenA')?.addEventListener('click',()=>safe(()=>openPlayerHub(a.p.name)));
  root.querySelector('#cpOpenB')?.addEventListener('click',()=>safe(()=>openPlayerHub(b.p.name)));
  root.querySelector('#cpShareLink')?.addEventListener('click',shareLink);
}
function renderPro(){
  const A=document.getElementById('compareA'),B=document.getElementById('compareB'),root=document.getElementById('compareView');if(!A||!B||!root)return;
  const a=row(A.value),b=row(B.value);if(!a.p||!b.p)return;
  const common=commonSample(a,b),v=verdict(a,b,common);root.classList.add('compare-pro-ready');
  root.innerHTML=`<div class="cp-shell">${presets()}<div class="cp-scoreboard">${playerHead(a,'left')}<div class="cp-vs"><span>MARCADOR GLOBAL</span><b>${v.aw}<i>–</i>${v.bw}</b><small>${v.available} métrica${v.available===1?'':'s'} comparable${v.available===1?'':'s'}</small></div>${playerHead(b,'right')}</div><section class="cp-verdict"><div><span>${esc(v.bandLabel.toUpperCase())}</span><h2>${esc(v.title)}</h2><p>${esc(v.copy)}</p></div><div class="cp-confidence"><span>${esc(v.confidence)}</span><p>${esc(v.note)}</p></div></section>${commonHtml(common,v,a,b)}<div class="cp-metrics">${METRICS.map(m=>metricRow(m,a,b)).join('')}</div><div class="cp-ranks"><div><span>Power</span><b>${a.powerRank?`#${a.powerRank}`:'—'}</b><small>${esc(display(a.p.name))}</small></div><div><span>Eficiencia</span><b>${a.effRank?`#${a.effRank}`:'—'}</b><small>${esc(display(a.p.name))}</small></div><div><span>Power</span><b>${b.powerRank?`#${b.powerRank}`:'—'}</b><small>${esc(display(b.p.name))}</small></div><div><span>Eficiencia</span><b>${b.effRank?`#${b.effRank}`:'—'}</b><small>${esc(display(b.p.name))}</small></div></div>${actions(a,b)}<p class="cp-footnote">El marcador global cuenta categorías; el veredicto mide también la magnitud con pesos explícitos para evitar sobrevalorar señales relacionadas: Media 30%, Power 15%, Forma 30% y Eficiencia 25%. Power pesa menos porque ya incorpora parte de la información de rendimiento y muestra. Las métricas ausentes se excluyen y los pesos disponibles se renormalizan. La confianza combina muestra, cobertura, jornadas comunes y compatibilidad de rol. La muestra común sigue siendo una lectura separada y simétrica. Ninguna lectura decide por sí sola quién debe ser titular.</p></div>`;
  bind(root,a,b);document.dispatchEvent(new CustomEvent('rm-compare-pro-rendered',{detail:{a:a.p.name,b:b.p.name,score:[v.aw,v.bw],available:v.available,directionalWinner:v.countWinner,impactWinner:v.impactWinner,impactScore:v.impactScore,impactBand:v.bandKey,strongestMetric:v.strongestMetric,confidence:v.confidence,confidenceScore:v.confidenceScore,sharedRoles:v.sharedRoles,common:{matches:common.shared.length,score:[common.aw,common.bw],ties:common.ties,weighted:[common.aWeighted,common.bWeighted],minutes:[common.aMinutes,common.bMinutes],sharedMinutes:common.sharedMinutes}}}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,a=q.get('a'),b=q.get('b');if(a&&b)setDuel(a,b,false)}catch{}}
function install(){
  if(installed)return;const A=document.getElementById('compareA'),B=document.getElementById('compareB'),root=document.getElementById('compareView');if(!A||!B||!root||typeof renderCompare!=='function'){setTimeout(install,80);return}
  installed=true;const base=renderCompare;renderCompare=function(){renderPro()};A.onchange=()=>{renderPro();syncUrl(A.value,B.value)};B.onchange=()=>{renderPro();syncUrl(A.value,B.value)};applyUrl();renderPro();
  document.addEventListener('rm-ranking-official-ready',renderPro);document.addEventListener('rm-season-data-ready',renderPro);document.addEventListener('rm-season-order-corrected',renderPro);
  window.RMComparePro=Object.freeze({render:renderPro,setDuel,share:shareLink,commonSample:(a,b)=>commonSample(row(a),row(b)),verdict:(a,b)=>{const ar=row(a),br=row(b),common=commonSample(ar,br);return verdict(ar,br,common)},baseRender:base});
}
install();
})();
