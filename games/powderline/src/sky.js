// Sky, sun and the far horizon. Everything is shader maths or generated
// geometry; there is not a single image file in here.

import * as THREE from 'three';
import { ridged, vnoise1 } from './noise.js';
import { getSeed } from './worldfn.js';

export const SUN_DIR = new THREE.Vector3(0.38, 0.62, -0.68).normalize();

export function makeSky(scene) {
  const geo = new THREE.SphereGeometry(1, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSun: { value: SUN_DIR.clone() },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSun;
      uniform float uTime;

      float h21(vec2 p){ p = fract(p*vec2(93.41,271.9)); p += dot(p,p+31.7); return fract(p.x*p.y); }
      float n2(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        float a = h21(i), b = h21(i+vec2(1,0)), c = h21(i+vec2(0,1)), d = h21(i+vec2(1,1));
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
      }
      float clouds(vec2 p){
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { s += a * n2(p); p *= 2.11; a *= 0.5; }
        return s;
      }

      void main() {
        vec3 d = normalize(vDir);
        float up = clamp(d.y, -1.0, 1.0);
        // A clear high-altitude sunny day: deep at the zenith, milky at the rim,
        // with a warm golden band low over the horizon on the sun's side.
        vec3 zenith = vec3(0.075, 0.255, 0.600);
        vec3 horizon = vec3(0.700, 0.835, 0.955);
        // Blue arrives fast above the horizon; the old 0.85 endpoint kept the
        // whole visible sky milky-white and any tint on it read as a stain.
        vec3 col = mix(horizon, zenith, smoothstep(-0.02, 0.55, up));
        // Sun: a tight core plus a MODEST halo. The previous wide warm haze
        // (mix up to 0.22 across ~90 degrees) collapsed under tone mapping
        // into a pale disc with a visible rim — the "dome" bug.
        float sunDot = max(dot(d, uSun), 0.0);
        float halo = pow(sunDot, 24.0);
        col = mix(col, vec3(1.0, 0.88, 0.66), halo * 0.30);
        col += vec3(1.0, 0.84, 0.58) * pow(sunDot, 260.0) * 0.55;
        float solarHaze = halo; // reused by the cumulus tint below
        // Golden alpenglow band hugging the horizon. Pushed up to 0.22+0.30
        // once the real dome bug turned out to be the sky sphere clipping the
        // far plane, not this term — so it can be pronounced again. The band
        // now reaches up=0.30, which is roughly the ridge line at eye level.
        float glow = (1.0 - smoothstep(0.0, 0.30, up)) * smoothstep(0.0, 0.28, up + 0.28);
        col = mix(col, vec3(1.0, 0.82, 0.58), glow * (0.22 + 0.30 * sunDot * sunDot));
        // Thin cirrus, only above the horizon, drifting slowly. Frequency 4.6
        // (was 1.35): the old value made ONE noise cell span half the visible
        // sky and it rendered as a giant pale dome with a soft circular rim.
        // Tight threshold + weak mix keeps them as streaks, not a ceiling.
        // Gated hard to the horizon belt (up < 0.45): the planar projection
        // d.xz/(up+0.22) compresses toward the zenith, so ONE noise blob there
        // covered the whole upper sky and drew a dome rim. Below up=0.45 the
        // projection is stretched enough for the streaks to read as cirrus.
        vec2 cp = d.xz / max(up + 0.22, 0.06);
        float c = clouds(cp * 4.6 + vec2(uTime * 0.006, uTime * 0.0025));
        c = smoothstep(0.66, 0.94, c) * smoothstep(0.05, 0.18, up) * (1.0 - smoothstep(0.28, 0.45, up));
        col = mix(col, vec3(1.0, 0.995, 0.985), c * 0.38);
        // Cumulus low over the horizon. Confirmed by runtime bisection: with
        // the sun uniform zeroed the pale dome persisted, so the culprit was
        // THIS term — at freq 1.7 one noise blob covered ~90 deg of azimuth
        // and its smoothstep edge drew a circular rim across the sky.
        // Freq 4.2 gives horizon-scale puffs; the band stops at up=0.20 so
        // clouds hug the ridge line instead of climbing the sky.
        vec2 qp = d.xz / max(up + 0.35, 0.10);
        float q = clouds(qp * 4.2 + vec2(uTime * 0.0032, -uTime * 0.0014) + 37.2);
        float band = smoothstep(0.02, 0.08, up) * (1.0 - smoothstep(0.10, 0.20, up));
        float puff = smoothstep(0.62, 0.86, q) * band;
        float shade = smoothstep(0.62, 0.96, q);           // brighter tops
        vec3 cloudCol = mix(vec3(0.82, 0.86, 0.91), vec3(1.0, 0.99, 0.97), shade);
        cloudCol += vec3(1.0, 0.80, 0.55) * solarHaze * 0.35;
        col = mix(col, cloudCol, puff * 0.62);
        // SECOND deck, higher and 1.8x finer, drifting the other way with its
        // own seed. Two decks at different scales and speeds is what reads as
        // distance in the sky — one deck alone always looks like a decal.
        float q2 = clouds(qp * 7.6 + vec2(-uTime * 0.0021, uTime * 0.0017) + 91.7);
        float band2 = smoothstep(0.10, 0.17, up) * (1.0 - smoothstep(0.24, 0.38, up));
        float puff2 = smoothstep(0.66, 0.90, q2) * band2;
        vec3 cloud2 = mix(vec3(0.86, 0.89, 0.94), vec3(1.0, 0.98, 0.95), smoothstep(0.66, 0.98, q2));
        cloud2 += vec3(1.0, 0.78, 0.52) * solarHaze * 0.5;
        col = mix(col, cloud2, puff2 * 0.38);
        // THIRD deck: high altocumulus, and the only one allowed above 22 deg.
        // Decks 1 and 2 are both clamped under up=0.38, so with a 68 deg FOV
        // two thirds of the visible sky was a bare gradient - the single
        // biggest reason the backdrop read as a placeholder.
        // Domain: d.xz/(up+0.55). The +0.35 divisor used below compresses ~9x
        // between the horizon and the zenith and turns one noise cell into a
        // dome; +0.55 compresses 3.7x, which stays legible all the way up.
        vec2 hp = d.xz / (up + 0.55);
        float q3 = clouds(hp * 8.2 + vec2(uTime * 0.0042, uTime * 0.0011) + 154.3);
        float band3 = smoothstep(0.26, 0.46, up);
        float puff3 = smoothstep(0.70, 0.93, q3) * band3;
        vec3 cloud3 = mix(vec3(0.78, 0.84, 0.92), vec3(1.0, 0.99, 0.98), smoothstep(0.70, 0.99, q3));
        cloud3 += vec3(1.0, 0.86, 0.62) * solarHaze * 0.30;
        col = mix(col, cloud3, puff3 * 0.30);
        // Ground haze plus a thin aerial band; this separates foreground terrain
        // from the distant ridges without a full volumetric pass.
        col = mix(vec3(0.80, 0.88, 0.95), col, smoothstep(-0.09, 0.03, up));
        float hazeBand = 1.0 - smoothstep(0.015, 0.13, abs(up));
        col = mix(col, vec3(0.72, 0.83, 0.93), hazeBand * 0.14);
        // Dither: +-0.002 of grain. ACES + an 8-bit target quantises the slow
        // sky gradient into visible contour rings; this hides them for free.
        col += (h21(gl_FragCoord.xy) - 0.5) * 0.004;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  // 2500, NOT 4000. Camera far plane is 2900 (main.js): at 4000 the far
  // plane sliced the sphere and the cut edge drew a giant circular rim
  // across the sky ("dome bug"), with renderer clearColor showing beyond it.
  // Direction-based shading means the sphere radius is visually irrelevant —
  // it only has to sit inside the frustum. 2500 < 2900 with margin.
  mesh.scale.setScalar(2500);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  scene.add(mesh);
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
    color: 0xfff1c2, transparent: true, opacity: 0.94,
    depthTest: false, depthWrite: false, toneMapped: false,
  }));
  // The shader already draws the solar glow. A depthless sprite at horizon
  // distance projected as a giant flat disc on wide screens.
  sunDisc.visible = false;
  sunDisc.renderOrder = -800;
  scene.add(sunDisc);
  return {
    mesh,
    sunDisc,
    material: mat,
    update(t, camPos) {
      mat.uniforms.uTime.value = t;
      mesh.position.copy(camPos);
      sunDisc.position.copy(camPos).addScaledVector(SUN_DIR, 1800);
    },
  };
}

// A ring of distant peaks so the world has a horizon that is not just fog.
// Built once, parented to the rider, drawn without depth writes.
export function makeHorizonRidges(scene) {
  const group = new THREE.Group();
  const seed = getSeed();
  // Atmospheric perspective done properly: the FAR layer is the lightest
  // (most air in front of it), the NEAR layer the deepest blue. Unlit shader —
  // scene lights on a backdrop silhouette are what produced the flat beige
  // "wall". Per-column crest height + crest color ride along as attributes
  // (identical on both verts of a column), and the fragment shader shades each
  // column against its OWN crest: base dissolves into haze, mid-slope shows
  // rock, only the top band gets the snow cap. No cross-column interpolation,
  // so no vertical streaks.
  const haze = new THREE.Color(0xcfdde9);        // matches the sky's ground haze
  // hazeLo/hazeHi: where along a column the haze fade ends. The near layer
  // stays mostly solid (crisp silhouette), the far one is mostly air.
  // f = base noise frequency around the ring, tf = teeth frequency. The old
  // f=3.2 gave ~3 noise cells per full circle: kilometre-wide bald domes at
  // the screen edges. 7-9 cells puts a peak every few degrees of view.
  // The three layers are now spread MUCH further apart in haze distance
  // (far 0.52-0.94 is almost pure air, near 0.12-0.42 is almost solid). When
  // all three sat around 0.3/0.7 they read as one flat cut-out band. `tint`
  // darkens the two near layers so the silhouette has actual contrast against
  // the sky instead of dissolving into it.
  const layers = [
    // snow 0.64, was 0.80: the far ring is the one the atmosphere should be
    // eating, and at 0.80 it was the brightest thing in frame - the horizon
    // popped forward and the depth ordering inverted.
    { r: 2450, h: 470, col: 0x9db6cf, seg: 280, o: 0,  snow: 0.64, hazeLo: 0.52, hazeHi: 0.94, facet: 0.10, f: 9.0, tf: 43, tint: [1.00, 1.00, 1.00] },
    { r: 1700, h: 400, col: 0x7695b8, seg: 240, o: 51, snow: 0.72, hazeLo: 0.30, hazeHi: 0.72, facet: 0.14, f: 7.0, tf: 31, tint: [0.90, 0.93, 0.97] },
    // Near layer is TALLER than the far one (420 vs 470 at 2.1x closer range,
    // so it subtends far more sky) and keeps strong snow caps — at h=300 and
    // snow=0.62 it rendered as a low dark bruise sitting behind the bright far
    // peaks, which reads as inverted perspective.
    // seg 200->300: same smear artifact as the r=680 layer above, isolated
    // the same way (hide every ring but this one). At 1.8 deg/column this
    // was the second-coarsest ring, AND its haze band is the narrowest
    // (0.20-0.48) so the raw facet-lit colour survives longest up the
    // column before fog washes it out - the two together made the
    // per-column colour lerp visible as a soft vertical stripe.
    { r: 1150, h: 420, col: 0x5d7ea6, seg: 300, o: 97, snow: 0.74, hazeLo: 0.20, hazeHi: 0.48, facet: 0.14, f: 5.2, tf: 23, tint: [0.88, 0.91, 0.96] },
    // Fourth layer, and the one that was missing. Terrain tiles stop being
    // legible past ~600 m and the nearest ridge sat at 1150 m: a 550 m hole
    // where a real valley has its opposite flank. Nothing in the frame told the
    // eye how far away the horizon was, so all three rings collapsed into one
    // sticker. r=680 is inside the fog falloff, hence the darkest tint and the
    // near-solid haze range - it should read as rock you could almost ski to.
    // h=210 and a lighter tint after the first render: at h=300 with tint 0.80
    // this layer became a near-black wall straight down the fall line, and the
    // run visually dead-ended into it. Lower and lighter, it behaves like the
    // valley's far flank instead of a barrier.
    // col 0x86a6c6 and haze 0.34-0.86, was 0x557aa4 / 0.10-0.40: that rock
    // colour at 90% opacity down the fall line rendered as a saturated navy
    // slab - the run looked like it ended in a lake. This layer is 680 m away,
    // i.e. INSIDE the fog falloff, so most of it should be air.
    // seg 168->340: isolated with runtime bisection (every other ring hidden
    // one at a time) - THIS is the one layer that showed the soft vertical
    // smear, and it's the only ring where degrees-per-column (360/168=2.14)
    // is noticeably coarser than the rest (1.29-1.8). At the same facet
    // contrast, a wider column makes the per-column colour lerp (lit
    // alpenglow vs shadow) visible as a soft blended stripe instead of
    // blending into texture - the other three rings never showed it.
    { r: 680, h: 210, col: 0x86a6c6, seg: 340, o: 143, snow: 0.78, hazeLo: 0.34, hazeHi: 0.86, facet: 0.18, f: 3.4, tf: 15, tint: [0.97, 0.98, 1.00] },
  ];
  const BASE_Y = -260;
  let layerIndex = 0;
  for (const L of layers) {
    const pos = [];
    const crest = [];
    const capCol = [];
    const rockCol = [];
    const idx = [];
    const base = new THREE.Color(L.col);
    // 0xe6effa, not 0xf4f9ff. Pure white snow on the FAR ring is physically
    // backwards: 2.45 km of air desaturates and lifts a distant peak toward the
    // sky colour, it does not make it brighter than the snow at your feet.
    const snowCap = new THREE.Color(0xe6effa);
    const warm = new THREE.Color(0xffd9b0);      // faint alpenglow on sun-facing caps
    const shadow = new THREE.Color(0x3d5878);    // cool shadow side of a facet
    const _c = new THREE.Color();
    const _r = new THREE.Color();
    // Pass 1: crest heights, so pass 2 can shade each column by its slope.
    const ys = [];
    for (let i = 0; i <= L.seg; i++) {
      const a = (i / L.seg) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const baseRid = ridged(ca * L.f, sa * L.f, seed + L.o, 4);
      // Sub-peaks from a SECOND ridged octave, not from sin(a * tf). The old
      // teeth term was a periodic sine raised to the 5th power: 43 spikes at
      // exactly 8.4 deg apart around the far ring, which read as a comb of
      // identical white fangs. Noise gives irregular spacing and irregular
      // heights, which is what a real skyline does. tf/6 keeps the per-layer
      // detail spread (far 7.2x the base frequency, near 2.5x).
      const sf = L.f * (L.tf / 6);
      const sub = ridged(ca * sf + 17.3, sa * sf - 9.1, seed + L.o + 7, 3);
      // Exponent 0.85, NOT 1.35. ridged() already returns sharp crests; any
      // power above 1 pinches them further and every peak came out as an
      // isosceles cone - a row of shark fins. Below 1 the valleys lift and the
      // peaks grow shoulders, which is the silhouette a real massif has.
      const rid = Math.pow(baseRid, 0.85) * 0.86 + Math.pow(sub, 2.1) * (0.09 + baseRid * 0.26);
      ys.push(24 + rid * L.h + vnoise1(i * 0.31, seed + L.o) * 30);
    }
    // Normalise the snow line against the crest heights this layer actually
    // produced. Dividing by L.h assumed rid maxes out at 1.0; it peaks near
    // 1.3, so every tall column saturated `tall` to 1 and got the full white
    // cap - hence solid white tips instead of a snow line.
    let yMax = 1;
    for (const y of ys) if (y > yMax) yMax = y;
    for (let i = 0; i <= L.seg; i++) {
      const a = (i / L.seg) * Math.PI * 2;
      const x = Math.cos(a) * L.r;
      const z = Math.sin(a) * L.r;
      const y = ys[i];
      pos.push(x, BASE_Y, z, x, y, z);
      crest.push(y, y);
      // Facet shading: the crest slope decides whether this column faces the
      // sun or hides from it. This is what turns a flat band into a mountain.
      // Three earlier attempts all still strobed column-to-column (values
      // logged live: 0.52/0.45/0.54/0.27/0.26/0.30/0.54/0.66 and similar).
      // First two derived slope from `ys` (neighbour diff, then box-blurred
      // neighbour diff) - `ys` bakes in a sub-octave via Math.pow(), a sharp
      // nonlinearity no blur window fully removes without washing out the
      // silhouette. Third attempt sampled ridged() at a wide angular offset
      // hoping to dodge the noise - but called it with octaves=4, THE SAME
      // call used to build `ys`, so it carried the exact same fine ripple
      // (lacunarity 2.07/octave means 4 octaves already span an ~8.9x
      // frequency range - nothing "macro" about it). The actual fix: call
      // ridged() with octaves=1. That is the base bump field alone, the one
      // that shapes each hill, with no finer octave riding on top of it -
      // its derivative is smooth by construction, no filtering needed.
      const macroStep = (Math.PI * 2) / (L.f * 2);
      const rL = ridged(Math.cos(a - macroStep) * L.f, Math.sin(a - macroStep) * L.f, seed + L.o, 1);
      const rR = ridged(Math.cos(a + macroStep) * L.f, Math.sin(a + macroStep) * L.f, seed + L.o, 1);
      const slopeSign = (rR - rL) * 3.0;
      const sunSide = Math.cos(a) * SUN_DIR.x + Math.sin(a) * SUN_DIR.z;
      // faces whose "uphill" points toward the sun get lit, the rest fall into
      // cool shadow; clamp keeps it painterly rather than harsh
      const lit = Math.max(-1, Math.min(1, slopeSign * (sunSide >= 0 ? 1 : -1) + sunSide * 0.5));
      // Snow line at 46% of this layer's tallest crest, fully white by 88%.
      const tn = (y / yMax - 0.46) / 0.42;
      const tall = Math.min(1, Math.max(0, tn * tn * (3 - 2 * tn)));
      _c.copy(base).lerp(snowCap, tall * L.snow);
      // Alpenglow, directional. Before this the warm lerp was driven only by
      // the local crest slope, so warmth was sprinkled evenly around the whole
      // 360 deg ring - which is exactly what a ring of peaks lit by nothing
      // looks like. `sunWash` is 1 facing the sun and 0 opposite it, so the
      // half of the horizon under the sun goes peach and the far half stays
      // cold blue. That split is what sells the time of day.
      const sunWash = Math.max(0, sunSide) ** 1.5;
      if (lit > 0) _c.lerp(warm, lit * 0.30 + sunWash * 0.26 * tall);
      else _c.lerp(shadow, -lit * L.facet * 2.2);
      if (sunWash > 0) _c.lerp(warm, sunWash * 0.14);
      capCol.push(_c.r, _c.g, _c.b, _c.r, _c.g, _c.b);
      _r.copy(base);
      if (lit > 0) _r.multiplyScalar(1 + lit * L.facet); else _r.lerp(shadow, -lit * L.facet * 3.0);
      rockCol.push(_r.r, _r.g, _r.b, _r.r, _r.g, _r.b);
    }
    for (let i = 0; i < L.seg; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aCrest', new THREE.Float32BufferAttribute(crest, 1));
    g.setAttribute('aCap', new THREE.Float32BufferAttribute(capCol, 3));
    g.setAttribute('aRock', new THREE.Float32BufferAttribute(rockCol, 3));
    g.setIndex(idx);
    const ridgeMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      depthWrite: false,
      // Transparent, so the skirt below the silhouette can fade to nothing.
      // Each ring is a curtain of quads running from its crest all the way down
      // to BASE_Y (360 m below the rider) and it was fully opaque, painted in
      // pale haze. Looking downhill you saw that skirt hanging between the
      // peaks and the snow, in per-column bands - the vertical smear that made
      // the whole backdrop look broken. Mountains are silhouettes here; they
      // have no business drawing 300 m of fog-coloured wall.
      transparent: true,
      fog: false,
      uniforms: {
        uHaze: { value: haze },
        uBaseY: { value: BASE_Y },
        uHazeLo: { value: L.hazeLo },
        uHazeHi: { value: L.hazeHi },
        uTint: { value: new THREE.Vector3(L.tint[0], L.tint[1], L.tint[2]) },
        // Absolute world heights where this ring dissolves. Must be world Y,
        // not a fraction of the column - see the fragment shader.
        uCut: { value: new THREE.Vector2(
          BASE_Y + (284 + L.h) * 0.30,
          BASE_Y + (284 + L.h) * 0.52) },
      },
      vertexShader: `
        attribute float aCrest;
        attribute vec3 aCap;
        attribute vec3 aRock;
        varying float vY;
        varying float vCrest;
        varying vec3 vCap;
        varying vec3 vRock;
        void main() {
          vY = position.y;
          vCrest = aCrest;
          vCap = aCap;
          vRock = aRock;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uHaze;
        uniform float uBaseY;
        uniform float uHazeLo;
        uniform float uHazeHi;
        uniform vec3 uTint;
        uniform vec2 uCut;
        varying float vY;
        varying float vCrest;
        varying vec3 vCap;
        varying vec3 vRock;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          // 0 at the buried base, 1 at this column's own crest.
          float t = clamp((vY - uBaseY) / max(vCrest - uBaseY, 1.0), 0.0, 1.0);
          // Rock strata are HORIZONTAL bands, so the break-up noise must be a
          // function of height only. The previous version keyed it to
          // (floor(vCrest/11), floor(vY/9)) - but vCrest is the CREST HEIGHT,
          // which is interpolated *horizontally* across each quad between two
          // neighbouring columns. On a jagged silhouette (f=5.2 ridged noise
          // over a 420 m range) neighbouring columns routinely differ by more
          // than the 11 m bucket, so the hash flipped on nearly every column -
          // regular vertical pinstripes down the whole ring, confirmed by
          // hiding every other layer/mesh in the running scene one at a time.
          // Dropping vCrest from the key and keeping only the height bucket
          // makes the pattern a horizontal band, stable across columns.
          float strat = hash(vec2(floor(vY / 9.0), 0.0)) - 0.5;
          vec3 slope = mix(vRock, vCap, smoothstep(0.58, 0.92, t + strat * 0.05));
          slope *= 1.0 + strat * 0.06 * (1.0 - t);
          // melt into the horizon haze at the bottom
          vec3 col = mix(uHaze, slope, smoothstep(uHazeLo, uHazeHi, t)) * uTint;
          // 1/255-scale dither only, to kill gradient banding without fizz
          col += (hash(gl_FragCoord.xy) - 0.5) * 0.004;
          // Dissolve on WORLD HEIGHT, not on t. Keying the fade to t (the
          // fraction of a column) meant a 470 m peak faded out 200 m higher
          // than the 180 m saddle beside it, so every column ended at its own
          // altitude and the ring bled out as a row of vertical streaks -
          // exactly the "waterfall" look. A world-Y fade is horizontal by
          // construction: one clean valley-fog line across the whole ring.
          float alpha = smoothstep(uCut.x, uCut.y, vY);
          if (alpha < 0.006) discard;
          gl_FragColor = vec4(col, alpha);
          #include <colorspace_fragment>
        }
      `,
    });
    const m = new THREE.Mesh(g, ridgeMat);
    m.frustumCulled = false;
    // Explicit interleaving: ridge i at -910+2i, its mist band at -910+2i+1.
    // All four rings used to share renderOrder -900 with depthWrite off, so the
    // draw order was whatever the traversal happened to produce. The mist has
    // to land BETWEEN two rings or it is not depth cueing, it is a white veil.
    m.renderOrder = -910 + layerIndex * 2;
    group.add(m);

    // Valley cloud sea in front of this ring. This is the piece the backdrop
    // was missing: four silhouettes with nothing between them read as four
    // stickers on one plane, no matter how well each one is shaded. A band of
    // mist at the base of each ring gives the eye an occlusion cue, which is
    // the strongest depth signal there is after parallax.
    // Heights of 110-230 m put the band across the ridge FACES and it rendered
    // as diagonal smears over the peaks. Fog does not climb a mountain: it
    // pools in the valley floor. 34-58 m tall, and the base sits lower for each
    // nearer ring so the bands stack like shelves down the valley.
    const mist = makeMistBand({
      radius: L.r * 0.94,
      // Anchored to the alpha cut (t = 0.52 of the column span, see the ridge
      // fragment shader), not to hazeLo and not to a shared world height. The
      // span is BASE_Y..crest, and crest lands near 24 + L.h, so the span is
      // 284 + L.h. Sitting the band just under the cut hides the dissolve edge.
      baseY: BASE_Y + (284 + L.h) * 0.44,
      height: (284 + L.h) * 0.17,
      seed: 13.7 + layerIndex * 4.1,
      // 0.30-0.51 was opaque enough to read as a white bar painted across the
      // peaks. Depth cueing needs to be felt, not seen: 0.15-0.27.
      opacity: 0.15 + layerIndex * 0.04,
    });
    mist.renderOrder = -910 + layerIndex * 2 + 1;
    group.add(mist);

    layerIndex++;
  }
  scene.add(group);
  return group;
}

// One band of drifting mist, wrapped around the rider on a cylinder. The noise
// domain is a circle in 2D, not the raw uv.x, so there is no seam where the
// cylinder closes - the classic failure of texturing a ring with 1D noise.
function makeMistBand({ radius, baseY, height, seed, opacity }) {
  const g = new THREE.CylinderGeometry(radius, radius, height, 96, 1, true);
  g.translate(0, baseY + height * 0.5, 0);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uWarm: { value: new THREE.Vector3(1.0, 0.94, 0.88) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSeed;
      uniform vec3 uWarm;
      float h21(vec2 p){ p = fract(p*vec2(93.41,271.9)); p += dot(p,p+31.7); return fract(p.x*p.y); }
      float n2(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        float a = h21(i), b = h21(i+vec2(1,0)), c = h21(i+vec2(0,1)), d = h21(i+vec2(1,1));
        return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
      }
      float fbm(vec2 p){
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { s += a * n2(p); p *= 2.07; a *= 0.5; }
        return s;
      }
      void main() {
        float ang = vUv.x * 6.2831853;
        vec2 p = vec2(cos(ang), sin(ang)) * 3.0 + uSeed;
        // 4.4 around a ring whose domain is only 6 units wide gave ~14 blobs of
        // noise across 360 deg, i.e. narrow VERTICAL stripes - it looked like
        // motion-blur smear, not fog. 1.5 gives ~5 wide banks instead. The
        // vertical term is added to p.y only; adding it to both axes shears the
        // noise diagonally, which is where the brush-stroke look came from.
        float n = fbm(vec2(p.x * 1.5 + uTime * 0.010, p.y * 1.5 + vUv.y * 3.0));
        // Soft at both edges, densest low down: fog pools and thins out, it
        // does not fill a rectangle.
        float band = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.30, 0.95, vUv.y));
        float a = smoothstep(0.44, 0.86, n) * band * uOpacity;
        if (a < 0.004) discard;
        vec3 col = mix(vec3(0.88, 0.93, 0.99), uWarm, smoothstep(0.55, 0.95, n));
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  // Self-driven time, so main.js does not need to know this exists.
  m.onBeforeRender = () => { mat.uniforms.uTime.value = performance.now() * 0.001; };
  return m;
}

export function makeLights(scene) {
  const sun = new THREE.DirectionalLight(0xffd49b, 3.45);
  sun.position.copy(SUN_DIR).multiplyScalar(120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 150;
  const d = 42;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.05;
  scene.add(sun);
  scene.add(sun.target);

  // Blue bounce from the sky plus warm bounce off the snow: this is what makes
  // shaded snow read as snow instead of grey plastic.
  const hemi = new THREE.HemisphereLight(0x9fc9ff, 0xb7c9df, 0.92);
  scene.add(hemi);
  return { sun, hemi };
}
