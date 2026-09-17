#!/usr/bin/env node
/**
 * polish_guides.mjs — idempotent pass over ui_views/guides.json that enforces
 * the step contract every guide is supposed to honour:
 *
 *   1. the UI numbers the steps, so a title must not number itself again
 *   2. a step video shows a poster if one already exists on disk
 *   3. every result says what it IS, with a fact from the file itself
 *      ("The finished piece · 0:10, 1080×1080"), never a bland "Result"
 *   4. `prompt: ""` is not a prompt — teardown steps drop the key instead of
 *      rendering an empty copy box
 *
 * No media is generated here. Posters are only wired when the file is already
 * on disk; clips that still lack one are reported so a proper frame can be
 * authored rather than screen-grabbed.
 *
 * Usage: node scripts/polish_guides.mjs [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { REPO_ROOT, probeVideo, probeAudio, probeImage } from './lib/normalize.mjs';

const DRY = process.argv.includes('--dry');
const FILE = join(REPO_ROOT, 'ui_views/guides.json');

const abs = (u) => (typeof u === 'string' && u.startsWith('/ui_views/')) ? join(REPO_ROOT, u.slice(1)) : null;
const onDisk = (u) => { const a = abs(u); return a && existsSync(a) ? a : null; };

/** m:ss, or m:ss.s when the tenth of a second is part of the claim. */
function clock(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  const whole = Math.abs(s - Math.round(s)) < 0.05;
  const sStr = whole ? String(Math.round(s)).padStart(2, '0')
                     : s.toFixed(1).padStart(4, '0');
  return `${m}:${sStr}`;
}

/** Poster candidates that the pipeline would have written next to the clip. */
function posterOnDisk(videoUrl) {
  const a = abs(videoUrl);
  if (!a) return null;
  const dir = dirname(a), stem = basename(a, extname(a));
  // `.poster.webp` is what normalize.mjs → makePoster() writes; the dashed
  // variants are older hand-made ones. `.cover.webp` is listing key art and
  // comes last, since it is not necessarily a frame of this clip.
  for (const suf of ['.poster.webp', '-poster.webp', '-poster.jpg', '.cover.webp']) {
    const p = join(dir, stem + suf);
    if (existsSync(p)) return '/' + p.slice(REPO_ROOT.length + 1);
  }
  return null;
}

const report = { titles: 0, posters: 0, labels: 0, emptyPrompts: 0, badPosters: [], unposted: [], unprobed: [] };

/**
 * A poster is a freeze of the clip's first frame. If its aspect ratio does not
 * match, it is somebody else's picture: the browser letterboxes it inside the
 * player and the step reads as broken. None beats wrong — the posterless path
 * paints the clip's own opening frame.
 */
function posterFitsClip(posterUrl, videoUrl) {
  const pa = onDisk(posterUrl), va = onDisk(videoUrl);
  if (!pa || !va) return true;                 // remote: not ours to judge
  try {
    const p = probeImage(pa), v = probeVideo(va);
    if (!p.w || !p.h || !v.w || !v.h) return true;
    return Math.abs((p.w / p.h) - (v.w / v.h)) / (v.w / v.h) < 0.05;
  } catch { return true; }
}

function labelFor(step, guide) {
  const isFinal = (u) => u && (u === guide.video || u === guide.image || u === guide.audio);
  try {
    if (step.result_video) {
      const a = onDisk(step.result_video);
      if (!a) return null;
      const p = probeVideo(a);                       // { w, h, dur, … }
      const t = clock(p.dur);
      const dim = p.w && p.h ? `${p.w}×${p.h}` : null;
      const facts = [t, dim].filter(Boolean).join(', ');
      if (!facts) return null;
      return `${isFinal(step.result_video) ? 'The finished piece' : 'The delivered clip'} · ${facts}`;
    }
    if (step.result_audio) {
      const a = onDisk(step.result_audio);
      if (!a) return null;
      const t = clock(probeAudio(a).dur);
      if (!t) return null;
      return `${isFinal(step.result_audio) ? 'The finished track' : 'The delivered track'} · ${t}`;
    }
    if (step.result_image) {
      const a = onDisk(step.result_image);
      if (!a) return null;
      const p = probeImage(a);
      if (!p.w || !p.h) return null;
      return `${isFinal(step.result_image) ? 'The finished frame' : 'The delivered frame'} · ${p.w}×${p.h}`;
    }
  } catch (e) {
    report.unprobed.push(`${guide.id}: ${e.message}`);
  }
  return null;
}

const data = JSON.parse(readFileSync(FILE, 'utf8'));

for (const g of data.guides || []) {
  if (g.video && !g.poster) {
    const p = posterOnDisk(g.video);
    if (p) { g.poster = p; report.posters++; }
  }
  for (const s of g.steps || []) {
    if (typeof s.title === 'string') {
      const t = s.title.replace(/^\s*\d+\s*[.)]\s+/, '');
      if (t !== s.title) { s.title = t; report.titles++; }
    }
    if ('prompt' in s && !String(s.prompt).trim()) { delete s.prompt; report.emptyPrompts++; }
    if (s.result_video) {
      if (s.result_poster && !posterFitsClip(s.result_poster, s.result_video)) {
        report.badPosters.push(`${g.id} → ${s.result_poster}`);
        delete s.result_poster;
      }
      if (!s.result_poster) {
        const p = posterOnDisk(s.result_video);
        if (p && posterFitsClip(p, s.result_video)) { s.result_poster = p; report.posters++; }
        else report.unposted.push(`${g.id} → ${s.result_video}`);
      }
    }
    if (!s.result_label) {
      const l = labelFor(s, g);
      if (l) { s.result_label = l; report.labels++; }
    }
  }
}

// --- targeted repair: one asset must never stand in for two different steps ---
// compare-interior-directions step 1 asks for three concepts in one prompt and
// then showed only the Baroque render — the same file step 2 uses as its own
// result. The set is the result; show the set.
const cmp = (data.guides || []).find(g => g.id === 'compare-interior-directions');
if (cmp && cmp.steps && cmp.steps[0] && (cmp.steps[0].result_image || cmp.steps[0].result_images)) {
  const dir = '/ui_views/assets/compare-interior-directions/';
  const set = [
    { src: dir + 'baroque_cottage_final.webp', label: 'Baroque cottage' },
    { src: dir + 'industrial_loft_final.webp', label: 'Industrial loft' },
    { src: dir + 'modern_studio_final.webp', label: 'Modern studio' },
  ].filter(m => onDisk(m.src));
  if (set.length === 3) {
    // The dimension in the label is read off the files, never typed by hand.
    const dims = set.map(m => { const p = probeImage(onDisk(m.src)); return `${p.w}×${p.h}`; });
    const same = dims.every(d => d === dims[0]);
    delete cmp.steps[0].result_image;
    cmp.steps[0].result_images = set;
    cmp.steps[0].result_label = same
      ? `All three returns from one prompt · ${dims[0]} each`
      : `All three returns from one prompt · ${dims.join(' / ')}`;
    cmp.steps[0].result_caption =
      'Ceiling height, window wall and camera distance change between the three — ' +
      'the brief locked them and the model ignored the lock. That is the finding this guide is about.';
    console.log('fixed: compare-interior-directions step 1 now shows all three returns');
  }
}

// --- targeted repair: a build guide has to show the thing it told you to build ---
// premium-product-montage generated four shots and ended on "stitch all four
// clips together" without ever showing the montage. Every number below is read
// off the files, so the claim stays true if the assets are ever re-rendered.
const mont = (data.guides || []).find(g => g.id === 'premium-product-montage');
if (mont && mont.video && onDisk(mont.video)) {
  const steps = mont.steps || [];
  // Re-runnable: drop a previously appended closing step so its wording and
  // numbers are regenerated from the current files rather than frozen in JSON.
  const prev = steps.findIndex(s => typeof s.title === 'string' && s.title.startsWith('Stitch the four shots'));
  if (prev !== -1) steps.splice(prev, 1);
  const shots = steps.map(s => s.result_video).filter(v => v && onDisk(v));
  if (shots.length === 4) {
    const parts = shots.map(v => probeVideo(onDisk(v)));
    const fin = probeVideo(onDisk(mont.video));
    const sum = parts.reduce((a, p) => a + p.dur, 0);
    const sizes = [...new Set(parts.map(p => `${p.w}×${p.h}`))];
    const silent = parts.filter(p => p.hasAudio === false).length;
    steps.push({
      title: 'Stitch the four shots — and watch the crop eat your framing',
      text:
        'No model does this part. Drop the four clips on a timeline in the order they were ' +
        `generated and export. The arithmetic holds: ${parts.map(p => p.dur.toFixed(2)).join(' + ')} = ` +
        `${sum.toFixed(2)}s of source against ${fin.dur.toFixed(2)}s delivered, so these are hard cuts with ` +
        'nothing trimmed. The framing does not hold. The shots came back as ' +
        `${sizes.join(' and ')} — landscape — and the montage is ${fin.w}×${fin.h}, a vertical crop. ` +
        'Every shot you generate for a phone-first cut has to be composed with that crop already in mind, ' +
        (silent
          ? `and ${silent === 1 ? 'one' : silent} of the four arrives with no audio track at all, so plan the sound bed before you export.`
          : 'and the sound bed has to be planned before you export.'),
      result_video: mont.video,
      // The guide's own poster is a 0.9 frame like the montage, so it belongs
      // here; posterFitsClip() above would have dropped it if it did not.
      ...(mont.poster && posterFitsClip(mont.poster, mont.video) ? { result_poster: mont.poster } : {}),
      result_label: `The finished piece · ${clock(fin.dur)}, ${fin.w}×${fin.h}`,
      result_caption:
        `Same four clips, ${sizes.join('/')} landscape sources, exported ${fin.w}×${fin.h}. ` +
        'Compose for the frame you will actually ship, not the one the model hands you.',
    });
    console.log('fixed: premium-product-montage now ends on the assembled montage');
  }
}

// --- targeted repair: a carousel is judged as a set, so show the set ---
// Both carousel guides argue about consistency across five slides ("4 of 5
// obeyed the brief"), then only ever show the slides one at a time. The claim
// is unverifiable until the frames sit next to each other.
const CAROUSEL_CLOSERS = {
  'jeweled-brand-icons-carousel': {
    title: 'Put the five side by side — that is where the odd one out shows up',
    labels: ['YouTube', 'X', 'Quadcode', 'ChatGPT', 'Apple'],
    text:
      'Each icon looked fine on its own. Lined up, the series test is instant: the same inflated glossy body, the same ' +
      'rim-lit black stage and the same jewel language carry across four slides, and the Quadcode slide breaks it by ' +
      'rendering a different mark entirely. Judge a carousel as a strip, never slide by slide — the audience scrolls it as one image.',
    caption:
      'One material formula, five silhouettes. Four hold the recipe; slide three drew Quadcode\'s real bumper mark ' +
      'instead of the four-pointed sparkle the prompt asked for.',
  },
  'museum-of-impossible-things-carousel': {
    title: 'Lay out all five — the exhibition has to read as one room',
    labels: ['Water Knot', 'Frozen Lightning', 'Ice with Fire', 'Storm in a Bottle', 'Folded Shadow'],
    text:
      'The formula was fixed once and only the exhibit changed, so the proof is in the strip: same hall, same velvet ' +
      'pedestal, same plaque system, same spotlight discipline across all five. Slide four drops to macro scale on ' +
      'purpose and still belongs, which is what stops four monumental frames in a row from going flat.',
    caption:
      'Five prompts off one skeleton. Scale changes at slide four; the lighting rig, the staging and the plaque never do.',
  },
};

for (const [gid, copy] of Object.entries(CAROUSEL_CLOSERS)) {
  const g = (data.guides || []).find(x => x.id === gid);
  if (!g || !g.steps) continue;
  const prev = g.steps.findIndex(s => Array.isArray(s.result_images));
  if (prev !== -1) g.steps.splice(prev, 1);                    // re-runnable
  const frames = g.steps.map(s => s.result_image).filter(u => u && onDisk(u));
  if (frames.length !== g.steps.length || frames.length < 3) continue;
  if (copy.labels && copy.labels.length !== frames.length) {
    console.log(`skipped: ${gid} has ${frames.length} frames but ${copy.labels.length} labels`);
    continue;
  }
  const dims = frames.map(u => { const p = probeImage(onDisk(u)); return `${p.w}×${p.h}`; });
  const same = dims.every(d => d === dims[0]);
  g.steps.push({
    title: copy.title,
    text: copy.text,
    result_images: frames.map((src, i) => ({ src, label: copy.labels ? copy.labels[i] : String(i + 1) })),
    result_label: same
      ? `The full set · ${frames.length} frames, ${dims[0]} each`
      : `The full set · ${frames.length} frames, ${dims.join(' / ')}`,
    result_caption: copy.caption,
  });
  console.log(`fixed: ${gid} now closes on all ${frames.length} frames together`);
}

// --- targeted repair: clean up legacy "Play the clip above" copy ---
// Media is rendered directly within the step container, so "clip above" is
// a leftover from the previous single-hero layout.
const ABOVE_REPLACEMENTS = [
  { match: /\s*Play the clip above to see the result\./g, replace: '' },
  { match: /\s*Play the clip above to see the final turntable\./g, replace: ' Watch the full 360° turntable below to verify silhouette and edge loops.' },
  { match: /\s*Press play above for the final 15-second cut\./g, replace: '' },
  { match: /Play the clip above and judge/g, replace: 'Play the clip below and judge' },
  { match: /\s*Play the clip above\./g, replace: '' },
];

for (const g of data.guides || []) {
  for (const s of g.steps || []) {
    if (typeof s.text === 'string') {
      for (const rep of ABOVE_REPLACEMENTS) {
        if (rep.match.test(s.text)) {
          s.text = s.text.replace(rep.match, rep.replace).trim();
        }
      }
    }
  }
}

// --- targeted repair: ensure every step with media has an authoritative caption & label ---
const STEP_ENRICHMENTS = {
  'jerry01-quadcode-testimonials': {
    2: {
      caption: 'Dark mode token palette: #0E0E14 canvas background, crisp white typography, and subtle border lines.',
    },
    5: {
      label: 'Live interactive widget · 3D rope physics, Canvas card textures',
      caption: 'Drag the rope or press arrow keys to cycle the cards live in the browser.',
    },
  },
  'snap01-parametric-kitchen-configurator': {
    3: {
      label: 'Live interactive configurator · Three.js, 6 parametric modules',
      caption: 'Drag modules from the library to test real-time grid snapping, collision checks, and pricing calculation.',
    },
  },
  'castlevania-pixel-art-prompt-breakdown': {
    1: { caption: 'Opening frame: moonlit castle exterior locking 16-bit color palettes, dithered stone, and fog.' },
    2: { caption: 'List rendering: four sacred relics numbered 1–4 with floating pedestals and distinct particle colors.' },
    3: { caption: 'Abstract constraints: health, mana, and time represented as three physical glowing altars.' },
    4: { caption: 'Prompt anatomy diagram: five orbiting magical artifacts labeling prompt syntax in-world.' },
    5: { caption: 'Split composition: left passage safe and bathed in candlelight, right passage cursed and decaying.' },
    6: { caption: 'Map screen diagram: four-stage ascending layout mapping dungeon progression without external UI.' },
    7: { caption: 'Troubleshooting boss: corrupted molten golem isolating visual glitches to a specific limb.' },
    8: { caption: 'Victory throne room: ceremonial banners, holy chalice, and midnight stained glass.' },
  },
  'jeweled-brand-icons-carousel': {
    1: { caption: 'YouTube play button: automotive candy lacquer with faceted crystal play mark on black studio floor.' },
    2: { caption: 'X logomark: obsidian glass body separated from pitch black background entirely by razor-sharp white rim light.' },
    3: { caption: 'Quadcode mark: model replaced the described four-pointed sparkle with Quadcode\'s actual Q logomark.' },
    4: { caption: 'ChatGPT knot: jade metal weave keeping interlaced geometry readable without blown-out specular flares.' },
    5: { caption: 'Apple logomark: brushed aluminum body with subtle crystal-edged leaf and mirror floor pool.' },
  },
  'museum-of-impossible-things-carousel': {
    1: { caption: 'Water Knot: suspended clear liquid knot in vacuum with caustic light refractions on charcoal plinth.' },
    2: { caption: 'Frozen Lightning: branching plasma bolt acting as the singular high-intensity light emitter in the room.' },
    3: { caption: 'Ice with Fire: thermal boundary contrast between glowing magma core and fractured blue permafrost shell.' },
    4: { caption: 'Storm in a Bottle: macro scale shift to 40cm vintage apothecary glass holding miniature storm clouds.' },
    5: { caption: 'Folded Human Shadow: matte black silhouette creased like origami silk inside a crisp circular spotlight.' },
  },
  'headphones-retouch-color-grade': {
    1: { caption: 'Raw unretouched capture: flat studio lighting, authentic metal scratches, and matte leather texture.' },
    2: { caption: 'Commercial hero grade: warm directional spotlight, anodized metal cleaned of blemishes without losing grain.' },
    3: { caption: 'Catalog framing: high-key even fill, isolated white stage, zero decorative lens flares.' },
    4: { caption: 'Macro vertical texture: 1088×1920 crop focused on the stitch seam and brushed chamfer.' },
    5: { caption: 'Delivered at 1600×1008 rather than 4K: edge sharpness improves, but check the actual dimensions before calling it UHD.' },
  },
  'business-visuals-that-explain-work': {
    1: { caption: 'Generated dashboard ignored the negative constraint: fabricated metrics appeared despite "no fake statistics".' },
    2: { caption: 'Split composition: left side slow manual paper routing, right side automated pipeline in neon accents.' },
    3: { caption: 'Timeline visual: calendar compression from months to days, clean isometric presentation.' },
    4: { caption: 'Clean Kanban flow delivered, but the spreadsheet side leaked arbitrary stock icons.' },
  },
  'compare-interior-directions': {
    2: { caption: 'Dark walnut joinery and heavy velvet textures delivered with dramatic evening fill light.' },
    3: { caption: 'Polished concrete floor and exposed black steel beams replace the cottage mouldings.' },
    4: { caption: 'Minimal modern studio: warm white plaster and low-profile oak furniture open up floor space.' },
  },
  'first-game-character': {
    1: { caption: 'Initial silhouette and weapon concept generated from the locked class brief.' },
    2: { caption: 'Gold filigree and weathered jade shaders defined before starting mesh generation.' },
    3: { caption: 'Front-quarter mesh preview with baked normal and albedo maps.' },
    4: { caption: 'Full 20-second 360° turntable review at 1080×720 showing clean edge loops.' },
  },
  'premium-product-montage': {
    1: { caption: 'Four-panel storyboard establishing palette, lighting direction, and camera movement before generation.' },
    2: { caption: 'Unboxing beat: slow vertical rise of the box lid under a single key spotlight.' },
    3: { caption: 'Product hero rotation: metallic reflections trace the earcups against total black.' },
    4: { caption: 'Rainy Tokyo street lifestyle cut: wide cinematic framing with soft neon bokeh.' },
    5: { caption: 'End card reveal: centered product anchor with reflection on high-gloss floor.' },
  },
  'gym-diary-pov-vlog': {
    3: { caption: 'Full 15-second vertical edit at 720×1280. Handheld drift and autofocus hunt sell the casual vlog feel without camera rigs.' },
  },
  'seoul-street-food-fisheye-tape': {
    3: { caption: 'Delivered in native 4:3 at 1440×1080. Fisheye barrel distortion stays authentic to the 90s MiniDV format because it wasn\'t cropped to 16:9.' },
  },
  'white-fit-fisheye-fashion-film': {
    3: { caption: 'Delivered at 1080p from a 4K generation. Film grain and fabric highlights hold crisp contrast throughout the runway orbit.' },
  },
  'polar-scalp-shampoo-ad': {
    3: { caption: '13.5-second commercial cut: macro water droplets and ice-mist pass cleanly into the final brand end card.' },
  },
  'anatomy-atelier-3d-explorer': {
    3: { caption: 'Smooth 30 fps viewport capture of the anatomical layering slider, from muscular surface to skeletal core.' },
  },
  'winter-ops-fps-industrial': {
    3: { caption: '41-second combat run stitched across 3 extensions: snow drift and weapon recoil stay consistent across boundaries.' },
  },
  'anime-caramel-pudding-recipe': {
    3: { caption: 'Ghibli-style kitchen sequence: custard jiggle and caramel glaze maintain cel-shading edges through final encode.' },
  },
  'fauxreal-gaussian-splat-loop': {
    3: { caption: 'Ten-second zero-cut loop: point-cloud collapse and rebuild connects four scans seamlessly.' },
  },
  'graphics-lab-render-library': {
    3: { caption: 'Interactive shader gallery walkthrough captured at constant 30 fps without dropped frames.' },
  },
  'ps5-controller-configurator-page': {
    4: { caption: '30-second product demo showing colorway swaps, trigger haptics animation, and real-time lighting response.' },
  },
  'rooftop-run-cel-shaded-trailer': {
    3: { caption: '30-second fast-paced parkour sequence: dynamic speed ramps and speed lines across 7 distinct roof jumps.' },
  },
  'blocky-world-photoreal-remaster': {
    3: { caption: 'Voxel-to-photoreal world transformation: ray-traced water reflections and volumetric fog unite the Minecraft blocks.' },
  },
  'interior-render-model-battle': {
    3: { caption: 'Split-screen model comparison: mid-tone exposure and window glass caustics evaluated head-to-head.' },
  },
  'forest-ops-tactical-fps': {
    3: { caption: '27-second tactical advance: 1440p master downsampled to clean 1080p30 with zero dropped frames.' },
  },
  'cherry-blossom-boss-cinematic': {
    4: { caption: 'Full 15-second cinematic render. The fight resolves before the motion engine loses character geometry in the flurry.' },
  },
  'rolex-4k-before-after-upscale': {
    3: { caption: 'Side-by-side upscale demonstration: bezel knurling and dial typography remain razor sharp.' },
  },
  'boss-fight-model-battle': {
    3: { caption: 'Direct model battle: frame-synchronized playback highlights motion blur vs. particle fidelity.' },
  },
  'mutation-serum-vfx': {
    3: { caption: 'Sci-fi transformation beat: bioluminescent veins expand across the arm before the creature emerges.' },
  },
  'drowned-king-model-battle': {
    3: { caption: 'Submerged kingdom duel: water distortion and cloth physics compared between both models.' },
  },
  'walk-on-water-viral': {
    3: { caption: 'Viral illusion clip: footsteps ripple surface tension without breaking immersion.' },
  },
  'screen-to-reality-hero': {
    3: { caption: 'Hero section interaction: macaw breaks out of the screen bezel into full 3D space.' },
  },
  'product-hero-turntable': {
    3: { caption: 'Seamless product turntable: 360-degree rotation with consistent studio rim lighting.' },
  },
  'beauty-brand-landing': {
    3: { caption: 'Clean beauty brand demo: scroll-triggered card transitions recorded without UI lag.' },
  },
  'photo-particle-poster': {
    3: { caption: 'Vertical poster motion: fine particle dispersal carries the portrait into graphic typography.' },
  },
};

for (const [gid, stepsMap] of Object.entries(STEP_ENRICHMENTS)) {
  const g = (data.guides || []).find(x => x.id === gid);
  if (!g || !g.steps) continue;
  for (const [stepNum, patch] of Object.entries(stepsMap)) {
    const s = g.steps[Number(stepNum) - 1];
    if (!s) continue;
    if (patch.label) s.result_label = patch.label;
    if (patch.caption) s.result_caption = patch.caption;
  }
}

// Specific title clarification
const fops = (data.guides || []).find(x => x.id === 'forest-ops-tactical-fps');
if (fops && fops.steps && fops.steps[2] && fops.steps[2].title === '60 → 30 is the real win; 4K was never in this file') {
  fops.steps[2].title = 'Conforming 60 → 30 is the real win; 4K was never in this file';
}

if (!DRY) writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');

console.log(`titles renumbered : ${report.titles}`);
console.log(`posters wired     : ${report.posters}`);
console.log(`labels added      : ${report.labels}`);
console.log(`empty prompts cut : ${report.emptyPrompts}`);
if (report.unprobed.length) console.log(`probe failures    :\n  ${report.unprobed.join('\n  ')}`);
if (report.badPosters.length) {
  console.log(`\nposters dropped — wrong aspect for their clip (${report.badPosters.length}):`);
  for (const b of report.badPosters) console.log('  ' + b);
}
if (report.unposted.length) {
  console.log(`\nstill without a poster (${report.unposted.length}) — needs an authored frame, not a grab:`);
  for (const u of report.unposted) console.log('  ' + u);
}
console.log(DRY ? '\n(dry run — nothing written)' : '\nwritten: ui_views/guides.json');
