---
SECTION_ID: rules.savor01-safety-rule
TYPE: note
STATUS: locked
DATE: 2026-07-20
SCOPE: savor01.*, meta/plans/savor01-*, meta/files/savor01/**
---

# SAVOR/01 — Locked Safety Rule

Non-negotiable. Applies to every SAVOR/01 plan, image prompt, animation specification, UI mockup and published asset. Any generation that violates this rule is rejected and regenerated.

## The rule (verbatim)

SAVOR/01 organizes known information. It never claims to analyze food, never outputs a score, and never uses medical or danger iconography. Every status must be readable as text + shape + color, so meaning never depends on color alone.

## What this means in practice

### Allowed
- Capturing known facts: barcode, package date, opened date, storage zone, weight change, user confirmation
- Presenting plain-language order: USE FIRST, USE SOON, STABLE, CHECK
- Showing the evidence behind every recommendation
- Communicating status with text + shape + color together
- Printing "NO SAFETY VERDICT" as a standing disclaimer

### Forbidden
- Any claim that SAVOR/01 detects, analyzes or measures freshness, spoilage, ripeness or safety
- Any numeric score, percentage, rating, grade or "freshness index"
- Medical iconography: crosses, plus signs, stethoscopes, lab flasks, ECG lines, prescription symbols
- Danger iconography: warning triangles, skulls, biohazard, radiation, alarm reds used alone
- CHECK rendered as danger — CHECK means conflicting or missing information
- Color as the sole carrier of status meaning (grayscale must remain readable)
- The words SAFE or UNSAFE attributed to food

## Status coding standard
| Status | Text | Shape | Color |
|---|---|---|---|
| USE FIRST | "USE FIRST" | circle | tomato #C6382C |
| USE SOON | "USE SOON" | triangle | amber #C68A24 |
| STABLE | "STABLE" | equals | cool grey #9A9B96 |
| CHECK | "CHECK" | X | cobalt outline #1755A5 |

CHECK uses the corrected diagonal X — never a medical plus.

## Compliance check
Before approving any asset, confirm all four:
1. No analysis claim, score or freshness metric anywhere in the asset
2. No medical or danger iconography
3. Status readable in grayscale (text + shape survive without color)
4. "NO SAFETY VERDICT" present wherever status logic is shown

## References
- [#plans.savor01-food-triage-system]
- [#plans.savor01-evidence-of-food-motion]
- [#files.savor01.system-architecture-board_png]
