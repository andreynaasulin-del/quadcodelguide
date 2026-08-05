import * as THREE from 'three';

function textureFromPixels(size, fill, colorSpace = THREE.NoColorSpace) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) fill(data, (y * size + x) * 4, x, y, size);
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function hash(x, y, seed = 0) {
  let n = Math.imul(x + seed * 1013, 374761393) ^ Math.imul(y - seed * 733, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function height(x, y, size, seed, scales) {
  let value = 0;
  let weight = 0;
  for (const [step, amplitude] of scales) {
    const gx = Math.floor(x / step), gy = Math.floor(y / step);
    value += hash(gx, gy, seed) * amplitude;
    weight += amplitude;
  }
  return value / weight;
}

function normalTexture(size, seed, strength, scales) {
  return textureFromPixels(size, (data, i, x, y, s) => {
    const xm = (x - 1 + s) % s, xp = (x + 1) % s;
    const ym = (y - 1 + s) % s, yp = (y + 1) % s;
    const dx = (height(xm, y, s, seed, scales) - height(xp, y, s, seed, scales)) * strength;
    const dy = (height(x, ym, s, seed, scales) - height(x, yp, s, seed, scales)) * strength;
    const inv = 1 / Math.hypot(dx, dy, 1);
    data[i] = (dx * inv * 0.5 + 0.5) * 255;
    data[i + 1] = (dy * inv * 0.5 + 0.5) * 255;
    data[i + 2] = (inv * 0.5 + 0.5) * 255;
    data[i + 3] = 255;
  });
}

function roughnessTexture(size, seed, low, high, direction = 0) {
  return textureFromPixels(size, (data, i, x, y) => {
    const grain = hash(x, y, seed);
    const streak = direction ? Math.sin((direction === 1 ? x : y) * 0.42) * 0.08 : 0;
    const v = THREE.MathUtils.clamp(low + (high - low) * grain + streak, 0, 1) * 255;
    data[i] = data[i + 1] = data[i + 2] = v;
    data[i + 3] = 255;
  });
}

let cache;
export function getGeneratedTextures() {
  if (cache) return cache;
  cache = {
    snowNormal: normalTexture(256, 17, 2.2, [[3, 0.34], [9, 0.34], [31, 0.32]]),
    snowRoughness: roughnessTexture(256, 31, 0.68, 0.98, 1),
    barkNormal: normalTexture(128, 43, 3.4, [[3, 0.35], [7, 0.35], [29, 0.3]]),
    barkRoughness: roughnessTexture(128, 47, 0.64, 0.94, 2),
    rockNormal: normalTexture(192, 59, 4.1, [[5, 0.42], [19, 0.36], [53, 0.22]]),
    rockRoughness: roughnessTexture(192, 61, 0.52, 0.93),
    fabricNormal: normalTexture(128, 71, 1.45, [[2, 0.55], [7, 0.45]]),
    fabricRoughness: roughnessTexture(128, 73, 0.62, 0.88),
  };
  return cache;
}

export function setTextureRepeat(texture, x, y = x) {
  texture.repeat.set(x, y);
  return texture;
}
