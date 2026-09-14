---
SECTION_ID: plans.body-bench
TYPE: note
---

# Body Bench — reference-inspired interactive viewer

Scope: standalone local viewer; no catalog change, no payment integration, no commits/push without approval.
Reference: user-provided W-tursdK9GYAUWlj.mp4, four frames in conversation.
Template search developer/frontend returned only unrelated 21st guide importer, no suitable viewer template.
Design review switched through Lumi. Reference is visual guide: warm sunset, ocean horizon, sand pedestal, bronze mannequin, charcoal pill controls, cream active states. Existing Manrope font reused. Style sample: style-guide.html.

- [x] Inspect reference and project rules; inspect existing UBC female base geometry in browser.
- [x] Package only torso/thigh geometry from existing project model (source remains intact): 231455 bytes, 4206 vertices.
- Standalone root: `.local/body-bench/`, dedicated loopback server port 9100. No catalog edits, commits, pushes or deployment. Existing reference/style decisions retained.
- [x] Style sample (`http://127.0.0.1:9100/?style-guide`) + responsive viewer; four shape presets, camera presets, Pearl/Noir.
- [x] Surface-integrated sponsor label using rest-coordinate shader, image upload (5 MB / 4096 px limit), HTTP(S)-only URL validation and raycast interaction.
- [x] Browser QA: all four forms have finite geometry; all four camera handlers; sticker hit remains true in all forms; URL scheme validation, wheel zoom, clean mode/Escape; PNG upload and invalid-file rejection. Mobile 390x789: no horizontal overflow, visible buttons 44 px tall. No error/warning console entries on final test page. JS syntax checks passed.
- [ ] User visual approval: initial angular proportions rejected; revised after photo `.temp/upload/chat_image_3f2ffeda-69f6-4c7a-9d3f-07133380b052.png`. Two-pass Loop subdivision: 11487 indexed vertices. Adjusted waist, rounded gluteal volume, smoother/shorter thighs, matte skin. Still a stylized mannequin, NOT photorealistic reconstruction of the photograph.

Runtime files: `.local/body-bench/{index.html,style.css,app.js,scene.js,body.js,topology.js,body.json,server.mjs,vendor/three.bundle.js}`. Launch from repo root: `node .local/body-bench/server.mjs`. URL http://127.0.0.1:9100/. Binds loopback only; serves only its own directory. Server console 1792 (session-specific). Approx. 2.35 MB initial JS/data transfer, mainly bundled Three.js (2.09 MB); body data 231 KB. No asset generation, uploads, payments or physical simulation; image stays in browser. Garment is a surface material mask, not simulated cloth. `.local/` added to .gitignore and .vercelignore. No commits/push/deploy performed. The older unused preparation script in ui_views/assets/body-bench is excluded from Vercel too.

Model source: .temp/threejs-playground/public/assets/simhuman/ubc-female.glb (project asset). External redistribution license not established: local prototype only pending provenance confirmation. No original reference mesh available; not a 1:1 reproduction. No physical simulation claim.
