---
SECTION_ID: plans.21st-static-visual-batch-50
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Publish 50 additional 21st.dev visual guides

## Goal
Publish 50 new visual guides sourced from current public 21st.dev projects without duplicating the 146 existing guides.

## Quality gates
- Fetch at least 250 unseen candidates across multiple public sort feeds.
- Reject forms, tables, pricing, dashboards, basic controls and repeated compositions.
- Require a valid preview with usable dimensions and non-empty visual content.
- Use each source preview once; never invent intermediate results.
- Convert every preview to self-hosted WebP, maximum width 1600 px.
- Reject duplicate IDs, duplicate preview URLs and near-identical titles.
- Remove author names, source URLs and external attribution from public data.
- Validate all local paths before commit and all 50 production assets after deploy.
- Do not stage unrelated local work.

## Checklist
- [x] Fetch 250+ unseen candidates
- [x] Select 50 distinct visual works
- [x] Convert and self-host 50 WebP previews
- [x] Merge exactly 50 records
- [x] Validate schema, uniqueness, assets and attribution
- [ ] Commit and push only batch files
- [ ] Verify production has 196 records and all 50 assets return 200
