const sections=[
['inicio','⌂','Inicio','Centro de mando','Todo el seguimiento del equipo en un único sitio.'],
['plantilla','◉','Plantilla','Plantilla','Jugadores, jerarquías y estado actual del equipo.'],
['estadisticas','▥','Estadísticas','Estadísticas','Notas de 3 fuentes, minutos, aporte y eficiencia por minuto.'],
['partidos','▣','Partidos','Partidos','Archivo de encuentros ya analizados.'],
['comparador','⇄','Comparar','Comparador','Cara a cara entre jugadores por rendimiento y contexto.'],
['prediccion','★','Predicción','Predice el once','Haz tu pronóstico del próximo once y comprueba tus aciertos.']];

const players=[
{name:'Courtois',pos:'POR',eligible:['POR'],role:'Portero · titular de referencia',tags:['Fijo']},
{name:'Dumfries',pos:'DEF',eligible:['LD','ED'],role:'LD · lateral / carrilero derecho',tags:['Titular base','Debate Trent']},
{name:'Trent Alexander-Arnold',short:'Trent',pos:'DEF',eligible:['LD','MC'],role:'LD · lateral / opción interior',tags:['Debate Dumfries','Construcción']},
{name:'Konaté',pos:'DEF',eligible:['DFC'],role:'DFC · central',tags:['Titular base','Debate centrales']},
{name:'Rüdiger',pos:'DEF',eligible:['DFC'],role:'DFC · central',tags:['Debate centrales']},
{name:'Huijsen',pos:'DEF',eligible:['DFC'],role:'DFC · central',tags:['Titular base','Salida']},
{name:'Raúl Asencio',short:'Asencio',pos:'DEF',eligible:['DFC'],role:'DFC · central',tags:['Plantilla']},
{name:'Cucurella',pos:'DEF',eligible:['LI'],role:'LI · lateral izquierdo',tags:['Titular base','Debate Carreras']},
{name:'Álvaro Carreras',short:'Carreras',pos:'DEF',eligible:['LI'],role:'LI · lateral izquierdo',tags:['Eficiencia']},
{name:'Ferland Mendy',short:'Mendy',pos:'DEF',eligible:['LI'],role:'LI · lateral izquierdo',tags:['Plantilla']},
{name:'Valverde',pos:'MED',eligible:['MC','ED'],role:'MC/ED · centrocampista / opción en banda derecha',tags:['Titular base','Posible descanso']},
{name:'Bernardo Silva',short:'Bernardo',pos:'MED',eligible:['MC','MP','ED'],role:'MC/MP/ED · creatividad y control',tags:['Titular base']},
{name:'Camavinga',pos:'MED',eligible:['MC'],role:'MC · centrocampista',tags:['Rotación fuerte']},
{name:'Tchouaméni',pos:'MED',eligible:['MC'],role:'MCD/MC · centrocampista',tags:['Plantilla']},
{name:'Bellingham',pos:'MED',eligible:['MP','MC'],role:'MP/MC · referencia ofensiva',tags:['Titular base','Posible descanso']},
{name:'Arda Güler',short:'Güler',pos:'MED',eligible:['MP','ED','MC'],role:'MP/ED/MC · creador',tags:['Fijo actual','MVP Betis']},
{name:'Brahim Díaz',short:'Brahim',pos:'MED',eligible:['MP','ED','EI'],role:'MP/ED/EI · alternativa ofensiva',tags:['Debate banda']},
{name:'Thiago Pitarch',short:'Thiago',pos:'MED',eligible:['MC'],role:'MC · Castilla / plantilla ampliada',tags:['Cantera']},
{name:'Mbappé',pos:'ATA',eligible:['DC','EI'],role:'DC/EI · referencia ofensiva',tags:['Fijo']},
{name:'Vini Jr.',short:'Vini',pos:'ATA',eligible:['EI','DC'],role:'EI · también opción como segundo punta',tags:['Fijo actual']},
{name:'Rodrygo',pos:'ATA',eligible:['EI','ED','DC'],role:'EI/ED/DC · atacante polivalente',tags:['Plantilla']},
{name:'Diomande',short:'Diomandé',pos:'ATA',eligible:['ED','EI'],role:'ED/EI · amplitud y profundidad',tags:['Debate banda']},
{name:'Endrick',pos:'ATA',eligible:['DC'],role:'DC · delantero',tags:['Plantilla']},
{name:'Carlos Espí',short:'Espí',pos:'ATA',eligible:['DC'],role:'DC · delantero',tags:['Eficiencia']}
];

const efficiencyRanking=[
{name:'Arda Güler',short:'Güler',minutes:209,points:19.04,minPerPoint:10.98},
{name:'Bellingham',minutes:425,points:38.39,minPerPoint:11.07},
{name:'Mbappé',minutes:450,points:40.28,minPerPoint:11.17},
{name:'Brahim Díaz',short:'Brahim',minutes:156,points:13.39,minPerPoint:11.65},
{name:'Valverde',minutes:429,points:36.54,minPerPoint:11.74},
{name:'Vinícius Jr.',short:'Vini',minutes:441,points:37.06,minPerPoint:11.90},
{name:'Rüdiger',minutes:90,points:7.55,minPerPoint:11.93},
{name:'Trent',minutes:205,points:17.04,minPerPoint:12.03},
{name:'Huijsen',minutes:450,points:36.37,minPerPoint:12.37},
{name:'Carlos Espí',short:'Espí',minutes:22,points:1.78,minPerPoint:12.39},
{name:'Cucurella',minutes:339,points:27.22,minPerPoint:12.45},
{name:'Konaté',minutes:360,points:28.41,minPerPoint:12.67},
{name:'Camavinga',minutes:176,points:13.75,minPerPoint:12.80},
{name:'Bernardo Silva',short:'Bernardo',minutes:205,points:15.75,minPerPoint:13.02},
{name:'Courtois',minutes:450,points:34.15,minPerPoint:13.18},
{name:'Dumfries',minutes:324,points:24.31,minPerPoint:13.33},
{name:'Álvaro Carreras',short:'Carreras',minutes:114,points:8.25,minPerPoint:13.82},
{name:'Diomandé',minutes:94,points:6.79,minPerPoint:13.84},
{name:'Tchouaméni',minutes:11,points:0.77,minPerPoint:14.29}
];

function metricFor(p){return efficiencyRanking.find(m=>m.name===p.name||(p.short&&(m.name===p.short||m.short===p.short)))||null}
function currentRating(m){return m&&m.minutes?m.points*90/m.minutes:null}

const matches=[
{rival:'Betis',comp:'LaLiga',note:'Partido trabajado en detalle. Güler fue nuestro mejor jugador y recibió el premio del partido.',state:'Analizado'},
{rival:'Málaga',comp:'LaLiga',note:'Notas individuales y comparación con el Betis incorporadas al seguimiento.',state:'Analizado'},
{rival:'Real Sociedad',comp:'LaLiga',note:'Valoración por jugador y comparación del tipo de partido con los anteriores.',state:'Analizado'},
{rival:'Espanyol',comp:'LaLiga',note:'Cuarto partido del primer corte histórico.',state:'Analizado'},
{rival:'Inter',comp:'Champions',note:'Partido posterior incorporado al seguimiento de tres fuentes y eficiencia por minutos.',state:'Analizado'}
];

const slots=[['gk','POR',50,91,'POR'],['lb','LI',14,73,'LI'],['lcb','DFC',38,75,'DFC'],['rcb','DFC',62,75,'DFC'],['rb','LD',86,73,'LD'],['dm1','MC',36,55,'MC'],['dm2','MC',64,55,'MC'],['am','MP',50,37,'MP'],['lw','EI',20,25,'EI'],['rw','ED',80,25,'ED'],['st','DC',50,12,'DC']];

const predictionMatch=Object.freeze({id:'atletico-2026-09-20',rival:'Atlético de Madrid',home:false,venue:'Riyadh Air Metropolitano',comp:'LaLiga',kickoff:'2026-09-20T16:15:00+02:00',deadline:'2026-09-20T14:30:00+02:00'});
const officialXI=null;
const officialXIBySlot={};
window.RMOfficialXIBySlot=Object.freeze({...officialXIBySlot});
const predictionStorageKey=`rm_prediction_${predictionMatch.id}`;

function navHtml(mobile=false){
  if(!mobile)return sections.map((s,i)=>`<button class="${i===0?'active':''}" data-section="${s[0]}" onclick="showSection('${s[0]}')"><span>${s[1]}</span>${s[2]}</button>`).join('');
  const primary=[['inicio','⌂','Inicio'],['partido','⚽','Partido'],['plantilla','◉','Equipo'],['mi-liga','🏆','Mi Liga']]
    .filter(([id])=>sections.some(s=>s[0]===id));
  const buttons=primary.map(([id,icon,label],i)=>`<button class="${i===0?'active':''}" data-section="${id}" onclick="${id==='mi-liga'?'openMiLiga()':`showSection('${id}')`}"><b>${icon}</b><small>${label}</small></button>`).join('');
  return buttons+`<button class="ux-more-tab" id="uxMoreTab" onclick="typeof openUxMore==='function'?openUxMore():showSection('estadisticas')"><b>☰</b><small>Más</small></button>`;
}
document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
function showSection(id){const target=document.getElementById(id),meta=sections.find(x=>x[0]===id);if(!target||!meta)return;document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));target.classList.add('active');document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));document.getElementById('pageTitle').textContent=meta[3];document.getElementById('pageSub').textContent=meta[4];window.scrollTo({top:0,behavior:'smooth'})}
function initials(n){return n.split(/[ .-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function tagClass(t){if(/Fijo|Titular|MVP/.test(t))return 'green';if(/Debate|Posible/.test(t))return 'gold';if(/Cantera|Construcción|Eficiencia/.test(t))return 'blue';return ''}
function displayName(name){const p=players.find(x=>x.name===name);return p?(p.short||p.name):name}

function renderPlayers(){const q=document.getElementById('playerSearch').value.toLowerCase(),p=document.getElementById('positionFilter').value;const list=players.filter(x=>(p==='ALL'||x.pos===p)&&x.name.toLowerCase().includes(q));document.getElementById('playerCount').textContent=`${list.length} jugadores`;document.getElementById('playersGrid').innerHTML=list.map(x=>{const m=metricFor(x),r=currentRating(m);return `<article class="card player"><div class="pos">${x.pos}</div><h3>${x.name}</h3><div class="meta">${x.role}<br>Elegible en el once: <b>${x.eligible.join(' · ')}</b>${r!==null?`<br>Media actual: <b>${r.toFixed(2)}</b><br>Minutos: <b>${m.minutes}</b> · Min/punto: <b>${m.minPerPoint.toFixed(2)}</b>`:'<br><span class="muted">Sin datos suficientes en el ranking actual</span>'}</div><div class="tags">${x.tags.map(t=>`<span class="tag ${tagClass(t)}">${t}</span>`).join('')}</div></article>`}).join('')}
document.getElementById('playerSearch').addEventListener('input',renderPlayers);document.getElementById('positionFilter').addEventListener('change',renderPlayers);
function renderBars(){const min=Math.min(...efficiencyRanking.map(x=>x.minPerPoint)),max=Math.max(...efficiencyRanking.map(x=>x.minPerPoint));document.getElementById('ratingBars').innerHTML=efficiencyRanking.map(m=>{const width=30+70*((max-m.minPerPoint)/(max-min));return `<div class="rank-row"><small>${m.short||m.name}</small><div class="bar"><i style="width:${width.toFixed(1)}%"></i></div><b>${m.minPerPoint.toFixed(2)}</b></div>`}).join('')}
function renderStats(){document.getElementById('statsBody').innerHTML=players.map(x=>{const m=metricFor(x),r=currentRating(m);return `<tr><td><b>${x.name}</b></td><td>${x.pos}</td><td class="score">${r!==null?r.toFixed(2):'—'}</td><td>${m?m.minutes:'—'}</td><td>${m?m.points.toFixed(2):'—'}</td><td>${m?m.minPerPoint.toFixed(2):'—'}</td><td><span class="tag ${m?'blue':''}">${m?'Ranking actual':'Pendiente'}</span></td></tr>`}).join('')}
function renderMatches(){document.getElementById('matchesList').innerHTML=matches.map((m,i)=>`<article class="card match-card"><div class="match-badge"><b>PARTIDO ${i+1}</b><small>${m.comp}</small></div><div><h3>Real Madrid · ${m.rival}</h3><p>${m.note}</p></div><div class="status">● ${m.state}</div></article>`).join('')}
function compareOptions(){const opts=players.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');document.getElementById('compareA').innerHTML=opts;document.getElementById('compareB').innerHTML=opts;document.getElementById('compareA').value='Dumfries';document.getElementById('compareB').value='Trent Alexander-Arnold';document.getElementById('compareA').onchange=renderCompare;document.getElementById('compareB').onchange=renderCompare;renderCompare()}
function renderCompare(){const a=players.find(p=>p.name===document.getElementById('compareA').value),b=players.find(p=>p.name===document.getElementById('compareB').value);const card=p=>{const m=metricFor(p),r=currentRating(m);return `<div class="card compare-card"><div class="avatar">${initials(p.short||p.name)}</div><h2>${p.name}</h2><div class="muted">${p.role}</div><div style="margin-top:14px"><div class="compare-stat"><span>Posición</span><b>${p.pos}</b></div><div class="compare-stat"><span>Media actual</span><b>${r!==null?r.toFixed(2):'—'}</b></div><div class="compare-stat"><span>Minutos</span><b>${m?m.minutes:'—'}</b></div><div class="compare-stat"><span>Aporte</span><b>${m?m.points.toFixed(2):'—'}</b></div><div class="compare-stat"><span>Min/punto</span><b>${m?m.minPerPoint.toFixed(2):'—'}</b></div></div></div>`};document.getElementById('compareView').innerHTML=card(a)+`<div class="vs">VS</div>`+card(b)}

function pitchOptions(position){return `<option value="">—</option>`+players.filter(p=>p.eligible.includes(position)).map(p=>`<option value="${p.name}">${p.short||p.name}</option>`).join('')}
function buildPredictionPitch(){document.getElementById('predictionPitch').innerHTML=slots.map(s=>`<div class="slot" style="left:${s[2]}%;top:${s[3]}%"><label>${s[1]}</label><select id="pred_${s[0]}">${pitchOptions(s[4])}</select></div>`).join('');slots.forEach(s=>document.getElementById('pred_'+s[0]).addEventListener('change',renderPredictionDraft));restorePrediction();renderPredictionStatus()}
function currentPredictionXI(){return Object.fromEntries(slots.map(s=>[s[0],document.getElementById('pred_'+s[0]).value]))}
function setPredictionXI(xi){slots.forEach(s=>document.getElementById('pred_'+s[0]).value=xi[s[0]]||'');renderPredictionDraft()}
function predictionValues(xi){return Object.values(xi).filter(Boolean)}
function predictionIsClosed(){return Array.isArray(officialXI)||Date.now()>=new Date(predictionMatch.deadline).getTime()}
function renderPredictionStatus(){const status=document.getElementById('predictionStatus');const closed=predictionIsClosed();status.textContent=Array.isArray(officialXI)?'Once oficial publicado':closed?'Predicción cerrada':'Predicción abierta';status.className='pill '+(closed?'closed':'open');slots.forEach(s=>document.getElementById('pred_'+s[0]).disabled=closed);document.getElementById('savePredictionBtn').disabled=closed;renderPredictionResult()}
function renderPredictionDraft(){const xi=currentPredictionXI();const values=predictionValues(xi);const unique=new Set(values);const box=document.getElementById('predictionSummary');if(!values.length){box.innerHTML='<span class="muted">Elige tus 11 titulares en el campo.</span>';return}box.innerHTML=`<div class="prediction-summary-head"><b>${values.length}/11 elegidos</b><span class="${unique.size===values.length?'ok':'warn'}">${unique.size===values.length?'Sin repetidos':'Hay jugadores repetidos'}</span></div><div class="prediction-list">${values.map(n=>`<span>${displayName(n)}</span>`).join('')}</div>`}
function clearPrediction(){if(predictionIsClosed()){toast('La predicción está cerrada');return}setPredictionXI({});document.getElementById('predictionName').value='';document.getElementById('predictionComment').value=''}
function savePrediction(){if(predictionIsClosed()){toast('La predicción ya está cerrada');return}const xi=currentPredictionXI();const values=predictionValues(xi);if(values.length!==11){toast('Completa los 11 jugadores');return}if(new Set(values).size!==11){toast('No puedes repetir jugadores');return}const data={matchId:predictionMatch.id,savedAt:new Date().toISOString(),name:document.getElementById('predictionName').value.trim(),comment:document.getElementById('predictionComment').value.trim(),xi};localStorage.setItem(predictionStorageKey,JSON.stringify(data));renderPredictionResult();toast('Predicción guardada')}
function restorePrediction(){let data=null;try{data=JSON.parse(localStorage.getItem(predictionStorageKey)||'null')}catch{}if(data&&data.xi){setPredictionXI(data.xi);document.getElementById('predictionName').value=data.name||'';document.getElementById('predictionComment').value=data.comment||''}else{setPredictionXI({})}}
function getSavedPrediction(){try{return JSON.parse(localStorage.getItem(predictionStorageKey)||'null')}catch{return null}}
function scoreSavedPrediction(data){if(!data||!data.xi||!Array.isArray(officialXI))return null;const predicted=new Set(predictionValues(data.xi));const actual=new Set(officialXI);const hits=[...predicted].filter(n=>actual.has(n));const misses=[...predicted].filter(n=>!actual.has(n));return{score:hits.length,hits,misses}}
function renderPredictionResult(){const box=document.getElementById('predictionResult');const data=getSavedPrediction();if(!data){box.innerHTML='<div class="result-pending"><b>Aún no has guardado una predicción.</b><span>Completa el once y pulsa “Guardar predicción”.</span></div>';return}if(!Array.isArray(officialXI)){const when=new Date(data.savedAt).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'});box.innerHTML=`<div class="result-pending"><b>Predicción guardada ✓</b><span>${data.name?`${data.name} · `:''}${when}</span><span>El resultado aparecerá aquí cuando publiquemos el once oficial.</span></div>`;return}const r=scoreSavedPrediction(data);box.innerHTML=`<div class="prediction-score"><span>Tu resultado</span><strong>${r.score}<small>/11</small></strong></div><div class="result-breakdown"><b>Aciertos</b><div class="prediction-list good">${r.hits.map(n=>`<span>${displayName(n)}</span>`).join('')||'<span>—</span>'}</div>${r.misses.length?`<b>No salieron titulares</b><div class="prediction-list bad">${r.misses.map(n=>`<span>${displayName(n)}</span>`).join('')}</div>`:''}</div>`}
async function sharePrediction(){const data=getSavedPrediction()||{xi:currentPredictionXI(),name:document.getElementById('predictionName').value.trim()};const names=predictionValues(data.xi||{});if(names.length!==11){toast('Completa primero tus 11 jugadores');return}const text=`Mi predicción del XI del Real Madrid vs ${predictionMatch.rival} (${names.map(displayName).join(', ')}). ¿Cuántos acertaré?`;try{if(navigator.share){await navigator.share({title:'RM 26/27 · Mi predicción',text})}else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Predicción copiada')}else{toast('No se puede compartir desde este navegador')}}catch(e){if(e&&e.name!=='AbortError')toast('No se pudo compartir')}}

const notes=document.getElementById('notes');notes.value=localStorage.getItem('rm_notes')||'';let noteTimer;notes.addEventListener('input',()=>{document.getElementById('saveState').textContent='Guardando…';clearTimeout(noteTimer);noteTimer=setTimeout(()=>{localStorage.setItem('rm_notes',notes.value);document.getElementById('saveState').textContent='Guardado'},400)});
function exportData(){const payload={version:'1.4',exported:new Date().toISOString(),notes:localStorage.getItem('rm_notes')||'',prediction:getSavedPrediction()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rm_2627_datos.json';a.click();URL.revokeObjectURL(a.href);toast('Datos exportados')}
document.getElementById('importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(typeof d.notes==='string'){localStorage.setItem('rm_notes',d.notes);notes.value=d.notes}if(d.prediction&&d.prediction.matchId===predictionMatch.id)localStorage.setItem(predictionStorageKey,JSON.stringify(d.prediction));restorePrediction();renderPredictionStatus();toast('Datos importados')}catch{toast('Archivo no válido')}e.target.value=''});
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}

renderPlayers();renderBars();renderStats();renderMatches();compareOptions();buildPredictionPitch();