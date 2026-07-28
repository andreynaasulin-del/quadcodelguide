// Remove guide records whose original media is irrecoverably gone.
//
// These eight guides had 60 Vercel Blob URLs returning 403. The blob-key resolver
// searched the workspace by original filename and found no source media, so
// branded placeholders would merely hide empty guide pages. Remove the records
// rather than presenting a fake guide.
//
// Usage:
//   node scripts/remove_dead_guides.mjs          # audit only
//   node scripts/remove_dead_guides.mjs --apply  # rewrite guides.json + remove asset dirs
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const GUIDES_FILE = 'ui_views/guides.json';
const ASSETS_ROOT = 'ui_views/assets';
const IDS = new Set([
  'atlas-freight-cinematic-logistics',
  'dictly-voice-to-text-app',
  'flowforge-monochrome-workflow-editor',
  'liquid-ai-essence-orb',
  'purple-loader-orb-brand-asset-pack',
  'quadcode-platform-one-workspace-to-ship-software',
  'screenshot-to-pixel-perfect-ui',
  'ugc-creator-studio-consistent-ai-influencer'
]);

const raw = fs.readFileSync(GUIDES_FILE, 'utf8');
const data = JSON.parse(raw);
const list = Array.isArray(data) ? data : data.guides;
if (!Array.isArray(list)) throw new Error('guides.json does not contain a guides array');

const present = list.filter(g => IDS.has(g.id));
const unexpected = present.filter(g => !IDS.has(g.id));
if (unexpected.length) throw new Error('Refusing to remove unexpected records');

console.log(`records before: ${list.length}`);
console.log(`matched IDs:    ${present.length}`);
for (const g of present) console.log(`REMOVE ${g.id} — ${g.title}`);
for (const id of IDS) if (!present.some(g => g.id === id)) console.log(`ABSENT ${id}`);

const folders = [...IDS].map(id => path.join(ASSETS_ROOT, id)).filter(fs.existsSync);
console.log(`asset folders found: ${folders.length}`);
folders.forEach(p => console.log(`ASSET  ${p}`));

if (!APPLY) {
  console.log('\nDry run only. Pass --apply to remove records and asset folders.');
  process.exit(0);
}

const next = list.filter(g => !IDS.has(g.id));
if (next.length !== list.length - present.length) throw new Error('Record count invariant failed');
if (Array.isArray(data)) fs.writeFileSync(GUIDES_FILE, JSON.stringify(next, null, 2) + '\n');
else {
  data.guides = next;
  fs.writeFileSync(GUIDES_FILE, JSON.stringify(data, null, 2) + '\n');
}
for (const folder of folders) fs.rmSync(folder, { recursive: true, force: true });

const after = JSON.parse(fs.readFileSync(GUIDES_FILE, 'utf8'));
const afterList = Array.isArray(after) ? after : after.guides;
const leaked = afterList.filter(g => IDS.has(g.id));
if (leaked.length) throw new Error(`Removal incomplete: ${leaked.map(g => g.id).join(', ')}`);
console.log(`\nrecords after: ${afterList.length}`);
console.log('Removal complete.');
