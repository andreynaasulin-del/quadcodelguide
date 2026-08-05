// Tiny shared-world client: SSE down, POST up. Failure is silent and the game
// remains fully playable offline.

export class Net {
  constructor(name) {
    this.name = name;
    this.id = sessionStorage.getItem('powderline-id') || crypto.randomUUID();
    sessionStorage.setItem('powderline-id', this.id);
    this.online = false;
    this.players = new Map();
    this.leaders = [];
    this.seed = 1337;
    this.lastSend = 0;
    this.source = null;
  }

  async connect() {
    try {
      const r = await fetch('/api/world', { cache: 'no-store' });
      if (!r.ok) throw new Error('world unavailable');
      const world = await r.json();
      this.seed = world.seed | 0;
      this.openEvents();
      return this.seed;
    } catch {
      return this.seed;
    }
  }

  openEvents() {
    this.source?.close();
    const es = new EventSource(`/api/events?id=${encodeURIComponent(this.id)}`);
    this.source = es;
    es.onopen = () => { this.online = true; };
    es.onerror = () => { this.online = false; };
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'snapshot') {
          this.players.clear();
          for (const p of msg.players || []) if (p.id !== this.id) this.players.set(p.id, p);
          this.leaders = (msg.leaders || []).map((p) => ({ ...p, self: p.id === this.id }));
        } else if (msg.type === 'player') {
          if (msg.player.id !== this.id) this.players.set(msg.player.id, msg.player);
        } else if (msg.type === 'leave') {
          this.players.delete(msg.id);
        } else if (msg.type === 'leaders') {
          this.leaders = (msg.rows || []).map((p) => ({ ...p, self: p.id === this.id }));
        }
      } catch { /* malformed network packet cannot break the ride */ }
    };
  }

  send(rider, now) {
    if (!this.online || now - this.lastSend < 0.10) return;
    this.lastSend = now;
    const body = {
      id: this.id,
      name: this.name,
      x: round(rider.pos.x), y: round(rider.pos.y), z: round(rider.pos.z),
      yaw: round(rider.yaw), edge: round(rider.edge), speed: round(rider.speed),
      flow: round(rider.flow), distance: Math.floor(rider.dist), state: rider.state,
    };
    fetch('/api/state', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), keepalive: true,
    }).catch(() => { this.online = false; });
  }

  wipe() {
    if (!this.online) return;
    fetch('/api/wipe', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: this.id }), keepalive: true,
    }).catch(() => {});
  }
}

const round = (n) => Math.round(n * 100) / 100;
