(()=>{
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function canonical(name){return safe(()=>window.RMSeasonData?.canonical?.(name),name)||name}
function same(a,b){return Boolean(a&&b&&canonical(a)===canonical(b))}
function defs(){return safe(()=>slots.map(s=>({key:s[0],label:s[1],position:s[4]||s[1]||s[0]})),[])||[]}
function groups(){
  const map=new Map();for(const slot of defs()){const key=slot.position||slot.label||slot.key;if(!map.has(key))map.set(key,[]);map.get(key).push(slot)}
  return [...map.entries()].map(([key,slots])=>({key,slots,interchangeable:slots.length>1}));
}
function cloneXi(xi){return Object.fromEntries(defs().map(s=>[s.key,xi?.[s.key]||'']))}
function namesFor(group,xi){return group.slots.map((slot,index)=>({slot,index,name:xi?.[slot.key]||'',key:xi?.[slot.key]?canonical(xi[slot.key]):''})).filter(x=>x.name)}
function normalizeAgainst(reference,candidate){
  const out=cloneXi(candidate);if(!reference||!candidate)return out;
  for(const group of groups()){
    if(!group.interchangeable)continue;
    const candidateRows=namesFor(group,candidate),byKey=new Map();for(const row of candidateRows)if(!byKey.has(row.key))byKey.set(row.key,row);
    const used=new Set();for(const slot of group.slots){const ref=reference?.[slot.key]||'',key=ref?canonical(ref):'';if(key&&byKey.has(key)){out[slot.key]=byKey.get(key).name;used.add(key)}else out[slot.key]=''}
    const additions=candidateRows.filter(row=>!used.has(row.key)),vacancies=group.slots.filter(slot=>!out[slot.key]);
    vacancies.forEach((slot,index)=>{out[slot.key]=additions[index]?.name||''});
  }
  return out;
}
function roleScore(candidate,reference){
  if(!candidate||!reference)return null;let score=0,possible=0;const hits=[];
  for(const group of groups()){
    const ref=namesFor(group,reference),cand=namesFor(group,candidate),candKeys=new Set(cand.map(x=>x.key));possible+=ref.length;
    for(const row of ref)if(candKeys.has(row.key)){score++;hits.push({role:group.key,name:row.name})}
  }
  return {score,possible,hits};
}
function compare(reference,candidate){
  const normalizedCandidate=normalizeAgainst(reference,candidate),bySlot={},changes=[];let roleMatches=0,possible=0;
  for(const group of groups()){
    const refRows=namesFor(group,reference),candRows=namesFor(group,candidate),refKeys=new Set(refRows.map(x=>x.key)),candKeys=new Set(candRows.map(x=>x.key));
    const out=refRows.filter(x=>!candKeys.has(x.key)),incoming=candRows.filter(x=>!refKeys.has(x.key));roleMatches+=refRows.filter(x=>candKeys.has(x.key)).length;possible+=refRows.length;
    const changedSlots=[];
    for(const slot of group.slots){const project=reference?.[slot.key]||'',user=normalizedCandidate?.[slot.key]||'',changed=Boolean(project&&user&&!same(project,user));bySlot[slot.key]={slot,project,user,available:Boolean(user),changed,role:group.key,interchangeable:group.interchangeable};if(changed)changedSlots.push(slot)}
    const pairs=Math.max(out.length,incoming.length);for(let i=0;i<pairs;i++)changes.push({role:group.key,slot:changedSlots[i]?.key||group.slots[i]?.key||'',out:out[i]?.name||'',in:incoming[i]?.name||'',interchangeable:group.interchangeable});
  }
  const refValues=Object.values(reference||{}).filter(Boolean),candValues=Object.values(candidate||{}).filter(Boolean),refSet=new Set(refValues.map(canonical)),candSet=new Set(candValues.map(canonical));
  const playerOut=refValues.filter(n=>!candSet.has(canonical(n))),playerIn=candValues.filter(n=>!refSet.has(canonical(n)));
  const complete=possible===defs().length&&candValues.length===defs().length;
  return {normalizedCandidate,bySlot,changes,count:changes.length,roleMatches,possible,equivalent:complete&&roleMatches===possible,playerOut,playerIn,samePlayers:refSet.size===candSet.size&&[...refSet].every(k=>candSet.has(k))};
}
function equivalent(a,b){return Boolean(compare(a,b).equivalent)}
window.RMLineupSemantics=Object.freeze({defs,groups,normalizeAgainst,roleScore,compare,equivalent,same});
document.dispatchEvent(new CustomEvent('rm-lineup-semantics-ready'));
})();
