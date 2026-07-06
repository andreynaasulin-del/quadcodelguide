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
- [ ] Add `models` as structured array (keep display string) for multi-select filter
- [ ] Add model multi-select filter UI on main page (reuse qcc pricing model list — pinned as qcc_full_pricing)
- [ ] Confirm: "tokens spent" counter = same as qcc `cost` field already shown (assumption, needs PO confirm) — just needs to move to TOP of guide + be filterable/sortable on main page
- [ ] Add token/qcc range filter + sort on main page

## Phase 2 — Case pages architecture (needs PO confirm on approach)
- [ ] Convert guide modal (popup) → individual page view
      PROPOSED APPROACH: hash-based client routing (#/guide/<id>) within same landing.html — full-viewport view (not overlay), updates document.title, back/forward + deep-linkable, no build step / still static hosting. Awaiting PO OK vs alternative (real per-file static pages, needs generation step).
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
