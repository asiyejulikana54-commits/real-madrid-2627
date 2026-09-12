const fs=require('fs');
const vm=require('vm');

const failures=[];
const source=fs.readFileSync('season-input.js','utf8');
try{new vm.Script(source,{filename:'season-input.js'})}catch(error){failures.push(`season-input.js no compila: ${error.message}`)}

const context={
  window:{},
  document:{dispatchEvent(){}},
  CustomEvent:function(type,init={}){this.type=type;this.detail=init.detail},
  setTimeout(){return 0}
};
vm.createContext(context);
try{new vm.Script(source,{filename:'season-input.js'}).runInContext(context)}catch(error){failures.push(`season-input.js no se puede evaluar: ${error.message}`)}

const entries=context.window.RMSeasonMatchEntries||[];
const rayo=entries.find(match=>match?.id==='rayo');
if(!rayo)failures.push('Falta el partido Rayo en RMSeasonMatchEntries');

const expected={
  'Courtois':{minutes:90,sofascore:7.8,fotmob:7.8,statmuse:7.4},
  'Dumfries':{minutes:90,sofascore:6.5,fotmob:7.3,statmuse:6.8},
  'Konaté':{minutes:90,sofascore:6.4,fotmob:6.7,statmuse:6.3},
  'Rüdiger':{minutes:90,sofascore:7.7,fotmob:7.4,statmuse:7.4},
  'Álvaro Carreras':{minutes:90,sofascore:8.8,fotmob:8.9,statmuse:8.0},
  'Valverde':{minutes:45,sofascore:7.1,fotmob:6.9,statmuse:7.2},
  'Camavinga':{minutes:45,sofascore:7.1,fotmob:6.8,statmuse:6.9},
  'Bernardo Silva':{minutes:69,sofascore:6.8,fotmob:7.1,statmuse:7.4},
  'Tchouaméni':{minutes:21,sofascore:6.9,fotmob:6.6,statmuse:7.1},
  'Diomande':{minutes:72,sofascore:7.3,fotmob:7.8,statmuse:7.4},
  'Arda Güler':{minutes:18,sofascore:7.8,fotmob:8.1,statmuse:8.7},
  'Bellingham':{minutes:90,sofascore:8.1,fotmob:8.5,statmuse:8.9},
  'Vini Jr.':{minutes:89,sofascore:7.6,fotmob:7.8,statmuse:7.2},
  'Cucurella':{minutes:1,sofascore:'SC',fotmob:'SC',statmuse:6.7},
  'Mbappé':{minutes:90,sofascore:9.4,fotmob:9.5,statmuse:9.5}
};

if(rayo){
  if(rayo.final!==true)failures.push('Rayo debe estar cerrado con final:true');
  if(rayo.date!=='2026-09-12'||rayo.comp!=='LaLiga'||rayo.duration!==90)failures.push('Metadatos de Rayo incorrectos');
  const names=Object.keys(rayo.players||{});
  const expectedNames=Object.keys(expected);
  if(names.length!==expectedNames.length||expectedNames.some(name=>!names.includes(name)))failures.push(`Plantilla de jugadores de Rayo incorrecta: ${names.join(', ')}`);
  const total=names.reduce((sum,name)=>sum+Number(rayo.players[name]?.minutes||0),0);
  if(total!==990)failures.push(`Rayo suma ${total} minutos; deben ser 990`);
  for(const [name,row] of Object.entries(expected)){
    const actual=rayo.players?.[name];
    if(!actual){failures.push(`Falta ${name}`);continue}
    for(const key of ['minutes','sofascore','fotmob','statmuse']){
      if(actual[key]!==row[key])failures.push(`${name} · ${key}: esperado ${row[key]}, recibido ${actual[key]}`);
    }
    for(const key of ['sofascore','fotmob','statmuse']){
      const value=actual[key];
      if(!(value==='SC'||(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10)))failures.push(`${name} · ${key} no está cerrado con nota o SC`);
    }
  }
  const cucurella=rayo.players?.Cucurella;
  if(cucurella?.sofascore!=='SC'||cucurella?.fotmob!=='SC'||cucurella?.statmuse!==6.7)failures.push('Cucurella debe conservar SC en SofaScore/FotMob y 6.7 en StatMuse; nunca inventar nota');
  if(!String(rayo.sourceNote||'').includes('SofaScore')||!String(rayo.sourceNote||'').includes('FotMob')||!String(rayo.sourceNote||'').includes('StatMuse'))failures.push('Falta trazabilidad de las tres fuentes en el cierre de Rayo');
}

const app=fs.readFileSync('app.js','utf8');
for(const name of ['Courtois','Dumfries','Konaté','Rüdiger','Álvaro Carreras','Valverde','Bernardo Silva','Diomande','Bellingham','Vini Jr.','Mbappé']){
  if(!app.includes(`'${name}'`))failures.push(`El XI oficial de la app no reconoce a ${name}`);
}

if(failures.length){
  console.error('Rayo data audit: FAIL');
  failures.forEach(failure=>console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Rayo data audit: OK · 990 minutos + 15 jugadores + SofaScore/FotMob/StatMuse cerrados sin inventar SC');
