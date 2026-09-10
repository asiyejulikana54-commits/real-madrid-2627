import { getStore } from "@netlify/blobs";

const SLOTS = ["gk","lb","lcb","rcb","rb","dm1","dm2","am","lw","rw","st"];
const ELIGIBLE = {
  Courtois:["gk"], Lunin:["gk"],
  Dumfries:["rb","rw"], "Trent Alexander-Arnold":["rb","dm1","dm2"],
  "Konaté":["lcb","rcb"], "Rüdiger":["lcb","rcb"], Huijsen:["lcb","rcb"], "Raúl Asencio":["lcb","rcb"],
  Cucurella:["lb"], "Álvaro Carreras":["lb"], "Ferland Mendy":["lb"],
  Valverde:["dm1","dm2","rb","rw"], "Bernardo Silva":["dm1","dm2","am","rw"], Camavinga:["dm1","dm2","lb"],
  "Tchouaméni":["dm1","dm2","lcb","rcb"], Bellingham:["am","dm1","dm2"], "Arda Güler":["am","rw","dm1","dm2"],
  "Brahim Díaz":["am","rw","lw"], "Thiago Pitarch":["dm1","dm2"], Mbappé:["st","lw"], "Vini Jr.":["lw","st"],
  Rodrygo:["lw","rw","st"], Diomande:["rw","lw"], Endrick:["st"], "Carlos Espí":["st"]
};

const MATCHES = [
  { id:"rayo-2026-09-12", rival:"Rayo", closesAt:"2026-09-12T17:55:00Z", officialXI:null }
];

function storeFor(){return getStore("rm-community", { consistency:"strong" })}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function cleanAlias(value){return String(value||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,24)}
function validParticipantId(value){return typeof value==="string" && /^[A-Za-z0-9_-]{16,80}$/.test(value)}
function validateXI(xi){if(!xi||typeof xi!=="object")return "XI no válido";const values=[];for(const slot of SLOTS){const name=xi[slot];if(typeof name!=="string"||!ELIGIBLE[name]||!ELIGIBLE[name].includes(slot))return `Jugador no válido en ${slot}`;values.push(name)}if(new Set(values).size!==11)return "No se pueden repetir jugadores";return null}
async function readPredictions(store,prefix){const {blobs}=await store.list({prefix});const rows=[];for(const b of blobs){const row=await store.get(b.key,{type:"json"});if(row)rows.push(row)}return rows}
function summarize(predictions){const total=predictions.length,slotShares={},popularXI={};for(const slot of SLOTS){const counts={};for(const p of predictions){const name=p.xi?.[slot];if(name)counts[name]=(counts[name]||0)+1}const rows=Object.entries(counts).map(([name,count])=>({name,count,percentage:total?Math.round(count*1000/total)/10:0})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,"es"));slotShares[slot]=rows;if(rows[0])popularXI[slot]=rows[0]}return {total,slotShares,popularXI}}

export default async (req) => {
  const match=MATCHES[0];
  try{
    const store=storeFor();
    if(req.method==="GET"){
      const predictions=await readPredictions(store,`predictions/${match.id}/`);const s=summarize(predictions);
      return json({match:{id:match.id,rival:match.rival,closesAt:match.closesAt,closed:Date.now()>=Date.parse(match.closesAt)},totalPredictions:s.total,slotShares:s.slotShares,popularXI:s.popularXI,scoredMatches:0,leaderboard:[]});
    }
    if(req.method==="POST"){
      if(Date.now()>=Date.parse(match.closesAt))return json({error:"La predicción de este partido ya está cerrada"},409);
      const body=await req.json();
      if(body.matchId!==match.id)return json({error:"Partido no válido"},400);
      if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);
      const alias=cleanAlias(body.alias);if(alias.length<2)return json({error:"El apodo debe tener al menos 2 caracteres"},400);
      const xiError=validateXI(body.xi);if(xiError)return json({error:xiError},400);
      const key=`predictions/${match.id}/${body.participantId}.json`;const previous=await store.get(key,{type:"json"});
      await store.setJSON(key,{matchId:match.id,participantId:body.participantId,alias,xi:body.xi,updatedAt:new Date().toISOString()});
      return json({ok:true,updated:Boolean(previous)});
    }
    return new Response(null,{status:405,headers:{allow:"GET, POST"}})
  }catch(error){console.error("community-v2",error);return json({error:"Servicio comunitario temporalmente no disponible"},500)}
};
