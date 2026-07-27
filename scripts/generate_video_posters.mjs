// Give every video guide a real poster.
//
// A card with no poster has nothing to paint until video bytes arrive, so it either
// shows the branded placeholder or a black rectangle. A 60–90 KB JPEG poster fills
// that hole instantly and lets the <video> stay at preload="none".
//
// Frames are pulled straight out of the guide's own video (no invention, no editing),
// downscaled to 1280 wide, and written to ui_views/assets/poster-<id>.jpg.
// guides.json is patched in place.
//
// Usage: node scripts/generate_video_posters.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const GUIDES = 'ui_views/guides.json';
const ASSETS = 'ui_views/assets';
const TMP = '.temp/poster-src';
const AT = 1.6;   // seconds — past any fade-in, before the first cut in these clips

fs.mkdirSync(TMP, { recursive: true });

const raw = fs.readFileSync(GUIDES, 'utf8');
const data = JSON.parse(raw);
const list = Array.isArray(data) ? data : (data.guides || []);

const todo = list.filter(g => g.video && !g.poster && !g.image);
if (!todo.length) { console.log('nothing to do: every video guide already has a cover'); process.exit(0); }

let patched = 0;
for (const g of todo) {
  const out = path.join(ASSETS, `poster-${g.id}.jpg`);
  let src = g.video;

  // remote video -> fetch once into .temp (ffmpeg can read http, but a local copy
  // keeps the seek cheap and survives a flaky edge)
  if (/^https?:/i.test(src)) {
    const local = path.join(TMP, `${g.id}.mp4`);
    if (!fs.existsSync(local)) {
      console.log(`fetch ${g.id}`);
      execFileSync('curl', ['-fsSL', '-o', local, src], { stdio: 'pipe' });
    }
    src = local;
  } else {
    src = src.replace(/^\//, '');
    if (!fs.existsSync(src)) { console.log(`SKIP  ${g.id}: video not found (${src})`); continue; }
  }

  execFileSync('ffmpeg', [
    '-y', '-ss', String(AT), '-i', src, '-frames:v', '1',
    '-vf', "scale='min(1280,iw)':-2:flags=lanczos",
    '-q:v', '4', out
  ], { stdio: 'pipe' });

  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  g.poster = '/' + out;
  patched++;
  console.log(`OK    ${g.id.padEnd(38)} -> ${out} (${kb} KB)`);
}

if (patched) {
  fs.writeFileSync(GUIDES, JSON.stringify(data, null, 2) + '\n');
  console.log(`\n${patched} records patched in ${GUIDES}`);
}
