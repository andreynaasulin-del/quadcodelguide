// Zero-dependency static + shared-world server.
// Run: node games/powderline/server/server.mjs

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const PORT = Number(process.env.PORT || 8020);
const WORLD_SEED = Number(process.env.WORLD_SEED || 482913);
const clients = new Map();
const players = new Map();

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const headers = { 'cache-control':'no-cache, no-store', 'access-control-allow-origin':'*' };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/world') return json(res, 200, { seed: WORLD_SEED, players: players.size });
    if (url.pathname === '/api/events') return events(req, res, url.searchParams.get('id'));
    if (url.pathname === '/api/state' && req.method === 'POST') return state(req, res);
    if (url.pathname === '/api/wipe' && req.method === 'POST') return wipe(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'method' });
    return staticFile(url.pathname, req, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) json(res, 500, { error:'server' });
  }
});

function events(req, res, id) {
  const key = cleanId(id);
  if (!key) return json(res, 400, { error:'id' });
  res.writeHead(200, { ...headers, 'content-type':'text/event-stream', connection:'keep-alive', 'x-accel-buffering':'no' });
  res.write(': connected\n\n');
  clients.set(key, res);
  send(res, { type:'snapshot', players:[...players.values()], leaders:leaderboard() });
  const ping = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(key);
    if (players.delete(key)) broadcast({ type:'leave', id:key });
  });
}

async function state(req, res) {
  const p = await body(req);
  const id = cleanId(p.id), name = cleanName(p.name);
  if (!id || !name) return json(res, 400, { error:'bad player' });
  const old = players.get(id);
  const player = {
    id, name,
    x:num(p.x,-1e6,1e6), y:num(p.y,-1e6,1e6), z:num(p.z,-1e6,1e7),
    yaw:num(p.yaw,-100,100), edge:num(p.edge,-2,2), speed:num(p.speed,0,200),
    flow:num(p.flow,0,1), distance:num(p.distance,0,1e9), state:num(p.state,0,2),
    seen:Date.now(), best:Math.max(old?.best || 0, num(p.distance,0,1e9)),
  };
  players.set(id, player);
  broadcast({ type:'player', player });
  if (!old || Math.floor(old.best / 25) !== Math.floor(player.best / 25)) broadcast({ type:'leaders', rows:leaderboard() });
  json(res, 200, { ok:true });
}

async function wipe(req, res) {
  const p = await body(req);
  const id = cleanId(p.id), old = players.get(id);
  if (old) { old.distance = 0; old.z = 0; players.set(id, old); broadcast({ type:'leaders', rows:leaderboard() }); }
  json(res, 200, { ok:true });
}

function leaderboard() {
  return [...players.values()].sort((a,b) => b.best - a.best).slice(0,16).map(({ id,name,best }) => ({ id,name,distance:best }));
}
function broadcast(data) { for (const c of clients.values()) send(c, data); }
function send(res, data) { try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {} }

async function staticFile(pathname, req, res) {
  let rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname).replace(/^\/+/, '');
  rel = normalize(rel);
  if (rel.startsWith('..') || rel.includes('\0')) return json(res, 403, { error:'path' });
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) return json(res, 403, { error:'path' });
  try {
    const s = await stat(file);
    const target = s.isDirectory() ? join(file, 'index.html') : file;
    const data = await readFile(target);
    res.writeHead(200, { 'content-type':mime[extname(target)] || 'application/octet-stream', 'cache-control':'no-cache' });
    if (req.method === 'HEAD') res.end(); else res.end(data);
  } catch { json(res, 404, { error:'not found' }); }
}

function body(req) {
  return new Promise((resolve,reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 8192) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { reject(new Error('json')); } });
    req.on('error', reject);
  });
}
function json(res, status, data) { res.writeHead(status, { ...headers, 'content-type':'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
function cleanId(v) { return typeof v === 'string' && /^[\w-]{8,64}$/.test(v) ? v : null; }
function cleanName(v) { return typeof v === 'string' ? v.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,20) : ''; }
function num(v,min,max) { const n = Number(v); return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : 0; }

setInterval(() => {
  const cut = Date.now() - 30000;
  let changed = false;
  for (const [id,p] of players) if (p.seen < cut) { players.delete(id); clients.delete(id); changed = true; broadcast({ type:'leave', id }); }
  if (changed) broadcast({ type:'leaders', rows:leaderboard() });
}, 10000).unref();

server.listen(PORT, '127.0.0.1', () => console.log(`Powderline: http://localhost:${PORT}`));
