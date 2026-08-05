# Powderline

Procedural infinite-mountain snowboarding game. All visible assets, sound effects and music are generated at runtime in code. The only external runtime dependency is the Three.js engine loaded through the import map.

## Run

```bash
node games/powderline/server/server.mjs
```

Open `http://localhost:8020`.

Opening another tab creates another rider in the same shared world. The server uses SSE for snapshots and `POST /api/state` for rider state; there are no npm dependencies.

## Controls

```text
A / D or ← / →   Slow edge transition and carve
Shift            Boost: raw forward push and a higher speed ceiling
W or ↑            Tuck (less drag, less flow gain)
S or ↓            Brake
Space             Hold to charge, release to ollie
M                 Sound on/off
H                 Hide HUD
```

Clean sustained turns grow `flow`, which raises the soft speed ceiling from 12 m/s to 39 m/s. Washing the edge, ice, hard landings and obstacles reduce stability. Only zero stability causes a wipeout and resets the current distance.
