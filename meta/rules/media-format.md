---
SECTION_ID: rules.media-format
TYPE: note
STATUS: locked
DATE: 2026-08-20
SCOPE: ui_views/guides.json, ui_views/assets/**, scripts/publish_case.mjs, scripts/normalize_media.mjs
---

# Media format standard — every guide upload

Source of truth: `scripts/lib/normalize.mjs` (`STANDARD`). This file is the human version.
Enforced by `npm run media:check` and by `publish_case.mjs`, which **refuses to publish**
a guide that violates it. Do not bypass; fix the media.

## Why
Before this rule the 32-guide catalog carried **173 MB of PNG** step results (five 2880px
10 MB files in one guide) and the landing page prefetched *all* of them on card hover.
One mouse sweep across the grid could queue 100+ MB. Nobody waits for that.

## The rules

| Kind | Format | Limits | Notes |
|---|---|---|---|
| Step result image (`steps[].result_image`) | **WebP** | ≤ 1920 px wide, ≤ 500 KB | q82, drops to q60 if needed to fit |
| Cover / poster (`image`, `poster`, `result_poster`) | **WebP** | ≤ 1600 px wide, ≤ 500 KB | card renders ≤ ~800 CSS px; 1600 covers @2x |
| Video (`video`, `steps[].result_video`) | **H.264 .mp4**, yuv420p, `+faststart` | ≤ 1080p, ≤ 4500 kbps, ≤ 12 MB | AAC 128k. CRF 23, stepped to 32 max until it fits. Every video **must** have a poster |
| Audio (`audio`) | **.mp3** | ≤ 192 kbps, ≤ 6 MB | wav/m4a warn, oversize fails |
| Paths | relative `/ui_views/assets/...` | — | absolute `https://quadcodeguide.vercel.app/...` or `guides.quadcode.ai/...` is an **error** |

Not allowed anywhere: PNG, JPG, GIF, 4K video, `.mov`, `.webm`, files without faststart.

## Workflow for a new guide

```bash
# 1. Drop raw media next to your case JSON (any format — PNG, MOV, 4K, whatever)
# 2. Normalize in place: converts, resizes, re-encodes, makes posters, rewrites refs
node scripts/normalize_media.mjs --apply --case my-guide.json
# 3. Publish (the gate runs again; it will refuse if anything slipped)
GUIDES_API_KEY=... node scripts/publish_case.mjs my-guide.json
```

Editing `ui_views/guides.json` by hand? Run `npm run media:check` before committing.
Originals of anything re-encoded land in `.temp/media-originals/` (not tracked).

## Frontend contract (landing.html)
- Card hover prefetches **cover + poster + the one video** only. Never step media.
- Step images/videos are lazy (`loading="lazy"` / `data-src` + IntersectionObserver).
- Video `preload="none"`; poster paints first.
- Metered / 2G / data-saver clients get no speculative video (`cheapNetwork()`).

## Tooling
ffmpeg + ffprobe only. No native npm deps, no `npm install` needed to run the gate.
