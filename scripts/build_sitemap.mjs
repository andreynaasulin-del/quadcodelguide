#!/usr/bin/env node
/**
 * Regenerate sitemap.xml from ui_views/guides.json.
 *   node scripts/build_sitemap.mjs
 *
 * One <url> per guide at its canonical /guide/<id> (crawlable, OG-injected by
 * api/guide.mjs) plus the home page. Hash URLs are deliberately absent — Google
 * ignores fragments, so the old #/guide/... entries were 5 lines of nothing.
 * lastmod = guide.date; image:image = the share poster, so Image Search can
 * pick up the finals.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guideShareImage } from '../lib/guide_page.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.SITE_ORIGIN || 'https://quadcodeguide.vercel.app';

const raw = readFileSync(resolve(ROOT, 'ui_views/guides.json'), 'utf8');
const data = JSON.parse(raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw);
const guides = (data.guides || []).filter(g => g.id && g.title);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const abs = u => /^https?:/.test(u) ? u : ORIGIN + (u.startsWith('/') ? u : '/' + u);
const newest = guides.map(g => g.date).filter(Boolean).sort().pop() || new Date().toISOString().slice(0, 10);

const urls = [
  `  <url>
    <loc>${ORIGIN}/</loc>
    <lastmod>${newest}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
  ...guides.map(g => {
    const img = guideShareImage(g);
    return `  <url>
    <loc>${ORIGIN}/guide/${encodeURIComponent(g.id)}</loc>${g.date ? `
    <lastmod>${g.date}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>${img ? `
    <image:image>
      <image:loc>${esc(abs(img))}</image:loc>
      <image:title>${esc(g.title)}</image:title>
    </image:image>` : ''}
  </url>`;
  }),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
writeFileSync(resolve(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${guides.length + 1} urls (${guides.length} guides), origin ${ORIGIN}`);
