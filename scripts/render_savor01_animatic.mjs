import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';

const ffmpeg = process.env.FFMPEG || 'ffmpeg';
const dir = 'savor01/motion';
const temp = '.temp/savor01-animatic';
mkdirSync(temp, { recursive: true });

const shots = [
  ['01-evidence-spill-crop.png', 3.25, 'in'],
  ['02-date-collision-crop.png', 3.25, 'out'],
  ['03-evidence-capture-crop.png', 3.25, 'in'],
  ['04-triage-build-crop.png', 4.25, 'out'],
  ['05-four-states-final.png', 4.25, 'in'],
  ['06-final-lockup-crop.png', 3.00, 'hold']
];

function run(args) {
  const result = spawnSync(ffmpeg, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

shots.forEach(([file, duration, move], i) => {
  const input = `${dir}/${file}`;
  if (!existsSync(input)) throw new Error(`Missing ${input}`);
  const frames = Math.round(duration * 24);
  const zoom = move === 'in'
    ? "min(zoom+0.00018,1.015)"
    : move === 'out' ? "if(lte(on,1),1.015,max(zoom-0.00018,1.0))" : '1.0';
  run(['-y','-loop','1','-i',input,'-vf',`zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,format=yuv420p`,'-frames:v',String(frames),'-an','-c:v','libx264','-preset','medium','-crf','15',`${temp}/shot-${i+1}.mp4`]);
});

const args = ['-y'];
for (let i=1;i<=6;i++) args.push('-i',`${temp}/shot-${i}.mp4`);
args.push('-filter_complex',[
  '[0:v][1:v]xfade=transition=wipeleft:duration=0.25:offset=3[v1]',
  '[v1][2:v]xfade=transition=wipeup:duration=0.25:offset=6[v2]',
  '[v2][3:v]xfade=transition=wiperight:duration=0.25:offset=9[v3]',
  '[v3][4:v]xfade=transition=wipedown:duration=0.25:offset=13[v4]',
  '[v4][5:v]xfade=transition=wipeleft:duration=0.25:offset=17,format=yuv420p[v]'
].join(';'),'-map','[v]','-r','24','-t','20','-an','-c:v','libx264','-preset','slow','-crf','15','-movflags','+faststart',`${dir}/savor01-animatic-v01.mp4`);
run(args);
console.log(`Rendered ${dir}/savor01-animatic-v01.mp4`);
