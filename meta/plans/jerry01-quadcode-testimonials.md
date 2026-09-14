---
SECTION_ID: plans.jerry01-quadcode-testimonials
TYPE: note
---

SECTION_ID: plans.jerry01-quadcode-testimonials

# Jerry Rope Testimonials → Quadcode restyle + integration

Source repo (cloned, working copy):
`.temp/threejs-playground/.temp/jerry-rope-testimonials/index.html`
(+ `vendor/three.bundle.js`, `vendor/GLTFLoader.bundle.js`, `assets/puller.glb.js`)

Confirmed Quadcode brand tokens (from `ui_views/landing.html` :root, live site):
- bg #0E0E14 / bg-2 #1A1A24 / bg-3 #0A0A10
- text white #FFFFFF, muted rgba(255,255,255,.65), muted-2 rgba(255,255,255,.38)
- line rgba(255,255,255,.08)
- acc-1 #FF9569, acc-2 #DD344D, grad: linear-gradient(100deg,#FF9569,#DD344D)
- radius 14px
- font-display: 'Space Grotesk' (500/600/700), body: 'Manrope' (400-700), wordmark: 'Lexend' 500
- secondary accents used elsewhere: junior green #7ee787, middle+ amber #FFB454

## Steps
- [x] Clone repo, verify it runs (done earlier in session)
- [x] Pull full source (10 pages) — CSS, DATA testimonials, materials/lights, paintCard(), boot sequence
- [x] Confirm Quadcode tokens from landing.html
- [x] Restyle CSS (:root tokens, fonts, buttons/dots/pills, page bg) to dark Quadcode theme
- [x] Add Google Fonts link (Manrope + Space Grotesk) to widget's own <head>
- [x] Rewrite visible copy (eyebrow/headline/sub paragraph) — English
- [x] Replace DATA testimonials: 6 English quotes, roles Game Dev / Product Designer / Motion Designer / QA Engineer / Founder / Design Lead, referencing real site guides (npc01 Dark Fantasy Deceiver, snap01 Kitchen Configurator, Character Creator)
- [x] Retune scene lights (hemi/key/fill/rim) for dark stage, orange rim (#FF9569) accent
- [x] Rewrite paintCard() canvas texture to dark card (Space Grotesk/Manrope, white/muted text, acc-1 stars)
- [x] Swap hardcoded accent hex 0xC2603C → 0xFF9569 (wave-effect mesh)
- [x] Hook document.fonts.ready → repaint cards (avoid FOUT on canvas texture)
- [x] Copy restyled folder → `ui_views/assets/jerry01-testimonials/` (index.html + vendor/ + assets/) via shell cp (permission granted)
- [x] Add guide entry `jerry01-quadcode-testimonials` to `ui_views/guides.json`, cat Interfaces / sub Interactive Components, 5 steps + widget_iframe step 5
- [x] Verified in browser: dark theme renders correctly, card swap/rope-pull works, no console errors, "Game Dev" role text visible on card

## Remaining
- [ ] Cover image `/ui_views/assets/jerry01-testimonials-cover.webp` — referenced in guides.json but not yet created.
      NEXT STEP: delegate to Lumi — poster-style screenshot/composition of the dark
      restyled widget (orange-red gradient accent, Space Grotesk headline, an English
      role like "Game Dev" visible on a card), matching the site's cover-card aspect ratio.

## Key decision
Keep rope/fur/character material realism as-is (physical props, not "UI chrome").
Only page chrome (CSS), card canvas texture, accent-tinted lights/rings, and copy get
restyled to Quadcode. This avoids breaking the physically-authored puller rig.
