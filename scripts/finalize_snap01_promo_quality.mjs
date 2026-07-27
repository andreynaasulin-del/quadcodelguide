import { spawnSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';

const input = 'snap01/promo/snap01-promo-upscaled.mp4'; // Topaz output: 3840x2160@60fps, 461MB
const output = 'snap01/promo/snap01-kitchen-configurator-promo.mp4';
const outputAsset = 'ui_views/assets/snap01-kitchen-configurator-promo.mp4';
const outputWebm = 'snap01/promo/snap01-kitchen-configurator-promo.webm';
const tmpOut = '.temp/snap01-promo-final-hq.mp4';

if (!existsSync(input)) { console.error('Missing:', input); process.exit(1); }

// Downscale 4K/60 -> 1920x1080/60 (high-quality lanczos), then encode with a
// bitrate cap sane for web delivery (target ~6Mbps, hard cap 8Mbps) instead
// of pure CRF, so the file can't balloon on high-motion segments (drag-drop,
// 3D orbit) — this is the "optimize encoding for web delivery" step.
const args = [
  '-y',
  '-i', input,
  '-vf', 'scale=1920:1080:flags=lanczos,format=yuv420p',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '20',
  '-maxrate', '6M',
  '-bufsize', '12M',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '192k',
  '-movflags', '+faststart',
  tmpOut,
];

console.log('Downscaling 4K/60fps Topaz output -> 1920x1080@60fps web-optimized encode...');
const res = spawnSync(ffmpeg, args, { encoding: 'utf8' });
if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(res.status ?? 1);
}

copyFileSync(tmpOut, output);
copyFileSync(tmpOut, outputAsset);
console.log('DONE', output);
console.log('COPIED', outputAsset);

console.log('Rebuilding webm fallback...');
const webmArgs = [
  '-y',
  '-i', tmpOut,
  '-c:v', 'libvpx-vp9',
  '-crf', '32',
  '-b:v', '0',
  '-deadline', 'good',
  '-cpu-used', '2',
  '-c:a', 'libopus',
  '-b:a', '128k',
  outputWebm,
];
const res2 = spawnSync(ffmpeg, webmArgs, { encoding: 'utf8' });
if (res2.status !== 0) {
  console.error(res2.stderr || res2.stdout);
  process.exit(res2.status ?? 1);
}
console.log('DONE', outputWebm);
