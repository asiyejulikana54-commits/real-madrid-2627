import { getStore, getDeployStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";

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

// Para puntuar una jornada basta con conservar aquí su XI oficial antes de pasar al siguiente partido.
// Nunca se reconstruyen predicciones antiguas: solo se puntúan registros realmente guardados en Blobs.
const MATCHES = [
  { id:"rayo-2026-09-12", rival:"Rayo", closesAt:"2026-09-12T17:55:00Z", officialXI:null }
];

function storeFor(){return Netlify.context?.deploy?.context==="production"?getStore("rm-community",{consistency:"strong"}):getDeployStore("rm-community")}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function cleanAlias(value){return String(value||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,24)}
function cleanLeagueName(value){return String(value||"").replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,32)}
function validParticipantId(value){return typeof value==="string" && /^[A-Za-z0-9_-]{16,80}$/.test(value)}
function normalizeCode(value){return String(value||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8)}
function validateXI(xi){if(!xi||typeof xi!=="object")return "XI no válido";const values=[];for(const slot of SLOTS){const name=xi[slot];if(typeof name!=="string"||!ELIGIBLE[name]||!ELIGIBLE[name].includes(slot))return `Jugador no válido en ${slot}`;values.push(name)}if(new Set(values).size!==11)return "No se pueden repetir jugadores";return null}
function currentMatch(){return MATCHES[0]}
function scoredMatches(){return MATCHES.filter(m=>Array.isArray(m.officialXI)&&m.officialXI.length===11).sort((a,b)=>Date.parse(a.closesAt)-Date.parse(b.closesAt))}
async function readRows(store,prefix){const {blobs}=await store.list({prefix});const rows=[];for(const b of blobs){const row=await store.get(b.key,{type:"json"});if(row)rows.push(row)}return rows}
async function readPredictions(store,matchId){return readRows(store,`predictions/${matchId}/`)}
function scoreXI(xi,officialXI){if(!xi||!Array.isArray(officialXI))return null;const predicted=new Set(Object.values(xi).filter(Boolean)),official=new Set(officialXI);let hits=0;for(const name of predicted)if(official.has(name))hits++;return hits}
function summarize(predictions){
  const total=predictions.length,slotShares={},popularXI={};
  const globalCounts={};
  for(const p of predictions){const uniquePlayers=new Set(Object.values(p.xi||{}).filter(Boolean));for(const name of uniquePlayers)globalCounts[name]=(globalCounts[name]||0)+1}
  for(const slot of SLOTS){
    const counts={};for(const p of predictions){const name=p.xi?.[slot];if(name)counts[name]=(counts[name]||0)+1}
    slotShares[slot]=Object.entries(counts).map(([name,count])=>({name,count,percentage:total?Math.round(count*1000/total)/10:0,globalCount:globalCounts[name]||0,globalPercentage:total?Math.round((globalCounts[name]||0)*1000/total)/10:0,multiPosition:(ELIGIBLE[name]?.length||0)>1})).sort((a,b)=>b.count-a.count||b.globalCount-a.globalCount||a.name.localeCompare(b.name,"es"));
  }
  if(!total)return {total,slotShares,popularXI};
  const players=[...new Set(SLOTS.flatMap(slot=>(slotShares[slot]||[]).map(row=>row.name)))];
  const playerBit=new Map(players.map((name,index)=>[name,1n<<BigInt(index)]));
  const order=[...SLOTS].sort((a,b)=>(slotShares[a]?.length||0)-(slotShares[b]?.length||0)||a.localeCompare(b,"es"));
  const memo=new Map();const signature=picks=>SLOTS.map(slot=>picks[slot]?.name||"~").join("|");
  function solve(index,usedMask){
    if(index===order.length)return {score:0,globalScore:0,preference:0,picks:{}};
    const key=`${index}:${usedMask.toString()}`;if(memo.has(key))return memo.get(key);const slot=order[index];let best=null;
    for(const row of slotShares[slot]||[]){const bit=playerBit.get(row.name);if(bit===undefined||(usedMask&bit)!==0n)continue;const rest=solve(index+1,usedMask|bit);if(!rest)continue;const prefIndex=ELIGIBLE[row.name]?.indexOf(slot)??99;const candidate={score:row.count+rest.score,globalScore:(row.globalCount||0)+rest.globalScore,preference:prefIndex+rest.preference,picks:{...rest.picks,[slot]:row}};if(!best||candidate.score>best.score||(candidate.score===best.score&&candidate.globalScore>best.globalScore)||(candidate.score===best.score&&candidate.globalScore===best.globalScore&&candidate.preference<best.preference)||(candidate.score===best.score&&candidate.globalScore===best.globalScore&&candidate.preference===best.preference&&signature(candidate.picks).localeCompare(signature(best.picks),"es")<0))best=candidate}
    memo.set(key,best);return best;
  }
  const result=solve(0,0n);if(result)for(const slot of SLOTS)if(result.picks[slot])popularXI[slot]=result.picks[slot];
  return {total,slotShares,popularXI};
}

async function competitionState(store){
  const matches=scoredMatches(),byMatch=new Map(),participants=new Map();
  for(const match of matches){const predictions=await readPredictions(store,match.id);byMatch.set(match.id,predictions);for(const p of predictions){const id=p.participantId;if(!validParticipantId(id))continue;const row=participants.get(id)||{participantId:id,alias:cleanAlias(p.alias)||"Usuario",aliasAt:"",scores:{}};if(String(p.updatedAt||"")>=row.aliasAt){row.alias=cleanAlias(p.alias)||row.alias;row.aliasAt=String(p.updatedAt||"")}row.scores[match.id]=scoreXI(p.xi,match.officialXI);participants.set(id,row)}}
  const leaderboard=[];
  for(const row of participants.values()){
    let hits=0,played=0,perfect=0;for(const match of matches){const score=row.scores[match.id];if(Number.isFinite(score)){hits+=score;played++;if(score===11)perfect++}}
    let participationStreak=0,streak8=0;for(let i=matches.length-1;i>=0;i--){const score=row.scores[matches[i].id];if(!Number.isFinite(score))break;participationStreak++}for(let i=matches.length-1;i>=0;i--){const score=row.scores[matches[i].id];if(!Number.isFinite(score)||score<8)break;streak8++}
    const latest=matches.length?row.scores[matches.at(-1).id]:null;leaderboard.push({participantId:row.participantId,alias:row.alias,hits,possible:played*11,scoredMatches:played,avg:played?Math.round(hits/played*100)/100:null,accuracy:played?Math.round(hits/(played*11)*1000)/10:null,perfect,participationStreak,streak8,lastScore:Number.isFinite(latest)?latest:null})
  }
  leaderboard.sort((a,b)=>b.hits-a.hits||(b.avg??-1)-(a.avg??-1)||b.perfect-a.perfect||a.alias.localeCompare(b.alias,"es"));leaderboard.forEach((r,i)=>r.rank=i+1);
  const latestMatch=matches.at(-1)||null,roundLeaderboard=[];if(latestMatch){for(const p of byMatch.get(latestMatch.id)||[]){const hits=scoreXI(p.xi,latestMatch.officialXI);roundLeaderboard.push({participantId:p.participantId,alias:cleanAlias(p.alias)||"Usuario",hits,possible:11})}roundLeaderboard.sort((a,b)=>b.hits-a.hits||a.alias.localeCompare(b.alias,"es"));roundLeaderboard.forEach((r,i)=>r.rank=i+1)}
  return {scoredMatches:matches.length,leaderboard,roundLeaderboard,latestScoredMatch:latestMatch?{id:latestMatch.id,rival:latestMatch.rival}:null};
}
async function participantLeagueRefs(store,participantId){if(!validParticipantId(participantId))return [];return readRows(store,`participant-leagues/${participantId}/`)}
async function leagueMemberRows(store,code){return readRows(store,`league-members/${code}/`)}
async function leagueView(store,code,competition,participantId=null){
  const league=await store.get(`leagues/${code}.json`,{type:"json"});if(!league)return null;const members=await leagueMemberRows(store,code),stats=new Map(competition.leaderboard.map(r=>[r.participantId,r]));
  const ranking=members.map(m=>{const s=stats.get(m.participantId);return s?{...s,alias:s.alias||m.alias}:{participantId:m.participantId,alias:m.alias||"Usuario",hits:0,possible:0,scoredMatches:0,avg:null,accuracy:null,perfect:0,participationStreak:0,streak8:0,lastScore:null}}).sort((a,b)=>b.hits-a.hits||(b.avg??-1)-(a.avg??-1)||a.alias.localeCompare(b.alias,"es"));ranking.forEach((r,i)=>r.rank=i+1);
  const roundMap=new Map(competition.roundLeaderboard.map(r=>[r.participantId,r])),roundRanking=members.map(m=>roundMap.get(m.participantId)||{participantId:m.participantId,alias:m.alias||"Usuario",hits:null,possible:11}).filter(r=>Number.isFinite(r.hits)).sort((a,b)=>b.hits-a.hits||a.alias.localeCompare(b.alias,"es"));roundRanking.forEach((r,i)=>r.rank=i+1);
  return {code:league.code,name:league.name,createdAt:league.createdAt,ownerParticipantId:league.ownerParticipantId,memberCount:members.length,amOwner:Boolean(participantId&&league.ownerParticipantId===participantId),amMember:Boolean(participantId&&members.some(m=>m.participantId===participantId)),ranking,roundRanking,latestScoredMatch:competition.latestScoredMatch};
}
async function myLeagues(store,participantId){
  if(!validParticipantId(participantId))return [];const refs=await participantLeagueRefs(store,participantId),out=[];
  for(const ref of refs.slice(0,8)){const code=normalizeCode(ref.code);if(!code)continue;const league=await store.get(`leagues/${code}.json`,{type:"json"});if(!league)continue;const members=await store.list({prefix:`league-members/${code}/`});out.push({code,name:league.name,createdAt:league.createdAt,owner:league.ownerParticipantId===participantId,memberCount:members.blobs.length})}
  return out.sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
}
async function syncMembershipAliases(store,participantId,alias){const refs=await participantLeagueRefs(store,participantId);for(const ref of refs.slice(0,8)){const code=normalizeCode(ref.code);if(code)await store.setJSON(`league-members/${code}/${participantId}.json`,{participantId,alias,joinedAt:ref.joinedAt||new Date().toISOString()})}}
async function uniqueLeagueCode(store){for(let i=0;i<12;i++){const code=randomBytes(4).toString("hex").slice(0,6).toUpperCase();if(!(await store.get(`leagues/${code}.json`,{type:"json"})))return code}throw new Error("No se pudo generar código de liga")}
async function addMember(store,code,participantId,alias){
  const refs=await participantLeagueRefs(store,participantId),already=refs.some(x=>normalizeCode(x.code)===code);if(!already&&refs.length>=8)throw new Error("Máximo de 8 ligas privadas por dispositivo");
  const now=new Date().toISOString();await store.setJSON(`league-members/${code}/${participantId}.json`,{participantId,alias,joinedAt:now});await store.setJSON(`participant-leagues/${participantId}/${code}.json`,{code,joinedAt:now});
}

export default async (req: Request) => {
  const match=currentMatch();
  try{
    const store=storeFor(),url=new URL(req.url),participantId=url.searchParams.get("participantId")||"",leagueCode=normalizeCode(url.searchParams.get("league"));
    if(req.method==="GET"){
      const predictions=await readPredictions(store,match.id),s=summarize(predictions),competition=await competitionState(store);
      if(leagueCode){const league=await leagueView(store,leagueCode,competition,participantId);if(!league)return json({error:"Liga no encontrada"},404);return json({league,competition:{scoredMatches:competition.scoredMatches,latestScoredMatch:competition.latestScoredMatch}})}
      const mine=validParticipantId(participantId)?competition.leaderboard.find(r=>r.participantId===participantId)||null:null;
      return json({match:{id:match.id,rival:match.rival,closesAt:match.closesAt,closed:Date.now()>=Date.parse(match.closesAt)},totalPredictions:s.total,slotShares:s.slotShares,popularXI:s.popularXI,scoredMatches:competition.scoredMatches,leaderboard:competition.leaderboard,roundLeaderboard:competition.roundLeaderboard,latestScoredMatch:competition.latestScoredMatch,myCompetition:mine,myLeagues:validParticipantId(participantId)?await myLeagues(store,participantId):[]});
    }
    if(req.method==="POST"){
      const body=await req.json(),action=String(body.action||"prediction");
      if(action==="createLeague"){
        if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);const alias=cleanAlias(body.alias),name=cleanLeagueName(body.name);if(alias.length<2)return json({error:"El apodo debe tener al menos 2 caracteres"},400);if(name.length<3)return json({error:"El nombre de la liga debe tener al menos 3 caracteres"},400);
        const code=await uniqueLeagueCode(store),createdAt=new Date().toISOString();await store.setJSON(`leagues/${code}.json`,{code,name,ownerParticipantId:body.participantId,createdAt});await addMember(store,code,body.participantId,alias);return json({ok:true,league:{code,name,createdAt,memberCount:1}},201)
      }
      if(action==="joinLeague"){
        if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);const alias=cleanAlias(body.alias),code=normalizeCode(body.code);if(alias.length<2)return json({error:"El apodo debe tener al menos 2 caracteres"},400);if(!code)return json({error:"Código de liga no válido"},400);const league=await store.get(`leagues/${code}.json`,{type:"json"});if(!league)return json({error:"Liga no encontrada"},404);await addMember(store,code,body.participantId,alias);const members=await store.list({prefix:`league-members/${code}/`});return json({ok:true,league:{code,name:league.name,memberCount:members.blobs.length}})
      }
      if(action==="leaveLeague"){
        if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);const code=normalizeCode(body.code);if(!code)return json({error:"Código de liga no válido"},400);const league=await store.get(`leagues/${code}.json`,{type:"json"});if(!league)return json({error:"Liga no encontrada"},404);if(league.ownerParticipantId===body.participantId)return json({error:"El creador no puede abandonar su propia liga"},409);await store.delete(`league-members/${code}/${body.participantId}.json`);await store.delete(`participant-leagues/${body.participantId}/${code}.json`);return json({ok:true})
      }
      if(Date.now()>=Date.parse(match.closesAt))return json({error:"La predicción de este partido ya está cerrada"},409);
      if(body.matchId!==match.id)return json({error:"Partido no válido"},400);if(!validParticipantId(body.participantId))return json({error:"Identificador no válido"},400);const alias=cleanAlias(body.alias);if(alias.length<2)return json({error:"El apodo debe tener al menos 2 caracteres"},400);const xiError=validateXI(body.xi);if(xiError)return json({error:xiError},400);
      const key=`predictions/${match.id}/${body.participantId}.json`,previous=await store.get(key,{type:"json"});await store.setJSON(key,{matchId:match.id,participantId:body.participantId,alias,xi:body.xi,updatedAt:new Date().toISOString()});await syncMembershipAliases(store,body.participantId,alias);return json({ok:true,updated:Boolean(previous)})
    }
    return new Response(null,{status:405,headers:{allow:"GET, POST"}})
  }catch(error){console.error("community-v2",error);return json({error:error instanceof Error?error.message:"Servicio comunitario temporalmente no disponible"},500)}
};