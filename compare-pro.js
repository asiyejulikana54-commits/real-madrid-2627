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
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function player(name){return safe(()=>players.find(p=>p.name===name||p.short===name),null)}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function rating(m){return m?safe(()=>currentRating(m),Number.isFinite(m.rating)?m.rating:null):null}
function recent(name){return safe(()=>window.RMSeasonData?.recentRating?.(name,3),null)}
function power(name,m,r){
  const c=canonical(name),official=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===c),null);
  if(Number.isFinite(official?.power))return official.power;
  return m&&Number.isFinite(r)?r*(.75+.25*Math.min(m.minutes||0,450)/450):null;
}
function efficiencyRank(name){const c=canonical(name),rows=[...safe(()=>efficiencyRanking,[])].sort((a,b)=>(a.minPerPoint??Infinity)-(b.minPerPoint??Infinity));const i=rows.findIndex(x=>canonical(x.name)===c);return i>=0?i+1:null}
function powerRank(name){
  const c=canonical(name),rows=safe(()=>players,[]).map(p=>{const m=metric(p),r=rating(m),pow=power(p.name,m,r);return Number.isFinite(pow)?{name:p.name,power:pow}:null}).filter(Boolean).sort((a,b)=>b.power-a.power);const i=rows.findIndex(x=>canonical(x.name)===c);return i>=0?i+1:null;
}
function row(name){
  const p=player(name),m=metric(p),r=rating(m),form=recent(p?.name),minutes=m?.minutes||0;
  return {p,m,r,power:power(p?.name,m,r),recent:Number.isFinite(form?.value)?form.value:null,recentN:form?.n||0,efficiency:Number.isFinite(m?.minPerPoint)?m.minPerPoint:null,minutes,sample:Math.min(minutes,450)/450,effRank:efficiencyRank(p?.name),powerRank:powerRank(p?.name)};
}
function cmp(a,b,higher=true,tolerance=0){if(!Number.isFinite(a)||!Number.isFinite(b))return 0;const d=a-b;if(Math.abs(d)<=tolerance)return 0;return higher?(d>0?1:-1):(d<0?1:-1)}
const METRICS=[
  {key:'rating',label:'Media',get:x=>x.r,higher:true,tol:.05,fmt:v=>fmt(v,2),help:'Media combinada de las fuentes disponibles.'},
  {key:'power',label:'Power RM',get:x=>x.power,higher:true,tol:.05,fmt:v=>fmt(v,2),help:'Rendimiento ajustado por tamaño de muestra.'},
  {key:'recent',label:'Forma reciente',get:x=>x.recent,higher:true,tol:.05,fmt:v=>fmt(v,2),help:'Media de hasta los 3 últimos partidos con nota.'},
  {key:'efficiency',label:'Min / punto',get:x=>x.efficiency,higher:false,tol:.15,fmt:v=>fmt(v,2),help:'Menor es mejor: minutos necesarios para generar un punto de aporte.'},
  {key:'minutes',label:'Minutos',get:x=>x.minutes,higher:true,tol:15,fmt:v=>Number.isFinite(v)?String(Math.round(v)):'—',help:'Volumen total jugado; sirve como contexto de fiabilidad.'},
  {key:'sample',label:'Muestra',get:x=>x.sample,higher:true,tol:.03,fmt:v=>Number.isFinite(v)?`${Math.round(v*100)}%`:'—',help:'Peso de muestra hasta 450 minutos.'}
];
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function verdict(a,b){
  let aw=0,bw=0,ties=0;
  for(const m of METRICS.filter(x=>PERFORMANCE_KEYS.has(x.key))){const c=cmp(m.get(a),m.get(b),m.higher,m.tol);if(c>0)aw++;else if(c<0)bw++;else ties++}
  const an=display(a.p?.name||''),bn=display(b.p?.name||'');
  let title='Duelo muy equilibrado',copy=`${an} y ${bn} están muy parejos en los indicadores de rendimiento disponibles.`;
  if(aw>bw){title=`${an} sale por delante`;copy=`Gana ${aw}-${bw} en las 4 métricas de rendimiento: media, Power, forma reciente y eficiencia.`}
  if(bw>aw){title=`${bn} sale por delante`;copy=`Gana ${bw}-${aw} en las 4 métricas de rendimiento: media, Power, forma reciente y eficiencia.`}
  const min=Math.min(a.minutes,b.minutes),max=Math.max(a.minutes,b.minutes);let confidence='Muestra alta',note='Ambos tienen una muestra suficientemente desarrollada para que la comparación sea más estable.';
  if(min<90){confidence='Muestra corta';note='Al menos uno de los dos está por debajo de 90 minutos: la diferencia todavía puede cambiar mucho.'}
  else if(min<270){confidence='Muestra media';note='Hay base para comparar, pero la muestra aún no está cerca del tope de 450 minutos.'}
  if(max-min>=180)note+=' Además, existe una diferencia importante de minutos entre ambos.';
  const shared=(a.p?.eligible||[]).filter(pos=>(b.p?.eligible||[]).includes(pos));if(!shared.length)note+=' Sus roles no son directamente equivalentes, así que esto no debe leerse como un “mejor jugador” universal.';
  return {aw,bw,ties,title,copy,confidence,note};
}
function metricRow(m,a,b){
  const av=m.get(a),bv=m.get(b),c=cmp(av,bv,m.higher,m.tol),aWin=c>0,bWin=c<0,tie=c===0&&Number.isFinite(av)&&Number.isFinite(bv);
  return `<div class="cp-metric"><div class="cp-value ${aWin?'winner':''}"><b>${m.fmt(av)}</b>${aWin?'<span>✓</span>':''}</div><div class="cp-metric-mid"><strong>${esc(m.label)}</strong><small>${esc(m.help)}</small>${tie?'<em>Empate técnico</em>':''}</div><div class="cp-value right ${bWin?'winner':''}">${bWin?'<span>✓</span>':''}<b>${m.fmt(bv)}</b></div></div>`;
}
function playerHead(x,side){const rank=x.powerRank?`#${x.powerRank} Power`:'Sin Power';return `<div class="cp-player ${side}"><div class="avatar">${esc(initials(x.p?.short||x.p?.name||''))}</div><div><span>${esc(x.p?.pos||'')}</span><h3>${esc(display(x.p?.name||''))}</h3><small>${esc(rank)} · ${x.minutes} min</small></div></div>`}
function presets(){return `<div class="cp-presets"><span>Duelos rápidos</span><div>${DUELS.map(([a,b,pos])=>`<button type="button" data-cp-a="${esc(a)}" data-cp-b="${esc(b)}"><small>${esc(pos)}</small>${esc(display(a))} <i>vs</i> ${esc(display(b))}</button>`).join('')}</div></div>`}
function actions(a,b){return `<div class="cp-actions"><button class="btn" id="cpSwap" type="button">⇄ Intercambiar</button><button class="btn" id="cpOpenA" type="button">Ficha de ${esc(display(a.p?.name||''))}</button><button class="btn" id="cpOpenB" type="button">Ficha de ${esc(display(b.p?.name||''))}</button><button class="btn" id="cpShareLink" type="button">Compartir duelo</button></div>`}
function syncUrl(a,b){try{const u=new URL(location.href);u.searchParams.set('section','comparador');u.searchParams.set('a',a);u.searchParams.set('b',b);u.searchParams.delete('player');history.replaceState(null,'',u.href)}catch{}}
function setDuel(a,b,update=true){const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(!A||!B)return;if([...A.options].some(o=>o.value===a))A.value=a;if([...B.options].some(o=>o.value===b))B.value=b;renderPro();if(update)syncUrl(A.value,B.value)}
async function shareLink(){
  const A=document.getElementById('compareA')?.value,B=document.getElementById('compareB')?.value;if(!A||!B)return;syncUrl(A,B);const url=location.href,title=`${display(A)} vs ${display(B)} · RM 26/27`;
  try{if(navigator.share){await navigator.share({title,url});return}if(navigator.clipboard){await navigator.clipboard.writeText(url);safe(()=>toast('Enlace de la comparativa copiado'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el enlace'))
}
function bind(root,a,b){
  root.querySelectorAll('[data-cp-a]').forEach(btn=>btn.addEventListener('click',()=>setDuel(btn.dataset.cpA,btn.dataset.cpB)));
  root.querySelector('#cpSwap')?.addEventListener('click',()=>setDuel(b.p.name,a.p.name));
  root.querySelector('#cpOpenA')?.addEventListener('click',()=>safe(()=>openPlayerHub(a.p.name)));
  root.querySelector('#cpOpenB')?.addEventListener('click',()=>safe(()=>openPlayerHub(b.p.name)));
  root.querySelector('#cpShareLink')?.addEventListener('click',shareLink);
}
function renderPro(){
  const A=document.getElementById('compareA'),B=document.getElementById('compareB'),root=document.getElementById('compareView');if(!A||!B||!root)return;
  const a=row(A.value),b=row(B.value);if(!a.p||!b.p)return;
  const v=verdict(a,b);root.classList.add('compare-pro-ready');
  root.innerHTML=`<div class="cp-shell">${presets()}<div class="cp-scoreboard">${playerHead(a,'left')}<div class="cp-vs"><span>MARCADOR</span><b>${v.aw}<i>–</i>${v.bw}</b><small>4 métricas de rendimiento</small></div>${playerHead(b,'right')}</div><section class="cp-verdict"><div><span>VEREDICTO ACTUAL</span><h2>${esc(v.title)}</h2><p>${esc(v.copy)}</p></div><div class="cp-confidence"><span>${esc(v.confidence)}</span><p>${esc(v.note)}</p></div></section><div class="cp-metrics">${METRICS.map(m=>metricRow(m,a,b)).join('')}</div><div class="cp-ranks"><div><span>Power</span><b>${a.powerRank?`#${a.powerRank}`:'—'}</b><small>${esc(display(a.p.name))}</small></div><div><span>Eficiencia</span><b>${a.effRank?`#${a.effRank}`:'—'}</b><small>${esc(display(a.p.name))}</small></div><div><span>Power</span><b>${b.powerRank?`#${b.powerRank}`:'—'}</b><small>${esc(display(b.p.name))}</small></div><div><span>Eficiencia</span><b>${b.effRank?`#${b.effRank}`:'—'}</b><small>${esc(display(b.p.name))}</small></div></div>${actions(a,b)}<p class="cp-footnote">El marcador solo resume estas cuatro métricas y no decide por sí solo quién debe ser titular. El contexto táctico y el rol siguen importando.</p></div>`;
  bind(root,a,b);document.dispatchEvent(new CustomEvent('rm-compare-pro-rendered',{detail:{a:a.p.name,b:b.p.name,score:[v.aw,v.bw]}}));
}
function applyUrl(){try{const q=new URL(location.href).searchParams,a=q.get('a'),b=q.get('b');if(a&&b)setDuel(a,b,false)}catch{}}
function install(){
  if(installed)return;const A=document.getElementById('compareA'),B=document.getElementById('compareB'),root=document.getElementById('compareView');if(!A||!B||!root||typeof renderCompare!=='function'){setTimeout(install,80);return}
  installed=true;const base=renderCompare;renderCompare=function(){renderPro()};A.onchange=()=>{renderPro();syncUrl(A.value,B.value)};B.onchange=()=>{renderPro();syncUrl(A.value,B.value)};applyUrl();renderPro();
  document.addEventListener('rm-ranking-official-ready',renderPro);document.addEventListener('rm-season-data-ready',renderPro);
  window.RMComparePro=Object.freeze({render:renderPro,setDuel,share:shareLink,baseRender:base});
}
install();
})();
