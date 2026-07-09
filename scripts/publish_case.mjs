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
 * steps[].result_video) may point to LOCAL FILES. Every local path found is
 * uploaded to Vercel Blob storage first, then the field is replaced with the
 * public Blob URL and the guide is published via /api/publish.
 *
 * Options:
 *   --dry-run     validate + upload nothing, show what would happen
 *   --site <url>  override site base (default https://quadcodeguide.vercel.app)
 *
 * Requires: Node 18+ (built-in fetch), npm i @vercel/blob (for client upload).
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { basename, resolve, dirname } from 'node:path';
import { upload } from '@vercel/blob/client';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const siteIdx = args.indexOf('--site');
const SITE = siteIdx >= 0 ? args[siteIdx + 1] : 'https://quadcodeguide.vercel.app';
const guideFile = args.find((a) => !a.startsWith('--') && a !== SITE);
const KEY = process.env.GUIDES_API_KEY;

if (!guideFile || !KEY) {
  console.error('Usage: GUIDES_API_KEY=<key> node scripts/publish_case.mjs <guide.json> [--dry-run]');
  process.exit(1);
}

const guide = JSON.parse(readFileSync(guideFile, 'utf8'));
const baseDir = dirname(resolve(guideFile));

// Media-bearing fields on the guide root and on each step
const ROOT_MEDIA = ['video', 'poster', 'image', 'audio'];
const STEP_MEDIA = ['result_image', 'result_video'];

const MIME = {
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', gif: 'image/gif',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4',
};

function isLocalFile(v) {
  if (typeof v !== 'string' || !v) return false;
  if (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/ui_views/')) return false;
  const p = resolve(baseDir, v);
  return existsSync(p) && statSync(p).isFile();
}

async function uploadFile(localPath) {
  const abs = resolve(baseDir, localPath);
  const name = basename(abs);
  const ext = name.split('.').pop().toLowerCase();
  const size = (statSync(abs).size / 1024 / 1024).toFixed(1);
  if (dryRun) {
    console.log(`  [dry-run] would upload ${name} (${size}MB)`);
    return `https://blob.example/guides/${name}`;
  }
  console.log(`  uploading ${name} (${size}MB)...`);
  const blob = await upload(`guides/${guide.id}/${name}`, readFileSync(abs), {
    access: 'public',
    contentType: MIME[ext] || 'application/octet-stream',
    handleUploadUrl: `${SITE}/api/upload`,
    // the @vercel/blob client can't send custom headers — key rides in clientPayload
    clientPayload: KEY,
  });
  console.log(`  -> ${blob.url}`);
  return blob.url;
}

async function main() {
  console.log(`Publishing case "${guide.id}" to ${SITE}${dryRun ? ' (dry run)' : ''}`);

  // 1. Upload local media, replace paths with Blob URLs
  for (const f of ROOT_MEDIA) {
    if (isLocalFile(guide[f])) guide[f] = await uploadFile(guide[f]);
  }
  for (const step of guide.steps || []) {
    for (const f of STEP_MEDIA) {
      if (isLocalFile(step[f])) step[f] = await uploadFile(step[f]);
    }
  }

  // 2. Publish guide text via /api/publish
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
