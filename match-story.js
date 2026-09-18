(()=>{
let installed=false,attempts=0;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]||c))}
function display(name){return safe(()=>typeof displayName==='function'?displayName(name):name,name)||name}
function currentMatch(){return safe(()=>typeof predictionMatch!=='undefined'?predictionMatch:null,null)}
const STORIES=Object.freeze({
  'rayo-2026-09-12':Object.freeze({
    id:'rayo-2026-09-12',rival:'Rayo',date:'12 SEP 2026',competition:'LaLiga',status:'lectura-cerrada',
    data:Object.freeze({
      headline:'XI, minutos y rendimiento cerrados',
      copy:'La alineación, los minutos y las valoraciones multifuente del partido ya están consolidados en la base canónica.'
    }),
    sources:Object.freeze({
      headline:'Fuentes externas cerradas',
      copy:'Sofascore, FotMob y StatMuse están incorporados como fuentes separadas de nuestra lectura. Si una fuente no publica nota, se marca SC; nunca se rellena con una estimación.'
    }),
    firstHalf:Object.freeze({
      title:'Primera parte · presión y superioridad individual',
      copy:'El Madrid impone una presión colectiva muy alta. Bernardo Silva dirige la salida y la generación; Valverde y Bellingham sostienen un esfuerzo físico enorme. Vini presiona, genera una acción de gol, asiste y crea peligro. Mbappé transmite superioridad constante con balón. Carreras tiene impacto directo provocando un penalti y marcando; Konaté ofrece seguridad total, Rüdiger domina por arriba y busca buenos desplazamientos largos, Dumfries aporta recorrido y Diomande combina potencia, presión y trabajo defensivo.'
    }),
    secondHalf:Object.freeze({
      title:'Segunda parte · el Rayo manda hasta el cambio de dinámica',
      copy:'El Rayo pasa a dominar el partido durante buena parte del segundo tiempo. La entrada de Güler alrededor del minuto 70 cambia la energía del encuentro: multiplica el recorrido, ayuda a neutralizar el dominio rival y termina dando una asistencia a Mbappé.'
    }),
    turningPoint:Object.freeze({minute:'≈70',title:'Entra Güler',copy:'Su actuación maratoniana corta la fase de dominio del Rayo y devuelve al Madrid capacidad para presionar, correr y volver a amenazar.'}),
    mvp:Object.freeze({name:'Bellingham',copy:'Gol, llegada y un despliegue físico espectacular durante todo el partido. Destaca como MVP dentro de una actuación coral muy fuerte.'}),
    conclusion:'Partido de dos fases: un Madrid dominante y agresivo en la primera parte; un Rayo que toma el control tras el descanso; y un último giro cuando Güler entra y cambia el ritmo. La gran constante del Madrid es la intensidad colectiva, con Bellingham como referencia física y Bernardo como cerebro de la salida en la primera mitad.',
    players:Object.freeze([
      ['Courtois','Excelente bajo palos y mucha seguridad cuando el Rayo logra llegar.'],
      ['Álvaro Carreras','Provoca un penalti y marca un gol; impacto directo enorme.'],
      ['Rüdiger','Muy fuerte por arriba y buenos intentos de balón largo.'],
      ['Konaté','Seguridad total y sensación de control defensivo.'],
      ['Dumfries','Muchísimo despliegue físico por la banda.'],
      ['Bernardo Silva','Clave de la primera parte: salida de balón, pausa y generación.'],
      ['Valverde','Trabajo continuo y enorme desgaste físico.'],
      ['Bellingham','Gol, llegada y físico espectacular; MVP de nuestra lectura.'],
      ['Vini Jr.','Presión que genera una acción de gol, asistencia y peligro continuo con balón.'],
      ['Mbappé','Superioridad individual constante; juega con sensación de estar por encima del rival y culmina una acción asistida por Güler.'],
      ['Diomande','Superioridad física, conducción, presión y mucho trabajo defensivo.'],
      ['Arda Güler','Entra alrededor del 70, cambia la dinámica, ayuda a anular el dominio del Rayo y da una asistencia.']
    ])
  })
});
function story(id){return STORIES[id]||null}
function current(){const m=currentMatch();return m?.id?story(m.id):null}
function latestStory(){const rows=Object.values(STORIES);return rows.length?rows.at(-1):null}
function labelBlock(kind,title,copy){return `<article class="ms-evidence ${esc(kind)}"><span>${esc(kind)}</span><b>${esc(title)}</b><p>${esc(copy)}</p></article>`}
function playersHtml(s){return `<details class="ms-players"><summary><span>JUGADORES CLAVE</span><b>Ver lectura jugador a jugador</b><strong>+</strong></summary><div class="ms-player-grid">${s.players.map(([name,copy])=>`<article><b>${esc(display(name))}</b><p>${esc(copy)}</p></article>`).join('')}</div></details>`}
function storyHtml(s,compact=false){
  return `<div class="ms-head"><div><span>MEMORIA DEL PARTIDO · ${esc(s.date)}</span><h2>Real Madrid vs ${esc(s.rival)}</h2><p>Una ficha que separa hechos, fuentes externas y nuestra lectura para recordar cómo fue realmente la jornada.</p></div><div class="ms-status"><b>NUESTRA LECTURA</b><small>Guardada sin mezclarla con las notas externas</small></div></div><div class="ms-evidence-grid">${labelBlock('DATOS',s.data.headline,s.data.copy)}${labelBlock('FUENTES',s.sources.headline,s.sources.copy)}</div><div class="ms-halves"><article><span>1.ª PARTE</span><h3>${esc(s.firstHalf.title)}</h3><p>${esc(s.firstHalf.copy)}</p></article><article><span>2.ª PARTE</span><h3>${esc(s.secondHalf.title)}</h3><p>${esc(s.secondHalf.copy)}</p></article></div><div class="ms-turn"><div><span>PUNTO DE INFLEXIÓN</span><b>${esc(s.turningPoint.minute)} · ${esc(s.turningPoint.title)}</b><p>${esc(s.turningPoint.copy)}</p></div><div class="ms-mvp"><span>MVP · NUESTRA LECTURA</span><b>${esc(display(s.mvp.name))}</b><p>${esc(s.mvp.copy)}</p></div></div><section class="ms-conclusion"><span>CONCLUSIÓN</span><p>${esc(s.conclusion)}</p></section>${playersHtml(s)}${compact?'<p class="ms-compact-note">Los minutos y las notas de las fuentes se añadirán después sin alterar esta lectura del partido.</p>':''}`
}
function ensureCurrentRoot(){
  const section=document.getElementById('partido');if(!section)return null;let root=document.getElementById('matchStoryCurrent');if(root)return root;
  root=document.createElement('section');root.id='matchStoryCurrent';root.className='card match-story';const top=document.getElementById('matchdayProTop'),dynamic=document.getElementById('matchdayDynamic');
  if(top)top.insertAdjacentElement('afterend',root);else if(dynamic)dynamic.insertAdjacentElement('beforebegin',root);else{const head=section.querySelector(':scope>.section-head');head?.insertAdjacentElement('afterend',root)}return root
}
function ensureHistoryRoot(){
  const section=document.getElementById('partidos');if(!section)return null;let root=document.getElementById('matchStoryHistory');if(root)return root;
  root=document.createElement('section');root.id='matchStoryHistory';root.className='card match-story match-story-history';const shell=document.getElementById('mhpShell'),head=section.querySelector(':scope>.section-head');if(shell)shell.insertAdjacentElement('beforebegin',root);else head?.insertAdjacentElement('afterend',root);return root
}
function renderCurrent(){const root=ensureCurrentRoot(),s=current();if(!root)return false;if(!s){root.hidden=true;root.innerHTML='';return false}root.hidden=false;root.innerHTML=storyHtml(s,false);document.dispatchEvent(new CustomEvent('rm-match-story-rendered',{detail:{matchId:s.id,surface:'partido'}}));return true}
function renderHistory(){const root=ensureHistoryRoot();if(!root)return false;const selected=safe(()=>window.RMMatchHistoryPro?.selected,null),s=selected?story(selected):null;if(!s){root.hidden=true;root.innerHTML='';return false}root.hidden=false;root.innerHTML=`<div class="ms-history-kicker"><span>RELATO GUARDADO</span><b>${esc(s.rival)} tiene memoria de partido</b><small>Lectura cualitativa separada de los minutos y notas oficiales del archivo.</small></div>${storyHtml(s,false)}`;document.dispatchEvent(new CustomEvent('rm-match-story-rendered',{detail:{matchId:s.id,surface:'partidos'}}));return true}
function render(){const id=document.querySelector('.section.active')?.id;if(id==='partido')return renderCurrent();if(id==='partidos')return renderHistory();return false}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('partido')||!document.getElementById('partidos')){if(++attempts<120)setTimeout(install,100);return}
  installed=true;render();['rm-season-data-ready','rm-season-extension-ready','rm-match-history-rendered','rm-modules-ready'].forEach(ev=>document.addEventListener(ev,()=>setTimeout(render,80)));window.RMMatchStory=Object.freeze({render,renderCurrent,renderHistory,story,current,latest:latestStory,all:()=>Object.values(STORIES)});document.dispatchEvent(new CustomEvent('rm-match-story-ready',{detail:{count:Object.keys(STORIES).length}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
setTimeout(install,140);
})();