(()=>{
const KEY='rm_community_pro_snapshots_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1]})),[])||[]}
function data(){return window.RMCommunityData||null}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function current(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():null,null)}
function validXi(xi){const d=defs();if(d.length!==11||!xi)return false;const v=d.map(s=>xi[s.key]).filter(Boolean);return v.length===11&&new Set(v.map(canonical)).size===11}
function project(){
  const candidates=[safe(()=>window.RMCurrentMatchIdea,null),safe(()=>typeof rayoXI!=='undefined'?rayoXI:null,null),safe(()=>typeof baseXI!=='undefined'?baseXI:null,null)];
  return candidates.find(validXi)||null;
}
function popularXi(d){
  const out={};for(const slot of defs()){const row=d?.popularXI?.[slot.key];out[slot.key]=typeof row==='string'?row:row?.name||''}
  return out;
}
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function write(rows){try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-30)))}catch{}}
function signature(s){return JSON.stringify([s.matchId,s.total,Object.values(s.slots).map(x=>[x.name,x.percentage])])}
function snapshotOf(d){
  const m=match(),slots={};for(const slot of defs()){const top=d?.slotShares?.[slot.key]?.[0];slots[slot.key]={name:top?.name||'',percentage:Number(top?.percentage)||0}}
  return {matchId:d?.match?.id||m?.id||'unknown',total:Number(d?.totalPredictions)||0,closed:Boolean(d?.match?.closed),at:new Date().toISOString(),slots};
}
function capture(d){
  if(!d||!Number(d.totalPredictions))return null;const rows=read(),s=snapshotOf(d),last=rows.at(-1);
  if(!last||signature(last)!==signature(s)){rows.push(s);write(rows);return s}
  return last;
}
function previousSnapshot(d){
  const id=d?.match?.id||match()?.id;const rows=read().filter(r=>r.matchId===id);if(rows.length<2)return null;return rows.at(-2);
}
function slotState(d){
  const total=Number(d?.totalPredictions)||0;
  return defs().map(slot=>{
    const list=(d?.slotShares?.[slot.key]||[]).filter(x=>x?.name).slice(0,5),top=list[0]||null,second=list[1]||null;
    const share=Number(top?.percentage)||0,secondShare=Number(second?.percentage)||0,margin=share-secondShare;
    let level='Sin muestra',tone='empty';
    if(total){if(share>=70||margin>=35){level='Consenso fuerte';tone='strong'}else if(share>=55||margin>=20){level='Mayoría';tone='majority'}else if(share>=40){level='Debate abierto';tone='open'}else{level='Muy dividido';tone='split'}}
    return {slot,list,top,second,share,secondShare,margin,level,tone};
  });
}
function moverRows(d,prev){
  if(!prev)return [];
  return slotState(d).map(row=>{
    const before=prev.slots?.[row.slot.key]||{},sameLeader=same(before.name,row.top?.name),delta=sameLeader?row.share-(Number(before.percentage)||0):null;
    return {...row,before,sameLeader,delta,leaderChanged:Boolean(before.name&&row.top?.name&&!sameLeader)};
  }).filter(r=>r.leaderChanged||Number.isFinite(r.delta)&&Math.abs(r.delta)>=1).sort((a,b)=>{
    if(a.leaderChanged!==b.leaderChanged)return a.leaderChanged?-1:1;
    return Math.abs(b.delta)-Math.abs(a.delta)
  });
}
function globalPlayers(d){
  const map=new Map();
  for(const slot of defs())for(const row of d?.slotShares?.[slot.key]||[]){
    if(!row?.name||!row.multiPosition)continue;const key=canonical(row.name),cur=map.get(key)||{name:row.name,globalPercentage:0,globalCount:0,positions:[]};
    cur.globalPercentage=Math.max(cur.globalPercentage,Number(row.globalPercentage)||0);cur.globalCount=Math.max(cur.globalCount,Number(row.globalCount)||0);cur.positions.push(slot.label);map.set(key,cur)
  }
  return [...map.values()].sort((a,b)=>b.globalPercentage-a.globalPercentage||b.globalCount-a.globalCount).slice(0,6);
}
function compareXi(reference,popular){
  if(!validXi(reference)||!popular)return null;
  let exact=0;for(const slot of defs())if(same(reference[slot.key],popular[slot.key]))exact++;
  const A=new Set(Object.values(reference).filter(Boolean).map(canonical)),B=new Set(Object.values(popular).filter(Boolean).map(canonical));
  const presence=[...A].filter(x=>B.has(x)).length;
  return {exact,presence};
}
function state(){
  const d=data(),total=Number(d?.totalPredictions)||0;if(!d||!total)return {available:false,data:d,total};
  capture(d);const slotsState=slotState(d),prev=previousSnapshot(d),movers=moverRows(d,prev),popular=popularXi(d),avg=slotsState.reduce((s,r)=>s+r.share,0)/(slotsState.length||1);
  const sorted=[...slotsState].sort((a,b)=>a.share-b.share||a.margin-b.margin),weakest=sorted[0],strongest=sorted.at(-1);
  return {available:true,data:d,total,closed:Boolean(d?.match?.closed),slots:slotsState,prev,movers,popular,avg,strongest,weakest,project:compareXi(project(),popular),mine:compareXi(current(),popular),multi:globalPlayers(d)}
}
function ensure(){
  const section=document.getElementById('comunidad');if(!section)return null;let root=document.getElementById('communityPro');if(root)return root;
  root=document.createElement('section');root.id='communityPro';root.className='card cpro-shell';const head=section.querySelector('.section-head');if(head)head.insertAdjacentElement('afterend',root);else section.prepend(root);return root;
}
function movementText(r){
  if(r.leaderChanged)return `Cambia líder: ${display(r.before.name)} → ${display(r.top?.name)}`;
  const sign=r.delta>0?'+':'';return `${display(r.top?.name)} ${sign}${r.delta.toFixed(0)} pp`;
}
function comparisonCard(title,c){
  if(!c)return `<div class="cpro-compare muted"><span>${esc(title)}</span><b>—</b><small>Completa un XI válido para comparar</small></div>`;
  return `<div class="cpro-compare"><span>${esc(title)}</span><b>${c.presence}/11 titulares</b><small>${c.exact}/11 también coinciden en el puesto</small></div>`;
}
function renderUnavailable(root){
  root.innerHTML=`<div class="cpro-head"><div><span>COMUNIDAD PRO</span><h3>Lectura avanzada del consenso</h3><p>Esta capa analiza fuerza del consenso, puestos divididos, cambios entre actualizaciones y coincidencia con Tú/Proyecto.</p></div><b>Sin datos en vivo</b></div><div class="cpro-unavailable"><strong>La versión pública de GitHub Pages no consulta Netlify.</strong><span>Cuando exista RMCommunityData, Comunidad PRO se activa sin inventar porcentajes ni usar datos antiguos como si fueran actuales.</span></div>`;
}
function render(){
  const root=ensure();if(!root)return;const s=state();if(!s.available){renderUnavailable(root);return}
  const ordered=[...s.slots].sort((a,b)=>a.share-b.share||a.margin-b.margin);
  root.innerHTML=`<div class="cpro-head"><div><span>COMUNIDAD PRO</span><h3>Qué está realmente decidido y qué sigue abierto</h3><p>Los porcentajes son votos por puesto. El porcentaje global solo se muestra aparte cuando un jugador fue elegido en varias posiciones.</p></div><b>${s.closed?'Consenso final':'Consenso provisional'}</b></div>
  <div class="cpro-kpis"><div><span>Muestra</span><b>${s.total}</b><small>pronósticos</small></div><div><span>Acuerdo medio</span><b>${s.avg.toFixed(0)}%</b><small>líder por puesto</small></div><div><span>Más firme</span><b>${esc(s.strongest?.slot.label||'—')}</b><small>${s.strongest?`${s.strongest.share}% · ${display(s.strongest.top?.name)}`:'—'}</small></div><div><span>Más dividido</span><b>${esc(s.weakest?.slot.label||'—')}</b><small>${s.weakest?`${s.weakest.share}% · margen ${s.weakest.margin} pp`:'—'}</small></div></div>
  <div class="cpro-main"><section><div class="cpro-title"><span>MAPA DE CONSENSO</span><b>De más abierto a más firme</b></div><div class="cpro-grid">${ordered.map(r=>`<article class="${r.tone}"><div><span>${esc(r.slot.label)}</span><em>${esc(r.level)}</em></div><b>${r.top?esc(display(r.top.name)):'—'}</b><strong>${r.share}%</strong><small>${r.second?`${esc(display(r.second.name))} ${r.secondShare}% · margen ${r.margin} pp`:'Sin segunda opción'}</small>${r.top?.multiPosition&&Number.isFinite(Number(r.top.globalPercentage))?`<p>Global: ${Number(r.top.globalPercentage)}%</p>`:''}</article>`).join('')}</div></section>
  <aside><div class="cpro-title"><span>CRUCE DE PERSPECTIVAS</span><b>Comunidad vs nuestros XI</b></div>${comparisonCard('Proyecto',s.project)}${comparisonCard('Tu borrador',s.mine)}
  <div class="cpro-movers"><span>DESDE LA ÚLTIMA FOTO</span>${s.movers.length?s.movers.slice(0,5).map(r=>`<div class="${r.leaderChanged?'changed':r.delta>0?'up':'down'}"><b>${esc(r.slot.label)}</b><small>${esc(movementText(r))}</small></div>`).join(''):'<p>Necesitamos otra actualización distinta para medir movimientos reales.</p>'}</div></aside></div>
  ${s.multi.length?`<div class="cpro-global"><div><span>VOTO GLOBAL MULTIPOSICIÓN</span><b>Evita infravalorar a quien aparece repartido entre puestos</b></div><div>${s.multi.map(p=>`<button type="button" data-cpro-player="${esc(p.name)}"><b>${esc(display(p.name))}</b><span>${p.globalPercentage}% global</span><small>${esc([...new Set(p.positions)].join(' · '))}</small></button>`).join('')}</div></div>`:''}
  <p class="cpro-note">Consenso fuerte no significa “probabilidad de titularidad”. Solo describe concentración de votos. Los movimientos se calculan entre snapshots locales del mismo partido y nunca reconstruyen retrospectivamente lo que la comunidad pensaba antes.</p>`;
  root.querySelectorAll('[data-cpro-player]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>openPlayerHub(btn.dataset.cproPlayer))));
  document.dispatchEvent(new CustomEvent('rm-community-pro-rendered',{detail:{total:s.total,averageAgreement:s.avg,strongest:s.strongest?.slot.key||null,weakest:s.weakest?.slot.key||null,closed:s.closed}}));
}
function install(){
  if(installed)return;if(!document.getElementById('comunidad')){if(++attempts<80)setTimeout(install,100);return}
  installed=true;render();document.addEventListener('rm-community-updated',()=>setTimeout(render,50));document.addEventListener('rm-local-prediction-updated',()=>setTimeout(render,50));document.addEventListener('rm-prediction-draft-updated',()=>setTimeout(render,50));
  window.RMCommunityPro=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();