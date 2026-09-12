(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1],position:s[4]})),[])||[]}
function lab(){return safe(()=>window.RMScenarioLab?.state?.(),null)}
function current(){return safe(()=>typeof currentPredictionXI==='function'?currentPredictionXI():{}, {})||{}}
function closed(){return safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false)}
function cloneXi(xi){return Object.fromEntries(defs().map(s=>[s.key,xi?.[s.key]||'']))}
function validXi(xi){const d=defs(),vals=d.map(s=>xi?.[s.key]||'');return d.length===11&&!vals.some(v=>!v)&&new Set(vals.map(canonical)).size===11}
function sourceList(ctx,{finalCommunityOnly=false}={}){
  const out=[];
  if(validXi(ctx?.mine))out.push({id:'user',label:'Tu XI',xi:cloneXi(ctx.mine),kind:'user'});
  const project=ctx?.scenarios?.find(s=>s.id==='project');if(project?.valid&&validXi(project.xi))out.push({id:'project',label:'Proyecto',xi:cloneXi(project.xi),kind:'project'});
  const strong=ctx?.scenarios?.find(s=>s.id==='strong');if(strong?.valid&&validXi(strong.xi))out.push({id:'strong',label:'Señales',xi:cloneXi(strong.xi),kind:'strong'});
  const community=ctx?.scenarios?.find(s=>s.id==='community');
  if(community?.valid&&validXi(community.xi)&&(!finalCommunityOnly||ctx.community?.final))out.push({id:'community',label:ctx.community?.final?'Comunidad':'Comunidad · provisional',xi:cloneXi(community.xi),kind:'community',final:Boolean(ctx.community?.final)});
  return out;
}
function candidateRows(sources){
  return defs().map(slot=>{
    const map=new Map();
    for(const source of sources){const name=source.xi?.[slot.key];if(!name)continue;const key=canonical(name),row=map.get(key)||{name,key,votes:0,sources:[]};row.votes++;row.sources.push(source.id);if(source.id==='project')row.name=name;map.set(key,row)}
    const list=[...map.values()].map(row=>({...row,tie:(row.sources.includes('project')?8:0)+(row.sources.includes('community')?4:0)+(row.sources.includes('strong')?2:0)+(row.sources.includes('user')?1:0)})).sort((a,b)=>b.votes-a.votes||b.tie-a.tie||display(a.name).localeCompare(display(b.name),'es'));
    return {slot,list};
  });
}
function solve(rows){
  if(rows.some(r=>!r.list.length))return null;
  const order=[...rows].sort((a,b)=>a.list.length-b.list.length||((b.list[0]?.votes||0)-(a.list[0]?.votes||0))||a.slot.key.localeCompare(b.slot.key));
  const suffix=new Array(order.length+1).fill(0);for(let i=order.length-1;i>=0;i--)suffix[i]=suffix[i+1]+Math.max(...order[i].list.map(c=>c.votes*100+c.tie));
  let best=null,bestScore=-1,nodes=0,truncated=false;const used=new Set(),picked={};
  function dfs(i,score){
    if(++nodes>80000){truncated=true;return}if(score+suffix[i]<bestScore)return;
    if(i===order.length){if(score>bestScore){bestScore=score;best={...picked}}return}
    const row=order[i];for(const c of row.list){if(used.has(c.key))continue;used.add(c.key);picked[row.slot.key]=c;dfs(i+1,score+c.votes*100+c.tie);delete picked[row.slot.key];used.delete(c.key);if(truncated&&nodes>80000)break}
  }
  dfs(0,0);
  if(best)return {picked:best,nodes,exact:!truncated,mode:truncated?'bounded':'exact'};
  const fallback={};used.clear();for(const row of rows){const c=row.list.find(x=>!used.has(x.key));if(!c)return null;fallback[row.slot.key]=c;used.add(c.key)}return {picked:fallback,nodes,exact:false,mode:'fallback'};
}
function diff(base,xi){const A=new Map(Object.values(base||{}).filter(Boolean).map(n=>[canonical(n),n])),B=new Map(Object.values(xi||{}).filter(Boolean).map(n=>[canonical(n),n]));return {in:[...B].filter(([k])=>!A.has(k)).map(([,n])=>n),out:[...A].filter(([k])=>!B.has(k)).map(([,n])=>n)}}
function buildState({finalCommunityOnly=false}={}){
  const ctx=lab();if(!ctx)return null;const sources=sourceList(ctx,{finalCommunityOnly});if(sources.length<2)return null;const rows=candidateRows(sources),solution=solve(rows);if(!solution)return null;
  const xi=Object.fromEntries(defs().map(d=>[d.key,solution.picked[d.key]?.name||'']));if(!validXi(xi))return null;
  const total=sources.length,slotsState=defs().map(d=>{const chosen=solution.picked[d.key],options=rows.find(r=>r.slot.key===d.key)?.list||[];return {...d,chosen,options,unanimous:chosen.votes===total,majority:chosen.votes>total/2,split:chosen.votes<=total/2}});
  const project=sources.find(s=>s.id==='project')?.xi||{},mine=current(),dProject=diff(project,xi),dMine=validXi(mine)?diff(mine,xi):{in:[],out:[]};
  return {ctx,sources,total,xi,slots:slotsState,unanimous:slotsState.filter(s=>s.unanimous).length,majority:slotsState.filter(s=>!s.unanimous&&s.majority).length,split:slotsState.filter(s=>s.split).length,dProject,dMine,isClosed:closed(),sameMine:validXi(mine)&&defs().every(d=>same(mine[d.key],xi[d.key])),exact:solution.exact,solveMode:solution.mode,finalCommunityOnly};
}
function auditableState(){return buildState({finalCommunityOnly:true})}
function state(){
  const live=buildState({finalCommunityOnly:false});if(!live)return null;
  const provisionalCommunity=live.sources.some(s=>s.id==='community'&&!s.final),audit=auditableState();
  const provisionalDiff=provisionalCommunity&&audit?diff(audit.xi,live.xi):{in:[],out:[]};
  return {...live,provisionalCommunity,auditXi:audit?.xi||null,auditSources:audit?.sources||[],auditTotal:audit?.total||0,provisionalChanges:provisionalDiff.in.length,auditReady:Boolean(audit)};
}
function sourceLabel(ids){const map={user:'tú',project:'proyecto',strong:'señales',community:'comunidad'};return ids.map(x=>map[x]||x).join(' + ')}
function ensurePrediction(){const section=document.getElementById('prediccion');if(!section)return null;let root=document.getElementById('consensusXI');if(root)return root;root=document.createElement('section');root.id='consensusXI';root.className='card cx-shell';const anchor=document.getElementById('scenarioLab')||document.getElementById('decisionActions')||document.getElementById('decisionBoard');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function ensureMatchday(){const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('consensusXIMatchday');if(root)return root;root=document.createElement('section');root.id='consensusXIMatchday';root.className='card cx-compact';const anchor=document.getElementById('scenarioLabMatchday')||document.getElementById('predictionReadinessMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function load(){const s=state();if(!s||s.isClosed||s.sameMine||typeof setPredictionXI!=='function')return;setPredictionXI(s.xi);const first=defs().find(d=>document.getElementById(`pred_${d.key}`));if(first)document.getElementById(`pred_${first.key}`)?.dispatchEvent(new Event('change',{bubbles:true}));document.dispatchEvent(new CustomEvent('rm-prediction-draft-updated',{detail:{scenario:'consensus'}}));setTimeout(()=>{window.RMPredictionPro?.render?.();window.RMDecisionBoard?.render?.();window.RMDecisionActions?.render?.();window.RMPredictionReadiness?.render?.();window.RMScenarioLab?.render?.();render()},60);safe(()=>toast('XI síntesis cargado · sin guardar'))}
function slotHtml(s,total){const label=s.unanimous?'UNÁNIME':s.majority?'MAYORÍA':'DIVIDIDO',alts=s.options.filter(o=>o.key!==s.chosen.key).slice(0,2);return `<article class="${s.split?'split':s.unanimous?'unanimous':'majority'}"><div><span>${esc(s.label)}</span><em>${label}</em></div><b>${esc(display(s.chosen.name))}</b><small>${s.chosen.votes}/${total} perspectivas · ${esc(sourceLabel(s.chosen.sources))}</small>${alts.length?`<p>${alts.map(a=>`${display(a.name)} ${a.votes}/${total}`).map(esc).join(' · ')}</p>`:''}</article>`}
function auditNotice(s){
  if(s.provisionalCommunity){
    const movement=s.provisionalChanges?` La comunidad provisional mueve ${s.provisionalChanges} titular${s.provisionalChanges===1?'':'es'} frente a la versión auditable.`:' La versión auditable mantiene los mismos 11 titulares.';
    return `<div class="cx-audit-note provisional"><b>EXPLORATORIO</b><span>La comunidad provisional participa en esta vista, pero no se congela en el histórico.${esc(movement)} La auditoría usa solo fuentes disponibles antes del XI y Comunidad únicamente cuando ya es final.</span></div>`;
  }
  return `<div class="cx-audit-note safe"><b>AUDITABLE</b><span>Esta síntesis puede congelarse sin incorporar una Comunidad provisional. Si Comunidad entra, su consenso ya es final.</span></div>`;
}
function html(s){const src=s.sources.map(x=>x.label).join(' · '),projectChange=s.dProject.in.length,mode=s.solveMode==='exact'?'resolución exacta':s.solveMode==='bounded'?'resolución acotada':'modo seguro de respaldo';return `<div class="cx-head"><div><span>XI SÍNTESIS</span><h3>Qué once sale al cruzar todas las perspectivas disponibles</h3><p>No es una probabilidad ni mezcla fuentes independientes: votan los escenarios disponibles y los empates conservan estabilidad favoreciendo Proyecto.</p></div><div class="cx-summary"><b>${s.unanimous} unánimes</b><span>${s.majority} mayoría · ${s.split} divididos</span></div></div>${auditNotice(s)}<div class="cx-sources"><span>${esc(src)}</span><b>${s.total} perspectivas · ${esc(mode)}</b></div><div class="cx-grid">${s.slots.map(x=>slotHtml(x,s.total)).join('')}</div><div class="cx-foot"><p>${projectChange?`La síntesis cambia ${projectChange} titular${projectChange===1?'':'es'} respecto a Proyecto.`:'La síntesis mantiene los mismos 11 titulares que Proyecto.'}</p><button type="button" data-cx-load ${s.isClosed||s.sameMine?'disabled':''}>${s.isClosed?'Predicción cerrada':s.sameMine?'Ya está en tu borrador':'Probar XI síntesis'}</button></div>`}
function render(){const s=state();if(!s)return;const root=ensurePrediction();if(root){root.innerHTML=html(s);root.querySelector('[data-cx-load]')?.addEventListener('click',load)}const compact=ensureMatchday();if(compact){compact.innerHTML=`<div><span>XI SÍNTESIS${s.provisionalCommunity?' · EXPLORATORIO':''}</span><b>${s.unanimous} puestos unánimes · ${s.split} divididos</b><small>${esc(s.sources.map(x=>x.label).join(' · '))}${s.provisionalCommunity?` · histórico: ${s.auditTotal} fuentes auditables`:''}</small></div><button type="button" class="btn" data-cx-open>Ver síntesis</button>`;compact.querySelector('[data-cx-open]')?.addEventListener('click',()=>{safe(()=>showSection('prediccion'));setTimeout(()=>document.getElementById('consensusXI')?.scrollIntoView?.({behavior:'smooth',block:'start'}),80)})}document.dispatchEvent(new CustomEvent('rm-consensus-xi-rendered',{detail:{sources:s.sources.map(x=>x.id),auditableSources:s.auditSources.map(x=>x.id),provisionalCommunity:s.provisionalCommunity,provisionalChanges:s.provisionalChanges,unanimous:s.unanimous,majority:s.majority,split:s.split,projectChanges:s.dProject.in.length}}))}
function install(){if(installed)return;if(!window.RMScenarioLab||typeof currentPredictionXI!=='function'){if(++attempts<100)setTimeout(install,100);return}installed=true;render();['rm-scenario-lab-rendered','rm-community-updated','rm-local-prediction-updated','rm-prediction-draft-updated','rm-decision-board-rendered'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,70)));document.getElementById('prediccion')?.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))setTimeout(render,0)});window.RMConsensusXI=Object.freeze({render,state,auditableState,load})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});install();
})();