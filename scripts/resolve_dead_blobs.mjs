// Match the 116 dead blob URLs against files we still have on disk.
//
// Vercel Blob keys look like  <name>-<21charRandomSuffix>.<ext>  , so the
// original filename is recoverable: strip the suffix and look for that basename
// anywhere in the repo. Whatever matches can be self-hosted under
// ui_views/assets/<guide-id>/ and stops depending on a store that already
// dropped 116 objects once.
//
//   node scripts/resolve_dead_blobs.mjs          # report only
//   node scripts/resolve_dead_blobs.mjs --apply  # copy files + rewrite guides.json
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const GUIDES = 'ui_views/guides.json';
const DEST_ROOT = 'ui_views/assets';
const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', '.vercel', 'blob-backup', 'video-originals']);
const MEDIA = /\.(png|jpe?g|webp|gif|mp4|webm|mov|glb|gltf|mp3|wav|svg|pdf|zip)$/i;

// --- index every media file on disk by basename -----------------------------
const byName = new Map(); // "foo.png" -> [paths]
(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.temp') continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (MEDIA.test(e.name)) {
      const k = e.name.toLowerCase();
      if (!byName.has(k)) byName.set(k, []);
      byName.get(k).push(p);
    }
  }
})('.');

// Blob suffix is 21 chars of [A-Za-z0-9]; only strip when it really looks like one.
const originalName = (url) => {
  const base = decodeURIComponent(new URL(url).pathname.split('/').pop());
  const ext = path.extname(base);
  const stem = base.slice(0, -ext.length);
  const m = stem.match(/^(.*)-[A-Za-z0-9]{20,30}$/);
  return (m ? m[1] : stem) + ext;
};

// Prefer a file that already lives in the repo proper over a .temp/upload copy.
const rank = (p) => (p.startsWith('ui_views/assets') ? 0 : p.startsWith('assets') ? 1 : p.startsWith('.temp') ? 3 : 2);

const dead = JSON.parse(fs.readFileSync('.temp/dead-blobs.json', 'utf8'));
const resolved = new Map(); // deadUrl -> { src, dest, webPath }
const unresolved = [];

for (const d of dead) {
  const want = originalName(d.url).toLowerCase();
  const hits = (byName.get(want) || []).slice().sort((a, b) => rank(a) - rank(b));
  if (!hits.length) { unresolved.push({ url: d.url, want, where: d.where }); continue; }
  const guideId = new URL(d.url).pathname.split('/').filter(Boolean)[1] || 'misc';
  const webPath = `/ui_views/assets/${guideId}/${originalName(d.url)}`;
  resolved.set(d.url, { src: hits[0], dest: path.join(DEST_ROOT, guideId, originalName(d.url)), webPath });
}

console.log(`dead refs:  ${dead.length}`);
console.log(`resolvable: ${resolved.size}`);
console.log(`missing:    ${unresolved.length}\n`);

const missByGuide = new Map();
for (const u of unresolved) {
  const id = u.where[0].split('.')[0];
  if (!missByGuide.has(id)) missByGuide.set(id, []);
  missByGuide.get(id).push(u.want);
}
for (const [id, names] of [...missByGuide].sort()) {
  console.log(`MISSING ${id} (${names.length})`);
  names.forEach(n => console.log(`         ${n}`));
}

if (!APPLY) { console.log('\n(dry run — pass --apply to copy + rewrite)'); process.exit(0); }

// --- copy files and rewrite every occurrence in guides.json ------------------
let copied = 0;
for (const { src, dest } of resolved.values()) {
  if (fs.existsSync(dest)) continue;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

let json = fs.readFileSync(GUIDES, 'utf8');
let rewritten = 0;
for (const [url, { webPath }] of resolved) {
  const before = json;
  json = json.split(url).join(webPath);
  if (json !== before) rewritten++;
}
fs.writeFileSync(GUIDES, json);
JSON.parse(json); // fail loudly if the rewrite broke the file

console.log(`\ncopied ${copied} files, rewrote ${rewritten} urls in ${GUIDES}`);
