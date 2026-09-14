---
SECTION_ID: plans.screenshot-maker
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# App Store Screenshot Maker

GOAL: Client-side tool that turns raw app screenshots into App Store-ready marketing shots: auto device frame, multi-size export, captions, background styling, auto-compose palette from screenshot. Reference: .temp/upload/ssstwitter.com_1783591617648.mp4 (warm editorial two-panel editor).

## Task Checklist

- [x] Review reference video (frames at 1s/8s/17s)
- [x] Check skills catalog (no web-build template exists — custom build)
- [x] Build skeleton: index.html + style.css + app.js (two-panel layout, warm editorial style)
- [x] Canvas renderer: background, caption/subtitle with *accent* markup, device frame (rounded body + dynamic island), screenshot clipped inside
- [x] Controls: caption, size slider, position (top/bottom verified), density, subtitle + placement
- [x] Screenshot input: file picker, drag-drop on canvas (verified via synthetic DragEvent), clipboard paste
- [x] Multi-size export: 6.9" 1320x2868, 6.7" 1290x2796, 6.5" 1284x2778, 5.5" 1242x2208 + Export all (export click OK, no JS errors)
- [x] Slides: multiple screenshots, thumbnail strip, per-slide caption, export set
- [x] Background styling: 7 presets + 4 custom color pickers + gradient bg
- [x] Auto-compose: palette extraction verified — picks terracotta #ad4f31 from test shot (after scoring tune: sat^1.8 * count^0.3, min sat 0.25)
- [x] Visual QA loop in browser (top/bottom layouts, loaded slide, drop-hint, thumbs — all screenshot-verified)

## QA findings fixed
- Canvas overflow: % max-height didn't apply -> explicit style.width/height + dpr-aware internal res
- Duplicate placeholder text on canvas removed (DOM overlay is enough)
- Palette scoring favored large dark areas over saturated brand colors -> retuned

## Fitness tracker pivot (approved by PO, done)
- [x] Screen content mode: Fitness demo (default) | My screenshot
- [x] Tracker screen renderer: title, timer card (WORK dark / REST green, mm:ss, progress ring, "Next:"), exercise cards with type chips (PSH/STR/CRD), done checkmark / GO pill
- [x] Exercises panel: add (name + type pushups/strength/cardio + detail), remove, toggle done — live on canvas
- [x] Work/Rest timer inputs (0-599 s) + Show work / Show rest phase toggle
- [x] Zoom callout: drag rectangle on phone screen -> magnified inset (source × zoom, no stretching); drag inside to move, corners to resize; Magnify slider 1.1-2.2×; chip with remove
- [x] Callout + tracker render into exports (offscreen src canvas is shared); _screen restored after export via repaint()
- [x] QA verified in browser: draw/move callout, add Plank, REST phase, done toggles, export click — no JS errors
- [x] Tracker screen rebuilt 1:1 to reference: iOS status bar (8:32, signal, wi-fi, battery 76%), home indicator, liftful. PRO header + RHR pill, serif headline, search bar, list container with dividers
- [x] Locked zones like the reference: status bar/header/headline (top) + home indicator (bottom) — callout can't be drawn, dragged or resized into them; inset placement clamped to content zone too
- [x] Inset (magnified callout) is draggable like the reference: grab and move anywhere in content zone, clamped out of locked zones (header top / home bar bottom); auto-placement stays until first manual drag (co.ix/co.iy)
- [x] Inset persists: stray click restores previous callout (dragOp.prev) instead of deleting it
- [x] Inset resizable by its own corner handles (white dots): drag corner -> zoom 1.1-3.0x, opposite corner anchored, Magnify slider synced (range extended to 300)
- Default caption: "Train harder. *Rest smarter*."

## Deferred (needs PO approval)
- Publish as guide/case on quadcodeguide site

## Notes
- All client-side, no build step, vanilla JS + canvas
- Export via canvas.toBlob PNG at native pixel size
- Fonts: editorial serif (Playfair Display) + sans (Inter) via Google Fonts
