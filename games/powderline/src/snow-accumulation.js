import * as THREE from 'three';

// Rider-local R8 clipmap. Dark texels are compressed snow; untouched snow is
// white. The map follows the rider in world space and recovers incrementally.
export class SnowAccumulation {
  constructor(size = 256, worldSize = 64) {
    this.size = size;
    this.worldSize = worldSize;
    this.data = new Uint8Array(size * size).fill(255);
    this.texture = new THREE.DataTexture(this.data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.minFilter = this.texture.magFilter = THREE.LinearFilter;
    this.texture.needsUpdate = true;
    this.center = new THREE.Vector2();
    this.lastStamp = new THREE.Vector2(1e9, 1e9);
    this.recoveryCursor = 0;
    this.quality = 1;
    this.dirty = false;
  }

  setQuality(q) { this.quality = q; }

  update(rider, dt) {
    const dx = rider.pos.x - this.center.x;
    const dz = rider.pos.z - this.center.y;
    if (Math.abs(dx) > this.worldSize * 0.18 || Math.abs(dz) > this.worldSize * 0.18) {
      this.center.set(rider.pos.x, rider.pos.z);
      this.data.fill(255);
      this.lastStamp.set(1e9, 1e9);
      this.dirty = true;
    }

    const moved = this.lastStamp.distanceToSquared(_xz.set(rider.pos.x, rider.pos.z));
    if (rider.grounded && moved > 0.055) {
      this.stamp(rider.pos.x, rider.pos.z, rider.surf.powder > 0.3 ? 0.46 : 0.30);
      this.lastStamp.copy(_xz);
    }

    const count = this.quality > 0.6 ? 850 : 420;
    const gain = Math.max(1, Math.round(dt * 120));
    for (let i = 0; i < count; i++) {
      const k = this.recoveryCursor++ % this.data.length;
      if (this.data[k] < 255) {
        this.data[k] = Math.min(255, this.data[k] + gain);
        this.dirty = true;
      }
    }
    if (this.dirty) { this.texture.needsUpdate = true; this.dirty = false; }
  }

  stamp(x, z, strength) {
    const u = (x - this.center.x) / this.worldSize + 0.5;
    const v = (z - this.center.y) / this.worldSize + 0.5;
    const cx = Math.floor(u * this.size), cy = Math.floor(v * this.size);
    const radius = this.quality > 0.45 ? 3 : 2;
    for (let oy = -radius; oy <= radius; oy++) {
      for (let ox = -radius; ox <= radius; ox++) {
        const px = cx + ox, py = cy + oy;
        if (px < 0 || py < 0 || px >= this.size || py >= this.size) continue;
        const falloff = Math.max(0, 1 - Math.hypot(ox, oy) / (radius + 0.5));
        const k = py * this.size + px;
        this.data[k] = Math.max(34, this.data[k] - strength * falloff * 128);
      }
    }
    this.dirty = true;
  }

  bind(material) {
    material.userData.snowAccumulation = this;
    material.needsUpdate = true;
  }
}

const _xz = new THREE.Vector2();
