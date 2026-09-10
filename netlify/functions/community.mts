import { getDeployStore, getStore } from "@netlify/blobs";

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

function storeFor(context){
  const deployContext = context?.deploy?.context || globalThis?.Netlify?.context?.deploy?.context;
  return deployContext === "production" ? getStore("rm-community", { consistency:"strong" }) : getDeployStore("rm-community-preview");
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function cleanAlias(value){return String(value||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,24)}
function validParticipantId(value){return typeof value==="string" && /^[A-Za-z0-9_-]{16,80}$/.test(value)}
function currentMatch(){return MATCHES[0]}
function validateXI(xi){
  if(!xi || typeof xi!=="object") return "XI no válido";
  const values=[];
  for(const slot of SLOTS){
    const name=xi[slot];
    if(typeof name!=="string" || !ELIGIBLE[name] || !ELIGIBLE[name].includes(slot)) return `Jugador no válido en ${slot}`;
    values.push(name);
  }
  if(new Set(values).size!==11) return "No se pueden repetir jugadores";
  return null;
}
async function readPredictions(store,prefix){
  const { blobs }=await store.list({prefix});
  const rows=[];
  await Promise.all(blobs.map(async b=>{const row=await store.get(b.key,{type:"json"});if(row)rows.push(row)}));
  return rows;
}
function score(prediction,match){
  if(!Array.isArray(match.officialXI))return null;
  const actual=new Set(match.officialXI);const selected=Object.values(prediction.xi||{});
  return selected.filter(name=>actual.has(name)).length;
}
function summarizeCurrent(predictions){
  const total=predictions.length;const slotShares={};const popularXI={};
  for(const slot of SLOTS){
    const counts={};for(const p of predictions){const name=p.xi?.[slot];if(name)counts[name]=(counts[name]||0)+1}
    const rows=Object.entries(counts).map(([name,count])=>({name,count,percentage:total?Math.round(count*1000/total)/10:0})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,"es"));
    slotShares[slot]=rows;if(rows[0])popularXI[slot]=rows[0];
  }
  return {total,slotShares,popularXI};
}
async function buildLeaderboard(store){
  const scored=MATCHES.filter(m=>Array.isArray(m.officialXI));
  if(!scored.length)return {scoredMatches:0,leaderboard:[]};
  const all=await readPredictions(store,"predictions/");const users=new Map();
  for(const p of all){
    const match=scored.find(m=>m.id===p.matchId);if(!match)continue;
    const hits=score(p,match);if(hits===null)continue;
    const u=users.get(p.participantId)||{participantId:p.participantId,alias:p.alias,hits:0,possible:0,scoredMatches:0,perfect:0,lastAt:p.updatedAt};
    u.alias=p.alias||u.alias;u.hits+=hits;u.possible+=11;u.scoredMatches+=1;u.perfect+=hits===11?1:0;u.lastAt=p.updatedAt||u.lastAt;users.set(p.participantId,u);
  }
  const leaderboard=[...users.values()].sort((a,b)=>b.hits-a.hits||b.perfect-a.perfect||b.scoredMatches-a.scoredMatches||String(a.alias).localeCompare(String(b.alias),"es")).slice(0,50);
  return {scoredMatches:scored.length,leaderboard};
}

export default async (req, context) => {
  const store=storeFor(context);const match=currentMatch();
  if(req.method==="GET"){
    try{
      const predictions=await readPredictions(store,`predictions/${match.id}/`);
      const summary=summarizeCurrent(predictions);const ranking=await buildLeaderboard(store);
      return json({match:{id:match.id,rival:match.rival,closesAt:match.closesAt,closed:Date.now()>=Date.parse(match.closesAt)||Array.isArray(match.officialXI)},totalPredictions:summary.total,slotShares:summary.slotShares,popularXI:summary.popularXI,...ranking});
    }catch(error){console.error(error);return json({error:"No se pudo cargar la comunidad"},500)}
  }
  if(req.method==="POST"){
    try{
      if(Date.now()>=Date.parse(match.closesAt)||Array.isArray(match.officialXI))return json({error:"La predicción de este partido ya está cerrada"},409);
      const body=await req.json();
      if(body.matchId!==match.id)return json({error:"Partido no válido"},400);
      if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);
      const alias=cleanAlias(body.alias);if(alias.length<2)return json({error:"El apodo debe tener al menos 2 caracteres"},400);
      const xiError=validateXI(body.xi);if(xiError)return json({error:xiError},400);
      const key=`predictions/${match.id}/${body.participantId}.json`;
      const previous=await store.get(key,{type:"json"});
      await store.setJSON(key,{matchId:match.id,participantId:body.participantId,alias,xi:body.xi,updatedAt:new Date().toISOString()});
      return json({ok:true,updated:Boolean(previous)});
    }catch(error){console.error(error);return json({error:"No se pudo guardar la predicción"},500)}
  }
  return new Response(null,{status:405,headers:{allow:"GET, POST"}});
};

export const config={path:"/api/community"};
