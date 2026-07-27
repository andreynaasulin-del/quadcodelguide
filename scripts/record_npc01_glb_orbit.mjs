import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const framesDir = resolve(root, '.temp/orbit-frames');
const outMp4 = resolve(root, '.temp/recordings/npc01-glb-full-orbit.mp4');
mkdirSync(framesDir, { recursive: true });
mkdirSync(resolve(root, '.temp/recordings'), { recursive: true });
// clean old frames
if (existsSync(framesDir)) {
  for (const f of await import('node:fs').then(m => m.readdirSync(framesDir))) {
    if (f.endsWith('.jpg')) rmSync(resolve(framesDir, f));
  }
}

const ports = [9071, 9673, 8000, 5500, 3000];
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl', '--enable-webgl2'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('PAGE', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERR', e.message));

let opened = null;
for (const port of ports) {
  const url = `http://localhost:${port}/.temp/npc01-orbit-capture.html`;
  try {
    console.log('try', url);
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    if (res && res.ok()) { opened = url; break; }
  } catch (e) {
    console.log('fail', port, e.message);
  }
}
if (!opened) {
  await browser.close();
  throw new Error('page not reachable');
}
console.log('opened', opened);

const status = await page.waitForFunction(
  () => (window.modelReady === true ? 'ready' : (window.modelError ? 'error:' + window.modelError : false)),
  null,
  { timeout: 90000 }
).then((h) => h.jsonValue()).catch((e) => 'timeout:' + e.message);
console.log('model', status);
if (!String(status).startsWith('ready')) {
  await browser.close();
  throw new Error(status);
}

// Hold a few front frames
const frames = [];
// intro hold front 15 frames
for (let i = 0; i < 15; i++) frames.push({ angle: 0, x: 62, down: false });
// 4 quadrants, 36 steps each = 144 motion frames (~4.8s at 30fps) + holds
for (let q = 0; q < 4; q++) {
  for (let s = 0; s <= 36; s++) {
    const p = s / 36;
    frames.push({ angle: q * 90 + p * 90, x: 68 - p * 28, down: true });
  }
  // hold quadrant 12 frames
  for (let h = 0; h < 12; h++) frames.push({ angle: (q + 1) * 90, x: 40, down: false });
}
// outro
for (let i = 0; i < 12; i++) frames.push({ angle: 360, x: 52, down: false });

console.log('frames', frames.length);
let idx = 0;
for (const f of frames) {
  const dataUrl = await page.evaluate(({ angle, x, down }) => {
    window.setOrbit(angle);
    window.setCursor(x, 50, down);
    return window.captureFrameDataUrl();
  }, f);
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const name = `frame_${String(idx).padStart(4, '0')}.jpg`;
  writeFileSync(resolve(framesDir, name), Buffer.from(b64, 'base64'));
  if (idx % 30 === 0) console.log('wrote', name, 'angle', f.angle.toFixed(1));
  idx++;
}

await browser.close();

console.log('encoding mp4...');
const ff = spawnSync('ffmpeg', [
  '-y',
  '-framerate', '30',
  '-i', resolve(framesDir, 'frame_%04d.jpg'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-crf', '16',
  '-preset', 'medium',
  '-movflags', '+faststart',
  outMp4,
], { encoding: 'utf8' });

if (ff.status !== 0) {
  console.error(ff.stderr);
  throw new Error('ffmpeg failed');
}
console.log('DONE', outMp4);
