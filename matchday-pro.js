(()=>{
const NOTE_PREFIX='rm_matchday_notes_v1_';
const DRAFT_PREFIX='rm_matchday_note_draft_v1_';
let installed=false,wakeLock=null,wakeWanted=false,selectedTag='',draftTimer=null;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]||c))}
function match(){return safe(()=>predictionMatch,null)||{id:'proximo-partido',rival:'Próximo rival',kickoff:null,deadline:null}}
function phase(){return safe(()=>window.RMMatchdayCenter?.phase?.(),null)||{id:'pre',label:'Previa',clock:'Predicción abierta'} }
function official(){return safe(()=>Array.isArray(officialXI)?officialXI:null,null)}
function ours(){return safe(()=>window.RMCurrentMatchIdea,null)||safe(()=>rayoXI,{})||{}}
function saved(){return safe(()=>getSavedPrediction(),null)}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function display(name){return safe(()=>displayName(name),name)||name}
function xiValues(xi){return Object.values(xi||{}).filter(Boolean)}
function validXI(xi){const v=xiValues(xi);return v.length===11&&new Set(v.map(canonical)).size===11}
function playerOverlap(a,b){const A=new Set(xiValues(a).map(canonical));return xiValues(b).map(canonical).filter(x=>A.has(x)).length}
function slotDiffs(a,b){return safe(()=>slots,[]).map(s=>{const av=a?.[s[0]]||null,bv=b?.[s[0]]||null;if(canonical(av)===canonical(bv))return null;return {key:s[0],label:s[1],a:av,b:bv}}).filter(Boolean)}
function score(names){const real=official();if(!real)return null;const set=new Set(real.map(canonical));return names.filter(Boolean).map(canonical).filter(x=>set.has(x)).length}
function choiceFor(xi,debate){const names=xiValues(xi),set=new Set(names.map(canonical));return debate.options.filter(n=>set.has(canonical(n))).map(display)}
function watchItems(){
  const debates=safe(()=>window.RMMatchdayCenter?.debates,[])||[],u=saved()?.xi||{},o=ours(),hasUser=validXI(u);
  const rows=debates.map(d=>{const a=choiceFor(o,d),b=choiceFor(u,d),same=a.length===b.length&&a.every(x=>b.includes(x));return {d,a,b,same}});
  return (hasUser?[...rows].sort((x,y)=>Number(x.same)-Number(y.same)):rows).slice(0,3);
}
function noteKey(){return `${NOTE_PREFIX}${match().id||'partido'}`}
function draftKey(){return `${DRAFT_PREFIX}${match().id||'partido'}`}
function notes(){try{const v=JSON.parse(localStorage.getItem(noteKey())||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function writeNotes(rows){try{localStorage.setItem(noteKey(),JSON.stringify(rows.slice(0,60)))}catch{}}
function readDraft(){
  try{const value=JSON.parse(localStorage.getItem(draftKey())||'null');if(!value||typeof value!=='object')return {text:'',minute:'',tag:''};return {text:String(value.text||'').slice(0,500),minute:String(value.minute||'').slice(0,3),tag:String(value.tag||'')}}catch{return {text:'',minute:'',tag:''}}
}
function hasDraft(d=readDraft()){return Boolean(d.text.trim()||d.minute.trim()||d.tag)}
function writeDraft(draft){
  const clean={text:String(draft?.text||'').slice(0,500),minute:String(draft?.minute||'').replace(/[^0-9]/g,'').slice(0,3),tag:String(draft?.tag||'')};
  try{if(hasDraft(clean))localStorage.setItem(draftKey(),JSON.stringify(clean));else localStorage.removeItem(draftKey())}catch{}
  return clean;
}
function clearDraft(){clearTimeout(draftTimer);try{localStorage.removeItem(draftKey())}catch{}}
function composerDraft(){
  const text=document.getElementById('mdpNoteText'),minute=document.getElementById('mdpMinute');
  if(!text&&!minute)return readDraft();return {text:text?.value||'',minute:minute?.value||'',tag:selectedTag||''};
}
function persistComposer(){const d=writeDraft(composerDraft());updateDraftState(d);return d}
function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(persistComposer,180)}
function updateDraftState(d=readDraft()){
  const el=document.getElementById('mdpDraftState');if(!el)return;const active=hasDraft(d);el.classList.toggle('active',active);el.textContent=active?'Borrador guardado en este dispositivo':'Sin borrador pendiente';
}
function timeLabel(iso){try{return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return ''}}
function tagLabel(tag){return ({observation:'Observación',change:'Cambio',key:'Clave',doubt:'Duda',chance:'Ocasión'})[tag]||''}
function toastSafe(text){safe(()=>toast(text))}
function ensureShell(){
  const section=document.getElementById('partido'),base=document.getElementById('matchdayDynamic');if(!section||!base)return null;
  let top=document.getElementById('matchdayProTop');if(!top){top=document.createElement('div');top.id='matchdayProTop';top.className='mdp-top';base.insertAdjacentElement('beforebegin',top)}
  let notebook=document.getElementById('matchdayProNotebook');if(!notebook){notebook=document.createElement('section');notebook.id='matchdayProNotebook';notebook.className='card mdp-notebook';base.insertAdjacentElement('afterend',notebook)}
  let bar=document.getElementById('matchdayProBar');if(!bar){bar=document.createElement('div');bar.id='matchdayProBar';bar.className='mdp-mobile-bar';bar.innerHTML='<div><span id="mdpMiniState">PARTIDO</span><b id="mdpMiniClock">—</b></div><button type="button" data-mdp-note>Nota</button><button type="button" data-mdp-pred>Predicción</button>';document.body.appendChild(bar);bar.querySelector('[data-mdp-note]').addEventListener('click',scrollNotes);bar.querySelector('[data-mdp-pred]').addEventListener('click',()=>safe(()=>showSection('prediccion')))}
  return {top,notebook,bar};
}
function comparisonHtml(){
  const u=saved()?.xi||{},o=ours(),hasUser=validXI(u),diffs=hasUser?slotDiffs(o,u):[],overlap=hasUser?playerOverlap(o,u):null;
  if(!hasUser)return `<section class="mdp-compare empty"><div><span>TU XI VS NUESTRA IDEA</span><h3>Guarda una predicción para comparar</h3><p>Cuando tengas 11 jugadores distintos veremos coincidencias y diferencias por puesto.</p></div><button class="btn primary" type="button" data-mdp-go="prediccion">Crear mi XI</button></section>`;
  return `<section class="mdp-compare"><div class="mdp-compare-head"><div><span>TU XI VS NUESTRA IDEA</span><h3>${overlap}/11 jugadores coinciden</h3><p>${diffs.length?`${diffs.length} puesto${diffs.length===1?'':'s'} con una elección distinta.`:'Coincidimos también en la colocación de los 11.'}</p></div><b>${diffs.length}<small>cambios</small></b></div>${diffs.length?`<div class="mdp-diff-list">${diffs.map(d=>`<div><span>${esc(d.label)}</span><b>${esc(display(d.a||'—'))}</b><i>→</i><strong>${esc(display(d.b||'—'))}</strong></div>`).join('')}</div>`:'<div class="mdp-perfect">✓ Mismo XI y mismas posiciones</div>'}</section>`;
}
function watchHtml(){
  const rows=watchItems(),hasUser=validXI(saved()?.xi||{});
  return `<section class="mdp-watch"><div class="mdp-block-title"><span>QUÉ MIRAR</span><h3>Dudas que pueden definir el once</h3><p>${hasUser?'Primero aparecen los debates donde tu XI y nuestra idea discrepan.':'Las principales dudas que ya estamos siguiendo en el proyecto.'}</p></div><div class="mdp-watch-grid">${rows.map(({d,a,b,same})=>`<article class="${same?'same':''}"><span>${esc(d.label)}</span><h4>${d.options.map(display).map(esc).join(' / ')}</h4><div><small>Nuestra idea</small><b>${esc(a.join(' · ')||'Ninguno')}</b></div><div><small>Tu XI</small><b>${esc(hasUser?(b.join(' · ')||'Ninguno'):'Pendiente')}</b></div></article>`).join('')}</div></section>`;
}
function renderTop(){
  const shell=ensureShell();if(!shell)return;const p=phase(),u=saved()?.xi||{},o=ours(),userNames=xiValues(u),isValid=validXI(u),real=official(),userScore=real&&isValid?score(userNames):null,overlap=isValid?playerOverlap(o,u):null,diffs=isValid?slotDiffs(o,u).length:null;
  shell.top.innerHTML=`<div class="card mdp-summary"><div class="mdp-summary-head"><div><span>PARTIDO PRO</span><h2>Tu centro rápido para el ${esc(match().rival||'próximo partido')}</h2><p>Predicción, diferencias y dudas clave sin inventar datos de partido.</p></div><div class="mdp-phase"><b>${esc(p.label||'Previa')}</b><small>${esc(p.clock||'')}</small></div></div><div class="mdp-kpis"><div><span>Tu XI</span><b>${userScore!==null?`${userScore}/11`:isValid?'11/11':`${userNames.length}/11`}</b><small>${userScore!==null?'aciertos oficiales':isValid?'predicción completa':'por completar'}</small></div><div><span>Coincidencia</span><b>${overlap===null?'—':`${overlap}/11`}</b><small>jugadores vs nuestra idea</small></div><div><span>Puestos distintos</span><b>${diffs===null?'—':diffs}</b><small>misma formación</small></div><div><span>XI oficial</span><b>${real?'Sí':'Pendiente'}</b><small>${real?'confirmado':'sin nombres hasta publicarse'}</small></div></div>${comparisonHtml()}${watchHtml()}</div>`;
  shell.top.querySelectorAll('[data-mdp-go]').forEach(b=>b.addEventListener('click',()=>safe(()=>showSection(b.dataset.mdpGo))));
  document.body.classList.toggle('matchday-pro-active',document.getElementById('partido')?.classList.contains('active'));
  const state=document.getElementById('mdpMiniState'),clock=document.getElementById('mdpMiniClock');if(state)state.textContent=p.label||'Partido';if(clock)clock.textContent=p.clock||'—';
}
function noteRowsHtml(rows){
  if(!rows.length)return '<div class="mdp-notes-empty"><b>Aún no hay notas del partido</b><span>Guarda aquí sensaciones, cambios que probarías o detalles a revisar después.</span></div>';
  return `<div class="mdp-note-list">${rows.map(n=>`<article><div><span>${esc(timeLabel(n.at))}${n.minute?` · ${esc(n.minute)}'`:''}</span>${n.tag?`<em>${esc(tagLabel(n.tag))}</em>`:''}</div><p>${esc(n.text)}</p><button type="button" data-mdp-delete="${esc(n.id)}" aria-label="Eliminar nota">×</button></article>`).join('')}</div>`;
}
function renderNotes(){
  const shell=ensureShell();if(!shell)return;
  if(shell.notebook.querySelector('#mdpNoteText'))persistComposer();
  const rows=notes(),supported=typeof navigator!=='undefined'&&'wakeLock'in navigator,draft=readDraft();selectedTag=draft.tag||selectedTag||'';
  shell.notebook.innerHTML=`<div class="section-head mdp-note-head" style="margin-top:0"><div><span class="mdp-label">BLOC DEL PARTIDO · LOCAL</span><h2>Apunta lo que quieras revisar después</h2><p>Se guarda solo en este dispositivo. El minuto es manual para no fingir un reloj de partido.</p><span id="mdpDraftState" class="mdp-draft-state ${hasDraft(draft)?'active':''}">${hasDraft(draft)?'Borrador recuperado · guardado en este dispositivo':'Sin borrador pendiente'}</span></div><div class="mdp-note-tools">${supported?`<button class="btn" type="button" id="mdpWake">${wakeLock?'✓ Pantalla activa':'Mantener pantalla activa'}</button>`:''}${rows.length?'<button class="btn" type="button" id="mdpCopyNotes">Copiar notas</button>':''}</div></div><div class="mdp-note-compose"><input class="input" id="mdpMinute" inputmode="numeric" maxlength="3" placeholder="Min. (opcional)" aria-label="Minuto manual" value="${esc(draft.minute)}"><textarea id="mdpNoteText" maxlength="500" placeholder="Ej.: Trent está entrando por dentro y Diomandé mantiene la amplitud…">${esc(draft.text)}</textarea><div class="mdp-tags"><button type="button" data-mdp-tag="observation" class="${selectedTag==='observation'?'active':''}">Observación</button><button type="button" data-mdp-tag="chance" class="${selectedTag==='chance'?'active':''}">Ocasión</button><button type="button" data-mdp-tag="change" class="${selectedTag==='change'?'active':''}">Cambio</button><button type="button" data-mdp-tag="key" class="${selectedTag==='key'?'active':''}">Clave</button><button type="button" data-mdp-tag="doubt" class="${selectedTag==='doubt'?'active':''}">Duda</button></div><button class="btn primary" type="button" id="mdpSaveNote">Guardar nota</button></div>${noteRowsHtml(rows)}<p class="mdp-local-note">🔒 Notas y borrador son locales: no se publican en Comunidad ni se envían a Netlify. Ctrl/Cmd + Enter guarda la nota.</p>`;
  const text=shell.notebook.querySelector('#mdpNoteText'),minute=shell.notebook.querySelector('#mdpMinute');
  text?.addEventListener('input',scheduleDraft);minute?.addEventListener('input',scheduleDraft);
  text?.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();addNote()}});
  shell.notebook.querySelectorAll('[data-mdp-tag]').forEach(b=>b.addEventListener('click',()=>{selectedTag=selectedTag===b.dataset.mdpTag?'':b.dataset.mdpTag;shell.notebook.querySelectorAll('[data-mdp-tag]').forEach(x=>x.classList.toggle('active',x.dataset.mdpTag===selectedTag));persistComposer()}));
  shell.notebook.querySelector('#mdpSaveNote')?.addEventListener('click',addNote);shell.notebook.querySelectorAll('[data-mdp-delete]').forEach(b=>b.addEventListener('click',()=>deleteNote(b.dataset.mdpDelete)));shell.notebook.querySelector('#mdpCopyNotes')?.addEventListener('click',copyNotes);shell.notebook.querySelector('#mdpWake')?.addEventListener('click',toggleWake);
}
function addNote(){
  const text=document.getElementById('mdpNoteText')?.value.trim()||'',raw=document.getElementById('mdpMinute')?.value.trim()||'';if(!text){toastSafe('Escribe una nota primero');return}
  let minute=null;if(raw){const n=Number(raw);if(!Number.isInteger(n)||n<1||n>130){toastSafe('El minuto debe estar entre 1 y 130');return}minute=n}
  const id=safe(()=>crypto.randomUUID(),`n_${Date.now()}_${Math.random().toString(36).slice(2)}`),row={id,at:new Date().toISOString(),minute,tag:selectedTag||'',text};writeNotes([row,...notes()]);selectedTag='';clearDraft();renderNotes();toastSafe('Nota guardada en este dispositivo');
}
function deleteNote(id){persistComposer();writeNotes(notes().filter(n=>n.id!==id));renderNotes();toastSafe('Nota eliminada')}
async function copyNotes(){
  const rows=[...notes()].reverse();if(!rows.length)return;const title=`Real Madrid vs ${match().rival||'rival'} · notas del partido`,text=[title,...rows.map(n=>`${timeLabel(n.at)}${n.minute?` · ${n.minute}'`:''}${n.tag?` · ${tagLabel(n.tag)}`:''} — ${n.text}`)].join('\n');
  try{await navigator.clipboard.writeText(text);toastSafe('Notas copiadas')}catch{toastSafe('No se pudieron copiar las notas')}
}
function scrollNotes(){document.getElementById('matchdayProNotebook')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>document.getElementById('mdpNoteText')?.focus(),350)}
async function acquireWake(){
  if(!(typeof navigator!=='undefined'&&'wakeLock'in navigator))return false;
  try{wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;renderNotes()},{once:true});return true}catch{wakeLock=null;wakeWanted=false;return false}
}
async function toggleWake(){
  persistComposer();
  if(wakeLock){wakeWanted=false;try{await wakeLock.release()}catch{}wakeLock=null;renderNotes();toastSafe('Pantalla activa desactivada');return}
  wakeWanted=true;const ok=await acquireWake();renderNotes();toastSafe(ok?'Pantalla activa mientras mantengas esta vista':'El navegador no permitió mantener la pantalla activa')
}
function render(){renderTop();renderNotes()}
function install(){
  if(installed)return;if(!document.getElementById('partido')||!window.RMMatchdayCenter){setTimeout(install,100);return}installed=true;const d=readDraft();selectedTag=d.tag||'';render();
  ['rm-local-prediction-updated','rm-community-updated','rm-matchday-polls-updated','rm-season-data-ready','rm-ranking-official-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(renderTop,0)));
  document.addEventListener('rm-mobile-nav-fallback',()=>setTimeout(renderTop,0));
  document.addEventListener('visibilitychange',async()=>{if(document.visibilityState!=='visible')return;if(wakeWanted&&!wakeLock&&document.getElementById('partido')?.classList.contains('active')){const ok=await acquireWake();if(!ok)renderNotes()}else updateDraftState()});
  window.addEventListener('pagehide',persistComposer);
  setInterval(()=>{if(document.getElementById('partido')?.classList.contains('active'))renderTop();else document.body.classList.remove('matchday-pro-active')},30000);
  window.RMMatchdayPro=Object.freeze({render,notes,addNote,scrollNotes,draft:readDraft,saveDraft:persistComposer});
}
install();
})();