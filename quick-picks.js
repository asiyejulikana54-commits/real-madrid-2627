(()=>{
const KEY='rm_quick_picks_v1';
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
function write(db){try{localStorage.setItem(KEY,JSON.stringify(db))}catch{}}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function match(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function official(){return safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)&&officialXI.length?officialXI:null,null)}
function closed(){return Boolean(official()||safe(()=>typeof predictionIsClosed==='function'?predictionIsClosed():false,false))}
function board(){return safe(()=>window.RMDecisionBoard?.state?.(),null)}
function label(id){const raw=String(id||'partido'),m=raw.match(/^(.*)-(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return `${m[1].replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · ${m[4]}/${m[3]}/${m[2]}`}
function candidates(){
  const rows=(board()?.rows||[]).filter(r=>r?.project&&r?.primary?.name&&!same(r.project,r.primary.name)&&r.decisionLevel!=='consensus');
  return rows.sort((a,b)=>{const rank=x=>x.decisionLevel==='strong'?0:x.decisionLevel==='open'?1:2;return rank(a)-rank(b)}).slice(0,3).map((r,i)=>({id:`${r.slot?.key||'slot'}-${i}`,slot:r.slot?.key||'',slotLabel:r.slot?.label||r.slot?.role||r.slot?.key||`Decisión ${i+1}`,project:r.project,alternative:r.primary.name,level:r.decisionLevel||'open',levelLabel:r.decisionLabel||'DEBATE'}));
}
function currentRecord(){const m=match();return m?read()[m.id]||null:null}
function previewQuestions(){const rec=currentRecord();return rec?.questions?.length?rec.questions:candidates()}
function freezeQuestions(){
  const m=match();if(!m||closed())return null;const db=read(),prior=db[m.id];if(prior?.questions?.length)return prior;
  const questions=candidates();if(!questions.length)return null;
  db[m.id]={matchId:m.id,rival:m.rival||'',label:label(m.id),createdAt:new Date().toISOString(),questions,picks:{}};write(db);return db[m.id];
}
function choose(questionId,name){
  if(closed())return false;const rec=freezeQuestions();if(!rec)return false;const q=rec.questions.find(x=>x.id===questionId);if(!q||(!same(name,q.project)&&!same(name,q.alternative)))return false;
  const db=read(),row=db[rec.matchId];row.picks={...(row.picks||{}),[questionId]:{choice:name,pickedAt:new Date().toISOString()}};write(db);document.dispatchEvent(new CustomEvent('rm-quick-picks-updated',{detail:{matchId:rec.matchId,questionId,choice:name}}));render();return true;
}
function outcome(q,pick,actualSet){
  const projectIn=actualSet.has(canonical(q.project)),altIn=actualSet.has(canonical(q.alternative));let winner=null;
  if(projectIn&&!altIn)winner=q.project;else if(!projectIn&&altIn)winner=q.alternative;
  return {projectIn,altIn,resolved:Boolean(winner),winner,correct:Boolean(winner&&pick?.choice&&same(pick.choice,winner))};
}
function settle(id=null){
  const actual=official(),m=match();if(!actual)return null;const db=read(),target=id||m?.id,rec=target?db[target]:null;if(!rec?.questions?.length)return null;
  if(rec.settledAt&&Array.isArray(rec.results))return rec;
  const set=new Set(actual.map(canonical)),results=rec.questions.map(q=>({questionId:q.id,...outcome(q,rec.picks?.[q.id],set)})),answered=rec.questions.filter(q=>rec.picks?.[q.id]).length,resolved=results.filter(r=>r.resolved&&rec.picks?.[r.questionId]).length,correct=results.filter(r=>r.resolved&&rec.picks?.[r.questionId]&&r.correct).length;
  db[target]={...rec,officialXI:[...actual],results,answered,resolved,correct,perfect:resolved===3&&correct===3,settledAt:new Date().toISOString()};write(db);return db[target];
}
function records(){const db=read(),m=match();if(m&&db[m.id])settle(m.id);return Object.values(read()).sort((a,b)=>String(b.settledAt||b.createdAt||'').localeCompare(String(a.settledAt||a.createdAt||'')))}
function stats(){
  const scored=records().filter(r=>Number.isFinite(r.correct)&&Number.isFinite(r.resolved)&&r.resolved>0),resolved=scored.reduce((n,r)=>n+r.resolved,0),correct=scored.reduce((n,r)=>n+r.correct,0),perfect=scored.filter(r=>r.perfect).length;
  let streak2=0;for(const r of scored){if(r.resolved>=2&&r.correct>=2)streak2++;else break}
  return {scored,resolved,correct,accuracy:resolved?correct/resolved:null,perfect,streak2};
}
function qState(q,rec){const pick=rec?.picks?.[q.id]||null,result=rec?.results?.find(r=>r.questionId===q.id)||null;return {pick,result}}
function optionButton(q,name,kind,rec,isClosed){const s=qState(q,rec),selected=s.pick&&same(s.pick.choice,name),winner=s.result?.winner&&same(s.result.winner,name),wrong=s.result?.resolved&&selected&&!winner;return `<button type="button" class="qp-option ${kind} ${selected?'selected':''} ${winner?'winner':''} ${wrong?'wrong':''}" data-qp-id="${esc(q.id)}" data-qp-choice="${esc(name)}" ${isClosed?'disabled':''}><b>${esc(display(name))}</b>${s.result?.resolved?`<small>${winner?'✓ TITULAR':'No gana el duelo'}</small>`:`<small>${kind==='project'?'Proyecto':'Alternativa'}</small>`}</button>`}
function questionHtml(q,rec,isClosed){const s=qState(q,rec),status=s.result?(s.result.resolved?(s.pick?`<em class="${s.result.correct?'good':'bad'}">${s.result.correct?'ACIERTO':'FALLO'}</em>`:'<em>PENDIENTE SIN VOTO</em>'):'<em class="void">ANULADA · JUEGAN AMBOS O NINGUNO</em>'):(s.pick?'<em class="picked">✓ ELEGIDO</em>':'<em>ELIGE UNO</em>');return `<article class="qp-question"><div><span>${esc(q.slotLabel)}</span>${status}</div><div class="qp-options">${optionButton(q,q.project,'project',rec,isClosed)}${optionButton(q,q.alternative,'alternative',rec,isClosed)}</div></article>`}
function currentSummary(rec){if(!rec?.settledAt)return '';const score=Number(rec.correct)||0,resolved=Number(rec.resolved)||0;return `<div class="qp-result"><span>RESULTADO</span><b>${score}/${resolved}</b><small>${rec.perfect?'Perfecto: 3/3 decisiones resueltas.':`${rec.answered||0}/3 respuestas · ${3-resolved} sin resolver o sin voto.`}</small><button type="button" class="qp-share" data-qp-share="1">Compartir resultado</button></div>`}
function homeRoot(){const parent=document.getElementById('personalizedHome');if(!parent)return null;let root=document.getElementById('quickPicks');if(root)return root;root=document.createElement('section');root.id='quickPicks';root.className='card qp-shell';const engagement=document.getElementById('engagementLoop');if(engagement)engagement.insertAdjacentElement('afterend',root);else parent.appendChild(root);return root}
function seasonRoot(){const content=document.getElementById('personalHubContent');if(!content)return null;let root=document.getElementById('quickPicksSeason');if(root)return root;root=document.createElement('section');root.id='quickPicksSeason';root.className='card qp-season';const anchor=document.getElementById('engagementSeason')||content.querySelector('.psp-kpis');if(anchor)anchor.insertAdjacentElement('afterend',root);else content.prepend(root);return root}
function matchdayRoot(){const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('quickPicksMatchday');if(root)return root;root=document.createElement('section');root.id='quickPicksMatchday';root.className='card qp-compact';const anchor=document.getElementById('officialXiReviewMatchday')||document.getElementById('matchdayDynamic');if(anchor)anchor.insertAdjacentElement('afterend',root);else section.appendChild(root);return root}
function shareCurrent(rec){if(!rec?.settledAt)return;const text=`Mis Quick Picks del Real Madrid: ${rec.correct}/${rec.resolved} decisiones acertadas${rec.perfect?' · 3/3 perfecto':''}. RM 26/27`;if(navigator.share)safe(()=>navigator.share({title:'RM 26/27 · Quick Picks',text}));else if(navigator.clipboard?.writeText)safe(()=>navigator.clipboard.writeText(text));}
function bind(root,rec){root?.querySelectorAll('[data-qp-choice]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.qpId,b.dataset.qpChoice)));root?.querySelector('[data-qp-share]')?.addEventListener('click',()=>shareCurrent(rec));root?.querySelector('[data-qp-go]')?.addEventListener('click',()=>safe(()=>showSection(root.querySelector('[data-qp-go]').dataset.qpGo)))}
function renderHome(){
  const root=homeRoot();if(!root)return false;const m=match(),rec=currentRecord();if(rec)settle(rec.matchId);const now=currentRecord(),questions=previewQuestions(),isClosed=closed();
  if(!m||!questions.length){root.hidden=true;root.innerHTML='';return false}root.hidden=false;
  const answered=questions.filter(q=>now?.picks?.[q.id]).length;
  root.innerHTML=`<div class="qp-head"><div><span>QUICK PICKS</span><h3>3 decisiones. 20 segundos.</h3><p>${isClosed?'Tus elecciones quedan bloqueadas al cierre y se resuelven con el XI oficial.':'Elige entre Proyecto y alternativa. Al participar se congelan estas tres preguntas para el partido.'}</p></div><b>${now?.settledAt?`${now.correct}/${now.resolved}`:`${answered}/3`}</b></div><div class="qp-grid">${questions.map(q=>questionHtml(q,now,isClosed)).join('')}</div>${currentSummary(now)}${!isClosed&&answered===0?'<p class="qp-note">No hace falta completar un XI entero: puedes participar solo con estas decisiones rápidas.</p>':''}`;bind(root,now);return true
}
function renderSeason(){
  const section=document.getElementById('mi-temporada');if(!section?.classList.contains('active'))return false;const root=seasonRoot();if(!root)return false;const s=stats(),recent=s.scored.slice(0,6),pct=s.accuracy===null?'—':`${Math.round(s.accuracy*100)}%`;
  root.innerHTML=`<div class="qp-season-head"><div><span>HISTORIAL QUICK PICKS</span><h3>Tu intuición en las decisiones clave</h3><p>Solo cuentan duelos respondidos antes del cierre y resolubles por el XI oficial. Si salen ambos jugadores o ninguno, la pregunta se anula.</p></div><b>${pct}</b></div><div class="qp-season-kpis"><div><span>Aciertos</span><b>${s.correct}</b><small>de ${s.resolved} resueltos</small></div><div><span>Perfectos</span><b>${s.perfect}</b><small>jornadas 3/3</small></div><div><span>Racha 2+</span><b>${s.streak2}</b><small>jornadas seguidas con al menos 2 aciertos</small></div></div>${recent.length?`<div class="qp-history">${recent.map(r=>`<div><span>${esc(r.label||label(r.matchId))}</span><b>${r.correct}/${r.resolved}</b><small>${r.perfect?'PERFECTO':`${r.answered||0}/3 respondidas`}</small></div>`).join('')}</div>`:'<div class="qp-empty">Todavía no hay Quick Picks puntuados.</div>'}`;return true
}
function renderMatchday(){const root=matchdayRoot();if(!root)return false;const rec=currentRecord();if(rec)settle(rec.matchId);const now=currentRecord(),qs=previewQuestions();if(!qs.length){root.hidden=true;root.innerHTML='';return false}root.hidden=false;const answered=qs.filter(q=>now?.picks?.[q.id]).length;root.innerHTML=`<div class="qp-compact-row"><div><span>QUICK PICKS</span><b>${now?.settledAt?`${now.correct}/${now.resolved} aciertos`:`${answered}/3 respondidas`}</b></div><button type="button" class="btn" data-qp-go="inicio">${now?.settledAt?'Ver resultado':'Responder'}</button></div>`;bind(root,now);return true}
function render(){renderHome();renderSeason();renderMatchday();document.dispatchEvent(new CustomEvent('rm-quick-picks-rendered'))}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!window.RMDecisionBoard||!document.getElementById('inicio')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;settle();render();
  ['rm-decision-board-rendered','rm-season-data-ready','rm-season-extension-ready','rm-local-prediction-updated','rm-official-xi-review-rendered'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(()=>{settle();render()},80)));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){settle();render()}});window.addEventListener('storage',e=>{if(!e.key||e.key===KEY)setTimeout(render,50)});
  window.RMQuickPicks=Object.freeze({render,records,stats,current:currentRecord,choose,settle});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,160);
})();
