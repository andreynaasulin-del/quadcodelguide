---
name: Import 21st.dev Guides
alias: developer_import_21st_guides
description: Import 15 public 21st.dev projects into Quadcode Guide with a result image after every prompt.
type: skills: quadcode.ai
subtype: base
tags: 21st.dev, guides, import, automation
author: Quadcode Guide
---

## Purpose

Run the repository's 21st.dev ingestion flow from Quadcode chat. Each session imports up to 15 public projects, adapts the instructions to the site's style, and publishes them through the existing authenticated guide API.

## Use When

- the user asks to refresh guides from 21st.dev
- the scheduled import needs a manual rerun
- the user asks for the next batch of 15 projects

## Inputs

- repository with `scripts/import_21st_guides.mjs`
- `GUIDES_API_KEY` for publishing
- optional batch limit; default and maximum session target is 15

## Rules

1. Read the current 21st.dev public `demos.list` response before changing the importer; it is an internal public endpoint and may change without notice.
2. Import only public, listed projects with a preview image.
3. Use stable ids in the form `21st-<demo id>-<slug>` and skip ids already on the live site.
4. Every step containing `prompt` must also contain `result_image` immediately after it in the guide data. When only one source preview exists, publish one complete step with that one honest result; never duplicate it as fake intermediate results.
5. Do not include author names, original publication URLs or source attribution in generated guide data or copy.
6. Adapt instructions to the host site's tokens and components. Do not claim the source component itself was redesigned.
7. Preview before publishing. Never invent `GUIDES_API_KEY`.
8. Import no more than 15 guides per chat session unless the user explicitly changes the limit.

## Workflow

1. Discover project commands with `ToolGetAvailableUserCommands`.
2. Run the configured dry-run command for `node scripts/import_21st_guides.mjs --limit 15`.
3. Read `.temp/21st-guides-preview.json` and verify:
   - exactly 15 guides when enough unseen publications exist
   - unique ids
   - category is `Interfaces`
   - each prompt step has a non-empty HTTPS `result_image`
   - author names, original URLs and `source` metadata are absent
4. With approval and `GUIDES_API_KEY`, run the configured publish command for `node scripts/import_21st_guides.mjs --limit 15 --publish`.
5. Report imported ids, skipped duplicates and any source/API failure.

## Validation

- no duplicate guide ids
- no missing `title`, `text`, `prompt`, or `result_image` in steps
- all media URLs use HTTPS
- the live guide API accepts every payload
- failures stop the run and remain visible in logs

## Output

A report with the number prepared and published, the preview file path, and failed project ids if any.
