(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function community(){return window.RMCommunityData||null}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function communityChoice(slot){
  const data=community(),m=currentMatch();
  if(!data)return {available:false,name:null,percentage:null,globalPercentage:null,final:false,total:0,reason:'Comunidad no disponible'};
  if(data.match?.id&&m?.id&&data.match.id!==m.id)return {available:false,name:null,percentage:null,globalPercentage:null,final:false,total:0,reason:'Comunidad de otro partido'};
  const total=Number(data.totalPredictions)||0,row=data.popularXI?.[slot]||null,name=typeof row==='string'?row:row?.name||null;
  return {available:total>0&&Boolean(name),name,percentage:Number.isFinite(row?.percentage)?row.percentage:null,globalPercentage:Number.isFinite(row?.globalPercentage)?row.globalPercentage:null,final:Boolean(data.match?.closed),total,reason:total?'Sin elección comunitaria en este puesto':'Sin votos todavía'};
}
function voiceLabel(kind){return kind==='user'?'Tu XI':kind==='community'?'Comunidad':'Datos'}
function buildRow(row){
  const project=row.current,user=row.mineName||'',communityRow=communityChoice(row.slot.key),challenger=row.challenger?.p?.name||null;
  const userAvailable=Boolean(user),userDiff=userAvailable&&!same(user,project);
  const communityAvailable=communityRow.available,communityDiff=communityAvailable&&!same(communityRow.name,project);
  const dataDiff=Boolean(challenger&&(row.level==='watch'||row.level==='risk')&&!same(challenger,project));
  const voices=[];
  if(userDiff)voices.push({kind:'user',name:user,weight:1});
  if(communityDiff)voices.push({kind:'community',name:communityRow.name,weight:communityRow.final?.9:.6});
  if(dataDiff)voices.push({kind:'data',name:challenger,weight:row.level==='risk'?1.15:.75});
  const alternatives=new Map();
  for(const voice of voices){const key=canonical(voice.name),prior=alternatives.get(key)||{name:voice.name,score:0,sources:[]};prior.score+=voice.weight;prior.sources.push(voice.kind);alternatives.set(key,prior)}
  const ordered=[...alternatives.values()].sort((a,b)=>b.sources.length-a.sources.length||b.score-a.score||display(a.name).localeCompare(display(b.name),'es'));
  const primary=ordered[0]||null,signals=voices.length,independent=new Set(voices.map(v=>v.kind)).size;
  let level='consensus',label='CONSENSO';
  if(row.level==='risk'||independent>=2){level='strong';label='DEBATE FUERTE'}
  else if(signals>=1||row.level==='watch'){level='open';label='DEBATE ABIERTO'}
  const availableVoices=1+(userAvailable?1:0)+(communityAvailable?1:0)+1;
  const projectAligned=1+(userAvailable&&!userDiff?1:0)+(communityAvailable&&!communityDiff?1:0)+(dataDiff?0:1);
  return {...row,project,user,userAvailable,userDiff,community:communityRow,communityAvailable,communityDiff,dataDiff,voices,alternatives:ordered,primary,signals,independent,decisionLevel:level,decisionLabel:label,availableVoices,projectAligned};
}
function state(){
  const base=safe(()=>window.RMXIStability?.state?.(),null);if(!base)return null;
  const rows=(base.rows||[]).map(buildRow).sort((a,b)=>{
    const rank={strong:3,open:2,consensus:1};
    return rank[b.decisionLevel]-rank[a.decisionLevel]||b.independent-a.independent||b.signals-a.signals||String(a.slot?.label||'').localeCompare(String(b.slot?.label||''),'es');
  });
  const counts=rows.reduce((acc,r)=>(acc[r.decisionLevel]=(acc[r.decisionLevel]||0)+1,acc),{consensus:0,open:0,strong:0});
  const c=community(),m=currentMatch(),communitySame=Boolean(c&&(!c.match?.id||!m?.id||c.match.id===m.id));
  const communityMeta={available:Boolean(communitySame&&(Number(c?.totalPredictions)||0)>0),final:Boolean(communitySame&&c?.match?.closed),total:communitySame?(Number(c?.totalPredictions)||0):0};
  return {base,rows,counts,community:communityMeta,userChanges:rows.filter(r=>r.userDiff).length};
}
function sourceChip(row,kind){
  if(kind==='user'){
    if(!row.userAvailable)return '<span class="db-chip muted">Tú · sin completar</span>';
    return `<span class="db-chip ${row.userDiff?'different':'same'}">Tú · ${esc(display(row.user))}</span>`;
  }
  if(kind==='community'){
    if(!row.communityAvailable)return `<span class="db-chip muted">Comunidad · ${esc(row.community.reason)}</span>`;
    const pct=Number.isFinite(row.community.percentage)?` ${row.community.percentage}%`:'';
    return `<span class="db-chip ${row.communityDiff?'different':'same'}">Comunidad · ${esc(display(row.community.name))}${esc(pct)}${row.community.final?' · final':' · provisional'}</span>`;
  }
  if(row.dataDiff)return `<span class="db-chip different">Datos · ${esc(display(row.challenger.p.name))}</span>`;
  return `<span class="db-chip same">Datos · respaldan / sin rival fuerte</span>`;
}
function explanation(row){
  if(row.decisionLevel==='consensus')return 'No aparece una alternativa con suficiente respaldo entre tu XI, comunidad disponible y señales recientes.';
  if(row.primary){
    const sources=row.primary.sources.map(voiceLabel).join(' + ');
    return `${display(row.primary.name)} aparece como alternativa por ${sources}.`;
  }
  return row.detail||'Hay señales suficientes para mantener abierto el debate.';
}
function decisionCard(row){
  const alt=row.primary?.name||row.challenger?.p?.name||null,compare=alt&&!same(alt,row.project);
  return `<article class="db-row ${row.decisionLevel}"><div class="db-title"><span>${esc(row.slot.label||row.slot.role||row.slot.key)}</span><em>${esc(row.decisionLabel)}</em></div><div class="db-project"><small>NUESTRA PROPUESTA</small><b>${esc(display(row.project))}</b><span>${row.projectAligned}/${row.availableVoices} voces alineadas</span></div><div class="db-chips">${sourceChip(row,'user')}${sourceChip(row,'community')}${sourceChip(row,'data')}</div><p>${esc(explanation(row))}</p><div class="db-actions">${compare?`<button type="button" data-db-duel="${esc(row.project)}|${esc(alt)}">Comparar ${esc(display(row.project))} ↔ ${esc(display(alt))}</button>`:`<button type="button" data-db-player="${esc(row.project)}">Ver ficha</button>`}<button type="button" data-db-stability>Ver estabilidad</button></div></article>`;
}
function communityStatus(meta){if(!meta.available)return 'Comunidad sin datos';return `${meta.total} pronóstico${meta.total===1?'':'s'} · ${meta.final?'consenso final':'consenso provisional'}`}
function html(s){
  const debated=s.counts.open+s.counts.strong,rows=s.rows.filter(r=>r.decisionLevel!=='consensus'),visible=rows.slice(0,6),hiddenConsensus=s.counts.consensus;
  return `<div class="db-head"><div><span>MESA DE DECISIONES</span><h3>Dónde coincidimos y dónde de verdad hay que decidir</h3><p>Cruzamos nuestra propuesta con tu XI, la comunidad disponible y el mapa de estabilidad. No inventa probabilidades: solo ordena desacuerdos reales.</p></div><div class="db-head-score"><b>${debated}</b><small>debates abiertos</small></div></div><div class="db-kpis"><div class="consensus"><span>Consenso</span><b>${s.counts.consensus}</b></div><div class="open"><span>Debate abierto</span><b>${s.counts.open}</b></div><div class="strong"><span>Debate fuerte</span><b>${s.counts.strong}</b></div><div><span>Tu XI cambia</span><b>${s.userChanges}</b></div></div><div class="db-context"><span>${esc(communityStatus(s.community))}</span><span>${hiddenConsensus} puesto${hiddenConsensus===1?'':'s'} sin conflicto relevante</span></div><div class="db-list">${visible.length?visible.map(decisionCard).join(''):'<div class="db-empty"><b>Ahora mismo no hay debates relevantes.</b><span>Tu XI, nuestra propuesta y las señales disponibles están bastante alineados.</span></div>'}</div>${rows.length>visible.length?`<p class="db-note">Mostramos los ${visible.length} debates principales de ${rows.length}. El mapa de estabilidad conserva los 11 puestos.</p>`:'<p class="db-note">La comunidad solo cuenta cuando hay datos reales; si no está disponible, no se interpreta como desacuerdo.</p>'}`;
}
function ensurePrediction(){
  const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('decisionBoard');if(root)return root;
  root=document.createElement('section');root.id='decisionBoard';root.className='card db-shell';const anchor=document.getElementById('xiStability')||document.getElementById('predictionAnalytics')||document.getElementById('predictionPro');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function ensureMatchday(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('decisionBoardMatchday');if(root)return root;
  root=document.createElement('section');root.id='decisionBoardMatchday';root.className='card db-compact';const anchor=document.getElementById('xiStabilityMatchday')||document.getElementById('roundImpactMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root;
}
function openPlayer(name){safe(()=>showSection('plantilla'));let n=0;const go=()=>{if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return}if(typeof window.openPlayerHub==='function'){window.openPlayerHub(name);return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function openDuel(a,b){safe(()=>showSection('comparador'));let n=0;const go=()=>{if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b);return}const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;safe(()=>renderCompare());return}if(++n<24)setTimeout(go,90)};setTimeout(go,0)}
function goStability(){safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('xiStability')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)}
function bind(root){
  if(!root)return;root.querySelectorAll('[data-db-player]').forEach(b=>b.addEventListener('click',()=>openPlayer(b.dataset.dbPlayer)));
  root.querySelectorAll('[data-db-duel]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.dbDuel.split('|');openDuel(a,c)}));
  root.querySelectorAll('[data-db-stability]').forEach(b=>b.addEventListener('click',goStability));
}
function render(){
  const s=state();if(!s)return;
  const root=ensurePrediction();if(root){root.innerHTML=html(s);bind(root)}
  const compact=ensureMatchday();if(compact){const top=s.rows.filter(r=>r.decisionLevel!=='consensus').slice(0,3),debates=s.counts.open+s.counts.strong;compact.innerHTML=`<div class="db-compact-head"><div><span>MESA DE DECISIONES</span><b>${debates?`${debates} debate${debates===1?'':'s'} abierto${debates===1?'':'s'}`:'XI bastante alineado'}</b><small>${esc(communityStatus(s.community))}${s.userChanges?` · tu XI cambia ${s.userChanges}`:''}</small></div><button type="button" class="btn" data-db-open>Ver decisiones</button></div>${top.length?`<div class="db-compact-list">${top.map(r=>`<button type="button" ${r.primary?.name?`data-db-duel="${esc(r.project)}|${esc(r.primary.name)}"`:`data-db-player="${esc(r.project)}"`}><span>${esc(r.slot.label||r.slot.role||r.slot.key)}</span><b>${esc(display(r.project))}${r.primary?.name?` ↔ ${esc(display(r.primary.name))}`:''}</b><em>${esc(r.decisionLabel)}</em></button>`).join('')}</div>`:''}`;compact.querySelector('[data-db-open]')?.addEventListener('click',()=>{safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('decisionBoard')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)});bind(compact)}
  document.dispatchEvent(new CustomEvent('rm-decision-board-rendered',{detail:{counts:s.counts,userChanges:s.userChanges,community:s.community,debates:s.rows.filter(r=>r.decisionLevel!=='consensus').map(r=>({slot:r.slot.key,project:r.project,alternative:r.primary?.name||null,level:r.decisionLevel,sources:r.primary?.sources||[]}))}}));
}
function install(){
  if(installed)return;if(!window.RMXIStability||!document.getElementById('prediccion')){if(++attempts<80)setTimeout(install,100);return}
  installed=true;render();
  ['rm-xi-stability-rendered','rm-community-updated','rm-prediction-analytics-updated','rm-local-prediction-updated','rm-current-match-idea-updated'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,40)));
  document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});
  window.RMDecisionBoard=Object.freeze({render,state});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
