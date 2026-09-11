(()=>{
const RECENT_KEY='rm_command_recent_v1';
let installed=false,activeIndex=0,lastQuery='';
const MAX_RECENT=6;
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function playerList(){try{return typeof players!=='undefined'&&Array.isArray(players)?players:[]}catch{return []}}
function sectionList(){try{return typeof sections!=='undefined'&&Array.isArray(sections)?sections:[]}catch{return []}}
function display(p){return p?.short||p?.name||'—'}
function readRecent(){try{const x=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(x)?x.slice(0,MAX_RECENT):[]}catch{return []}}
function saveRecent(query){const q=String(query||'').trim();if(q.length<2)return;try{const next=[q,...readRecent().filter(x=>norm(x)!==norm(q))].slice(0,MAX_RECENT);localStorage.setItem(RECENT_KEY,JSON.stringify(next))}catch{}}
function favoriteNames(){try{const api=window.RMPlayerExperience?.favorites?.();if(Array.isArray(api))return api}catch{}try{const raw=JSON.parse(localStorage.getItem('rm_player_favorites_v1')||'[]');return Array.isArray(raw)?raw:[]}catch{return []}}
function recentPlayerNames(){try{const api=window.RMPlayerExperience?.recents?.();if(Array.isArray(api))return api}catch{}try{const raw=JSON.parse(localStorage.getItem('rm_player_recents_v1')||'[]');return Array.isArray(raw)?raw:[]}catch{return []}}
function playerByText(text){const q=norm(text);if(!q)return null;const list=playerList();return list.find(p=>norm(p.name)===q||norm(p.short)===q)||list.find(p=>norm(p.name).startsWith(q)||norm(p.short).startsWith(q))||list.find(p=>norm(`${p.name} ${p.short||''}`).includes(q))||null}
function sectionById(id){return sectionList().find(s=>s[0]===id)||null}
function actionItems(){
  const defs=[
    ['prediccion','11','Abrir mi predicción','Revisa o completa tu XI para el próximo partido'],
    ['once','▦','Crear un XI','Abre el Constructor PRO'],
    ['power','⚡','Ver Power RM','Ranking actual de rendimiento + muestra'],
    ['evolucion','↗','Ver Evolución','Forma, momentum, rachas y cambios de jornada'],
    ['comparador','VS','Comparar jugadores','Abre el Comparador PRO'],
    ['mi-temporada','◎','Abrir Mi temporada','Historial personal de predicciones y aciertos']
  ];
  return defs.filter(([id])=>document.getElementById(id)).map(([id,icon,title,sub])=>({type:'section',id,icon,title,sub,group:'ACCIONES RÁPIDAS'}));
}
function compareCommand(q){
  const m=String(q||'').trim().match(/^(?:comparar|compara)\s+(.+?)\s+(?:con|vs\.?|contra)\s+(.+)$/i);if(!m)return null;
  const a=playerByText(m[1]),b=playerByText(m[2]);if(!a||!b||a.name===b.name)return {invalid:true,a,b};
  return {type:'compare',id:`${a.name}|${b.name}`,icon:'VS',title:`${display(a)} vs ${display(b)}`,sub:'Abrir comparación directa',group:'COMANDO DETECTADO',a:a.name,b:b.name};
}
function playerItemsFor(names,group,limit=4){const set=new Set(names);return playerList().filter(p=>set.has(p.name)||set.has(p.short)).slice(0,limit).map(p=>({type:'player',id:p.name,icon:'◉',title:display(p),sub:`${p.pos} · ${p.role||'Ficha de jugador'}`,group}));}
function queryItems(q){
  const query=norm(q);if(!query)return [];
  const out=[];const cmp=compareCommand(q);if(cmp&&!cmp.invalid)out.push(cmp);else if(cmp?.invalid)out.push({type:'hint',id:'compare-help',icon:'VS',title:'No encuentro los dos jugadores',sub:'Prueba: “comparar Güler con Brahim”',group:'COMANDO DETECTADO'});
  const aliases=[
    {keys:['mi prediccion','prediccion','pronostico'],id:'prediccion',icon:'11',title:'Abrir mi predicción'},
    {keys:['crear xi','constructor','once'],id:'once',icon:'▦',title:'Crear un XI'},
    {keys:['power','power rm'],id:'power',icon:'⚡',title:'Ver Power RM'},
    {keys:['evolucion','forma','momentum'],id:'evolucion',icon:'↗',title:'Ver Evolución'},
    {keys:['mi temporada','historial'],id:'mi-temporada',icon:'◎',title:'Abrir Mi temporada'}
  ];
  aliases.filter(x=>x.keys.some(k=>norm(k).includes(query)||query.includes(norm(k)))).forEach(x=>{if(document.getElementById(x.id)&&!out.some(y=>y.type==='section'&&y.id===x.id))out.push({type:'section',id:x.id,icon:x.icon,title:x.title,sub:sectionById(x.id)?.[4]||'',group:'ACCIONES'})});
  sectionList().filter(s=>norm(`${s[2]} ${s[3]} ${s[4]}`).includes(query)).slice(0,6).forEach(s=>out.push({type:'section',id:s[0],icon:s[1],title:s[2],sub:s[4],group:'SECCIONES'}));
  playerList().filter(p=>norm(`${p.name} ${p.short||''} ${p.pos} ${p.role||''}`).includes(query)).slice(0,8).forEach(p=>out.push({type:'player',id:p.name,icon:'◉',title:display(p),sub:`${p.pos} · ${p.role||'Ficha de jugador'}`,group:'JUGADORES'}));
  const seen=new Set();return out.filter(x=>{const key=`${x.type}:${x.id}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,15);
}
function emptyItems(){
  const favNames=favoriteNames(),favs=playerItemsFor(favNames,'TUS FAVORITOS',4),recents=playerItemsFor(recentPlayerNames().filter(n=>!favNames.includes(n)),'VISTOS RECIENTEMENTE',4);
  const recentSearch=readRecent().map(q=>({type:'recent-query',id:q,icon:'↺',title:q,sub:'Repetir búsqueda',group:'BÚSQUEDAS RECIENTES'}));
  return [...actionItems(),...favs,...recents,...recentSearch];
}
function ensureEnhancedPanel(){
  const overlay=document.getElementById('rmGlobalSearch'),panel=overlay?.querySelector('.global-search-panel');if(!overlay||!panel)return false;
  if(panel.dataset.commandPalette==='1')return true;panel.dataset.commandPalette='1';panel.setAttribute('aria-label','Paleta de comandos de RM 26/27');
  panel.innerHTML=`<div class="global-search-input cp-input"><span>⌕</span><input id="rmSearchInput" autocomplete="off" spellcheck="false" aria-label="Buscar o ejecutar un comando" placeholder="Busca jugador o escribe: comparar Güler con Brahim"><kbd>ESC</kbd></div><div class="cp-hint"><span><b>/</b> buscar</span><span><b>⌘K</b> abrir</span><span><b>↑↓</b> moverte</span><span><b>↵</b> abrir</span></div><div id="rmSearchResults" class="global-search-results cp-results" role="listbox" aria-label="Resultados"></div><div class="global-search-foot cp-foot"><span>Jugadores · secciones · acciones · comandos</span><span id="cpResultCount">0 resultados</span></div>`;
  const input=panel.querySelector('#rmSearchInput');input.addEventListener('input',e=>render(e.target.value));input.addEventListener('keydown',onInputKeydown);
  return true;
}
function itemHtml(item,index,first){
  const disabled=item.type==='hint';return `<button type="button" role="option" aria-selected="${index===activeIndex?'true':'false'}" class="cp-item ${index===activeIndex?'active':''} ${disabled?'disabled':''}" data-cp-index="${index}" data-cp-type="${esc(item.type)}" data-cp-id="${esc(item.id)}" ${first?'data-search-first="1"':''} ${disabled?'disabled':''}><span>${esc(item.icon)}</span><div><b>${esc(item.title)}</b><small>${esc(item.sub||'')}</small></div><strong>${item.type==='recent-query'?'↺':'›'}</strong></button>`}
function render(q=''){
  lastQuery=String(q||'');const root=document.getElementById('rmSearchResults');if(!root)return;const items=lastQuery.trim()?queryItems(lastQuery):emptyItems();
  activeIndex=Math.min(activeIndex,Math.max(0,items.length-1));if(!items.length){root.innerHTML='<div class="global-search-empty"><b>Sin resultados</b><span>Prueba con un jugador, una sección o “comparar Güler con Brahim”.</span></div>';document.getElementById('cpResultCount').textContent='0 resultados';return}
  let group='';let selectable=0;root.innerHTML=items.map((item,i)=>{const head=item.group!==group?`<div class="global-search-group">${esc(item.group)}</div>`:'';group=item.group;if(item.type!=='hint')selectable++;return `${head}${itemHtml(item,i,i===0)}`}).join('');
  document.getElementById('cpResultCount').textContent=`${selectable} ${selectable===1?'resultado':'resultados'}`;
  root.querySelectorAll('[data-cp-index]').forEach(btn=>btn.addEventListener('click',()=>activate(items[Number(btn.dataset.cpIndex)])));
}
function move(delta){const buttons=[...document.querySelectorAll('#rmSearchResults [data-cp-index]:not(:disabled)')];if(!buttons.length)return;const current=buttons.findIndex(b=>Number(b.dataset.cpIndex)===activeIndex);const next=buttons[(current<0?0:current+delta+buttons.length)%buttons.length];activeIndex=Number(next.dataset.cpIndex);buttons.forEach(b=>{const on=Number(b.dataset.cpIndex)===activeIndex;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});next.scrollIntoView({block:'nearest'})}
function onInputKeydown(e){if(e.key==='ArrowDown'){e.preventDefault();move(1)}else if(e.key==='ArrowUp'){e.preventDefault();move(-1)}else if(e.key==='Enter'){e.preventDefault();document.querySelector(`#rmSearchResults [data-cp-index="${activeIndex}"]:not(:disabled)`)?.click()}}
function close(){window.RMPersonal?.closeSearch?.();const root=document.getElementById('rmGlobalSearch');root?.classList.remove('open');root?.setAttribute('aria-hidden','true');document.body.classList.remove('global-search-open')}
function open(query=''){
  if(!ensureEnhancedPanel())return;const root=document.getElementById('rmGlobalSearch');root.classList.add('open');root.setAttribute('aria-hidden','false');document.body.classList.add('global-search-open');activeIndex=0;const input=document.getElementById('rmSearchInput');if(input){input.value=query;render(query);setTimeout(()=>{input.focus();input.select?.()},20)}
}
function openPlayer(name){close();if(typeof showSection==='function')showSection('plantilla');let tries=0;const go=()=>{if(typeof window.openPlayerHub==='function'){window.openPlayerHub(name);return}if(tries++<24)setTimeout(go,80)};setTimeout(go,40)}
function openCompare(a,b){close();saveRecent(`comparar ${a} con ${b}`);if(typeof showSection==='function')showSection('comparador');let tries=0;const apply=()=>{const A=document.getElementById('compareA'),B=document.getElementById('compareB');if(A&&B){A.value=a;B.value=b;try{if(typeof window.renderCompare==='function')window.renderCompare()}catch{};setTimeout(()=>window.RMComparePro?.render?.(),0);return}if(tries++<24)setTimeout(apply,80)};setTimeout(apply,60)}
function activate(item){if(!item||item.type==='hint')return;if(item.type==='recent-query'){const input=document.getElementById('rmSearchInput');if(input){input.value=item.id;activeIndex=0;render(item.id);input.focus()}return}if(lastQuery.trim())saveRecent(lastQuery);if(item.type==='player'){openPlayer(item.id);return}if(item.type==='compare'){openCompare(item.a,item.b);return}if(item.type==='section'){close();if(typeof showSection==='function')showSection(item.id)}}
function interceptOpeners(){
  const btn=document.getElementById('globalSearchBtn');if(btn&&!btn.dataset.cpBound){btn.dataset.cpBound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},{capture:true})}
  window.rmOpenSearch=open;
}
function keyCapture(e){
  const tag=document.activeElement?.tagName,editing=['INPUT','TEXTAREA','SELECT'].includes(tag)||document.activeElement?.isContentEditable;
  const shortcut=(e.key==='/'&&!editing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k');if(!shortcut)return;e.preventDefault();e.stopImmediatePropagation();open();
}
function install(attempt=0){
  if(installed)return;if(!window.RMPersonal||!document.getElementById('rmGlobalSearch')){if(attempt<40)setTimeout(()=>install(attempt+1),100);return}
  installed=true;ensureEnhancedPanel();interceptOpeners();document.addEventListener('keydown',keyCapture,true);render('');
  ['rm-critical-modules-ready','rm-modules-ready','rm-season-data-ready'].forEach(name=>document.addEventListener(name,()=>{interceptOpeners();if(document.getElementById('rmGlobalSearch')?.classList.contains('open'))render(document.getElementById('rmSearchInput')?.value||'')}));
  window.RMCommandPalette=Object.freeze({open,close,render,recent:readRecent,compare:openCompare});
}
setTimeout(()=>install(),120);
})();