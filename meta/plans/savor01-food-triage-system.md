---
SECTION_ID: plans.savor01-food-triage-system
TYPE: plan
STATUS: in_progress
DATE: 2026-07-20
---

# SAVOR/01 — Food Triage System

## Goal
Create a senior-level physical and digital product case that helps households decide what food to use first. Use GPT-Image only for visual assets. Keep one approved product architecture across every image.

## Problem
Food gets forgotten because purchase dates, opened dates and remaining quantity are split across packaging, memory and different storage zones. SAVOR/01 turns those known facts into one visible queue. It does not claim to detect whether food is safe to eat.

## Target user
- One- to four-person households buying groceries weekly
- Shared households where no one knows who opened an item
- People managing food across fridge, freezer and pantry
- Users who need a quick decision before shopping or cooking

## Product position
SAVOR/01 is an intake dock plus reusable low-power food clips and a companion interface. A user scans an item once while putting groceries away, confirms the recognized label, attaches a clip, and later sees a household queue: USE FIRST, USE SOON, STABLE or CHECK.

## Locked physical system
- Intake dock: 320 × 220 × 38 mm weighted scanning surface
- Scan arch: folding 280 mm mast with downward camera and soft white task light
- Inputs: barcode, OCR date, purchase/open date, storage zone, user confirmation and optional weight change
- Clip family: 12 reusable 42 × 28 mm e-paper NFC clips in the starter kit
- Charging: clips charge on a recessed 12-slot rear rail
- Status language: shape + text + color; color never carries meaning alone
- Data flow: SCAN → CONFIRM → TAG → STORE → USE
- Triage states: USE FIRST, USE SOON, STABLE, CHECK
- Safety rule: LOCKED — see [#rules.savor01-safety-rule]. SAVOR/01 organizes known information; it never claims to analyze food, never outputs a score, never uses medical or danger iconography, and every status must be readable as text + shape + color so meaning never depends on color alone

## Decision logic
- Package dates are captured but never silently interpreted
- User confirms whether the date means use-by, best-before, packed-on or unknown
- Opened date takes priority when the package gives an after-opening instruction
- Weight trend estimates remaining quantity only; it does not estimate freshness
- CHECK is shown when evidence conflicts or confidence is low
- Every recommendation exposes the reason in plain English

## Visual direction
- Character: precise domestic utility, closer to a good kitchen scale than a medical device
- Form: compact graphite base, slim folding aluminium scan arch, rounded e-paper clips
- Materials: warm off-white enamel, bead-blasted aluminium, graphite recycled polymer, translucent food-safe silicone
- Signals: tomato red for USE FIRST, amber for USE SOON, cool grey for STABLE, cobalt outline for CHECK
- Typography: neutral grotesk, large status words, tabular dates
- Avoid: fake AI holograms, glowing food, freshness percentages, laboratory imagery, luxury marble, excessive screens

## Deliverables
1. [ ] System architecture board
2. [ ] Master product CGI — dock, scan arch and 12 clips
3. [ ] Intake workflow board
4. [ ] Reusable clip family and status study
5. [ ] Scan, OCR and confirmation detail
6. [ ] Decision-logic and safety board
7. [ ] Exploded construction view
8. [ ] Material and finish study
9. [ ] Mobile household queue UI
10. [ ] Recipe rescue flow
11. [ ] Shared-home notification states
12. [ ] Starter-kit packaging
13. [ ] Landing-page hero
14. [ ] Campaign 16:9
15. [ ] Campaign 1:1
16. [ ] Campaign 4:5
17. [ ] Campaign 9:16
18. [ ] Social preview 1920 × 1200
19. [ ] Final case-study board

## Consistency gates
- Dock remains 320 × 220 × 38 mm with one folding scan arch and one 12-slot charging rail
- Every clip remains 42 × 28 mm and uses the same e-paper face
- Product-bearing generations use the approved architecture board or master CGI as first reference
- No freshness score, smell sensor, gas sensor or automatic safety verdict may appear
- Every status uses text and shape, not color alone
- English text only, sparse and rendered verbatim
- Reject invented controls, changed clip counts or conflicting workflows

## Workflow
1. Lock architecture, inputs and safety limits
2. Generate and review the system architecture board
3. Generate and approve the master product CGI
4. Derive workflow, clip, logic, construction and material boards
5. Build the mobile queue and rescue flow
6. Build packaging, campaign formats and social preview
7. Assemble the final case-study board

## Current status
- [x] Business problem selected
- [x] Honest product boundary defined
- [x] Physical architecture specified
- [x] System architecture board generated
- [x] System architecture board reviewed — geometry accepted; packaging microcopy excluded from later assets
- [ ] Master product CGI generated
