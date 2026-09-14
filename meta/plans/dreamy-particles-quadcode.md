---
SECTION_ID: plans.dreamy-particles-quadcode
TYPE: note
---

# Particle Masks — arrow pagination + brand restyle

Repo: `.temp/repos/codrops-dreamy-particles` (Vite 4, three from `mrdoob/three.js#dev`).
Dev server: `npx vite --port 7300 --host` (7000 is taken by macOS AirPlay/ControlCenter).

## Goal
1. Strip every third-party trace: author name, article/demo links, GitHub link, tech tags,
   the analytics + sponsor scripts, the unpkg DRACO CDN, the 3 extra demo pages.
2. One page, four masks, paginated by the arrow buttons, arrow keys or the chips — no page
   reloads. The transition is a particle morph: the field disperses and reforms into the
   next mask.
3. Brand visuals (dark #0E0E14, coral→crimson gradient, Space Grotesk + Manrope),
   zero brand wording anywhere in the UI.

## Steps
- [x] Delete `example2..4.html`, `Cyborg.js`, `Samurai.js`, `VeneciaMask.js`, `dist/`
- [x] Vendor the DRACO decoder into `public/draco` (cyborg + venecia glb are draco-compressed)
- [x] `webgl/masks.js` — the mask registry (model key, label, caption, colour)
- [x] `GPGPUUtils` — chunked surface sampling + a position-texture cache keyed by mask
- [x] `GPGPU` — A/B position textures, `uMorph`, `uDisperse`, colour crossfade
- [x] `simFragmentVelocity.glsl` — morph mix, weakened attraction + swirl while dispersing
- [x] ~~`webgl/utils/Gestures.js`~~ → replaced by `webgl/utils/Keys.js` (arrow keys only)
- [x] `webgl/MaskGallery.js` — the single world: state machine, parallax, UI wiring
- [x] `webgl/ui/Interface.js` — HUD, index, title, chips, loader progress
- [x] `index.html` + `style.css` — brand shell
- [x] Camera: drag-to-orbit off, pointer parallax instead
- [x] Verify: console clean, morph works both directions, no external requests

## Notes
- `GPUComputationRenderer` was sized by **viewport width**, not by the particle grid —
  fixed to `size x size` so texels map 1:1 to particles.
- The vertex shader overwrites `position` from the texture, so one geometry serves every
  mask; `frustumCulled = false` keeps the bounding sphere from culling it.
- The transition turns the field a full 360° (`direction * TAU * morph`, 2.2 s). The
  earlier `direction * disperse * 0.14` was 8° out and 8° back — a lean, not a spin. TAU
  lands on the starting angle so the idle drift resumes without a snap.
- Spinning it is what blows out the exposure, and global dimming cannot fix it. A mask is
  a shell: edge-on at 90°/270° the same million particles project onto a fraction of the
  pixels, and with additive blending brightness scales as the inverse of that area. At an
  exposure of 14% the 252° frame was still one flat white oval. Glow is now multiplied by
  `0.22 + 0.78 * |cos(rotation.y)|`.
- Exposure also needs a decaying envelope, not a curve keyed to `morph`: the flash peaks
  at morph ~0.97, while the particles snap onto the new rest positions, and keeps ringing
  for a few tenths *after* `morph` is reset to 0. Hence `exposureEnergy`, which ramps in
  over the first half and then decays with tau 0.3 s across the transition boundary — it
  is deliberately not reset in `finishTransition`.
- Never tune any of this on a frozen frame. Pinning `morphElapsed` keeps the clock running,
  the springs settle, particle speeds decay, and since the fragment shader ties alpha to
  speed the same instant measures ~4x darker than it does in motion. Freeze honestly by
  cancelling the rAF from outside (`cancelAnimationFrame(time.requestAnimtionFrameId)` —
  note the typo in the property name), which stops the simulation too. Also: one
  `time.update()` call from the console starts a *second* rAF loop, after which cancelling
  a single id no longer stops anything.
- `gl.readPixels` on the default framebuffer returns all zeroes once the frame has been
  composited. Luminance probes have to run inside a patched `postprocessing.update`.
- Pagination went swipe → arrows → swipe again. The first swipe was unusable because it
  *scrubbed* the transition: any drag, however small, started a morph, so you could never
  hold still and look at a mask. The second one pages on a **threshold** and never scrubs —
  under the threshold the drag is still just looking. Numbers that make that work:
  `max(64px, 9% of viewport)` of travel, or `0.5 px/ms` measured over a trailing 90 ms
  window with at least 28px of travel, and the axis is locked once at 10px with a 1.2x
  horizontal bias so diagonals stay with the parallax.
- Trackpad swipes arrive as `wheel` with `deltaX`, and macOS keeps sending a momentum tail
  for ~half a second after the fingers lift. Measured: one flick is ~226px of total delta
  against a 90px threshold, so a naive accumulator pages three masks. Fix is a one-shot
  latch plus a 340 ms quiet period, not a bigger threshold. `deltaMode` also has to be
  normalised — a tilt-wheel mouse reports lines (1–3 per notch), which would never reach
  90 and left the gesture dead on that hardware.
- The lean sign is the easy bug: a drag left is `dx < 0`, a natural-scroll swipe left is
  `deltaX > 0`. Same intent, opposite sign, so the field tilted the wrong way on a
  trackpad until the wheel branch stopped negating.
- `setPointerCapture` on the canvas: without it a drag released outside the window never
  delivers `pointerup`, and the field holds its tilt until the next click.
- Arrow buttons and labelled chips are gone with the swipe — ~300px of chrome in the corner
  of a piece about one face. The replacement is a 4-dot rail, 44px total, not focusable and
  not clickable, with the active dot as a 20px capsule (a scaled 6px dot is indistinguishable
  from a dimmed one). Mid-transition the origin and destination dots cross-fade on `--morph`,
  and `transition` has to be disabled while `is-morphing` or the CSS tween fights the
  per-frame variable and keeps growing for half a second after the field has landed.
- The whole HUD is now `pointer-events: none` with no exceptions, so a swipe that starts on
  the title still reaches the canvas.
- The supplied logo is a glyph on an opaque `rgb(11,13,21)` plate. The plate is thresholded
  away in CSS/SVG, not in an image editor: `feColorMatrix type="luminanceToAlpha"` then
  `feFuncA slope="8" intercept="-0.5"`, read through `mask-type="alpha"`. Per-channel
  thresholds do **not** work — the plate's blue channel (21/255 = 8.2%) survives any gate
  low enough to keep the glyph's own dark edges, which left a faint blue square.
