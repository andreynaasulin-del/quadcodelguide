import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const dir = 'npc01';
const temp = '.temp/npc01-animatic';
mkdirSync(temp, { recursive: true });

// Shots total 35.22s before 6 xfade transitions of 0.25s (1.5s total overlap), resulting in net 33.72s duration.
// Shots 4 & 5 (11.5s combined) create a prolonged showcase of the 3D character turnaround / spin from all angles.
const shots = [
  ['01-silhouette-test.png', 4.25, 'in'],
  ['02-variant-matrix.png', 4.25, 'out'],
  ['03-identity-render.png', 4.50, 'in'],
  ['04-turnaround.png', 6.00, 'pan_right'],
  ['04-turnaround.png', 5.50, 'pan_left'],
  ['06-animation-poses.png', 5.22, 'in'],
  ['08-apose-technical.png', 5.50, 'hold']
];

function run(args) {
  const result = spawnSync(ffmpeg, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

shots.forEach(([file, duration, move], i) => {
  const input = `${dir}/${file}`;
  if (!existsSync(input)) throw new Error(`Missing ${input}`);
  const frames = Math.round(duration * 24);
  let filter = '';
  if (move === 'in') {
    filter = `zoompan=z='min(zoom+0.00018,1.02)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`;
  } else if (move === 'out') {
    filter = `zoompan=z='if(lte(on,1),1.02,max(zoom-0.00018,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`;
  } else if (move === 'pan_right') {
    filter = `zoompan=z='1.08':x='if(lte(on,1),0,min(x+2.5,iw-iw/zoom))':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`;
  } else if (move === 'pan_left') {
    filter = `zoompan=z='1.08':x='if(lte(on,1),iw-iw/zoom,max(x-2.5,0))':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`;
  } else {
    filter = `zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`;
  }
  run(['-y','-loop','1','-i',input,'-vf',filter,'-frames:v',String(frames),'-an','-c:v','libx264','-preset','medium','-crf','15',`${temp}/shot-${i+1}.mp4`]);
});

const args = ['-y'];
for (let i=1;i<=7;i++) args.push('-i',`${temp}/shot-${i}.mp4`);
args.push('-filter_complex',[
  '[0:v][1:v]xfade=transition=wipeleft:duration=0.25:offset=4.00[v1]',
  '[v1][2:v]xfade=transition=wipeup:duration=0.25:offset=8.00[v2]',
  '[v2][3:v]xfade=transition=wiperight:duration=0.25:offset=12.25[v3]',
  '[v3][4:v]xfade=transition=fade:duration=0.25:offset=18.00[v4]',
  '[v4][5:v]xfade=transition=wipedown:duration=0.25:offset=23.25[v5]',
  '[v5][6:v]xfade=transition=wipeleft:duration=0.25:offset=28.22,format=yuv420p[v]'
].join(';'),'-map','[v]','-r','24','-t','33.72','-an','-c:v','libx264','-preset','slow','-crf','15','-movflags','+faststart',`npc01/motion/npc01-animatic-v01.mp4`);

mkdirSync('npc01/motion', { recursive: true });
run(args);
console.log(`Rendered npc01/motion/npc01-animatic-v01.mp4 (33.72s)`);

