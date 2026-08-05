// Generative warm house, written in oscillators. No samples, no files.
//
// The point is not to be clever: it is to sit under the riding and breathe with
// it. Flow raises the tempo a little and opens the arrangement; a wipeout drops
// it back to just pads and kick.

const SCALE = [0, 2, 3, 5, 7, 8, 10];      // F dorian-ish, warm and unresolved

// F major family. Root MIDI notes, one bar each.
const PROG = [
  { root: 41, ch: [0, 4, 7, 11] },          // Fmaj7
  { root: 45, ch: [0, 3, 7, 10] },          // Am7
  { root: 43, ch: [0, 3, 7, 10] },          // Gm7
  { root: 48, ch: [0, 4, 7, 11] },          // Cmaj7
];

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class Music {
  constructor(sfx) {
    this.sfx = sfx;
    this.started = false;
    this.step = 0;
    this.nextTime = 0;
    this.bpm = 96;
    this.energy = 0;
    this.lookahead = 0.12;
  }

  start() {
    if (this.started || !this.sfx.ready) return;
    const ctx = this.sfx.ctx;
    this.ctx = ctx;
    this.bus = this.sfx.musicBus;

    // A short feedback delay on the plucks: instant "space" for free.
    this.delay = ctx.createDelay(1.0);
    this.delayGain = ctx.createGain();
    this.delayGain.gain.value = 0.32;
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 2600;
    this.delay.connect(this.delayFilter).connect(this.delayGain).connect(this.delay);
    this.delayGain.connect(this.bus);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 900;
    this.padFilter.Q.value = 0.7;
    this.padFilter.connect(this.bus);

    this.nextTime = ctx.currentTime + 0.1;
    this.started = true;
  }

  // energy 0..1 from flow; speed adds a little push.
  update(energy, speed) {
    if (!this.started) return;
    this.energy += (energy - this.energy) * 0.02;
    this.bpm = 94 + this.energy * 18;
    this.padFilter.frequency.setTargetAtTime(700 + this.energy * 2600, this.ctx.currentTime, 0.4);
    this.delayGain.gain.setTargetAtTime(0.22 + this.energy * 0.2, this.ctx.currentTime, 0.5);

    const spb = 60 / this.bpm / 4;             // sixteenth
    while (this.nextTime < this.ctx.currentTime + this.lookahead) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += spb;
      this.step++;
    }
  }

  schedule(step, t) {
    const s16 = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const chord = PROG[bar];
    const e = this.energy;

    // kick: four on the floor, always there
    if (s16 % 4 === 0) this.kick(t, 0.5 + e * 0.25);

    // pad: one long chord per bar
    if (s16 === 0) this.pad(t, chord, 60 / this.bpm * 4 * 0.98);

    // bass: root on 1, a push on the 4th sixteenth of every beat
    if (s16 % 4 === 0) this.bass(t, chord.root - 12, 0.22 + e * 0.1);
    if (e > 0.25 && (s16 === 6 || s16 === 14)) this.bass(t, chord.root - 12 + 7, 0.14);

    // hats: offbeat, opens up with energy
    if (e > 0.12 && s16 % 4 === 2) this.hat(t, 0.05 + e * 0.06, false);
    if (e > 0.45 && s16 % 2 === 1) this.hat(t, 0.022 + e * 0.03, true);

    // shaker-ish sixteenths only when really flowing
    if (e > 0.7 && s16 % 1 === 0 && Math.random() < 0.35) this.hat(t, 0.012, true);

    // plucks: sparse pentatonic phrase, denser with energy
    const gate = [0, 3, 6, 10, 11, 14][step % 6];
    if (e > 0.2 && s16 === gate && Math.random() < 0.55 + e * 0.35) {
      const deg = SCALE[(step * 3) % SCALE.length];
      const oct = Math.random() < 0.3 ? 12 : 0;
      this.pluck(t, chord.root + 24 + deg + oct, 0.10 + e * 0.09);
    }

    // a soft swell at the top of every fourth bar
    if (s16 === 0 && bar === 0) this.swell(t, 60 / this.bpm * 4);
  }

  kick(t, amp) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(128, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g).connect(this.bus);
    o.start(t); o.stop(t + 0.3);
  }

  bass(t, midi, amp) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 320 + this.energy * 500;
    o.type = 'sine'; o.frequency.value = mtof(midi);
    o2.type = 'triangle'; o2.frequency.value = mtof(midi) * 1.005;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o.connect(g); o2.connect(g2).connect(g);
    g.connect(f).connect(this.bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.start(t); o2.start(t);
    o.stop(t + 0.4); o2.stop(t + 0.4);
  }

  hat(t, amp, closed) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.sfx.noise;
    src.playbackRate.value = 1.4;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = closed ? 9000 : 6200;
    const g = ctx.createGain();
    const dur = closed ? 0.035 : 0.09;
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp).connect(g).connect(this.bus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  pad(t, chord, dur) {
    const ctx = this.ctx;
    for (const semi of chord.ch) {
      for (const det of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = mtof(chord.root + semi + 12) * (1 + det * 0.0006);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.030, t + dur * 0.35);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.padFilter);
        o.start(t); o.stop(t + dur + 0.1);
      }
    }
  }

  pluck(t, midi, amp) {
    const ctx = this.ctx;
    // 2-op FM bell: carrier + modulator, short decay.
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    const g = ctx.createGain();
    const f = mtof(midi);
    car.type = 'sine'; car.frequency.value = f;
    mod.type = 'sine'; mod.frequency.value = f * 2.01;
    modG.gain.setValueAtTime(f * 1.6, t);
    modG.gain.exponentialRampToValueAtTime(1, t + 0.25);
    mod.connect(modG).connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    car.connect(g);
    g.connect(this.bus);
    g.connect(this.delay);
    car.start(t); mod.start(t);
    car.stop(t + 0.6); mod.stop(t + 0.6);
  }

  swell(t, dur) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.sfx.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.8;
    bp.frequency.exponentialRampToValueAtTime(4200, t + dur * 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02 + this.energy * 0.03, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.bus);
    src.start(t); src.stop(t + dur + 0.05);
  }
}
