(()=>{
let scheduled=false;
function data(){return window.RMCommunityData||null}
function txt(el,value){if(el&&el.textContent!==value)el.textContent=value}
function html(el,value){if(el&&el.innerHTML!==value)el.innerHTML=value}
function patchHead(root){
  const p=root?.querySelector('.cgl-head p');
  if(p)txt(p,'1 punto por cada titular acertado. Si haces 11/11, sumas +1 extra: pleno = 12 puntos.');
}
function patchPersonal(root){
  const card=root?.querySelector('.cgl-my');if(!card)return;
  card.querySelectorAll('small').forEach(el=>{
    const t=el.textContent.trim().toLowerCase();
    if(t==='aciertos')txt(el,'puntos');
    if(t==='racha 8+')txt(el,'plenos');
  });
  const b=card.querySelector(':scope > b');
  if(b&&/\/ 11 de media/.test(b.textContent))b.textContent=b.textContent.replace('/ 11 de media','/ 12 de media');
}
function patchGeneralPrivate(root){
  root?.querySelectorAll('.cgl-table:not(.round)').forEach(table=>{
    const h=table.querySelector('.cgl-tr.head');if(h){const c=h.children;if(c[2])txt(c[2],'Puntos');if(c[3])txt(c[3],'Media');if(c[4])txt(c[4],'Plenos')}
  });
  root?.querySelectorAll('.cgl-method').forEach(el=>txt(el,'La general ordena por puntos acumulados. Cada acierto vale 1 punto y el 11/11 añade +1 extra. En empate, manda la media y después los plenos.'));
}
function patchRound(root){
  const d=data(),rows=d?.roundLeaderboard||[];
  root?.querySelectorAll('.cgl-table.round').forEach(table=>{
    const h=table.querySelector('.cgl-tr.head');if(h&&h.children[2])txt(h.children[2],'Puntos');
    const body=[...table.querySelectorAll('.cgl-tr:not(.head)')];
    body.forEach((row,i)=>{
      const r=rows[i];if(!r)return;const strong=row.querySelector('strong');if(!strong)return;
      html(strong,`${Number.isFinite(r.points)?r.points:r.hits} pts<small>${r.hits}/11${r.perfect?' · PLENO +1':''}</small>`);
    });
  });
}
function patchCommunityBoard(){
  const d=data(),board=document.getElementById('communityLeaderboard');if(!board||!d)return;
  const head=board.querySelector('.leaderboard-head');if(head&&head.children[2])txt(head.children[2],'Puntos');
  const rows=[...board.querySelectorAll('.leaderboard-row')],source=d.leaderboard||[];
  rows.forEach((row,i)=>{const r=source[i],strong=row.querySelector('strong');if(!r||!strong)return;html(strong,`${Number.isFinite(r.points)?r.points:r.hits}<small> pts</small>`)});
  const card=board.closest('.card'),desc=card?.querySelector('.section-head p');
  if(desc)txt(desc,'1 punto por cada titular acertado. Un 11/11 suma +1 extra y vale 12 puntos.');
}
function patchPulse(){
  document.querySelectorAll('#communityLeaguePulse b').forEach(el=>{if(/de media$/.test(el.textContent)&&!(/puntos de media$/.test(el.textContent)))el.textContent=el.textContent.replace(/([0-9]+(?:[.,][0-9]+)?) de media/,'$1 puntos de media')});
}
function patch(){scheduled=false;const root=document.getElementById('communityLeague');patchHead(root);patchPersonal(root);patchGeneralPrivate(root);patchRound(root);patchCommunityBoard();patchPulse()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch)}
const observer=new MutationObserver(schedule);
function install(){observer.observe(document.documentElement,{subtree:true,childList:true});document.addEventListener('rm-community-updated',()=>setTimeout(schedule,0));document.addEventListener('rm-local-prediction-updated',()=>setTimeout(schedule,0));schedule();setTimeout(schedule,350);setTimeout(schedule,1200)}
window.RMLeagueScoring=Object.freeze({patch,rules:Object.freeze({hit:1,perfectBonus:1,maxRound:12})});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
