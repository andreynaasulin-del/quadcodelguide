/**
 * Media format standard for Quadcode Guide — single source of truth.
 * See meta/rules/media-format.md for the human-readable version.
 *
 * Every publish path (publish_case, prepare_and_publish, manual guides.json edits)
 * must pass a guide through `normalizeGuide()` before it is committed or uploaded.
 * `checkGuide()` is the read-only gate used by `npm run media:check`.
 *
 * Tooling: ffmpeg/ffprobe only (already required by the video pipeline) — no
 * native npm deps, works on any machine that can publish.
 */

import { existsSync, statSync, mkdirSync, renameSync, unlinkSync, copyFileSync, openSync, readSync, closeSync, fstatSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Deliberately NOT importing ./media.mjs: it pulls @vercel/blob at module load,
// and this gate must run on a bare checkout (CI, a designer's laptop) with no npm install.
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const isRemoteUrl = v => typeof v === 'string' && /^https?:\/\//i.test(v);

// ---------------------------------------------------------------------------
// THE STANDARD
// ---------------------------------------------------------------------------
export const STANDARD = {
  image: {
    format: 'webp',
    quality: 82,           // libwebp -quality; visually transparent on renders/UI shots
    maxWidth: 1920,        // longest edge for step results
    coverMaxWidth: 1600,   // card covers never render wider than ~800 CSS px @2x
    maxBytes: 500 * 1024,  // hard ceiling per image; typical result lands at 100–250 KB
  },
  video: {
    codec: 'h264',
    maxHeight: 1080,
    crf: 23,
    preset: 'slow',
    audioKbps: 128,
    maxKbps: 4500,         // above this we re-encode; below we leave the file alone
    maxBytes: 12 * 1024 * 1024,
    posterRequired: true,  // every video field needs a poster still (webp)
  },
  audio: {
    format: 'mp3',
    maxKbps: 192,
    maxBytes: 6 * 1024 * 1024,
  },
  // Only relative site paths are allowed for self-hosted media. Absolute URLs to
  // our own domains break caching across the .vercel.app / guides.quadcode.ai
  // aliases and silently 404 when a deployment alias moves.
  selfHosts: ['quadcodeguide.vercel.app', 'guides.quadcode.ai'],
};

const IMG_EXT = /\.(png|jpe?g|webp|gif|avif)$/i;
const VID_EXT = /\.(mp4|webm|mov|m4v)$/i;
const AUD_EXT = /\.(mp3|wav|m4a|aac|ogg)$/i;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
export function toRepoPath(sitePath) {
  return join(REPO_ROOT, String(sitePath).replace(/^\//, ''));
}
export function toSitePath(absPath) {
  const root = REPO_ROOT.replace(/\\/g, '/');
  const rel = resolve(absPath).replace(/\\/g, '/').slice(root.length);
  return rel.startsWith('/') ? rel : '/' + rel;
}

/** Absolute URL to one of our own hosts -> relative site path. Otherwise unchanged. */
export function relativizeSelfUrl(v) {
  if (!isRemoteUrl(v)) return v;
  try {
    const u = new URL(v);
    if (STANDARD.selfHosts.includes(u.hostname) && u.pathname.startsWith('/ui_views/')) return u.pathname;
  } catch { /* ignore */ }
  return v;
}

function ffprobeJson(file, args) {
  const out = execFileSync('ffprobe', ['-v', 'error', ...args, '-of', 'json', file], { encoding: 'utf8' });
  return JSON.parse(out);
}
export function probeImage(file) {
  const j = ffprobeJson(file, ['-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name']);
  const s = (j.streams || [])[0] || {};
  return { w: s.width || 0, h: s.height || 0, codec: s.codec_name || '', bytes: statSync(file).size };
}
export function probeVideo(file) {
  const j = ffprobeJson(file, ['-show_entries', 'stream=codec_type,codec_name,width,height:format=duration,bit_rate']);
  const v = (j.streams || []).find(s => s.codec_type === 'video') || {};
  const a = (j.streams || []).find(s => s.codec_type === 'audio');
  return {
    w: v.width || 0, h: v.height || 0, codec: v.codec_name || '',
    hasAudio: Boolean(a), dur: Number(j.format?.duration || 0),
    kbps: Math.round(Number(j.format?.bit_rate || 0) / 1000), bytes: statSync(file).size,
  };
}
export function probeAudio(file) {
  const j = ffprobeJson(file, ['-show_entries', 'stream=codec_name:format=duration,bit_rate']);
  const s = (j.streams || [])[0] || {};
  return { codec: s.codec_name || '', dur: Number(j.format?.duration || 0), kbps: Math.round(Number(j.format?.bit_rate || 0) / 1000), bytes: statSync(file).size };
}
/** moov atom before mdat = playback can start on the first range request. */
export function hasFaststart(file) {
  // Walk top-level MP4 boxes: [size u32][type 4cc]; size==1 -> 64-bit largesize follows.
  const fd = openSync(file, 'r');
  try {
    const total = fstatSync(fd).size;
    const hdr = Buffer.alloc(16);
    let off = 0;
    for (let i = 0; i < 64 && off + 8 <= total; i++) {
      readSync(fd, hdr, 0, 16, off);
      let size = hdr.readUInt32BE(0);
      const type = hdr.toString('latin1', 4, 8);
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      if (size === 1) size = Number(hdr.readBigUInt64BE(8));
      else if (size === 0) break; // box extends to EOF
      if (size < 8) break;
      off += size;
    }
    return false;
  } finally { closeSync(fd); }
}

const BACKUP_DIR = join(REPO_ROOT, '.temp', 'media-originals');
function backupPathFor(abs) {
  return join(BACKUP_DIR, toSitePath(abs).replace(/^\//, '').split('/').join('__'));
}
/** Copy the file to .temp/media-originals once; never overwrite an existing backup. */
function backupOriginal(abs) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const dst = backupPathFor(abs);
  if (!existsSync(dst)) copyFileSync(abs, dst);
}

// ---------------------------------------------------------------------------
// converters (ffmpeg)
// ---------------------------------------------------------------------------
/** PNG/JPG/oversized WebP -> WebP at <= maxW. Returns new abs path (may equal input). */
export function convertImage(abs, { maxW = STANDARD.image.maxWidth, quality = STANDARD.image.quality, log = () => {} } = {}) {
  const info = probeImage(abs);
  const isWebp = /\.webp$/i.test(abs);
  const tooWide = info.w > maxW;
  const tooBig = info.bytes > STANDARD.image.maxBytes;
  if (isWebp && !tooWide && !tooBig) return abs;

  const out = abs.replace(IMG_EXT, '') + '.webp';
  const tmp = join(dirname(abs), '.norm-' + basename(out));
  const vf = tooWide ? `scale='min(${maxW},iw)':-2:flags=lanczos` : null;
  // Descend quality until under the byte ceiling (never below q=60).
  let q = quality, size = Infinity;
  for (; q >= 60; q -= 6) {
    const args = ['-y', '-i', abs];
    if (vf) args.push('-vf', vf);
    args.push('-c:v', 'libwebp', '-quality', String(q), '-compression_level', '6', '-frames:v', '1', tmp);
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
    size = statSync(tmp).size;
    if (size <= STANDARD.image.maxBytes) break;
  }
  if (isWebp && size >= info.bytes) { unlinkSync(tmp); return abs; } // never make a webp bigger
  backupOriginal(abs);
  if (out !== abs) unlinkSync(abs);
  renameSync(tmp, out);
  log(`img  ${basename(abs)} ${info.w}x${info.h} ${(info.bytes / 1024).toFixed(0)}KB -> ${basename(out)} q${q} ${(size / 1024).toFixed(0)}KB`);
  return out;
}

/** Re-encode a video to the delivery tier if it is over budget. Returns abs path. */
export function convertVideo(abs, { log = () => {} } = {}) {
  const info = probeVideo(abs);
  const S = STANDARD.video;
  const fast = hasFaststart(abs);
  const needs = info.h > S.maxHeight || info.kbps > S.maxKbps || info.bytes > S.maxBytes || info.codec !== 'h264' || !fast || !/\.mp4$/i.test(abs);
  if (!needs) return abs;
  const out = abs.replace(VID_EXT, '') + '.mp4';
  const tmp = join(dirname(abs), '.norm-' + basename(out));
  // Always encode from the pristine original if we have one — re-encoding a
  // previous pass stacks generation loss. backupOriginal() is a no-op when it exists.
  backupOriginal(abs);
  const src = backupPathFor(abs);
  const srcInfo = probeVideo(src);
  // Grain-heavy AI renders can sit above the kbps cap at the default CRF; step
  // CRF up (23 -> 26 -> 29 -> 32) until the file fits. Quality stays fine at 1080p.
  let crf = S.crf, size = Infinity, kbps = Infinity;
  for (; crf <= 32; crf += 3) {
    const args = ['-y', '-i', src, '-map', '0:v:0'];
    if (srcInfo.hasAudio) args.push('-map', '0:a:0', '-c:a', 'aac', '-b:a', `${S.audioKbps}k`, '-ac', '2'); else args.push('-an');
    if (srcInfo.h > S.maxHeight) args.push('-vf', `scale=-2:${S.maxHeight}:flags=lanczos`);
    args.push('-c:v', 'libx264', '-preset', S.preset, '-crf', String(crf), '-profile:v', 'high', '-level', '4.1',
      '-pix_fmt', 'yuv420p', '-g', '120', '-movflags', '+faststart', tmp);
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
    ({ bytes: size, kbps } = probeVideo(tmp));
    if (kbps <= S.maxKbps && size <= S.maxBytes) break;
  }
  if (out !== abs) unlinkSync(abs);
  renameSync(tmp, out);
  log(`vid  ${basename(abs)} ${srcInfo.w}x${srcInfo.h} ${srcInfo.kbps}kbps ${(srcInfo.bytes / 1048576).toFixed(1)}MB -> crf${crf} ${kbps}kbps ${(size / 1048576).toFixed(1)}MB`);
  return out;
}

/** Grab a poster still (webp) from a video. Returns abs path of the poster. */
export function makePoster(videoAbs, { at = 1.0, log = () => {} } = {}) {
  const out = videoAbs.replace(VID_EXT, '') + '.poster.webp';
  if (existsSync(out)) return out;
  const tmp = join(dirname(out), '.norm-' + basename(out));
  execFileSync('ffmpeg', ['-y', '-ss', String(at), '-i', videoAbs, '-frames:v', '1',
    '-vf', `scale='min(${STANDARD.image.coverMaxWidth},iw)':-2:flags=lanczos`,
    '-c:v', 'libwebp', '-quality', String(STANDARD.image.quality), tmp], { stdio: 'pipe' });
  renameSync(tmp, out);
  log(`post ${basename(videoAbs)} -> ${basename(out)}`);
  return out;
}

// ---------------------------------------------------------------------------
// guide-level: check + normalize
// ---------------------------------------------------------------------------
/** Flat list of every media slot in a guide: { obj, key, kind, where, isRoot }. */
export function mediaFields(guide) {
  const list = [];
  for (const f of ['image', 'poster']) list.push({ obj: guide, key: f, kind: 'image', where: f, isRoot: true });
  list.push({ obj: guide, key: 'video', kind: 'video', where: 'video', isRoot: true });
  list.push({ obj: guide, key: 'audio', kind: 'audio', where: 'audio', isRoot: true });
  const steps = guide.steps || [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    for (const f of ['result_image', 'result_poster']) list.push({ obj: s, key: f, kind: 'image', where: `steps[${i}].${f}`, isRoot: false });
    list.push({ obj: s, key: 'result_video', kind: 'video', where: `steps[${i}].result_video`, isRoot: false });
  }
  return list;
}

/**
 * Read-only audit. Returns { errors: [], warnings: [] }.
 * errors = must fix before publish; warnings = allowed but flagged.
 */
export function checkGuide(guide, { baseDir = REPO_ROOT } = {}) {
  const errors = [], warnings = [];
  for (const m of mediaFields(guide)) {
    const v = m.obj[m.key];
    if (!v || typeof v !== 'string') continue;
    const rel = relativizeSelfUrl(v);
    if (rel !== v) errors.push(`${m.where}: absolute self-URL — use ${rel}`);
    if (isRemoteUrl(rel)) { warnings.push(`${m.where}: external URL (${new URL(rel).hostname}) — not under our control`); continue; }
    const abs = rel.startsWith('/') ? toRepoPath(rel) : resolve(baseDir, rel);
    if (!existsSync(abs)) { errors.push(`${m.where}: file missing ${rel}`); continue; }
    if (m.kind === 'image') {
      if (!IMG_EXT.test(abs)) { errors.push(`${m.where}: not an image (${extname(abs)})`); continue; }
      const i = probeImage(abs);
      const maxW = m.isRoot ? STANDARD.image.coverMaxWidth : STANDARD.image.maxWidth;
      if (!/\.webp$/i.test(abs)) errors.push(`${m.where}: ${extname(abs)} — images must be .webp`);
      if (i.w > maxW) errors.push(`${m.where}: ${i.w}px wide > ${maxW}`);
      if (i.bytes > STANDARD.image.maxBytes) errors.push(`${m.where}: ${(i.bytes / 1024).toFixed(0)}KB > ${STANDARD.image.maxBytes / 1024}KB`);
    } else if (m.kind === 'video') {
      if (!VID_EXT.test(abs)) { errors.push(`${m.where}: not a video (${extname(abs)})`); continue; }
      const i = probeVideo(abs);
      if (!/\.mp4$/i.test(abs) || i.codec !== 'h264') errors.push(`${m.where}: must be H.264 .mp4 (is ${i.codec} ${extname(abs)})`);
      if (i.h > STANDARD.video.maxHeight) errors.push(`${m.where}: ${i.h}p > ${STANDARD.video.maxHeight}p`);
      if (i.kbps > STANDARD.video.maxKbps) errors.push(`${m.where}: ${i.kbps} kbps > ${STANDARD.video.maxKbps}`);
      if (i.bytes > STANDARD.video.maxBytes) errors.push(`${m.where}: ${(i.bytes / 1048576).toFixed(1)}MB > ${STANDARD.video.maxBytes / 1048576}MB`);
      if (!hasFaststart(abs)) errors.push(`${m.where}: no faststart (moov after mdat)`);
      const poster = m.isRoot ? (guide.poster || guide.image) : (m.obj.result_poster || guide.poster || guide.image);
      if (STANDARD.video.posterRequired && !poster) errors.push(`${m.where}: video without poster`);
    } else if (m.kind === 'audio') {
      if (!AUD_EXT.test(abs)) { errors.push(`${m.where}: not audio`); continue; }
      const i = probeAudio(abs);
      if (!/\.mp3$/i.test(abs)) warnings.push(`${m.where}: prefer .mp3 (is ${extname(abs)})`);
      if (i.kbps > STANDARD.audio.maxKbps) warnings.push(`${m.where}: ${i.kbps} kbps > ${STANDARD.audio.maxKbps}`);
      if (i.bytes > STANDARD.audio.maxBytes) errors.push(`${m.where}: ${(i.bytes / 1048576).toFixed(1)}MB > ${STANDARD.audio.maxBytes / 1048576}MB`);
    }
  }
  if (!guide.image && !guide.poster) errors.push('guide has neither image nor poster — card would be blank');
  return { errors, warnings };
}

/**
 * Bring a guide's local media up to the standard, in place (files + JSON refs).
 * Returns { changed, log }. Remote (non-self) URLs are left alone.
 */
export function normalizeGuide(guide, { baseDir = REPO_ROOT, dryRun = false } = {}) {
  const logLines = []; const log = s => logLines.push(s);
  let changed = 0;
  const rewritten = new Map(); // abs old -> abs new (dedupe repeated refs)

  for (const m of mediaFields(guide)) {
    let v = m.obj[m.key];
    if (!v || typeof v !== 'string') continue;
    const rel = relativizeSelfUrl(v);
    if (rel !== v) {
      log(`url  ${m.where}: ${v} -> ${rel}`);
      if (!dryRun) m.obj[m.key] = rel;
      changed++; v = rel;
    }
    if (isRemoteUrl(v)) continue;
    let abs = v.startsWith('/') ? toRepoPath(v) : resolve(baseDir, v);
    if (!existsSync(abs)) {
      // Self-heal: the same source may already have been converted under another
      // ref (same guide or an earlier run). If <stem>.webp / <stem>.mp4 exists, use it.
      const healed = m.kind === 'image' ? abs.replace(IMG_EXT, '') + '.webp'
        : m.kind === 'video' ? abs.replace(VID_EXT, '') + '.mp4' : null;
      if (healed && healed !== abs && existsSync(healed)) {
        log(`heal ${m.where}: ${basename(abs)} -> ${basename(healed)}`);
        abs = healed;
        if (!dryRun) { const site = toSitePath(abs); m.obj[m.key] = v.startsWith('/') ? site : site.replace(/^\//, ''); v = m.obj[m.key]; changed++; }
      } else { log(`MISS ${m.where}: ${v}`); continue; }
    }
    if (dryRun) { log(`would ${m.kind} ${m.where}: ${v}`); continue; }

    let out = rewritten.get(abs);
    if (!out) {
      if (m.kind === 'image') out = convertImage(abs, { maxW: m.isRoot ? STANDARD.image.coverMaxWidth : STANDARD.image.maxWidth, log });
      else if (m.kind === 'video') out = convertVideo(abs, { log });
      else out = abs;
      rewritten.set(abs, out);
    }
    if (out !== abs) {
      const site = toSitePath(out);
      m.obj[m.key] = v.startsWith('/') ? site : site.replace(/^\//, '');
      changed++;
    }
    if (m.kind === 'video') {
      const posterKey = m.isRoot ? 'poster' : 'result_poster';
      const has = m.obj[posterKey] || (!m.isRoot && (guide.poster || guide.image)) || (m.isRoot && guide.image);
      if (!has) {
        const p = makePoster(out, { log });
        m.obj[posterKey] = toSitePath(p);
        changed++;
      }
    }
  }
  return { changed, log: logLines };
}
