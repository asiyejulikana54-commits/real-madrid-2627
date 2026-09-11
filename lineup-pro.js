(()=>{
let installed=false,activeSlot='rw';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function label(name){return safe(()=>displayName(name),name)||name||'—'}
function slotRows(){return safe(()=>slots,[])||[]}
function xi(){return safe(()=>currentXI(),{})||{}}
function values(data=xi()){return slotRows().map(s=>data[s[0]]).filter(Boolean)}
function base(){return safe(()=>baseXI,{})||{}}
function player(name){return safe(()=>players.find(p=>p.name===name),null)}
function metric(name){const p=player(name);return p?safe(()=>metricFor(p),null):null}
function rating(name){const m=metric(name);return m?safe(()=>currentRating(m),null):null}
function power(name){const p=player(name),m=metric(name),r=rating(name);if(!p||!m||!Number.isFinite(r))return null;const official=safe(()=>window.RMPowerMigration?.official?.find(x=>x.name===p.name||x.name===p.short),null);if(Number.isFinite(official?.power))return official.power;return r*(.75+.25*Math.min(m.minutes||0,450)/450)}
function selectedSet(data=xi()){return new Set(values(data))}
function duplicateNames(data=xi()){const arr=values(data),counts={};arr.forEach(n=>counts[n]=(counts[n]||0)+1);return Object.keys(counts).filter(n=>counts[n]>1)}
function valid(data=xi()){const arr=values(data);return arr.length===11&&new Set(arr).size===11}
function changes(data=xi()){
  const b=base();return slotRows().filter(s=>(data[s[0]]||'')!==(b[s[0]]||'')).map(s=>({id:s[0],pos:s[1],from:b[s[0]]||'',to:data[s[0]]||''}));
}
function overlap(data=xi()){const a=new Set(values(data)),b=new Set(values(base()));let n=0;a.forEach(x=>{if(b.has(x))n++});return n}
function averages(data=xi()){
  const arr=values(data),ratings=arr.map(rating).filter(Number.isFinite),powers=arr.map(power).filter(Number.isFinite),mins=arr.map(n=>metric(n)?.minutes).filter(Number.isFinite);
  return {rating:ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:null,power:powers.length?powers.reduce((a,b)=>a+b,0)/powers.length:null,minutes:mins.length?mins.reduce((a,b)=>a+b,0):0};
}
function savedCount(){try{return JSON.parse(localStorage.getItem('rm_lineups')||'[]').length}catch{return 0}}
function ensureRoot(){
  const section=document.getElementById('once');if(!section)return null;let root=document.getElementById('lineupPro');if(root)return root;
  root=document.createElement('section');root.id='lineupPro';root.className='lp-shell';root.innerHTML=`<div class="lp-status"><div><span>CONSTRUCTOR PRO</span><b id="lpStatusTitle">Revisando XI…</b><small id="lpStatusSub"></small></div><div class="lp-progress"><strong id="lpCount">0/11</strong><i><b id="lpProgressBar"></b></i></div></div><div class="lp-kpis"><div><span>Media XI</span><b id="lpRating">—</b></div><div><span>Power medio</span><b id="lpPower">—</b></div><div><span>Minutos acumulados</span><b id="lpMinutes">—</b></div><div><span>Vs once base</span><b id="lpOverlap">—</b></div></div><div class="lp-grid"><div class="lp-panel"><div class="lp-panel-head"><span>CAMBIOS VS ONCE BASE</span><b id="lpChangeCount">0 cambios</b></div><div id="lpChanges" class="lp-changes"></div></div><div class="lp-panel"><div class="lp-panel-head"><span>BANQUILLO RÁPIDO</span><b id="lpActivePos">ED</b></div><p>Selecciona una posición del campo y aquí verás alternativas elegibles que no están en tu XI.</p><div id="lpBench" class="lp-bench"></div></div></div><div class="lp-mobile-bar"><div><span id="lpMobileState">0/11</span><small id="lpMobileHint">Completa el XI</small></div><button type="button" id="lpMobileShare">Compartir</button><button type="button" class="primary" id="lpMobileSave">Guardar</button></div>`;
  const wrap=section.querySelector('.pitch-wrap');if(wrap)section.insertBefore(root,wrap);else section.appendChild(root);
  root.querySelector('#lpMobileSave').onclick=()=>window.saveLineup?.();root.querySelector('#lpMobileShare').onclick=shareCurrent;
  return root;
}
function renderChanges(root,data){
  const list=changes(data),box=root.querySelector('#lpChanges'),count=root.querySelector('#lpChangeCount');count.textContent=`${list.length} cambio${list.length===1?'':'s'}`;
  if(!list.length){box.innerHTML='<div class="lp-empty">Coincide posición por posición con el once base.</div>';return}
  box.innerHTML=list.map(c=>`<div class="lp-change"><span>${esc(c.pos)}</span><div><small>${esc(label(c.from))}</small><b>→ ${esc(label(c.to))}</b></div></div>`).join('');
}
function renderBench(root,data){
  const row=slotRows().find(s=>s[0]===activeSlot)||slotRows()[0];if(!row)return;root.querySelector('#lpActivePos').textContent=row[1];const selected=selectedSet(data),current=data[row[0]];const options=safe(()=>players.filter(p=>p.eligible.includes(row[4])&&!selected.has(p.name)).map(p=>({p,pow:power(p.name),r:rating(p.name)})).sort((a,b)=>(b.pow??-1)-(a.pow??-1)),[])||[];
  const box=root.querySelector('#lpBench');if(!options.length){box.innerHTML='<span class="lp-empty">No quedan alternativas libres para esta posición.</span>';return}
  box.innerHTML=options.map(x=>`<button type="button" data-lp-player="${esc(x.p.name)}"><b>${esc(label(x.p.name))}</b><small>${Number.isFinite(x.pow)?`Power ${fmt(x.pow)}`:Number.isFinite(x.r)?`Media ${fmt(x.r)}`:'Sin muestra'}</small></button>`).join('');
  box.querySelectorAll('[data-lp-player]').forEach(btn=>btn.onclick=()=>{const select=document.getElementById('slot_'+row[0]);if(!select)return;select.value=btn.dataset.lpPlayer;select.dispatchEvent(new Event('change',{bubbles:true}));safe(()=>toast(`${label(btn.dataset.lpPlayer)} colocado en ${row[1]}`))});
}
function paintDuplicates(data){const dup=new Set(duplicateNames(data));slotRows().forEach(s=>{const sel=document.getElementById('slot_'+s[0]);sel?.closest('.slot')?.classList.toggle('lp-duplicate',Boolean(sel?.value&&dup.has(sel.value)))})}
function render(){
  const root=ensureRoot();if(!root)return;const data=xi(),arr=values(data),unique=new Set(arr),dups=duplicateNames(data),ok=valid(data),avg=averages(data),same=overlap(data),dirty=changes(data).length;
  root.querySelector('#lpCount').textContent=`${arr.length}/11`;root.querySelector('#lpProgressBar').style.width=`${Math.min(100,(arr.length/11)*100)}%`;
  let title='Completa tu XI',sub=`Faltan ${11-arr.length} jugador${11-arr.length===1?'':'es'}.`;
  if(dups.length){title='Hay jugadores repetidos';sub=`Corrige ${dups.map(label).join(', ')} antes de guardar.`}
  else if(ok){title=dirty?'XI válido · variante lista':'XI base completo';sub=dirty?`${dirty} cambio${dirty===1?'':'s'} posicional${dirty===1?'':'es'} respecto al once base.`:'No hay cambios respecto al once base.'}
  root.querySelector('#lpStatusTitle').textContent=title;root.querySelector('#lpStatusSub').textContent=sub;root.classList.toggle('is-valid',ok);root.classList.toggle('has-error',dups.length>0);
  root.querySelector('#lpRating').textContent=fmt(avg.rating);root.querySelector('#lpPower').textContent=fmt(avg.power);root.querySelector('#lpMinutes').textContent=avg.minutes?String(Math.round(avg.minutes)):'—';root.querySelector('#lpOverlap').textContent=arr.length?`${same}/11`:'—';
  root.querySelector('#lpMobileState').textContent=dups.length?'Repetidos':`${arr.length}/11`;root.querySelector('#lpMobileHint').textContent=ok?(dirty?`${dirty} cambios vs base`:'Once base'):(dups.length?'Corrige el XI':'Completa el XI');root.querySelector('#lpMobileSave').disabled=!ok;
  renderChanges(root,data);renderBench(root,data);paintDuplicates(data);updateSavedTitle();
}
function updateSavedTitle(){const section=document.getElementById('once'),head=[...section?.querySelectorAll('.section-head h2')||[]].find(x=>x.textContent.startsWith('Onces guardados'));if(head)head.textContent=`Onces guardados · ${savedCount()}`}
function bindSelects(){slotRows().forEach(s=>{const sel=document.getElementById('slot_'+s[0]);if(!sel||sel.dataset.lpBound)return;sel.dataset.lpBound='1';const activate=()=>{activeSlot=s[0];render()};sel.addEventListener('focus',activate);sel.addEventListener('pointerdown',()=>{activeSlot=s[0]});sel.addEventListener('change',activate)})}
function wrapCore(){
  const baseSave=window.saveLineup;if(typeof baseSave==='function'&&!baseSave.__lpWrapped){const wrapped=function(){const data=xi(),arr=values(data),dups=duplicateNames(data);if(arr.length!==11){safe(()=>toast(`Completa los 11 jugadores · faltan ${11-arr.length}`));render();return}if(dups.length){safe(()=>toast(`No puedes repetir a ${dups.map(label).join(', ')}`));render();return}const out=baseSave();render();return out};wrapped.__lpWrapped=true;window.saveLineup=wrapped}
  ['loadPreset','restoreLineup','clearLineup','setXI','deleteLineup'].forEach(name=>{const fn=window[name];if(typeof fn!=='function'||fn.__lpWrapped)return;const wrapped=function(...args){const out=fn.apply(this,args);setTimeout(()=>{bindSelects();render()},0);return out};wrapped.__lpWrapped=true;window[name]=wrapped});
}
async function shareCurrent(){
  const data=xi(),arr=values(data);if(arr.length!==11||new Set(arr).size!==11){safe(()=>toast('Completa un XI válido antes de compartir'));return}
  const shareBtn=document.getElementById('shareXiCard');if(shareBtn){shareBtn.click();return}
  const lines=slotRows().map(s=>`${s[1]}: ${label(data[s[0]])}`),title=document.getElementById('lineupName')?.value?.trim()||'Mi XI';let url='';try{const u=new URL(location.href);u.searchParams.set('section','once');url=u.href}catch{}
  const text=`${title} · RM 26/27\n${lines.join('\n')}${url?`\n${url}`:''}`;try{if(navigator.share){await navigator.share({title:`${title} · RM 26/27`,text});return}if(navigator.clipboard){await navigator.clipboard.writeText(text);safe(()=>toast('XI copiado para compartir'));return}}catch(e){if(e?.name==='AbortError')return}safe(()=>toast('No se pudo compartir el XI'))
}
function install(){
  if(installed)return;if(!document.getElementById('once')||typeof currentXI!=='function'||typeof saveLineup!=='function'||!document.getElementById('pitch')){setTimeout(install,80);return}
  installed=true;ensureRoot();bindSelects();wrapCore();const saveBtn=[...document.querySelectorAll('#once button')].find(b=>(b.getAttribute('onclick')||'').includes('saveLineup'));if(saveBtn)saveBtn.textContent='Guardar variante';
  document.addEventListener('rm-ranking-official-ready',render);document.addEventListener('rm-season-data-ready',render);render();window.RMLineupPro=Object.freeze({render,share:shareCurrent,valid:()=>valid(xi()),setActiveSlot:id=>{activeSlot=id;render()}});
}
install();
})();