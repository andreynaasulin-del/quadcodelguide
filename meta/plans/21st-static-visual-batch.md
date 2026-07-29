---
SECTION_ID: plans.21st-static-visual-batch
TYPE: plan
STATUS: complete
PRIORITY: high
---

# 21st.dev Static Visual Batch

## Goal
Select and prepare 15 distinct static visual guides from current public 21st.dev projects. Focus on posters, editorial systems, branding, data visuals and presentation graphics. Do not publish before PO approval.

## Selection rules
- Pull current public data directly from 21st.dev.
- Exclude projects already present in `ui_views/guides.json`.
- Reject table clones, dashboards dominated by controls, generic landing sections and repeated card layouts.
- Keep a maximum of 4 items from one visual family.
- Require a usable preview image.
- Self-host every selected preview under neutral filenames.
- Compress previews for web delivery without replacing the original design.
- Remove authors, source URLs and external attribution from guide payloads.
- Prepare one contact sheet and one item list before any merge or publication.

## Checklist
- [x] Fetch a pool of 60 unseen 21st.dev projects
- [x] Classify and reject UI/table clones
- [x] Select 15 visually distinct static projects
- [x] Download and compress previews locally
- [x] Build contact sheet
- [x] Prepare item list with rationale and duplicate-risk notes
- [x] Review with PO
- [x] Merge only after explicit approval
- [x] Commit/push only after explicit approval

## Publication lock
No selected guide may be added to `ui_views/guides.json` until the contact sheet and item list are approved.
