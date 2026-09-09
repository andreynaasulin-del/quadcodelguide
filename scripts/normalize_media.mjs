#!/usr/bin/env node
/**
 * normalize_media.mjs — enforce the media format standard (scripts/lib/normalize.mjs).
 *
 *   node scripts/normalize_media.mjs --check                 # audit guides.json, exit 1 on violations
 *   node scripts/normalize_media.mjs --apply                 # convert files + rewrite refs in guides.json
 *   node scripts/normalize_media.mjs --apply --guide <id>    # one guide only
 *   node scripts/normalize_media.mjs --apply --case a.json   # a standalone case file (before publish)
 *   node scripts/normalize_media.mjs --dry                   # list what --apply would touch
 *
 * Originals of anything re-encoded are copied to .temp/media-originals/ first.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { checkGuide, normalizeGuide, STANDARD, REPO_ROOT } from './lib/normalize.mjs';

const args = process.argv.slice(2);
const has = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const APPLY = has('--apply'), CHECK = has('--check') || (!APPLY && !has('--dry')), DRY = has('--dry');
const ONLY = opt('--guide');
const CASE = opt('--case');

const file = CASE ? resolve(CASE) : resolve(REPO_ROOT, 'ui_views/guides.json');
const baseDir = CASE ? dirname(file) : REPO_ROOT;
const doc = JSON.parse(readFileSync(file, 'utf8'));
const guides = Array.isArray(doc) ? doc : (doc.guides ? doc.guides : [doc]);
const targets = ONLY ? guides.filter(g => g.id === ONLY) : guides;
if (!targets.length) { console.error(`no guide matched ${ONLY}`); process.exit(2); }

let totalErr = 0, totalWarn = 0, totalChanged = 0;
for (const g of targets) {
  if (APPLY || DRY) {
    const { changed, log } = normalizeGuide(g, { baseDir, dryRun: DRY });
    if (log.length) { console.log(`\n# ${g.id}`); log.forEach(l => console.log('  ' + l)); }
    totalChanged += changed;
  }
  const { errors, warnings } = checkGuide(g, { baseDir });
  if (errors.length || warnings.length) {
    console.log(`\n# ${g.id}`);
    errors.forEach(e => console.log('  ERR  ' + e));
    warnings.forEach(w => console.log('  warn ' + w));
  }
  totalErr += errors.length; totalWarn += warnings.length;
}

if (APPLY) {
  writeFileSync(file, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`\nwrote ${file} — ${totalChanged} field(s) rewritten`);
}
console.log(`\n${targets.length} guide(s): ${totalErr} error(s), ${totalWarn} warning(s)` +
  (CHECK ? `  [standard: webp ≤${STANDARD.image.maxWidth}px ≤${STANDARD.image.maxBytes / 1024}KB · h264 ≤${STANDARD.video.maxHeight}p ≤${STANDARD.video.maxKbps}kbps faststart · relative /ui_views paths]` : ''));
process.exit(totalErr ? 1 : 0);
