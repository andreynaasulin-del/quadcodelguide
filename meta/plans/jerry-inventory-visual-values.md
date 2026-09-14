---
SECTION_ID: plans.jerry-inventory-visual-values
TYPE: note
---

# Jerry Rope Testimonials — Visual Values Inventory

## Goal
Clone target repo, run locally, inventory EVERY hardcoded visual value:
CSS custom properties, font-family declarations, hex colors in JS
(canvas fill styles, Three.js material colors, light colors). NO logic changes.

## Steps
- [x] 1. Verify clone state + origin — origin=https://github.com/MehediHasan27/jerry-rope-testimonials.git, HEAD b7e434e; fresh clone at .temp/jerry-rope-testimonials-upstream [skill: none]
- [x] 2. Run repo locally — python http.server :8137 (console_id=6164), browser quadcode:web:browser:id:142, scene ready: 6 cards, 132752 tris, no errors [skill: none]
- [x] 3. Extract CSS custom properties + font-family declarations (see report) [skill: none]
- [x] 4. Extract JS hex colors: canvas fillStyle, THREE materials, lights, DATA tints (see report) [skill: none]
- [x] 5. Vendor bundles: three.bundle.js / GLTFLoader.bundle.js are stock libs (no scene colors); assets/puller.glb.js is base64 GLB — character materials baked inside binary [skill: none]
- [x] 6. Compile full inventory report — see final response REPORT BLOCK [skill: none]

## Findings (summary)
- 5 CSS custom properties in :root (light cream/ink/terra theme)
- 2 font-family declarations (system-ui stack; Georgia serif for h2)
- 6 per-testimonial tints in DATA
- ~20 canvas fill/stroke colors in fibreTexture(), paintCard(), waveTexture()
- 15 Three.js material colors + 4 light colors (hex)
- initHuman() runtime overrides: roughness 0.88, metalness 0.0, envMapIntensity 0.6
- GLB materials embedded in binary base64 (not editable as hex in source)

## Full inventory (verbatim, source: .temp/jerry-rope-testimonials-upstream/index.html)

### A. CSS custom properties (:root)
```
color-scheme: light;
--cream:#F7EFE1;
--cream-2:#EDE0C9;
--ink:#2A211A;
--ink-soft:#6B5C4C;
--terra:#C2603C;
```

### B. font-family declarations (CSS)
- body: `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif`
- .rope-head h2: `Georgia,"Iowan Old Style","Times New Roman",serif`
- (canvas in JS, see paintCard below: quote uses Georgia stack; name/role/initials use `-apple-system, system-ui, sans-serif`)

### C. Other hardcoded CSS colors (outside :root)
- body background radial: `#FFF9EE 0%`, `rgba(255,249,238,0) 62%`
- .play: border `rgba(90,66,40,.22)`, color `#fff`
- .tracks: background `rgba(255,255,255,.6)`, border `rgba(90,66,40,.16)`
- .trk[aria-checked="true"]: color `#FFF8EC`
- .own span: border `rgba(90,66,40,.34)`; hover bg `rgba(255,255,255,.7)`, border `rgba(90,66,40,.5)`
- .nav button: border `rgba(90,66,40,.22)`, bg `rgba(255,255,255,.7)`; hover bg `#fff`, border `rgba(90,66,40,.4)`
- .dot: background `rgba(90,66,40,.26)`
- .hint kbd: border `rgba(90,66,40,.26)`, bg `rgba(255,255,255,.65)`

### D. DATA per-testimonial tints (6)
- #C2603C (Marisol Vega), #7C8C6A (Dev Raman), #3F6B8A (Aoife Brennan),
  #A8623F (Tomas Lindqvist), #6B5C8A (Priya Nadar), #8A6B3F (Ezra Coleman)

### E. Three.js lights (4)
- hemi = HemisphereLight(0xfff8ec, 0xa07a4e, 1.35)
- key  = DirectionalLight(0xfff2df, 2.35)
- fill = DirectionalLight(0xdbe8ff, 0.5)
- rim  = DirectionalLight(0xffffff, 0.75)

### F. Three.js material colors (15 + extras)
- MAT.thread  color 0x8A7358
- MAT.ring    color 0xB9A184
- MAT.fur     color 0xA9764A, sheenColor 0xE7C79A
- MAT.furDk   color 0x8A5C38, sheenColor 0xD8B88C
- MAT.belly   color 0xF4E3C4, sheenColor 0xFFF6E4
- MAT.ear     color 0xE2A79C
- MAT.nose    color 0xD98C86
- MAT.hand    color 0xF6E8CE
- MAT.eye     color 0xFFFFFF
- MAT.pupil   color 0x241A14
- MAT.dark    color 0x5E3E28
- MAT.mouth   color 0x5E3226
- MAT.drop    color 0xAEDCF0, emissive 0x2C6E8C, emissiveIntensity 0.25, opacity 0.88
- MAT.ropeCore color 0x6E4A28
- card MeshPhysicalMaterial sheenColor 0xFFF3E0 (roughness 0.86, sheen 0.5, clearcoat 0.05)
- ring MeshBasicMaterial color 0xC2603C (map WAVE_TEX, transparent)
- wall ShadowMaterial opacity 0.11; floor ShadowMaterial opacity 0.17

### G. Canvas colors in JS
fibreTexture():
- fill "#C79A63"
- stroke `rgba(${120+t*60|0},${86+t*40|0},48,.35)` (t<0.5)
- stroke `rgba(255,${226+t*20|0},178,.32)` (t>=0.5)
paintCard():
- gradient stops "#FFFEFA" / "#FDF7EC" / "#F6EEDD"
- paper fibre fill "#8A7454" or "#ffffff" (i%3), globalAlpha 0.05
- border stroke "rgba(186,164,130,.5)" width 1.5
- quote fill "#2A211A" (Georgia serif)
- divider stroke "rgba(186,164,130,.55)"
- avatar fill = d.tint (per-card, see D)
- initials fill "#fff"
- name fill "#2A211A"; role fill "#6B5C4C"; stars fill "#C2603C"
waveTexture():
- ring gradient "rgba(255,255,255,0)" → "rgba(255,255,255,α)" → "rgba(255,255,255,0)" (α = 1 / 0.62 / 0.34 per ring)

### H. initHuman() runtime overrides
- m.roughness = 0.88; m.metalness = 0.0; m.envMapIntensity = 0.6 (all GLB materials)

### I. Non-editable-as-hex
- assets/puller.glb.js = base64 GLB; character materials baked inside the binary.
- vendor/three.bundle.js, vendor/GLTFLoader.bundle.js = stock libs (no scene colors).
