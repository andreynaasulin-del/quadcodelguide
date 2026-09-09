---
SECTION_ID: facts.guides-rollback-snapshots
TYPE: fact
---

# Rollback snapshots for ui_views/guides.json

Full "before" copies of `ui_views/guides.json` live in `meta/backups/` (plain files, not
meta-section docs — that folder is tracked in git and NOT wiped between sessions, unlike
`.temp/`). Use them whenever you need to roll back a destructive catalog edit.

## "откат прежде v1"
- File: `meta/backups/guides-rollback-otkat-prezhde-v1.json`
- Taken: 2026-08-20, immediately before the 293→32 catalog purge
  (see `meta/plans/purge-weak-image-guides.md`).
- Contains all 293 original guide records: 19 video, 3 interactive, 4 audio, 267 image-only
  (includes the 225 `21st-*` scrapes and the 30 `iili.io` UI-series, both removed in the purge).

### How to restore
```bash
cp meta/backups/guides-rollback-otkat-prezhde-v1.json ui_views/guides.json
```
Note: this only restores the JSON records. If any local asset files under `ui_views/assets/`
were also deleted as part of the same purge, they need separate recovery (check git history
for the purge commit).
