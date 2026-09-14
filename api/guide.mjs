/**
 * GET /guide/:id  (rewritten here by vercel.json)
 *
 * Serves landing.html with this guide's own <head>: title, description,
 * og:*, twitter:*, canonical, JSON-LD HowTo. The SPA boots into the guide
 * from the path (no hash needed). Unknown id → 404 page.
 *
 * Reads landing.html + guides.json from the deployment bundle
 * (vercel.json → functions.includeFiles). Cached at the edge for 10 min,
 * stale-while-revalidate 1 day: a publish shows up within minutes, and the
 * function itself is hit rarely.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderGuideHead, renderNotFound } from '../lib/guide_page.mjs';

const ROOT = process.cwd();
let cache = null; // { html, byId } — warm across invocations of one instance

async function load() {
  if (cache) return cache;
  const [html, json] = await Promise.all([
    readFile(join(ROOT, 'ui_views/landing.html'), 'utf8'),
    readFile(join(ROOT, 'ui_views/guides.json'), 'utf8'),
  ]);
  const data = JSON.parse(json.charCodeAt(0) === 0xFEFF ? json.slice(1) : json);
  const byId = new Map((data.guides || []).map(g => [g.id, g]));
  cache = { html, byId };
  return cache;
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const id = decodeURIComponent(url.searchParams.get('id') || url.pathname.replace(/^\/guide\//, '')).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'quadcodeguide.vercel.app';
  const origin = `${proto}://${host}`;

  let page;
  try { page = await load(); }
  catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end('guide renderer: ' + e.message);
  }

  const g = page.byId.get(id);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!g) {
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.end(renderNotFound(origin));
  }
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.end(renderGuideHead(page.html, g, origin));
}
