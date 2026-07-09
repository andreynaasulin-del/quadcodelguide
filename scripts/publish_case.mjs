#!/usr/bin/env node
/**
 * publish_case.mjs — publish a full case (guide + media) to Quadcode Guide
 * from any machine / any Quadcode project. One command, no git needed.
 *
 * Usage:
 *   GUIDES_API_KEY=<key> node scripts/publish_case.mjs guide.json
 *
 * guide.json = a normal guide object (same schema as guides.json entries),
 * BUT media fields ("video", "poster", "image", "audio", steps[].result_image,
 * steps[].result_video, steps[].result_poster) may point to LOCAL FILES or
 * site paths like /ui_views/assets/foo.mp4. Every local path found is uploaded
 * to Vercel Blob first, then replaced with the public Blob URL and published.
 *
 * Options:
 *   --dry-run     validate + upload nothing, show what would happen
 *   --site <url>  override site base (default https://quadcodeguide.vercel.app)
 *
 * Requires: Node 18+ (built-in fetch), npm i @vercel/blob
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { rewriteGuideMedia, isRemoteUrl } from './lib/media.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const siteIdx = args.indexOf('--site');
const SITE = siteIdx >= 0 ? args[siteIdx + 1] : 'https://quadcodeguide.vercel.app';
const guideFile = args.find((a) => !a.startsWith('--') && a !== SITE);
const KEY = process.env.GUIDES_API_KEY;

if (!guideFile || !KEY) {
  console.error('Usage: GUIDES_API_KEY=<key> node scripts/publish_case.mjs <guide.json> [--dry-run] [--site url]');
  process.exit(1);
}

const guide = JSON.parse(readFileSync(guideFile, 'utf8'));
const baseDir = dirname(resolve(guideFile));

async function main() {
  console.log(`Publishing case "${guide.id}" to ${SITE}${dryRun ? ' (dry run)' : ''}`);

  const n = await rewriteGuideMedia(guide, {
    site: SITE,
    apiKey: KEY,
    dryRun,
    baseDir,
    fetchMissingFromGit: true,
  });
  console.log(`  media fields uploaded: ${n}`);

  // Warn if any media field is still a local /ui_views path (file missing)
  const leftover = [];
  for (const f of ['video', 'poster', 'image', 'audio']) {
    if (guide[f] && !isRemoteUrl(guide[f]) && String(guide[f]).startsWith('/')) {
      leftover.push(`${f}=${guide[f]}`);
    }
  }
  for (const [i, s] of (guide.steps || []).entries()) {
    for (const f of ['result_image', 'result_video', 'result_poster']) {
      if (s[f] && !isRemoteUrl(s[f]) && String(s[f]).startsWith('/')) {
        leftover.push(`steps[${i}].${f}=${s[f]}`);
      }
    }
  }
  if (leftover.length) {
    console.warn('  WARNING: still non-Blob paths (file missing or skipped):');
    leftover.forEach((l) => console.warn('   ', l));
  }

  const res = await fetch(`${SITE}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify({ guide, dryRun, message: `Publish case: ${guide.id}` }),
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('Publish failed:', JSON.stringify(json, null, 2));
    process.exit(1);
  }
  console.log('Publish OK:', JSON.stringify(json, null, 2));
  if (!dryRun) console.log(`\nLive in ~1 min: ${SITE}/#/guide/${guide.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
