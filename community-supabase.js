(()=>{
  const endpoint='https://vvltmdedwgjtvlcmindn.supabase.co/functions/v1/community';
  const match={id:'elche-2026-09-15',rival:'Elche',kickoff:'2026-09-15T21:30:00+02:00',deadline:'2026-09-15T20:25:00+02:00'};
  const storageKey=`rm_prediction_${match.id}`;
  const apiUrl=params=>{const url=new URL(endpoint);for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));return url.href};
  communityBackendAvailable=function(){return /^https?:$/.test(location.protocol)};
  communityApiUrl=apiUrl;

  function saved(){try{return JSON.parse(localStorage.getItem(storageKey)||'null')}catch{return null}}
  function closed(){return Date.now()>=new Date(match.deadline).getTime()}
  function syncCopy(){
    const hero=document.querySelector('#inicio .next-match');
    if(hero){const title=hero.querySelector('.match-title');if(title)title.innerHTML='ELCHE <span>vs</span> REAL MADRID';const pills=hero.querySelectorAll('.match-meta .pill');if(pills[0])pills[0].textContent='15 SEP 2026 · 21:30';if(pills[1])pills[1].textContent='LALIGA';if(pills[2])pills[2].textContent='MARTÍNEZ VALERO'}
    const focus=document.querySelector('#inicio .focus-box h3');if(focus)focus.textContent='Debates abiertos para el Elche';
    const notes=document.getElementById('notes');if(notes)notes.placeholder='Ej.: contra el Elche quiero comprobar rotaciones, descansos y cambios respecto al Rayo...';
    const predHead=document.querySelector('#prediccion .section-head h2');if(predHead)predHead.textContent='Predice el XI contra el Elche';
    const rules=document.querySelector('#prediccion .prediction-rules');if(rules)rules.innerHTML='<b>ELCHE vs REAL MADRID</b><span>15 SEP · 21:30</span><span>Se cierra: 20:25</span>';
  }

  predictionIsClosed=closed;
  getSavedPrediction=saved;
  restorePrediction=function(){const data=saved();if(data?.xi){setPredictionXI(data.xi);document.getElementById('predictionName').value=data.name||'';document.getElementById('predictionComment').value=data.comment||''}else{setPredictionXI({})}};
  renderPredictionStatus=function(){const status=document.getElementById('predictionStatus'),isClosed=closed();status.textContent=isClosed?'Predicción cerrada':'Predicción abierta';status.className='pill '+(isClosed?'closed':'open');slots.forEach(s=>document.getElementById('pred_'+s[0]).disabled=isClosed);document.getElementById('savePredictionBtn').disabled=isClosed;renderPredictionResult()};
  renderPredictionResult=function(){const box=document.getElementById('predictionResult'),data=saved();if(!data){box.innerHTML='<div class="result-pending"><b>Aún no has guardado una predicción.</b><span>Completa el once y pulsa “Publicar predicción”.</span></div>';return}const when=new Date(data.savedAt).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});box.innerHTML=`<div class="result-pending"><b>Predicción guardada ✓</b><span>${data.name?`${data.name} · `:''}${when}</span><span>El resultado aparecerá aquí cuando publiquemos el once oficial del Elche.</span></div>`};
  savePrediction=async function(){
    if(closed()){toast('La predicción ya está cerrada');return}
    const xi=currentPredictionXI(),values=predictionValues(xi),alias=document.getElementById('predictionName').value.trim(),comment=document.getElementById('predictionComment').value.trim();
    if(values.length!==11){toast('Completa los 11 jugadores');return}if(new Set(values).size!==11){toast('No puedes repetir jugadores');return}if(alias.length<2){toast('Pon un apodo de al menos 2 caracteres');return}
    const local={matchId:match.id,savedAt:new Date().toISOString(),name:alias,comment,xi};localStorage.setItem(storageKey,JSON.stringify(local));renderPredictionResult();
    const btn=document.getElementById('savePredictionBtn');btn.disabled=true;btn.textContent='Publicando…';
    try{const response=await fetch(apiUrl(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:getParticipantId(),alias,matchId:match.id,xi})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);toast(result.updated?'Predicción comunitaria actualizada':'Predicción publicada en la comunidad');communityCache=null;await loadCommunity(true);setTimeout(()=>showSection('comunidad'),250)}catch(error){toast(`Guardada en tu móvil · ${error.message||'sin conexión con la comunidad'}`)}finally{btn.textContent='Publicar predicción';btn.disabled=closed()}
  };
  sharePrediction=async function(){const data=saved()||{xi:currentPredictionXI(),name:document.getElementById('predictionName').value.trim()};const names=predictionValues(data.xi||{});if(names.length!==11){toast('Completa primero tus 11 jugadores');return}const text=`Mi predicción del XI del Real Madrid vs Elche (${names.map(displayName).join(', ')}). ¿Cuántos acertaré?`;try{if(navigator.share)await navigator.share({title:'RM 26/27 · Mi predicción',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Predicción copiada')}}catch(e){if(e?.name!=='AbortError')toast('No se pudo compartir')}};
  renderSimpleXiComparison=function(data=communityCache){
    const section=document.getElementById('prediccion');if(!section)return;let root=document.getElementById('simpleXiComparison');if(!root){root=document.createElement('section');root.id='simpleXiComparison';root.className='card';root.style.marginTop='16px';section.appendChild(root)}
    const mine=simpleValidXi(saved()?.xi)?saved().xi:(simpleValidXi(currentPredictionXI())?currentPredictionXI():null),community=simpleCommunityXi(data);if(!mine&&!community){root.hidden=true;root.innerHTML='';return}root.hidden=false;if(!mine){root.innerHTML='<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Completa y publica tus 11 para compararlos con el consenso.</p></div></div>';return}if(!community){root.innerHTML='<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Tu XI está listo. El cruce aparecerá cuando exista un consenso comunitario válido de 11 jugadores.</p></div></div>';return}const d=simpleXiDiff(mine,community),chips=(list,kind='')=>`<div class="prediction-list ${kind}">${list.length?list.map(n=>`<span>${escapeHtml(displayName(n))}</span>`).join(''):'<span>—</span>'}</div>`;root.innerHTML=`<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Comparación por jugadores elegidos; la posición exacta no cambia el 0–11.</p></div></div><div class="grid cols-3"><div class="kpi"><div class="label">Coincidencias</div><div class="value">${d.same.length}/11</div><div class="hint">mismos jugadores</div></div><div class="kpi"><div class="label">Solo en tu XI</div><div class="value">${d.onlyA.length}</div><div class="hint">diferencias tuyas</div></div><div class="kpi"><div class="label">Solo comunidad</div><div class="value">${d.onlyB.length}</div><div class="hint">diferencias del consenso</div></div></div>${d.onlyA.length||d.onlyB.length?`<div class="result-breakdown" style="margin-top:14px"><b>Solo en tu XI</b>${chips(d.onlyA,'good')}<b>Solo en la comunidad</b>${chips(d.onlyB,'bad')}</div>`:''}`;
  };
  window.RMCommunityApi=Object.freeze({url:apiUrl,available:communityBackendAvailable,participantId:getParticipantId,refresh:()=>loadCommunity(true),match:Object.freeze({...match})});
  syncCopy();restorePrediction();renderPredictionStatus();
  if(document.readyState!=='loading')setTimeout(()=>loadCommunity(true),0);else document.addEventListener('DOMContentLoaded',()=>{syncCopy();restorePrediction();renderPredictionStatus();loadCommunity(true)},{once:true});
})();