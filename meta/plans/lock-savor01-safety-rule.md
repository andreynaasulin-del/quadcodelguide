---
SECTION_ID: plans.lock-savor01-safety-rule
TYPE: plan
STATUS: in_progress
DATE: 2026-07-20
---

# Lock SAVOR/01 Safety Rule

## Goal
Consolidate the scattered safety constraints from all SAVOR/01 meta files into one canonical, non-negotiable rule file, then make every plan and image prompt reference it.

## Locked rule (verbatim)
SAVOR/01 organizes known information. It never claims to analyze food, never outputs a score, and never uses medical or danger iconography. Every status must be readable as text + shape + color, so meaning never depends on color alone.

## Steps
- [x] Audit existing safety wording across plans and image metas [skill: none — no matching template; documentation task]
- [x] Create canonical rule file meta/rules/savor01-safety-rule.md [skill: none]
- [x] Update meta/plans/savor01-food-triage-system.md to reference the rule [skill: none]
- [x] Update meta/plans/savor01-evidence-of-food-motion.md to reference the rule [skill: none]
- [x] Update image metas (system-architecture-board, 03-evidence-capture, 05-four-states) [skill: none]
- [x] Verify every SAVOR/01 asset carries the locked wording [skill: none]

## Audit findings
- savor01-food-triage-system.md: "never labels food SAFE or UNSAFE…" — close but no score/iconography ban
- savor01-evidence-of-food-motion.md: "never labels food safe or unsafe…" — close but no score/iconography ban
- system-architecture-board_png.md: has "NO SAFETY VERDICT" + some bans, scattered
- 03-evidence-capture_png.md: has "NO SAFETY VERDICT", bans freshness score/AI, but no iconography rule
- 05-four-states_png.md: bans warning triangle/danger icon, "color is only distinction" — needs the canonical text+shape+color statement
