(()=>{
if(window.RMUiFixes20260916)return;
window.RMUiFixes20260916=true;

const style=document.createElement('style');
style.id='rm-ui-fixes-20260916-style';
style.textContent=`
.rm-mvp-enhanced .mvp-pro-pick-controls{display:none!important}
.rm-mvp-picker{width:100%;margin-top:10px;border:1px solid var(--line);border-radius:13px;background:#091522;overflow:hidden}
.rm-mvp-picker summary{list-style:none;cursor:pointer;padding:12px 14px;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:space-between;gap:10px}
.rm-mvp-picker summary::-webkit-details-marker{display:none}
.rm-mvp-picker summary:after{content:'+';color:var(--gold);font-size:20px;line-height:1}
.rm-mvp-picker[open] summary:after{content:'−'}
.rm-mvp-options{display:grid;border-top:1px solid var(--line)}
.rm-mvp-option{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;border:0;border-top:1px solid rgba(255,255,255,.07);background:transparent;color:#fff;padding:12px 14px;font:inherit;cursor:pointer}
.rm-mvp-option:first-child{border-top:0}
.rm-mvp-option span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rm-mvp-option small{color:var(--gold);font-weight:900}
.rm-mvp-option:active{background:rgba(216,180,74,.10)}
.rm-my-xi-card{order:4;margin-top:16px}
.rm-comp-compare{margin-top:16px;padding:18px}
.rm-comp-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}
.rm-comp-head h3{margin:3px 0 4px;color:#fff;font-size:20px}
.rm-comp-head p{margin:0;color:var(--muted);font-size:13px;line-height:1.45;max-width:760px}
.rm-comp-samples{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.rm-comp-samples span{border:1px solid var(--line);border-radius:999px;padding:6px 9px;color:#cfd8e3;font-size:11px;font-weight:800;white-space:nowrap}
.rm-comp-warning{margin:0 0 12px;padding:10px 12px;border:1px solid rgba(216,180,74,.28);border-radius:12px;background:rgba(216,180,74,.07);color:#e7d79e;font-size:12px;line-height:1.45}
.rm-comp-list{display:grid;gap:7px}
.rm-comp-row{width:100%;display:grid;grid-template-columns:minmax(150px,1.5fr) minmax(80px,.65fr) minmax(80px,.65fr) minmax(72px,.55fr);gap:10px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.025);color:#fff;padding:10px 12px;font:inherit;cursor:pointer}
.rm-comp-row:hover{background:rgba(255,255,255,.05)}
.rm-comp-player{min-width:0}.rm-comp-player b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rm-comp-player small{display:block;color:var(--muted);margin-top:2px}
.rm-comp-metric small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}.rm-comp-metric b{display:block;margin-top:2px;font-size:15px}
.rm-comp-delta{text-align:right;font-size:16px}.rm-comp-delta.up{color:#75d6a5}.rm-comp-delta.down{color:#ff9696}.rm-comp-delta.flat{color:#cbd4df}
.rm-comp-empty{padding:14px;border:1px dashed var(--line);border-radius:12px;color:var(--muted)}
@media(max-width:680px){.rm-mvp-option{padding:14px}.rm-mvp-picker summary{padding:14px}.rm-comp-head{display:block}.rm-comp-samples{justify-content:flex-start;margin-top:10px}.rm-comp-row{grid-template-columns:minmax(120px,1.35fr) 1fr 1fr auto;padding:10px 9px;gap:7px}.rm-comp-player small{font-size:10px}.rm-comp-metric b,.rm-comp-delta{font-size:13px}.rm-comp-metric small{font-size:9px}}
`;
document.head.appendChild(style);

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function display(v){return safe(()=>typeof displayName==='function'?displayName(v):v,v)||v}

function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
function matchTeams(match){const rival=String(match?.rival||'Rival');return match?.home===false?{home:rival,away:'Real Madrid'}:{home:'Real Madrid',away:rival}}
function matchHtml(match){const t=matchTeams(match);return `${esc(t.home.toUpperCase())} <span>vs</span> ${esc(t.away.toUpperCase())}`}
function seasonMatch(match){
  if(!match)return null;const data=window.RMSeasonData,rival=String(match.rival||'').trim().toLocaleLowerCase('es');
  return safe(()=>(data?.matches||[]).find(m=>String(m.label||'').trim().toLocaleLowerCase('es')===rival),null);
}
function analyzed(match){
  const sm=seasonMatch(match),data=window.RMSeasonData,xi=safe(()=>typeof officialXI!=='undefined'&&Array.isArray(officialXI)?officialXI:[],[]);
  return Boolean(sm&&xi.length===11&&xi.some(name=>Number.isFinite(safe(()=>data?.officialRatingEntry?.(sm.id,name)?.value,null))||Number.isFinite(safe(()=>data?.minutes?.(sm.id,name),null))));
}
function formatKickoff(value){
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
  return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(d).replace(',',' ·').toUpperCase();
}
function formatClock(value){const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(d):''}
function syncMatchCopy(){
  const match=currentMatch();if(!match)return;const rival=String(match.rival||'Rival'),done=analyzed(match),sm=seasonMatch(match),kickoff=formatKickoff(match.kickoff),deadline=formatClock(match.deadline);
  const home=document.getElementById('inicio');
  const title=home?.querySelector('.card.hero .match-title');if(title)title.innerHTML=matchHtml(match);
  const meta=home?.querySelector('.card.hero .match-meta');if(meta)meta.innerHTML=[kickoff,sm?.comp||match.comp,match.venue].filter(Boolean).map(v=>`<span class="pill">${esc(v)}</span>`).join('');
  const focus=home?.querySelector('.card.hero .focus-box h3');if(focus)focus.textContent=done?`Claves del ${rival}`:`Debates abiertos para el ${rival}`;
  const notes=home?.querySelector('.quick-notes textarea');if(notes&&/Rayo/i.test(notes.placeholder||''))notes.placeholder=`Ej.: contra el ${rival} quiero anotar cambios, dudas tácticas o conclusiones del partido...`;
  const pred=document.getElementById('prediccion');
  const head=pred?.querySelector(':scope>.section-head h2');if(head)head.textContent=done?`XI oficial contra el ${rival}`:`Predice el XI contra el ${rival}`;
  const rules=pred?.querySelector('.prediction-rules');if(rules){const strong=rules.querySelector('b');if(strong){const t=matchTeams(match);strong.textContent=`${t.home.toUpperCase()} vs ${t.away.toUpperCase()}`;}const spans=rules.querySelectorAll('span');if(spans[0])spans[0].textContent=kickoff||'Horario pendiente';if(spans[1])spans[1].textContent=deadline?`Se cierra: ${deadline}`:'Cierre pendiente'}
  window.RMMatchContext=Object.freeze({current:()=>currentMatch(),seasonMatch:()=>seasonMatch(currentMatch()),analyzed:()=>analyzed(currentMatch())});
}

function enhanceMvpPickers(){
  document.querySelectorAll('.mvp-pro-pick').forEach(box=>{
    const select=box.querySelector('[data-mvp-select]');
    const save=box.querySelector('[data-mvp-save]');
    if(!select||!save||box.classList.contains('rm-mvp-enhanced'))return;
    const opts=[...select.options].filter(o=>o.value);
    if(!opts.length)return;
    box.classList.add('rm-mvp-enhanced');
    const details=document.createElement('details');details.className='rm-mvp-picker';
    const summary=document.createElement('summary');
    const current=select.options[select.selectedIndex]?.value||'';
    summary.textContent=current?`Cambiar mi MVP · ${display(current)}`:'Elegir mi MVP';
    const list=document.createElement('div');list.className='rm-mvp-options';
    opts.forEach(opt=>{
      const btn=document.createElement('button');btn.type='button';btn.className='rm-mvp-option';btn.dataset.rmMvpValue=opt.value;
      const parts=String(opt.textContent||'').split(' · ');
      btn.innerHTML=`<span>${esc(parts[0]||opt.value)}</span><small>${esc(parts.slice(1).join(' · '))}</small>`;
      btn.addEventListener('click',()=>{
        select.value=opt.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        details.open=false;
        save.click();
      });
      list.appendChild(btn);
    });
    details.append(summary,list);
    const controls=box.querySelector('.mvp-pro-pick-controls');
    controls?.insertAdjacentElement('beforebegin',details);
  });
}

const XI_ORDER=['gk','lb','lcb','rcb','rb','dm1','dm2','am','lw','rw','st'];
function savedXiNames(){
  const pred=safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null),xi=pred?.xi||{};
  return XI_ORDER.map(k=>xi[k]).filter(Boolean);
}
function addMyXiCard(){
  const grid=document.querySelector('#milContent .mil-grid');if(!grid)return;
  const communityHeading=[...grid.querySelectorAll('.mil-title h3')].find(h=>/XI más votado/i.test(h.textContent||''));
  const communityCard=communityHeading?.closest('section.card');if(!communityCard)return;
  let card=grid.querySelector('.rm-my-xi-card');
  if(!card){card=document.createElement('section');card.className='card rm-my-xi-card';communityCard.insertAdjacentElement('afterend',card)}
  const names=savedXiNames();
  card.innerHTML=`<div class="mil-title"><div><span>TU ELECCIÓN</span><h3>Tu XI</h3></div><button type="button" data-rm-my-xi-open>Ver mi predicción</button></div>${names.length?`<div class="mil-xi">${names.map(n=>`<span>${esc(display(n))}</span>`).join('')}</div>`:'<div class="mil-empty"><b>Aún no has guardado un XI</b><span>Haz tu predicción y aparecerá aquí igual que el XI de la comunidad.</span></div>'}`;
  card.querySelector('[data-rm-my-xi-open]')?.addEventListener('click',()=>safe(()=>showSection('prediccion')));
}

function competitionSample(playerName,comp){
  const data=window.RMSeasonData,ms=(data?.matches||[]).filter(m=>m.comp===comp);let playedMinutes=0,ratedMinutes=0,weighted=0,rated=0;
  for(const m of ms){const minutes=Number(safe(()=>data.minutes?.(m.id,playerName),0))||0;if(minutes<=0)continue;playedMinutes+=minutes;const entry=safe(()=>data.officialRatingEntry?.(m.id,playerName),null);if(Number.isFinite(entry?.value)){rated++;ratedMinutes+=minutes;weighted+=entry.value*minutes}}
  return {matches:ms.length,playedMinutes,ratedMinutes,rated,avg:ratedMinutes?weighted/ratedMinutes:null};
}
function competitionOrder(comps){
  if(comps.includes('LaLiga')&&comps.includes('Champions'))return ['LaLiga','Champions'];
  return comps.slice(0,2);
}
function renderCompetitionCompare(){
  const data=window.RMSeasonData,section=document.getElementById('evolucion'),list=safe(()=>typeof players!=='undefined'?players:[],[]);if(!data||!section||!list.length)return;
  const comps=[...new Set((data.matches||[]).map(m=>m.comp).filter(Boolean))];if(comps.length<2){document.getElementById('rmCompetitionCompare')?.remove();return}
  const [a,b]=competitionOrder(comps),aMatches=(data.matches||[]).filter(m=>m.comp===a).length,bMatches=(data.matches||[]).filter(m=>m.comp===b).length;
  const rows=list.map(p=>{const left=competitionSample(p.name,a),right=competitionSample(p.name,b);if(!Number.isFinite(left.avg)||!Number.isFinite(right.avg))return null;return {p,left,right,delta:right.avg-left.avg}}).filter(Boolean).sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta)||y.right.ratedMinutes-x.right.ratedMinutes).slice(0,10);
  const signature=JSON.stringify({a,b,aMatches,bMatches,rows:rows.map(r=>[r.p.name,r.left.avg,r.right.avg,r.left.ratedMinutes,r.right.ratedMinutes])});
  let root=document.getElementById('rmCompetitionCompare');if(!root){root=document.createElement('section');root.id='rmCompetitionCompare';root.className='card rm-comp-compare';const mount=document.getElementById('evolutionProMount');if(mount)mount.insertAdjacentElement('afterend',root);else section.appendChild(root)}
  if(root.dataset.signature===signature)return;root.dataset.signature=signature;
  const shortSample=aMatches<2||bMatches<2;
  root.innerHTML=`<div class="rm-comp-head"><div><div class="eyebrow">COMPARACIÓN ENTRE COMPETICIONES</div><h3>${esc(a)} vs ${esc(b)}</h3><p>Media ponderada por minutos dentro de cada competición. Solo aparecen jugadores con nota oficial en ambas muestras.</p></div><div class="rm-comp-samples"><span>${esc(a)} · ${aMatches} partido${aMatches===1?'':'s'}</span><span>${esc(b)} · ${bMatches} partido${bMatches===1?'':'s'}</span></div></div>${shortSample?`<p class="rm-comp-warning"><b>Muestra corta:</b> una de las competiciones todavía tiene menos de 2 partidos. La diferencia es descriptiva y no debe leerse como una tendencia consolidada.</p>`:''}<div class="rm-comp-list">${rows.length?rows.map(r=>`<button type="button" class="rm-comp-row" data-rm-comp-player="${esc(r.p.name)}"><span class="rm-comp-player"><b>${esc(display(r.p.name))}</b><small>${esc(r.p.pos)} · ${r.left.rated}/${r.right.rated} apariciones con nota</small></span><span class="rm-comp-metric"><small>${esc(a)}</small><b>${r.left.avg.toFixed(2)}</b></span><span class="rm-comp-metric"><small>${esc(b)}</small><b>${r.right.avg.toFixed(2)}</b></span><strong class="rm-comp-delta ${r.delta>.049?'up':r.delta<-.049?'down':'flat'}">${r.delta>0?'+':''}${r.delta.toFixed(2)}</strong></button>`).join(''):'<div class="rm-comp-empty">Todavía no hay jugadores con nota oficial en ambas competiciones.</div>'}</div>`;
  root.querySelectorAll('[data-rm-comp-player]').forEach(btn=>btn.addEventListener('click',()=>safe(()=>window.openPlayerHub?.(btn.dataset.rmCompPlayer))));
}

let leagueLoad='';
function fixPrivateLeague(){
  const api=window.RMCommunityLeague;if(!api?.state)return;
  const state=safe(()=>api.state(),null);if(!state||state.tab!=='private')return;
  const leagues=state.data?.myLeagues||[];
  const view=document.getElementById('cglLeagueView');
  if(!leagues.length){
    const title=view?.querySelector('.cgl-empty b');
    if(title&&/Elige una liga/i.test(title.textContent||'')){
      title.textContent='Crea o únete a una liga';
      const sub=title.nextElementSibling;if(sub)sub.textContent='Cuando tengas una liga privada, su clasificación aparecerá aquí automáticamente.';
    }
    return;
  }
  const validSelected=state.selectedLeague&&leagues.some(l=>String(l.code)===String(state.selectedLeague));
  const code=validSelected?state.selectedLeague:leagues[0].code;
  const emptyTitle=view?.querySelector('.cgl-empty b')?.textContent||'';
  const needsLoad=!validSelected||/Elige una liga/i.test(emptyTitle);
  if(!needsLoad||leagueLoad===code)return;
  leagueLoad=code;
  Promise.resolve(api.loadLeague?.(code,false)).finally(()=>{leagueLoad='';});
}

let timer=null;
function applyAll(){timer=null;syncMatchCopy();enhanceMvpPickers();addMyXiCard();renderCompetitionCompare();fixPrivateLeague()}
function schedule(){if(timer!==null)return;timer=setTimeout(applyAll,20)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('rm-local-prediction-updated',schedule);
document.addEventListener('rm-community-updated',schedule);
document.addEventListener('rm-mvp-personal-updated',schedule);
document.addEventListener('rm-modules-ready',schedule);
document.addEventListener('rm-season-data-ready',schedule);
document.addEventListener('rm-season-extension-ready',schedule);
document.addEventListener('rm-analysis-context-updated',schedule);
[50,250,700,1500,3000].forEach(ms=>setTimeout(schedule,ms));
})();