// HEAD every remote asset referenced by guides.json and report what still serves.
//
// Context: four cover images were already found dead (Vercel Blob objects gone),
// and generate_video_posters.mjs then hit 403 on a guide video from the same store.
// Before patching records one by one, find out how much of the 116 blob refs is
// actually broken.
//
// Usage: node scripts/check_blob_liveness.mjs
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('ui_views/guides.json', 'utf8'));
const list = Array.isArray(data) ? data : (data.guides || []);

// url -> [ "<guide id> <field>" ]
const refs = new Map();
const note = (url, where) => {
  if (!url || !/^https?:/i.test(url)) return;
  if (!refs.has(url)) refs.set(url, []);
  refs.get(url).push(where);
};

for (const g of list) {
  ['image', 'poster', 'video', 'audio'].forEach(f => note(g[f], `${g.id}.${f}`));
  (g.steps || []).forEach((s, i) => {
    if (!s) return;
    ['result_image', 'result_video', 'result_poster', 'result_model'].forEach(f => note(s[f], `${g.id}.step${i}.${f}`));
    (s.models || []).forEach((m, j) => { note(m.model, `${g.id}.step${i}.model${j}`); note(m.poster, `${g.id}.step${i}.model${j}.poster`); });
  });
  (g.downloads || []).forEach((d, i) => note(d && d.file, `${g.id}.download${i}`));
}

const urls = [...refs.keys()];
console.log(`checking ${urls.length} remote refs...\n`);

const CONCURRENCY = 12;
const dead = [];
let alive = 0, idx = 0;

async function worker() {
  while (idx < urls.length) {
    const url = urls[idx++];
    let status = 0;
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      status = r.status;
    } catch (e) { status = -1; }
    if (status >= 200 && status < 400) alive++;
    else dead.push({ url, status, where: refs.get(url) });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`alive: ${alive}`);
console.log(`dead:  ${dead.length}\n`);

const byGuide = new Map();
for (const d of dead) {
  for (const w of d.where) {
    const id = w.split('.')[0];
    if (!byGuide.has(id)) byGuide.set(id, []);
    byGuide.get(id).push(`${w} [${d.status}]`);
  }
}
for (const [id, fields] of [...byGuide].sort()) {
  console.log(`DEAD ${id}`);
  fields.forEach(f => console.log(`       ${f}`));
}

fs.mkdirSync('.temp', { recursive: true });
fs.writeFileSync('.temp/dead-blobs.json', JSON.stringify(dead, null, 2) + '\n');
console.log(`\nfull list -> .temp/dead-blobs.json`);
