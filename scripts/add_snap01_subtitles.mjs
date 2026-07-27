import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const input = 'snap01/promo/snap01-kitchen-configurator-promo.mp4';
const output = 'snap01/promo/snap01-kitchen-configurator-promo.mp4'; // overwrite via temp then copy
const tmpOut = '.temp/snap01-promo-subtitled.mp4';

const font = '.temp/fonts/Inter-Variable.ttf';
if (!existsSync(font)) { console.error('Missing font:', font); process.exit(1); }
if (!existsSync(input)) { console.error('Missing input:', input); process.exit(1); }

// Guidebook palette (locked, see snap01-concept pin)
const PAPER = '0xF3EDE1';
const INK = '0x2B3A55';
const SIGNAL = '0xFF6B35';

// Timing measured directly off the VO track via analyze_levels (silence gaps),
// then merged at sentence boundaries. NOT guessed — matches actual speech.
const cards = [
  { start: 0.000, end: 5.848, lines: ['SNAP/01 turns a kitchen brief into six modules', 'with locked dimensions and locked prices.'] },
  { start: 6.536, end: 8.052, lines: ['Drag a module onto the grid,'] },
  { start: 8.423, end: 10.632, lines: ['and the bill of materials updates on the spot.'] },
  { start: 11.267, end: 14.247, lines: ['A three-hundred-millimeter grid keeps every edge aligned,'] },
  { start: 14.694, end: 17.775, lines: ['and the corner unit only fits where the room', 'actually has a corner.'] },
  { start: 18.676, end: 21.808, lines: ['Click any placed module to inspect it in real 3D', 'and rotate it against the plan.'] },
  { start: 22.123, end: 23.805, lines: ['Six models, one live price,'] },
  { start: 24.462, end: 28.142, lines: ['and zero clearance collisions.'], y: 'h-135', fontsize: 34, boxborderw: [18, 13] },
];

const FONTSIZE = 42;
const LINE_SPACING = 10;
const Y = 'h-210';

const esc = (s) => s
  .replace(/\\/g, '\\\\\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, "\\'")
  .replace(/%/g, '\\%');

const filters = [];
for (const c of cards) {
  const text = esc(c.lines.join('\n'));
  const enable = `between(t\\,${c.start}\\,${c.end})`;
  const fs = c.fontsize || FONTSIZE;
  const y = c.y || Y;
  const [borderOuter, borderInner] = c.boxborderw || [26, 20];
  // Layer A: outer SIGNAL-orange border ring (box only, text invisible)
  filters.push(
    `drawtext=fontfile=${font}:text='${text}':fontsize=${fs}:fontcolor=${SIGNAL}@0.0:` +
    `line_spacing=${LINE_SPACING}:box=1:boxcolor=${SIGNAL}@0.95:boxborderw=${borderOuter}:` +
    `x=(w-text_w)/2:y=${y}:enable='${enable}'`
  );
  // Layer B: inner INK fill + PAPER text (the readable caption itself, no stroke/outline)
  filters.push(
    `drawtext=fontfile=${font}:text='${text}':fontsize=${fs}:fontcolor=${PAPER}@1.0:` +
    `line_spacing=${LINE_SPACING}:box=1:boxcolor=${INK}@0.92:boxborderw=${borderInner}:` +
    `x=(w-text_w)/2:y=${y}:enable='${enable}'`
  );
}

const vf = filters.join(',');

const args = [
  '-y',
  '-i', input,
  '-vf', vf,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-c:a', 'copy',
  '-movflags', '+faststart',
  tmpOut,
];

console.log('Burning', cards.length, 'guidebook-style caption cards onto SNAP/01 promo...');
const res = spawnSync(ffmpeg, args, { encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status ?? 1);
}

copyFileSync(tmpOut, output);
console.log('DONE', output);
