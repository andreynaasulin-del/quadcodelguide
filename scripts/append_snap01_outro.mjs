import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const mainInput = 'snap01/promo/snap01-kitchen-configurator-promo.mp4';
const outroInput = 'snap01/promo/snap01-outro-upscaled.mp4';
const output = 'snap01/promo/snap01-kitchen-configurator-promo.mp4';
const outputAsset = 'ui_views/assets/snap01-kitchen-configurator-promo.mp4';
const tmpOut = '.temp/snap01-promo-with-outro.mp4';

for (const f of [mainInput, outroInput]) {
  if (!existsSync(f)) { console.error('Missing:', f); process.exit(1); }
}

// Outro clip is 6.06s total — user wants the 3.00s -> end segment appended
// (last 3.06s), scaled/padded to match the main promo's 1920x1080@30fps,
// audio kept from the outro clip itself (converted to match main's
// AAC/44100 format so the concat filter can join cleanly).
const OUTRO_START = 3.00;
const OUTRO_END = 6.060;

const filterComplex = [
  '[0:v]setpts=PTS-STARTPTS[v0]',
  `[1:v]trim=start=${OUTRO_START}:end=${OUTRO_END},setpts=PTS-STARTPTS,` +
    'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,' +
    'setsar=1,fps=30,format=yuv420p[v1]',
  '[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a0]',
  `[1:a]atrim=start=${OUTRO_START}:end=${OUTRO_END},asetpts=PTS-STARTPTS,` +
    'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[a1]',
  '[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]',
].join(';');

const args = [
  '-y',
  '-i', mainInput,
  '-i', outroInput,
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
  tmpOut,
];

console.log(`Appending outro segment ${OUTRO_START}s-${OUTRO_END}s (${(OUTRO_END - OUTRO_START).toFixed(2)}s) onto end of main promo...`);
const res = spawnSync(ffmpeg, args, { encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status ?? 1);
}

copyFileSync(tmpOut, output);
copyFileSync(tmpOut, outputAsset);
console.log('DONE', output);
console.log('COPIED', outputAsset);
