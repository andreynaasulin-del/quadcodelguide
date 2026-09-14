/**
 * quadcode.ai — 5s outro renderer.
 * Deterministic frame-by-frame capture: renderFrame(i) → PNG → libx264.
 * No realtime playback, so a slow machine cannot drop or duplicate a frame.
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root      = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const framesDir = resolve(root, '.temp/outro-qc-frames');
const outMp4    = resolve(root, 'assets/video/qcai-outro-5s.mp4');
const stillsDir = resolve(root, '.temp/outro-qc-stills');

mkdirSync(framesDir, { recursive: true });
mkdirSync(stillsDir, { recursive: true });
mkdirSync(resolve(root, 'assets/video'), { recursive: true });
if (existsSync(framesDir)) for (const f of readdirSync(framesDir)) if (f.endsWith('.png')) rmSync(resolve(framesDir, f));

const FPS = 60;
const ports = [9071, 9673, 8000, 5500, 3000];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('PAGEERR', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('PAGE err', m.text()); });

let opened = null;
for (const port of ports) {
  const url = `http://localhost:${port}/ui_views/assets/outro-qc/index.html`;
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    if (res && res.ok()) { opened = url; break; }
  } catch (e) { /* next port */ }
}
if (!opened) { await browser.close(); throw new Error('outro page not reachable on ' + ports.join(', ')); }
console.log('opened', opened);

await page.waitForFunction(() => window.qcReady === true, null, { timeout: 20000 });
await page.addStyleTag({ content: '#scrub{display:none!important}' });

const TOTAL = await page.evaluate(() => window.QC_TOTAL);
const lockupOK = await page.evaluate(() => {
  const i = [...document.images]; return true;
});
console.log('frames to render:', TOTAL, '=', (TOTAL / FPS).toFixed(3) + 's');

for (let f = 0; f < TOTAL; f++) {
  const dataUrl = await page.evaluate((i) => { window.renderFrame(i); return window.captureFrameDataUrl(); }, f);
  const b64 = dataUrl.split(',')[1];
  writeFileSync(resolve(framesDir, `frame_${String(f).padStart(4, '0')}.png`), Buffer.from(b64, 'base64'));
  if (f % 30 === 0) console.log('  frame', f);
}

// contact-sheet stills for review at the key beats
for (const f of [12, 38, 60, 96, 140, 200, 262, 292]) {
  const d = await page.evaluate((i) => { window.renderFrame(i); return window.captureFrameDataUrl(); }, f);
  writeFileSync(resolve(stillsDir, `still_${String(f).padStart(4, '0')}.png`), Buffer.from(d.split(',')[1], 'base64'));
}

await browser.close();

console.log('encoding...');
const ff = spawnSync('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', resolve(framesDir, 'frame_%04d.png'),
  '-c:v', 'libx264',
  '-profile:v', 'high', '-level', '4.2',
  '-pix_fmt', 'yuv420p',
  '-crf', '15', '-preset', 'slow',
  '-x264-params', 'keyint=60:min-keyint=60:scenecut=0',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-movflags', '+faststart',
  '-r', String(FPS),
  outMp4,
], { encoding: 'utf8' });
if (ff.status !== 0) { console.error(ff.stderr.slice(-3000)); throw new Error('ffmpeg failed'); }

const sz = statSync(outMp4).size;
console.log('DONE', outMp4, (sz / 1048576).toFixed(2), 'MB');

const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height,r_frame_rate,nb_frames,duration,pix_fmt',
  '-of', 'default=nw=1', outMp4], { encoding: 'utf8' });
console.log(probe.stdout);
