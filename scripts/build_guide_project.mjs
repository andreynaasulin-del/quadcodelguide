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
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, uploadLocalFile, writeJson } from './lib/media.mjs';

// `vercel env pull` leaves the Blob store token in .env.local. Load it so the
// archive goes straight to the store: the deployed /api/upload can only mint
// client tokens when BLOB_READ_WRITE_TOKEN is set on the Vercel project, and
// right now it isn't.
const ENV_LOCAL = join(REPO_ROOT, '.env.local');
if (!process.env.BLOB_READ_WRITE_TOKEN && existsSync(ENV_LOCAL)) {
  for (const line of readFileSync(ENV_LOCAL, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
import { stageProject, zipStaged, humanSize } from './lib/project_archive.mjs';
import { PROJECT_PAYLOADS } from './lib/project_payloads.mjs';

const guideId = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!guideId) { console.error('usage: build_guide_project.mjs <guideId> [--dry-run]'); process.exit(1); }

const spec = PROJECT_PAYLOADS[guideId];
if (!spec) { console.error(`No payload spec for "${guideId}" in scripts/lib/project_payloads.mjs`); process.exit(1); }

if (!dryRun && !process.env.GUIDES_API_KEY && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Set BLOB_READ_WRITE_TOKEN or GUIDES_API_KEY (or pass --dry-run to preview).');
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
  starterChat: spec.starterChat || null,
  workspace: spec.workspace || {},
});
console.log(`staged: payload ${report.payload}, .quadcodeai ${report.qc}, chats ${report.chats}`);
if (report.starterChat) {
  const s = report.starterChat;
  console.log(`starter chat: ${s.store}/${s.name} — ${s.messages} curated messages (${humanSize(s.size)}), author history excluded`);
}
if (report.focusedChat) {
  const f = report.focusedChat;
  console.log(`focused chat: ${f.store}/${f.name} — ${f.shipped ? `shipped (${humanSize(f.size || 0)})` : 'MISSING, pointer cleared'}`);
}
(report.notes || []).forEach((n) => console.warn(`  note: ${n}`));
if (report.skipped.length) console.warn(`skipped entries:\n  ${report.skipped.join('\n  ')}`);

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
  // Production domain of the guide site (the *.vercel.app alias is legacy and
  // is served by an older deployment with a different GUIDES_API_KEY).
  site: process.env.SITE || 'https://guides.quadcode.ai',
  apiKey: process.env.GUIDES_API_KEY,
  dryRun,
});

guide.project = {
  name: spec.projectName,
  zip: url,
  size: humanSize(bytes),
  includes: report.starterChat
    ? 'project files, a starter chat, open tabs — author history excluded'
    : 'project files, chat history, open tabs — chat attachments excluded',
};

if (dryRun) {
  console.log('[dry-run] guide.project would be:', JSON.stringify(guide.project, null, 2));
} else {
  writeJson(GUIDES_PATH, doc);
  console.log('guides.json updated — now run publish to deploy.');
}
