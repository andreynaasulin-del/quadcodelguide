---
SECTION_ID: facts.guide-kits
TYPE: note
---

# Guide kits — what "Open in Quadcode" hands the reader (v2, 2026-09-16)

## Why v2 exists
v1 shipped ONE site-wide archive (all sources + a "repo map" chat with paths/links).
PO test: a reader coming from a 15-second vlog guide landed in that chat, saw no video
and no prompt, closed the IDE, left. Verdict: wrong format. Rule from PO:
**instruction + the media file itself (prompt → result). No links unless it's a build.**

## What a kit is
One zip per guide, generated from the guide's own guides.json entry:
```
README.md            title, desc, result, "Make it yourself" (3–4 steps), every step
                     with prompt (code block) + result media + caption, file map
prompts/NN-slug.txt  each step prompt verbatim (copy-paste)
result/final.mp4     guide.video|audio|image  (+ final-poster.webp)
result/step-N.*      steps[].result_video|audio|image (+ step-N-poster)
result/downloads/    guide.downloads[].file (GLB, PDF, html)
sources/             steps[].widget_iframe + hand-listed `sources` (jerry01 widget)
.quadcodeai/         starter chat = re-enacted making-of; tree expanded on result/prompts;
                     right tab = File editors; agent by guide.models (Sonic/Lumi/Cody)
```
Chat shape: LLM intro (title + final poster + one line) → per step: USER = prompt,
LLM = result media + caption → LLM outro ("paste prompt 1 with your subject").
User name in chat is "You". Pictures in chat use the IDE's OWN attachment format
(proven to render for user uploads): `[Uploaded Image: result/x.webp]` marker in the
text + base64 under the same key in `images_data` (cap 700 KB/image, `inlineB64`).
README uses plain markdown `![](result/…)`. Videos: path line + the file is already
OPEN in File editors (`.data/windows_state.json` → main_window_tab_viewer.files;
the IDE's viewer plays mp4 — the author had one open). Audio kits open on README.
`additional_context.yaml` per kit tells the agent "pasted prompt = generate their version".
Widget HTML (`steps[].widget_iframe`) is rewritten: `/ui_views/assets/x` → relative
(`../result/downloads/x.glb`, `assets/x.png`) and shipped; README warns that fetch-based
loaders (model-viewer) need `python3 -m http.server` when opened from file://.
Agent pick (`agentForGuide`): Interfaces/Website/three.js/agent → Cody; else final
media video|audio → Sonic, image → Lumi; then model names; then category.
Project name: "Guide — <title>", >64 chars → first clause (no mid-sentence ellipsis).
CACHE TRAP: Blob default cache-control is max-age=1y. Zips now upload with
`cacheControlMaxAge: 300` and guides.json stores `zip?v=<md5-10>` so a rebuilt kit is
what the IDE downloads. (IDE still switches to an already-unpacked project of the
same name instead of re-downloading — a stale kit on a reader's disk stays stale.)
Landing: primary CTA when IDE is NOT running → deep link + `handoffWhenIdeUp()` polls
/ping ≤45 s and POSTs /open-project as soon as the app answers (one click, no re-click).

## Code
- `scripts/lib/guide_kit.mjs` — `guideKitSpec(guide, {sources})`, `agentForGuide`,
  `projectNameFor` ("Guide — <title>", colons/quotes stripped for Windows/Finder).
- `scripts/lib/project_archive.mjs` — payload entries may be `{src, dest}`;
  `extraFiles: [{dest, content}]` written into the stage; `workspace.rightTab`.
- `scripts/lib/project_payloads.mjs` — hand entries only ADD `sources` to the auto kit
  (jerry01). `quadcode-guide-source` = site-wide fallback (top-level `project`, scope 'site').
- `scripts/build_guide_project.mjs <id> | --all [--dry-run] [--stage-only]`.
  Kits get `guide.project.scope = 'kit'`; landing.html CTA copy branches on it.
- Audit helper: `.temp/audit_guide_media.mjs` (media on disk / prompts per guide).

## Numbers
52 guides, all media local, no misses. Kit sizes 0.4–51 MB (snap01 carries 6 GLBs).

## Presentation rules (v3, added after the step-by-step pass)
A poster is NOT a stand-in for a clip. `mediaMd()` embeds stills only; video/audio get
`▶︎ path — plays in the editor tab on the right` because the file is already open there.
Cover art appears ONCE, at the top of README under "## The result".
Chat results share one shape: `**Label**` bold line, then the path, then where to play it.
Stills attach as real images, deduped via an `attached` Set; total inline budget 3 MB
(per-image cap still 700 KB) so a long transcript can't bloat the open.
Step labels are facts read off the files (`The delivered clip · 0:05.1, 1280×720`) —
never typed by hand. Same for any dimension quoted in step copy.
A poster whose aspect ratio differs from its clip by >5% is DROPPED, not used: the browser
letterboxes it and the step reads as broken. Posterless clips get `.m-video-wrap.is-unposted`
(play badge + `preload=metadata`, `is-live` on loadeddata) which paints the clip's own
first frame. `scripts/make_missing_posters.mjs` renders the ten authored poster frames
(hand-picked timestamps, reasons in the file) via `makePoster()` → `<stem>.poster.webp`.
One prompt returning a SET (3 directions, 5 carousel slides) → `steps[].result_images`
(`[{src,label}]`), rendered as `.m-step-media-grid` (`is-2`/`is-4`/`is-5`, no crop —
forcing a ratio would crop the very thing being compared). Kits ship the set as
`result/step-Na.webp`, `-Nb`, … ; README tracks a `shown` Set so the closing strip
lists links instead of re-embedding pictures the reader just scrolled past.
Guides with ZERO prompts (fauxreal splat loop) say so explicitly in chat intro, README
"Make it yourself" and `additional_context.yaml` ("never invent a prompt for it"); the
outro offers the mechanism (step titles) instead of a paste buffer.
Outro "keep the technical lines" is per medium — instrumentation/tempo/mix for audio,
camera/lens/lighting for video, framing/lighting/style for image.

## Normalizer
`scripts/polish_guides.mjs` — idempotent, re-runnable, the single entry point for
guides.json hygiene: de-numbers step titles ("1. Plan" → "Plan"), wires posters from
disk (`.poster.webp` → `-poster.webp` → `-poster.jpg` → `.cover.webp`), drops
aspect-mismatched posters, generates `result_label`s from ffprobe, deletes empty prompt
keys, and applies the targeted repairs (compare-interior 3-up strip, premium-product
montage closing step, both carousel closing strips). Targeted repairs delete their own
previous output first, so numbers regenerate from current files.
Audit scripts live in `.temp/`: `audit_steps.mjs` (per-guide defects + by-design notes),
`unfinished.mjs` (guides that never show their own final), `dump_guide.mjs`,
`show_chat.mjs <id>` (starter chat + inline image sizes), `hero_posters.mjs`.

## Open-path test without touching the PO's IDE
Stub `window.fetch` for anything containing `47823` and patch
`HTMLAnchorElement.prototype.click` + the `HTMLIFrameElement.prototype.src` setter to
record `quadcode://` instead of navigating. Then click `[data-qc-open]`.
Verified: (1) IDE up → single `POST /open-project` with the right name + versioned zip;
(2) IDE down → deep link fires, `/ping` polls ~2 s apart, and the POST goes out on the
first successful ping — one click, no re-click. NOTE: inside the IDE's own browser
`window.QC` exists and the CTA takes the agent path, so hide `window.QC` to exercise
the real-visitor path.

## Testing gotcha (still true)
`POST 127.0.0.1:47823/open-project` switches the IDE instance that OWNS the port —
a second IDE window does not get a port. Live click test = the port-owning window
changes project. Get the PO's go before firing it.
