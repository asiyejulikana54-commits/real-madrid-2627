(()=>{
const MATCHES=Object.freeze([
  {id:'malaga',label:'Málaga',short:'MÁL',comp:'LaLiga'},
  {id:'real-sociedad',label:'Real Sociedad',short:'RSO',comp:'LaLiga'},
  {id:'espanyol',label:'Espanyol',short:'ESP',comp:'LaLiga'},
  {id:'betis',label:'Betis',short:'BET',comp:'LaLiga'},
  {id:'inter',label:'Inter',short:'INT',comp:'Champions'}
]);
const SOURCE_ORDER=Object.freeze(['sofascore','fotmob','statmuse']);
const SOURCE_LABELS=Object.freeze({sofascore:'Sofascore',fotmob:'FotMob',statmuse:'StatMuse'});
const ALIASES=Object.freeze({
  'Vinícius Jr.':'Vini Jr.','Vinícius Júnior':'Vini Jr.','Vinicius':'Vini Jr.','Vinícius':'Vini Jr.','Vini':'Vini Jr.',
  'Trent':'Trent Alexander-Arnold','T. Alexander-Arnold':'Trent Alexander-Arnold',
  'Güler':'Arda Güler','Arda':'Arda Güler','Brahim':'Brahim Díaz',
  'Carreras':'Álvaro Carreras','Alvaro Carreras':'Álvaro Carreras',
  'Diomandé':'Diomande','Yan Diomande':'Diomande','Espí':'Carlos Espí',
  'Bernardo':'Bernardo Silva','Antonio Rüdiger':'Rüdiger','Aurélien Tchouaméni':'Tchouaméni'
});
const rec=(value,source,status='confirmed',note='')=>Object.freeze({value,source,status,note});
const fm=value=>rec(value,'FotMob','confirmed','Serie histórica y minutos verificados el 11-09-2026.');
const ss=value=>rec(value,'Sofascore','confirmed','Ficha pública o captura directa del proyecto verificada el 11-09-2026.');
const sm=value=>rec(value,'StatMuse FC','confirmed','Valoración de partido verificada el 11-09-2026.');
const nr=source=>Object.freeze({value:null,source,status:'unrated',note:'La fuente fue comprobada y no publicó valoración para esta aparición.'});
function parse(text,factory){
  const out={}; if(!text)return out;
  for(const pair of text.split('|')){const i=pair.lastIndexOf('=');out[pair.slice(0,i)]=factory(Number(pair.slice(i+1)))}
  return out;
}
const RATINGS={
  malaga:parse('Courtois=7|Rüdiger=7.3|Huijsen=7.5|Cucurella=7.7|Valverde=7|Bernardo Silva=5.9|Camavinga=7.8|Bellingham=8.8|Brahim Díaz=7|Mbappé=8.7|Vini Jr.=8.3|Trent Alexander-Arnold=8.5|Diomande=6.6',fm),
  'real-sociedad':parse('Courtois=6.9|Dumfries=7|Konaté=6.9|Huijsen=7.8|Cucurella=6.8|Álvaro Carreras=6.6|Valverde=8.1|Bernardo Silva=7.8|Camavinga=6.3|Bellingham=9|Arda Güler=8.2|Brahim Díaz=6.6|Mbappé=9.8|Vini Jr.=8.6',fm),
  espanyol:parse('Courtois=6.4|Dumfries=7.3|Konaté=7.7|Huijsen=7.1|Cucurella=6.7|Álvaro Carreras=7.4|Valverde=8.1|Bernardo Silva=7|Camavinga=6.4|Bellingham=8.3|Arda Güler=8.6|Mbappé=7.4|Vini Jr.=7.2|Trent Alexander-Arnold=6.3|Diomande=6.4|Carlos Espí=7.5',fm),
  betis:parse('Courtois=6.7|Dumfries=6.6|Konaté=6.6|Huijsen=7.5|Cucurella=6.8|Valverde=6.6|Bernardo Silva=6.4|Camavinga=6.1|Bellingham=7.4|Arda Güler=7.5|Mbappé=6.7|Vini Jr.=7.8|Trent Alexander-Arnold=6.6|Diomande=6.2',fm),
  inter:parse('Courtois=7.5|Dumfries=6.7|Konaté=6.9|Huijsen=7.4|Cucurella=7.2|Valverde=8.1|Bellingham=7.6|Brahim Díaz=8.3|Mbappé=8.4|Vini Jr.=7.3|Trent Alexander-Arnold=7|Diomande=5.9|Tchouaméni=6',fm)
};
const MINUTES={
  malaga:parse('Courtois=90|Lunin=0|Dumfries=0|Konaté=0|Rüdiger=90|Huijsen=90|Cucurella=90|Álvaro Carreras=0|Valverde=77|Bernardo Silva=13|Camavinga=90|Bellingham=87|Arda Güler=3|Brahim Díaz=65|Mbappé=90|Vini Jr.=90|Trent Alexander-Arnold=90|Diomande=25|Carlos Espí=0',fm),
  'real-sociedad':parse('Courtois=90|Lunin=0|Dumfries=90|Konaté=90|Rüdiger=0|Huijsen=90|Cucurella=45|Álvaro Carreras=45|Valverde=90|Bernardo Silva=86|Camavinga=12|Bellingham=78|Arda Güler=78|Brahim Díaz=12|Mbappé=90|Vini Jr.=84|Trent Alexander-Arnold=0|Diomande=6|Carlos Espí=4',fm),
  espanyol:parse('Courtois=90|Lunin=0|Dumfries=80|Konaté=90|Rüdiger=0|Huijsen=90|Cucurella=26|Álvaro Carreras=64|Valverde=90|Bernardo Silva=80|Camavinga=10|Bellingham=80|Arda Güler=64|Brahim Díaz=0|Mbappé=90|Vini Jr.=90|Trent Alexander-Arnold=10|Diomande=26|Carlos Espí=10',fm),
  betis:parse('Courtois=90|Lunin=0|Dumfries=64|Konaté=90|Rüdiger=0|Huijsen=90|Cucurella=88|Álvaro Carreras=2|Valverde=82|Bernardo Silva=26|Camavinga=64|Bellingham=90|Arda Güler=64|Brahim Díaz=0|Mbappé=90|Vini Jr.=90|Trent Alexander-Arnold=26|Diomande=26|Carlos Espí=8',fm),
  inter:parse('Courtois=90|Lunin=0|Dumfries=90|Konaté=90|Rüdiger=0|Huijsen=90|Cucurella=90|Álvaro Carreras=3|Valverde=90|Bellingham=90|Brahim Díaz=79|Mbappé=89|Vini Jr.=87|Trent Alexander-Arnold=79|Diomande=11|Tchouaméni=11|Carlos Espí=1|Arda Güler=0|Camavinga=0|Bernardo Silva=0',fm)
};
MINUTES.inter['Arda Güler']=rec(0,'UEFA · sanción','confirmed','Sancionado para Real Madrid-Inter.');
MINUTES.inter['Camavinga']=rec(0,'UEFA · sanción','confirmed','Sancionado para Real Madrid-Inter.');
MINUTES.inter['Bernardo Silva']=rec(0,'UEFA · sanción','confirmed','Sancionado para Real Madrid-Inter.');
const SOFASCORE={
  malaga:parse('Courtois=6.8|Rüdiger=7.5|Huijsen=7.1|Cucurella=7.3|Valverde=7.1|Bernardo Silva=6.5|Camavinga=6.9|Bellingham=8.5|Arda Güler=7.6|Brahim Díaz=6.6|Mbappé=9.1|Vini Jr.=7.4|Trent Alexander-Arnold=7.9|Diomande=7',ss),
  'real-sociedad':parse('Courtois=6.6|Dumfries=6.1|Konaté=7.3|Huijsen=7.3|Cucurella=6.9|Álvaro Carreras=6.2|Valverde=7.7|Bernardo Silva=7|Camavinga=6.8|Bellingham=9|Arda Güler=7.4|Brahim Díaz=6.6|Mbappé=10|Vini Jr.=7.8|Diomande=6.6|Carlos Espí=6.4',ss),
  espanyol:parse('Courtois=6.5|Dumfries=6.6|Konaté=7.2|Huijsen=7|Cucurella=6.9|Álvaro Carreras=6.8|Valverde=7.3|Bernardo Silva=6.2|Camavinga=6.6|Bellingham=8.1|Arda Güler=8|Mbappé=6.4|Vini Jr.=7|Trent Alexander-Arnold=7|Diomande=6.5|Carlos Espí=7.8',ss),
  betis:parse('Courtois=6.7|Dumfries=6.6|Konaté=6.5|Huijsen=7.7|Cucurella=6.8|Álvaro Carreras=6.9|Valverde=6.7|Bernardo Silva=6.6|Camavinga=6.8|Bellingham=7.1|Arda Güler=7.4|Mbappé=6|Vini Jr.=7|Trent Alexander-Arnold=6.5|Diomande=6.5|Carlos Espí=6.4',ss),
  inter:parse('Courtois=6.8|Dumfries=6.4|Konaté=7|Huijsen=6.9|Cucurella=7|Valverde=8.4|Bellingham=6.9|Brahim Díaz=8.2|Mbappé=7.7|Vini Jr.=7.2|Trent Alexander-Arnold=6.7|Diomande=6.5|Tchouaméni=6.6',ss)
};
const STATMUSE={
  malaga:parse('Courtois=6.9|Rüdiger=7.8|Huijsen=6.7|Cucurella=7.6|Valverde=7.6|Bernardo Silva=6.5|Camavinga=7.5|Bellingham=9.3|Brahim Díaz=7.2|Arda Güler=8.9|Mbappé=9.1|Vini Jr.=8.9|Trent Alexander-Arnold=8.6|Diomande=6.8',sm),
  'real-sociedad':parse('Courtois=6.7|Dumfries=7.1|Konaté=7.5|Huijsen=7.5|Cucurella=7.2|Álvaro Carreras=7|Valverde=8.2|Bernardo Silva=7.2|Camavinga=6.8|Bellingham=9.1|Arda Güler=8.6|Brahim Díaz=7|Mbappé=9.9|Vini Jr.=9|Diomande=6.7|Carlos Espí=6.6',sm),
  espanyol:parse('Courtois=6.6|Dumfries=6.6|Konaté=7.4|Huijsen=7.1|Cucurella=7.2|Álvaro Carreras=7.1|Valverde=8.4|Bernardo Silva=6.8|Camavinga=6.8|Bellingham=9|Arda Güler=9|Mbappé=5.7|Vini Jr.=6|Trent Alexander-Arnold=6.9|Diomande=6.7|Carlos Espí=8.7',sm),
  betis:parse('Courtois=7|Dumfries=7|Konaté=7.2|Huijsen=7.8|Cucurella=7.7|Álvaro Carreras=7|Valverde=6.6|Bernardo Silva=6.8|Camavinga=7.1|Bellingham=7.3|Arda Güler=9.2|Mbappé=7|Vini Jr.=8|Trent Alexander-Arnold=7|Diomande=6.6|Carlos Espí=6.9',sm),
  inter:parse('Courtois=7.4|Dumfries=7|Konaté=7|Huijsen=7|Cucurella=7.6|Valverde=8.5|Bellingham=7.2|Brahim Díaz=9.3|Mbappé=9|Vini Jr.=6|Trent Alexander-Arnold=6.7|Diomande=6.6|Tchouaméni=6.6',sm)
};
const UNRATED=Object.freeze({
  malaga:Object.freeze({'Arda Güler':Object.freeze({fotmob:nr('FotMob')})}),
  'real-sociedad':Object.freeze({'Diomande':Object.freeze({fotmob:nr('FotMob')}),'Carlos Espí':Object.freeze({fotmob:nr('FotMob')})}),
  betis:Object.freeze({'Álvaro Carreras':Object.freeze({fotmob:nr('FotMob')}),'Carlos Espí':Object.freeze({fotmob:nr('FotMob')})}),
  inter:Object.freeze({
    'Álvaro Carreras':Object.freeze({sofascore:nr('Sofascore'),fotmob:nr('FotMob'),statmuse:nr('StatMuse FC')}),
    'Carlos Espí':Object.freeze({sofascore:nr('Sofascore'),fotmob:nr('FotMob'),statmuse:nr('StatMuse FC')})
  })
});
function canonical(name){return ALIASES[name]||name}
function entry(bucket,matchId,player){return bucket[matchId]?.[canonical(player)]||null}
function ratingEntry(matchId,player){return entry(RATINGS,matchId,player)}
function minuteEntry(matchId,player){return entry(MINUTES,matchId,player)}
function rating(matchId,player){return ratingEntry(matchId,player)?.value??null}
function minutes(matchId,player){return minuteEntry(matchId,player)?.value??null}
function sourceRatings(matchId,player){
  const name=canonical(player),out={},fmRow=ratingEntry(matchId,name),ssRow=entry(SOFASCORE,matchId,name),smRow=entry(STATMUSE,matchId,name);
  if(ssRow)out.sofascore=ssRow;if(fmRow)out.fotmob=fmRow;if(smRow)out.statmuse=smRow;return out;
}
function sourceUnrated(matchId,player){return UNRATED[matchId]?.[canonical(player)]||{}}
function combinedRatingEntry(matchId,player,{minSources=1,requireAll=false}={}){
  const bySource=sourceRatings(matchId,player),unrated=sourceUnrated(matchId,player),sources=SOURCE_ORDER.filter(s=>bySource[s]),unratedSources=SOURCE_ORDER.filter(s=>unrated[s]);
  const needed=requireAll?3:Math.max(1,Math.min(3,minSources)); if(sources.length<needed)return null;
  const value=sources.reduce((sum,s)=>sum+bySource[s].value,0)/sources.length,closed=sources.length+unratedSources.length===3;
  return Object.freeze({value,sourceCount:sources.length,sources:Object.freeze([...sources]),labels:Object.freeze(sources.map(s=>SOURCE_LABELS[s])),unratedSources:Object.freeze([...unratedSources]),closed,complete:sources.length===3,status:sources.length===3?'complete':closed?'closed-partial':'partial'});
}
function officialRatingEntry(matchId,player){
  const combined=combinedRatingEntry(matchId,player,{minSources:1});
  if(combined?.closed&&combined.sourceCount>0)return combined;
  const unrated=sourceUnrated(matchId,player),unratedSources=SOURCE_ORDER.filter(s=>unrated[s]);
  if(unratedSources.length===3)return Object.freeze({value:null,sourceCount:0,sources:Object.freeze([]),labels:Object.freeze([]),unratedSources:Object.freeze([...unratedSources]),closed:true,complete:false,status:'unrated'});
  return null;
}
function ratingSeries(player,{through=MATCHES.length-1}={}){
  return MATCHES.slice(0,through+1).map(match=>({match,entry:officialRatingEntry(match.id,player)})).filter(row=>row.entry&&row.entry.value!==null);
}
function recentRating(player,n=3,opts={}){
  const rows=ratingSeries(player,opts).slice(-n);
  return rows.length?{value:rows.reduce((sum,row)=>sum+row.entry.value,0)/rows.length,n:rows.length,rows}:null;
}
function ratingDelta(player,opts={}){
  const rows=ratingSeries(player,opts);if(rows.length<2)return null;
  const a=rows.at(-2),b=rows.at(-1);
  return {previous:a.entry.value,current:b.entry.value,delta:b.entry.value-a.entry.value,previousMatch:a.match,currentMatch:b.match,n:rows.length};
}
function aggregatePlayer(player){
  const name=canonical(player),rows=[];let totalMinutes=0,ratedMinutes=0,unratedMinutes=0,totalPoints=0,complete3=0,twoPlusSC=0,allSC=0;
  for(const match of MATCHES){
    const minute=minuteEntry(match.id,name);if(!minute||minute.value<=0)continue;
    totalMinutes+=minute.value;const official=officialRatingEntry(match.id,name);
    if(official?.value!==null){
      const points=official.value*minute.value/90;ratedMinutes+=minute.value;totalPoints+=points;
      if(official.sourceCount===3)complete3++;else if(official.sourceCount===2&&official.unratedSources.length===1)twoPlusSC++;
      rows.push(Object.freeze({match,minutes:minute.value,combined:official,points,status:official.sourceCount===3?'3/3':'2 + SC'}));
    }else if(official?.status==='unrated'){
      unratedMinutes+=minute.value;allSC++;
      rows.push(Object.freeze({match,minutes:minute.value,combined:official,points:0,status:'SC'}));
    }
  }
  return Object.freeze({
    player:name,matches:Object.freeze(rows),ratedMatches:complete3+twoPlusSC,completeMatches:complete3,partialMatches:twoPlusSC,allSC,
    totalMinutes,ratedMinutes,unratedMinutes,totalPoints,
    rating:ratedMinutes?totalPoints*90/ratedMinutes:null,
    minPerPoint:totalPoints?totalMinutes/totalPoints:null
  });
}
function aggregateRanking(playerNames){
  return playerNames.map(aggregatePlayer).filter(r=>r.ratedMatches>0).sort((a,b)=>(a.minPerPoint??Infinity)-(b.minPerPoint??Infinity)||b.totalMinutes-a.totalMinutes||a.player.localeCompare(b.player,'es'));
}
function sourceAudit(){
  const out={sources:{sofascore:0,fotmob:0,statmuse:0},unratedBySource:{sofascore:0,fotmob:0,statmuse:0},ratedAppearances:0,closedAppearances:0,complete3:0,closedPartial:0,pendingAppearances:0,partial2:0,partial1:0,noRating:0};
  for(const match of MATCHES){
    const names=new Set([...Object.keys(MINUTES[match.id]||{}),...Object.keys(RATINGS[match.id]||{}),...Object.keys(SOFASCORE[match.id]||{}),...Object.keys(STATMUSE[match.id]||{}),...Object.keys(UNRATED[match.id]||{})]);
    for(const name of names){
      const minute=minuteEntry(match.id,name);if(!minute||minute.value<=0)continue;out.ratedAppearances++;
      const by=sourceRatings(match.id,name),unrated=sourceUnrated(match.id,name),count=SOURCE_ORDER.filter(s=>by[s]).length,unratedCount=SOURCE_ORDER.filter(s=>unrated[s]).length;
      for(const s of SOURCE_ORDER){if(by[s])out.sources[s]++;if(unrated[s])out.unratedBySource[s]++}
      if(count===3)out.complete3++;else if(count===2)out.partial2++;else if(count===1)out.partial1++;else out.noRating++;
      if(count+unratedCount===3){out.closedAppearances++;if(count<3)out.closedPartial++}else out.pendingAppearances++;
    }
  }
  return Object.freeze(out);
}
function audit(){
  const out={ratings:{confirmed:0,reconstructed:0},minutes:{confirmed:0,reconstructed:0}};
  for(const match of MATCHES){
    for(const row of Object.values(RATINGS[match.id]||{}))out.ratings[row.status]=(out.ratings[row.status]||0)+1;
    for(const row of Object.values(MINUTES[match.id]||{}))out.minutes[row.status]=(out.minutes[row.status]||0)+1;
  }
  return out;
}
function statusLabel(status){return status==='confirmed'?'Confirmado':status==='reconstructed'?'Reconstruido':status==='unrated'?'SC · Sin calificación':'Pendiente'}
window.RMSeasonData=Object.freeze({
  version:6,formSource:'official-combined',
  matches:MATCHES,sources:SOURCE_ORDER,sourceLabels:SOURCE_LABELS,
  canonical,ratingEntry,minuteEntry,rating,minutes,sourceRatings,sourceUnrated,combinedRatingEntry,officialRatingEntry,ratingSeries,recentRating,ratingDelta,
  aggregatePlayer,aggregateRanking,sourceAudit,audit,statusLabel,
  methodology:Object.freeze({
    target:'3/3 = media aritmética de SofaScore + FotMob + StatMuse; 2 notas + 1 SC = media de las dos notas publicadas; 3 SC = sin nota ni aporte.',
    contribution:'Aporte de partido = nota oficial × minutos / 90.',
    aggregate:'Media acumulada = suma de aportes × 90 / minutos con valoración.',
    efficiency:'Min/punto = todos los minutos jugados / suma de aportes.',
    cutoff:'Sin corte mínimo de minutos.',
    unrated:'SC significa que la fuente fue comprobada y no publicó valoración; no equivale a cero ni a dato pendiente.'
  })
});
document.dispatchEvent(new CustomEvent('rm-season-data-ready',{detail:{version:6}}));
})();
