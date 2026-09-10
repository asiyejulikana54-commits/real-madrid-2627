import { getStore } from "@netlify/blobs";

const MATCHES = [
  { id: "betis", label: "Real Madrid · Betis", comp: "LaLiga" },
  { id: "malaga", label: "Real Madrid · Málaga", comp: "LaLiga" },
  { id: "real-sociedad", label: "Real Madrid · Real Sociedad", comp: "LaLiga" },
  { id: "espanyol", label: "Real Madrid · Espanyol", comp: "LaLiga" },
  { id: "inter", label: "Real Madrid · Inter", comp: "Champions" }
];

const PLAYERS = [
  "Courtois","Lunin","Dumfries","Trent Alexander-Arnold","Konaté","Rüdiger","Huijsen","Raúl Asencio",
  "Cucurella","Álvaro Carreras","Ferland Mendy","Valverde","Bernardo Silva","Camavinga","Tchouaméni",
  "Bellingham","Arda Güler","Brahim Díaz","Thiago Pitarch","Mbappé","Vini Jr.","Rodrygo","Diomande","Endrick","Carlos Espí"
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function validParticipantId(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,80}$/.test(value);
}
function storeFor() {
  return getStore("rm-mvp", { consistency: "strong" });
}
async function readVotes(store: any, matchId: string) {
  const { blobs } = await store.list({ prefix: `votes/${matchId}/` });
  const rows = [];
  for (const blob of blobs) {
    const row = await store.get(blob.key, { type: "json" });
    if (row) rows.push(row);
  }
  return rows;
}
function summarizeMatch(match: any, rows: any[], participantId?: string) {
  const counts: Record<string, number> = {};
  for (const row of rows) if (PLAYERS.includes(row.player)) counts[row.player] = (counts[row.player] || 0) + 1;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const ranking = Object.entries(counts)
    .map(([player, count]) => ({ player, count, percentage: total ? Math.round(count * 1000 / total) / 10 : 0 }))
    .sort((a, b) => b.count - a.count || a.player.localeCompare(b.player, "es"));
  const selected = participantId ? rows.find(r => r.participantId === participantId)?.player || null : null;
  return { ...match, totalVotes: total, selected, ranking };
}

export default async (req: Request) => {
  try {
    const store = storeFor();
    if (req.method === "GET") {
      const url = new URL(req.url);
      const rawParticipant = url.searchParams.get("participantId") || undefined;
      const participantId = rawParticipant && validParticipantId(rawParticipant) ? rawParticipant : undefined;
      const summaries = [];
      const allCounts: Record<string, number> = {};
      const wins: Record<string, number> = {};
      for (const match of MATCHES) {
        const rows = await readVotes(store, match.id);
        const summary = summarizeMatch(match, rows, participantId);
        summaries.push(summary);
        for (const item of summary.ranking) allCounts[item.player] = (allCounts[item.player] || 0) + item.count;
        if (summary.ranking.length) {
          const best = summary.ranking[0].count;
          summary.ranking.filter((x: any) => x.count === best).forEach((x: any) => { wins[x.player] = (wins[x.player] || 0) + 1; });
        }
      }
      const season = PLAYERS.map(player => ({ player, votes: allCounts[player] || 0, wins: wins[player] || 0 }))
        .filter(x => x.votes > 0 || x.wins > 0)
        .sort((a, b) => b.wins - a.wins || b.votes - a.votes || a.player.localeCompare(b.player, "es"));
      return json({ matches: summaries, season, totalVotes: summaries.reduce((a, m) => a + m.totalVotes, 0) });
    }
    if (req.method === "POST") {
      const body = await req.json();
      if (!validParticipantId(body.participantId)) return json({ error: "Identificador no válido" }, 400);
      if (!MATCHES.some(m => m.id === body.matchId)) return json({ error: "Partido no válido" }, 400);
      if (typeof body.player !== "string" || !PLAYERS.includes(body.player)) return json({ error: "Jugador no válido" }, 400);
      const key = `votes/${body.matchId}/${body.participantId}.json`;
      const previous = await store.get(key, { type: "json" });
      await store.setJSON(key, { matchId: body.matchId, participantId: body.participantId, player: body.player, updatedAt: new Date().toISOString() });
      return json({ ok: true, updated: Boolean(previous) });
    }
    return new Response(null, { status: 405, headers: { allow: "GET, POST" } });
  } catch (error) {
    console.error("mvp", error);
    return json({ error: "No se pudo cargar la votación MVP" }, 500);
  }
};
