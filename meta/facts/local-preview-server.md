---
SECTION_ID: facts.local-preview-server
TYPE: note
STATUS: active
DATE: 2026-09-09
SCOPE: scripts/dev_server.mjs, package.json
---

# Local preview: use `npm run dev` (:9099), not :9087

## The bug we chased

`http://localhost:9087/...` intermittently answered:

```
Error code: 404
Message: File not found.
```

…while the file was present on disk and `curl` returned `200` a minute later.

**Cause:** :9087 is not a dev server we own. It is the file server built into the
QuadcodeAI desktop app — process `genui` (`lsof -i :9087` → `genui <pid>`). It
starts, stops and rebinds together with the app and with whatever project the app
currently has open. Two failure modes:

1. App restarts / reopens a project → the socket is down or the served root
   changes → every path 404s until it settles.
2. The IDE API has the same pattern on :47823: only the **first** launched IDE
   instance owns the port (see the 20.08 call notes), so a second window serves
   nothing.

Same 404 body appears in `~/Library/Logs/quadcodeai-error.log`, which is how we
identified the owner.

## The fix

`scripts/dev_server.mjs` — a plain node static server for this repo, independent
of the desktop app.

```bash
npm run dev              # http://localhost:9099/ui_views/landing.html
PORT=9100 npm run dev    # if 9099 is taken
```

Properties that matter here:

- **`/` → 302 → `/ui_views/landing.html`** — the short link is `http://localhost:9099/`.
- **Range requests → 206.** Required for `<video>` seeking; the app's server
  handled this poorly.
- **`no-store` for `.html` / `.json`**, 5-min cache for media — a reload always
  picks up a fresh `guides.json`.
- Path traversal blocked; correct MIME for webp/mp4/mp3/glb/wasm.
- Node core only, no `npm install`.
- On `EADDRINUSE` it prints the `lsof` command instead of a stack trace.

## Rule of thumb

Never share or bookmark a `:9087` URL. It is the IDE's internal preview and it
will 404 the moment the app blinks. Preview links go through `npm run dev`.
