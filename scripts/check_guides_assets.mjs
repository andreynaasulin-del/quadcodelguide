// Guard against the class of bug that broke the card headers:
// guides.json referencing files that are not in the repo (deleted blob, wrong path).
import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('ui_views/guides.json', 'utf8'));
const list = Array.isArray(data) ? data : data.guides;
const raw = JSON.stringify(list);

const local = new Set();
for (const m of raw.matchAll(/"(\/ui_views\/[^"]+)"/g)) local.add(m[1]);
const missing = [...local].filter(p => !fs.existsSync('.' + p));

const blob = new Set();
for (const m of raw.matchAll(/"(https:\/\/[^"]*blob\.vercel-storage\.com[^"]+)"/g)) blob.add(m[1]);

const noCover = list.filter(g => !g.image && !g.poster);

console.log(`records=${list.length} localRefs=${local.size} missingLocal=${missing.length} blobRefs=${blob.size} noCover=${noCover.length}`);
missing.forEach(p => console.log('MISSING', p));
noCover.forEach(g => console.log('NO_COVER', g.id, '|', g.video ? 'video' : 'no-media'));
process.exit(missing.length ? 1 : 0);
