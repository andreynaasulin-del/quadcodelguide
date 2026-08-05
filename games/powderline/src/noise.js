// Deterministic, allocation-free noise. Everything in the world derives from this.
// No textures, no data files: hash -> value noise -> fbm.

const F = 1 / 4294967296;

export function hash2i(x, y, seed) {
  let h = (x * 374761393) ^ (y * 668265263) ^ (seed * 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) * F; // 0..1
}

export function hash1i(x, seed) {
  let h = (x * 2654435761) ^ (seed * 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) * F;
}

function fade(t) {
  return t * t * (3 - 2 * t);
}

// Smooth value noise, period 1 unit.
export function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = fade(xf), v = fade(yf);
  const a = hash2i(xi, yi, seed);
  const b = hash2i(xi + 1, yi, seed);
  const c = hash2i(xi, yi + 1, seed);
  const d = hash2i(xi + 1, yi + 1, seed);
  const ab = a + (b - a) * u;
  const cd = c + (d - c) * u;
  return ab + (cd - ab) * v; // 0..1
}

// 1D smooth noise for centrelines.
export function vnoise1(x, seed) {
  const xi = Math.floor(x);
  const u = fade(x - xi);
  const a = hash1i(xi, seed);
  const b = hash1i(xi + 1, seed);
  return a + (b - a) * u;
}

// fbm with rotation between octaves to kill axis-aligned artefacts.
const COS = Math.cos(0.7), SIN = Math.sin(0.7);
export function fbm(x, y, seed, octaves, lacunarity = 2.03, gain = 0.5) {
  let amp = 1, sum = 0, norm = 0, px = x, py = y;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (vnoise(px, py, seed + i * 131) * 2 - 1);
    norm += amp;
    amp *= gain;
    const nx = px * COS - py * SIN;
    const ny = px * SIN + py * COS;
    px = nx * lacunarity;
    py = ny * lacunarity;
  }
  return sum / norm; // -1..1
}

// Ridged fbm: sharp crests, good for rock spines and distant peaks.
export function ridged(x, y, seed, octaves) {
  let amp = 1, sum = 0, norm = 0, px = x, py = y;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(vnoise(px, py, seed + i * 977) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= 0.5;
    px *= 2.07;
    py *= 2.03;
  }
  return sum / norm; // 0..1
}

export function smoothstep(a, b, t) {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Seeded PRNG for one-off scatter decisions.
export function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) * F;
  };
}
