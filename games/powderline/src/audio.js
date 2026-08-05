// Every sound in the game is synthesised in the browser at runtime.
// One 2-second noise buffer is generated on init; everything else is
// oscillators, filters and envelopes.

const NOISE_SECONDS = 2;

export class Sfx {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC({ latencyHint: 'interactive' });
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    // A gentle limiter so a pile-up of impacts never clips.
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -12;
    this.comp.knee.value = 18;
    this.comp.ratio.value = 4;
    this.comp.attack.value = 0.004;
    this.comp.release.value = 0.18;
    this.master.connect(this.comp).connect(ctx.destination);

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 1.0;
    this.sfxBus.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.55;
    this.musicBus.connect(this.master);

    // shared noise
    const len = ctx.sampleRate * NOISE_SECONDS;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;         // a touch of brown for body
      d[i] = w * 0.72 + last * 3.2;
    }
    this.noise = buf;

    this.buildLoops();
    this.ready = true;
  }

  loopNoise(gainValue = 0) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = gainValue;
    src.connect(g);
    src.start();
    return { src, g };
  }

  buildLoops() {
    const ctx = this.ctx;

    // ---- wind: broad, dark, opens up with speed
    const wind = this.loopNoise(0);
    const wlp = ctx.createBiquadFilter();
    wlp.type = 'lowpass'; wlp.frequency.value = 700; wlp.Q.value = 0.6;
    const whp = ctx.createBiquadFilter();
    whp.type = 'highpass'; whp.frequency.value = 130;
    wind.g.connect(wlp).connect(whp).connect(this.sfxBus);
    this.wind = { g: wind.g, lp: wlp };

    // ---- carve: narrow resonant band, the classic edge-on-snow hiss
    const carve = this.loopNoise(0);
    const cbp = ctx.createBiquadFilter();
    cbp.type = 'bandpass'; cbp.frequency.value = 1800; cbp.Q.value = 1.6;
    const cpk = ctx.createBiquadFilter();
    cpk.type = 'peaking'; cpk.frequency.value = 3200; cpk.Q.value = 2.2; cpk.gain.value = 6;
    carve.g.connect(cbp).connect(cpk).connect(this.sfxBus);
    this.carve = { g: carve.g, bp: cbp, pk: cpk };

    // ---- powder: soft low whoosh
    const pow = this.loopNoise(0);
    const plp = ctx.createBiquadFilter();
    plp.type = 'lowpass'; plp.frequency.value = 420; plp.Q.value = 0.9;
    pow.g.connect(plp).connect(this.sfxBus);
    this.powder = { g: pow.g, lp: plp };

    // ---- grind: metal ring under a noise band
    const gr = this.loopNoise(0);
    const gbp = ctx.createBiquadFilter();
    gbp.type = 'bandpass'; gbp.frequency.value = 2600; gbp.Q.value = 6;
    gr.g.connect(gbp).connect(this.sfxBus);
    const ring = ctx.createOscillator();
    ring.type = 'triangle'; ring.frequency.value = 1240;
    const ringG = ctx.createGain(); ringG.gain.value = 0;
    ring.connect(ringG).connect(this.sfxBus);
    ring.start();
    this.grind = { g: gr.g, bp: gbp, ring, ringG };
  }

  // Continuous layers, driven from the rider state once per frame.
  frame(rider, dt) {
    if (!this.ready || this.muted) return;
    const t = this.ctx.currentTime;
    const set = (param, v, tc = 0.06) => param.setTargetAtTime(v, t, tc);

    const sp = rider.speed;
    const spT = Math.min(1, sp / 34);
    set(this.wind.g.gain, 0.030 + spT * 0.30, 0.1);
    set(this.wind.lp.frequency, 420 + spT * 1900, 0.12);

    const ice = rider.surf.ice;
    const onSnow = rider.grounded ? 1 : 0;
    const edgeAmt = Math.min(1, Math.abs(rider.edge)) * Math.min(1, sp / 12);
    const carveGain = onSnow * (0.05 + edgeAmt * 0.34 + rider.scrub * 0.42);
    set(this.carve.g.gain, carveGain * (1 - rider.surf.powder * 0.55), 0.05);
    set(this.carve.bp.frequency, 1100 + spT * 2100 + ice * 1500, 0.08);
    set(this.carve.bp.Q, 1.3 + ice * 5.5, 0.1);
    set(this.carve.pk.gain, 4 + ice * 12, 0.1);

    set(this.powder.g.gain, onSnow * rider.surf.powder * (0.06 + spT * 0.42), 0.08);
    set(this.powder.lp.frequency, 240 + spT * 620, 0.1);

    const grinding = rider.surf.rail > 0.4 && rider.grounded ? 1 : 0;
    set(this.grind.g.gain, grinding * 0.16, 0.03);
    set(this.grind.ringG.gain, grinding * 0.045, 0.03);
    if (grinding) set(this.grind.ring.frequency, 900 + spT * 900, 0.05);
  }

  // ---------------------------------------------------------------- one-shots

  env(node, peak, attack, decay, when = 0) {
    const t = this.ctx.currentTime + when;
    const g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
    g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  noiseShot(dur, type, freq, Q, peak, sweepTo = null) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = Q;
    const g = ctx.createGain();
    src.connect(f).connect(g).connect(this.sfxBus);
    const t = ctx.currentTime;
    src.start(t, Math.random() * 1.2);
    this.env(g, peak, Math.min(0.01, dur * 0.2), dur);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    src.stop(t + dur + 0.06);
  }

  tone(freq, dur, peak, type = 'sine', to = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    o.connect(g).connect(this.sfxBus);
    const t = ctx.currentTime;
    o.start(t);
    this.env(g, peak, 0.006, dur);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    o.stop(t + dur + 0.05);
  }

  pop(charge) {
    if (!this.ready || this.muted) return;
    this.noiseShot(0.09, 'highpass', 900 + charge * 900, 0.7, 0.16);
    this.tone(180 + charge * 90, 0.12, 0.10, 'triangle', 420 + charge * 260);
  }

  land(impact, soft) {
    if (!this.ready || this.muted) return;
    const p = Math.min(1, impact / 14);
    this.tone(110 - p * 30, 0.18 + p * 0.12, 0.16 + p * 0.2, 'sine', 45);
    this.noiseShot(0.13 + p * 0.1, 'lowpass', 900 + p * 1400, 0.8, 0.13 + p * 0.22, 260);
    if (soft) {
      // a small warm confirmation, only on a clean landing
      this.tone(880, 0.16, 0.045, 'sine');
      this.tone(1320, 0.13, 0.028, 'sine');
    }
  }

  impact(hard) {
    if (!this.ready || this.muted) return;
    this.noiseShot(0.22, 'bandpass', hard > 0.8 ? 420 : 900, 1.2, 0.3);
    this.tone(hard > 0.8 ? 92 : 150, 0.22, 0.26, 'square', 60);
    if (hard > 0.8) { this.tone(320, 0.1, 0.1, 'triangle', 180); }
  }

  brush(amount) {
    if (!this.ready || this.muted) return;
    if (Math.random() > 0.12) return;
    this.noiseShot(0.10, 'bandpass', 3200 + Math.random() * 2000, 3, 0.06 * amount);
  }

  wipe() {
    if (!this.ready || this.muted) return;
    this.noiseShot(0.75, 'lowpass', 3200, 0.8, 0.34, 160);
    this.tone(140, 0.5, 0.2, 'sine', 42);
  }

  respawn() {
    if (!this.ready || this.muted) return;
    const base = 523.25;
    [0, 4, 7, 12].forEach((semi, i) => {
      const f = base * Math.pow(2, semi / 12);
      setTimeout(() => this.tone(f, 0.35, 0.055, 'sine'), i * 70);
    });
  }

  chime(step) {
    if (!this.ready || this.muted) return;
    const f = 660 * Math.pow(2, step / 12);
    this.tone(f, 0.5, 0.05, 'sine');
    this.tone(f * 2, 0.32, 0.022, 'sine');
  }

  setMuted(m) {
    this.muted = m;
    if (this.ready) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }
}
