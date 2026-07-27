// Media weight audit for the guide site.
// Answers one question: what exactly makes ui_views/assets 300 MB, and which of
// those bytes the browser is actually asked to download.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ASSETS = 'ui_views/assets';
const mb = b => (b / 1048576);

function probe(file) {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height,r_frame_rate,codec_name,bit_rate',
      '-show_entries', 'format=duration,bit_rate',
      '-of', 'json', file
    ], { encoding: 'utf8' });
    const j = JSON.parse(out);
    const s = (j.streams || [])[0] || {};
    return {
      w: s.width, h: s.height, codec: s.codec_name,
      fps: s.r_frame_rate,
      dur: Number(j.format?.duration || 0),
      kbps: Math.round(Number(j.format?.bit_rate || 0) / 1000)
    };
  } catch (e) { return null; }
}

const files = fs.readdirSync(ASSETS)
  .map(n => ({ n, p: path.join(ASSETS, n) }))
  .filter(f => fs.statSync(f.p).isFile())
  .map(f => ({ ...f, size: fs.statSync(f.p).size }))
  .sort((a, b) => b.size - a.size);

const total = files.reduce((a, f) => a + f.size, 0);
console.log(`${files.length} files, ${mb(total).toFixed(1)} MB total\n`);

// Which assets are referenced from guides.json (i.e. reachable by the browser)
const gj = fs.readFileSync('ui_views/guides.json', 'utf8');
const referenced = new Set();
for (const m of gj.matchAll(/\/ui_views\/assets\/([^"']+)/g)) referenced.add(m[1]);

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
console.log('name'.padEnd(52), 'MB'.padStart(7), 'kbps'.padStart(7), 'res'.padStart(11), ' ref');
for (const f of files.slice(0, 40)) {
  const info = VIDEO.test(f.n) ? probe(f.p) : null;
  console.log(
    f.n.slice(0, 52).padEnd(52),
    mb(f.size).toFixed(2).padStart(7),
    String(info?.kbps ?? '').padStart(7),
    (info ? `${info.w}x${info.h}` : '').padStart(11),
    referenced.has(f.n) ? ' yes' : ' NO'
  );
}

const unref = files.filter(f => !referenced.has(f.n));
console.log(`\nunreferenced: ${unref.length} files, ${mb(unref.reduce((a, f) => a + f.size, 0)).toFixed(1)} MB`);
const vids = files.filter(f => VIDEO.test(f.n));
console.log(`video: ${vids.length} files, ${mb(vids.reduce((a, f) => a + f.size, 0)).toFixed(1)} MB`);
