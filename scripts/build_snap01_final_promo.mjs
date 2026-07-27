import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const a01 = 'ui_views/assets/snap01-01-wireframe-form-logic.png';
const a02 = 'ui_views/assets/snap01-02-interaction-matrix.png';
const a03 = 'ui_views/assets/snap01-03-identity-render.png';
const a04 = 'ui_views/assets/snap01-04-module-library.png';
const a08 = 'snap01/08-technical-spec.png'; // correct blueprint spec sheet — do NOT use stale ui_views/assets copy
const closeupInput = '.temp/recordings/snap01-3d-closeup.mp4';
const widgetInput = '.temp/recordings/snap01-widget-demo.mp4';
const watermarkInput = '.temp/upload/Group 1171276468.png';
const voiceInput = 'snap01/promo/snap01-voiceover.mp3';
const sfxInput = 'snap01/promo/snap01-sfx.wav';

const outputPromo = 'snap01/promo/snap01-kitchen-configurator-promo.mp4';
const outputAsset = 'ui_views/assets/snap01-kitchen-configurator-promo.mp4';

mkdirSync('snap01/promo', { recursive: true });
mkdirSync('ui_views/assets', { recursive: true });

const required = [a01, a02, a03, a04, a08, closeupInput, widgetInput, watermarkInput, voiceInput, sfxInput];
for (const f of required) {
  if (!existsSync(f)) { console.error('Missing:', f); process.exit(1); }
}

// ~29.6s cut — VO (28.47s) still covers nearly the whole thing, ~1.1s natural
// trailing silence at the end (same hold-pattern as npc01/savor01).
// 0.0–1.8    wireframe form logic       (shrunk from 2.4s — less time on blueprints)
// 1.8–3.6    interaction matrix          (shrunk)
// 3.6–5.4    identity render             (shrunk)
// 5.4–7.2    module library              (shrunk)
// 7.2–10.37  3D CLOSE-UP MONTAGE (NEW) — real GLB close-ups: Island, Corner Unit, Drawer Stack
// 10.37–26.30 REAL widget demo ~15.93s (drag-drop, BOM tick-up, collision rule, EXTENDED 3D orbit)
// 26.30–29.62 technical spec / BOM outro — CORRECT blueprint file (snap01/08-technical-spec.png)
// Watermark top-center flush, 10% width
// VO: natural pace — NO atempo

const STILL_DUR = 1.8;
const CLOSEUP_DUR = 3.167;
const WIDGET_DUR = 15.933;
const OUTRO_DUR = 3.32;
const TOTAL = STILL_DUR * 4 + CLOSEUP_DUR + WIDGET_DUR + OUTRO_DUR;

const still = (idx, label, dur) =>
  `[${idx}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,trim=duration=${dur},setpts=PTS-STARTPTS[${label}]`;

const filterComplex = [
  still(0, 's01', STILL_DUR),
  still(1, 's02', STILL_DUR),
  still(2, 's03', STILL_DUR),
  still(3, 's04', STILL_DUR),
  '[4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[closeup]',
  '[5:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[widget]',
  still(6, 's08', OUTRO_DUR.toFixed(3)),
  '[s01][s02][s03][s04][closeup][widget][s08]concat=n=7:v=1:a=0,setpts=PTS-STARTPTS[base]',
  '[7:v]scale=192:-1[wm]',
  '[base][wm]overlay=x=(main_w-w)/2:y=0[v]',
  `[8:a]volume=1.0,atrim=0:${TOTAL.toFixed(3)},asetpts=PTS-STARTPTS[vo]`,
  `[9:a]aloop=loop=-1:size=2e+09,volume=0.22,lowpass=f=3000,atrim=0:${TOTAL.toFixed(3)},asetpts=PTS-STARTPTS[bg]`,
  '[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[a]',
].join(';');

const args = [
  '-y',
  '-loop', '1', '-t', String(STILL_DUR), '-i', a01,
  '-loop', '1', '-t', String(STILL_DUR), '-i', a02,
  '-loop', '1', '-t', String(STILL_DUR), '-i', a03,
  '-loop', '1', '-t', String(STILL_DUR), '-i', a04,
  '-i', closeupInput,
  '-i', widgetInput,
  '-loop', '1', '-t', String(OUTRO_DUR), '-i', a08,
  '-i', watermarkInput,
  '-i', voiceInput,
  '-i', sfxInput,
  '-filter_complex', filterComplex,
  '-map', '[v]',
  '-map', '[a]',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '13',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-movflags', '+faststart',
  '-t', String(TOTAL.toFixed(3)),
  outputPromo,
];

console.log('Building SNAP/01 promo: stills + real widget demo 15.55s, natural VO, total ~28.47s...');
const res = spawnSync(ffmpeg, args, { encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status ?? 1);
}

copyFileSync(outputPromo, outputAsset);
console.log('DONE', outputPromo);
console.log('COPIED', outputAsset);
