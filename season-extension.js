(()=>{
const base=window.RMSeasonData;if(!base)return;
const SOURCE_ORDER=base.sources||['sofascore','fotmob','statmuse'];
const SOURCE_LABELS=base.sourceLabels||{sofascore:'Sofascore',fotmob:'FotMob',statmuse:'StatMuse'};
const entries=Array.isArray(window.RMSeasonMatchEntries)?window.RMSeasonMatchEntries:[];
const extraMatches=[],minuteMap={},ratingMaps={sofascore:{},fotmob:{},statmuse:{}},unratedMap={};
const errors=[],warnings=[],entryAudit=[];
const issue=(level,message,matchId=null,player=null)=>level.push(Object.freeze({message,matchId,player}));
const canonical=name=>base.canonical?base.canonical(name):name;
const ratingRec=(value,source)=>Object.freeze({value,source,status:'confirmed',note:'Entrada única de partido · season-input.js'});
const scRec=source=>Object.freeze({value:null,source,status:'unrated',note:'Fuente comprobada sin valoración publicada.'});
function validateAndStage(raw,index){
  if(!raw||typeof raw!=='object'){issue(errors,`Entrada #${index+1} inválida.`);return}
  const id=String(raw.id||'').trim(),label=String(raw.label||'').trim(),short=String(raw.short||'').trim(),comp=String(raw.comp||'').trim();
  if(!id||!label||!short||!comp){issue(errors,`Entrada #${index+1}: faltan id, label, short o comp.`,id||null);return}
  if(base.matches.some(m=>m.id===id)||extraMatches.some(m=>m.id===id)){issue(errors,`${id}: id de partido duplicado.`,id);return}
  if(!raw.players||typeof raw.players!=='object'||Array.isArray(raw.players)){issue(errors,`${id}: falta el bloque players.`,id);return}
  const final=raw.final!==false,duration=Number.isFinite(Number(raw.duration))?Number(raw.duration):90,expectedMinutes=duration*11;
  let totalMinutes=0,played=0;const seen=new Set(),localMinutes={},localRatings={sofascore:{},fotmob:{},statmuse:{}},localUnrated={};
  for(const [inputName,rowRaw] of Object.entries(raw.players)){
    const name=canonical(inputName),row=rowRaw||{};
    if(seen.has(name)){issue(errors,`${id}: ${name} está duplicado tras normalizar alias.`,id,name);continue}seen.add(name);
    const minutes=Number(row.minutes);
    if(!Number.isFinite(minutes)||minutes<0||minutes>130){issue(errors,`${id}: minutos inválidos para ${name}.`,id,name);continue}
    localMinutes[name]=Object.freeze({value:minutes,source:row.minutesSource||'Parte oficial / proyecto',status:'confirmed',note:row.note||''});totalMinutes+=minutes;if(minutes>0)played++;
    const missing=[];
    for(const source of SOURCE_ORDER){
      const value=row[source];
      if(typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=10)localRatings[source][name]=ratingRec(value,SOURCE_LABELS[source]);
      else if(typeof value==='string'&&value.trim().toUpperCase()==='SC'){(localUnrated[name]??={})[source]=scRec(SOURCE_LABELS[source])}
      else if(value!==undefined&&value!==null&&value!=='')issue(errors,`${id}: ${source} inválido para ${name}; usa 0–10 o "SC".`,id,name);
      else if(minutes>0)missing.push(source);
    }
    if(minutes===0&&SOURCE_ORDER.some(s=>row[s]!==undefined&&row[s]!==null&&row[s]!==''))issue(warnings,`${id}: ${name} tiene 0 minutos y además una valoración/SC.`,id,name);
    if(minutes>0&&missing.length)issue(final?errors:warnings,`${id}: faltan ${missing.join(', ')} para ${name}.`,id,name);
  }
  if(totalMinutes!==expectedMinutes)issue(final?errors:warnings,`${id}: suma de minutos ${totalMinutes}; esperaba ${expectedMinutes} (${duration}' × 11).`,id);
  if(!played)issue(warnings,`${id}: no hay jugadores con minutos > 0.`,id);
  const hasError=errors.some(e=>e.matchId===id);
  entryAudit.push(Object.freeze({id,label,final,totalMinutes,expectedMinutes,players:Object.keys(raw.players).length,played,applied:final&&!hasError}));
  if(!final||hasError)return;
  extraMatches.push(Object.freeze({id,label,short,comp,date:raw.date||null,duration}));minuteMap[id]=localMinutes;
  for(const source of SOURCE_ORDER)ratingMaps[source][id]=localRatings[source];
  unratedMap[id]=Object.freeze(Object.fromEntries(Object.entries(localUnrated).map(([name,s])=>[name,Object.freeze(s)])));
}
entries.forEach(validateAndStage);
const MATCHES=Object.freeze([...base.matches,...extraMatches]);
function isExtra(matchId){return Object.prototype.hasOwnProperty.call(minuteMap,matchId)}
function minuteEntry(matchId,player){return isExtra(matchId)?minuteMap[matchId]?.[canonical(player)]||null:base.minuteEntry(matchId,player)}
function ratingEntry(matchId,player){return isExtra(matchId)?ratingMaps.fotmob[matchId]?.[canonical(player)]||null:base.ratingEntry(matchId,player)}
function minutes(matchId,player){return minuteEntry(matchId,player)?.value??null}
function rating(matchId,player){return ratingEntry(matchId,player)?.value??null}
function sourceRatings(matchId,player){
  if(!isExtra(matchId))return base.sourceRatings(matchId,player);const name=canonical(player),out={};
  for(const source of SOURCE_ORDER){const row=ratingMaps[source][matchId]?.[name];if(row)out[source]=row}return out;
}
function sourceUnrated(matchId,player){return isExtra(matchId)?unratedMap[matchId]?.[canonical(player)]||{}:base.sourceUnrated(matchId,player)}
function combinedRatingEntry(matchId,player,{minSources=1,requireAll=false}={}){
  if(!isExtra(matchId))return base.combinedRatingEntry(matchId,player,{minSources,requireAll});
  const by=sourceRatings(matchId,player),unrated=sourceUnrated(matchId,player),sources=SOURCE_ORDER.filter(s=>by[s]),unratedSources=SOURCE_ORDER.filter(s=>unrated[s]),needed=requireAll?3:Math.max(1,Math.min(3,minSources));
  if(sources.length<needed)return null;const value=sources.reduce((sum,s)=>sum+by[s].value,0)/sources.length,closed=sources.length+unratedSources.length===3;
  return Object.freeze({value,sourceCount:sources.length,sources:Object.freeze([...sources]),labels:Object.freeze(sources.map(s=>SOURCE_LABELS[s])),unratedSources:Object.freeze([...unratedSources]),closed,complete:sources.length===3,status:sources.length===3?'complete':closed?'closed-partial':'partial'});
}
function officialRatingEntry(matchId,player){
  const combined=combinedRatingEntry(matchId,player,{minSources:1});if(combined?.closed&&combined.sourceCount>0)return combined;
  const unrated=sourceUnrated(matchId,player),unratedSources=SOURCE_ORDER.filter(s=>unrated[s]);
  if(unratedSources.length===3)return Object.freeze({value:null,sourceCount:0,sources:Object.freeze([]),labels:Object.freeze([]),unratedSources:Object.freeze([...unratedSources]),closed:true,complete:false,status:'unrated'});return null;
}
function ratingSeries(player,{through=MATCHES.length-1}={}){return MATCHES.slice(0,through+1).map(match=>({match,entry:officialRatingEntry(match.id,player)})).filter(row=>row.entry&&row.entry.value!==null)}
function recentRating(player,n=3,opts={}){const rows=ratingSeries(player,opts).slice(-n);return rows.length?{value:rows.reduce((s,r)=>s+r.entry.value,0)/rows.length,n:rows.length,rows}:null}
function ratingDelta(player,opts={}){const rows=ratingSeries(player,opts);if(rows.length<2)return null;const a=rows.at(-2),b=rows.at(-1);return {previous:a.entry.value,current:b.entry.value,delta:b.entry.value-a.entry.value,previousMatch:a.match,currentMatch:b.match,n:rows.length}}
function aggregatePlayer(player){
  const name=canonical(player),rows=[];let totalMinutes=0,ratedMinutes=0,unratedMinutes=0,totalPoints=0,complete3=0,twoPlusSC=0,allSC=0;
  for(const match of MATCHES){const m=minuteEntry(match.id,name);if(!m||m.value<=0)continue;totalMinutes+=m.value;const o=officialRatingEntry(match.id,name);if(o?.value!==null){const points=o.value*m.value/90;ratedMinutes+=m.value;totalPoints+=points;if(o.sourceCount===3)complete3++;else if(o.sourceCount===2&&o.unratedSources.length===1)twoPlusSC++;rows.push(Object.freeze({match,minutes:m.value,combined:o,points,status:o.sourceCount===3?'3/3':'2 + SC'}))}else if(o?.status==='unrated'){unratedMinutes+=m.value;allSC++;rows.push(Object.freeze({match,minutes:m.value,combined:o,points:0,status:'SC'}))}}
  return Object.freeze({player:name,matches:Object.freeze(rows),ratedMatches:complete3+twoPlusSC,completeMatches:complete3,partialMatches:twoPlusSC,allSC,totalMinutes,ratedMinutes,unratedMinutes,totalPoints,rating:ratedMinutes?totalPoints*90/ratedMinutes:null,minPerPoint:totalPoints?totalMinutes/totalPoints:null});
}
function aggregateRanking(names){return names.map(aggregatePlayer).filter(r=>r.ratedMatches>0).sort((a,b)=>(a.minPerPoint??Infinity)-(b.minPerPoint??Infinity)||b.totalMinutes-a.totalMinutes||a.player.localeCompare(b.player,'es'))}
function sourceAudit(){const out={sources:{sofascore:0,fotmob:0,statmuse:0},unratedBySource:{sofascore:0,fotmob:0,statmuse:0},ratedAppearances:0,closedAppearances:0,complete3:0,closedPartial:0,pendingAppearances:0,partial2:0,partial1:0,noRating:0};for(const match of MATCHES){const names=new Set();if(isExtra(match.id))Object.keys(minuteMap[match.id]||{}).forEach(n=>names.add(n));else{const baseNames=typeof players!=='undefined'?players.map(p=>p.name):[];baseNames.forEach(n=>names.add(n));}for(const name of names){const m=minuteEntry(match.id,name);if(!m||m.value<=0)continue;out.ratedAppearances++;const by=sourceRatings(match.id,name),unrated=sourceUnrated(match.id,name),count=SOURCE_ORDER.filter(s=>by[s]).length,sc=SOURCE_ORDER.filter(s=>unrated[s]).length;for(const s of SOURCE_ORDER){if(by[s])out.sources[s]++;if(unrated[s])out.unratedBySource[s]++}if(count===3)out.complete3++;else if(count===2)out.partial2++;else if(count===1)out.partial1++;else out.noRating++;if(count+sc===3){out.closedAppearances++;if(count<3)out.closedPartial++}else out.pendingAppearances++}}return Object.freeze(out)}
function audit(){const baseAudit=base.audit(),out={ratings:{confirmed:baseAudit.ratings.confirmed||0,reconstructed:baseAudit.ratings.reconstructed||0},minutes:{confirmed:baseAudit.minutes.confirmed||0,reconstructed:baseAudit.minutes.reconstructed||0}};for(const match of extraMatches){out.ratings.confirmed+=Object.keys(ratingMaps.fotmob[match.id]||{}).length;out.minutes.confirmed+=Object.keys(minuteMap[match.id]||{}).length}return out}
const validation=Object.freeze({ok:errors.length===0,errors:Object.freeze(errors),warnings:Object.freeze(warnings),entries:Object.freeze(entryAudit)});
window.RMSeasonData=Object.freeze({...base,version:7,baseVersion:base.version,updateSource:'season-input.js',matches:MATCHES,validation,minuteEntry,ratingEntry,minutes,rating,sourceRatings,sourceUnrated,combinedRatingEntry,officialRatingEntry,ratingSeries,recentRating,ratingDelta,aggregatePlayer,aggregateRanking,sourceAudit,audit,methodology:Object.freeze({...base.methodology,updates:'Cada nuevo partido se introduce una sola vez en season-input.js; todos los acumulados se derivan automáticamente.'})});
function ensureRankingRows(){
  if(typeof players==='undefined'||typeof efficiencyRanking==='undefined')return [];
  const added=[];for(const p of players){const agg=aggregatePlayer(p.name);if(agg.totalMinutes<=0)continue;const exists=efficiencyRanking.some(row=>canonical(row.name)===canonical(p.name)||(p.short&&canonical(row.name)===canonical(p.short)));if(!exists){efficiencyRanking.push({name:p.name,short:p.short,minutes:0,points:0,minPerPoint:Infinity});added.push(p.name)}}return added;
}
function syncMatchArchive(){
  if(typeof matches==='undefined')return [];const existing=new Set(matches.map(m=>String(m.rival).toLowerCase())),added=[];
  for(const match of extraMatches){if(existing.has(match.label.toLowerCase()))continue;matches.push({rival:match.label,comp:match.comp,note:'Partido incorporado mediante la entrada única de temporada. Estadísticas y módulos derivados recalculados automáticamente.',state:'Analizado'});existing.add(match.label.toLowerCase());added.push(match.id)}
  if(added.length&&typeof renderMatches==='function')renderMatches();return added;
}
const rankingPlayersAdded=ensureRankingRows();if(typeof applyRMOfficialRanking==='function')applyRMOfficialRanking();const archiveMatchesAdded=syncMatchArchive();
window.RMSeasonUpdateFlow=Object.freeze({status:validation.ok?'ready':'invalid',baseVersion:base.version,version:7,matchCount:MATCHES.length,extraMatches:Object.freeze(extraMatches.map(m=>m.id)),rankingPlayersAdded:Object.freeze(rankingPlayersAdded),archiveMatchesAdded:Object.freeze(archiveMatchesAdded),validation});
document.dispatchEvent(new CustomEvent('rm-season-extension-ready',{detail:window.RMSeasonUpdateFlow}));
})();
