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
  /**
   * SITE-WIDE archive: the whole guide-site repository, attached as the
   * top-level `project` in guides.json and therefore offered under every guide
   * that has no dedicated archive of its own. The reader gets the sources of
   * every guide at once — landing, guides.json, publish scripts, meta/plans,
   * interactive projects (powderline, glock18, snap01, jerry01, …).
   *
   * Payload is computed from `git ls-files` (build script, --site) instead of
   * a hand list: the repo IS the payload. Heavy media is left out on purpose —
   * every video / 3D / oversized PNG is already served from Blob and shown on
   * the site; shipping 1.1 GB so a reader can open landing.html is not a favour.
   */
  'quadcode-guide-source': {
    site: true,
    projectName: 'Quadcode Guide — site sources',
    gitTracked: {
      excludeExt: /\.(mp4|mov|glb|wav)$/i,
      maxFileBytes: 2 * 1024 * 1024,
    },
    workspace: {
      browserUrl: 'https://guides.quadcode.ai/',
      expanded: ['ui_views', 'scripts', 'meta', 'meta/plans'],
    },
    starterChat: {
      topic: 'Quadcode Guide — sources of every guide on the site',
      agent: 'Cody',
      messages: [
        {
          from: 'user',
          text:
            'This is the full source of guides.quadcode.ai — the site every guide I just read lives on. ' +
            'Before I touch anything: where is what, and where do the guides themselves live?',
        },
        {
          from: 'agent',
          text:
            'Map of the repo, shortest useful version:\n\n' +
            '- `ui_views/guides.json` — the catalog. One object per guide: title, steps, prompts, media URLs, ' +
            'and `project` (the archive a guide hands to the IDE). Edit a guide = edit this file.\n' +
            '- `ui_views/landing.html` — the whole site in one file: catalog grid, guide page, ' +
            '"Open in Quadcode" / IDE handoff, analytics. No build step.\n' +
            '- `api/` + `lib/guide_page.mjs` — Vercel functions: `/guide/<id>` server render with OG tags, ' +
            '`/api/publish` (commits guides.json to GitHub), `/api/upload` (Blob tokens).\n' +
            '- `scripts/` — publishing tooling: `publish_case.mjs`, `build_guide_project.mjs` (this archive), ' +
            'media normalisation, sitemap.\n' +
            '- `meta/plans/` — one plan per guide: what was built, in which order, what was rejected. ' +
            'This is the honest making-of behind each guide page.\n' +
            '- Interactive guide projects sit at the root or under `ui_views/assets/`: `games/powderline`, ' +
            '`glock18-ghost-protocol`, `audio-reactive-identity`, `ui_views/assets/snap01-configurator.html`, ' +
            '`ui_views/assets/jerry01-testimonials`, `ui_views/assets/working-volumes`.\n\n' +
            'Not in this archive: videos, 3D models and PNGs over 2 MB. They are all live on the site — ' +
            'guides.json points at their public URLs.',
        },
        {
          from: 'user',
          text: 'Run it locally and tell me the fastest way to make one guide my own.',
        },
        {
          from: 'agent',
          text:
            '`npm install` then `npm run dev` — the dev server (scripts/dev_server.mjs) serves the site at ' +
            'http://localhost:9099 with the same `/guide/<id>` routing as production.\n\n' +
            'Fastest path to your own guide:\n' +
            '1. Copy any guide object in `ui_views/guides.json`, change `id`, `title`, `desc`, `date`.\n' +
            '2. Rewrite the `steps[]` — each step is a `title`, a `text` explaining the decision, and the exact ' +
            '`prompt` you ran. Readers copy prompts verbatim; keep them runnable.\n' +
            '3. Drop your result media next to it and run `npm run media:apply` to push them to Blob and ' +
            'rewrite the paths.\n' +
            '4. Reload the dev server — your guide is in the grid.\n\n' +
            'Tell me which guide you want to fork and I\'ll do steps 1–2 with you.',
        },
      ],
    },
  },
  /**
   * Per-guide KITS (the default for every guide) are generated from guides.json
   * by scripts/lib/guide_kit.mjs: README + prompts/ + result/ media + a
   * re-enacted making-of chat. An entry here only ADDS to the auto kit —
   * `sources` are extra repo paths shipped under `sources/` for guides that
   * built something runnable (a widget, a game, a page).
   */
  'jerry01-quadcode-testimonials': {
    sources: [
      { src: 'ui_views/assets/jerry01-testimonials', dest: 'sources/jerry01-testimonials' },   // index.html + vendor/ + assets/
    ],
  },
  // snap01: its widget is picked up automatically via steps[].widget_iframe.
};
