(()=>{
  const css=document.createElement('link');css.rel='stylesheet';css.href='matchday.css?v=1';document.head.appendChild(css);

  const matchSection=['partido','⚽','Partido','Centro del partido','Previa, debates, encuestas y comparación con la comunidad.'];
  if(!sections.some(s=>s[0]==='partido'))sections.splice(1,0,matchSection);
  document.getElementById('navDesktop').innerHTML=navHtml(false);
  document.getElementById('navMobile').innerHTML=navHtml(true);

  const predSection=document.getElementById('prediccion');
  if(predSection&&!document.getElementById('partido')){
    predSection.insertAdjacentHTML('beforebegin',`
      <section class="section" id="partido">
        <div class="section-head"><div><h2>Centro del próximo partido</h2><p>Todo lo que estamos siguiendo antes del Real Madrid–Rayo.</p></div><span class="pill open" id="matchdayState">Previa abierta</span></div>
        <div class="matchday-hero">
          <div class="matchday-scoreboard">
            <div class="eyebrow">LALIGA · JORNADA EN SEGUIMIENTO</div>
            <h2>REAL MADRID <span>vs</span> RAYO</h2>
            <div class="matchday-meta"><span class="pill">12 SEP · 21:00</span><span class="pill">SANTIAGO BERNABÉU</span><span class="pill">LALIGA</span></div>
            <div class="matchday-actions"><button class="btn primary" onclick="showSection('prediccion')">Hacer mi predicción</button><button class="btn" onclick="loadPredictionPreset();showSection('prediccion')">Usar nuestra idea</button><button class="btn" onclick="showSection('comunidad')">Ver comunidad</button></div>
          </div>
          <div class="card countdown-card">
            <div class="eyebrow">CUENTA ATRÁS</div>
            <div class="clock" id="matchdayClock">--:--:--</div>
            <b id="matchdayClockLabel">Hasta el cierre de predicciones</b>
            <small>La predicción se cierra a las 19:55 · partido a las 21:00</small>
          </div>
        </div>

        <div class="matchday-grid">
          <div class="card">
            <div class="eyebrow">NUESTRA PREVIA</div><h2 style="margin:6px 0 14px">Qué estamos vigilando</h2>
            <div class="matchday-points">
              <div class="matchday-point"><span>Fijos que esperamos</span><b>Courtois · Mbappé · Güler · Vini</b></div>
              <div class="matchday-point"><span>Lateral derecho</span><b>Dumfries / Trent</b></div>
              <div class="matchday-point"><span>Centrales</span><b>Rüdiger / Huijsen / Konaté</b></div>
              <div class="matchday-point"><span>Posible descanso</span><b>Valverde / Bellingham</b></div>
              <div class="matchday-point"><span>Banda derecha</span><b>Diomandé / Brahim</b></div>
            </div>
          </div>
          <div class="card">
            <div class="eyebrow">NUESTRA IDEA ACTUAL</div><h2 style="margin:6px 0 4px">XI que estamos valorando</h2>
            <p class="muted" style="margin-top:0">Se irá ajustando con las últimas noticias antes del partido.</p>
            <div class="our-xi-chips" id="matchdayOurXI"></div>
          </div>
        </div>

        <div class="card vs-community" id="matchdayVsCard">
          <div class="section-head" style="margin-top:0"><div><h2>🎯 Nosotros vs Comunidad</h2><p>Antes del partido medimos cuánto coincidimos; después, quién acertó más titulares.</p></div></div>
          <div class="vs-community-inner">
            <div class="vs-team"><small>Nuestra predicción</small><strong id="matchdayOurScore">11 listos</strong></div>
            <div class="vs-separator">VS</div>
            <div class="vs-team"><small>XI de la comunidad</small><strong id="matchdayCommunityScore">Esperando votos</strong></div>
          </div>
          <div class="vs-details">
            <div class="vs-detail"><small>Coincidencias ahora</small><b id="matchdayOverlap">—</b></div>
            <div class="vs-detail"><small>Más unánime</small><b id="matchdayUnanimous">—</b></div>
            <div class="vs-detail"><small>Mayor debate</small><b id="matchdayDebate">—</b></div>
          </div>
        </div>

        <div class="section-head"><div><h2>Encuestas rápidas</h2><p>Un voto por dispositivo en cada pregunta. Puedes cambiarlo hasta el cierre.</p></div><button class="btn" onclick="loadQuickPolls(true)">Actualizar</button></div>
        <div class="quick-polls" id="quickPolls"><div class="card muted">Cargando encuestas…</div></div>
      </section>`);
  }

  const homeKpis=document.querySelector('#inicio .grid.cols-4');
  if(homeKpis&&!document.getElementById('homeVsCommunity')){
    homeKpis.insertAdjacentHTML('afterend',`
      <div class="card home-community-card" id="homeVsCommunity">
        <div class="home-community-title"><div class="eyebrow">🎯 NOSOTROS VS COMUNIDAD</div><h2>La previa también se compite</h2><p class="muted">Comparamos nuestra predicción con el XI más votado y, cuando salga el once oficial, sumamos los aciertos.</p><button class="btn" onclick="showSection('partido')">Abrir centro del partido</button></div>
        <div class="home-community-stats">
          <div class="home-community-stat"><small>Pronósticos</small><b id="homeCommunityTotal">0</b></div>
          <div class="home-community-stat"><small>Coincidimos</small><b id="homeCommunityOverlap">—</b></div>
          <div class="home-community-stat"><small>Más unánime</small><b id="homeCommunityUnanimous">—</b></div>
          <div class="home-community-stat"><small>Mayor debate</small><b id="homeCommunityDebate">—</b></div>
        </div>
      </div>`);
  }

  const ourXiBox=document.getElementById('matchdayOurXI');
  if(ourXiBox)ourXiBox.innerHTML=Object.values(rayoXI).map(n=>`<span>${escapeHtml(displayName(n))}</span>`).join('');

  function allCommunityNames(data){return Object.values(data?.popularXI||{}).map(v=>v?.name).filter(Boolean)}
  function ourNames(){return Object.values(rayoXI)}
  function overlapWithCommunity(data){const set=new Set(allCommunityNames(data));return ourNames().filter(n=>set.has(n)).length}
  function unanimousChoice(data){
    let best=null;
    for(const [slot,rows] of Object.entries(data?.slotShares||{})){
      if(!rows?.[0])continue;const row=rows[0];
      if(!best||row.percentage>best.percentage)best={...row,slot};
    }
    return best;
  }
  function biggestDebate(data){
    const labels={rb:'LD',lb:'LI',lcb:'DFC',rcb:'DFC',dm1:'MC',dm2:'MC',am:'MP',lw:'EI',rw:'ED',st:'DC',gk:'POR'};
    let best=null;
    for(const [slot,rows] of Object.entries(data?.slotShares||{})){
      if(!rows||rows.length<2)continue;
      const margin=Math.abs(rows[0].percentage-rows[1].percentage);
      if(!best||margin<best.margin)best={slot,margin,a:rows[0],b:rows[1],label:labels[slot]||slot};
    }
    return best;
  }
  function scoreAgainstOfficial(names){
    if(!Array.isArray(officialXI))return null;const real=new Set(officialXI);return names.filter(n=>real.has(n)).length;
  }
  function renderVsCommunity(data){
    const total=data?.totalPredictions||0,overlap=total?overlapWithCommunity(data):null,unanimous=unanimousChoice(data),debate=biggestDebate(data);
    const ourScore=scoreAgainstOfficial(ourNames()),communityScore=scoreAgainstOfficial(allCommunityNames(data));
    const ourScoreEl=document.getElementById('matchdayOurScore'),communityScoreEl=document.getElementById('matchdayCommunityScore');
    if(ourScoreEl)ourScoreEl.textContent=ourScore===null?'11 listos':`${ourScore}/11 aciertos`;
    if(communityScoreEl)communityScoreEl.textContent=communityScore===null?(total?`${total} pronóstico${total===1?'':'s'}`:'Esperando votos'):`${communityScore}/11 aciertos`;
    const overlapText=overlap===null?'—':`${overlap}/11 jugadores`;
    const unanimousText=unanimous?`${displayName(unanimous.name)} · ${unanimous.percentage}%`:'—';
    const debateText=debate?`${debate.label}: ${displayName(debate.a.name)} ${debate.a.percentage}% / ${displayName(debate.b.name)} ${debate.b.percentage}%`:'—';
    [['matchdayOverlap',overlapText],['matchdayUnanimous',unanimousText],['matchdayDebate',debateText],['homeCommunityTotal',String(total)],['homeCommunityOverlap',overlapText],['homeCommunityUnanimous',unanimousText],['homeCommunityDebate',debateText]].forEach(([id,text])=>{const el=document.getElementById(id);if(el)el.textContent=text});
  }

  const previousRenderCommunity=renderCommunity;
  renderCommunity=function(data){previousRenderCommunity(data);renderVsCommunity(data)};
  if(communityCache)renderVsCommunity(communityCache);

  let pollCache=null;
  function pollCard(poll,closed){
    return `<div class="quick-poll"><h3>${escapeHtml(poll.question)}</h3><p>${poll.total} voto${poll.total===1?'':'s'}${closed?' · encuesta cerrada':''}</p><div class="poll-options">${poll.options.map(opt=>`<button class="poll-vote ${poll.selected===opt.label?'selected':''}" ${closed?'disabled':''} onclick="voteQuickPoll('${poll.id}','${String(opt.label).replace(/'/g,"\\'")}')"><span>${escapeHtml(opt.label)}</span><span class="pct">${opt.percentage}%</span><span class="barline"><i style="width:${opt.percentage}%"></i></span></button>`).join('')}</div></div>`;
  }
  window.loadQuickPolls=async function(force=false){
    if(pollCache&&!force){renderQuickPolls(pollCache);return}
    const box=document.getElementById('quickPolls');if(box)box.innerHTML='<div class="card muted">Actualizando encuestas…</div>';
    try{
      const response=await fetch(`/.netlify/functions/matchday?participantId=${encodeURIComponent(getParticipantId())}`,{headers:{accept:'application/json'}});
      const data=await response.json();if(!response.ok)throw new Error(data.error||`Error ${response.status}`);pollCache=data;renderQuickPolls(data);
    }catch(error){if(box)box.innerHTML=`<div class="card result-pending"><b>No se pudieron cargar las encuestas</b><span>${escapeHtml(error.message||'Inténtalo de nuevo')}</span></div>`}
  };
  function renderQuickPolls(data){const box=document.getElementById('quickPolls');if(box)box.innerHTML=(data.polls||[]).map(p=>pollCard(p,data.closed)).join('')||'<div class="card muted">Todavía no hay encuestas.</div>'}
  window.voteQuickPoll=async function(pollId,option){
    try{
      const response=await fetch('/.netlify/functions/matchday',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({matchId:predictionMatch.id,participantId:getParticipantId(),pollId,option})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Error ${response.status}`);toast(data.updated?'Voto actualizado':'Voto registrado');pollCache=null;await loadQuickPolls(true);
    }catch(error){toast(error.message||'No se pudo registrar el voto')}
  };

  function updateCountdown(){
    const clock=document.getElementById('matchdayClock'),label=document.getElementById('matchdayClockLabel'),state=document.getElementById('matchdayState');if(!clock)return;
    const now=Date.now(),deadline=Date.parse(predictionMatch.deadline),kickoff=Date.parse(predictionMatch.kickoff);let target=deadline;
    if(now>=deadline&&now<kickoff){target=kickoff;if(label)label.textContent='Hasta el inicio del partido';if(state){state.textContent='Predicción cerrada';state.className='pill closed'}}
    else if(now>=kickoff){clock.textContent='EN JUEGO';if(label)label.textContent='Partido iniciado';if(state){state.textContent='Partido';state.className='pill'};return}
    else{if(label)label.textContent='Hasta el cierre de predicciones';if(state){state.textContent='Previa abierta';state.className='pill open'}}
    const diff=Math.max(0,target-now),d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
    clock.textContent=`${d?d+'d ':''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  updateCountdown();setInterval(updateCountdown,1000);

  const previousShowSection=showSection;
  showSection=function(id){previousShowSection(id);if(id==='partido'){loadQuickPolls();loadCommunity(true)}};
  loadQuickPolls();
  loadCommunity(true);
})();
