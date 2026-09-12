(()=>{
const ROUTE_KEYS=['section','player','a','b','anchor'];
let installed=false,attempts=0,lastRoute='';
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function activeSection(){return document.querySelector('.section.active')?.id||'inicio'}
function sectionExists(id){return Boolean(id&&document.getElementById(id)?.classList.contains('section'))}
function baseUrl(){const u=new URL(location.href);u.hash='';for(const key of ROUTE_KEYS)u.searchParams.delete(key);return u}
function url(section=activeSection(),params={}){
  const u=baseUrl();if(section&&section!=='inicio')u.searchParams.set('section',section);
  for(const [key,value] of Object.entries(params||{})){if(value!==undefined&&value!==null&&String(value)!=='')u.searchParams.set(key,String(value))}
  return u.href;
}
function compareParams(){const A=document.getElementById('compareA'),B=document.getElementById('compareB');return A?.value&&B?.value?{a:A.value,b:B.value}:{} }
function contextual(section=activeSection()){
  const params={};
  if(section==='comparador')Object.assign(params,compareParams());
  if(section==='prediccion'&&document.getElementById('officialXiReview')&&!document.getElementById('officialXiReview')?.hidden)params.anchor='officialXiReview';
  if(section==='partido'&&document.getElementById('officialXiReviewMatchday')&&!document.getElementById('officialXiReviewMatchday')?.hidden)params.anchor='officialXiReviewMatchday';
  return {section,params,url:url(section,params)};
}
async function shareCurrent(){
  const c=contextual(),title=`RM 26/27 · ${safe(()=>sections.find(s=>s[0]===c.section)?.[2],c.section)||c.section}`;
  try{
    if(navigator.share){await navigator.share({title,url:c.url});return true}
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(c.url);safe(()=>toast('Enlace de esta pantalla copiado'));return true}
  }catch(e){if(e?.name==='AbortError')return false}
  safe(()=>toast('No se pudo compartir esta pantalla'));return false;
}
function openPlayer(name,tries=0){
  if(!name)return false;
  if(window.RMPlayerExperience?.open){window.RMPlayerExperience.open(name);return true}
  if(typeof openPlayerHub==='function'){openPlayerHub(name);return true}
  if(tries<36)setTimeout(()=>openPlayer(name,tries+1),100);return false;
}
function openCompare(a,b,tries=0){
  if(!a||!b)return false;
  if(window.RMComparePro?.setDuel){window.RMComparePro.setDuel(a,b,false);return true}
  const A=document.getElementById('compareA'),B=document.getElementById('compareB');
  if(A&&B){A.value=a;B.value=b;A.dispatchEvent(new Event('change',{bubbles:true}));B.dispatchEvent(new Event('change',{bubbles:true}));return true}
  if(tries<36)setTimeout(()=>openCompare(a,b,tries+1),100);return false;
}
function scrollAnchor(id,tries=0){if(!id)return false;const el=document.getElementById(id);if(el){setTimeout(()=>el.scrollIntoView?.({behavior:'smooth',block:'start'}),40);return true}if(tries<30)setTimeout(()=>scrollAnchor(id,tries+1),100);return false}
function route(force=false){
  const q=new URL(location.href).searchParams,requested=q.get('section'),player=q.get('player'),a=q.get('a'),b=q.get('b'),anchor=q.get('anchor');
  if(!requested&&!player&&!a&&!b&&!anchor)return false;
  const section=requested||(player?'plantilla':a&&b?'comparador':activeSection());
  const signature=[section,player,a,b,anchor].join('|');if(!force&&signature===lastRoute)return false;lastRoute=signature;
  if(!sectionExists(section))return false;
  safe(()=>showSection(section));
  if(section==='plantilla'&&player)setTimeout(()=>openPlayer(player),120);
  if(section==='comparador'&&a&&b)setTimeout(()=>openCompare(a,b),150);
  if(anchor)setTimeout(()=>scrollAnchor(anchor),180);
  document.dispatchEvent(new CustomEvent('rm-deep-link-routed',{detail:{section,player,a,b,anchor}}));return true;
}
function playerUrl(name){return url('plantilla',{player:name})}
function compareUrl(a,b){return url('comparador',{a,b})}
function sectionUrl(section,anchor=''){return url(section,anchor?{anchor}:{})}
function install(){
  if(installed)return;if(typeof showSection!=='function'||!document.getElementById('inicio')){if(++attempts<100)setTimeout(install,80);return}
  installed=true;window.rmShareCurrent=shareCurrent;window.RMDeepLinks=Object.freeze({url,contextual,route,shareCurrent,playerUrl,compareUrl,sectionUrl});
  route(true);window.addEventListener('popstate',()=>route(true));document.dispatchEvent(new CustomEvent('rm-deep-links-ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();