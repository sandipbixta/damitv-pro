const http = require("http");

// In-memory storage for active viewers
const viewers = new Map(); // matchId -> Map(sessionId -> lastHeartbeat)
const TIMEOUT = 60000; // 60 seconds timeout

// Clean up stale sessions every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [matchId, sessions] of viewers.entries()) {
    for (const [sessionId, lastHeartbeat] of sessions.entries()) {
      if (now - lastHeartbeat > TIMEOUT) {
        sessions.delete(sessionId);
      }
    }
    if (sessions.size === 0) {
      viewers.delete(matchId);
    }
  }
}, 30000);

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, "http://localhost");

  // POST /heartbeat?match=ID&session=ID - Register/update viewer
  if (req.method === "POST" && url.pathname === "/heartbeat") {
    const matchId = url.searchParams.get("match");
    const sessionId = url.searchParams.get("session");

    if (matchId && sessionId) {
      if (!viewers.has(matchId)) {
        viewers.set(matchId, new Map());
      }
      viewers.get(matchId).set(sessionId, Date.now());
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // POST /leave?match=ID&session=ID - Remove viewer
  if (req.method === "POST" && url.pathname === "/leave") {
    const matchId = url.searchParams.get("match");
    const sessionId = url.searchParams.get("session");

    if (matchId && sessionId && viewers.has(matchId)) {
      viewers.get(matchId).delete(sessionId);
      if (viewers.get(matchId).size === 0) {
        viewers.delete(matchId);
      }
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GET /count?match=ID - Get viewer count for a match
  if (req.method === "GET" && url.pathname === "/count") {
    const matchId = url.searchParams.get("match");
    const count = matchId && viewers.has(matchId) ? viewers.get(matchId).size : 0;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count }));
    return;
  }

  // GET /counts?matches=ID1,ID2,ID3 - Get counts for multiple matches
  if (req.method === "GET" && url.pathname === "/counts") {
    const matchIds = (url.searchParams.get("matches") || "").split(",").filter(Boolean);
    const counts = {};

    for (const matchId of matchIds) {
      counts[matchId] = viewers.has(matchId) ? viewers.get(matchId).size : 0;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(counts));
    return;
  }

  // GET /stats - Get total stats
  if (req.method === "GET" && url.pathname === "/stats") {
    let totalViewers = 0;
    const matchCounts = {};

    for (const [matchId, sessions] of viewers.entries()) {
      matchCounts[matchId] = sessions.size;
      totalViewers += sessions.size;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ totalViewers, matches: matchCounts }));
    return;
  }

  // Health check
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3005, () => {
  console.log("Viewer counter running on port 3005");
});
