/**
 * Server-side head injection for /guide/<id>.
 *
 * The SPA renders the guide itself; crawlers and link-unfurlers (Telegram, X,
 * Slack, Google) do not run JS, so for them the page is whatever <head> we send.
 * This swaps the site-wide title / description / og:* / canonical in landing.html
 * for the guide's own, and drops a JSON-LD HowTo block. Nothing else changes —
 * same HTML, same JS, same hash router.
 *
 * Pure function of (landingHtml, guide, origin). Used by api/guide.js on Vercel
 * and by scripts/dev_server.mjs locally, so what you see on :9099 is what ships.
 */

const SITE_NAME = 'Quadcode Guide';

const escAttr = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function absolute(url, origin) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return origin.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
}

/** Pick the image a share card should show, in order of how well it represents the result. */
export function guideShareImage(g) {
  return g.poster || g.image || g.result_poster || (g.steps || []).map(s => s.result_poster || s.result_image).filter(Boolean).pop() || '';
}

function jsonLd(g, origin, url) {
  const steps = (g.steps || []).map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title || `Step ${i + 1}`,
    text: (s.text || s.prompt || '').slice(0, 500),
    ...(s.result_image ? { image: absolute(s.result_image, origin) } : {}),
  }));
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: g.title,
    description: g.desc || '',
    url,
    ...(guideShareImage(g) ? { image: absolute(guideShareImage(g), origin) } : {}),
    ...(g.time ? { totalTime: isoDuration(g.time) } : {}),
    ...(g.date ? { datePublished: g.date } : {}),
    ...(g.cat ? { about: g.cat } : {}),
    tool: (Array.isArray(g.models) ? g.models : []).map(m => ({ '@type': 'HowToTool', name: m })),
    step: steps,
    publisher: { '@type': 'Organization', name: 'Quadcode', url: 'https://quadcode.ai' },
  };
  // </script> inside JSON would end the block early
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}

function isoDuration(t) {
  const m = String(t).match(/(\d+)\s*min/i);
  return m ? `PT${m[1]}M` : undefined;
}

/**
 * @param {string} html   landing.html source
 * @param {object} g      guide record from guides.json
 * @param {string} origin e.g. https://quadcodeguide.vercel.app
 */
export function renderGuideHead(html, g, origin) {
  const url = `${origin.replace(/\/$/, '')}/guide/${encodeURIComponent(g.id)}`;
  const title = `${g.title} — ${SITE_NAME}`;
  const desc = (g.desc || g.result || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  const img = absolute(guideShareImage(g), origin);
  const isVideo = !!g.video;

  const head = `<title>${escAttr(title)}</title>
<meta name="description" content="${escAttr(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${escAttr(g.title)}">
<meta property="og:description" content="${escAttr(desc)}">
${img ? `<meta property="og:image" content="${escAttr(img)}">` : ''}
<meta property="og:url" content="${escAttr(url)}">
<link rel="canonical" href="${escAttr(url)}">
${g.date ? `<meta property="article:published_time" content="${escAttr(g.date)}">` : ''}
${g.cat ? `<meta property="article:section" content="${escAttr(g.cat)}">` : ''}
${isVideo ? `<meta property="og:video" content="${escAttr(absolute(g.video, origin))}">
<meta property="og:video:type" content="video/mp4">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(g.title)}">
<meta name="twitter:description" content="${escAttr(desc)}">
${img ? `<meta name="twitter:image" content="${escAttr(img)}">` : ''}
<script type="application/ld+json">${jsonLd(g, origin, url)}</script>`;

  // Replace the whole default block: from <title> through the last twitter:* tag.
  const start = html.indexOf('<title>');
  const endTag = '<meta name="twitter:image"';
  const endIdx = html.indexOf(endTag, start);
  const endLine = html.indexOf('\n', endIdx);
  if (start < 0 || endIdx < 0) throw new Error('landing.html: default head block not found');
  return html.slice(0, start) + head + html.slice(endLine);
}

/** 404 body for an unknown id — plain, indexable as "gone", links home. */
export function renderNotFound(origin) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Guide not found — ${SITE_NAME}</title>
<meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E0E14;color:#EDEDF2;font:16px/1.5 system-ui}a{color:#FF9569}main{text-align:center;padding:24px}</style>
</head><body><main><h1 style="font-size:22px;margin:0 0 8px">That guide isn't here</h1>
<p style="margin:0;color:#9A9AAE">It may have been renamed or removed.</p>
<p><a href="${origin}/">Browse all guides →</a></p></main></body></html>`;
}
