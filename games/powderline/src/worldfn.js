// The mountain, as a pure function of (x, z). No data, no seams, no chunk state.
// Mesh generation and rider physics both read from here, so what you see is what you ride.
//
// Axes: +Z = downhill (distance travelled), Y = up, X = across the fall line.

import { fbm, ridged, vnoise, vnoise1, hash1i, smoothstep, clamp, lerp } from './noise.js';

export const AVG_PITCH = 0.30;          // tan of the average slope ~ 16.7 deg
export const PARK_PERIOD = 760;         // metres between possible park zones

let S = 1337;
export function setSeed(seed) { S = seed | 0; }
export function getSeed() { return S; }

// ---------------------------------------------------------------- centrelines

// Centre of the groomed main run. Low frequency only: it has to be rideable.
export function runCenter(z) {
  return 118 * (vnoise1(z * 0.00085, S + 3) - 0.5)
       + 46 * (vnoise1(z * 0.0031, S + 9) - 0.5);
}

// Lateral offset of the tree-tunnel line relative to the main run.
// Crosses zero naturally, so the tunnel leaves the piste and rejoins it.
export function tunnelOffset(z) {
  return 96 * (vnoise1(z * 0.0021, S + 21) * 2 - 1)
       + 18 * (vnoise1(z * 0.0094, S + 22) * 2 - 1);
}

export function runWidth(z) {
  return 27 + 9 * (vnoise1(z * 0.0043, S + 5) * 2 - 1);
}

// ---------------------------------------------------------------- park zones

// Returns 0..1 park intensity plus the zone's local z, or 0 outside a park.
export function parkAt(z) {
  const seg = Math.floor(z / PARK_PERIOD);
  if (hash1i(seg, S + 71) > 0.5) return 0;
  const zl = z - seg * PARK_PERIOD;
  if (zl < 120 || zl > 620) return 0;
  return smoothstep(120, 160, zl) * (1 - smoothstep(580, 620, zl));
}

function parkLocalZ(z) {
  return z - Math.floor(z / PARK_PERIOD) * PARK_PERIOD;
}

// A kicker: accelerating ramp, sharp lip, lateral falloff.
function kicker(dz, dd, len, wid, hgt) {
  if (dz < 0 || dz > len) return 0;
  const t = dz / len;
  let p = t * t * (0.75 + 0.25 * t);
  if (t > 0.9) p *= 1 + (t - 0.9) * 3.5;          // lip pops up
  const lat = 1 - smoothstep(wid * 0.55, wid, Math.abs(dd));
  return hgt * p * lat;
}

// A flat-topped box you can ride (rails sit on these).
function box(dz, dd, len, wid, hgt) {
  if (dz < -2 || dz > len + 2) return 0;
  const along = smoothstep(-2, 3, dz) * (1 - smoothstep(len - 3, len + 2, dz));
  const across = 1 - smoothstep(wid * 0.6, wid, Math.abs(dd));
  return hgt * along * across;
}

// ---------------------------------------------------------------- the surface

// out fields: h, groom, tunnel, park, ice, powder, rail, bank
const _out = {
  h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
};

export function sample(x, z, out = _out) {
  const cx = runCenter(z);
  const d = x - cx;                     // signed distance from the run centre
  const w = runWidth(z);
  const ad = Math.abs(d);

  // ---- base mountain shape
  let base = -z * AVG_PITCH;
  base += 30 * fbm(x * 0.0013, z * 0.0013, S + 1, 3);
  base += 11 * (vnoise1(z * 0.0007, S + 17) - 0.5) * 2;   // benches and steep pitches

  // ---- off-piste: powder pillows, rock spines, gullies
  const pillow = 2.9 * fbm(x * 0.019, z * 0.019, S + 41, 3)
               + 1.15 * fbm(x * 0.075, z * 0.075, S + 43, 2);
  const spineMask = smoothstep(w + 22, w + 90, ad);
  const spine = 13 * Math.pow(ridged(x * 0.0055, z * 0.0055, S + 51, 3), 2) * spineMask;
  let rough = base + pillow + spine;

  // Soft canyon walls: the mountain funnels you back instead of fencing you in.
  const wall = smoothstep(150, 330, ad);
  rough += wall * wall * 95;

  // ---- groomed corridor
  const parkAmt = parkAt(z);
  const groomW = w * (1 + 0.45 * parkAmt);
  let groom = 1 - smoothstep(groomW * 0.78, groomW * 1.3, ad);

  let smoothH = base
    + 1.5 * fbm(x * 0.005, z * 0.005, S + 61, 2)        // long rollers
    + 0.35 * fbm(x * 0.04, z * 0.04, S + 63, 2);         // corduroy-scale chatter

  // Stray bumps and ledges on the piste: free airtime if you look for it.
  const bumpN = fbm(x * 0.031, z * 0.031, S + 67, 2);
  if (bumpN > 0.35) smoothH += 1.9 * Math.pow((bumpN - 0.35) / 0.65, 1.6);

  // ---- tree tunnel: narrow cut line, steeper, with natural lips
  const toff = tunnelOffset(z);
  const dt = x - (cx + toff);
  const tw = 7.2 + 2.2 * (vnoise1(z * 0.011, S + 23) * 2 - 1);
  let tunnel = 1 - smoothstep(tw * 0.7, tw * 1.35, Math.abs(dt));
  // the tunnel only exists once it has actually left the piste
  tunnel *= smoothstep(14, 34, Math.abs(toff));

  let tunnelH = base
    + 0.9 * fbm(x * 0.03, z * 0.03, S + 71, 2)
    - 1.1;                                              // cut slightly into the slope
  // little kickers every ~55 m along the tunnel
  const tk = z - Math.floor(z / 55) * 55;
  tunnelH += kicker(tk - 40, dt, 9, tw * 0.9, 1.5);

  // ---- combine surfaces (tunnel wins where it exists)
  let h = lerp(rough, smoothH, groom);
  h = lerp(h, tunnelH, tunnel);

  // ---- park features carved straight into the field, so collision is free
  let rail = 0, bank = 0;
  if (parkAmt > 0.01) {
    const zl = parkLocalZ(z);
    const lane = groomW * 0.42;
    // three kickers of growing size, staggered across the lanes
    h += parkAmt * kicker(zl - 190, d + lane * 0.9, 15, 8, 2.2);
    h += parkAmt * kicker(zl - 300, d, 19, 10, 3.4);
    h += parkAmt * kicker(zl - 430, d - lane * 0.9, 23, 11, 4.6);
    // two boxes with rails
    const b1 = box(zl - 210, d - lane, 24, 1.6, 1.0);
    const b2 = box(zl - 470, d + lane * 0.55, 30, 1.3, 1.35);
    h += parkAmt * (b1 + b2);
    rail = clamp((b1 / 1.0) * 1.2 + (b2 / 1.35) * 1.2, 0, 1);
    // quarterpipe walls at the edges of the park: banked turns you can pump
    bank = parkAmt * smoothstep(groomW * 0.82, groomW * 1.5, ad);
    h += bank * bank * 13;
    groom = Math.max(groom, parkAmt * (1 - smoothstep(groomW * 1.5, groomW * 1.9, ad)));
  }

  // ---- ice: wind-scoured, mostly on the fast groomed pitches
  const iceN = fbm(x * 0.0105, z * 0.0105, S + 91, 3) * 0.5 + 0.5;
  const ice = smoothstep(0.60, 0.74, iceN) * (0.35 + 0.65 * Math.max(groom, tunnel));

  out.h = h;
  out.groom = groom;
  out.tunnel = tunnel;
  out.park = parkAmt;
  out.ice = ice;
  out.rail = rail;
  out.bank = bank;
  // how deep the loose snow is: max off-piste, none on ice or corduroy
  out.powder = clamp((1 - Math.max(groom, tunnel * 0.85)) * (1 - ice * 0.8), 0, 1);
  out.dist = d;
  return out;
}

export function height(x, z) {
  return sample(x, z, _out).h;
}

// Analytic normal by central differences. eps chosen to match the fine LOD.
const _n = { x: 0, y: 1, z: 0 };
export function normal(x, z, eps = 0.6) {
  const hL = height(x - eps, z), hR = height(x + eps, z);
  const hD = height(x, z - eps), hU = height(x, z + eps);
  let nx = (hL - hR) / (2 * eps);
  let nz = (hD - hU) / (2 * eps);
  const len = Math.hypot(nx, 1, nz);
  _n.x = nx / len; _n.y = 1 / len; _n.z = nz / len;
  return _n;
}

// Trees stay off the piste, out of the tunnel, off the rocks and off the walls.
export function treeDensity(x, z, s) {
  const su = s || sample(x, z, _out);
  if (su.groom > 0.12 || su.tunnel > 0.1) return 0;
  const ad = Math.abs(su.dist);
  if (ad > 300) return 0;
  const forest = fbm(x * 0.0042, z * 0.0042, S + 111, 2) * 0.5 + 0.5;
  // Treeline thins out high on the shoulders, thickens right beside the paths.
  const edge = smoothstep(0, 26, ad) * (1 - smoothstep(210, 300, ad));
  return clamp(forest * 1.35 - 0.35, 0, 1) * edge;
}

export function spawnPoint() {
  const z = 0, x = runCenter(0);
  return { x, y: height(x, z) + 0.6, z };
}
