import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const framesDir = resolve(root, '.temp/widget-frames');
const outMp4 = resolve(root, '.temp/recordings/snap01-widget-demo.mp4');
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
  const url = `http://localhost:${port}/ui_views/assets/snap01-configurator.html`;
  try {
    console.log('try', url);
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    if (res && res.ok()) { opened = url; break; }
  } catch (e) { console.log('fail', port, e.message); }
}
if (!opened) { await browser.close(); throw new Error('page not reachable'); }
console.log('opened', opened);

await page.waitForSelector('.snap-pal-item[data-key="island"]', { timeout: 15000 });

// Inject HUD + fake cursor overlay
await page.evaluate(() => {
  const cur = document.createElement('div');
  cur.id = 'demoCursor';
  cur.style.cssText = 'position:fixed;width:22px;height:22px;border:2px solid #F3EDE1;border-radius:50%;' +
    'box-shadow:0 0 0 5px rgba(20,18,22,.45);pointer-events:none;z-index:99999;transform:translate(-50%,-50%);' +
    'left:50%;top:50%;background:transparent;transition:background .1s;';
  document.body.appendChild(cur);

  const label = document.createElement('div');
  label.style.cssText = 'position:fixed;left:24px;bottom:20px;z-index:99998;color:#F3EDE1;' +
    'background:rgba(20,18,22,.7);border:1px solid #3C434B;padding:9px 14px;' +
    'font:600 14px "JetBrains Mono",monospace;letter-spacing:.12em;';
  label.textContent = 'SNAP/01 · LIVE CONFIGURATOR';
  document.body.appendChild(label);

  const idx = document.createElement('div');
  idx.style.cssText = 'position:fixed;right:24px;bottom:20px;z-index:99998;color:#9AA6BE;' +
    'font:500 12px "JetBrains Mono",monospace;letter-spacing:.1em;';
  idx.textContent = 'DRAG · DROP · INSPECT';
  document.body.appendChild(idx);
});

async function setCursor(x, y, down) {
  await page.evaluate(({ x, y, down }) => {
    const c = document.getElementById('demoCursor');
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.style.background = down ? 'rgba(255,107,53,.55)' : 'transparent';
    c.style.borderColor = down ? '#FF6B35' : '#F3EDE1';
  }, { x, y, down });
}

async function shoot() {
  const name = `frame_${String(frameIdx).padStart(4, '0')}.jpg`;
  await page.screenshot({ path: resolve(framesDir, name), type: 'jpeg', quality: 97 });
  if (frameIdx % 20 === 0) console.log('frame', frameIdx);
  frameIdx++;
}

async function hold(frames, x, y, down = false) {
  for (let i = 0; i < frames; i++) { await setCursor(x, y, down); await shoot(); }
}

async function moveCursor(x0, y0, x1, y1, frames, down = false) {
  for (let i = 0; i <= frames; i++) {
    const t = i / frames;
    await setCursor(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, down);
    await shoot();
  }
}

async function getRect(sel) {
  return await page.evaluate((s) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  }, sel);
}

async function canvasMetrics() {
  return await page.evaluate(() => {
    const c = document.getElementById('canvas');
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, cell: c.clientWidth / 12, cols: 12, rows: 10 };
  });
}

async function dragDrop(key, col, row, w, h) {
  const m = await canvasMetrics();
  const x = m.left + col * m.cell + (w * m.cell) / 2;
  const y = m.top + row * m.cell + (h * m.cell) / 2;
  await page.evaluate(({ key, x, y }) => {
    const dt = new DataTransfer();
    const src = document.querySelector(`.snap-pal-item[data-key="${key}"]`);
    src.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const canvas = document.getElementById('canvas');
    canvas.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
    canvas.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt, clientX: x, clientY: y }));
  }, { key, x, y });
  return { x, y };
}

async function clickLastModule() {
  await page.evaluate(() => {
    const mods = document.querySelectorAll('#canvas .snap-mod');
    const el = mods[mods.length - 1];
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

console.log('=== A: intro hold ===');
await hold(30, 960, 540);

console.log('=== B: drag Island to grid ===');
const islandPal = await getRect('.snap-pal-item[data-key="island"]');
const p0 = { x: islandPal.left + islandPal.width / 2, y: islandPal.top + islandPal.height / 2 };
const islandTarget = { col: 3, row: 4, w: 6, h: 3 };
const m1 = await canvasMetrics();
const t1x = m1.left + islandTarget.col * m1.cell + (islandTarget.w * m1.cell) / 2;
const t1y = m1.top + islandTarget.row * m1.cell + (islandTarget.h * m1.cell) / 2;
await moveCursor(p0.x, p0.y, t1x, t1y, 36, true);
await dragDrop('island', islandTarget.col, islandTarget.row, islandTarget.w, islandTarget.h);
await hold(18, t1x, t1y, false);

console.log('=== C: click Island to open 3D inspector ===');
await moveCursor(t1x, t1y, t1x, t1y, 9, false);
await clickLastModule();
await hold(21, t1x, t1y, false);

console.log('=== D: orbit 3D inspector (drag gesture) ===');
try {
  await page.waitForFunction(() => document.getElementById('insp').loaded === true, null, { timeout: 3000 });
} catch (e) { console.log('inspector load wait timed out, continuing', e.message); }
const inspRect = await getRect('#insp');
const orbitY = inspRect.top + inspRect.height / 2;
const orbitFrames = 120;
for (let i = 0; i <= orbitFrames; i++) {
  const t = i / orbitFrames;
  const x = inspRect.left + inspRect.width * 0.2 + (inspRect.width * 0.6) * Math.sin(t * Math.PI * 1.4);
  const azimuth = 20 + t * 300;
  await page.evaluate((deg) => {
    const el = document.getElementById('insp');
    el.setAttribute('camera-orbit', deg + 'deg 75deg 105%');
  }, azimuth);
  await setCursor(x, orbitY, true);
  await shoot();
}

console.log('=== E: drag Corner Unit into room corner ===');
const cornerPal = await getRect('.snap-pal-item[data-key="corner-unit"]');
const p2 = { x: cornerPal.left + cornerPal.width / 2, y: cornerPal.top + cornerPal.height / 2 };
const m2 = await canvasMetrics();
const cornerTarget = { col: 0, row: 0, w: 3, h: 3 };
const t2x = m2.left + cornerTarget.col * m2.cell + (cornerTarget.w * m2.cell) / 2;
const t2y = m2.top + cornerTarget.row * m2.cell + (cornerTarget.h * m2.cell) / 2;
await moveCursor(p2.x, p2.y, t2x, t2y, 36, true);
await dragDrop('corner-unit', cornerTarget.col, cornerTarget.row, cornerTarget.w, cornerTarget.h);
await hold(18, t2x, t2y, false);

console.log('=== F: collision rule demo — invalid drop then valid drop (Base Cabinet) ===');
const basePal = await getRect('.snap-pal-item[data-key="base-cabinet"]');
const p3 = { x: basePal.left + basePal.width / 2, y: basePal.top + basePal.height / 2 };
const m3 = await canvasMetrics();
const badTarget = { col: 4, row: 5, w: 2, h: 2 }; // overlaps island footprint
const tb_x = m3.left + badTarget.col * m3.cell + (badTarget.w * m3.cell) / 2;
const tb_y = m3.top + badTarget.row * m3.cell + (badTarget.h * m3.cell) / 2;
await moveCursor(p3.x, p3.y, tb_x, tb_y, 30, true);
await dragDrop('base-cabinet', badTarget.col, badTarget.row, badTarget.w, badTarget.h);
await hold(12, tb_x, tb_y, false);
const goodTarget = { col: 9, row: 1, w: 2, h: 2 };
const m3b = await canvasMetrics();
const tg_x = m3b.left + goodTarget.col * m3b.cell + (goodTarget.w * m3b.cell) / 2;
const tg_y = m3b.top + goodTarget.row * m3b.cell + (goodTarget.h * m3b.cell) / 2;
await moveCursor(tb_x, tb_y, tg_x, tg_y, 30, true);
await dragDrop('base-cabinet', goodTarget.col, goodTarget.row, goodTarget.w, goodTarget.h);
await hold(15, tg_x, tg_y, false);

console.log('=== G: drag Drawer Stack — 4th module, BOM keeps ticking ===');
const drawerPal = await getRect('.snap-pal-item[data-key="drawer-stack"]');
const p4 = { x: drawerPal.left + drawerPal.width / 2, y: drawerPal.top + drawerPal.height / 2 };
const m4 = await canvasMetrics();
const drawerTarget = { col: 11, row: 8, w: 1, h: 2 };
const t4x = m4.left + drawerTarget.col * m4.cell + (drawerTarget.w * m4.cell) / 2;
const t4y = m4.top + drawerTarget.row * m4.cell + (drawerTarget.h * m4.cell) / 2;
await moveCursor(p4.x, p4.y, t4x, t4y, 36, true);
await dragDrop('drawer-stack', drawerTarget.col, drawerTarget.row, drawerTarget.w, drawerTarget.h);
await hold(15, t4x, t4y, false);

console.log('=== H: final full-BOM hold ===');
await page.evaluate(() => { document.getElementById('demoCursor').style.opacity = '0'; });
await hold(45, t4x, t4y, false);

console.log('total frames', frameIdx);
await browser.close();

console.log('encoding mp4...');
const ff = spawnSync('ffmpeg', [
  '-y', '-framerate', String(FPS), '-i', resolve(framesDir, 'frame_%04d.jpg'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '13', '-preset', 'medium',
  '-movflags', '+faststart', outMp4,
], { encoding: 'utf8' });
if (ff.status !== 0) { console.error(ff.stderr); throw new Error('ffmpeg failed'); }
console.log('DONE', outMp4);
