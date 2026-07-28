#!/usr/bin/env node
/**
 * Import 15 public 21st.dev publications into Quadcode Guide.
 *
 * Default: preview only. Use --publish to POST each guide to /api/publish.
 * Required for --publish: GUIDES_API_KEY.
 * Optional: --limit 15, --site URL, --sort date, --output FILE.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const LIMIT = Math.max(1, Math.min(60, Number(valueAfter('--limit', '15')) || 15));
const SITE = valueAfter('--site', 'https://guides.quadcode.ai').replace(/\/$/, '');
const SORT = valueAfter('--sort', 'date');
const OUTPUT = valueAfter('--output', '.temp/21st-guides-preview.json');
const PUBLISH = args.includes('--publish');
const API_KEY = process.env.GUIDES_API_KEY;
const SOURCE = 'https://21st.dev';
const ALLOWED_SORTS = new Set(['downloads', 'likes', 'bookmarks', 'date', 'recommended', 'discover']);

if (!ALLOWED_SORTS.has(SORT)) throw new Error(`Unsupported --sort: ${SORT}`);
if (PUBLISH && !API_KEY) throw new Error('GUIDES_API_KEY is required with --publish');

function slugify(value) {
  return String(value || '').toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 72);
}

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function sentence(value) {
  const text = cleanText(value);
  if (!text) return '';
  const first = text.split(/(?<=[.!?])\s/)[0];
  return first.length > 220 ? `${first.slice(0, 217).trim()}...` : first;
}

function trpcInput(cursor) {
  const json = {
    sortBy: SORT,
    seed: null,
    boostTagSlugs: null,
    tagSlug: null,
    tagSlugs: null,
    category: null,
    timeRange: null,
    searchQuery: null,
    primitiveLib: null,
    licenses: null,
    libraryIds: null,
    authorIds: null,
    packageDeps: null,
    tailwindVersion: null,
    limit: Math.min(60, Math.max(LIMIT, 30)),
    includePrivate: false,
    onlyDefaultDemo: true,
    direction: 'forward',
  };
  if (cursor != null) json.cursor = cursor;
  const undefinedKeys = [
    'seed', 'boostTagSlugs', 'tagSlugs', 'category', 'timeRange', 'searchQuery',
    'primitiveLib', 'licenses', 'libraryIds', 'authorIds', 'packageDeps', 'tailwindVersion',
  ];
  const values = Object.fromEntries(undefinedKeys.map((key) => [key, ['undefined']]));
  return { json, meta: { values } };
}

async function fetchPublications(cursor = null) {
  const input = encodeURIComponent(JSON.stringify(trpcInput(cursor)));
  const res = await fetch(`${SOURCE}/api/trpc/demos.list?input=${input}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'quadcode-guide-importer/1.0' },
  });
  if (!res.ok) throw new Error(`21st.dev demos.list failed: ${res.status} ${await res.text()}`);
  const payload = await res.json();
  const data = payload?.result?.data?.json;
  if (!data || !Array.isArray(data.items)) throw new Error('Unexpected 21st.dev demos.list response');
  return data;
}

async function loadExistingData() {
  const res = await fetch(`${SITE}/ui_views/guides.json?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Cannot load current guides: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.guides)) throw new Error('Live guides.json has no guides array');
  return data;
}

function guideFromDemo(demo) {
  const component = demo.component_data || {};
  const name = cleanText(component.name, 'Untitled component');
  const description = sentence(component.description) || `Rebuild the ${name} interface from a concrete visual reference.`;
  const preview = demo.preview_url || component.preview_url || demo.preview_url_light || demo.preview_url_dark;
  if (!preview) throw new Error(`Demo ${demo.id} has no result image`);
  const id = `21st-${demo.id}-${slugify(name)}`;
  const promptBase = `Recreate the “${name}” interface shown in the reference image. Use production-ready React and CSS, preserve the core interaction, and adapt typography, spacing, colors and controls to the current site's design tokens. Keep the component responsive and keyboard accessible.`;
  const date = cleanText(demo.created_at || component.created_at).slice(0, 10);

  return {
    id,
    cat: 'Interfaces',
    sub: 'Components',
    title: `Build ${name}`,
    desc: description,
    time: '12 min',
    date,
    level: 'Middle',
    models: 'Quadcode, React',
    image: preview,
    poster: preview,
    steps: [
      {
        title: '1. Rebuild and integrate the component',
        text: `Read the reference as a component system, then implement ${name} with semantic structure, responsive layout, the primary interaction and complete interface states. Replace isolated visual values with the site's existing tokens.`,
        prompt: `${promptBase} Match the reference hierarchy, then finish the primary interaction, loading or empty state where relevant, keyboard focus, reduced-motion fallback and mobile behavior. Return the final integrated component, not a mockup.`,
        result_image: preview,
      },
    ],
    result: `A site-native version of ${name} with responsive layout and complete interaction states.`,
  };
}

async function collectNewGuides(existingData) {
  const existing = new Set(existingData.guides.map((guide) => guide.id));
  const guides = [];
  const seenDemoIds = new Set();
  let cursor = null;
  let pages = 0;

  while (guides.length < LIMIT && pages < 20) {
    const page = await fetchPublications(cursor);
    for (const demo of page.items) {
      if (seenDemoIds.has(demo.id)) continue;
      seenDemoIds.add(demo.id);
      try {
        const guide = guideFromDemo(demo);
        if (!existing.has(guide.id)) guides.push(guide);
      } catch (error) {
        console.warn(`Skip demo ${demo.id}: ${error.message}`);
      }
      if (guides.length >= LIMIT) break;
    }
    pages += 1;
    if (page.nextCursor == null || page.nextCursor === cursor) break;
    cursor = page.nextCursor;
  }
  return guides;
}

async function publishBatch(guides) {
  const results = [];
  for (const guide of [...guides].reverse()) {
    const res = await fetch(`${SITE}/api/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ guide, message: `Import guide ${guide.id}` }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Publish ${guide.id} failed: ${res.status} ${JSON.stringify(payload)}`);
    results.push({ id: guide.id, ...payload });
  }
  return results;
}

const existingData = await loadExistingData();
const guides = await collectNewGuides(existingData);
mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify({ generated_at: new Date().toISOString(), guides }, null, 2)}\n`);
console.log(`Prepared ${guides.length}/${LIMIT} new guides; preview: ${OUTPUT}`);

if (!PUBLISH) {
  console.log('Preview only. Run with --publish to send guides to the site.');
  process.exit(0);
}
if (guides.length === 0) {
  console.log('Nothing new to publish.');
  process.exit(0);
}

const publishResult = await publishBatch(guides);
console.log(`Published ${guides.length} guides from 21st.dev.`);
console.log(JSON.stringify(publishResult, null, 2));
