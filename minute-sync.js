(()=>{
const AUDIT_DATE='2026-09-11';

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

function reconcileMinutes(){
  if(!window.RMSeasonData||typeof efficiencyRanking==='undefined')return false;

  const mismatches=[];
  for(const row of efficiencyRanking){
    const total=historicalMinutes(row.name);
    if(total===null)continue;
    const previous=row.minutes;
    if(previous!==total){
      mismatches.push(Object.freeze({
        player:canonical(row.name),
        previous,
        current:total,
        delta:total-previous
      }));
    }
    row.minutes=total;
    row.minPerPoint=row.points>0?total/row.points:Infinity;
  }

  efficiencyRanking.sort((a,b)=>
    a.minPerPoint-b.minPerPoint||b.minutes-a.minutes||String(a.name).localeCompare(String(b.name),'es')
  );

  const totalMinutes=efficiencyRanking.reduce((sum,row)=>sum+row.minutes,0);
  window.RMMinuteAudit=Object.freeze({
    date:AUDIT_DATE,
    source:'RMSeasonData · MINUTES',
    convention:'Suma de minutos confirmados partido a partido. SC conserva los minutos jugados aunque no exista valoración.',
    rankedPlayers:efficiencyRanking.length,
    totalMinutes,
    mismatches:Object.freeze(mismatches)
  });

  refreshViews();
  document.dispatchEvent(new CustomEvent('rm-minute-reconciliation-ready',{detail:window.RMMinuteAudit}));
  return true;
}

window.reconcileRMMinutes=reconcileMinutes;
if(!reconcileMinutes())document.addEventListener('rm-season-data-ready',reconcileMinutes,{once:true});
})();
