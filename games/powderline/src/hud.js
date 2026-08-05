// Minimal HUD: useful feedback without turning the ride into a spreadsheet.

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class HUD {
  constructor() {
    this.speed = $('speed-value');
    this.distance = $('distance-value');
    this.flow = $('flow-fill');
    this.flowLabel = $('flow-label');
    this.stability = $('stability-fill');
    this.surface = $('surface-pill');
    this.leaders = $('leaders');
    this.message = $('message');
    this.fps = $('fps');
    this.lastMessage = '';
    this.messageUntil = 0;
    this.fpsTime = 0;
    this.fpsFrames = 0;
  }

  update(rider, now, dt, online, leaders) {
    this.speed.textContent = String(Math.round(rider.speed * 3.6));
    this.distance.textContent = `${Math.floor(rider.dist)} m`;
    this.flow.style.setProperty('--v', `${clamp(rider.flow, 0, 1) * 100}%`);
    this.flowLabel.textContent = rider.flow > 0.82 ? 'LOCKED IN' : rider.flow > 0.48 ? 'FLOWING' : 'FLOW';
    this.stability.style.width = `${clamp(rider.stability, 0, 1) * 100}%`;
    this.stability.parentElement.classList.toggle('danger', rider.stability < 0.3);

    const s = rider.surf;
    let label = 'GROOMER';
    if (!rider.grounded) label = `${rider.airTime.toFixed(1)}s AIR`;
    else if (rider.boosting) label = 'BOOST';
    else if (s.rail > 0.4) label = 'RAIL';
    else if (s.ice > 0.45) label = 'ICE';
    else if (s.tunnel > 0.4) label = 'TREE LINE';
    else if (s.park > 0.4) label = 'TERRAIN PARK';
    else if (s.powder > 0.55) label = 'POWDER';
    this.surface.textContent = label;

    if (leaders) this.renderLeaders(leaders, online);
    if (now > this.messageUntil) this.message.classList.remove('show');

    this.fpsTime += dt;
    this.fpsFrames++;
    if (this.fpsTime >= 0.5) {
      this.fps.textContent = `${Math.round(this.fpsFrames / this.fpsTime)} FPS`;
      this.fpsTime = 0;
      this.fpsFrames = 0;
    }
  }

  renderLeaders(rows, online) {
    const state = online ? '<span class="online-dot"></span>SHARED MOUNTAIN' : 'SOLO / RECONNECTING';
    let html = `<div class="leader-state">${state}</div>`;
    rows.slice(0, 8).forEach((p, i) => {
      const safe = escapeHtml(p.name || 'Rider');
      html += `<div class="leader-row${p.self ? ' self' : ''}"><span>${i + 1}. ${safe}</span><b>${Math.floor(p.distance || 0)}m</b></div>`;
    });
    this.leaders.innerHTML = html;
  }

  announce(text, seconds = 1.4) {
    this.message.textContent = text;
    this.message.classList.add('show');
    this.messageUntil = performance.now() * 0.001 + seconds;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
