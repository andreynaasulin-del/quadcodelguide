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

console.log(`records=${list.length} localRefs=${local.size} missingLocal=${missing.length} blobRefs=${blob.size}`);
missing.forEach(p => console.log('MISSING', p));
process.exit(missing.length ? 1 : 0);
