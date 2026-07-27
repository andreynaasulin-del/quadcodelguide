#!/usr/bin/env node
/**
 * upload_gta_promos.mjs — one-off: push the two GTA stunt promo 4K videos
 * to Vercel Blob storage via the existing /api/upload handshake, and print
 * their public HTTPS links. Not tied to any guide entry.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE = 'https://quadcodeguide.vercel.app';
const apiKey = process.env.GUIDES_API_KEY || readFileSync('.temp/secrets/api_key.txt', 'utf8').trim();

const files = [
  '.temp/upload/gta_skate_stunts_15s_hud_logo_watermark_4k.mp4',
  '.temp/upload/gta_surf_stunts_15s_hud_logo_watermark_4k.mp4',
];

import { readFileSync as rfs, statSync } from 'node:fs';
import { basename } from 'node:path';
import { upload } from '@vercel/blob/client';
import { MIME } from './lib/media.mjs';

async function uploadWithProgress(absPath) {
  const name = basename(absPath);
  const ext = name.split('.').pop().toLowerCase();
  const sizeMb = (statSync(absPath).size / 1024 / 1024).toFixed(1);
  const pathname = `guides/promo-gta/${name}`;
  console.log(`  uploading ${name} (${sizeMb}MB)...`);
  const t0 = Date.now();
  const blob = await upload(pathname, rfs(absPath), {
    access: 'public',
    contentType: MIME[ext] || 'application/octet-stream',
    handleUploadUrl: `${SITE}/api/upload`,
    clientPayload: apiKey,
    multipart: true,
    onUploadProgress: ({ loaded, total, percentage }) => {
      console.log(`    progress ${name}: ${percentage}% (${(loaded/1024/1024).toFixed(1)}/${(total/1024/1024).toFixed(1)}MB) t+${((Date.now()-t0)/1000).toFixed(0)}s`);
    },
  });
  console.log(`  -> ${blob.url} (took ${((Date.now()-t0)/1000).toFixed(0)}s)`);
  return blob.url;
}

async function main() {
  const results = [];
  for (const f of files) {
    const abs = resolve(f);
    const url = await uploadWithProgress(abs);
    results.push({ file: f, url });
  }
  console.log('\n=== DONE ===');
  for (const r of results) console.log(`${r.file} -> ${r.url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
