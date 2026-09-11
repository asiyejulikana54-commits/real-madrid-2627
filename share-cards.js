(()=>{
const W=1080,H=1350,GOLD='#d8b44a',WHITE='#f7f9fc',MUTED='#91a3b7',BG='#06101d',CARD='#0e2035',LINE='rgba(255,255,255,.10)';
let installed=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function canonical(n){return safe(()=>window.RMSeasonData?.canonical?.(n),n)||n}
function playerByName(n){return safe(()=>players.find(p=>p.name===n||p.short===n),null)}
function metric(p){return p?safe(()=>metricFor(p),null):null}
function rating(m){return m?safe(()=>currentRating(m),Number.isFinite(m.rating)?m.rating:null):null}
function display(n){const p=playerByName(n);return p?(p.short||p.name):n}
function powerOf(name){
  const c=canonical(name);const migrated=safe(()=>window.RMPowerMigration?.official?.find(x=>canonical(x.name)===c),null);
  if(Number.isFinite(migrated?.power))return migrated.power;
  const p=playerByName(name),m=metric(p),r=rating(m);return m&&Number.isFinite(r)?r*(.75+.25*Math.min(m.minutes||0,450)/450):null;
}
function efficiencyRank(name){const c=canonical(name);const i=safe(()=>efficiencyRanking.findIndex(x=>canonical(x.name)===c),-1);return i>=0?i+1:null}
function recent(name){return safe(()=>window.RMSeasonData?.recentRating?.(name,3),null)}
function fmt(v,d=2){return Number.isFinite(v)?Number(v).toFixed(d):'—'}
function slug(v){return String(v||'tarjeta').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function canvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c}
function roundRect(ctx,x,y,w,h,r,fill,stroke=null){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function text(ctx,t,x,y,size=32,weight=700,color=WHITE,align='left'){ctx.font=`${weight} ${size}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(String(t),x,y)}
function wrap(ctx,t,x,y,maxW,lineH,size=30,weight=500,color=MUTED,maxLines=3){ctx.font=`${weight} ${size}px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.fillStyle=color;ctx.textAlign='left';const words=String(t||'').split(/\s+/);let line='',lines=[];for(const word of words){const trial=line?`${line} ${word}`:word;if(ctx.measureText(trial).width>maxW&&line){lines.push(line);line=word}else line=trial}if(line)lines.push(line);lines=lines.slice(0,maxLines);lines.forEach((l,i)=>ctx.fillText(i===maxLines-1&&lines.length===maxLines&&words.join(' ').length>l.length?`${l}…`:l,x,y+i*lineH));return y+lines.length*lineH}
function bg(ctx){const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#102945');g.addColorStop(.48,BG);g.addColorStop(1,'#030912');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.globalAlpha=.09;ctx.fillStyle=GOLD;ctx.beginPath();ctx.arc(925,150,270,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}
function header(ctx,label){text(ctx,'RM 26/27',70,86,34,950,WHITE);text(ctx,'DATOS · XI · COMUNIDAD',70,124,16,850,GOLD);text(ctx,label.toUpperCase(),1010,92,16,900,MUTED,'right');ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(70,154,940,2)}
function footer(ctx){ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(70,1262,940,2);text(ctx,'Proyecto independiente · No oficial',70,1305,18,700,MUTED);text(ctx,location.host||'RM 26/27',1010,1305,18,800,GOLD,'right')}
function statBox(ctx,x,y,w,label,value,accent=false){roundRect(ctx,x,y,w,132,22,'rgba(255,255,255,.035)',LINE);text(ctx,label.toUpperCase(),x+22,y+35,15,850,MUTED);text(ctx,value,x+22,y+92,40,950,accent?GOLD:WHITE)}
function playerCard(name){
  const p=playerByName(name);if(!p)throw new Error('Jugador no encontrado');const m=metric(p),r=rating(m),pow=powerOf(p.name),form=recent(p.name),rank=efficiencyRank(p.name);const c=canvas(),ctx=c.getContext('2d');bg(ctx);header(ctx,'Ficha de jugador');
  text(ctx,p.name,70,250,62,950,WHITE);text(ctx,p.role||p.pos,70,296,23,650,MUTED);roundRect(ctx,820,204,190,92,24,'rgba(216,180,74,.09)','rgba(216,180,74,.28)');text(ctx,p.pos,915,262,31,950,GOLD,'center');
  statBox(ctx,70,360,290,'Media',fmt(r),true);statBox(ctx,395,360,290,'Power RM',fmt(pow));statBox(ctx,720,360,290,'Minutos',m?.minutes??'—');
  statBox(ctx,70,520,290,'Min / punto',fmt(m?.minPerPoint));statBox(ctx,395,520,290,'Aporte',fmt(m?.points));statBox(ctx,720,520,290,'Ranking eficiencia',rank?`#${rank}`:'—',true);
  roundRect(ctx,70,710,940,195,28,CARD,LINE);text(ctx,'FORMA RECIENTE',98,754,16,900,GOLD);text(ctx,form?fmt(form.value):'—',98,826,54,950,WHITE);wrap(ctx,form?`Media en sus últimos ${form.n} partidos con valoración oficial.`:'Todavía no hay muestra reciente suficiente.',235,808,720,34,23,600,MUTED,3);
  roundRect(ctx,70,940,940,210,28,'rgba(255,255,255,.025)',LINE);text(ctx,'PUEDE JUGAR EN',98,985,16,900,GOLD);text(ctx,(p.eligible||[]).join(' · ')||p.pos,98,1045,32,900,WHITE);wrap(ctx,(p.tags||[]).join(' · '),98,1094,850,30,20,650,MUTED,2);
  footer(ctx);return {canvas:c,title:`${display(p.name)} · RM 26/27`,filename:`rm-2627-${slug(display(p.name))}.png`};
}
function compareData(name){const p=playerByName(name),m=metric(p),r=rating(m);return {p,m,r,power:powerOf(p?.name),rank:efficiencyRank(p?.name)}}
function comparisonCard(aName,bName){
  const a=compareData(aName),b=compareData(bName);if(!a.p||!b.p)throw new Error('Comparativa no disponible');const c=canvas(),ctx=c.getContext('2d');bg(ctx);header(ctx,'Comparativa');
  text(ctx,display(a.p.name),70,246,48,950,WHITE);text(ctx,'VS',540,244,26,900,GOLD,'center');text(ctx,display(b.p.name),1010,246,48,950,WHITE,'right');text(ctx,a.p.role,70,286,18,600,MUTED);text(ctx,b.p.role,1010,286,18,600,MUTED,'right');
  const rows=[['Media',a.r,b.r,true],['Power RM',a.power,b.power,true],['Minutos',a.m?.minutes,b.m?.minutes,true],['Aporte',a.m?.points,b.m?.points,true],['Min / punto',a.m?.minPerPoint,b.m?.minPerPoint,false],['Ranking eficiencia',a.rank,b.rank,false]];
  let y=355;for(const [label,av,bv,higher] of rows){roundRect(ctx,70,y,940,112,20,'rgba(255,255,255,.03)',LINE);text(ctx,label.toUpperCase(),540,y+40,15,850,MUTED,'center');const an=Number(av),bn=Number(bv),aBest=Number.isFinite(an)&&Number.isFinite(bn)&&(higher?an>bn:an<bn),bBest=Number.isFinite(an)&&Number.isFinite(bn)&&(higher?bn>an:bn<an);const af=label==='Minutos'||label==='Ranking eficiencia'?String(av??'—'):fmt(av);const bf=label==='Minutos'||label==='Ranking eficiencia'?String(bv??'—'):fmt(bv);text(ctx,label==='Ranking eficiencia'&&av?`#${af}`:af,150,y+82,34,950,aBest?GOLD:WHITE);text(ctx,label==='Ranking eficiencia'&&bv?`#${bf}`:bf,930,y+82,34,950,bBest?GOLD:WHITE,'right');y+=130}
  footer(ctx);return {canvas:c,title:`${display(a.p.name)} vs ${display(b.p.name)} · RM 26/27`,filename:`rm-2627-${slug(display(a.p.name))}-vs-${slug(display(b.p.name))}.png`};
}
function xiCard(){
  const xi=safe(()=>currentXI(),{});const name=document.getElementById('lineupName')?.value?.trim()||'Mi XI';const comment=document.getElementById('lineupComment')?.value?.trim()||'';const c=canvas(),ctx=c.getContext('2d');bg(ctx);header(ctx,'Mi XI');text(ctx,name,70,230,50,950,WHITE);if(comment)wrap(ctx,comment,70,272,900,30,19,600,MUTED,2);
  const fx=105,fy=350,fw=870,fh=760;roundRect(ctx,fx,fy,fw,fh,34,'#0a422d','rgba(255,255,255,.18)');ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=3;ctx.strokeRect(fx+28,fy+28,fw-56,fh-56);ctx.beginPath();ctx.moveTo(fx+28,fy+fh/2);ctx.lineTo(fx+fw-28,fy+fh/2);ctx.stroke();ctx.beginPath();ctx.arc(fx+fw/2,fy+fh/2,82,0,Math.PI*2);ctx.stroke();
  const slotDefs=safe(()=>slots,[]);for(const s of slotDefs){const key=s[0],label=s[1],px=fx+(s[2]/100)*fw,py=fy+(s[3]/100)*fh,n=xi[key];ctx.beginPath();ctx.arc(px,py,42,0,Math.PI*2);ctx.fillStyle=n?GOLD:'#183d31';ctx.fill();text(ctx,label,px,py-52,13,900,'rgba(255,255,255,.72)','center');text(ctx,n?display(n):'—',px,py+7,18,950,n?'#071421':WHITE,'center')}
  text(ctx,'Formación 4-2-3-1 adaptable',70,1170,18,700,MUTED);footer(ctx);return {canvas:c,title:`${name} · RM 26/27`,filename:`rm-2627-${slug(name)}.png`};
}
function blobFromCanvas(c){return new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo generar la imagen')),'image/png',1))}
async function shareResult(result){
  const blob=await blobFromCanvas(result.canvas),file=new File([blob],result.filename,{type:'image/png'});const text=`${result.title} · ${location.href}`;
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:result.title,text});return}catch(e){if(e?.name==='AbortError')return}
  }
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=result.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);safe(()=>toast('Tarjeta guardada como PNG'));
}
async function withBusy(btn,fn){if(btn?.disabled)return;const old=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Generando…'}try{await shareResult(fn())}catch(e){safe(()=>toast(e.message||'No se pudo crear la tarjeta'))}finally{if(btn){btn.disabled=false;btn.textContent=old}}}
function enhancePlayers(){document.querySelectorAll('#playersGrid .player').forEach(card=>{if(card.querySelector('.share-player-card'))return;const name=card.querySelector('h3')?.textContent?.trim();if(!name)return;const b=document.createElement('button');b.type='button';b.className='btn share-card-btn share-player-card';b.textContent='Compartir tarjeta';b.onclick=e=>{e.stopPropagation();withBusy(b,()=>playerCard(name))};card.appendChild(b)})}
function enhanceCompare(){const head=document.querySelector('#comparador>.section-head');if(!head||document.getElementById('shareCompareCard'))return;const b=document.createElement('button');b.id='shareCompareCard';b.type='button';b.className='btn share-card-btn';b.textContent='Compartir comparativa';b.onclick=()=>withBusy(b,()=>comparisonCard(document.getElementById('compareA').value,document.getElementById('compareB').value));head.appendChild(b)}
function enhanceXI(){const actions=document.querySelector('#once>.section-head .actions');if(!actions||document.getElementById('shareXiCard'))return;const b=document.createElement('button');b.id='shareXiCard';b.type='button';b.className='btn share-card-btn';b.textContent='Compartir XI';b.onclick=()=>withBusy(b,xiCard);actions.appendChild(b)}
function enhance(){enhancePlayers();enhanceCompare();enhanceXI()}
function install(){if(installed)return;if(typeof players==='undefined'||typeof metricFor!=='function'){setTimeout(install,120);return}installed=true;document.body.classList.add('share-cards-ready');enhance();document.getElementById('playerSearch')?.addEventListener('input',()=>setTimeout(enhancePlayers,0));document.getElementById('positionFilter')?.addEventListener('change',()=>setTimeout(enhancePlayers,0));const base=window.showSection;if(typeof base==='function')window.showSection=function(id){base(id);setTimeout(enhance,0)};[300,900,1800].forEach(ms=>setTimeout(enhance,ms))}
setTimeout(install,220);
})();