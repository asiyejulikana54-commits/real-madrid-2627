(()=>{
const ROUTE_KEYS=['section','player','a','b','anchor','pick'];
let installed=false,attempts=0,restoring=false,wrapped=false;
function safe(fn,fallback=null){try{return fn()}catch{return fallback}}
function active(){return document.querySelector('.section.active')?.id||'inicio'}
function sectionExists(id){return Boolean(id&&document.getElementById(id)?.classList.contains('section'))}
function inferredSection(){
  const q=new URL(location.href).searchParams,requested=q.get('section');
  if(sectionExists(requested))return requested;
  if(q.get('player')&&sectionExists('plantilla'))return 'plantilla';
  if(q.get('a')&&q.get('b')&&sectionExists('comparador'))return 'comparador';
  return active();
}
function cleanUrl(section){
  const u=new URL(location.href);u.hash='';for(const key of ROUTE_KEYS)u.searchParams.delete(key);
  if(section&&section!=='inicio')u.searchParams.set('section',section);
  return u.href;
}
function stateFor(section){return {...(history.state||{}),rmSection:section,rmNav:true}}
function remember(section,href=location.href){try{history.replaceState(stateFor(section),'',href);return true}catch{return false}}
function push(section){try{history.pushState(stateFor(section),'',cleanUrl(section));return true}catch{return false}}
function hook(){
  if(wrapped||typeof showSection!=='function')return false;
  const base=showSection;
  showSection=function(id,...args){
    const valid=sectionExists(id),before=active(),stored=history.state?.rmSection;
    const shouldPush=valid&&!restoring&&id!==before&&stored!==id;
    if(shouldPush)push(id);
    const out=base.apply(this,[id,...args]);
    if(valid){remember(id,shouldPush?cleanUrl(id):location.href);document.dispatchEvent(new CustomEvent('rm-section-history-changed',{detail:{section:id,mode:restoring?'restore':shouldPush?'push':'replace'}}))}
    return out;
  };
  wrapped=true;return true;
}
function onPopstate(event){
  restoring=true;
  const target=sectionExists(event.state?.rmSection)?event.state.rmSection:inferredSection();
  if(target&&sectionExists(target)&&active()!==target)safe(()=>showSection(target));
  setTimeout(()=>{restoring=false},0);
}
function back(){
  if(history.length>1){history.back();return}
  if(active()!=='inicio')safe(()=>showSection('inicio'));
}
function state(){return {section:active(),stored:history.state?.rmSection||null,restoring}}
function install(){
  if(installed)return;
  if(typeof showSection!=='function'||!document.getElementById('inicio')){if(++attempts<100)setTimeout(install,80);return}
  installed=true;remember(inferredSection(),location.href);hook();window.addEventListener('popstate',onPopstate);
  window.RMNavigationHistory=Object.freeze({state,back});
  document.dispatchEvent(new CustomEvent('rm-navigation-history-ready',{detail:state()}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
install();
})();
