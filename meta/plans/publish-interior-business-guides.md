---
SECTION_ID: plans.publish-interior-business-guides
TYPE: note
---

# Publish: real-estate interiors + business visuals

## Goal
Publish two English guide cases with supplied PNG results, model metadata, and no QCC price labels.

## Cases
1. `compare-interior-directions` — Design / Interior Visualization: baroque cottage, industrial loft, modern studio.
2. `business-visuals-that-explain-work` — Design / Business Visuals: revenue workflow, manual vs AI onboarding, landing page speed, spreadsheet vs CRM.

## Steps
- [x] Validate the site schema and upload API
- [x] Write the two guide JSON payloads
- [x] Run API dry-run for each payload
- [x] Upload supplied results to Vercel Blob and publish
- [ ] Verify both live guide pages after deployment

## Constraint
All public copy is English. Do not add QCC prices: actual generation costs for supplied final images were not provided, and PO asked to remove visible QCC pricing.
