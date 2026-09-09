---
SECTION_ID: plans.purge-weak-image-guides
TYPE: plan
STATUS: in_progress
PRIORITY: critical
---

# Purge weak image-only guides, keep every video/interactive/audio work

## Goal
Cut `ui_views/guides.json` from 293 records to only strong, authored work. All video, interactive
and audio guides stay untouched. Image-only guides survive only if they are multi-step, authored
here, and show real craft. This is also step 0 of the load-time optimization: ~225 external covers
disappear from the homepage grid.

## Audit facts (2026-08-20)
- 293 guides: 19 video, 3 interactive, 4 audio, 267 image-only.
- 225 image-only are 21st.dev scrapes: 1 step, templated prompt, other people's previews.
- 30 image-only are the iili.io UI series (website-*/interfaces-*/design-*): 4 real steps each, coded-UI screenshots.
- 12 image-only are local authored guides; 4 of them have zero step images.
- `jerry01-quadcode-testimonials` is duplicated (two records).

## Decision tiers
- KEEP always: video / interactive / audio (26 unique).
- KEEP authored image guides with real pipeline: npc01, building-autopsy, jeweled-brand-icons,
  museum-of-impossible-things, headphones-retouch, compare-interior-directions, business-visuals.
- KILL: all 225 `21st-*` scrapes; duplicate jerry01; gta6-hitman-crossover; saas-dashboard-interface;
  mobile-app-screens-kit; quadcode-ui-workflow-optimize; vinyl-groove-macro-banner.
- DECIDE with PO: 30 iili.io UI-series guides (useful, honest, but plain and externally hosted).

## Decision (PO, 2026-08-20)
Went with the strictest tier: **32 guides** — video/interactive/audio + only the 7 strong
authored image guides. The 30 `iili.io` UI-series guides were ALSO dropped (PO chose the
"chistiy showreel" option, not the 62-guide middle option).

## Steps
- [x] Inventory script `.temp/audit/inventory.py` + contact sheet `.temp/audit/sheet.html`.
- [x] `.temp/audit/purge.py` dry-run → list of removed IDs and survivors.
- [x] Apply purge (`--apply --drop-ui-series`): 293 → 32. Backup kept.
- [x] Rollback snapshot **"откат прежде v1"** saved to a git-tracked, non-scratch location:
      `meta/backups/guides-rollback-otkat-prezhde-v1.json` (full 293 records), documented in
      `meta/facts/guides-rollback-snapshots.md`. (`.temp/audit/guides.before-purge.json` is the
      same content but WILL be wiped between sessions — don't rely on it.)
- [ ] Remove orphaned local assets only if not referenced by any survivor (124 candidates in
      `.temp/audit/orphans.json` — re-generate after final `ui_views/guides.json` is settled).
- [ ] Validate: unique IDs, every local path exists, no `21st-` IDs remain, landing.html renders.
- [ ] Check category filters still make sense (some categories now near-empty, e.g. Interfaces=1).
- [ ] Commit the purge + rollback snapshot.
- [ ] Then: perf pass (image sizes/lazy for the 7 image guides + the video posters).
