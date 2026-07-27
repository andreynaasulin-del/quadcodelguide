import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

// Inputs — full NPC/01 pipeline assets + real 360 orbit
const a01 = 'ui_views/assets/npc01-01-silhouette-test.png';
const a02 = 'ui_views/assets/npc01-02-variant-matrix.png';
const a03 = 'ui_views/assets/npc01-03-identity-render.png';
const a04 = 'ui_views/assets/npc01-04-turnaround.png';
const a05 = 'ui_views/assets/npc01-05-expression-accessories.png';
const a06 = 'ui_views/assets/npc01-06-animation-poses.png';
const a08 = 'ui_views/assets/npc01-08-apose-technical.png';
const orbitInput = '.temp/recordings/npc01-glb-full-orbit.mp4';
const watermarkInput = '.temp/upload/Group 1171276468.png';
const voiceInput = 'npc01/promo/npc01-voiceover.mp3';
const sfxInput = 'npc01/promo/npc01-sfx.wav';

const outputPromo = 'npc01/promo/npc01-dark-fantasy-promo.mp4';
const outputAsset = 'ui_views/assets/npc01-dark-fantasy-promo.mp4';

mkdirSync('npc01/promo', { recursive: true });
mkdirSync('ui_views/assets', { recursive: true });

const required = [a01, a02, a03, a04, a05, a06, a08, orbitInput, watermarkInput, voiceInput, sfxInput];
for (const f of required) {
  if (!existsSync(f)) {
    console.error('Missing:', f);
    process.exit(1);
  }
}

// ~23.5s cut — matches natural-pace VO (no atempo)
// raw orbit 7.433s → 7.0s => setpts = 7/7.433 ≈ 0.9417
// 0.0–2.2   silhouette
// 2.2–4.4   matrix
// 4.4–6.6   identity
// 6.6–8.8   turnaround
// 8.8–15.8  REAL 360 orbit 7s
// 15.8–18.0 expressions
// 18.0–20.2 animation poses
// 20.2–23.5 technical a-pose (+1s hold for VO tail)
// Watermark top-center flush, 10% width
// VO: natural pace — NO atempo

const TOTAL = 23.5;

const still = (idx, label, dur) =>
  `[${idx}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,trim=duration=${dur},setpts=PTS-STARTPTS[${label}]`;

const filterComplex = [
  still(0, 's01', 2.2),
  still(1, 's02', 2.2),
  still(2, 's03', 2.2),
  still(3, 's04', 2.2),
  // orbit 7s from raw 7.433
  '[4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=0.9417*PTS,fps=30,format=yuv420p,trim=duration=7,setpts=PTS-STARTPTS[orbit]',
  still(5, 's05', 2.2),
  still(6, 's06', 2.2),
  still(7, 's08', 3.3),
  '[s01][s02][s03][s04][orbit][s05][s06][s08]concat=n=8:v=1:a=0,setpts=PTS-STARTPTS[base]',
  '[8:v]scale=192:-1[wm]',
  '[base][wm]overlay=x=(main_w-w)/2:y=0[v]',
  // VO natural pace — no atempo
  '[9:a]volume=1.0,atrim=0:23.5,asetpts=PTS-STARTPTS[vo]',
  '[10:a]aloop=loop=-1:size=2e+09,volume=0.22,lowpass=f=3000,atrim=0:23.5,asetpts=PTS-STARTPTS[bg]',
  '[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[a]',
].join(';');

const args = [
  '-y',
  '-loop', '1', '-t', '3', '-i', a01,
  '-loop', '1', '-t', '3', '-i', a02,
  '-loop', '1', '-t', '3', '-i', a03,
  '-loop', '1', '-t', '3', '-i', a04,
  '-i', orbitInput,
  '-loop', '1', '-t', '3', '-i', a05,
  '-loop', '1', '-t', '3', '-i', a06,
  '-loop', '1', '-t', '4', '-i', a08,
  '-i', watermarkInput,
  '-i', voiceInput,
  '-i', sfxInput,
  '-filter_complex', filterComplex,
  '-map', '[v]',
  '-map', '[a]',
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '16',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-movflags', '+faststart',
  '-t', String(TOTAL),
  outputPromo,
];

console.log('Building NPC/01 promo: assets + orbit 7s, natural VO, total ~23.5s...');
const res = spawnSync(ffmpeg, args, { encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status ?? 1);
}

copyFileSync(outputPromo, outputAsset);
console.log('DONE', outputPromo);
console.log('COPIED', outputAsset);
