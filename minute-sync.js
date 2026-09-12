(()=>{
const AUDIT_DATE='2026-09-11';
const CHRONOLOGY_IDS=Object.freeze(['espanyol','real-sociedad','malaga','betis','inter']);
const POLICY=Object.freeze({
  full:'3 notas publicadas → media aritmética de SofaScore + FotMob + StatMuse.',
  partial:'2 notas + 1 SC → media aritmética de las 2 notas publicadas.',
  unrated:'3 SC → conserva minutos, sin nota ni aporte.',
  efficiency:'Min/punto usa todos los minutos jugados; la media usa solo minutos valorados.',
  cutoff:'Sin corte mínimo de minutos.'
});
function syncLegacyChronology(){
  const data=window.RMSeasonData;if(!data?.matches?.length)return false;
  const canonical=data.matches.slice(0,CHRONOLOGY_IDS.length).map(m=>m.id);
  const ok=CHRONOLOGY_IDS.every((id,i)=>canonical[i]===id);
  if(!ok){console.error('RMSeasonData trae una cronología no canónica',canonical);return false}
  let legacySynced=false;
  try{
    if(typeof matches!=='undefined'&&Array.isArray(matches)){
      const key=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const legacyByName=new Map(matches.map(m=>[key(m.rival),m])),ordered=data.matches.map(m=>legacyByName.get(key(m.label))).filter(Boolean),chosen=new Set(ordered),rest=matches.filter(m=>!chosen.has(m));
      matches.splice(0,matches.length,...ordered,...rest);legacySynced=true;
      const espanyol=legacyByName.get('espanyol');if(espanyol&&/Cuarto partido/i.test(espanyol.note||''))espanyol.note='Primera jornada del seguimiento histórico. Valoraciones y minutos incorporados al análisis multifuente.';
    }
  }catch{}
  const chronology=Object.freeze({version:3,source:'canonical',order:Object.freeze([...CHRONOLOGY_IDS]),labels:Object.freeze(data.matches.slice(0,CHRONOLOGY_IDS.length).map(m=>m.label)),legacySynced,note:'RMSeasonData ya nace en orden real; este puente solo sincroniza estructuras antiguas.'});
  window.RMChronologyCorrection=chronology;
  document.dispatchEvent(new CustomEvent('rm-season-order-corrected',{detail:chronology}));
  return true;
}
syncLegacyChronology();
function canonical(name){return window.RMSeasonData?.canonical?window.RMSeasonData.canonical(name):name}
function powerValue(rating,minutes){
  if(!Number.isFinite(rating)||!Number.isFinite(minutes))return null;
  return rating*(.75+.25*Math.min(minutes,450)/450);
}
function refreshViews(){
  for(const fn of ['renderPlayers','renderBars','renderStats','renderCompare','renderPowerHub','renderEvolution']){
    try{if(typeof window[fn]==='function')window[fn]()}catch{}
  }
  try{
    const old=document.getElementById('powerHome');
    if(old&&typeof window.ensurePowerHome==='function'){old.remove();window.ensurePowerHome()}
  }catch{}
}
function snapshotLegacy(){
  return efficiencyRanking.map((row,index)=>{
    const rating=row.minutes>0?row.points*90/row.minutes:null;
    return Object.freeze({position:index+1,name:canonical(row.name),displayName:row.name,minutes:row.minutes,points:row.points,minPerPoint:row.minPerPoint,rating,power:powerValue(rating,row.minutes)});
  });
}
function powerSnapshot(rows){
  return [...rows].sort((a,b)=>(b.power??-Infinity)-(a.power??-Infinity)||(b.rating??-Infinity)-(a.rating??-Infinity)||String(a.name).localeCompare(String(b.name),'es'))
    .map((row,index)=>Object.freeze({...row,powerPosition:index+1}));
}
function applyOfficialRanking(){
  const data=window.RMSeasonData;
  if(!data||typeof efficiencyRanking==='undefined')return false;

  const legacy=snapshotLegacy();
  const legacyMetric=new Map(legacy.map(row=>[row.name,row]));
  const minuteMismatches=[];

  for(const row of efficiencyRanking){
    const official=data.aggregatePlayer(row.name);
    if(row.minutes!==official.totalMinutes)minuteMismatches.push(Object.freeze({player:canonical(row.name),previous:row.minutes,current:official.totalMinutes,delta:official.totalMinutes-row.minutes}));
    Object.assign(row,{
      minutes:official.totalMinutes,
      ratedMinutes:official.ratedMinutes,
      unratedMinutes:official.unratedMinutes,
      points:official.totalPoints,
      rating:official.rating,
      minPerPoint:official.minPerPoint??Infinity,
      ratedAppearances:official.ratedMatches,
      complete3:official.completeMatches,
      twoPlusSC:official.partialMatches,
      allSC:official.allSC,
      rankingSource:'SofaScore + FotMob + StatMuse'
    });
  }

  efficiencyRanking.sort((a,b)=>a.minPerPoint-b.minPerPoint||b.minutes-a.minutes||String(a.name).localeCompare(String(b.name),'es'));

  const official=efficiencyRanking.map((row,index)=>Object.freeze({
    position:index+1,name:canonical(row.name),displayName:row.name,
    minutes:row.minutes,ratedMinutes:row.ratedMinutes,unratedMinutes:row.unratedMinutes,
    points:row.points,rating:row.rating,minPerPoint:row.minPerPoint,power:powerValue(row.rating,row.minutes),
    complete3:row.complete3,twoPlusSC:row.twoPlusSC,allSC:row.allSC
  }));

  const legacyPosition=new Map(legacy.map(row=>[row.name,row.position]));
  const comparison=official.map(row=>{
    const old=legacyMetric.get(row.name),oldPosition=legacyPosition.get(row.name)??null;
    return Object.freeze({
      name:row.name,oldPosition,newPosition:row.position,positionDelta:oldPosition===null?null:oldPosition-row.position,
      oldRating:old?.rating??null,newRating:row.rating,oldPoints:old?.points??null,newPoints:row.points,
      oldMinPerPoint:old?.minPerPoint??null,newMinPerPoint:row.minPerPoint
    });
  });

  const legacyPower=powerSnapshot(legacy),officialPower=powerSnapshot(official),oldPowerPos=new Map(legacyPower.map(row=>[row.name,row.powerPosition]));
  const powerComparison=officialPower.map(row=>{
    const old=legacyMetric.get(row.name),oldPosition=oldPowerPos.get(row.name)??null;
    return Object.freeze({name:row.name,oldPosition,newPosition:row.powerPosition,positionDelta:oldPosition===null?null:oldPosition-row.powerPosition,oldPower:old?.power??null,newPower:row.power,powerDelta:old?.power==null?null:row.power-old.power});
  });

  try{
    window.currentRating=function(metric){
      if(!metric)return null;
      if(Number.isFinite(metric.rating))return metric.rating;
      const denominator=Number.isFinite(metric.ratedMinutes)?metric.ratedMinutes:metric.minutes;
      return denominator>0?metric.points*90/denominator:null;
    };
  }catch{}

  const totalMinutes=official.reduce((s,row)=>s+row.minutes,0),totalRatedMinutes=official.reduce((s,row)=>s+row.ratedMinutes,0);
  window.RMMinuteAudit=Object.freeze({
    date:AUDIT_DATE,source:'RMSeasonData · MINUTES',
    convention:'Suma de minutos confirmados partido a partido. SC conserva los minutos jugados aunque no exista valoración.',
    rankedPlayers:official.length,totalMinutes,mismatches:Object.freeze(minuteMismatches)
  });
  window.RMRankingMigration=Object.freeze({
    date:AUDIT_DATE,version:4,status:'official',source:'SofaScore + FotMob + StatMuse',formSource:data.formSource,
    policy:POLICY,totalMinutes,totalRatedMinutes,legacy:Object.freeze(legacy),official:Object.freeze(official),
    comparison:Object.freeze(comparison),positionChanges:Object.freeze(comparison.filter(row=>row.positionDelta!==0))
  });
  window.RMPowerMigration=Object.freeze({
    date:AUDIT_DATE,status:'official',formula:'media × (0,75 + 0,25 × min(minutos,450)/450)',
    legacy:Object.freeze(legacyPower),official:Object.freeze(officialPower),comparison:Object.freeze(powerComparison),
    positionChanges:Object.freeze(powerComparison.filter(row=>row.positionDelta!==0))
  });

  refreshViews();
  document.dispatchEvent(new CustomEvent('rm-minute-reconciliation-ready',{detail:window.RMMinuteAudit}));
  document.dispatchEvent(new CustomEvent('rm-ranking-official-ready',{detail:window.RMRankingMigration}));
  document.dispatchEvent(new CustomEvent('rm-power-official-ready',{detail:window.RMPowerMigration}));
  return true;
}
window.reconcileRMMinutes=applyOfficialRanking;
window.applyRMOfficialRanking=applyOfficialRanking;
if(!applyOfficialRanking())document.addEventListener('rm-season-data-ready',applyOfficialRanking,{once:true});
})();