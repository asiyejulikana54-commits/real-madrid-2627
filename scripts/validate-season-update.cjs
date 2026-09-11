const path=require('path');
global.window=global;
global.document={dispatchEvent(){}};
global.CustomEvent=function(type,init={}){this.type=type;this.detail=init.detail};

require(path.join(__dirname,'..','season-input.js'));

// Prueba sintética: simula exactamente el alta de un sexto partido completo.
const XI=['Courtois','Dumfries','Konaté','Huijsen','Cucurella','Valverde','Bellingham','Arda Güler','Mbappé','Vini Jr.','Diomande'];
const players=Object.fromEntries(XI.map(name=>[name,{minutes:90,sofascore:7,fotmob:7,statmuse:7}]));
global.RMSeasonMatchEntries=[{id:'__smoke__',label:'Smoke Test',short:'TST',comp:'Test',date:'2099-01-01',duration:90,final:true,players}];

require(path.join(__dirname,'..','season-data.js'));
const baseMatches=global.RMSeasonData.matches.length;
require(path.join(__dirname,'..','season-extension.js'));
const data=global.RMSeasonData;
const failures=[];
if(data.version!==7)failures.push(`versión esperada 7, recibida ${data.version}`);
if(!data.validation?.ok)failures.push(`validación fallida: ${JSON.stringify(data.validation?.errors||[])}`);
if(data.matches.length!==baseMatches+1)failures.push('el partido nuevo no se añadió exactamente una vez');
if(data.matches.at(-1)?.id!=='__smoke__')failures.push('el nuevo partido no quedó como último encuentro');
if(data.officialRatingEntry('__smoke__','Courtois')?.value!==7)failures.push('la nota oficial 3/3 no se calculó correctamente');
if(data.aggregatePlayer('Courtois').totalMinutes!==540)failures.push(`Courtois debería acumular 540 minutos y acumula ${data.aggregatePlayer('Courtois').totalMinutes}`);
if(data.recentRating('Courtois',1)?.rows?.[0]?.match?.id!=='__smoke__')failures.push('la forma reciente no incorpora el partido nuevo');
if(data.sourceAudit().pendingAppearances!==0)failures.push('la prueba deja apariciones pendientes');

if(failures.length){console.error('Season update smoke test: FAIL');for(const f of failures)console.error(`- ${f}`);process.exit(1)}
console.log(`Season update smoke test: OK · ${data.matches.length} partidos · entrada única conectada`);
