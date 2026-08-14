#!/usr/bin/env node
/**
 * Build + upload a downloadable project archive for one guide, then wire the
 * public URL into ui_views/guides.json as guide.project.
 *
 * Usage:
 *   node scripts/build_guide_project.mjs jerry01-quadcode-testimonials --dry-run
 *   GUIDES_API_KEY=<key> node scripts/build_guide_project.mjs jerry01-quadcode-testimonials
 *
 * Env: GUIDES_API_KEY (upload auth), SITE (defaults to production).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, uploadLocalFile, writeJson } from './lib/media.mjs';
import { stageProject, zipStaged, humanSize } from './lib/project_archive.mjs';
import { PROJECT_PAYLOADS } from './lib/project_payloads.mjs';

const guideId = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!guideId) { console.error('usage: build_guide_project.mjs <guideId> [--dry-run]'); process.exit(1); }

const spec = PROJECT_PAYLOADS[guideId];
if (!spec) { console.error(`No payload spec for "${guideId}" in scripts/lib/project_payloads.mjs`); process.exit(1); }

if (!dryRun && !process.env.GUIDES_API_KEY) {
  console.error('Set GUIDES_API_KEY (or pass --dry-run to preview).');
  process.exit(1);
}

const GUIDES_PATH = join(REPO_ROOT, 'ui_views/guides.json');
const doc = JSON.parse(readFileSync(GUIDES_PATH, 'utf8'));
const list = Array.isArray(doc) ? doc : doc.guides;
const guide = list.find(g => g.id === guideId);
if (!guide) { console.error(`Guide "${guideId}" not found in guides.json`); process.exit(1); }

const stageRoot = join(REPO_ROOT, '.temp/project-archives', guideId);
const outZip = join(REPO_ROOT, '.temp/project-archives', `${guideId}-project.zip`);

const report = stageProject({
  projectRoot: spec.projectRoot ? join(REPO_ROOT, spec.projectRoot) : REPO_ROOT,
  payload: spec.payload,
  stageRoot,
});
console.log(`staged: payload ${report.payload}, .quadcodeai ${report.qc}, chats ${report.chats}`);
if (report.skipped.length) console.warn(`missing payload entries: ${report.skipped.join(', ')}`);

const bytes = zipStaged(stageRoot, outZip);
console.log(`zip: ${outZip} — ${humanSize(bytes)}`);

const LIMIT = 200 * 1024 * 1024;
if (bytes > LIMIT) {
  console.error('Archive exceeds the 200MB /api/upload limit — trim the payload or move to S3.');
  process.exit(2);
}

const url = await uploadLocalFile({
  absPath: outZip,
  guideId,
  site: process.env.SITE || 'https://quadcodeguide.vercel.app',
  apiKey: process.env.GUIDES_API_KEY,
  dryRun,
});

guide.project = {
  name: spec.projectName,
  zip: url,
  size: humanSize(bytes),
  includes: 'project files, chat history, open tabs — chat attachments excluded',
};

if (dryRun) {
  console.log('[dry-run] guide.project would be:', JSON.stringify(guide.project, null, 2));
} else {
  writeJson(GUIDES_PATH, doc);
  console.log('guides.json updated — now run publish to deploy.');
}
