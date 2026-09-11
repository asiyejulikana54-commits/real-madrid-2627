(()=>{
const AUDIT_DATE='2026-09-11';
const POLICY=Object.freeze({
  full:'3 notas publicadas → media aritmética de SofaScore + FotMob + StatMuse.',
  partial:'2 notas + 1 SC → media aritmética de las 2 notas publicadas.',
  unrated:'3 SC → la aparición conserva sus minutos, pero no genera nota ni aporte.',
  efficiency:'Min/punto usa todos los minutos jugados; la media acumulada usa solo minutos con valoración publicada.',
  cutoff:'Sin corte mínimo de minutos.'
});

function canonical(name){
  return window.RMSeasonData?.canonical?window.RMSeasonData.canonical(name):name;
}

function historicalMinutes(name){
  const data=window.RMSeasonData;
  if(!data)return null;
  const player=canonical(name);
  return data.matches.reduce((total,match)=>{
    const value=data.minutes(match.id,player);
    return total+(Number.isFinite(value)?value:0);
  },0);
}

function refreshViews(){
  for(const fn of ['renderPlayers','renderBars','renderStats','renderCompare']){
    try{if(typeof window[fn]==='function')window[fn]()}catch{}
  }
}

function snapshotRanking(){
  return efficiencyRanking.map((row,index)=>Object.freeze({
    position:index+1,
    name:canonical(row.name),
    displayName:row.name,
    minutes:row.minutes,
    points:row.points,
    minPerPoint:row.minPerPoint,
    rating:row.minutes>0?row.points*90/row.minutes:null
  }));
}

function reconcileMinutesOnly(){
  const mismatches=[];
  for(const row of efficiencyRanking){
    const total=historicalMinutes(row.name);
    if(total===null)continue;
    const previous=row.minutes;
    if(previous!==total){
      mismatches.push(Object.freeze({player:canonical(row.name),previous,current:total,delta:total-previous}));
    }
    row.minutes=total;
    row.minPerPoint=row.points>0?total/row.points:Infinity;
  }
  efficiencyRanking.sort((a,b)=>a.minPerPoint-b.minPerPoint||b.minutes-a.minutes||String(a.name).localeCompare(String(b.name),'es'));
  return Object.freeze(mismatches);
}

function officialMetric(name){
  const data=window.RMSeasonData;
  const player=canonical(name);
  let minutes=0,ratedMinutes=0,unratedMinutes=0,points=0;
  let complete3=0,twoPlusSC=0,allSC=0,ratedAppearances=0;
  const appearances=[];

  for(const match of data.matches){
    const played=data.minutes(match.id,player);
    if(!Number.isFinite(played)||played<=0)continue;
    minutes+=played;

    const combined=data.combinedRatingEntry(match.id,player,{minSources:1});
    const unrated=data.sourceUnrated?data.sourceUnrated(match.id,player):{};
    const scCount=data.sources.filter(source=>unrated[source]).length;

    if(combined&&combined.closed){
      ratedMinutes+=played;
      ratedAppearances++;
      const contribution=combined.value*played/90;
      points+=contribution;
      if(combined.sourceCount===3)complete3++;
      else if(combined.sourceCount===2&&scCount===1)twoPlusSC++;
      appearances.push(Object.freeze({
        match:match.id,
        minutes:played,
        rating:combined.value,
        sourceCount:combined.sourceCount,
        scCount,
        contribution,
        status:combined.complete?'3/3':'2 + SC'
      }));
    }else if(scCount===3){
      unratedMinutes+=played;
      allSC++;
      appearances.push(Object.freeze({match:match.id,minutes:played,rating:null,sourceCount:0,scCount:3,contribution:0,status:'SC'}));
    }
  }

  const rating=ratedMinutes>0?points*90/ratedMinutes:null;
  const minPerPoint=points>0?minutes/points:Infinity;
  return Object.freeze({player,minutes,ratedMinutes,unratedMinutes,points,rating,minPerPoint,ratedAppearances,complete3,twoPlusSC,allSC,appearances:Object.freeze(appearances)});
}

function applyOfficialRanking(){
  if(!window.RMSeasonData||typeof efficiencyRanking==='undefined')return false;

  const minuteMismatches=reconcileMinutesOnly();
  const legacy=snapshotRanking();
  const legacyPosition=new Map(legacy.map(row=>[row.name,row.position]));
  const legacyMetric=new Map(legacy.map(row=>[row.name,row]));

  for(const row of efficiencyRanking){
    const official=officialMetric(row.name);
    row.minutes=official.minutes;
    row.ratedMinutes=official.ratedMinutes;
    row.unratedMinutes=official.unratedMinutes;
    row.points=official.points;
    row.rating=official.rating;
    row.minPerPoint=official.minPerPoint;
    row.ratedAppearances=official.ratedAppearances;
    row.complete3=official.complete3;
    row.twoPlusSC=official.twoPlusSC;
    row.allSC=official.allSC;
    row.rankingSource='SofaScore + FotMob + StatMuse';
  }

  efficiencyRanking.sort((a,b)=>a.minPerPoint-b.minPerPoint||b.minutes-a.minutes||String(a.name).localeCompare(String(b.name),'es'));

  const official=efficiencyRanking.map((row,index)=>Object.freeze({
    position:index+1,
    name:canonical(row.name),
    displayName:row.name,
    minutes:row.minutes,
    ratedMinutes:row.ratedMinutes,
    unratedMinutes:row.unratedMinutes,
    points:row.points,
    rating:row.rating,
    minPerPoint:row.minPerPoint,
    complete3:row.complete3,
    twoPlusSC:row.twoPlusSC,
    allSC:row.allSC
  }));

  const comparison=official.map(row=>{
    const old=legacyMetric.get(row.name);
    const oldPosition=legacyPosition.get(row.name)??null;
    return Object.freeze({
      name:row.name,
      oldPosition,
      newPosition:row.position,
      positionDelta:oldPosition===null?null:oldPosition-row.position,
      oldRating:old?.rating??null,
      newRating:row.rating,
      oldPoints:old?.points??null,
      newPoints:row.points,
      oldMinPerPoint:old?.minPerPoint??null,
      newMinPerPoint:row.minPerPoint
    });
  });

  try{
    window.currentRating=function(metric){
      if(!metric)return null;
      if(Number.isFinite(metric.rating))return metric.rating;
      const denominator=Number.isFinite(metric.ratedMinutes)?metric.ratedMinutes:metric.minutes;
      return denominator>0?metric.points*90/denominator:null;
    };
  }catch{}

  const totalMinutes=efficiencyRanking.reduce((sum,row)=>sum+row.minutes,0);
  const totalRatedMinutes=efficiencyRanking.reduce((sum,row)=>sum+(row.ratedMinutes||0),0);
  window.RMMinuteAudit=Object.freeze({
    date:AUDIT_DATE,
    source:'RMSeasonData · MINUTES',
    convention:'Suma de minutos confirmados partido a partido. SC conserva los minutos jugados aunque no exista valoración.',
    rankedPlayers:efficiencyRanking.length,
    totalMinutes,
    mismatches:minuteMismatches
  });
  window.RMRankingMigration=Object.freeze({
    date:AUDIT_DATE,
    version:1,
    status:'official',
    source:'SofaScore + FotMob + StatMuse',
    policy:POLICY,
    totalMinutes,
    totalRatedMinutes,
    legacy:Object.freeze(legacy),
    official:Object.freeze(official),
    comparison:Object.freeze(comparison),
    positionChanges:Object.freeze(comparison.filter(row=>row.positionDelta!==0))
  });

  refreshViews();
  document.dispatchEvent(new CustomEvent('rm-minute-reconciliation-ready',{detail:window.RMMinuteAudit}));
  document.dispatchEvent(new CustomEvent('rm-ranking-official-ready',{detail:window.RMRankingMigration}));
  return true;
}

window.reconcileRMMinutes=applyOfficialRanking;
window.applyRMOfficialRanking=applyOfficialRanking;
if(!applyOfficialRanking())document.addEventListener('rm-season-data-ready',applyOfficialRanking,{once:true});
})();
