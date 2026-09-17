---
SECTION_ID: plans.site-source-archive
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Site-wide project archive → "Open in Quadcode" under every guide

GOAL: every guide's CTA hands the reader a real project (this repo's sources) via the
IDE API instead of falling back to "copy prompt + quadcode://open".

## Decisions
- ONE archive for the whole site (`quadcode-guide-source`), attached as a top-level
  `project` in guides.json = fallback for every guide without its own `project`.
  jerry01 keeps its dedicated archive.
- Payload = `git ls-files` minus `.mp4/.mov/.glb/.wav` minus files > 2 MB
  (~95 MB raw, 921 files). Media results live on Blob/site; the reader needs code,
  meta, plans, interactive projects, posters.

## Steps
- [x] 1. project_payloads.mjs: add `quadcode-guide-source` spec (gitTracked filter, starter chat)
- [x] 2. project_archive.mjs: `gitTrackedPayload()` + honour `workspace.expanded`
- [x] 3. build_guide_project.mjs: `site: true` spec → writes `doc.project`
- [x] 4. landing.html: `guideProject(g)` fallback to `SITE_PROJECT`, site-aware CTA copy
- [x] 5. built + uploaded: 921 files, 82.2 MB, HTTP 200 on Blob
- [x] 6. local test PASSED: gym-diary-pov-vlog → Open in Quadcode → IDE unpacked project,
      starter chat + tree state applied (see meta/facts/site-project-archive.md)
- [x] 7. PO REVIEW (2026-09-16): site-wide starter chat REJECTED — reader landed in a
      repo-map chat full of links instead of the guide's video, closed the IDE, left.
      Site archive stays as fallback only; the primary path is v2 below.

## v2 — one project per guide (prompt + result + 3-step instruction)
- [x] 8. scripts/lib/guide_kit.mjs: auto spec from guides.json → README.md, prompts/NN.txt,
      result/ media (local ui_views/assets files), starter chat = re-enacted making-of
      (USER: prompt → LLM: result media + one line), agent by category (Sonic/Lumi/Cody)
- [x] 9. project_archive.mjs: `{src,dest}` payload entries + `extraFiles` (generated text)
- [x] 10. build_guide_project.mjs: fall back to auto spec, `--all` builds every guide;
      hand specs (jerry01) merge sources + auto kit
- [x] 11. landing.html: CTA copy for per-guide kits (scope 'kit')
- [x] 12. built + uploaded 52/52 kits (HTTP 200 on Blob), guide.project.scope='kit' in guides.json;
      CTA verified locally. Facts → meta/facts/guide-kits.md
- [x] 12b. full recheck pass (2026-09-16 pm): chat pictures → IDE attachment format
      (marker + images_data); final file pre-opened in File editors (windows_state.json);
      additional_context per kit; agent pick by media type; project names cut on clause;
      widget HTML asset paths rewritten + shipped; zip ?v=hash + short Blob cache;
      landing: deep-link → poll /ping → auto /open-project. 52/52 rebuilt + re-uploaded.
- [ ] 13. live click test (switches the IDE window that owns :47823 — PO gives the go)
- [ ] 14. publish (commit + push) — awaiting PO
