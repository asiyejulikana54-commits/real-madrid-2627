(()=>{
  const endpoint='https://vvltmdedwgjtvlcmindn.supabase.co/functions/v1/community';
  const match=predictionMatch;
  const storageKey=`rm_prediction_${match.id}`;
  const apiUrl=params=>{const url=new URL(endpoint);for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));return url.href};

  communityBackendAvailable=function(){return /^https?:$/.test(location.protocol)};
  communityApiUrl=apiUrl;

  function saved(){try{return JSON.parse(localStorage.getItem(storageKey)||'null')}catch{return null}}
  function closed(){return Date.now()>=new Date(match.deadline).getTime()}
  function teams(){return match.home===false?{home:match.rival,away:'Real Madrid'}:{home:'Real Madrid',away:match.rival}}
  function formatKickoff(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(d).replace(',',' ·').toUpperCase():''}
  function formatClock(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(d):''}
  function syncCopy(){
    const t=teams(),hero=document.querySelector('#inicio .next-match');
    if(hero){
      const title=hero.querySelector('.match-title');if(title)title.innerHTML=`${escapeHtml(t.home.toUpperCase())} <span>vs</span> ${escapeHtml(t.away.toUpperCase())}`;
      const meta=hero.querySelector('.match-meta');if(meta)meta.innerHTML=[formatKickoff(match.kickoff),match.comp,match.venue].filter(Boolean).map(v=>`<span class="pill">${escapeHtml(v)}</span>`).join('');
    }
    const focus=document.querySelector('#inicio .focus-box h3');if(focus)focus.textContent=`Debates abiertos para el ${match.rival}`;
    const notes=document.getElementById('notes');if(notes)notes.placeholder=`Ej.: contra el ${match.rival} quiero anotar rotaciones, descansos y dudas tácticas...`;
    const predHead=document.querySelector('#prediccion .section-head h2');if(predHead)predHead.textContent=`Predice el XI contra el ${match.rival}`;
    const rules=document.querySelector('#prediccion .prediction-rules');if(rules)rules.innerHTML=`<b>${escapeHtml(t.home.toUpperCase())} vs ${escapeHtml(t.away.toUpperCase())}</b><span>${escapeHtml(formatKickoff(match.kickoff))}</span><span>Se cierra: ${escapeHtml(formatClock(match.deadline))}</span>`;
  }

  predictionIsClosed=closed;
  getSavedPrediction=saved;
  restorePrediction=function(){
    const data=saved();
    if(data?.xi){
      setPredictionXI(data.xi);
      const name=document.getElementById('predictionName'),comment=document.getElementById('predictionComment');
      if(name)name.value=data.name||'';if(comment)comment.value=data.comment||'';
    }else setPredictionXI({});
  };
  renderPredictionStatus=function(){
    const status=document.getElementById('predictionStatus'),isClosed=closed();
    if(status){status.textContent=isClosed?'Predicción cerrada':'Predicción abierta';status.className='pill '+(isClosed?'closed':'open')}
    slots.forEach(s=>{const el=document.getElementById('pred_'+s[0]);if(el)el.disabled=isClosed});
    const save=document.getElementById('savePredictionBtn');if(save)save.disabled=isClosed;
    renderPredictionResult();
  };
  renderPredictionResult=function(){
    const box=document.getElementById('predictionResult');if(!box)return;
    const data=saved();
    if(!data){box.innerHTML='<div class="result-pending"><b>Aún no has guardado una predicción.</b><span>Completa el once y pulsa “Publicar predicción”.</span></div>';return}
    const when=new Date(data.savedAt).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});
    box.innerHTML=`<div class="result-pending"><b>Predicción guardada ✓</b><span>${data.name?`${data.name} · `:''}${when}</span><span>El resultado aparecerá aquí cuando publiquemos el once oficial del Real Madrid.</span></div>`;
  };
  savePrediction=async function(){
    if(closed()){toast('La predicción ya está cerrada');return}
    const xi=currentPredictionXI(),values=predictionValues(xi),alias=document.getElementById('predictionName')?.value.trim()||'',comment=document.getElementById('predictionComment')?.value.trim()||'';
    if(values.length!==11){toast('Completa los 11 jugadores');return}
    if(new Set(values).size!==11){toast('No puedes repetir jugadores');return}
    if(alias.length<2){toast('Pon un apodo de al menos 2 caracteres');return}
    const local={matchId:match.id,savedAt:new Date().toISOString(),name:alias,comment,xi};
    localStorage.setItem(storageKey,JSON.stringify(local));renderPredictionResult();
    const btn=document.getElementById('savePredictionBtn');if(btn){btn.disabled=true;btn.textContent='Publicando…'}
    try{
      const response=await fetch(apiUrl(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({participantId:getParticipantId(),alias,matchId:match.id,xi})});
      const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||`Error ${response.status}`);
      toast(result.updated?'Predicción comunitaria actualizada':'Predicción publicada en la comunidad');communityCache=null;await loadCommunity(true);setTimeout(()=>showSection('comunidad'),250);
    }catch(error){toast(`Guardada en tu móvil · ${error.message||'sin conexión con la comunidad'}`)}
    finally{if(btn){btn.textContent='Publicar predicción';btn.disabled=closed()}}
  };
  sharePrediction=async function(){
    const data=saved()||{xi:currentPredictionXI(),name:document.getElementById('predictionName')?.value.trim()||''},names=predictionValues(data.xi||{});
    if(names.length!==11){toast('Completa primero tus 11 jugadores');return}
    const t=teams(),text=`Mi predicción del XI para ${t.home} vs ${t.away} (${names.map(displayName).join(', ')}). ¿Cuántos acertaré?`;
    try{if(navigator.share)await navigator.share({title:'RM 26/27 · Mi predicción',text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Predicción copiada')}}catch(e){if(e?.name!=='AbortError')toast('No se pudo compartir')}
  };

  renderSimpleXiComparison=function(data=communityCache){
    const section=document.getElementById('prediccion');if(!section)return;
    let root=document.getElementById('simpleXiComparison');
    if(!root){root=document.createElement('section');root.id='simpleXiComparison';root.className='card';root.style.marginTop='16px';section.appendChild(root)}
    const mine=simpleValidXi(saved()?.xi)?saved().xi:(simpleValidXi(currentPredictionXI())?currentPredictionXI():null),community=simpleCommunityXi(data);
    if(!mine&&!community){root.hidden=true;root.innerHTML='';return}
    root.hidden=false;
    if(!mine){root.innerHTML='<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Completa y publica tus 11 para compararlos con el consenso.</p></div></div>';return}
    if(!community){root.innerHTML='<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Tu XI está listo. El cruce aparecerá cuando exista un consenso comunitario válido de 11 jugadores.</p></div></div>';return}
    const d=simpleXiDiff(mine,community),chips=(list,kind='')=>`<div class="prediction-list ${kind}">${list.length?list.map(n=>`<span>${escapeHtml(displayName(n))}</span>`).join(''):'<span>—</span>'}</div>`;
    root.innerHTML=`<div class="section-head" style="margin-top:0"><div><h2>Tu XI vs Comunidad</h2><p>Comparación por jugadores elegidos; la posición exacta no cambia el 0–11.</p></div></div><div class="grid cols-3"><div class="kpi"><div class="label">Coincidencias</div><div class="value">${d.same.length}/11</div><div class="hint">mismos jugadores</div></div><div class="kpi"><div class="label">Solo en tu XI</div><div class="value">${d.onlyA.length}</div><div class="hint">diferencias tuyas</div></div><div class="kpi"><div class="label">Solo comunidad</div><div class="value">${d.onlyB.length}</div><div class="hint">diferencias del consenso</div></div></div>${d.onlyA.length||d.onlyB.length?`<div class="result-breakdown" style="margin-top:14px"><b>Solo en tu XI</b>${chips(d.onlyA,'good')}<b>Solo en la comunidad</b>${chips(d.onlyB,'bad')}</div>`:''}`;
  };

  window.RMCommunityApi=Object.freeze({url:apiUrl,available:communityBackendAvailable,participantId:getParticipantId,refresh:()=>loadCommunity(true),match:Object.freeze({...match})});

  function boot(){syncCopy();restorePrediction();renderPredictionStatus();setTimeout(()=>loadCommunity(true),0)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
