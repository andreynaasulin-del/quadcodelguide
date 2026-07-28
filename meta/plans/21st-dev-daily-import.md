---
SECTION_ID: plans.21st-dev-daily-import
TYPE: plan
STATUS: complete
PRIORITY: high
---

# Daily 21st.dev guide import

GOAL: Import 15 new public 21st.dev projects per run, convert each into Quadcode Guide format, place a result image after every prompt, and publish through the existing API.

## Checklist
- [x] Inspect the public 21st.dev publications endpoint and response schema
- [x] Confirm Quadcode Guide schema and `result_image` rendering
- [x] Add deterministic importer with duplicate protection
- [x] Add a project-local Quadcode chat skill
- [x] Add a daily GitHub Actions schedule
- [x] Validate with a dry run and inspect generated guides
- [x] Document required secrets and operational limits

## Release status

- [x] `GUIDES_API_KEY` synchronized between live Vercel Production and GitHub Actions
- [x] Preview regenerated with 15 unique guides
- [x] Author names, original URLs and `source` metadata removed
- [x] One honest result image per guide; no duplicated fake intermediate results
- [x] Publish the first batch: 15 guides, 66 → 81 total records
- [x] Commit and push importer, skill and daily workflow
- [x] Verify GitHub records and the enabled 06:17 UTC schedule
