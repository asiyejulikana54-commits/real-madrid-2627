(()=>{
if(window.RMUiFixes20260916)return;
window.RMUiFixes20260916=true;

const style=document.createElement('style');
style.id='rm-ui-fixes-20260916-style';
style.textContent=`
.rm-mvp-enhanced .mvp-pro-pick-controls{display:none!important}
.rm-mvp-picker{width:100%;margin-top:10px;border:1px solid var(--line);border-radius:13px;background:#091522;overflow:hidden}
.rm-mvp-picker summary{list-style:none;cursor:pointer;padding:12px 14px;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:space-between;gap:10px}
.rm-mvp-picker summary::-webkit-details-marker{display:none}
.rm-mvp-picker summary:after{content:'+';color:var(--gold);font-size:20px;line-height:1}
.rm-mvp-picker[open] summary:after{content:'−'}
.rm-mvp-options{display:grid;border-top:1px solid var(--line)}
.rm-mvp-option{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;border:0;border-top:1px solid rgba(255,255,255,.07);background:transparent;color:#fff;padding:12px 14px;font:inherit;cursor:pointer}
.rm-mvp-option:first-child{border-top:0}
.rm-mvp-option span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rm-mvp-option small{color:var(--gold);font-weight:900}
.rm-mvp-option:active{background:rgba(216,180,74,.10)}
.rm-my-xi-card{order:4;margin-top:16px}
@media(max-width:680px){.rm-mvp-option{padding:14px}.rm-mvp-picker summary{padding:14px}}
`;
document.head.appendChild(style);

function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function display(v){return safe(()=>typeof displayName==='function'?displayName(v):v,v)||v}

function enhanceMvpPickers(){
  document.querySelectorAll('.mvp-pro-pick').forEach(box=>{
    const select=box.querySelector('[data-mvp-select]');
    const save=box.querySelector('[data-mvp-save]');
    if(!select||!save||box.classList.contains('rm-mvp-enhanced'))return;
    const opts=[...select.options].filter(o=>o.value);
    if(!opts.length)return;
    box.classList.add('rm-mvp-enhanced');
    const details=document.createElement('details');details.className='rm-mvp-picker';
    const summary=document.createElement('summary');
    const current=select.options[select.selectedIndex]?.value||'';
    summary.textContent=current?`Cambiar mi MVP · ${display(current)}`:'Elegir mi MVP';
    const list=document.createElement('div');list.className='rm-mvp-options';
    opts.forEach(opt=>{
      const btn=document.createElement('button');btn.type='button';btn.className='rm-mvp-option';btn.dataset.rmMvpValue=opt.value;
      const parts=String(opt.textContent||'').split(' · ');
      btn.innerHTML=`<span>${esc(parts[0]||opt.value)}</span><small>${esc(parts.slice(1).join(' · '))}</small>`;
      btn.addEventListener('click',()=>{
        select.value=opt.value;
        select.dispatchEvent(new Event('change',{bubbles:true}));
        details.open=false;
        save.click();
      });
      list.appendChild(btn);
    });
    details.append(summary,list);
    const controls=box.querySelector('.mvp-pro-pick-controls');
    controls?.insertAdjacentElement('beforebegin',details);
  });
}

const XI_ORDER=['gk','lb','lcb','rcb','rb','dm1','dm2','am','lw','rw','st'];
function savedXiNames(){
  const pred=safe(()=>typeof getSavedPrediction==='function'?getSavedPrediction():null,null),xi=pred?.xi||{};
  return XI_ORDER.map(k=>xi[k]).filter(Boolean);
}
function addMyXiCard(){
  const grid=document.querySelector('#milContent .mil-grid');if(!grid)return;
  const communityHeading=[...grid.querySelectorAll('.mil-title h3')].find(h=>/XI más votado/i.test(h.textContent||''));
  const communityCard=communityHeading?.closest('section.card');if(!communityCard)return;
  let card=grid.querySelector('.rm-my-xi-card');
  if(!card){card=document.createElement('section');card.className='card rm-my-xi-card';communityCard.insertAdjacentElement('afterend',card)}
  const names=savedXiNames();
  card.innerHTML=`<div class="mil-title"><div><span>TU ELECCIÓN</span><h3>Tu XI</h3></div><button type="button" data-rm-my-xi-open>Ver mi predicción</button></div>${names.length?`<div class="mil-xi">${names.map(n=>`<span>${esc(display(n))}</span>`).join('')}</div>`:'<div class="mil-empty"><b>Aún no has guardado un XI</b><span>Haz tu predicción y aparecerá aquí igual que el XI de la comunidad.</span></div>'}`;
  card.querySelector('[data-rm-my-xi-open]')?.addEventListener('click',()=>safe(()=>showSection('prediccion')));
}

let leagueLoad='';
function fixPrivateLeague(){
  const api=window.RMCommunityLeague;if(!api?.state)return;
  const state=safe(()=>api.state(),null);if(!state||state.tab!=='private')return;
  const leagues=state.data?.myLeagues||[];
  const view=document.getElementById('cglLeagueView');
  if(!leagues.length){
    const title=view?.querySelector('.cgl-empty b');
    if(title&&/Elige una liga/i.test(title.textContent||'')){
      title.textContent='Crea o únete a una liga';
      const sub=title.nextElementSibling;if(sub)sub.textContent='Cuando tengas una liga privada, su clasificación aparecerá aquí automáticamente.';
    }
    return;
  }
  const validSelected=state.selectedLeague&&leagues.some(l=>String(l.code)===String(state.selectedLeague));
  const code=validSelected?state.selectedLeague:leagues[0].code;
  const emptyTitle=view?.querySelector('.cgl-empty b')?.textContent||'';
  const needsLoad=!validSelected||/Elige una liga/i.test(emptyTitle);
  if(!needsLoad||leagueLoad===code)return;
  leagueLoad=code;
  Promise.resolve(api.loadLeague?.(code,false)).finally(()=>{leagueLoad='';});
}

let timer=null;
function applyAll(){timer=null;enhanceMvpPickers();addMyXiCard();fixPrivateLeague()}
function schedule(){if(timer!==null)return;timer=setTimeout(applyAll,20)}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('rm-local-prediction-updated',schedule);
document.addEventListener('rm-community-updated',schedule);
document.addEventListener('rm-mvp-personal-updated',schedule);
document.addEventListener('rm-modules-ready',schedule);
[50,250,700,1500,3000].forEach(ms=>setTimeout(schedule,ms));
})();