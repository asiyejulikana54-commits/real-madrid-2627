(()=>{
const SECTION_ID='mi-liga';
let installed=false;
let patchTimer=null;
let communityPresentationTimer=null;
const observedRoots=new WeakSet();
const COMMUNITY_SLOT_LABELS=Object.freeze({gk:'POR',lb:'LI',lcb:'DFC izq.',rcb:'DFC der.',rb:'LD',dm1:'MC izq.',dm2:'MC der.',am:'MP',lw:'EI',rw:'ED',st:'DC'});
function ensureCommunityLeagueAssets(){
  if(!document.querySelector('link[href*="community-league.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='community-league.css?v=4';link.dataset.communityLeague='1';document.head.appendChild(link);
  }
  if(window.RMCommunityLeague||document.querySelector('script[src*="community-league.js"]'))return;
  const script=document.createElement('script');script.src='community-league.js?v=4';script.dataset.communityLeague='1';script.async=false;document.head.appendChild(script);
}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function data(){return window.RMCommunityData||null}
function participantId(){try{return window.RMCommunityApi?.participantId?.()||''}catch{return ''}}
function me(d){const id=participantId();return d?.myCompetition||d?.leaderboard?.find(x=>x.participantId===id)||null}
function numberFromText(value){const m=String(value??'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN}
function canonicalPlayer(name){try{return window.RMSeasonData?.canonical?.(name)||String(name||'')}catch{return String(name||'')}}
function rawCommunitySlotStates(){
  const d=data();let defs=[];try{defs=typeof slots!=='undefined'?slots.map(s=>({key:s[0],label:s[1]})):[]}catch{}
  return defs.map(slot=>{
    const list=(d?.slotShares?.[slot.key]||[]).filter(x=>x?.name).slice(0,5),top=list[0]||null,second=list[1]||null;
    const share=Number(top?.percentage)||0,secondShare=Number(second?.percentage)||0,margin=share-secondShare;
    return {slot,list,top,second,share,secondShare,margin};
  }).sort((a,b)=>a.share-b.share||a.margin-b.margin);
}
function cleanRedundantGlobalLabels(){
  document.querySelectorAll('#communityPolls .poll-row b').forEach(b=>{
    const small=b.querySelector('small');if(!small)return;
    const local=numberFromText(b.childNodes[0]?.textContent||''),global=numberFromText(small.textContent);
    if(Number.isFinite(local)&&Number.isFinite(global)&&Math.abs(local-global)<0.05)small.remove();
  });
  document.querySelectorAll('#communityPro .cpro-grid article').forEach(article=>{
    const local=numberFromText(article.querySelector('strong')?.textContent||'');
    [...article.querySelectorAll('p')].forEach(p=>{
      if(!/^\s*Global:/i.test(p.textContent||''))return;
      const global=numberFromText(p.textContent);if(Number.isFinite(local)&&Number.isFinite(global)&&Math.abs(local-global)<0.05)p.remove();
    });
  });
}
function fixConsensusDuplicateLeaders(){
  const grid=document.querySelector('#communityPro .cpro-grid');if(!grid)return;
  const articles=[...grid.querySelectorAll(':scope > article')],states=rawCommunitySlotStates();if(!states.length||articles.length!==states.length)return;
  const rows=states.map((state,index)=>({state,index,article:articles[index],key:canonicalPlayer(state.top?.name).toLowerCase()}));
  rows.forEach(row=>{const label=row.article.querySelector('div span');if(label)label.textContent=COMMUNITY_SLOT_LABELS[row.state.slot.key]||row.state.slot.label});
  const groups=new Map();for(const row of rows){if(!row.key)continue;const list=groups.get(row.key)||[];list.push(row);groups.set(row.key,list)}
  for(const group of groups.values()){
    if(group.length<2)continue;
    group.sort((a,b)=>b.state.share-a.state.share||a.index-b.index);const keeper=group[0];
    const label=keeper.article.querySelector('div span'),labels=[...new Set(group.map(x=>COMMUNITY_SLOT_LABELS[x.state.slot.key]||x.state.slot.label))];if(label)label.textContent=labels.join(' / ');
    group.slice(1).forEach(x=>x.article.remove());
  }
}
function fixCommunityPresentation(){communityPresentationTimer=null;fixConsensusDuplicateLeaders();cleanRedundantGlobalLabels()}
function scheduleCommunityPresentationFix(delay=0){
  if(communityPresentationTimer!==null)clearTimeout(communityPresentationTimer);
  communityPresentationTimer=setTimeout(fixCommunityPresentation,delay);
}
function addSection(){
  if(typeof sections!=='undefined'&&!sections.some(s=>s[0]===SECTION_ID))sections.push([SECTION_ID,'🏆','Mi Liga','Mi Liga','Tu clasificación, la comunidad y tus ligas privadas.']);
  if(document.getElementById(SECTION_ID))return;
  const section=document.createElement('section');section.className='section';section.id=SECTION_ID;
  section.innerHTML=`<div class="section-head mil-head"><div><h2>Mi Liga</h2><p>Tu zona de competición: comunidad, clasificación y ligas privadas.</p></div><button class="btn" id="milRefresh">Actualizar</button></div><div id="milContent"><div class="card mil-loading">Cargando datos de la comunidad…</div></div>`;
  const main=document.querySelector('main');if(main)main.appendChild(section);
  section.querySelector('#milRefresh')?.addEventListener('click',()=>refresh(true));
}
function popularNames(d){
  if(!d?.popularXI)return [];
  const order=['gk','lb','lcb','rcb','rb','dm1','dm2','am','lw','rw','st'];
  return order.map(k=>d.popularXI[k]).map(x=>typeof x==='string'?x:x?.name).filter(Boolean);
}
function topTable(d){
  const rows=(d?.leaderboard||[]).slice(0,10),id=participantId();
  if(!rows.length)return '<div class="mil-empty">La clasificación empezará cuando exista una jornada puntuada.</div>';
  return `<div class="mil-table"><div class="mil-tr head"><span>#</span><span>Usuario</span><span>Puntos</span><span>Media</span></div>${rows.map(r=>`<div class="mil-tr ${r.participantId===id?'me':''}"><b>${r.rank||'—'}</b><span>${esc(r.alias)}${r.participantId===id?' <small>Tú</small>':''}</span><strong>${r.hits??0}</strong><em>${Number.isFinite(r.avg)?Number(r.avg).toFixed(2):'—'}</em></div>`).join('')}</div>`;
}
function leagues(d){
  const rows=d?.myLeagues||[];
  if(!rows.length)return `<div class="mil-empty"><b>Aún no tienes ligas privadas</b><span>Crea una o entra con un código desde “Gestionar ligas”.</span></div>`;
  return `<div class="mil-leagues">${rows.map(l=>`<button type="button" data-mil-league="${esc(l.code)}"><span>${esc(l.name)}</span><b>${esc(l.code)}</b><small>${l.memberCount} miembro${l.memberCount===1?'':'s'}${l.owner?' · creada por ti':''}</small></button>`).join('')}</div>`;
}
function render(){
  const root=document.getElementById('milContent'),d=data();if(!root)return;
  if(!d){root.innerHTML='<div class="card mil-loading">Cargando datos de la comunidad…</div>';return}
  const mine=me(d),names=popularNames(d),leagueCount=d.myLeagues?.length||0;
  root.innerHTML=`
    <div class="grid cols-4 mil-kpis">
      <div class="card kpi"><div class="label">Tu puesto</div><div class="value">${mine?.rank?`#${mine.rank}`:'—'}</div><div class="hint">clasificación general</div></div>
      <div class="card kpi"><div class="label">Tus puntos</div><div class="value">${mine?.hits??0}</div><div class="hint">${mine?.scoredMatches||0} jornada${mine?.scoredMatches===1?'':'s'} puntuada${mine?.scoredMatches===1?'':'s'}</div></div>
      <div class="card kpi"><div class="label">Pronósticos</div><div class="value">${d.totalPredictions||0}</div><div class="hint">en el partido actual</div></div>
      <div class="card kpi"><div class="label">Mis ligas</div><div class="value">${leagueCount}</div><div class="hint">ligas privadas</div></div>
    </div>
    <div class="grid cols-2 mil-grid">
      <section class="card"><div class="mil-title"><div><span>COMUNIDAD</span><h3>XI más votado</h3></div><button type="button" data-mil-community>Ver comunidad</button></div>${names.length?`<div class="mil-xi">${names.map(n=>`<span>${esc(typeof displayName==='function'?displayName(n):n)}</span>`).join('')}</div>`:'<div class="mil-empty">Todavía no hay un XI comunitario completo.</div>'}</section>
      <section class="card"><div class="mil-title"><div><span>COMPETICIÓN</span><h3>Clasificación general</h3></div><small>${d.scoredMatches||0} jornada${d.scoredMatches===1?'':'s'}</small></div>${topTable(d)}</section>
    </div>
    <section class="card mil-private"><div class="mil-title"><div><span>MI LIGA</span><h3>Ligas privadas</h3></div><button type="button" data-mil-manage>Gestionar ligas</button></div>${leagues(d)}</section>`;
  root.querySelector('[data-mil-community]')?.addEventListener('click',()=>showSection('comunidad'));
  root.querySelector('[data-mil-manage]')?.addEventListener('click',openPrivate);
  root.querySelectorAll('[data-mil-league]').forEach(b=>b.addEventListener('click',()=>openPrivate(b.dataset.milLeague)));
  scheduleCommunityPresentationFix(0);
}
async function refresh(force=false){
  addSection();if(force||!data())try{await window.RMCommunityApi?.refresh?.()}catch{}
  render();
}
function openPrivate(code=''){
  ensureCommunityLeagueAssets();
  showSection('comunidad');
  let tries=0;const open=()=>{
    const tab=document.querySelector('#communityLeague [data-cgl-tab="private"]');
    if(tab){tab.click();if(code)window.RMCommunityLeague?.loadLeague?.(code,true);setTimeout(()=>document.getElementById('communityLeague')?.scrollIntoView({behavior:'smooth',block:'start'}),50)}
    else if(++tries<30)setTimeout(open,100);
  };setTimeout(open,80);
}
function patchNav(){
  const nav=document.getElementById('navMobile');
  if(nav){
    let btn=nav.querySelector('[data-section="mi-liga"]');
    if(!btn){btn=document.createElement('button');btn.dataset.section='mi-liga';const more=nav.querySelector('#uxMoreTab,.ux-more-tab');if(more)nav.insertBefore(btn,more);else nav.appendChild(btn)}
    if(btn.getAttribute('onclick')!=='openMiLiga()')btn.setAttribute('onclick','openMiLiga()');
    const html='<b>🏆</b><small>Mi Liga</small>';if(btn.innerHTML!==html)btn.innerHTML=html;
  }
  const desk=document.getElementById('navDesktop');
  if(desk&&!desk.querySelector('[data-section="mi-liga"]')){
    const groups=[...desk.querySelectorAll('.ux-nav-group')];const group=groups.find(g=>g.querySelector('[data-section="comunidad"]'))||groups.at(-1);if(group){const b=document.createElement('button');b.dataset.section='mi-liga';b.onclick=()=>openMiLiga();b.innerHTML='<span>🏆</span><em>Mi Liga</em>';group.appendChild(b)}
  }
  const sheet=document.getElementById('uxMoreSheet');
  if(sheet&&!sheet.querySelector('[data-section="mi-liga"]')){const groups=[...sheet.querySelectorAll('.ux-sheet-groups section')],group=groups.find(g=>/Comunidad/i.test(g.querySelector('h3')?.textContent||''));const wrap=group?.querySelector('div');if(wrap){const b=document.createElement('button');b.dataset.section='mi-liga';b.onclick=()=>{openMiLiga();window.closeUxMore?.()};b.innerHTML='<span>🏆</span><b>Mi Liga</b><small>Clasificación, comunidad y ligas privadas.</small>';wrap.prepend(b)}}
}
function schedulePatch(){
  if(patchTimer!==null)return;
  patchTimer=setTimeout(()=>{patchTimer=null;patchNav();observeNavRoots()},0);
}
function observeRoot(root){
  if(!root||observedRoots.has(root))return;
  observedRoots.add(root);new MutationObserver(schedulePatch).observe(root,{childList:true,subtree:true});
}
function observeNavRoots(){
  observeRoot(document.getElementById('navMobile'));
  observeRoot(document.getElementById('navDesktop'));
  observeRoot(document.getElementById('uxMoreSheet'));
}
window.openMiLiga=function(){addSection();showSection(SECTION_ID);refresh(false);setTimeout(()=>{patchNav();document.querySelectorAll('#navMobile button').forEach(b=>b.classList.toggle('active',b.dataset.section===SECTION_ID));document.getElementById('uxMoreTab')?.classList.remove('active');scheduleCommunityPresentationFix(0)},0)};
function install(){if(installed)return;installed=true;ensureCommunityLeagueAssets();addSection();patchNav();observeNavRoots();render();document.addEventListener('rm-community-updated',()=>{render();scheduleCommunityPresentationFix(80)});document.addEventListener('rm-community-pro-rendered',()=>scheduleCommunityPresentationFix(0));document.addEventListener('rm-modules-ready',()=>{schedulePatch();scheduleCommunityPresentationFix(0)});new MutationObserver(schedulePatch).observe(document.body,{childList:true});[100,500,1200,2600].forEach(ms=>{setTimeout(schedulePatch,ms);setTimeout(()=>scheduleCommunityPresentationFix(0),ms)});setTimeout(()=>refresh(false),500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();