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
import { createHash } from 'node:crypto';
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
import { stageProject, zipStaged, humanSize, gitTrackedPayload } from './lib/project_archive.mjs';
import { PROJECT_PAYLOADS } from './lib/project_payloads.mjs';
import { guideKitSpec } from './lib/guide_kit.mjs';

/**
 * Usage:
 *   build_guide_project.mjs <guideId> [--dry-run]      one guide kit (auto from guides.json)
 *   build_guide_project.mjs --all [--dry-run]           every guide in guides.json
 *   build_guide_project.mjs quadcode-guide-source       the site-wide fallback archive
 *   --stage-only   build the zip locally, skip upload and guides.json (for inspection)
 */
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const stageOnly = args.includes('--stage-only');
const all = args.includes('--all');
const guideIdArg = args.find(a => !a.startsWith('--'));
if (!guideIdArg && !all) {
  console.error('usage: build_guide_project.mjs <guideId|quadcode-guide-source|--all> [--dry-run] [--stage-only]');
  process.exit(1);
}

if (!dryRun && !stageOnly && !process.env.GUIDES_API_KEY && !process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Set BLOB_READ_WRITE_TOKEN or GUIDES_API_KEY (or pass --dry-run / --stage-only).');
  process.exit(1);
}

const GUIDES_PATH = join(REPO_ROOT, 'ui_views/guides.json');
const doc = JSON.parse(readFileSync(GUIDES_PATH, 'utf8'));
const list = Array.isArray(doc) ? doc : doc.guides;

/** Resolve the spec for one id: site archive, or auto kit (+ hand-listed sources). */
function specFor(guideId) {
  const hand = PROJECT_PAYLOADS[guideId] || {};
  if (hand.site) return { spec: hand, guide: null };
  const guide = list.find(g => g.id === guideId);
  if (!guide) throw new Error(`Guide "${guideId}" not found in guides.json`);
  const kit = guideKitSpec(guide, { sources: hand.sources || [] });
  return { spec: { ...kit, ...(hand.projectName ? { projectName: hand.projectName } : {}) }, guide };
}

async function buildOne(guideId) {
  const { spec, guide } = specFor(guideId);
  if (spec.site && Array.isArray(doc)) {
    throw new Error('guides.json is a bare array — a site-wide project needs the {categories, guides} object form.');
  }
  const projectRoot = spec.projectRoot ? join(REPO_ROOT, spec.projectRoot) : REPO_ROOT;

  let payload = spec.payload || [];
  if (spec.gitTracked) {
    const t = gitTrackedPayload({ projectRoot, ...spec.gitTracked });
    payload = t.payload;
    console.log(`git-tracked payload: ${payload.length} files, ${t.dropped.length} dropped by filter`);
    if (dryRun && t.dropped.length) console.log(`  dropped (first 20):\n    ${t.dropped.slice(0, 20).join('\n    ')}`);
  }
  if (spec.missing && spec.missing.length) {
    console.warn(`  media referenced by the guide but not on disk (${spec.missing.length}):\n    ${spec.missing.join('\n    ')}`);
  }

  const stageRoot = join(REPO_ROOT, '.temp/project-archives', guideId);
  const outZip = join(REPO_ROOT, '.temp/project-archives', `${guideId}-project.zip`);

  const report = stageProject({
    projectRoot,
    payload,
    stageRoot,
    starterChat: spec.starterChat || null,
    workspace: spec.workspace || {},
    extraFiles: spec.extraFiles || [],
  });
  console.log(`staged: payload ${report.payload}, generated ${report.generated}, .quadcodeai ${report.qc}, chats ${report.chats}`);
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
  if (bytes > LIMIT) throw new Error('Archive exceeds the 200MB /api/upload limit — trim the payload or move to S3.');

  if (stageOnly) { console.log('[stage-only] not uploaded, guides.json untouched'); return; }

  const url = await uploadLocalFile({
    absPath: outZip,
    guideId,
    // Production domain of the guide site (the *.vercel.app alias is legacy and
    // is served by an older deployment with a different GUIDES_API_KEY).
    site: process.env.SITE || 'https://guides.quadcode.ai',
    apiKey: process.env.GUIDES_API_KEY,
    dryRun,
  });

  // Stable URL + content hash: the IDE (and any CDN in between) sees a new URL
  // for every rebuilt kit, so nobody gets last week's archive from a cache.
  const hash = createHash('md5').update(readFileSync(outZip)).digest('hex').slice(0, 10);
  const versioned = dryRun ? url : `${url.split('?')[0]}?v=${hash}`;

  const project = {
    name: spec.projectName,
    zip: versioned,
    size: humanSize(bytes),
    includes: spec.site
      ? 'site sources, a starter chat, open tabs — author history excluded'
      : 'prompts, result files and a step-by-step chat — nothing else to install',
  };
  if (spec.site) {
    project.scope = 'site';
    project.files = payload.length;
    doc.project = project;
  } else {
    project.scope = 'kit';
    guide.project = project;
  }

  const target = spec.site ? 'guides.json top-level project' : `guide.project (${guideId})`;
  if (dryRun) console.log(`[dry-run] ${target} would be:`, JSON.stringify(project, null, 2));
  else console.log(`${target} ← ${url}`);
}

const ids = all ? list.map(g => g.id) : [guideIdArg];
const failed = [];
for (const id of ids) {
  console.log(`\n=== ${id} ===`);
  try { await buildOne(id); }
  catch (e) { failed.push(id); console.error(`FAILED ${id}: ${e.message}`); if (!all) process.exit(2); }
}

if (!dryRun && !stageOnly) {
  writeJson(GUIDES_PATH, doc);
  console.log(`\nguides.json updated (${ids.length - failed.length}/${ids.length} projects) — now run publish to deploy.`);
}
if (failed.length) { console.error(`\nfailed: ${failed.join(', ')}`); process.exit(2); }
