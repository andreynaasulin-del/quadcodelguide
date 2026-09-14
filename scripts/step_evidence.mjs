// Honest visual evidence under every guide step.
//
// We only have the FINAL render for most video/audio guides — no intermediate
// results were saved. Rather than inventing "step 1 looked like this" with AI
// (which the media-format rule forbids and readers can smell), each step gets
// the slice of the final that the step is responsible for:
//
//   frame   → still WebP pulled from the final at a timestamp
//   excerpt → 4s muted H.264 loop from the final (motion / camera / route steps)
//   clip    → 10–12s MP3 excerpt of the final track (music guides)
//
// Every asset carries a kicker that says exactly what it is ("Frame from the final
// render · 0:03") plus a one-line caption written by hand — what to look at, and
// why this step is the reason it looks that way.
//
// Timecodes + captions live in scripts/step_evidence_plan.json (hand-edited).
//
// Usage:
//   node scripts/step_evidence.mjs --audit          # list steps with no media + source durations
//   node scripts/step_evidence.mjs --sheet          # contact sheet per guide → .temp/evidence/sheets/
//   node scripts/step_evidence.mjs --apply [--guide id]   # cut assets, patch guides.json
//
// ffmpeg/ffprobe only. Outputs follow scripts/lib/normalize.mjs STANDARD.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const GUIDES = path.join(ROOT, 'ui_views/guides.json');
const PLAN = path.join(ROOT, 'scripts/step_evidence_plan.json');
const OUT_DIR = 'ui_views/assets/evidence';
const TMP = path.join(ROOT, '.temp/evidence');
fs.mkdirSync(TMP, { recursive: true });

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const onlyGuide = opt('--guide');

const data = JSON.parse(fs.readFileSync(GUIDES, 'utf8'));
const plan = fs.existsSync(PLAN) ? JSON.parse(fs.readFileSync(PLAN, 'utf8')) : {};

const hasMedia = s => !!(s.result_image || s.result_video || s.result_model || s.models || s.widget_iframe);
const localPath = url => path.join(ROOT, String(url || '').replace(/^\//, ''));
const fmtT = sec => { const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return m + ':' + String(s).padStart(2, '0'); };

function probe(file) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,codec_type', '-of', 'json', file], { encoding: 'utf8' });
    const j = JSON.parse(out);
    const v = (j.streams || []).find(s => s.codec_type === 'video');
    return { dur: parseFloat(j.format?.duration || 0), w: v?.width || 0, h: v?.height || 0, hasVideo: !!v };
  } catch (e) { return null; }
}

function sh(cmd, a) { execFileSync(cmd, a, { stdio: ['ignore', 'ignore', 'inherit'] }); }
function kb(f) { return Math.round(fs.statSync(f).size / 1024); }

// ---- targets: guides with steps lacking media and a usable source ----
function targets() {
  const list = [];
  for (const g of data.guides) {
    if (onlyGuide && g.id !== onlyGuide) continue;
    const steps = g.steps || [];
    const missing = steps.map((s, i) => ({ s, i })).filter(x => !hasMedia(x.s));
    if (!missing.length) continue;
    const src = g.video || g.audio || null;
    list.push({ g, steps, missing, src, kind: g.video ? 'video' : g.audio ? 'audio' : 'none' });
  }
  return list;
}

// ---- --audit ----
if (flag('--audit')) {
  let n = 0;
  for (const t of targets()) {
    const p = t.src ? probe(localPath(t.src)) : null;
    console.log(`\n${t.g.id}  [${t.kind}]  ${t.src || '—'}  ${p ? `${p.dur.toFixed(1)}s ${p.w}x${p.h}` : 'NO SOURCE'}`);
    for (const m of t.missing) { n++; console.log(`   ${m.i + 1}. ${m.s.title}`); }
  }
  console.log(`\n${n} steps without media`);
  process.exit(0);
}

// ---- --sheet : 12 thumbs per video so timecodes can be picked by eye ----
if (flag('--sheet')) {
  const dir = path.join(TMP, 'sheets'); fs.mkdirSync(dir, { recursive: true });
  for (const t of targets()) {
    if (t.kind !== 'video') continue;
    const src = localPath(t.src); const p = probe(src); if (!p) continue;
    const out = path.join(dir, t.g.id + '.jpg');
    // one frame every dur/12 s, 4x3 grid, timestamps burned in
    const fps = 12 / p.dur;
    sh('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf',
      `fps=${fps},scale=480:-2,drawtext=text='%{pts\\:hms}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=4x3`,
      '-frames:v', '1', '-q:v', '4', out]);
    console.log('sheet', out);
  }
  process.exit(0);
}

// ---- --apply ----
if (!flag('--apply')) { console.log('use --audit | --sheet | --apply'); process.exit(1); }

const WEBP_MAX_W = 1600, WEBP_MAX_KB = 500;
const CLIP_SEC = 4, CLIP_MAX_KB = 1500;
const AUDIO_SEC = 12;

function cutFrame(src, at, out) {
  // try q82 → q70 → q60 until under the cap
  for (const q of [82, 70, 60]) {
    sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-i', src, '-frames:v', '1',
      '-vf', `scale='min(${WEBP_MAX_W},iw)':-2`, '-c:v', 'libwebp', '-q:v', String(q), out]);
    if (kb(out) <= WEBP_MAX_KB) return;
  }
}
function cutClip(src, at, out, poster) {
  for (const crf of [26, 29, 32]) {
    sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-t', String(CLIP_SEC), '-i', src,
      '-an', '-vf', `scale='min(1280,iw)':-2:flags=lanczos,fps=30`, '-c:v', 'libx264', '-preset', 'slow',
      '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]);
    if (kb(out) <= CLIP_MAX_KB) break;
  }
  cutFrame(src, at, poster);
}
function cutAudio(src, at, out) {
  sh('ffmpeg', ['-y', '-v', 'error', '-ss', String(at), '-t', String(AUDIO_SEC), '-i', src,
    '-af', 'afade=t=in:d=0.4,afade=t=out:st=' + (AUDIO_SEC - 0.6) + ':d=0.6',
    '-c:a', 'libmp3lame', '-b:a', '160k', out]);
}

let cut = 0, skipped = 0;
for (const t of targets()) {
  const gp = plan[t.g.id];
  if (!gp) { console.log('no plan for', t.g.id, '— skipped'); skipped += t.missing.length; continue; }
  if (!t.src) { console.log('no source for', t.g.id); skipped += t.missing.length; continue; }
  const src = localPath(t.src);
  const p = probe(src); if (!p) { console.log('probe failed', t.src); continue; }
  const outDir = path.join(ROOT, OUT_DIR, t.g.id); fs.mkdirSync(outDir, { recursive: true });

  for (const m of t.missing) {
    const sp = gp[String(m.i + 1)];
    if (!sp) { console.log(`  ${t.g.id} step ${m.i + 1}: no plan entry — skipped`); skipped++; continue; }
    const at = Math.min(Math.max(0, sp.at ?? 1.5), Math.max(0, p.dur - (sp.type === 'clip' ? CLIP_SEC : sp.type === 'audio' ? AUDIO_SEC : 0.2)));
    const base = `step-${m.i + 1}`;
    const rel = f => `/${OUT_DIR}/${t.g.id}/${f}`;
    if (sp.type === 'clip' && t.kind === 'video') {
      const mp4 = path.join(outDir, base + '.mp4'), webp = path.join(outDir, base + '-poster.webp');
      cutClip(src, at, mp4, webp);
      m.s.result_video = rel(base + '.mp4'); m.s.result_poster = rel(base + '-poster.webp');
      m.s.result_label = `Excerpt from the final render · ${fmtT(at)}–${fmtT(at + CLIP_SEC)}`;
      console.log(`  ${t.g.id} ${base} clip @${at}s ${kb(mp4)}KB`);
    } else if (sp.type === 'audio' && t.kind === 'audio') {
      const mp3 = path.join(outDir, base + '.mp3');
      cutAudio(src, at, mp3);
      m.s.result_audio = rel(base + '.mp3');
      m.s.result_label = `Excerpt from the final track · ${fmtT(at)}–${fmtT(at + AUDIO_SEC)}`;
      console.log(`  ${t.g.id} ${base} audio @${at}s ${kb(mp3)}KB`);
    } else if (t.kind === 'video') {
      const webp = path.join(outDir, base + '.webp');
      cutFrame(src, at, webp);
      m.s.result_image = rel(base + '.webp');
      m.s.result_label = `Frame from the final render · ${fmtT(at)}`;
      console.log(`  ${t.g.id} ${base} frame @${at}s ${kb(webp)}KB`);
    } else { skipped++; continue; }
    if (sp.caption) m.s.result_caption = sp.caption;
    m.s.result_source = 'final';   // marks derived evidence; renderer + checker use it
    cut++;
  }
}
fs.writeFileSync(GUIDES, JSON.stringify(data, null, 2) + '\n');
console.log(`\ncut ${cut} assets, skipped ${skipped}. guides.json patched.`);
