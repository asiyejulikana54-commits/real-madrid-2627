(()=>{
const BACKUP_TYPE='rm2627-full-backup';
const BACKUP_VERSION='2.0';
const APP_KEY=/^rm_/i;
let installed=false;

function toastSafe(msg){try{if(typeof toast==='function')toast(msg)}catch{}}
function appStorage(){
  const out={};
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key||!APP_KEY.test(key))continue;
      out[key]=localStorage.getItem(key);
    }
  }catch{}
  return out;
}
function summary(storage){
  const keys=Object.keys(storage||{});
  return {
    keys:keys.length,
    predictions:keys.filter(k=>/^rm_prediction_/i.test(k)&&k!=='rm_prediction_history_v1').length,
    hasHistory:keys.includes('rm_prediction_history_v1'),
    hasFavorites:keys.includes('rm_player_favorites_v1'),
    hasLineups:keys.includes('rm_lineups'),
    hasIdentity:keys.includes('rm_community_participant_id')
  };
}
function downloadJson(payload){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  const day=new Date().toISOString().slice(0,10);a.download=`rm_2627_copia_completa_${day}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function exportFull(){
  const storage=appStorage();
  const payload={type:BACKUP_TYPE,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),app:'RM 26/27',storage,summary:summary(storage)};
  downloadJson(payload);toastSafe('Copia completa exportada');
}
function validStorage(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const clean={};
  for(const [key,value] of Object.entries(raw)){
    if(!APP_KEY.test(key))continue;
    if(typeof value==='string')clean[key]=value;
    else if(value!==undefined&&value!==null)clean[key]=JSON.stringify(value);
  }
  return clean;
}
function restoreFull(data){
  const storage=validStorage(data.storage);if(!storage)throw new Error('Copia completa no válida');
  const count=Object.keys(storage).length;if(!count)throw new Error('La copia no contiene datos de RM 26/27');
  if(!window.confirm(`Se restaurará tu perfil local completo (${count} datos) y sustituirá el perfil guardado en este dispositivo. ¿Continuar?`))return false;
  const remove=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&APP_KEY.test(key))remove.push(key)}
  remove.forEach(k=>localStorage.removeItem(k));Object.entries(storage).forEach(([k,v])=>localStorage.setItem(k,v));
  toastSafe('Perfil restaurado · recargando…');setTimeout(()=>location.reload(),650);return true;
}
function restoreLegacy(data){
  if(!data||typeof data!=='object')throw new Error('Archivo no válido');
  let changed=false;
  if(typeof data.notes==='string'){localStorage.setItem('rm_notes',data.notes);changed=true}
  if(data.prediction?.matchId){localStorage.setItem(`rm_prediction_${data.prediction.matchId}`,JSON.stringify(data.prediction));changed=true}
  if(!changed)throw new Error('Archivo no compatible');
  toastSafe('Copia antigua importada · recargando…');setTimeout(()=>location.reload(),650);return true;
}
async function importFile(file){
  const text=await file.text();let data;try{data=JSON.parse(text)}catch{throw new Error('El archivo no es JSON válido')}
  if(data?.type===BACKUP_TYPE&&data?.storage)return restoreFull(data);
  return restoreLegacy(data);
}
function interceptImport(){
  const input=document.getElementById('importFile');if(!input||input.dataset.rmFullBackup==='1')return false;
  input.dataset.rmFullBackup='1';
  input.addEventListener('change',async event=>{
    event.stopImmediatePropagation();
    const file=input.files?.[0];if(!file)return;
    try{await importFile(file)}catch(error){toastSafe(error?.message||'No se pudo importar la copia')}finally{input.value=''}
  },true);
  return true;
}
function improveLabels(){
  document.querySelectorAll('.ux-sheet-tools button').forEach(btn=>{
    const text=(btn.textContent||'').trim();
    if(/exportar datos/i.test(text))btn.textContent='⇩ Exportar copia completa';
    if(/importar datos/i.test(text))btn.textContent='⇧ Importar copia completa';
  });
}
function install(){
  if(installed)return;if(!document.getElementById('importFile')){setTimeout(install,100);return}
  installed=true;window.exportData=exportFull;interceptImport();improveLabels();
  const observer=new MutationObserver(()=>{interceptImport();improveLabels()});observer.observe(document.body,{childList:true,subtree:true});
  window.RMBackup=Object.freeze({export:exportFull,importFile,summary:()=>summary(appStorage())});
}
setTimeout(install,40);
})();