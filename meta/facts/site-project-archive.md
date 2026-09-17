---
SECTION_ID: facts.site-project-archive
TYPE: fact
---

# Site-wide project archive ("Open in Quadcode" under every guide)

- guides.json has a TOP-LEVEL `project` (next to `categories`/`guides`) = the whole
  repo's sources as one zip. `landing.html` → `guideProject(g)` returns the guide's own
  `project` if it has one (jerry01), else `SITE_PROJECT`. So every guide page shows
  "Open in IDE" + the .zip link, and the primary CTA hands the project to the IDE.
- `project.scope === 'site'` switches the CTA hint copy (site sources vs finished project).
- Rebuild + re-upload (overwrites the same Blob URL, no guides.json URL churn):
  `node scripts/build_guide_project.mjs quadcode-guide-source` (add `--dry-run` first).
  Needs `npm install` (@vercel/blob) and BLOB_READ_WRITE_TOKEN in .env.local.
- Payload = `git ls-files` minus `.mp4/.mov/.glb/.wav` minus files > 2 MB
  (spec: `scripts/lib/project_payloads.mjs` → `quadcode-guide-source.gitTracked`).
  Result: 921 files, 82 MB zip. Tracked-only ⇒ .env.local/.temp can't leak.
- Blob URL: https://pzppugfayde6tlqh.public.blob.vercel-storage.com/guides/quadcode-guide-source/quadcode-guide-source-project.zip
- Verified 2026-09-16: click on a guide without own archive → /ping → /open-project →
  IDE downloaded, unpacked into ~/QuadcodeAI/apps/"Quadcode Guide — site sources",
  starter chat focused, tree expanded to ui_views/scripts/meta/plans.
- GOTCHA: a successful /open-project SWITCHES the IDE to the new project — relative
  file paths in tools then resolve against the wrong root. Use absolute paths after testing.
- The archive snapshots guides.json BEFORE the `project` key is written — rebuild after
  big content changes so readers get a current catalog.
