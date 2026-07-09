/**
 * POST /api/publish — Publish API for Quadcode Guide.
 *
 * Auth:    x-api-key header, timing-safe compared to GUIDES_API_KEY env.
 * Action:  commits an updated ui_views/guides.json to GitHub (main branch)
 *          via the Contents API using GH_TOKEN env, then optionally triggers
 *          a Vercel deploy hook (DEPLOY_HOOK_URL env).
 *
 * Body (JSON), one of:
 *   { "guide": { ...single guide object... } }   -> prepends to guides[]
 *                                                   (replaces same id if exists)
 *   { "data": { ...full guides.json object... } } -> replaces whole file
 * Optional flags:
 *   "dryRun": true      -> validate + diff only, no commit, no deploy
 *   "message": "..."    -> custom commit message
 *
 * No secrets live in this file — everything is read from Vercel env vars.
 */

const crypto = require('crypto');

const GH_REPO = 'andreynaasulin-del/quadcodelguide';
const GUIDES_PATH = 'ui_views/guides.json';
const BRANCH = 'main';

const REQUIRED_GUIDE_FIELDS = ['id', 'cat', 'title', 'desc', 'steps'];

function timingSafeMatch(given, expected) {
  const a = Buffer.from(String(given || ''));
  const b = Buffer.from(String(expected || ''));
  if (!expected || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isLocalVideoPath(v) {
  return typeof v === 'string' && /^\/ui_views\/.+\.(mp4|webm|mov)(\?|$)/i.test(v);
}

function validateGuide(g) {
  const errs = [];
  if (!g || typeof g !== 'object') return ['guide must be an object'];
  for (const f of REQUIRED_GUIDE_FIELDS) {
    if (g[f] === undefined || g[f] === null || g[f] === '') errs.push(`missing field: ${f}`);
  }
  if (g.id && !/^[a-z0-9-]+$/.test(g.id)) errs.push('id must be a slug: lowercase letters, digits, dashes');
  if (g.steps && (!Array.isArray(g.steps) || g.steps.length === 0)) errs.push('steps must be a non-empty array');
  if (Array.isArray(g.steps)) {
    g.steps.forEach((s, i) => {
      if (!s || !s.title || !s.text) errs.push(`steps[${i}] needs title and text`);
      if (isLocalVideoPath(s.result_video)) {
        errs.push(`steps[${i}].result_video must be a Vercel Blob https URL (not a local /ui_views path)`);
      }
    });
  }
  // Videos must live on Blob — local /ui_views/*.mp4 are excluded from deploy
  if (isLocalVideoPath(g.video)) {
    errs.push('video must be a Vercel Blob https URL (use scripts/publish_case.mjs to upload)');
  }
  return errs;
}

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'quadcode-guide-publish-api',
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}: ${json.message || 'unknown error'}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // --- Auth ---
  if (!timingSafeMatch(req.headers['x-api-key'], process.env.GUIDES_API_KEY)) {
    return res.status(401).json({ error: 'Invalid or missing x-api-key' });
  }
  if (!process.env.GH_TOKEN) {
    return res.status(500).json({ error: 'Server misconfigured: GH_TOKEN not set' });
  }

  // --- Parse body ---
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Body is not valid JSON' }); }
  }
  if (!body || (!body.guide && !body.data)) {
    return res.status(400).json({ error: 'Body must contain "guide" (single guide) or "data" (full guides.json)' });
  }

  try {
    // --- Load current guides.json from GitHub (source of truth + sha for commit) ---
    const current = await gh(`/repos/${GH_REPO}/contents/${GUIDES_PATH}?ref=${BRANCH}`);
    const currentData = JSON.parse(Buffer.from(current.content, 'base64').toString('utf8'));

    // --- Build next state ---
    let next;
    let summary;
    if (body.data) {
      if (!body.data.guides || !Array.isArray(body.data.guides)) {
        return res.status(400).json({ error: '"data" must be a full guides.json object with a guides array' });
      }
      for (const g of body.data.guides) {
        const errs = validateGuide(g);
        if (errs.length) return res.status(422).json({ error: 'Guide validation failed', id: g && g.id, details: errs });
      }
      next = body.data;
      summary = `replace file (${next.guides.length} guides)`;
    } else {
      const errs = validateGuide(body.guide);
      if (errs.length) return res.status(422).json({ error: 'Guide validation failed', details: errs });
      next = { ...currentData };
      next.guides = Array.isArray(currentData.guides) ? [...currentData.guides] : [];
      const idx = next.guides.findIndex((g) => g.id === body.guide.id);
      if (idx >= 0) {
        next.guides[idx] = body.guide;
        summary = `update guide "${body.guide.id}"`;
      } else {
        next.guides.unshift(body.guide);
        summary = `add guide "${body.guide.id}"`;
      }
    }

    const nextContent = JSON.stringify(next, null, 2) + '\n';

    if (body.dryRun) {
      return res.status(200).json({
        ok: true,
        dryRun: true,
        wouldCommit: summary,
        guidesBefore: (currentData.guides || []).length,
        guidesAfter: next.guides.length,
      });
    }

    // --- Commit to GitHub ---
    const message = body.message || `Publish API: ${summary}`;
    const commit = await gh(`/repos/${GH_REPO}/contents/${GUIDES_PATH}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: Buffer.from(nextContent, 'utf8').toString('base64'),
        sha: current.sha,
        branch: BRANCH,
      }),
    });

    // --- Trigger deploy (optional) ---
    let deploy = 'skipped (DEPLOY_HOOK_URL not set)';
    if (process.env.DEPLOY_HOOK_URL) {
      const hookRes = await fetch(process.env.DEPLOY_HOOK_URL, { method: 'POST' }).catch(() => null);
      deploy = hookRes && hookRes.ok ? 'triggered' : 'hook call failed (commit is in GitHub, redeploy manually)';
    }

    return res.status(200).json({
      ok: true,
      committed: summary,
      commitSha: commit.commit && commit.commit.sha,
      commitUrl: commit.commit && commit.commit.html_url,
      guides: next.guides.length,
      deploy,
    });
  } catch (e) {
    const status = e.status === 401 || e.status === 403 ? 502 : 500;
    return res.status(status).json({ error: e.message || 'Internal error' });
  }
};
