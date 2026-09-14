---
SECTION_ID: links.21st-dev-public-api
TYPE: link
---

# 21st.dev public publications endpoint

URL: https://21st.dev/api/trpc/demos.list
DESCRIPTION: Public tRPC query used by the 21st.dev component catalog. Returns demo records with component metadata, author, preview image, timestamps and pagination cursor.
LAST_CHECKED: 2026-07-28
TAGS: 21st.dev, api, components, import
RELEVANCE: Source for the daily batch of 15 Quadcode Guide imports.

## Observed contract

- Procedure: `demos.list`
- Sort used: `date`
- Public filters: `includePrivate=false`, `onlyDefaultDemo=true`
- Response: `result.data.json.items`, `totalCount`, `nextCursor`
- Image: `items[].preview_url`
- Metadata: `items[].component_data`

This is a public site endpoint, not a documented stable partner API. The importer must fail visibly if the response shape changes.
