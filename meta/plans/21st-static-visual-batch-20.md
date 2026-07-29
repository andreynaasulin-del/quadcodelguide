---
SECTION_ID: plans.21st-static-visual-batch-20
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Publish 20 additional 21st.dev static visual guides

## Goal
Publish 20 new static visual guides without repeating the low-information animation previews removed from the previous batch.

## Quality gates
- Pull fresh public candidates from at least four 21st.dev sort feeds.
- Exclude every ID already present in `ui_views/guides.json`.
- Reject forms, tables, pricing, dashboards, basic controls and text-only rest states.
- Require a self-contained static preview at least 640×360 with non-trivial image information.
- Convert each accepted preview to local WebP, maximum width 1600 px.
- Reject duplicate IDs, titles, source URLs and image hashes.
- Remove author names, source links and external attribution from public data.
- Keep one honest result image per guide; never invent intermediate results.
- Stage no unrelated local work.

## Checklist
- [x] Fetch 900 candidates across five feeds; deduplicate to 711
- [x] Select 20 credible static works from 89 technically valid previews
- [x] Convert and self-host 20 WebP previews (1.06 MB total)
- [x] Merge exactly 20 records
- [x] Validate schema, 202 unique IDs, 234 local references, 0 missing assets and 0 attribution
- [ ] Commit and push only batch files
- [ ] Verify production has 202 records and all 20 assets return 200
