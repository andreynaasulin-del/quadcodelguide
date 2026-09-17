#!/usr/bin/env node
/**
 * make_missing_posters.mjs — renders the poster stills that STANDARD.video
 * requires (posterRequired: true) for the ten clips that shipped without one.
 *
 * The timestamp per clip is a decision, not a default. t=0 on most of these
 * clips is a black fade-up or a slate; a poster grabbed there is the reason a
 * guide card looks broken. Each value below was picked off a six-frame
 * contact sheet (.temp/poster_candidates.mjs) against three rules:
 *
 *   - the subject is fully in frame and lit
 *   - nothing is mid-motion-blur or mid-wipe
 *   - the frame states what the clip is about (the dial macro for an upscale
 *     demo, the hero section for a landing walkthrough, the character sheet
 *     for a character build)
 *
 * Rendering goes through the project's own makePoster(), so size, scaler and
 * webp quality match every other still in the repo.
 *
 * Usage: node scripts/make_missing_posters.mjs [--force]
 */
import { existsSync, unlinkSync } from 'node:fs';
import { join, basename } from 'node:path';
import { REPO_ROOT, makePoster, probeImage, probeVideo } from './lib/normalize.mjs';

const FORCE = process.argv.includes('--force');

/** clip (repo-relative) -> [seconds, why this frame] */
const PICKS = [
  ['ui_views/assets/savor01-evidence-of-food/savor01-twitter-promo-v01.mp4', 7.86,
    'the "EVIDENCE, CAPTURED" panel — the only frame that says what the piece argues'],
  ['ui_views/assets/cherry-blossom-boss-cinematic/left_gpt56sol.mp4', 1.81,
    'wide establishing: samurai, boss and the sakura valley all readable before the fight blurs everything'],
  ['ui_views/assets/rolex-4k-before-after-upscale/rolex-before-after-final.mp4', 6.51,
    'dial macro — the split where the upscale difference is actually visible'],
  ['ui_views/assets/video-macbook-bird-flyout.mp4', 7.08,
    'macaw clear of the screen with wings fully spread — the whole point of the clip'],
  ['ui_views/assets/video-bloomcare-landing.mp4', 1.45,
    'the hero section, nav and headline intact, before the scroll cuts type in half'],
  ['ui_views/assets/gamedev-rpg-character.mp4', 2.41,
    'front-facing character sheet with the stat panel — the deliverable, not a detail crop'],
  ['ui_views/assets/video-airpods-clip-unboxing.mp4', 2.10,
    'lid off, product seated in the box, warm rim light — the unboxing beat'],
  ['ui_views/assets/video-airpods-clip-hero.mp4', 2.10,
    'crown centred against the dark halo, machining crisp'],
  ['ui_views/assets/video-airpods-clip-lifestyle.mp4', 2.08,
    'subject centred against the wet-street bokeh, headphones unmistakable'],
  ['ui_views/assets/video-airpods-clip-endcard.mp4', 1.35,
    'product plus wordmark — an end card has to carry the name'],
];

let made = 0, kept = 0;
for (const [rel, at, why] of PICKS) {
  const abs = join(REPO_ROOT, rel);
  if (!existsSync(abs)) { console.log(`MISSING CLIP  ${rel}`); continue; }
  const expected = abs.replace(/\.(mp4|mov|webm|m4v)$/i, '') + '.poster.webp';
  if (existsSync(expected)) {
    if (!FORCE) { kept++; console.log(`kept   ${basename(expected)}`); continue; }
    unlinkSync(expected);                      // makePoster is a no-op if present
  }
  const out = makePoster(abs, { at });
  const p = probeImage(out), v = probeVideo(abs);
  const fits = Math.abs((p.w / p.h) / (v.w / v.h) - 1) < 0.05;
  console.log(`${fits ? 'made  ' : 'ASPECT'} ${basename(out)}  @${at}s  ${p.w}×${p.h}  clip ${v.w}×${v.h}`);
  console.log(`        ${why}`);
  made++;
}
console.log(`\n${made} rendered, ${kept} already present`);
console.log('next: node scripts/polish_guides.mjs   (wires them into guides.json)');
