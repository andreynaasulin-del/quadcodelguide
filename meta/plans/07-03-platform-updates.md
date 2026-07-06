---
SECTION_ID: plans.07-03-platform-updates
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# 07-03 Platform Updates (guide site "cases")

GOAL: Implement backlog from 07-03 meeting notes for the Quadcode Guide site (ui_views/landing.html + admin.html + guides.json).
TIMELINE: multi-session

NOTE ON TERMINOLOGY: meeting doc calls guides "cases" (kejsy) — same entity as `guides` in guides.json. Using "guide" below to match codebase.

## Out of scope for me (business/ops, not code)
- [skipped: business decision, not dev work] Stop YouTube work
- [skipped: HR task, not dev work] Recruit strong wipe-coder specialist

## Phase 1 — Data model + main page (frontend only, no ambiguity)
- [x] Add `level` field (Junior / Middle / Middle+ / Senior) to all guides
- [x] Add level filter chips + sorting by level on main page
- [x] Add model multi-select filter UI on main page (chips row 3, done)
- [x] Confirmed by PO: tokens = qcc cost. Cost shown at top of guide page.
- [ ] Add qcc cost sort on main page (IN PROGRESS)

## Phase 2 — Case pages architecture
- [x] Convert guide modal (popup) → individual page view — hash routing #/guide/<id>, PO approved, DONE + deployed
- [x] Per-step result media: extend steps[] with `result_image` / `result_video` fields, render under each PROMPT block — ALL guides now covered (RPG 4/4, Design 3/4, Video 5/5; Music = audio player is the result)
- [x] RPG card poster frame extracted (ffmpeg, gamedev-rpg-poster.jpg)
- [ ] Video/gif preview in card thumbnails — ALREADY WORKS (`.cover-video`, hover autoplay) — just confirm gif support (currently video-only; need <img> animated gif path too? confirm with PO)

## Phase 3 — Categories mega-dropdown (needs taxonomy confirm)
- [ ] Design category tree: top-level + subcategories (draft: Music/Sound [dubbing, beats, songs], Video [scenes, cartoons, full videos], Photo, Design, Gamedev, Motion Design)
- [ ] Replace/extend chip row with large dropdown component in header
- [ ] Update guides.json category shape if nested taxonomy needed

## Phase 4 — Strategic / product docs (not pure code — draft as docs, not UI)
- [ ] Draft user registration + case-execution flow concept (meta/docs or PRD via product_create_prd skill)
- [ ] Draft gamification + promo-code mechanics concept
- [ ] Competitor analysis (Photopea/Canva/Leonardo/PromptHero/Civitai-style prompt galleries) — short list for Telegram

## Open questions for PO
1. Tokens counter = qcc cost we already built, or a separate distinct metric?
2. OK with hash-routing "pages" (no backend/build step) vs real static per-file pages?
3. Final category taxonomy — confirm draft list above or provide your own?
4. Registration/gamification/promo — current site is static (no backend/DB/auth). Do we scope a real backend (needs infra decision), or just design/PRD for now?
