---
SECTION_ID: plans.showcase-eight-videos
TYPE: plan
STATUS: in_progress
DATE: 2026-09-09
---

# Publish 8 showcase videos as guides (media standard applied)

## Goal
Take 8 user-provided MP4s (4K HEVC/H.264, 10–93 MB each) and land them in the catalog as
proper guides: normalized to [#rules.media-format], hand-picked posters, honest copy, meta
files per asset. Local preview only — no push until PO signs off.

## Sources → guides
| Source | Guide id | Cat / Sub | Poster @ |
|---|---|---|---|
| castle_link_06_07_30s_4k (HEVC 4K 30s 93MB) | rooftop-run-cel-shaded-trailer | Gamedev / Game Trailer | 21s |
| showcase_30s_upscaled (HEVC 4K 30s 77MB) | blocky-world-photoreal-remaster | Gamedev / World Remaster | 20s |
| metro_ruins_full_final (H264 4K 25s 34MB) | metro-ruins-fps-walkthrough | Gamedev / FPS Concept | 12.5s |
| gpt6_vs_fable_split_4k_music (H264 4K 26s 58MB) | interior-render-model-battle | Video / Model Battle | 13s |
| arcade_fighter_battle_v2_wm (H264 1080p 15s 10MB) | arcade-fighter-pixel-match | Gamedev / Pixel Art | 3.5s |
| forest_ops_30s_final_cta_upscaled (H264 1440p60 27s 75MB) | forest-ops-tactical-fps | Gamedev / FPS Concept | 12s |
| crimson_30s_upscaled_wm (H264 4K 30s 31MB) | crimson-adventure-trailer | Gamedev / Game Trailer | 6.5s |
| brazil_street_documentary_upscaled_watermarked (H264 4K 10s 19MB) | brazil-street-documentary | Video / Documentary | 3s |

## Steps
- [x] Probe sources, contact sheet (`.temp/showcase/frames/all_small.jpg`)
- [x] `.temp/showcase/build.py`: encode 1080p H.264 CRF-stepped ≤4500kbps/≤12MB faststart, 60fps→30, poster webp ≤1600px
      396 MB source → 74 MB delivered (crf 23–29). Posters re-picked for blocky (25s) and forest (6s).
- [x] 8 guide records (3 steps each, reconstruction prompts) prepended to `ui_views/guides.json` → 40 total
- [x] Meta files `meta/files/ui_views/assets/showcase/*_mp4.md`
- [x] `npm run media:check` = 40 guides, 0 errors
- [x] Verified on http://localhost:9099/ — cards, NEW badges, guide page autoplay, 0 broken imgs
- [x] Commit (no push) — PO reviews locally first
- [ ] Push → Vercel after PO sign-off

## Decisions
- Six game-footage clips go to **Gamedev** (was 2 guides — thinnest category). Two to **Video**.
- 60fps source → 30fps: at 1080p under 4.5 Mbps, 60fps smears; 30 keeps per-frame detail.
- Models field: "AI video generation" (+ "4K upscale" where filename says so). We don't know the exact model — not inventing one. Exception: model battle clip labels itself Fable 5.1 / GPT-6 Astra.
