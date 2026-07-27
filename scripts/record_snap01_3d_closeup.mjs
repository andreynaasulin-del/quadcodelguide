import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const framesDir = resolve(root, '.temp/closeup-frames');
const outMp4 = resolve(root, '.temp/recordings/snap01-3d-closeup.mp4');
mkdirSync(framesDir, { recursive: true });
mkdirSync(resolve(root, '.temp/recordings'), { recursive: true });
if (existsSync(framesDir)) {
  for (const f of readdirSync(framesDir)) if (f.endsWith('.jpg')) rmSync(resolve(framesDir, f));
}

const FPS = 30;
let frameIdx = 0;

const ports = [9071, 9673, 8000, 5500, 3000];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl', '--enable-webgl2'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', (m) => console.log('PAGE', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERR', e.message));

let opened = null;
for (const port of ports) {
  const url = `http://localhost:${port}/.temp/snap01-3d-closeup-capture.html`;
  try {
    console.log('try', url);
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    if (res && res.ok()) { opened = url; break; }
  } catch (e) { console.log('fail', port, e.message); }
}
if (!opened) { await browser.close(); throw new Error('page not reachable'); }
console.log('opened', opened);

await page.waitForFunction(() => typeof window.loadModel === 'function', null, { timeout: 15000 });

async function shoot() {
  const dataUrl = await page.evaluate(() => window.captureFrameDataUrl());
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const name = `frame_${String(frameIdx).padStart(4, '0')}.jpg`;
  writeFileSync(resolve(framesDir, name), Buffer.from(b64, 'base64'));
  if (frameIdx % 30 === 0) console.log('frame', frameIdx);
  frameIdx++;
}

async function orbitModule(idx, startDeg, endDeg, frames, holdFrames) {
  await page.evaluate((i) => window.loadModel(i), idx);
  await page.waitForFunction(() => window.modelReady === true, null, { timeout: 15000 });
  for (let i = 0; i <= frames; i++) {
    const t = i / frames;
    const deg = startDeg + (endDeg - startDeg) * t;
    await page.evaluate((d) => window.setOrbit(d), deg);
    await shoot();
  }
  for (let h = 0; h < holdFrames; h++) await shoot();
}

// 3 modules, fast dynamic partial-orbit close-ups, ~1.17s each at 30fps => ~3.5s total
console.log('=== Module 1: ISLAND close orbit ===');
await orbitModule(0, -35, 55, 26, 6);

console.log('=== Module 2: CORNER UNIT close orbit ===');
await orbitModule(1, 20, 130, 26, 6);

console.log('=== Module 3: DRAWER STACK close orbit ===');
await orbitModule(2, 10, 100, 22, 6);

console.log('total frames', frameIdx, '≈', (frameIdx / FPS).toFixed(2), 's');
await browser.close();

console.log('encoding mp4...');
const ff = spawnSync('ffmpeg', [
  '-y', '-framerate', String(FPS), '-i', resolve(framesDir, 'frame_%04d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '13', '-preset', 'medium',
  '-movflags', '+faststart', outMp4,
], { encoding: 'utf8' });
if (ff.status !== 0) { console.error(ff.stderr); throw new Error('ffmpeg failed'); }
console.log('DONE', outMp4);
