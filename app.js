const sections=[
['inicio','⌂','Inicio','Centro de mando','Todo el seguimiento del equipo en un único sitio.'],
['plantilla','◉','Plantilla','Plantilla','Jugadores, jerarquías y estado dentro del proyecto.'],
['estadisticas','▥','Estadísticas','Estadísticas','Notas de 3 fuentes, minutos, aporte y eficiencia por minuto.'],
['partidos','▣','Partidos','Partidos','Archivo de encuentros ya analizados.'],
['comparador','⇄','Comparar','Comparador','Cara a cara de nuestras principales dudas.'],
['once','◆','Once','Constructor de once','Crea y guarda nuestras opciones tácticas.']];

const players=[
{name:'Courtois',pos:'POR',role:'Portero · titular de referencia',tags:['Fijo'],rating4:6.75},
{name:'Lunin',pos:'POR',role:'Portero · segundo portero',tags:['Plantilla']},
{name:'Dumfries',pos:'DEF',role:'LD · lateral derecho',tags:['Titular base','Debate Trent']},
{name:'Trent Alexander-Arnold',short:'Trent',pos:'DEF',role:'LD · lateral / opción interior',tags:['Debate Dumfries','Construcción']},
{name:'Konaté',pos:'DEF',role:'DFC · central',tags:['Titular base','Debate centrales']},
{name:'Rüdiger',pos:'DEF',role:'DFC · central',tags:['Debate centrales']},
{name:'Huijsen',pos:'DEF',role:'DFC · central',tags:['Titular base','Salida'],rating4:7.50},
{name:'Raúl Asencio',short:'Asencio',pos:'DEF',role:'DFC · central',tags:['Plantilla']},
{name:'Cucurella',pos:'DEF',role:'LI · lateral izquierdo',tags:['Titular base','Debate Carreras'],rating4:6.88},
{name:'Álvaro Carreras',short:'Carreras',pos:'DEF',role:'LI · lateral izquierdo',tags:['Eficiencia'],minutes:114,contribution:8.45,minPerPoint:13.49},
{name:'Ferland Mendy',short:'Mendy',pos:'DEF',role:'LI · lateral izquierdo',tags:['Plantilla']},
{name:'Valverde',pos:'MED',role:'MC · pieza estructural',tags:['Titular base','Posible descanso'],rating4:7.13},
{name:'Bernardo Silva',short:'Bernardo',pos:'MED',role:'MC/MP · creatividad y control',tags:['Titular base']},
{name:'Camavinga',pos:'MED',role:'MC · equilibrio y conducción',tags:['Rotación fuerte'],rating4:6.63},
{name:'Tchouaméni',pos:'MED',role:'MCD/MC · pivote',tags:['Plantilla']},
{name:'Bellingham',pos:'MED',role:'MP/MC · referencia ofensiva',tags:['Titular base','Posible descanso'],rating4:8.50},
{name:'Arda Güler',short:'Güler',pos:'MED',role:'MP/ED · creador',tags:['Fijo actual','MVP Betis'],rating4:8.13},
{name:'Brahim Díaz',short:'Brahim',pos:'MED',role:'MP/ED · alternativa ofensiva',tags:['Debate banda']},
{name:'Thiago Pitarch',short:'Thiago',pos:'MED',role:'MC · Castilla / plantilla ampliada',tags:['Cantera']},
{name:'Mbappé',pos:'ATA',role:'DC · referencia ofensiva',tags:['Fijo'],rating4:7.50},
{name:'Vini Jr.',short:'Vini',pos:'ATA',role:'EI · desequilibrio',tags:['Debate banda'],rating4:6.75},
{name:'Rodrygo',pos:'ATA',role:'EI/ED · extremo',tags:['Plantilla']},
{name:'Diomande',short:'Diomandé',pos:'ATA',role:'ED · amplitud y profundidad',tags:['Debate banda']},
{name:'Endrick',pos:'ATA',role:'DC · delantero',tags:['Plantilla']},
{name:'Carlos Espí',short:'Espí',pos:'ATA',role:'DC · delantero',tags:['Eficiencia'],minutes:22,contribution:1.713,minPerPoint:12.84}
];

const updatedRanking=[
{name:'Bellingham',score:8.06},
{name:'Mbappé',score:8.02},
{name:'Arda Güler',short:'Güler',score:7.85},
{name:'Vinícius Jr.',short:'Vini',score:7.55},
{name:'Trent',score:7.52},
{name:'Valverde',score:7.51},
{name:'Brahim Díaz',short:'Brahim',score:7.50},
{name:'Rüdiger',score:7.42},
{name:'Huijsen',score:7.31},
{name:'Cucurella',score:7.06},
{name:'Konaté',score:7.02},
{name:'Bernardo Silva',short:'Bernardo',score:7.00},
{name:'Camavinga',score:6.90},
{name:'Courtois',score:6.78},
{name:'Álvaro Carreras',short:'Carreras',score:6.75},
{name:'Dumfries',score:6.67}
];

const matches=[
{rival:'Betis',comp:'LaLiga',note:'Partido trabajado en detalle. Güler fue nuestro mejor jugador y recibió el premio del partido.',state:'Analizado'},
{rival:'Málaga',comp:'LaLiga',note:'Notas individuales y comparación con el Betis incorporadas al seguimiento.',state:'Analizado'},
{rival:'Real Sociedad',comp:'LaLiga',note:'Valoración por jugador y comparación del tipo de partido con los anteriores.',state:'Analizado'},
{rival:'Espanyol',comp:'LaLiga',note:'Cuarto partido del corte de medias históricas que consolidamos.',state:'Analizado'},
{rival:'Inter',comp:'Champions',note:'Partido posterior con seguimiento de notas y huecos. Camavinga, Bernardo y Güler llegaron sancionados a este encuentro.',state:'Analizado'}
];

const baseXI={gk:'Courtois',lb:'Cucurella',lcb:'Huijsen',rcb:'Konaté',rb:'Dumfries',dm1:'Valverde',dm2:'Bernardo Silva',am:'Bellingham',lw:'Vini Jr.',rw:'Arda Güler',st:'Mbappé'};
const rayoXI={gk:'Courtois',lb:'Álvaro Carreras',lcb:'Rüdiger',rcb:'Huijsen',rb:'Trent Alexander-Arnold',dm1:'Valverde',dm2:'Arda Güler',am:'Bellingham',lw:'Vini Jr.',rw:'Diomande',st:'Mbappé'};
const slots=[['gk','POR',50,91,'POR'],['lb','LI',14,73,'DEF'],['lcb','DFC',38,75,'DEF'],['rcb','DFC',62,75,'DEF'],['rb','LD',86,73,'DEF'],['dm1','MC',36,55,'MED'],['dm2','MC',64,55,'MED'],['am','MP',50,37,'MED'],['lw','EI',20,25,'ATA'],['rw','ED',80,25,'ATA'],['st','DC',50,12,'ATA']];

function navHtml(mobile=false){return sections.map((s,i)=>`<button class="${i===0?'active':''}" data-section="${s[0]}" onclick="showSection('${s[0]}')">${mobile?'':`<span>${s[1]}</span>`}${s[2]}</button>`).join('')}
document.getElementById('navDesktop').innerHTML=navHtml(false);document.getElementById('navMobile').innerHTML=navHtml(true);
function showSection(id){document.querySelectorAll('.section').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b.dataset.section===id));const s=sections.find(x=>x[0]===id);document.getElementById('pageTitle').textContent=s[3];document.getElementById('pageSub').textContent=s[4];window.scrollTo({top:0,behavior:'smooth'})}
function initials(n){return n.split(/[ .-]/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function tagClass(t){if(/Fijo|Titular|MVP/.test(t))return 'green';if(/Debate|Posible/.test(t))return 'gold';if(/Cantera|Construcción|Eficiencia/.test(t))return 'blue';return ''}
function renderPlayers(){const q=document.getElementById('playerSearch').value.toLowerCase(),p=document.getElementById('positionFilter').value;const list=players.filter(x=>(p==='ALL'||x.pos===p)&&x.name.toLowerCase().includes(q));document.getElementById('playerCount').textContent=`${list.length} jugadores`;document.getElementById('playersGrid').innerHTML=list.map(x=>`<article class="card player"><div class="pos">${x.pos}</div><h3>${x.name}</h3><div class="meta">${x.role}${x.rating4?`<br>Media histórica 4PJ: <b>${x.rating4.toFixed(2)}</b>`:''}${x.minutes?`<br>Último dato puntual: <b>${x.minutes}'</b>`:''}</div><div class="tags">${x.tags.map(t=>`<span class="tag ${tagClass(t)}">${t}</span>`).join('')}</div></article>`).join('')}
document.getElementById('playerSearch').addEventListener('input',renderPlayers);document.getElementById('positionFilter').addEventListener('change',renderPlayers);
function renderBars(){document.getElementById('ratingBars').innerHTML=updatedRanking.map(x=>`<div class="rank-row"><small>${x.short||x.name}</small><div class="bar"><i style="width:${(x.score/10)*100}%"></i></div><b>${x.score.toFixed(2)}</b></div>`).join('')}
function renderStats(){document.getElementById('statsBody').innerHTML=players.map(x=>`<tr><td><b>${x.name}</b></td><td>${x.pos}</td><td class="score">${x.rating4?x.rating4.toFixed(2):'—'}</td><td>${x.minutes??'—'}</td><td>${x.contribution??'—'}</td><td>${x.minPerPoint??'—'}</td><td><span class="tag ${x.rating4||x.minutes?'blue':''}">${x.rating4?'Corte 4PJ':x.minutes?'Dato puntual':'Pendiente'}</span></td></tr>`).join('')}
function renderMatches(){document.getElementById('matchesList').innerHTML=matches.map((m,i)=>`<article class="card match-card"><div class="match-badge"><b>PARTIDO ${i+1}</b><small>${m.comp}</small></div><div><h3>Real Madrid · ${m.rival}</h3><p>${m.note}</p></div><div class="status">● ${m.state}</div></article>`).join('')}
function compareOptions(){const opts=players.map(p=>`<option value="${p.name}">${p.name}</option>`).join('');document.getElementById('compareA').innerHTML=opts;document.getElementById('compareB').innerHTML=opts;document.getElementById('compareA').value='Dumfries';document.getElementById('compareB').value='Trent Alexander-Arnold';document.getElementById('compareA').onchange=renderCompare;document.getElementById('compareB').onchange=renderCompare;renderCompare()}
function renderCompare(){const a=players.find(p=>p.name===document.getElementById('compareA').value),b=players.find(p=>p.name===document.getElementById('compareB').value);const card=p=>`<div class="card compare-card"><div class="avatar">${initials(p.short||p.name)}</div><h2>${p.name}</h2><div class="muted">${p.role}</div><div style="margin-top:14px"><div class="compare-stat"><span>Posición</span><b>${p.pos}</b></div><div class="compare-stat"><span>Media 4PJ</span><b>${p.rating4?p.rating4.toFixed(2):'—'}</b></div><div class="compare-stat"><span>Minutos conocidos</span><b>${p.minutes??'—'}</b></div><div class="compare-stat"><span>Min/punto</span><b>${p.minPerPoint??'—'}</b></div></div></div>`;document.getElementById('compareView').innerHTML=card(a)+`<div class="vs">VS</div>`+card(b)}
function pitchOptions(group){return `<option value="">—</option>`+players.filter(p=>group==='DEF'?p.pos==='DEF':group==='MED'?p.pos==='MED':group==='ATA'?p.pos==='ATA':p.pos==='POR').map(p=>`<option value="${p.name}">${p.short||p.name}</option>`).join('')}
function buildPitch(){document.getElementById('pitch').innerHTML=slots.map(s=>`<div class="slot" style="left:${s[2]}%;top:${s[3]}%"><label>${s[1]}</label><select id="slot_${s[0]}">${pitchOptions(s[4])}</select></div>`).join('');loadPreset('base',false)}
function currentXI(){return Object.fromEntries(slots.map(s=>[s[0],document.getElementById('slot_'+s[0]).value]))}
function setXI(xi){slots.forEach(s=>document.getElementById('slot_'+s[0]).value=xi[s[0]]||'')}
function loadPreset(kind,go=true){setXI(kind==='rayo'?rayoXI:baseXI);document.getElementById('lineupName').value=kind==='rayo'?'Rayo · idea que estamos valorando':'Once base de referencia';document.getElementById('lineupComment').value=kind==='rayo'?'Escenario de trabajo: Courtois, Mbappé y Güler como piezas fijas en nuestra previsión; Vini entra en la duda de banda junto a Diomandé y Brahim. También seguimos las dudas en laterales, centrales y posible descanso de Valverde/Bellingham.':'Once base histórico: Courtois; Dumfries, Konaté, Huijsen, Cucurella; Valverde, Bernardo; Bellingham; Güler, Vini; Mbappé.';if(go)showSection('once')}
function saveLineup(){const name=document.getElementById('lineupName').value.trim()||'Once sin nombre';const data={id:Date.now(),name,comment:document.getElementById('lineupComment').value,xi:currentXI()};const arr=JSON.parse(localStorage.getItem('rm_lineups')||'[]');arr.unshift(data);localStorage.setItem('rm_lineups',JSON.stringify(arr));renderSaved();toast('Once guardado')}
function renderSaved(){const arr=JSON.parse(localStorage.getItem('rm_lineups')||'[]');document.getElementById('savedLineups').innerHTML=arr.length?arr.map(x=>`<div class="saved-lineup"><div><b>${x.name}</b><small>${x.comment?'<br>'+x.comment.slice(0,62)+(x.comment.length>62?'…':''):''}</small></div><div><button class="btn" onclick="restoreLineup(${x.id})">Abrir</button> <button class="btn" onclick="deleteLineup(${x.id})">×</button></div></div>`).join(''):'<div class="muted">Todavía no has guardado ningún once.</div>'}
function restoreLineup(id){const x=JSON.parse(localStorage.getItem('rm_lineups')||'[]').find(x=>x.id===id);if(!x)return;setXI(x.xi);document.getElementById('lineupName').value=x.name;document.getElementById('lineupComment').value=x.comment||'';toast('Once cargado')}
function deleteLineup(id){const arr=JSON.parse(localStorage.getItem('rm_lineups')||'[]').filter(x=>x.id!==id);localStorage.setItem('rm_lineups',JSON.stringify(arr));renderSaved();toast('Once eliminado')}
function clearLineup(){setXI({});document.getElementById('lineupName').value='';document.getElementById('lineupComment').value=''}
const notes=document.getElementById('notes');notes.value=localStorage.getItem('rm_notes')||'';let noteTimer;notes.addEventListener('input',()=>{document.getElementById('saveState').textContent='Guardando…';clearTimeout(noteTimer);noteTimer=setTimeout(()=>{localStorage.setItem('rm_notes',notes.value);document.getElementById('saveState').textContent='Guardado'},400)});
function exportData(){const payload={version:'1.0',exported:new Date().toISOString(),notes:localStorage.getItem('rm_notes')||'',lineups:JSON.parse(localStorage.getItem('rm_lineups')||'[]')};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rm_2627_datos.json';a.click();URL.revokeObjectURL(a.href);toast('Datos exportados')}
document.getElementById('importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(typeof d.notes==='string'){localStorage.setItem('rm_notes',d.notes);notes.value=d.notes}if(Array.isArray(d.lineups))localStorage.setItem('rm_lineups',JSON.stringify(d.lineups));renderSaved();toast('Datos importados')}catch{toast('Archivo no válido')}e.target.value=''});
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
renderPlayers();renderBars();renderStats();renderMatches();compareOptions();buildPitch();renderSaved();