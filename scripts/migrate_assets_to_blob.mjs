#!/usr/bin/env node
/**
 * migrate_assets_to_blob.mjs — one-shot: move local /ui_views media → Vercel Blob
 * and rewrite ui_views/guides.json.
 *
 * Designed for sparse checkouts that exclude *.mp4: missing files are pulled
 * from git temporarily, uploaded, then removed from the working tree again.
 *
 * Usage:
 *   GUIDES_API_KEY=<key> node scripts/migrate_assets_to_blob.mjs [options]
 *
 * Options:
 *   --dry-run          list what would upload, write nothing
 *   --videos-only      only .mp4 / .webm / .mov (default)
 *   --all-media        also posters, images, audio under /ui_views/
 *   --write-local      write updated guides.json to disk (default on)
 *   --no-write-local   skip local write
 *   --publish          POST full guides.json via /api/publish after rewrite
 *   --site <url>       default https://quadcodeguide.vercel.app
 *   --keep-files       do not delete materialized mp4s after upload
 *
 * Requires: GUIDES_API_KEY, npm i, network access to the live /api/upload.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  REPO_ROOT,
  rewriteGuideMedia,
  collectLocalMediaRefs,
  writeJson,
  isRemoteUrl,
} from './lib/media.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allMedia = args.includes('--all-media');
const videosOnly = !allMedia; // default
const writeLocal = !args.includes('--no-write-local');
const doPublish = args.includes('--publish');
const keepFiles = args.includes('--keep-files');
const siteIdx = args.indexOf('--site');
const SITE = siteIdx >= 0 ? args[siteIdx + 1] : 'https://quadcodeguide.vercel.app';
const KEY = process.env.GUIDES_API_KEY;

if (!KEY && !dryRun) {
  console.error('Set GUIDES_API_KEY (or pass --dry-run to preview).');
  process.exit(1);
}

const GUIDES_PATH = join(REPO_ROOT, 'ui_views', 'guides.json');
const onlyExt = videosOnly
  ? new Set(['mp4', 'webm', 'mov'])
  : null;

async function main() {
  const data = JSON.parse(readFileSync(GUIDES_PATH, 'utf8'));
  const guides = data.guides || [];

  const refs = collectLocalMediaRefs(guides, { onlyExt });
  console.log(`Found ${refs.size} unique local media path(s) to migrate${videosOnly ? ' (videos only)' : ''}:`);
  for (const [path, uses] of refs) {
    console.log(`  ${path}  (${uses.length} ref(s), e.g. ${uses[0].guideId})`);
  }
  if (!refs.size) {
    console.log('Nothing to do — all matching media already remote.');
    return;
  }

  let total = 0;
  for (const guide of guides) {
    console.log(`\n→ ${guide.id}`);
    const n = await rewriteGuideMedia(guide, {
      site: SITE,
      apiKey: KEY || 'dry-run',
      dryRun,
      fetchMissingFromGit: true,
      deleteAfterUpload: videosOnly && !keepFiles,
      onlyExt,
    });
    total += n;
  }

  console.log(`\nRewrote ${total} field(s).`);

  // Sanity: any leftover local video paths?
  const leftover = collectLocalMediaRefs(guides, { onlyExt });
  if (leftover.size) {
    console.warn('\nWARNING — still local (upload failed or file not in git):');
    for (const p of leftover.keys()) console.warn(' ', p);
  }

  if (dryRun) {
    console.log('\nDry run — guides.json not written.');
    return;
  }

  if (writeLocal) {
    writeJson(GUIDES_PATH, data);
    console.log(`Wrote ${GUIDES_PATH}`);
  }

  if (doPublish) {
    console.log(`\nPublishing full guides.json to ${SITE}...`);
    const res = await fetch(`${SITE}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
      body: JSON.stringify({
        data,
        message: 'Migrate local media to Vercel Blob',
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('Publish failed:', JSON.stringify(json, null, 2));
      process.exit(1);
    }
    console.log('Publish OK:', JSON.stringify(json, null, 2));
  } else {
    console.log('\nLocal guides.json updated. Commit/push, or re-run with --publish.');
  }

  // Quick remote check
  const stillLocalVideo = guides.some((g) =>
    [g.video, ...(g.steps || []).map((s) => s.result_video)]
      .filter(Boolean)
      .some((u) => !isRemoteUrl(u) && /\.mp4($|\?)/i.test(u))
  );
  if (!stillLocalVideo) {
    console.log('All guide videos now use remote URLs.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
