#!/usr/bin/env node
/**
 * Contact sheet + single-frame extractor.
 *
 * A contact sheet is the cheapest visual-QA tool there is: one image showing N
 * frames spread across a clip. Artifacts that are invisible while a video plays
 * — a single banded frame, one z-fighting pop, a cut that lands one frame early —
 * are obvious the moment you see the frames side by side.
 *
 * Usage:
 *   node scripts/make_contact_sheet.mjs sheet <in.mp4> <out.png> [cols] [rows]
 *   node scripts/make_contact_sheet.mjs frame <in.mp4> <out.png> <seconds> [width]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

function ff(args) {
  return execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
}

// PNG is the wrong container for a photographic frame grab: the 4x3 sheet lands at
// 2 MB as PNG and 240 KB as JPEG q=3 with no visible difference on a dark scene.
function encodeArgs(out) {
  return /\.jpe?g$/i.test(out) ? ['-q:v', '3'] : [];
}

function duration(file) {
  const out = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=nw=1:nk=1', file
  ], { encoding: 'utf8' });
  return parseFloat(out.trim());
}

function ensureDir(file) {
  const d = dirname(file);
  if (d && !existsSync(d)) mkdirSync(d, { recursive: true });
}

function report(file) {
  const kb = statSync(file).size / 1024;
  console.log(`wrote ${file} (${kb.toFixed(0)} KB)`);
}

const [mode, input, output, a, b] = process.argv.slice(2);
if (!mode || !input || !output) {
  console.error('usage: sheet <in> <out.png> [cols] [rows] | frame <in> <out.png> <sec> [width]');
  process.exit(1);
}
if (!existsSync(input)) { console.error('missing input: ' + input); process.exit(1); }
ensureDir(output);

if (mode === 'sheet') {
  const cols = Number(a || 4), rows = Number(b || 3);
  const n = cols * rows;
  const dur = duration(input);
  // Sample on a fixed grid rather than by keyframe: keyframes cluster around cuts,
  // which is exactly where you get a biased, flattering selection of frames.
  const step = dur / (n + 1);
  const rate = 1 / step;
  ff([
    '-i', input,
    '-vf', `fps=${rate.toFixed(6)},scale=560:-2,tile=${cols}x${rows}:margin=12:padding=8:color=0x0E0E14`,
    '-frames:v', '1',
    ...encodeArgs(output),
    output
  ]);
  console.log(`sheet: ${cols}x${rows} = ${n} frames over ${dur.toFixed(1)}s (every ${step.toFixed(2)}s)`);
  report(output);
} else if (mode === 'frame') {
  const sec = Number(a || 0), width = Number(b || 1600);
  ff(['-ss', String(sec), '-i', input, '-vf', `scale=${width}:-2`, '-frames:v', '1',
      ...encodeArgs(output), output]);
  console.log(`frame: t=${sec}s w=${width}`);
  report(output);
} else {
  console.error('unknown mode: ' + mode);
  process.exit(1);
}
