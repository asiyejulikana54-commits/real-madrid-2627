(()=>{
  const endpoint='https://vvltmdedwgjtvlcmindn.supabase.co/functions/v1/community';
  const apiUrl=params=>{const url=new URL(endpoint);for(const [key,value] of Object.entries(params||{}))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));return url.href};
  communityBackendAvailable=function(){return /^https?:$/.test(location.protocol)};
  communityApiUrl=apiUrl;
  window.RMCommunityApi=Object.freeze({url:apiUrl,available:communityBackendAvailable,participantId:getParticipantId,refresh:()=>loadCommunity(true)});
  if(document.readyState!=='loading')setTimeout(()=>loadCommunity(true),0);
  else document.addEventListener('DOMContentLoaded',()=>loadCommunity(true),{once:true});
})();