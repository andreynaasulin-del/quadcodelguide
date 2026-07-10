#!/usr/bin/env node
/**
 * migrate_direct_blob.mjs — upload local /ui_views media straight to Vercel Blob
 * using BLOB_READ_WRITE_TOKEN (no GUIDES_API_KEY /api/upload handshake).
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/migrate_direct_blob.mjs
 *   BLOB_READ_WRITE_TOKEN=... node scripts/migrate_direct_blob.mjs --dry-run
 *   BLOB_READ_WRITE_TOKEN=... node scripts/migrate_direct_blob.mjs --videos-only
 *
 * Rewrites ui_views/guides.json in place (local paths → https blob URLs).
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { put } from '@vercel/blob';
import {
  REPO_ROOT,
  ROOT_MEDIA,
  STEP_MEDIA,
  MIME,
  isRemoteUrl,
  resolveLocalPath,
  ensureLocalFile,
} from './lib/media.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const videosOnly = args.includes('--videos-only') || !args.includes('--all-media');
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!TOKEN && !dryRun) {
  console.error('Set BLOB_READ_WRITE_TOKEN (Vercel → Storage → Blob → token).');
  process.exit(1);
}

const GUIDES_PATH = join(REPO_ROOT, 'ui_views', 'guides.json');
const VIDEO_EXT = new Set(['mp4', 'webm', 'mov', 'mp3', 'wav', 'm4a']);

function shouldUpload(path) {
  const ext = basename(path).split('.').pop().toLowerCase();
  if (videosOnly) return VIDEO_EXT.has(ext);
  return true;
}

const cache = new Map(); // absPath → url

async function uploadAbs(absPath, guideId) {
  if (cache.has(absPath)) return cache.get(absPath);
  const name = basename(absPath);
  const ext = name.split('.').pop().toLowerCase();
  const sizeMb = (statSync(absPath).size / 1024 / 1024).toFixed(1);
  const pathname = `guides/${guideId || 'shared'}/${name}`;
  if (dryRun) {
    console.log(`  [dry-run] ${name} (${sizeMb}MB) → ${pathname}`);
    const fake = `https://blob.example/${pathname}`;
    cache.set(absPath, fake);
    return fake;
  }
  console.log(`  uploading ${name} (${sizeMb}MB)...`);
  const blob = await put(pathname, readFileSync(absPath), {
    access: 'public',
    token: TOKEN,
    contentType: MIME[ext] || 'application/octet-stream',
    addRandomSuffix: true,
  });
  console.log(`  -> ${blob.url}`);
  cache.set(absPath, blob.url);
  return blob.url;
}

async function rewriteValue(value, guideId) {
  if (!value || isRemoteUrl(value)) return { value, changed: false };
  if (!shouldUpload(value)) return { value, changed: false };
  let abs = resolveLocalPath(value);
  if (!abs || !existsSync(abs)) {
    const rel = String(value).replace(/^\//, '');
    abs = ensureLocalFile(rel);
  }
  if (!abs || !existsSync(abs)) {
    console.warn(`  missing file: ${value}`);
    return { value, changed: false };
  }
  const url = await uploadAbs(abs, guideId);
  return { value: url, changed: true };
}

async function main() {
  const data = JSON.parse(readFileSync(GUIDES_PATH, 'utf8'));
  let changed = 0;
  for (const guide of data.guides || []) {
    console.log(`\n→ ${guide.id}`);
    for (const f of ROOT_MEDIA) {
      if (!guide[f]) continue;
      const r = await rewriteValue(guide[f], guide.id);
      if (r.changed) { guide[f] = r.value; changed++; }
    }
    for (const step of guide.steps || []) {
      for (const f of STEP_MEDIA) {
        if (!step[f]) continue;
        const r = await rewriteValue(step[f], guide.id);
        if (r.changed) { step[f] = r.value; changed++; }
      }
    }
  }
  if (!dryRun && changed) {
    writeFileSync(GUIDES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`\nWrote ${GUIDES_PATH} (${changed} fields rewritten)`);
  } else {
    console.log(`\nDone. fields=${changed} dryRun=${dryRun}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
