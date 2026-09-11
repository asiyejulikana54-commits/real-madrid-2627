(()=>{
const NAV_META={
  inicio:{icon:'⌂',label:'Inicio',title:'Centro de mando'},
  partido:{icon:'◉',label:'Partido',title:'Partido'},
  plantilla:{icon:'◎',label:'Plantilla',title:'Plantilla'},
  power:{icon:'↗',label:'Power RM',title:'Power RM'},
  jerarquias:{icon:'≡',label:'Jerarquías',title:'Jerarquías'},
  estadisticas:{icon:'▥',label:'Estadísticas',title:'Estadísticas'},
  evolucion:{icon:'⌁',label:'Evolución',title:'Evolución'},
  partidos:{icon:'▣',label:'Partidos',title:'Partidos'},
  mvp:{icon:'★',label:'MVP',title:'MVP'},
  radar:{icon:'◇',label:'Radar',title:'Radar de decisiones'},
  comparador:{icon:'⇄',label:'Comparar',title:'Comparador'},
  laboratorio:{icon:'△',label:'Laboratorio',title:'Laboratorio de XI'},
  once:{icon:'◆',label:'Constructor',title:'Constructor de XI'},
  comunidad:{icon:'♟',label:'Comunidad',title:'Comunidad'},
  prediccion:{icon:'✓',label:'Predicción',title:'Predicción del XI'}
};
const TEXT_REPLACEMENTS=new Map([
  ['🧠 CENTRO DE INTELIGENCIA RM','CENTRO DE INTELIGENCIA RM'],
  ['⚗ XI RECOMENDADO POR DATOS','XI RECOMENDADO POR DATOS'],
  ['👥 PULSO DE LA COMUNIDAD','COMUNIDAD'],
  ['🎯 PRÓXIMO PARTIDO','PRÓXIMO PARTIDO'],
  ['⚡ Poder actual','Power actual'],
  ['↗ Mayor subida reciente','Forma en subida'],
  ['🪑 Mejor fuera del XI base','Mejor alternativa'],
  ['🔬 Muestra a vigilar','Muestra a vigilar'],
  ['🔥 Puesto más abierto','Puesto más abierto'],
  ['🔒 Mayor ventaja','Mayor ventaja'],
  ['♜ Polivalencia dominante','Polivalencia dominante'],
  ['Power Ranking RM 26/27','Power RM'],
  ['Clasificación completa','Ranking completo'],
  ['Min / punto','Min/punto']
]);
let timer=null,installed=false;

function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function ensureCss(){
  if(document.querySelector('link[data-visual-system]'))return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='visual-system.css?v=1';link.dataset.visualSystem='1';document.head.appendChild(link);
}
function normalizeSections(){
  if(typeof sections==='undefined')return;
  sections.forEach(s=>{const meta=NAV_META[s[0]];if(!meta)return;s[1]=meta.icon;s[2]=meta.label;s[3]=meta.title});
}
function normalizeNav(){
  document.querySelectorAll('[data-section]').forEach(btn=>{
    const meta=NAV_META[btn.dataset.section];if(!meta)return;
    setText(btn.querySelector(':scope > span'),meta.icon);
    setText(btn.querySelector(':scope > em'),meta.label);
    if(btn.closest('.mobile-nav')){setText(btn.querySelector(':scope > b'),meta.icon);setText(btn.querySelector(':scope > small'),meta.label==='Power RM'?'Datos':meta.label)}
    if(btn.closest('.ux-sheet-groups')){setText(btn.querySelector(':scope > span'),meta.icon);setText(btn.querySelector(':scope > b'),meta.label)}
  });
}
function normalizeHeadings(){
  document.querySelectorAll('h1,h2,h3,.eyebrow,.label,.history-mobile-label').forEach(el=>{const replacement=TEXT_REPLACEMENTS.get(el.textContent.trim());if(replacement!==undefined)setText(el,replacement)});
  const active=document.querySelector('.section.active')?.id,meta=NAV_META[active];if(meta)setText(document.getElementById('pageTitle'),meta.title)
}
function classifyText(el){
  const text=(el.textContent||'').trim().toLowerCase();
  const next=/cerrad|error|baja|cae|▼|alerta|fallo/.test(text)?'vs-danger':/abiert|conectad|complet|guardad|analizad|titular claro|▲|mejora/.test(text)?'vs-success':/pendiente|esperando|muestra corta|duelo|posible|parcial/.test(text)?'vs-warn':/nuevo|rotación|información|ranking actual/.test(text)?'vs-info':'vs-neutral';
  ['vs-success','vs-warn','vs-info','vs-danger','vs-neutral'].forEach(c=>{if(c!==next&&el.classList.contains(c))el.classList.remove(c)});if(!el.classList.contains(next))el.classList.add(next)
}
function normalizeStates(){document.querySelectorAll('.pill,.tag,.status,.power-level,.h-tier,.intel-status b,.history-pending,.result-pending>b').forEach(classifyText)}
function normalizeAccessibility(){
  document.querySelectorAll('button').forEach(b=>{if(!b.getAttribute('type'))b.setAttribute('type','button')});
  document.querySelectorAll('.card[onclick],button.card').forEach(el=>{if(!el.classList.contains('vs-interactive'))el.classList.add('vs-interactive')});
}
function apply(){ensureCss();if(!document.body.classList.contains('rm-visual-system'))document.body.classList.add('rm-visual-system');normalizeSections();normalizeNav();normalizeHeadings();normalizeStates();normalizeAccessibility()}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,50)}
function install(){
  if(installed)return;if(typeof sections==='undefined'||!document.body.classList.contains('ux-refined')){setTimeout(install,100);return}
  installed=true;ensureCss();apply();
  const previous=window.showSection;if(typeof previous==='function'){window.showSection=function(id){previous(id);setTimeout(apply,40)}}
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
}
setTimeout(install,120);
})();
