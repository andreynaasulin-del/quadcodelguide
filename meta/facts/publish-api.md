---
SECTION_ID: facts.publish-api
TYPE: fact
---

# Publish API — /api/publish

Endpoint: `POST https://quadcodeguide.vercel.app/api/publish` (Vercel serverless, `api/publish.js`)

## Auth
- Header `x-api-key`, timing-safe compared to Vercel env `GUIDES_API_KEY` (Production, Encrypted)
- GitHub commits use Vercel env `GH_TOKEN` (classic PAT, scope `public_repo`, owner andreynaasulin-del)
- Local copies of both secrets: `.temp/secrets/api_key.txt`, `.temp/secrets/gh_token.txt` (gitignored, NOT in repo)

## What it does
1. Validates key → 401 on mismatch
2. Loads current `ui_views/guides.json` from GitHub main (source of truth + sha)
3. Applies change, validates guide schema → 422 with details on failure
4. Commits via GitHub Contents API
5. Vercel project is git-connected → push auto-deploys production (verified e2e; DEPLOY_HOOK_URL env is optional fallback, currently unset)

## Request body
- `{ "guide": {...} }` — add one guide (prepends; same `id` = update in place)
- `{ "data": {...} }` — replace whole guides.json (must contain `guides` array)
- `"dryRun": true` — validate only, no commit/deploy
- `"message": "..."` — custom commit message

Guide required fields: `id` (slug: a-z0-9-), `cat`, `title`, `desc`, `steps[]` (each step: `title` + `text`).

## Example
```bash
curl -X POST https://quadcodeguide.vercel.app/api/publish \
  -H "Content-Type: application/json" \
  -H "x-api-key: $GUIDES_API_KEY" \
  -d '{"dryRun":true,"guide":{"id":"my-guide","cat":"Video","title":"T","desc":"D","steps":[{"title":"s","text":"t"}]}}'
```

## Key rotation (90 days or on leak)
```bash
openssl rand -hex 32 > .temp/secrets/api_key.txt
sh .temp/vercel_env.sh          # re-adds GH_TOKEN + GUIDES_API_KEY to Vercel env
npx vercel deploy --prod --yes  # env picked up on new deployment
```
GH token rotation: GitHub → Settings → Developer settings → Tokens → regenerate, save to `.temp/secrets/gh_token.txt`, rerun the same script.

## Media upload — /api/upload + scripts/publish_case.mjs
Media (video/poster/image/audio, up to 200MB) uploads via Vercel Blob, bypassing the 4.5MB serverless limit:
- Store: `guides-media` (store_7HM6dAlHTxS7FwQC, public, linked to project; `BLOB_READ_WRITE_TOKEN` in Vercel env + `.env.local`)
- `POST /api/upload` (`api/upload.js`) — issues short-lived Blob client-upload tokens. Auth: same `GUIDES_API_KEY`, passed via `x-api-key` header OR `clientPayload` (the @vercel/blob client can't send custom headers). `blob.upload-completed` callbacks are signature-verified by handleUpload, no key needed.
- Allowed: mp4/webm/mov, jpg/png/webp/gif, mp3/wav/m4a. Files land under `guides/<id>/` with random suffix.

### One-command case publish (for external Quadcode projects)
```bash
npm i @vercel/blob   # once, Node 18+
GUIDES_API_KEY=<key> node scripts/publish_case.mjs case.json [--dry-run]
```
`case.json` = guide object; media fields (`video`, `poster`, `image`, `audio`, `steps[].result_image`, `steps[].result_video`) may be LOCAL file paths (relative to the json) — script uploads them to Blob, swaps in public URLs, then publishes via /api/publish. Existing `/ui_views/...` and `https://...` values are left untouched.

E2E verified: 401 auth, real image upload -> public blob URL 200, script dry-run OK. Blob store cleanup: `npx vercel blob del <path> --rw-token $(grep BLOB_READ_WRITE_TOKEN .env.local | cut -d'"' -f2)`.
