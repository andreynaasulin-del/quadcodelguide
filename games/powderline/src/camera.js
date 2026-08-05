// Chase camera. All the juice lives here: it lags behind the board, widens with
// speed, rolls into the turn and gets kicked on impact. None of it touches
// physics, so the feel can be tuned without changing how the board behaves.

import * as THREE from 'three';
import { height } from './worldfn.js';
import { clamp, lerp } from './noise.js';

export class ChaseCamera {
  constructor(camera) {
    this.cam = camera;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.roll = 0;
    this.shake = 0;
    this.fov = 68;
    this.heading = new THREE.Vector3(0, 0, 1);
    this._t = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this.first = true;
  }

  update(dt, rider, wiping) {
    const speedT = clamp(rider.speed / 34, 0, 1);
    // Keep the board large enough to read while preserving terrain preview.
    // The old 10.5 m / 84° framing reduced the rider to a UI marker.
    const dist = lerp(4.8, 7.4, speedT) + rider.flow * 0.7;
    const high = lerp(1.85, 2.55, speedT);

    // Follow the direction of travel, not the board: drifting shows the drift.
    const vh = Math.hypot(rider.vel.x, rider.vel.z);
    if (vh > 1.5) {
      this._t.set(rider.vel.x / vh, 0, rider.vel.z / vh);
    } else {
      this._t.copy(rider.forward).setY(0).normalize();
    }
    this.heading.lerp(this._t, 1 - Math.exp(-(wiping ? 2.5 : 5.5) * dt)).normalize();

    const tx = rider.pos.x - this.heading.x * dist;
    const tz = rider.pos.z - this.heading.z * dist;
    const ty = rider.pos.y + high;

    if (this.first) { this.pos.set(tx, ty, tz); this.first = false; }
    const k = 1 - Math.exp(-7.5 * dt);
    this.pos.x = lerp(this.pos.x, tx, k);
    this.pos.z = lerp(this.pos.z, tz, k);
    this.pos.y = lerp(this.pos.y, ty, 1 - Math.exp(-9 * dt));

    // Never let the camera dip under the snow.
    const floor = height(this.pos.x, this.pos.z) + 1.4;
    if (this.pos.y < floor) this.pos.y = floor;

    // Look slightly ahead of the rider so you can read the terrain coming up.
    const lead = 5 + speedT * 10;
    this.look.set(
      rider.pos.x + this.heading.x * lead,
      rider.pos.y + 0.62 - speedT * 0.35,
      rider.pos.z + this.heading.z * lead
    );

    this.cam.position.copy(this.pos);
    this.cam.up.set(0, 1, 0);
    this.cam.lookAt(this.look);

    // roll: banking into the carve, from the edge and the actual turn rate
    const targetRoll = -rider.edge * 0.15 * (0.35 + speedT) - rider.scrub * 0.02;
    this.roll = lerp(this.roll, targetRoll, 1 - Math.exp(-6 * dt));
    this.cam.rotateZ(this.roll);

    // fov breathing = the cheapest speed cue there is
    const targetFov = 64 + speedT * 10 + rider.flow * 3 + (rider.boosting ? 6 : 0);
    this.fov = lerp(this.fov, targetFov, 1 - Math.exp(-4 * dt));
    if (Math.abs(this.cam.fov - this.fov) > 0.01) {
      this.cam.fov = this.fov;
      this.cam.updateProjectionMatrix();
    }

    if (this.shake > 0) {
      const s = this.shake;
      this.cam.position.x += (Math.random() - 0.5) * s;
      this.cam.position.y += (Math.random() - 0.5) * s;
      this.cam.position.z += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, s - dt * 2.2);
    }
  }

  kick(amount) {
    this.shake = Math.min(0.9, this.shake + amount);
  }
}
