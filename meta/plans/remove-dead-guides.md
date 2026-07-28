---
SECTION_ID: plans.remove-dead-guides
TYPE: plan
STATUS: completed
PRIORITY: critical
---

# Remove irrecoverable guides

GOAL: Fully remove eight guides whose assets no longer exist from the production dataset and repository.

## Scope
- atlas-freight-cinematic-logistics
- dictly-voice-to-text-app
- flowforge-monochrome-workflow-editor
- liquid-ai-essence-orb
- purple-loader-orb-brand-asset-pack
- quadcode-platform-one-workspace-to-ship-software
- screenshot-to-pixel-perfect-ui
- ugc-creator-studio-consistent-ai-influencer

## Steps
- [x] Confirm all 60 referenced media URLs return 403 and have no local source.
- [x] Delete the eight records from `ui_views/guides.json`.
- [x] Remove any local asset folders or route-specific references (none existed for these IDs).
- [x] Validate zero guide entries, asset references, or static files remain.
- [x] Commit and deploy the deletion (`62a02b0`).

## Acceptance criteria
- Production dataset has no matching IDs.
- No matching asset folder remains under `ui_views/assets/`.
- No client-side card, filter, guide route, or search result can expose them.
- `scripts/check_guides_assets.mjs` succeeds with zero missing local references.
