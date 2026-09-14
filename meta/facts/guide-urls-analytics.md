---
SECTION_ID: facts.guide-urls-analytics
TYPE: fact
STATUS: active
DATE: 2026-09-14
SCOPE: vercel.json, api/guide.mjs, lib/guide_page.mjs, scripts/dev_server.mjs, scripts/build_sitemap.mjs, ui_views/landing.html
---

# Guide URLs, OG unfurl, analytics, badges — how it works now

## Canonical guide URL: `/guide/<id>`
- **Before:** `vercel.json` rewrote `/guide/(.*)` → `qc-guide-jerry01.html`, so every
  shared guide link opened the IDE-handoff test page. Real guides only existed as
  `/#/guide/<id>` — no OG tags, not indexable, unfurled as the homepage.
- **Now:** `/guide/:id` → `api/guide.mjs` (Node function). It reads `landing.html`
  + `guides.json` from the bundle (`functions.includeFiles`), swaps the default
  `<head>` block for the guide's own (title, description, og:*, twitter:*,
  canonical, `og:video` for video guides, JSON-LD `HowTo`) and returns the page.
  Unknown id → real 404. Edge cache `s-maxage=600, swr=86400`.
- Rendering lives in `lib/guide_page.mjs` (**not** `scripts/` — that dir is in
  `.vercelignore`). The dev server imports the same function, so
  `http://localhost:9099/guide/<id>` is byte-identical in behaviour to prod.
- `/guide/jerry01` and `/jerry01` still go to the standalone test page (Sasha's
  link). Only those two carry `noindex` now.

## SPA side (landing.html)
- Routing stays hash-based internally. `effectiveHash()` = hash, or derived from
  the path on a clean `/guide/<id>` load. `syncAddressBar(route)` rewrites the
  address bar with `replaceState`: on a guide → `/guide/<id>` (hash dropped);
  leaving → `/` + home hash. `popstate` is wired to the router so Back/Forward
  works across the two URL shapes. `router()` is microtask-deduped
  (hashchange + popstate for one nav).
- `CLEAN_URLS` = http(s) and pathname not ending in `.html`. In the IDE preview
  (`/ui_views/landing.html`) none of the rewriting happens.
- Share / Copy link emit `canonicalGuideUrl(id)`.

## Analytics
- `track()` used to write to localStorage only. Now it also forwards to a
  provider; `pageview()` fires on every route (virtual paths `/`, `/skills`,
  `/guide/<id>`, `/skill/<id>`).
- Default provider: **Vercel Web Analytics** (`/_vercel/insights/script.js`).
  **Needs one dashboard toggle**: Project → Analytics → Enable. Pageviews work
  on Hobby; custom events (`open_quadcode`, `ide_open`, `guide_open`,
  `step_toggle`, `made_share`, `sound_toggle`, …) need Pro.
- Alternative: set `ANALYTICS.plausible = 'quadcodeguide.vercel.app'` in
  landing.html → Plausible manual mode, custom events included on any plan.
- Nothing loads on localhost / 127.* / file://.

## Badges
- `new`/`trending` in guides.json are **ignored** at load (`normalizeFlags`).
  NEW = published ≤14 days ago, capped at the 8 freshest. TRENDING = off until
  it is driven by analytics. The Trending shelf disappears on its own (empty).
- Every guide must have `date` (YYYY-MM-DD). `museum-of-impossible-things-carousel`
  got its date from git history.

## Sitemap
- `npm run sitemap` regenerates `sitemap.xml` from the catalog: 1 home + 1
  `/guide/<id>` per guide, `lastmod` = date, `image:image` = share poster.
  Run it after every publish. The old file had 5 hash URLs (3 dead ids).

## Open in Quadcode (site side)
- Primary CTA + sticky CTA share one decision: guide has `project.zip` **and**
  IDE answers `127.0.0.1:47823/ping` → `POST /open-project` (files + chat +
  tabs). Otherwise copy prompt + `quadcode://open` deep link, toast says the
  prompt is on the clipboard. The deep link cannot carry a payload; an empty
  chat after launch is a desktop-app limitation, not a site bug.
- Only 1/47 guides ships a project today (`jerry01-quadcode-testimonials`).
  Every guide without a project is on the copy-and-paste path by definition.
