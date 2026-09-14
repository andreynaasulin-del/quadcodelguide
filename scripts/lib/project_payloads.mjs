/**
 * What each guide's downloadable project actually contains.
 * One entry per guide — deliberately explicit, no globs, no "copy everything".
 *
 * `starterChat` is the conversation the reader finds waiting in the IDE. It is
 * WRITTEN, not recorded: the author's real session is never shipped (it leaks
 * internal notes and drags hundreds of MB of inlined tool output). Treat this
 * copy like the guide's intro paragraph — it is the first thing a reader reads.
 * Keep it short, name the files, end on a concrete next move.
 */
export const PROJECT_PAYLOADS = {
  'jerry01-quadcode-testimonials': {
    projectName: 'JERRY01 — Quadcode Testimonials',
    payload: [
      'ui_views/assets/jerry01-testimonials',   // index.html + vendor/ + assets/
      'meta/plans/jerry01-quadcode-testimonials.md',
    ],
    // The one browser window the reader opens into: the guide itself, so the
    // steps sit next to the code instead of in a lost tab.
    workspace: {
      browserUrl: 'https://guides.quadcode.ai/#/guide/jerry01-quadcode-testimonials',
    },
    starterChat: {
      topic: 'JERRY/01 — restyle the testimonial rig into the Quadcode system',
      agent: 'Cody',
      messages: [
        {
          from: 'user',
          text:
            'This project is the finished JERRY/01 guide: a third-party Three.js testimonial widget ' +
            '(rope physics + canvas-textured cards) restyled into the Quadcode dark system.\n\n' +
            'Give me the lay of the land before I change anything — which file holds what, and where ' +
            'the line is between the physics rig and the visual layer.',
        },
        {
          from: 'agent',
          text:
            'Everything lives in `ui_views/assets/jerry01-testimonials/`:\n\n' +
            '- `index.html` — the whole thing: markup, CSS tokens, Three.js scene, rope solver, card ' +
            'texture painter. Single file on purpose, so you can diff a restyle in one place.\n' +
            '- `vendor/` — pinned Three.js build. Don\'t swap versions mid-guide; the rope constraints ' +
            'are tuned against this one.\n' +
            '- `assets/` — textures and fonts used by the canvas card painter.\n' +
            '- `meta/plans/jerry01-quadcode-testimonials.md` — the build plan the guide follows, step by step.\n\n' +
            'The line you asked about: the rig (verlet rope, constraint passes, pointer drag) never reads ' +
            'colour or type. The visual layer is CSS custom properties + the card-texture function + the ' +
            'three stage lights. A full restyle touches only the second group — if you find yourself editing ' +
            'the solver to fix a look, you\'re in the wrong layer.',
        },
        {
          from: 'user',
          text: 'Good. Open it and tell me what to try first if I want to make it mine.',
        },
        {
          from: 'agent',
          text:
            'Fastest path to a version that reads as yours, in order of impact per minute:\n\n' +
            '1. **Tokens.** Retarget the CSS custom properties at the top of `index.html` — background, ' +
            'ink, accent. One accent change repaints cards, glow and drag highlight at once.\n' +
            '2. **Card texture.** The canvas painter controls typography, padding and the avatar frame. ' +
            'This is where a restyle stops looking like a recolour.\n' +
            '3. **Stage lights.** Three lights set the mood; the key light\'s colour and intensity decide ' +
            'whether the cards feel matte-editorial or glossy-product.\n' +
            '4. **Copy.** Replace the testimonials with real quotes from your own product. Fake ' +
            'testimonials read as fake no matter how good the render is.\n\n' +
            'Ask me to do any of these and I\'ll make the edit directly. Want me to start with the token pass ' +
            'and show you the diff?',
        },
      ],
    },
  },
};
