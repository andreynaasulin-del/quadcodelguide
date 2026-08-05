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
    { r: 2450, h: 470, col: 0x9db6cf, seg: 280, o: 0,  snow: 0.80, hazeLo: 0.52, hazeHi: 0.94, facet: 0.10, f: 9.0, tf: 43, tint: [1.00, 1.00, 1.00] },
    { r: 1700, h: 400, col: 0x7695b8, seg: 240, o: 51, snow: 0.72, hazeLo: 0.30, hazeHi: 0.72, facet: 0.14, f: 7.0, tf: 31, tint: [0.90, 0.93, 0.97] },
    // Near layer is TALLER than the far one (420 vs 470 at 2.1x closer range,
    // so it subtends far more sky) and keeps strong snow caps — at h=300 and
    // snow=0.62 it rendered as a low dark bruise sitting behind the bright far
    // peaks, which reads as inverted perspective.
    { r: 1150, h: 420, col: 0x5d7ea6, seg: 200, o: 97, snow: 0.74, hazeLo: 0.20, hazeHi: 0.48, facet: 0.14, f: 5.2, tf: 23, tint: [0.88, 0.91, 0.96] },
  ];
  const BASE_Y = -260;
  for (const L of layers) {
    const pos = [];
    const crest = [];
    const capCol = [];
    const rockCol = [];
    const idx = [];
    const base = new THREE.Color(L.col);
    const snowCap = new THREE.Color(0xf4f9ff);
    const warm = new THREE.Color(0xffd9b0);      // faint alpenglow on sun-facing caps
    const shadow = new THREE.Color(0x3d5878);    // cool shadow side of a facet
    const _c = new THREE.Color();
    const _r = new THREE.Color();
    // Pass 1: crest heights, so pass 2 can shade each column by its slope.
    const ys = [];
    for (let i = 0; i <= L.seg; i++) {
      const a = (i / L.seg) * Math.PI * 2;
      const baseRid = ridged(Math.cos(a) * L.f, Math.sin(a) * L.f, seed + L.o, 4);
      const teeth = Math.pow(Math.abs(Math.sin(a * L.tf + vnoise1(i * 0.17, seed + L.o) * 5)), 5);
      const rid = Math.pow(baseRid, 1.45) + teeth * (0.10 + baseRid * 0.22);
      ys.push(28 + rid * L.h + vnoise1(i * 0.31, seed + L.o) * 34);
    }
    for (let i = 0; i <= L.seg; i++) {
      const a = (i / L.seg) * Math.PI * 2;
      const x = Math.cos(a) * L.r;
      const z = Math.sin(a) * L.r;
      const y = ys[i];
      pos.push(x, BASE_Y, z, x, y, z);
      crest.push(y, y);
      // Facet shading: the crest slope decides whether this column faces the
      // sun or hides from it. This is what turns a flat band into a mountain.
      const yl = ys[Math.max(0, i - 1)], yr = ys[Math.min(L.seg, i + 1)];
      const slopeSign = (yr - yl) / Math.max(L.h * 0.08, 1);
      const sunSide = Math.cos(a) * SUN_DIR.x + Math.sin(a) * SUN_DIR.z;
      // faces whose "uphill" points toward the sun get lit, the rest fall into
      // cool shadow; clamp keeps it painterly rather than harsh
      const lit = Math.max(-1, Math.min(1, slopeSign * (sunSide >= 0 ? 1 : -1) + sunSide * 0.5));
      const tall = Math.min(1, Math.max(0, (y / L.h - 0.32) / 0.4));
      _c.copy(base).lerp(snowCap, tall * L.snow);
      if (lit > 0) _c.lerp(warm, lit * 0.22); else _c.lerp(shadow, -lit * L.facet * 2.2);
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
      fog: false,
      uniforms: {
        uHaze: { value: haze },
        uBaseY: { value: BASE_Y },
        uHazeLo: { value: L.hazeLo },
        uHazeHi: { value: L.hazeHi },
        uTint: { value: new THREE.Vector3(L.tint[0], L.tint[1], L.tint[2]) },
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
        varying float vY;
        varying float vCrest;
        varying vec3 vCap;
        varying vec3 vRock;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          // 0 at the buried base, 1 at this column's own crest.
          float t = clamp((vY - uBaseY) / max(vCrest - uBaseY, 1.0), 0.0, 1.0);
          // Rock body, snow cap on the top band. The break-up noise is keyed to
          // (column crest, 9m height bands) — NOT to gl_FragCoord. A screen-space
          // hash at +-0.045 fed into the cap threshold covered half the screen
          // on the near layer and read as JPEG mush, and it swam whenever the
          // camera moved. World-keyed bands are stable and look like strata.
          float strat = hash(vec2(vCrest * 0.37, floor(vY / 9.0))) - 0.5;
          vec3 slope = mix(vRock, vCap, smoothstep(0.58, 0.92, t + strat * 0.05));
          slope *= 1.0 + strat * 0.06 * (1.0 - t);
          // melt into the horizon haze at the bottom
          vec3 col = mix(uHaze, slope, smoothstep(uHazeLo, uHazeHi, t)) * uTint;
          // 1/255-scale dither only, to kill gradient banding without fizz
          col += (hash(gl_FragCoord.xy) - 0.5) * 0.004;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }
      `,
    });
    const m = new THREE.Mesh(g, ridgeMat);
    m.frustumCulled = false;
    m.renderOrder = -900;
    group.add(m);
  }
  scene.add(group);
  return group;
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
