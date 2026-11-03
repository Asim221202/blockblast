// Block Blast Düello sunucusu: statik dosyalar + WebSocket oda yönetimi
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const MAX_PLAYERS = 2;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 8 * 1024 });
const rooms = new Map(); // kod -> Map(id -> { ws, presence })
let nextId = 1;

function broadcast(code) {
  const room = rooms.get(code);
  if (!room) return;
  const peers = [...room].map(([id, c]) => ({ id, presence: c.presence }));
  const msg = JSON.stringify({ t: 'peers', peers });
  for (const c of room.values()) if (c.ws.readyState === 1) c.ws.send(msg);
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  let code = null, id = null;

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return; }
    if (m.t === 'join' && !code) {
      if (typeof m.room !== 'string' || !/^[a-z0-9]{4}$/.test(m.room)) return ws.close();
      const room = rooms.get(m.room) || new Map();
      if (room.size >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'full' })); return ws.close(); }
      code = m.room; id = 'p' + nextId++;
      room.set(id, { ws, presence: {} });
      rooms.set(code, room);
      ws.send(JSON.stringify({ t: 'joined', id }));
      broadcast(code);
    } else if (m.t === 'presence' && code) {
      const c = rooms.get(code)?.get(id);
      if (!c || typeof m.data !== 'object' || m.data === null) return;
      Object.assign(c.presence, m.data);
      broadcast(code);
    }
  });

  ws.on('close', () => {
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.delete(id);
    if (room.size === 0) rooms.delete(code); else broadcast(code);
  });
});

// Kopan bağlantıları temizle
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 30000);

server.listen(PORT, () => console.log('Block Blast Düello: http://localhost:' + PORT));
