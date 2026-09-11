(()=>{
let installed=false,deadlineTimer=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function current(){return safe(()=>currentPredictionXI(),{})||{}}
function values(xi=current()){return safe(()=>predictionValues(xi),Object.values(xi||{}).filter(Boolean))||[]}
function unique(v){return [...new Set(v)]}
function saved(){return safe(()=>getSavedPrediction(),null)}
function closed(){return safe(()=>predictionIsClosed(),false)}
function sameXi(a,b){if(!a||!b)return false;return slots.every(s=>(a[s[0]]||'')===(b[s[0]]||''))}
function proposalValues(){return values(safe(()=>rayoXI,{}))}
function display(n){return safe(()=>displayName(n),n)||n}
function diffFromProposal(v){const mine=new Set(v),base=new Set(proposalValues());return {same:[...mine].filter(n=>base.has(n)),mine:[...mine].filter(n=>!base.has(n)),base:[...base].filter(n=>!mine.has(n))}}
function state(){
  const xi=current(),v=values(xi),u=unique(v),duplicates=v.filter((n,i)=>v.indexOf(n)!==i),data=saved(),isClosed=closed(),complete=v.length===11&&u.length===11,dirty=Boolean(data?.xi)&&!sameXi(xi,data.xi),proposal=diffFromProposal(v);
  return {xi,v,u,duplicates:unique(duplicates),data,isClosed,complete,dirty,proposal};
}
function ensureUi(){
  const section=document.getElementById('prediccion');if(!section||document.getElementById('predictionPro'))return;
  const hero=section.querySelector('.prediction-hero');const block=document.createElement('section');block.id='predictionPro';block.className='pp-overview card';
  block.innerHTML=`<div class="pp-top"><div><span class="pp-kicker">TU XI</span><strong id="ppCount">0/11</strong><small id="ppState">Completa la alineación</small></div><div class="pp-progress"><i id="ppProgress"></i></div><div id="ppProposal" class="pp-proposal"></div></div><div id="ppWarnings" class="pp-warnings"></div><div id="ppPlayers" class="pp-players"></div>`;
  if(hero)hero.insertAdjacentElement('afterend',block);else section.prepend(block);
  const bar=document.createElement('div');bar.id='predictionProBar';bar.className='pp-mobile-bar';bar.innerHTML=`<button type="button" class="pp-clear" id="ppClear">Vaciar</button><button type="button" class="pp-share" id="ppShare">Compartir</button><button type="button" class="pp-save" id="ppSave"><span>Guardar XI</span><b id="ppSaveCount">0/11</b></button>`;section.appendChild(bar);
  bar.querySelector('#ppClear').onclick=()=>safe(()=>window.clearPrediction?.());
  bar.querySelector('#ppShare').onclick=()=>safe(()=>window.sharePrediction?.());
  bar.querySelector('#ppSave').onclick=()=>safe(()=>window.savePrediction?.());
}
function render(){
  ensureUi();const s=state(),count=document.getElementById('ppCount'),progress=document.getElementById('ppProgress'),stateEl=document.getElementById('ppState'),proposal=document.getElementById('ppProposal'),warnings=document.getElementById('ppWarnings'),playersBox=document.getElementById('ppPlayers'),saveBtn=document.getElementById('ppSave'),saveCount=document.getElementById('ppSaveCount');if(!count)return;
  count.textContent=`${s.v.length}/11`;progress.style.width=`${Math.min(100,s.u.length/11*100)}%`;saveCount.textContent=`${s.v.length}/11`;
  let label='Completa la alineación',cls='';
  if(s.isClosed){label=Array.isArray(safe(()=>officialXI,null))?'XI oficial publicado':'Predicción cerrada';cls='closed'}
  else if(s.duplicates.length){label='Corrige jugadores repetidos';cls='warn'}
  else if(s.complete&&!s.data){label='Lista para guardar';cls='ready'}
  else if(s.complete&&s.dirty){label='Cambios sin guardar';cls='warn'}
  else if(s.complete&&s.data){label='Predicción guardada';cls='saved'}
  stateEl.textContent=label;stateEl.className=cls;
  const p=s.proposal;proposal.innerHTML=s.v.length?`<span>Coinciden con nuestra propuesta</span><b>${p.same.length}/11</b>`:'<span>Nuestra propuesta está disponible</span><button type="button" id="ppLoadIdea">Cargarla</button>';
  proposal.querySelector('#ppLoadIdea')?.addEventListener('click',()=>safe(()=>window.loadPredictionPreset?.()));
  const missing=Math.max(0,11-s.v.length),warningsList=[];
  if(missing)warningsList.push(`<span class="pp-warn-neutral">Faltan ${missing} ${missing===1?'jugador':'jugadores'}</span>`);
  if(s.duplicates.length)warningsList.push(`<span class="pp-warn-bad">Repetido: ${s.duplicates.map(display).map(esc).join(' · ')}</span>`);
  if(s.complete&&p.mine.length)warningsList.push(`<span class="pp-warn-change">Tus cambios: ${p.mine.map(display).map(esc).join(' · ')}</span>`);
  warnings.innerHTML=warningsList.join('');
  playersBox.innerHTML=s.v.length?unique(s.v).map(n=>`<span>${esc(display(n))}</span>`).join(''):'<span class="pp-empty">Selecciona jugadores en el campo para construir tu XI.</span>';
  if(saveBtn){saveBtn.disabled=s.isClosed||!s.complete;saveBtn.classList.toggle('is-ready',s.complete&&!s.isClosed);saveBtn.querySelector('span').textContent=s.data&&!s.dirty?'Guardado ✓':s.data?'Actualizar XI':'Guardar XI'}
  document.body.classList.toggle('prediction-pro-active',document.getElementById('prediccion')?.classList.contains('active'));
}
function wrapActions(){
  for(const name of ['savePrediction','clearPrediction','loadPredictionPreset','restorePrediction']){
    const base=window[name];if(typeof base!=='function'||base.__ppWrapped)continue;
    const wrapped=function(...args){const result=base.apply(this,args);setTimeout(render,0);return result};wrapped.__ppWrapped=true;window[name]=wrapped;
  }
}
function bind(){
  const section=document.getElementById('prediccion');if(!section||section.dataset.ppBound)return;section.dataset.ppBound='1';
  section.addEventListener('change',e=>{if(e.target?.matches?.('[id^="pred_"]'))render()});
  section.addEventListener('input',e=>{if(e.target?.id==='predictionName'||e.target?.id==='predictionComment')render()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  document.addEventListener('rm-community-updated',render);
}
function scheduleDeadline(){clearTimeout(deadlineTimer);const ts=safe(()=>new Date(predictionMatch.deadline).getTime(),NaN);if(!Number.isFinite(ts))return;const delay=ts-Date.now()+1000;if(delay>0&&delay<2147483647)deadlineTimer=setTimeout(()=>{safe(()=>renderPredictionStatus());render()},delay)}
function install(){
  if(installed)return;if(!document.getElementById('prediccion')||typeof currentPredictionXI!=='function'||typeof predictionValues!=='function'){setTimeout(install,80);return}
  installed=true;ensureUi();wrapActions();bind();render();scheduleDeadline();window.RMPredictionPro=Object.freeze({render,state});
}
install();
})();