(()=>{
const MATCHES=Object.freeze([
  {id:'malaga',label:'Málaga',short:'MÁL',comp:'LaLiga'},
  {id:'real-sociedad',label:'Real Sociedad',short:'RSO',comp:'LaLiga'},
  {id:'espanyol',label:'Espanyol',short:'ESP',comp:'LaLiga'},
  {id:'betis',label:'Betis',short:'BET',comp:'LaLiga'},
  {id:'inter',label:'Inter',short:'INT',comp:'Champions'}
]);
const ALIASES=Object.freeze({
  'Vinícius Jr.':'Vini Jr.','Vinícius Júnior':'Vini Jr.','Vini':'Vini Jr.','Trent':'Trent Alexander-Arnold','Güler':'Arda Güler',
  'Brahim':'Brahim Díaz','Carreras':'Álvaro Carreras','Alvaro Carreras':'Álvaro Carreras','Diomandé':'Diomande','Yan Diomande':'Diomande',
  'Espí':'Carlos Espí','Bernardo':'Bernardo Silva','Antonio Rüdiger':'Rüdiger','Aurélien Tchouaméni':'Tchouaméni'
});
const rec=(value,source,status='confirmed',note='')=>Object.freeze({value,source,status,note});
const fm=value=>rec(value,'FotMob · ficha de jugador','confirmed','Verificado en la ficha pública de FotMob el 11-09-2026.');
const reconstructed=(value,note)=>rec(value,'Proyecto RM 26/27','reconstructed',note||'Pendiente de comprobación contra una fuente externa.');
const DATA={
  malaga:{ratings:{
    'Courtois':fm(7.0),'Rüdiger':fm(7.3),'Huijsen':fm(7.5),'Cucurella':fm(7.7),
    'Valverde':fm(7.0),'Bernardo Silva':fm(5.9),'Camavinga':fm(7.8),'Bellingham':fm(8.8),
    'Brahim Díaz':fm(7.0),'Mbappé':fm(8.7),'Vini Jr.':fm(8.3),'Trent Alexander-Arnold':fm(8.5),'Diomande':fm(6.6)
  },minutes:{
    'Courtois':fm(90),'Lunin':fm(0),'Dumfries':fm(0),'Konaté':fm(0),'Rüdiger':fm(90),'Huijsen':fm(90),
    'Cucurella':fm(90),'Álvaro Carreras':fm(0),'Valverde':fm(77),'Bernardo Silva':fm(13),'Camavinga':fm(90),
    'Bellingham':fm(87),'Arda Güler':fm(3),'Brahim Díaz':fm(65),'Mbappé':fm(90),'Vini Jr.':fm(90),
    'Trent Alexander-Arnold':fm(90),'Diomande':fm(25),'Carlos Espí':fm(0)
  }},
  'real-sociedad':{ratings:{
    'Courtois':fm(6.9),'Dumfries':fm(7.0),'Konaté':fm(6.9),'Huijsen':fm(7.8),'Cucurella':fm(6.8),
    'Álvaro Carreras':fm(6.6),'Valverde':fm(8.1),'Bernardo Silva':fm(7.8),'Camavinga':fm(6.3),
    'Bellingham':fm(9.0),'Arda Güler':fm(8.2),'Brahim Díaz':fm(6.6),'Mbappé':fm(9.8),'Vini Jr.':fm(8.6)
  },minutes:{
    'Courtois':fm(90),'Lunin':fm(0),'Dumfries':fm(90),'Konaté':fm(90),'Rüdiger':fm(0),'Huijsen':fm(90),
    'Cucurella':fm(45),'Álvaro Carreras':fm(45),'Valverde':fm(90),'Bernardo Silva':fm(86),'Camavinga':fm(12),
    'Bellingham':fm(78),'Arda Güler':fm(78),'Brahim Díaz':fm(12),'Mbappé':fm(90),'Vini Jr.':fm(84),
    'Trent Alexander-Arnold':fm(0),'Diomande':fm(6),'Carlos Espí':fm(4)
  }},
  espanyol:{ratings:{
    'Courtois':fm(6.4),'Dumfries':fm(7.3),'Konaté':fm(7.7),'Huijsen':fm(7.1),'Cucurella':fm(6.7),
    'Álvaro Carreras':fm(7.4),'Valverde':fm(8.1),'Bernardo Silva':fm(7.0),'Camavinga':fm(6.4),
    'Bellingham':fm(8.3),'Arda Güler':fm(8.6),'Mbappé':fm(7.4),'Vini Jr.':fm(7.2),
    'Trent Alexander-Arnold':fm(6.3),'Diomande':fm(6.4),'Carlos Espí':fm(7.5)
  },minutes:{
    'Courtois':fm(90),'Lunin':fm(0),'Dumfries':fm(80),'Konaté':fm(90),'Rüdiger':fm(0),'Huijsen':fm(90),
    'Cucurella':fm(26),'Álvaro Carreras':fm(64),'Valverde':fm(90),'Bernardo Silva':fm(80),'Camavinga':fm(10),
    'Bellingham':fm(80),'Arda Güler':fm(64),'Brahim Díaz':fm(0),'Mbappé':fm(90),'Vini Jr.':fm(90),
    'Trent Alexander-Arnold':fm(10),'Diomande':fm(26),'Carlos Espí':fm(10)
  }},
  betis:{ratings:{
    'Courtois':fm(6.7),'Dumfries':fm(6.6),'Konaté':fm(6.6),'Huijsen':fm(7.5),'Cucurella':fm(6.8),
    'Valverde':fm(6.6),'Bernardo Silva':fm(6.4),'Camavinga':fm(6.1),'Bellingham':fm(7.4),
    'Arda Güler':fm(7.5),'Mbappé':fm(6.7),'Vini Jr.':fm(7.8),'Trent Alexander-Arnold':fm(6.6),'Diomande':fm(6.2)
  },minutes:{
    'Courtois':fm(90),'Lunin':fm(0),'Dumfries':fm(64),'Konaté':fm(90),'Rüdiger':fm(0),'Huijsen':fm(90),
    'Cucurella':fm(88),'Álvaro Carreras':fm(2),'Valverde':fm(82),'Bernardo Silva':fm(26),'Camavinga':fm(64),
    'Bellingham':fm(90),'Arda Güler':fm(64),'Brahim Díaz':fm(0),'Mbappé':fm(90),'Vini Jr.':fm(90),
    'Trent Alexander-Arnold':fm(26),'Diomande':fm(26),'Carlos Espí':fm(8)
  }},
  inter:{ratings:{
    'Courtois':fm(7.5),'Dumfries':fm(6.7),'Konaté':fm(6.9),'Huijsen':fm(7.4),'Cucurella':fm(7.2),
    'Valverde':fm(8.1),'Bellingham':fm(7.6),'Brahim Díaz':fm(8.3),'Mbappé':fm(8.4),'Vini Jr.':fm(7.3),
    'Trent Alexander-Arnold':fm(7.0),'Diomande':fm(5.9),'Tchouaméni':fm(6.0)
  },minutes:{
    'Courtois':fm(90),'Lunin':fm(0),'Dumfries':fm(90),'Konaté':fm(90),'Rüdiger':fm(0),'Huijsen':fm(90),
    'Cucurella':fm(90),'Álvaro Carreras':fm(3),'Valverde':fm(90),'Bellingham':fm(90),'Brahim Díaz':fm(79),
    'Mbappé':fm(89),'Vini Jr.':fm(87),'Trent Alexander-Arnold':fm(79),'Diomande':fm(11),'Tchouaméni':fm(11),'Carlos Espí':fm(1),
    'Arda Güler':rec(0,'UEFA · sanción','confirmed','UEFA lo registró como sancionado para Real Madrid-Inter.'),
    'Camavinga':rec(0,'UEFA · sanción','confirmed','UEFA lo registró como sancionado para Real Madrid-Inter.'),
    'Bernardo Silva':rec(0,'UEFA · sanción','confirmed','UEFA lo registró como sancionado para Real Madrid-Inter.')
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
window.RMSeasonData=Object.freeze({version:3,matches:MATCHES,canonical,ratingEntry,minuteEntry,rating,minutes,ratingSeries,recentRating,ratingDelta,audit,statusLabel});
document.dispatchEvent(new CustomEvent('rm-season-data-ready',{detail:{version:3}}));
})();
