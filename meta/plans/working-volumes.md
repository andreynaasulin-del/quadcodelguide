---
SECTION_ID: plans.working-volumes
TYPE: plan
STATUS: build_verified
DATE: 2026-08-04
---

# Working Volumes — book shelf viewer

## What it is
Single-file Three.js scene: 8 hardcover volumes on a shelf, each opens into a
readable 6-spread book. File: `ui_views/assets/working-volumes/index.html`
(7.7k lines, no build step, `importmap` → jsdelivr `three@0.165.0` + addons).
Extracted out of `.temp/threejs-playground/.temp/repos/complete-shelf/`.

## Fixes shipped in this pass
1. **Contrast.** Per-book palettes used to repaint the whole room in the book's
   own hue, so the Claude volume made the stage orange and the foil title sat on
   near-identical cloth. Stage tokens are now fixed; `ensureReadableOn()` pushes
   foil/cloth apart and `drawCoverTextScrim()` lays a local scrim under the
   title. Foil is metalness 0.6 with a slight emissive so it reads at any angle.
2. **Content.** `VOLUME_CONTENT` holds real copy for all 8 volumes: standfirst,
   3 chapters of prose, a 5-item field checklist, 6 spec rows, plate caption.
   11 page designs replace the old 8 (title, contents, three chapter openers,
   a continuation page with pull quote, plate, checklist, specs, colophon,
   further reading). Text is set with measured wrapping (`wrapLines` +
   `typesetParagraph`), not character counting — the old ragged right edge of
   ±40px is gone.
3. **No blank right pages.** `PAGINATED_LEAF_COUNT` 4 → 5, every leaf face maps
   to a design; only the verso of the terminal leaf falls back to stock paper.
   Spread 6/6 is Colophon + Further reading instead of empty.
4. **Volume transitions.** `switchVolume(±1)` chains the existing close and open
   choreography at 1.55× speed — ~0.9s door-to-door — and restores the reading
   state, so page 3 of Volume I lands on page 3 of Volume II. PREV/NEXT pills in
   the panel, ArrowUp/ArrowDown on the keyboard, guarded against re-entry.
5. **Quadcode guidebook chrome.** `--qc-red #ff3b30`, `--qc-ink #171717`, panel
   `rgb(20 20 20 / 94%)`, hairlines `rgb(255 255 255 / 14%)`, 2px radii, Inter
   850 uppercase display at −0.055em, 10px/0.16em labels, 44px control targets,
   primary action filled red, `:focus-visible` white outline.

## Verified locally
- 1424×793 standalone window, `http://localhost:9953/ui_views/assets/working-volumes/index.html`.
- All 6 spreads of Volume I inspected by screenshot: no blank pages, no clipped
  text, no baseline collisions with the running footer.
- One click on NEXT advances exactly one volume; trail
  `01/08 → 02/08 → Title page` in ~0.9s; reading state resumes.
- Detail panel fits 793px viewport without scroll (570px content).
- Zero console errors, zero warnings.

## Deployment plan
1. **Cover.** Capture a real screenshot of the shelf hero (not AI-generated) to
   `ui_views/assets/working-volumes/cover.png`, same rule as
   `audio-reactive-identity`.
2. **Vendoring decision.** The addons used (`OrbitControls`,
   `RoomEnvironment`, `RoundedBoxGeometry`, `RectAreaLight` helpers) are absent
   from `ui_views/assets/audio-reactive-identity/vendor/`, so the CDN importmap
   stays for now. If the "no runtime network requests" rule must hold, vendor
   `three@0.165.0` + those four addon files into
   `ui_views/assets/working-volumes/vendor/` and rewrite the importmap. That is
   the only blocker for an offline-clean guide record.
3. **Guide record.** Add a guide to `guides.json` whose final step embeds
   `/ui_views/assets/working-volumes/index.html`, then run
   `node scripts/check_guides_assets.mjs` and require
   `missingLocal=0`, `blobRefs=0`, `noCover=0`.
4. **Static serving.** `vercel.json` serves the repo root as static; no build
   config change is needed.
5. **Push and verify** only after explicit PO approval: commit, push, then open
   the production URL and re-check the shelf, one volume swap and one full
   6-spread read.

## Known trade-offs
- CDN importmap means the demo needs network on first load. See step 2.
- Mobile (<860px) puts the panel at the bottom over the book; the reading view
  is desktop-first by design.
- Page textures are generated on the CPU per volume; first open of a volume
  costs ~120ms of canvas work before the hi-res upgrade lands.
