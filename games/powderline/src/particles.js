// Snow spray, powder plumes, impact bursts, diamond dust - and the trench the
// board leaves behind. One Points draw call for all sparks, one triangle strip
// for the trail. Both are fixed-size pools: no allocation while riding.

import * as THREE from 'three';
import { height } from './worldfn.js';
import { clamp } from './noise.js';

const MAX = 2200;
const GRAV = 9.0;

export class Particles {
  constructor(scene) {
    this.n = MAX;
    this.pos = new Float32Array(MAX * 3);
    this.vel = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);      // remaining, seconds
    this.max = new Float32Array(MAX);
    this.size = new Float32Array(MAX);
    this.tint = new Float32Array(MAX);      // 0 = snow white, 1 = warm sparkle
    this.head = 0;

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aLife', new THREE.BufferAttribute(new Float32Array(MAX), 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(this.tint, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.geo = g;

    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: { uPix: { value: 1 } },
      vertexShader: `
        attribute float aLife;
        attribute float aSize;
        attribute float aTint;
        varying float vLife;
        varying float vTint;
        uniform float uPix;
        void main() {
          vLife = aLife;
          vTint = aTint;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float grow = mix(0.55, 1.0, 1.0 - aLife);   // puffs expand as they die
          gl_PointSize = aSize * grow * uPix * 300.0 / max(-mv.z, 1.0);
          if (aLife <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }
      `,
      fragmentShader: `
        varying float vLife;
        varying float vTint;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float r = dot(d, d);
          if (r > 0.25) discard;
          float soft = 1.0 - smoothstep(0.05, 0.25, r);
          vec3 col = mix(vec3(0.98, 0.99, 1.0), vec3(1.0, 0.93, 0.76), vTint);
          float a = soft * clamp(vLife, 0.0, 1.0) * 0.9;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  spawn(x, y, z, vx, vy, vz, life, size, tint = 0) {
    const i = this.head;
    this.head = (this.head + 1) % MAX;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.max[i] = life;
    this.size[i] = size; this.tint[i] = tint;
  }

  // Rooster tail off the edge: fast, flat, biased to the uphill side.
  spray(rider, amount, powder) {
    const count = 1 + (Math.random() < amount * 2.2 ? 2 : 0);
    const side = -Math.sign(rider.edge || 1);
    for (let k = 0; k < count; k++) {
      const s = rider.speed;
      const rx = rider.right.x * side, ry = rider.right.y * side, rz = rider.right.z * side;
      const j = () => (Math.random() - 0.5);
      this.spawn(
        rider.pos.x + j() * 0.5, rider.pos.y + 0.05, rider.pos.z + j() * 0.5,
        rx * (2 + s * 0.22) + rider.vel.x * 0.28 + j() * 1.8,
        1.6 + Math.random() * 2.6 + s * 0.05,
        rz * (2 + s * 0.22) + rider.vel.z * 0.28 + j() * 1.8,
        0.45 + Math.random() * 0.55,
        0.09 + powder * 0.16 + Math.random() * 0.05
      );
    }
  }

  // Riding deep snow: a wide low cloud that hangs behind you.
  plume(rider, powder, v) {
    if (Math.random() > powder * 0.9) return;
    const j = () => (Math.random() - 0.5);
    this.spawn(
      rider.pos.x + j() * 1.1, rider.pos.y + 0.1, rider.pos.z + j() * 1.1,
      -rider.vel.x * 0.16 + j() * 2.2, 1.2 + Math.random() * 2.4 + v * 0.035, -rider.vel.z * 0.16 + j() * 2.2,
      0.7 + Math.random() * 0.7,
      0.20 + powder * 0.3 + Math.random() * 0.1
    );
    // Fine crystals stay low and create a dense wake at speed without another draw call.
    if (v > 14 && Math.random() < 0.65) this.spawn(
      rider.pos.x + j() * 0.55, rider.pos.y + 0.03, rider.pos.z + j() * 0.55,
      -rider.vel.x * 0.24 + j(), 0.35 + Math.random() * 0.8, -rider.vel.z * 0.24 + j(),
      0.9 + Math.random() * 0.8, 0.08 + Math.random() * 0.08
    );
  }

  burst(x, y, z, power, tint = 0) {
    const n = clamp(10 + power * 26, 8, 90) | 0;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const sp = (0.6 + Math.random() * 1.4) * (2 + power * 3.2);
      this.spawn(
        x, y + 0.15, z,
        Math.cos(a) * sp, 1.5 + Math.random() * 4.5, Math.sin(a) * sp,
        0.6 + Math.random() * 0.9,
        0.13 + Math.random() * 0.18,
        tint
      );
    }
  }

  // Sunlit glitter, only while airborne: makes airtime feel weightless.
  glitter(rider) {
    if (Math.random() > 0.5) return;
    const j = () => (Math.random() - 0.5);
    this.spawn(
      rider.pos.x + j() * 2.2, rider.pos.y + 0.6 + j(), rider.pos.z + j() * 2.2,
      j() * 0.6, 0.4 + Math.random() * 0.5, j() * 0.6,
      0.55, 0.055 + Math.random() * 0.04, 1
    );
  }

  update(dt) {
    const lifeAttr = this.geo.attributes.aLife.array;
    const p = this.pos, v = this.vel;
    for (let i = 0; i < MAX; i++) {
      let l = this.life[i];
      if (l <= 0) { lifeAttr[i] = 0; continue; }
      l -= dt;
      this.life[i] = l;
      if (l <= 0) { lifeAttr[i] = 0; continue; }
      const i3 = i * 3;
      v[i3 + 1] -= GRAV * dt * 0.35;
      const drag = 1 - 2.4 * dt;
      v[i3] *= drag; v[i3 + 1] *= drag; v[i3 + 2] *= drag;
      p[i3] += v[i3] * dt;
      p[i3 + 1] += v[i3 + 1] * dt;
      p[i3 + 2] += v[i3 + 2] * dt;
      lifeAttr[i] = l / this.max[i];
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aLife.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.aTint.needsUpdate = true;
  }

  setPixelRatio(r) { this.mat.uniforms.uPix.value = r; }
}

// ------------------------------------------------------------------ the trench

// A ribbon of quads laid down under the board. It is the single strongest
// "I did that" signal in the game: your own line, visible behind you.
export class CarveTrail {
  constructor(scene, segments = 190) {
    this.seg = segments;
    this.i = 0;
    this.count = 0;
    this.lastX = 0; this.lastZ = 0;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(segments * 2 * 3);
    this.age = new Float32Array(segments * 2);
    this.dep = new Float32Array(segments * 2);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aAge', new THREE.BufferAttribute(this.age, 1));
    g.setAttribute('aDepth', new THREE.BufferAttribute(this.dep, 1));
    const idx = [];
    for (let s = 0; s < segments - 1; s++) {
      const a = s * 2, b = a + 1, c = a + 2, d = a + 3;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      uniforms: { uNow: { value: 0 } },
      vertexShader: `
        attribute float aAge;
        attribute float aDepth;
        varying float vFade;
        varying float vDepth;
        uniform float uNow;
        void main() {
          vFade = clamp(1.0 - (uNow - aAge) / 14.0, 0.0, 1.0);
          vDepth = aDepth;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vFade;
        varying float vDepth;
        void main() {
          if (vFade <= 0.001) discard;
          // A trench reads as a soft blue shadow with a bright pushed-up rim.
          vec3 shade = vec3(0.62, 0.72, 0.86);
          float a = vFade * (0.30 + 0.45 * vDepth);
          gl_FragColor = vec4(shade, a);
        }
      `,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    scene.add(this.mesh);
    this.reset = true;
  }

  push(rider, now) {
    if (!rider.grounded) { this.reset = true; return; }
    const dx = rider.pos.x - this.lastX, dz = rider.pos.z - this.lastZ;
    if (!this.reset && dx * dx + dz * dz < 0.45) return;
    this.lastX = rider.pos.x; this.lastZ = rider.pos.z;

    const w = 0.14 + Math.abs(rider.edge) * 0.20 + rider.scrub * 0.55;
    const depth = clamp(Math.abs(rider.edge) * 0.7 + rider.scrub * 0.9, 0, 1)
                * clamp(0.35 + rider.surf.powder, 0, 1);
    const rx = rider.right.x, rz = rider.right.z;
    const s = this.i;
    for (const side of [-1, 1]) {
      const k = (s * 2 + (side > 0 ? 1 : 0));
      const x = rider.pos.x + rx * w * side;
      const z = rider.pos.z + rz * w * side;
      this.pos[k * 3] = x;
      this.pos[k * 3 + 1] = height(x, z) + 0.045;
      this.pos[k * 3 + 2] = z;
      this.age[k] = this.reset ? -100 : now;   // a reset segment is born dead
      this.dep[k] = depth;
    }
    this.reset = false;
    this.i = (this.i + 1) % this.seg;
    // Break the strip at the write head so the ribbon does not wrap around.
    const nk = (this.i * 2);
    this.age[nk] = -100; this.age[nk + 1] = -100;
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aAge.needsUpdate = true;
    this.geo.attributes.aDepth.needsUpdate = true;
  }

  update(now) { this.mat.uniforms.uNow.value = now; }
}
