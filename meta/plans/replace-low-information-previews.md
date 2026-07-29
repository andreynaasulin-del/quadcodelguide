---
SECTION_ID: plans.replace-low-information-previews
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Replace low-information guide previews

## Goal
Remove or replace the weakest static previews in the recent 50-guide 21st.dev batch. A technically valid WebP is not sufficient when the card shows only one word, sparse particles or an animation's empty rest frame.

## Quality gates
- Audit all 50 preview dimensions, byte sizes and image-information proxies.
- Manually reject obvious empty/rest-state frames regardless of resolution.
- Replace the full guide record when the original concept has no useful static state.
- Source replacements only from unused public 21st.dev candidates with honest previews.
- Keep one source preview per guide; no invented intermediate images.
- Require at least 640×360 and reject near-empty static frames.
- Prefer fewer credible guides over preserving a batch count with weak cards.

## Checklist
- [x] Audit all 50 previews
- [x] Identify the weak set
- [x] Review unused replacements; reject candidates that repeat the same rest-state problem
- [x] Remove 14 weak records and their WebP assets
- [x] Validate the database: 182 records, 214 local references, 0 missing
- [ ] Commit and push only cleanup files
- [ ] Verify production
