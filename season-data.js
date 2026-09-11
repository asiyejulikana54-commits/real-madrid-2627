(()=>{
const MATCHES=Object.freeze([
  {id:'malaga',label:'Málaga',short:'MÁL',comp:'LaLiga'},
  {id:'real-sociedad',label:'Real Sociedad',short:'RSO',comp:'LaLiga'},
  {id:'espanyol',label:'Espanyol',short:'ESP',comp:'LaLiga'},
  {id:'betis',label:'Betis',short:'BET',comp:'LaLiga'},
  {id:'inter',label:'Inter',short:'INT',comp:'Champions'}
]);
const ALIASES=Object.freeze({
  'Vinícius Jr.':'Vini Jr.','Vini':'Vini Jr.','Trent':'Trent Alexander-Arnold','Güler':'Arda Güler',
  'Brahim':'Brahim Díaz','Carreras':'Álvaro Carreras','Diomandé':'Diomande','Espí':'Carlos Espí','Bernardo':'Bernardo Silva'
});
const rec=(value,source,status='confirmed',note='')=>Object.freeze({value,source,status,note});
const DATA={
  malaga:{ratings:{
    'Bellingham':rec(8.8,'FotMob'),'Mbappé':rec(8.7,'FotMob'),'Trent Alexander-Arnold':rec(8.5,'FotMob'),
    'Vini Jr.':rec(8.3,'FotMob'),'Camavinga':rec(7.8,'FotMob'),'Cucurella':rec(7.7,'FotMob'),'Huijsen':rec(7.5,'FotMob'),
    'Diomande':rec(6.6,'FotMob','reconstructed','Valor usado anteriormente en el proyecto; falta recuperar la evidencia original.')
  },minutes:{'Diomande':rec(25,'Reconstrucción del proyecto','reconstructed','Minutaje pendiente de comprobación contra fuente primaria.')}},
  'real-sociedad':{ratings:{
    'Mbappé':rec(9.8,'FotMob'),'Bellingham':rec(9.0,'FotMob'),'Vini Jr.':rec(8.6,'FotMob'),
    'Arda Güler':rec(8.2,'FotMob'),'Valverde':rec(8.1,'FotMob'),'Huijsen':rec(7.8,'FotMob')
  },minutes:{}},
  espanyol:{ratings:{
    'Arda Güler':rec(8.6,'FotMob'),'Bellingham':rec(8.3,'FotMob'),'Valverde':rec(8.1,'FotMob'),
    'Konaté':rec(7.7,'FotMob'),'Mbappé':rec(7.4,'FotMob'),
    'Diomande':rec(6.0,'FotMob','reconstructed','Valor usado anteriormente en el proyecto; falta recuperar la evidencia original.')
  },minutes:{}},
  betis:{ratings:{
    'Vini Jr.':rec(7.8,'FotMob','reconstructed'),'Arda Güler':rec(7.5,'FotMob','reconstructed'),
    'Huijsen':rec(7.5,'FotMob','reconstructed'),'Bellingham':rec(7.4,'FotMob','reconstructed'),
    'Cucurella':rec(6.8,'FotMob','reconstructed'),'Mbappé':rec(6.7,'FotMob','reconstructed'),
    'Courtois':rec(6.7,'FotMob','reconstructed'),'Valverde':rec(6.6,'FotMob','reconstructed'),
    'Konaté':rec(6.6,'FotMob','reconstructed'),'Dumfries':rec(6.6,'FotMob','reconstructed'),
    'Camavinga':rec(6.1,'FotMob','reconstructed')
  },minutes:{
    'Courtois':rec(90,'Reconstrucción del proyecto','reconstructed'),'Huijsen':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Mbappé':rec(90,'Reconstrucción del proyecto','reconstructed'),'Vini Jr.':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Bellingham':rec(90,'Reconstrucción del proyecto','reconstructed'),'Konaté':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Cucurella':rec(90,'Reconstrucción del proyecto','reconstructed'),'Valverde':rec(82,'Reconstrucción del proyecto','reconstructed'),
    'Dumfries':rec(64,'Reconstrucción del proyecto','reconstructed'),'Arda Güler':rec(64,'Reconstrucción del proyecto','reconstructed'),
    'Camavinga':rec(64,'Reconstrucción del proyecto','reconstructed'),'Bernardo Silva':rec(26,'Reconstrucción del proyecto','reconstructed'),
    'Trent Alexander-Arnold':rec(26,'Reconstrucción del proyecto','reconstructed'),'Diomande':rec(26,'Reconstrucción del proyecto','reconstructed'),
    'Carlos Espí':rec(8,'Reconstrucción del proyecto','reconstructed'),'Álvaro Carreras':rec(2,'Reconstrucción del proyecto','reconstructed'),
    'Rüdiger':rec(0,'Reconstrucción del proyecto','reconstructed'),'Brahim Díaz':rec(0,'Reconstrucción del proyecto','reconstructed'),
    'Lunin':rec(0,'Reconstrucción del proyecto','reconstructed')
  }},
  inter:{ratings:{},minutes:{
    'Courtois':rec(90,'Reconstrucción del proyecto','reconstructed'),'Huijsen':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Mbappé':rec(90,'Reconstrucción del proyecto','reconstructed'),'Valverde':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Bellingham':rec(90,'Reconstrucción del proyecto','reconstructed'),'Konaté':rec(90,'Reconstrucción del proyecto','reconstructed'),
    'Dumfries':rec(90,'Reconstrucción del proyecto','reconstructed'),'Cucurella':rec(88,'Reconstrucción del proyecto','reconstructed'),
    'Vini Jr.':rec(87,'Reconstrucción del proyecto','reconstructed'),'Trent Alexander-Arnold':rec(79,'Reconstrucción del proyecto','reconstructed'),
    'Brahim Díaz':rec(79,'Reconstrucción del proyecto','reconstructed'),'Diomande':rec(11,'Reconstrucción del proyecto','reconstructed'),
    'Tchouaméni':rec(11,'Reconstrucción del proyecto','reconstructed'),'Álvaro Carreras':rec(3,'Reconstrucción del proyecto','reconstructed'),
    'Arda Güler':rec(0,'Reconstrucción del proyecto','reconstructed'),'Camavinga':rec(0,'Reconstrucción del proyecto','reconstructed'),
    'Bernardo Silva':rec(0,'Reconstrucción del proyecto','reconstructed'),'Carlos Espí':rec(0,'Reconstrucción del proyecto','reconstructed'),
    'Rüdiger':rec(0,'Reconstrucción del proyecto','reconstructed'),'Lunin':rec(0,'Reconstrucción del proyecto','reconstructed')
  }}
};
function canonical(name){return ALIASES[name]||name}
function entry(kind,matchId,player,{includeReconstructed=false}={}){
  const bucket=DATA[matchId]?.[kind];if(!bucket)return null;const row=bucket[canonical(player)]||null;
  if(!row)return null;if(row.status!=='confirmed'&&!includeReconstructed)return null;return row;
}
function value(kind,matchId,player,opts){return entry(kind,matchId,player,opts)?.value??null}
function ratingEntry(matchId,player,opts){return entry('ratings',matchId,player,opts)}
function minuteEntry(matchId,player,opts){return entry('minutes',matchId,player,opts)}
function rating(matchId,player,opts){return value('ratings',matchId,player,opts)}
function minutes(matchId,player,opts){return value('minutes',matchId,player,opts)}
function ratingSeries(player,{includeReconstructed=false,through=MATCHES.length-1}={}){
  return MATCHES.slice(0,through+1).map(match=>({match,entry:ratingEntry(match.id,player,{includeReconstructed})})).filter(x=>x.entry);
}
function recentRating(player,n=3,opts={}){
  const rows=ratingSeries(player,opts).slice(-n);if(!rows.length)return null;
  return {value:rows.reduce((s,x)=>s+x.entry.value,0)/rows.length,n:rows.length,rows};
}
function ratingDelta(player,opts={}){
  const rows=ratingSeries(player,opts);if(rows.length<2)return null;const a=rows.at(-2),b=rows.at(-1);
  return {previous:a.entry.value,current:b.entry.value,delta:b.entry.value-a.entry.value,previousMatch:a.match,currentMatch:b.match,n:rows.length};
}
function audit(){
  const out={ratings:{confirmed:0,reconstructed:0},minutes:{confirmed:0,reconstructed:0}};
  for(const match of MATCHES)for(const kind of ['ratings','minutes'])for(const row of Object.values(DATA[match.id]?.[kind]||{}))out[kind][row.status]=(out[kind][row.status]||0)+1;
  return out;
}
function statusLabel(status){return status==='confirmed'?'Confirmado':status==='reconstructed'?'Reconstruido':'Pendiente'}
window.RMSeasonData=Object.freeze({version:1,matches:MATCHES,canonical,ratingEntry,minuteEntry,rating,minutes,ratingSeries,recentRating,ratingDelta,audit,statusLabel});
document.dispatchEvent(new CustomEvent('rm-season-data-ready',{detail:{version:1}}));
})();