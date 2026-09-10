import { getDeployStore, getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

function matchConfig(){
  return {id:"rayo-2026-09-12",closesAt:"2026-09-12T17:55:00Z"};
}
function pollDefinitions(){
  return [
    {id:"ld",question:"¿Quién debería ser el lateral derecho?",options:["Dumfries","Trent"]},
    {id:"central",question:"¿Qué central quieres ver de inicio?",options:["Rüdiger","Konaté","Huijsen"]},
    {id:"descanso",question:"Si descansa uno, ¿a quién sentarías?",options:["Valverde","Bellingham","Ninguno"]},
    {id:"banda",question:"¿Quién debería ocupar la banda derecha?",options:["Diomandé","Brahim"]}
  ];
}
function json(data:unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
}
function validParticipantId(value:unknown){
  return typeof value==="string" && /^[A-Za-z0-9_-]{16,80}$/.test(value);
}
function storeFor(context:Context){
  return context?.deploy?.context==="production"
    ? getStore("rm-matchday",{consistency:"strong"})
    : getDeployStore("rm-matchday-preview");
}
async function readPoll(store:any,matchId:string,poll:any,participantId?:string){
  const prefix=`polls/${matchId}/${poll.id}/`;
  const {blobs}=await store.list({prefix});
  const counts=Object.fromEntries(poll.options.map((o:string)=>[o,0]));
  let selected:string|null=null;
  for(const blob of blobs){
    const row=await store.get(blob.key,{type:"json"});
    if(row?.option in counts)counts[row.option]+=1;
    if(participantId && row?.participantId===participantId)selected=row.option;
  }
  const total=Object.values(counts).reduce((a:number,b:any)=>a+Number(b||0),0);
  const options=poll.options.map((label:string)=>({label,count:counts[label]||0,percentage:total?Math.round((counts[label]||0)*1000/total)/10:0}));
  return {id:poll.id,question:poll.question,total,options,selected};
}

export default async (req:Request,context:Context) => {
  try{
    const match=matchConfig();
    const polls=pollDefinitions();
    const store=storeFor(context);
    if(req.method==="GET"){
      const url=new URL(req.url);
      const participantId=url.searchParams.get("participantId")||undefined;
      const safeParticipant=participantId&&validParticipantId(participantId)?participantId:undefined;
      const results=[];
      for(const poll of polls)results.push(await readPoll(store,match.id,poll,safeParticipant));
      return json({matchId:match.id,closesAt:match.closesAt,closed:Date.now()>=Date.parse(match.closesAt),polls:results});
    }
    if(req.method==="POST"){
      if(Date.now()>=Date.parse(match.closesAt))return json({error:"Las encuestas de este partido ya están cerradas"},409);
      const body=await req.json();
      if(body.matchId!==match.id)return json({error:"Partido no válido"},400);
      if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);
      const poll=polls.find(p=>p.id===body.pollId);
      if(!poll)return json({error:"Encuesta no válida"},400);
      if(typeof body.option!=="string"||!poll.options.includes(body.option))return json({error:"Opción no válida"},400);
      const key=`polls/${match.id}/${poll.id}/${body.participantId}.json`;
      const previous=await store.get(key,{type:"json"});
      await store.setJSON(key,{matchId:match.id,pollId:poll.id,participantId:body.participantId,option:body.option,updatedAt:new Date().toISOString()});
      return json({ok:true,updated:Boolean(previous)});
    }
    return new Response(null,{status:405,headers:{allow:"GET, POST"}});
  }catch(error){
    console.error("matchday",error);
    return json({error:"No se pudieron cargar las encuestas"},500);
  }
};
