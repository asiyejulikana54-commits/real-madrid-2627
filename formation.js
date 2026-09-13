(()=>{
const FORMATIONS={
  '4-2-3-1':{
    label:'4-2-3-1',description:'Doble pivote + mediapunta',
    slots:{gk:[50,91,'POR'],lb:[14,73,'LI'],lcb:[38,75,'DFC'],rcb:[62,75,'DFC'],rb:[86,73,'LD'],dm1:[36,55,'MC'],dm2:[64,55,'MC'],am:[50,37,'MP'],lw:[20,25,'EI'],rw:[80,25,'ED'],st:[50,12,'DC']}
  },
  '4-3-3':{
    label:'4-3-3',description:'Tres centrocampistas + extremos',
    slots:{gk:[50,91,'POR'],lb:[14,73,'LI'],lcb:[38,75,'DFC'],rcb:[62,75,'DFC'],rb:[86,73,'LD'],dm1:[32,53,'MC'],dm2:[50,58,'MC'],am:[68,53,'MP/INT'],lw:[18,24,'EI'],rw:[82,24,'ED'],st:[50,12,'DC']}
  },
  '4-2-1-3':{
    label:'4-2-1-3',description:'Ataque alto con tres puntas',
    slots:{gk:[50,91,'POR'],lb:[14,73,'LI'],lcb:[38,75,'DFC'],rcb:[62,75,'DFC'],rb:[86,73,'LD'],dm1:[38,57,'MC'],dm2:[62,57,'MC'],am:[50,39,'MP'],lw:[18,18,'EI'],rw:[82,18,'ED'],st:[50,9,'DC']}
  }
};

let activeFormation='4-2-3-1';
function matchId(){try{return window.RMCommunityApi?.match?.id||predictionMatch?.id||'actual'}catch{return 'actual'}}
function storageKey(){return `rm_prediction_formation_${matchId()}`}
function closed(){try{return typeof predictionIsClosed==='function'&&predictionIsClosed()}catch{return false}}
function getPitchSlot(key){return document.getElementById(`pred_${key}`)?.closest('.slot')||null}
function applyFormation(name,{persist=true}={}){
  const formation=FORMATIONS[name]||FORMATIONS['4-2-3-1'];activeFormation=formation.label;
  Object.entries(formation.slots).forEach(([key,[left,top,label]])=>{
    const slot=getPitchSlot(key);if(!slot)return;
    slot.style.left=`${left}%`;slot.style.top=`${top}%`;slot.dataset.formationRole=label;
    const lab=slot.querySelector('label');if(lab)lab.textContent=label;
  });
  document.querySelectorAll('[data-formation-choice]').forEach(btn=>btn.classList.toggle('active',btn.dataset.formationChoice===activeFormation));
  const desc=document.getElementById('formationDescription');if(desc)desc.textContent=formation.description;
  if(persist)try{localStorage.setItem(storageKey(),activeFormation)}catch{}
  document.dispatchEvent(new CustomEvent('rm-formation-changed',{detail:{formation:activeFormation}}));
}
function buildSelector(){
  const section=document.getElementById('prediccion'),pitchWrap=section?.querySelector('.pitch-wrap');if(!section||!pitchWrap||document.getElementById('formationSelector'))return false;
  const bar=document.createElement('div');bar.id='formationSelector';bar.className='formation-selector card';
  bar.innerHTML=`<div class="formation-copy"><span>FORMACIÓN</span><b>Elige la estructura de tu XI</b><small id="formationDescription"></small></div><div class="formation-options">${Object.values(FORMATIONS).map(f=>`<button type="button" data-formation-choice="${f.label}">${f.label}</button>`).join('')}</div>`;
  pitchWrap.insertAdjacentElement('beforebegin',bar);
  bar.querySelectorAll('[data-formation-choice]').forEach(btn=>btn.addEventListener('click',()=>{if(closed()){try{toast('La predicción ya está cerrada')}catch{}return}applyFormation(btn.dataset.formationChoice)}));
  return true;
}
function loadSaved(){let name='4-2-3-1';try{name=localStorage.getItem(storageKey())||name}catch{}applyFormation(name,{persist:false})}
function syncDisabled(){const isClosed=closed();document.querySelectorAll('[data-formation-choice]').forEach(btn=>{btn.disabled=isClosed;btn.title=isClosed?'Predicción cerrada':''})}
function install(){
  if(!document.getElementById('predictionPitch'))return void setTimeout(install,80);
  buildSelector();loadSaved();syncDisabled();
  const observer=new MutationObserver(()=>{if(buildSelector())loadSaved();syncDisabled()});observer.observe(document.getElementById('prediccion'),{childList:true,subtree:true});
  document.addEventListener('rm-community-updated',syncDisabled);
  window.RMFormation=Object.freeze({set:name=>applyFormation(name),get:()=>activeFormation,all:()=>Object.keys(FORMATIONS)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();