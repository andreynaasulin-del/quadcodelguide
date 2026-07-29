#!/usr/bin/env node
/**
 * Self-host a 21st.dev import preview before publishing.
 * Downloads each public preview under a neutral filename, removes source
 * attribution from copy, and rewrites all media fields to local site paths.
 *
 * Usage: node scripts/selfhost_21st_batch.mjs [preview.json]
 * Output: .temp/21st-guides-final.json
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const input = process.argv[2] || '.temp/21st-guides-preview.json';
const output = '.temp/21st-guides-final.json';
const assetDir = 'ui_views/assets/21st';
const publicDir = '/ui_views/assets/21st';
const data = JSON.parse(readFileSync(input, 'utf8'));

if (!Array.isArray(data.guides) || data.guides.length !== 15) {
  throw new Error(`Expected exactly 15 guides, got ${data.guides?.length ?? 'invalid'}`);
}

mkdirSync(assetDir, { recursive: true });
const seen = new Set();
let downloadedBytes = 0;

function clean(value) {
  return String(value || '')
    .replace(/\b21st\.dev\b/gi, 'the reference')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const guide of data.guides) {
  if (!/^21st-\d+-[a-z0-9-]+$/.test(guide.id)) throw new Error(`Invalid stable id: ${guide.id}`);
  if (seen.has(guide.id)) throw new Error(`Duplicate id: ${guide.id}`);
  seen.add(guide.id);

  const remote = guide.image || guide.poster;
  if (!/^https:\/\//.test(remote)) throw new Error(`Missing HTTPS preview: ${guide.id}`);
  const response = await fetch(remote, { headers: { 'User-Agent': 'quadcode-guide-importer/1.0' } });
  if (!response.ok) throw new Error(`Preview ${guide.id}: HTTP ${response.status}`);

  const type = response.headers.get('content-type') || '';
  const sourceExt = extname(new URL(remote).pathname).toLowerCase();
  const ext = type.includes('webp') || sourceExt === '.webp' ? '.webp'
    : type.includes('jpeg') || /\.jpe?g$/.test(sourceExt) ? '.jpg' : '.png';
  const filename = `${guide.id}${ext}`;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) throw new Error(`Empty preview: ${guide.id}`);
  writeFileSync(join(assetDir, filename), buffer);
  downloadedBytes += buffer.length;

  const local = `${publicDir}/${filename}`;
  guide.title = clean(guide.title);
  guide.desc = clean(guide.desc);
  guide.result = clean(guide.result);
  delete guide.author;
  delete guide.source;
  delete guide.source_url;
  delete guide.url;
  guide.image = local;
  guide.poster = local;

  for (const step of guide.steps || []) {
    step.title = clean(step.title);
    step.text = clean(step.text);
    step.prompt = clean(step.prompt);
    delete step.author;
    delete step.source;
    delete step.source_url;
    delete step.url;
    if (step.prompt && !step.result_image) throw new Error(`Prompt without result_image: ${guide.id}`);
    if (step.result_image) step.result_image = local;
  }
}

writeFileSync(output, `${JSON.stringify({ generated_at: data.generated_at, guides: data.guides }, null, 2)}\n`);
console.log(`Self-hosted ${data.guides.length} previews (${(downloadedBytes / 1048576).toFixed(2)} MB)`);
console.log(`Final preview: ${output}`);
