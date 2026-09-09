#!/usr/bin/env node
/**
 * dev_server.mjs — the local preview server for this repo.
 *
 *   npm run dev            # http://localhost:9099/  -> ui_views/landing.html
 *   PORT=9100 npm run dev
 *
 * Why this exists: previews used to be served by the QuadcodeAI desktop app's own
 * file server on :9087 (process `genui`). That server dies and restarts with the
 * app, and while it is down every request answers "Error code: 404 / File not
 * found." — the link looked broken even though the file was on disk. This server
 * is a plain node process we control, so the URL stays valid for the whole session.
 *
 * Node core only — no npm install, works on a bare checkout.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 9099);
const HOME = '/ui_views/landing.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.zip': 'application/zip', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.wasm': 'application/wasm',
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  } catch {
    return send(res, 400, 'bad URL');
  }

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(302, { Location: HOME });
    return res.end();
  }

  // Block path traversal: resolve, then require the result to stay under ROOT.
  const abs = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (!resolve(abs).startsWith(ROOT)) return send(res, 403, 'forbidden');

  let file = abs;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) || !statSync(file).isFile()) {
    console.log(`404 ${pathname}`);
    return send(res, 404, `404 — no such file in repo:\n  ${pathname}\n\nHome: ${HOME}\n`);
  }

  const { size } = statSync(file);
  const ext = extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  // HTML/JSON are the files we edit constantly — never let the browser cache them,
  // or a reload shows yesterday's guides.json. Media is content-addressed enough
  // in practice and benefits from a short cache while scrolling a guide.
  const cache = ext === '.html' || ext === '.json'
    ? 'no-store, must-revalidate'
    : 'public, max-age=300';

  // Range support is not optional: <video> seeking and Safari playback both
  // require 206 responses, and the desktop app's server handled this poorly.
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m) {
      let start = m[1] === '' ? null : Number(m[1]);
      let end = m[2] === '' ? null : Number(m[2]);
      if (start === null) { start = size - end; end = size - 1; }      // suffix range
      if (end === null || end >= size) end = size - 1;
      if (!(start >= 0 && start <= end)) {
        return send(res, 416, '', { 'Content-Range': `bytes */${size}` });
      }
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': cache,
      });
      if (req.method === 'HEAD') return res.end();
      return createReadStream(file, { start, end }).pipe(res);
    }
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cache,
  });
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(file);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`port ${PORT} is taken. Find the holder:  lsof -i :${PORT}`);
    console.error(`or pick another:  PORT=${PORT + 1} npm run dev`);
    process.exit(1);
  }
  throw e;
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}${HOME}`);
});
