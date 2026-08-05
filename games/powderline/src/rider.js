// Rider physics and the rider's body, both generated in code.
//
// The feel, in one paragraph: velocity is integrated in full 3D and constrained
// to the heightfield, so convex rolls launch you for free. On the ground the
// board has an edge; if lateral speed exceeds the edge's grip you wash out,
// lose speed and lose flow. If the edge holds while you are actually turning,
// you gain thrust - that is the "pump". Flow raises your speed ceiling, and the
// ceiling is the only progression in the game. Mistakes cost stability, which
// regrows; only an empty stability bar is a wipeout.

import * as THREE from 'three';
import { sample, normal, spawnPoint } from './worldfn.js';
import { clamp, lerp, smoothstep } from './noise.js';
import { getGeneratedTextures, setTextureRepeat } from './generated-textures.js';

const G = 22.0;                 // heavier than real gravity: arcade snap
const BOARD_LIFT = 0.10;
const MAX_LEAN = 0.95;          // radians of body roll at full edge

export const STATE = { RIDE: 0, WIPE: 1 };

export class Rider {
  constructor(palette) {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.right = new THREE.Vector3(1, 0, 0);
    this.yaw = 0;
    this.edge = 0;
    this.edgeTarget = 0;
    this.grounded = true;
    this.airTime = 0;
    this.lastAirTime = 0;
    this.spin = 0;
    this.spinDir = 0;
    this.flip = 0;
    this.boostAir = false;      // true after a kicker launch: faster rotations
    this.boosting = false;      // Shift held on the ground
    this.kickerCooldown = 0;
    this.flow = 0;
    this.stability = 1;
    this.state = STATE.RIDE;
    this.wipeTimer = 0;
    this.dist = 0;
    this.best = 0;
    this.speed = 0;
    this.carveQuality = 0;
    this.scrub = 0;
    this.crouch = 0;
    this.ollieCharge = 0;
    this.surf = {
      h: 0, groom: 0, tunnel: 0, park: 0, ice: 0, powder: 0, rail: 0, bank: 0, dist: 0,
    };
    this.events = [];               // consumed by audio / particles / hud
    this.mesh = makeRiderMesh(palette);
    this.tumble = new THREE.Euler();
    this.respawn();
  }

  respawn() {
    const s = spawnPoint();
    this.pos.set(s.x, s.y + 0.4, s.z);
    this.vel.set(0, 0, 6);
    this.yaw = 0;
    this.edge = this.edgeTarget = 0;
    this.flow = 0;
    this.stability = 1;
    this.state = STATE.RIDE;
    this.wipeTimer = 0;
    this.dist = 0;
    this.grounded = true;
    this.airTime = 0;
    this.spin = 0;
    this.spinDir = 0;
    this.flip = 0;
    this.boostAir = false;
    this.kickerCooldown = 0;
    this.tumble.set(0, 0, 0);
  }

  get speedCap() { return (14 + 34 * this.flow) * (this.boosting ? 1.35 : 1); }

  emit(type, a = 0, b = 0) { this.events.push({ type, a, b }); }

  update(dt, input, hazards) {
    if (this.state === STATE.WIPE) {
      this.updateWipe(dt);
      return;
    }

    const surf = sample(this.pos.x, this.pos.z, this.surf);
    const n = normal(this.pos.x, this.pos.z, 0.7);
    const groundY = surf.h + BOARD_LIFT;
    const nx = n.x, ny = n.y, nz = n.z;

    // ---- edge input, deliberately slow: perfect movement is slow movement
    const steer = input.steer;
    this.boosting = !!input.boost && this.grounded;
    const deep = Math.abs(steer) > 0.9 ? 1.25 : 1.0;   // full stick commits the edge
    this.edgeTarget = clamp(steer * deep, -1.35, 1.35);
    const edgeRate = this.grounded ? 3.4 : 6.0;
    const prevEdge = this.edge;
    this.edge += clamp(this.edgeTarget - this.edge, -edgeRate * dt, edgeRate * dt);
    const edgeJerk = Math.abs(this.edge - prevEdge) / Math.max(dt, 1e-4);

    // ---- crouch / ollie charge
    if (input.ollie && this.grounded) {
      this.ollieCharge = Math.min(1, this.ollieCharge + dt * 2.8);
    }
    this.crouch = lerp(this.crouch, this.ollieCharge * 0.9 + (input.tuck ? 0.35 : 0), 1 - Math.exp(-12 * dt));

    // ---- gravity, always
    this.vel.y -= G * dt;

    if (this.grounded) {
      this.groundStep(dt, input, surf, nx, ny, nz, edgeJerk);
      if (!input.ollie && this.ollieCharge > 0.05) {
        const pop = 4.0 + 4.6 * this.ollieCharge + 2.2 * this.flow;
        this.vel.x += nx * pop; this.vel.y += ny * pop; this.vel.z += nz * pop;
        this.emit('pop', this.ollieCharge);
        this.ollieCharge = 0;
        this.grounded = false;
      } else if (!input.ollie) {
        this.ollieCharge = 0;
      }
    } else {
      this.airStep(dt, input);
    }

    // ---- integrate
    this.pos.addScaledVector(this.vel, dt);

    // ---- ground constraint
    const s2 = sample(this.pos.x, this.pos.z, this.surf);
    const gy2 = s2.h + BOARD_LIFT;
    if (this.pos.y <= gy2) {
      const n2 = normal(this.pos.x, this.pos.z, 0.7);
      const vn = this.vel.x * n2.x + this.vel.y * n2.y + this.vel.z * n2.z;
      if (!this.grounded) this.land(-vn, n2, s2);
      this.pos.y = gy2;
      this.vel.x -= n2.x * vn; this.vel.y -= n2.y * vn; this.vel.z -= n2.z * vn;
      this.grounded = true;
    } else if (this.pos.y > gy2 + 0.16) {
      if (this.grounded) { this.lastAirTime = 0; this.spin = 0; this.flip = 0; }
      this.grounded = false;
      this.airTime += dt;
    }

    // ---- hazards: trees, rocks and fallen logs
    if (hazards) this.checkHazards(dt, hazards);

    // ---- kickers: hit one grounded with speed and it throws you
    this.kickerCooldown = Math.max(0, this.kickerCooldown - dt);
    if (hazards && hazards.queryKicker && this.grounded && this.kickerCooldown <= 0) {
      const k = hazards.queryKicker(this.pos.x, this.pos.z);
      const vh = Math.hypot(this.vel.x, this.vel.z);
      if (k && vh > 9) {
        // Launch strength scales with entry speed AND the kicker's size:
        // small side hits are pop, the big ones are proper airtime.
        const size = k.size || 1;
        this.vel.y = Math.max(this.vel.y, (3.2 + vh * 0.42) * (0.62 + 0.42 * size));
        this.pos.y += 0.45 * size;
        this.grounded = false;
        this.boostAir = true;
        this.lastAirTime = 0;
        this.spin = 0;
        this.flip = 0;
        this.kickerCooldown = 1.5;
        this.emit('kicker', vh);
      }
    }

    // ---- bookkeeping
    this.speed = Math.hypot(this.vel.x, this.vel.y, this.vel.z);
    this.dist = Math.max(this.dist, this.pos.z);
    this.best = Math.max(this.best, this.dist);
    this.stability = clamp(this.stability + (this.grounded ? 0.3 : 0.12) * dt * (1 - this.scrub * 0.7), 0, 1);
    if (this.stability <= 0.001) this.startWipe();

    this.updateBasis(dt);
  }

  groundStep(dt, input, surf, nx, ny, nz, edgeJerk) {
    // Tangent basis from heading and surface normal.
    let fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const fdotn = fx * nx + fz * nz;
    let fy = -fdotn;                                   // project heading onto the plane
    let fl = Math.hypot(fx, fy, fz);
    fx /= fl; fy /= fl; fz /= fl;
    // right = up x forward
    let rx = ny * fz - nz * fy;
    let ry = nz * fx - nx * fz;
    let rz = nx * fy - ny * fx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl; ry /= rl; rz /= rl;

    const vF = this.vel.x * fx + this.vel.y * fy + this.vel.z * fz;
    const vR = this.vel.x * rx + this.vel.y * ry + this.vel.z * rz;
    const absEdge = Math.abs(this.edge);

    // remove any velocity that left the plane (we are on the ground)
    const vN = this.vel.x * nx + this.vel.y * ny + this.vel.z * nz;
    this.vel.x -= nx * vN; this.vel.y -= ny * vN; this.vel.z -= nz * vN;

    // ---- surface character
    const ice = surf.ice;
    const powder = surf.powder;
    const onRail = surf.rail > 0.4;
    const gripSurface = onRail ? 0.55 : lerp(1.0, 0.34, ice) * lerp(1.0, 1.28, powder);
    const gripMax = (2.6 + 15.5 * absEdge) * gripSurface;

    // Gravity was already added in update(); stripping the normal component
    // above is exactly what leaves the tangential part, so the slope pulls you
    // downhill without a second gravity term.

    // ---- turning: radius grows with speed, tightens with edge
    const speedF = Math.max(2, Math.abs(vF));
    const radius = 5.6 / Math.max(0.08, absEdge);
    let yawRate = (speedF / radius) * Math.sign(this.edge) * (this.edge === 0 ? 0 : 1);
    if (input.brake) yawRate *= 0.35;
    this.yaw += yawRate * dt;

    // ---- grip vs wash
    const demand = Math.abs(vR) + Math.abs(yawRate) * speedF * 0.16;
    let scrub = 0;
    if (input.brake) {
      scrub = 1;
    } else if (demand > gripMax) {
      scrub = clamp((demand - gripMax) / (gripMax + 4), 0, 1);
    }
    this.scrub = lerp(this.scrub, scrub, 1 - Math.exp(-14 * dt));

    // lateral velocity: railed carve kills it, a wash bleeds it slowly
    const latDamp = Math.exp(-(scrub > 0.02 ? 3.0 : 16.0) * dt);
    const newVR = vR * latDamp;
    const dVR = newVR - vR;
    this.vel.x += rx * dVR; this.vel.y += ry * dVR; this.vel.z += rz * dVR;

    // ---- flow: earned by holding a clean edge through a real turn
    const turning = smoothstep(0.15, 0.8, Math.abs(yawRate) * 0.9);
    const smooth = 1 - smoothstep(2.2, 7.0, edgeJerk);
    const clean = (1 - this.scrub) * smooth * turning * smoothstep(0.12, 0.55, absEdge);
    this.carveQuality = clean;
    const flowGain = clean * 0.20 * (input.tuck ? 0.55 : 1.0);   // tucking is fast, not stylish
    const flowLoss = 0.055 + this.scrub * 0.85 + (input.brake ? 0.5 : 0);
    this.flow = clamp(this.flow + (flowGain - flowLoss) * dt, 0, 1);

    // ---- pump: the actual speed-build mechanic
    const cap = this.speedCap;
    const headroom = clamp(1 - Math.abs(vF) / cap, 0, 1);
    let thrust = clean * 15.5 * headroom * absEdge;
    // ---- boost (Shift): raw forward push, works without a carve.
    if (input.boost) {
      thrust += 26 * headroom;
      if (this.speed > 6) this.emit('boostspray', this.speed);
    }
    this.vel.x += fx * thrust * dt; this.vel.y += fy * thrust * dt; this.vel.z += fz * thrust * dt;

    // ---- drag
    const v = Math.hypot(this.vel.x, this.vel.y, this.vel.z);
    const tuck = input.tuck ? 0.55 : 1.0;
    let drag = 0.0021 * v * v * tuck                     // air
             + v * (0.05 + 1.45 * powder * (1 - absEdge * 0.35))   // ploughing snow
             + v * this.scrub * 1.25                     // washing the edge
             + (onRail ? -0.15 * v : 0);                 // rails are slick
    if (input.brake) drag += v * 2.4 + 6;
    const overCap = Math.max(0, v - cap);
    drag += overCap * 2.2;                               // the ceiling is soft but firm
    const dv = Math.max(0, 1 - (drag / Math.max(v, 0.001)) * dt);
    this.vel.multiplyScalar(dv);

    // ---- costs of sloppiness
    if (this.scrub > 0.25 && !input.brake) {
      this.stability -= (this.scrub - 0.25) * 0.55 * dt * (1 + ice * 1.6);
      this.emit('spray', this.scrub, powder);
    } else if (powder > 0.4 && v > 8) {
      this.emit('plume', powder, v);
    } else if (absEdge > 0.35 && v > 6) {
      this.emit('carve', absEdge * (1 - powder), ice);
    }
    if (onRail) this.emit('grind', v, 0);
  }

  airStep(dt, input) {
    this.airTime += dt;
    this.lastAirTime += dt;
    // Kicker launches rotate much faster: that's where tricks live.
    const spinRate = input.steer * (this.boostAir ? 6.4 : 4.6);
    this.yaw += spinRate * dt;
    this.spin += Math.abs(spinRate) * dt;
    if (spinRate !== 0) this.spinDir = Math.sign(spinRate);
    // Flips: W/Up = backflip, S/Down = frontflip. Only meaningful air counts,
    // so brushing a bump while tucking doesn't start a rotation.
    if (this.boostAir || this.lastAirTime > 0.35) {
      const flipInput = (input.tuck ? 1 : 0) - (input.brake ? 1 : 0);
      this.flip += flipInput * (this.boostAir ? 7.4 : 4.6) * dt;
    }
    const v = this.vel.length();
    const drag = 0.0016 * v * v * (input.tuck ? 0.6 : 1.0);
    this.vel.multiplyScalar(Math.max(0, 1 - (drag / Math.max(v, 0.001)) * dt));
  }

  land(impact, n, surf) {
    const v = Math.hypot(this.vel.x, this.vel.y, this.vel.z);
    // is the board pointing where it is going?
    let fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
    const vh = Math.hypot(this.vel.x, this.vel.z) || 1;
    const align = (this.vel.x / vh) * fx + (this.vel.z / vh) * fz;   // 1 = perfect
    const spinBonus = this.spin > 3.0 ? 0.16 : this.spin > 1.4 ? 0.08 : 0;
    // A flip must be completed: landing mid-rotation is a slam.
    const TAU = Math.PI * 2;
    const flips = Math.round(Math.abs(this.flip) / TAU);
    const flipErr = Math.abs(Math.abs(this.flip) - flips * TAU);
    const spins = Math.round(this.spin / TAU);
    // Kicker airs come in hot by design; the knees absorb more there.
    const softCap = this.boostAir ? 13.0 : 7.5;
    const soft = impact < softCap && align > 0.72 && flipErr < 0.85;

    if (soft) {
      const trickBonus = flips * 0.10 + spins * 0.06;
      this.flow = clamp(this.flow + 0.05 + spinBonus + trickBonus + Math.min(0.12, this.lastAirTime * 0.06), 0, 1);
      this.stability = clamp(this.stability + 0.05, 0, 1);
      this.emit('land', impact, 1);
      if (flips > 0 || spins > 0) {
        let name = '';
        if (flips > 0) name = (this.flip > 0 ? 'BACKFLIP' : 'FRONTFLIP') + (flips > 1 ? ` x${flips}` : '');
        if (spins > 0) name += (name ? ' + ' : '') + `${spins * 360}\u00B0 SPIN`;
        this.events.push({ type: 'trick', a: trickBonus, b: 0, name });
      }
    } else {
      const hard = Math.max(0, impact - softCap) * 0.075;
      const sketch = Math.max(0, 0.72 - align) * 1.15 + Math.max(0, flipErr - 0.85) * 0.22;
      this.stability -= hard + sketch;
      this.flow *= 1 - clamp(hard + sketch, 0, 0.85);
      this.vel.multiplyScalar(1 - clamp(hard * 0.5 + sketch * 0.35, 0, 0.6));
      this.emit('land', impact, 0);
    }
    this.crouch = Math.min(1, 0.4 + impact * 0.06);
    this.airTime = 0;
    this.spin = 0;
    this.flip = 0;
    this.boostAir = false;
  }

  checkHazards(dt, hazards) {
    const hit = hazards.query(this.pos.x, this.pos.z);
    if (!hit) return;
    // Low obstacles (logs, small rocks) can be cleared: if the board is above
    // the hazard's top, there is no contact at all. `top` is metres above snow.
    if (hit.top !== undefined) {
      const clearance = this.pos.y - this.surf.h;
      if (clearance > hit.top) return;
    }
    if (hit.d < hit.r) {
      this.stability -= hit.hard ? 0.62 : 0.34;
      this.vel.multiplyScalar(hit.hard ? 0.45 : 0.7);
      this.emit('impact', hit.hard ? 1 : 0.5);
    } else if (hit.d < hit.r + 1.5) {
      this.stability -= 0.16 * dt;
      this.flow *= 1 - 0.25 * dt;
      this.emit('brush', 1 - (hit.d - hit.r) / 1.5);
    }
  }

  startWipe() {
    this.state = STATE.WIPE;
    this.wipeTimer = 1.55;
    this.stability = 0;
    this.flow = 0;
    this.emit('wipe', Math.hypot(this.vel.x, this.vel.z));
  }

  updateWipe(dt) {
    this.wipeTimer -= dt;
    this.vel.y -= G * dt;
    this.vel.multiplyScalar(Math.max(0, 1 - 2.2 * dt));
    this.pos.addScaledVector(this.vel, dt);
    const gy = sample(this.pos.x, this.pos.z, this.surf).h + BOARD_LIFT;
    if (this.pos.y < gy) { this.pos.y = gy; this.vel.y = 0; }
    this.tumble.x += dt * 9 * (0.4 + this.speed * 0.02);
    this.tumble.z += dt * 5;
    this.speed = this.vel.length();
    if (this.wipeTimer <= 0) { this.respawn(); this.emit('respawn'); }
    this.applyMeshTransform(true);
  }

  updateBasis(dt) {
    const n = normal(this.pos.x, this.pos.z, 0.7);
    const targetUp = this.grounded
      ? new THREE.Vector3(n.x, n.y, n.z)
      : new THREE.Vector3(0, 1, 0);
    this.up.lerp(targetUp, 1 - Math.exp(-9 * dt)).normalize();
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.forward.addScaledVector(this.up, -this.forward.dot(this.up)).normalize();
    this.right.crossVectors(this.up, this.forward).normalize();
    this.applyMeshTransform(false);
  }

  applyMeshTransform(wiping) {
    const m = this.mesh;
    m.position.copy(this.pos);
    if (wiping) {
      m.rotation.set(this.tumble.x, this.yaw, this.tumble.z);
      return;
    }
    _basis.makeBasis(this.right, this.up, this.forward);
    m.quaternion.setFromRotationMatrix(_basis);
    // roll into the turn, plus a little counter-rotation of the shoulders
    const lean = -clamp(this.edge, -1.3, 1.3) * MAX_LEAN * (this.grounded ? 1 : 0.45);
    _q.setFromAxisAngle(_zAxis, lean);
    m.quaternion.multiply(_q);
    if (!this.grounded && this.flip !== 0) {
      // Backflip rotates the body backwards around the board's right axis.
      _q.setFromAxisAngle(_xAxis, -this.flip);
      m.quaternion.multiply(_q);
    }
    m.userData.pose(this.crouch, this.edge, this.stability, this.grounded, this.speed);
  }
}

const _basis = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _zAxis = new THREE.Vector3(0, 0, 1);
const _xAxis = new THREE.Vector3(1, 0, 0);

// ------------------------------------------------------------- generated body

function topsheetTexture(a, b, c) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 256;
  const g = cv.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, a); grd.addColorStop(0.55, b); grd.addColorStop(1, c);
  g.fillStyle = grd; g.fillRect(0, 0, 64, 256);
  g.globalAlpha = 0.5;
  g.fillStyle = '#fff';
  for (let i = 0; i < 7; i++) {
    g.save();
    g.translate(32, 40 + i * 30);
    g.rotate(-0.5);
    g.fillRect(-26, 0, 52, 3);
    g.restore();
  }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.beginPath(); g.arc(32, 128, 9, 0, 6.3); g.fill();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function jacketTexture(colorHex) {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const g = cv.getContext('2d');
  const c = new THREE.Color(colorHex);
  const hsl = {}; c.getHSL(hsl);
  const shade = (dl) => `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(Math.max(6, Math.min(94, (hsl.l + dl) * 100)))}%)`;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, shade(0.07));
  grd.addColorStop(0.6, shade(0));
  grd.addColorStop(1, shade(-0.10));
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  // chest stripe
  g.fillStyle = 'rgba(255,255,255,0.82)';
  g.fillRect(0, 42, 128, 9);
  g.fillStyle = 'rgba(20,24,34,0.65)';
  g.fillRect(0, 51, 128, 4);
  // zipper + seams
  g.strokeStyle = 'rgba(20,24,34,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(64, 6); g.lineTo(64, 122); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
  for (const x of [22, 106]) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x, 120); g.stroke(); }
  // quilted stitching rows
  for (let y = 66; y < 126; y += 14) { g.beginPath(); g.moveTo(4, y); g.lineTo(124, y); g.stroke(); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const PALETTES = [
  { jacket: 0xff7a59, pants: 0x2f6f7f, beanie: 0xffd166, board: ['#ffb703', '#fb8500', '#e63946'] },
  { jacket: 0x7bd389, pants: 0x37474f, beanie: 0xff8fab, board: ['#48cae4', '#0096c7', '#023e8a'] },
  { jacket: 0x9b8cff, pants: 0x3a3a55, beanie: 0xffe066, board: ['#f4a261', '#e76f51', '#264653'] },
  { jacket: 0xffd6a5, pants: 0x4d5061, beanie: 0x8ecae6, board: ['#bde0fe', '#a2d2ff', '#cdb4db'] },
];

export function makeRiderMesh(palette = PALETTES[0]) {
  const g = new THREE.Group();
  const textures = getGeneratedTextures();
  setTextureRepeat(textures.fabricNormal, 8, 8);
  setTextureRepeat(textures.fabricRoughness, 7, 7);
  const mat = (c, r = 0.65) => new THREE.MeshPhysicalMaterial({
    color: c, roughness: r, roughnessMap: textures.fabricRoughness,
    normalMap: textures.fabricNormal, normalScale: new THREE.Vector2(0.12, 0.12),
    specularIntensity: 0.3, clearcoat: 0.015,
  });
  const jacket = mat(palette.jacket, 0.72);
  const pants = mat(palette.pants, 0.8);
  const skin = mat(0xf0c8a0, 0.85);
  const beanie = mat(palette.beanie, 0.9);
  const dark = mat(0x22242c, 0.5);

  // board: rounded, with camber and a printed topsheet
  const boardGeo = new THREE.BoxGeometry(0.30, 0.045, 1.62, 1, 1, 12);
  const bp = boardGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const z = bp.getZ(i);
    const t = Math.abs(z) / 0.81;
    bp.setX(i, bp.getX(i) * (1 - 0.30 * t * t));       // sidecut + rounded tips
    bp.setY(i, bp.getY(i) + 0.075 * t * t * t);        // rocker
  }
  boardGeo.computeVertexNormals();
  const board = new THREE.Mesh(boardGeo, new THREE.MeshStandardMaterial({
    map: topsheetTexture(...palette.board), roughness: 0.28, metalness: 0.05,
  }));
  board.position.y = 0.02;
  g.add(board);

  const bindings = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.3), dark);
  bindings.position.set(0, 0.07, 0.26); g.add(bindings);
  const bindings2 = bindings.clone(); bindings2.position.z = -0.26; g.add(bindings2);

  const body = new THREE.Group();
  body.position.y = 0.08;
  g.add(body);

  // Two separate legs over the bindings read as a real snowboard stance.
  const legs = new THREE.Group();
  legs.position.y = 0.42;
  legs.rotation.x = 0.12;
  body.add(legs);
  const legGeo = new THREE.CapsuleGeometry(0.085, 0.4, 4, 8);
  const legL = new THREE.Mesh(legGeo, pants);
  legL.position.set(0.03, 0, 0.2); legL.rotation.x = -0.28; legs.add(legL);
  const legR = new THREE.Mesh(legGeo, pants);
  legR.position.set(-0.03, 0, -0.2); legR.rotation.x = 0.28; legs.add(legR);
  const bootGeo = new THREE.BoxGeometry(0.16, 0.16, 0.3);
  const bootL = new THREE.Mesh(bootGeo, dark);
  bootL.position.set(0.02, 0.14, 0.26); g.add(bootL);
  const bootR = new THREE.Mesh(bootGeo, dark);
  bootR.position.set(-0.02, 0.14, -0.26); g.add(bootR);

  jacket.map = jacketTexture(palette.jacket);
  jacket.color = new THREE.Color(0xffffff);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.34, 4, 12), jacket);
  torso.position.y = 0.92; body.add(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 6, 12), beanie);
  collar.position.y = 1.14; collar.rotation.x = Math.PI / 2; body.add(collar);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), skin);
  head.position.y = 1.29; body.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 8, 0, 6.3, 0, 1.5), beanie);
  hat.position.y = 1.31; body.add(hat);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), beanie);
  pom.position.set(0, 1.46, 0); body.add(pom);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.085, 0.06), new THREE.MeshStandardMaterial({
    color: 0x2b3a67, roughness: 0.15, metalness: 0.6,
  }));
  goggles.position.set(0, 1.31, 0.11); body.add(goggles);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.36, 4, 8), jacket);
  armL.position.set(-0.2, 0.98, 0.02); body.add(armL);
  const armR = armL.clone(); armR.position.x = 0.2; body.add(armR);
  const mitL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), dark);
  const mitR = mitL.clone();
  armL.add(mitL); mitL.position.y = -0.24;
  armR.add(mitR); mitR.position.y = -0.24;

  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });

  // Pose driver: crouch, edge, balance flail, tuck.
  g.userData.pose = (crouch, edge, stability, grounded, speed) => {
    const c = clamp(crouch, 0, 1);
    body.position.y = 0.08 - 0.28 * c;
    body.scale.y = 1 - 0.16 * c;
    legs.rotation.x = 0.12 + 0.55 * c;
    torso.rotation.x = 0.15 + 0.5 * c + (speed > 20 ? 0.18 : 0);
    const flail = (1 - stability) * 1.5;
    const swing = Math.sin(performance.now() * 0.012) * flail * 0.5;
    armL.rotation.z = 0.35 + edge * 0.75 + swing;
    armR.rotation.z = -0.35 + edge * 0.75 - swing;
    armL.rotation.x = -0.2 - c * 0.6 + (grounded ? 0 : -0.7);
    armR.rotation.x = -0.2 - c * 0.6 + (grounded ? 0 : -0.5);
    head.rotation.y = goggles.rotation.y = clamp(edge, -1, 1) * 0.4;
  };
  g.userData.pose(0, 0, 1, true, 0);
  return g;
}
