// Re-encode the guide site's video assets to a web delivery tier.
//
// Why: the audit found 21 videos / 148 MB in ui_views/assets, several at 5–14 Mbps
// for a player that is never wider than ~820 CSS px. video-airpods-clip-lifestyle.mp4
// alone was 13.8 Mbps. Opening one guide could pull 12 MB before the first frame.
//
// What it does: anything above BITRATE_FLOOR gets a CRF pass (visually transparent
// at these resolutions), 1080p cap, faststart so playback can begin on the first
// range request. Originals are moved to .temp/media-originals/ so nothing is lost.
//
// Usage: node scripts/optimize_site_media.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ASSETS = 'ui_views/assets';
const BACKUP = '.temp/media-originals';
// Defaults are the first pass. Grain-heavy AI renders barely move at CRF 24
// (video-fable-vs-sol went 13.84 -> 11.88 MB), so those get a second, stricter
// pass: FLOOR=3500 CRF=27 node scripts/optimize_site_media.mjs
const BITRATE_FLOOR = Number(process.env.FLOOR || 2500);  // kbps — below this, leave it alone
const CRF = Number(process.env.CRF || 24);                // 1080p render content: no visible loss
const MAX_H = Number(process.env.MAX_H || 1080);
const DRY = process.argv.includes('--dry');

fs.mkdirSync(BACKUP, { recursive: true });

function probe(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration,bit_rate',
    '-of', 'json', file
  ], { encoding: 'utf8' });
  const j = JSON.parse(out);
  const s = (j.streams || [])[0] || {};
  return {
    w: s.width, h: s.height,
    dur: Number(j.format?.duration || 0),
    kbps: Math.round(Number(j.format?.bit_rate || 0) / 1000)
  };
}

function hasAudio(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', file
  ], { encoding: 'utf8' });
  return out.trim().length > 0;
}

const mb = b => (b / 1048576).toFixed(2);

// Recursive: assets recovered from the dead Blob store live in per-guide
// subfolders (ui_views/assets/rolex-4k-before-after-upscale/…), and those are
// the rawest files we have — a 44 MB 4K master was sitting there untouched.
function findMp4(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findMp4(p, out);
    else if (/\.mp4$/i.test(e.name)) out.push(p);
  }
  return out;
}
// ONLY=<regex> restricts the run. Needed because most root-level clips have
// already been through two passes and sit near their quality floor — a third
// re-encode only adds generation loss. Example:
//   ONLY='assets/[a-z0-9-]+/' CRF=23 node scripts/optimize_site_media.mjs
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const targets = findMp4(ASSETS).filter(p => !ONLY || ONLY.test(p)).sort();

let before = 0, after = 0, touched = 0;
for (const src of targets) {
  // flatten subdir into the backup filename so two clips can't collide
  const name = path.relative(ASSETS, src).split(path.sep).join('__');
  const info = probe(src);
  const size = fs.statSync(src).size;
  if (info.kbps && info.kbps < BITRATE_FLOOR) {
    console.log(`skip  ${name.padEnd(46)} ${String(info.kbps).padStart(6)} kbps (already lean)`);
    continue;
  }
  before += size;
  if (DRY) {
    console.log(`would ${name.padEnd(46)} ${String(info.kbps).padStart(6)} kbps  ${mb(size)} MB`);
    continue;
  }

  const tmp = path.join(ASSETS, '.opt-' + name);
  const vf = info.h > MAX_H ? `scale=-2:${MAX_H}:flags=lanczos` : null;
  const args = ['-y', '-i', src, '-map', '0:v:0'];
  if (hasAudio(src)) args.push('-map', '0:a:0', '-c:a', 'aac', '-b:a', '128k', '-ac', '2');
  else args.push('-an');
  if (vf) args.push('-vf', vf);
  args.push(
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF),
    '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p',
    '-g', '120', '-movflags', '+faststart',
    tmp
  );
  execFileSync('ffmpeg', args, { stdio: 'pipe' });

  const newSize = fs.statSync(tmp).size;
  if (newSize >= size) {          // never make a file bigger
    fs.unlinkSync(tmp);
    after += size;
    console.log(`keep  ${name.padEnd(46)} re-encode was larger, original kept`);
    continue;
  }
  // On a second pass the backup already holds the true original — keep it,
  // don't let a pass-1 output overwrite it.
  const bak = path.join(BACKUP, name);
  if (fs.existsSync(bak)) fs.unlinkSync(src); else fs.renameSync(src, bak);
  fs.renameSync(tmp, src);
  after += newSize;
  touched++;
  const post = probe(src);
  console.log(`OK    ${name.padEnd(46)} ${mb(size)} -> ${mb(newSize)} MB   ${info.kbps} -> ${post.kbps} kbps`);
}

console.log(`\n${touched} files re-encoded: ${mb(before)} MB -> ${mb(after)} MB (saved ${mb(before - after)} MB)`);
console.log(`originals in ${BACKUP}`);
