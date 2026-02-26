# RingWars 3D — Full User Manual

Version: Prototype v0.17 (Phases 1–17)

---

## 1) What this system is

RingWars 3D is a browser-based 3D arena action game with:

- single-player survival loop
- boss phase mechanics
- progression and upgrades
- save slots and settings persistence
- controller + touch support
- versus mode (local tabs + cross-device WebSocket relay)

---

## 2) Requirements

- Node.js 18+
- npm
- Modern browser (Chrome/Edge/Firefox)

Optional for cross-device versus:
- open firewall for relay port (default `8787`)
- machines on same network or reachable public host

---

## 3) Project setup

From repo root (`ringwars3d`):

```bash
npm install
npm run dev
```

Default local URL (Vite):

```text
http://localhost:5173
```

---

## 4) Game modes

### 4.1 Solo mode
Open normally:

```text
http://localhost:5173
```

### 4.2 Versus (same browser/machine, BroadcastChannel)
Host tab:

```text
http://localhost:5173/?mode=host&room=alpha
```

Client tab:

```text
http://localhost:5173/?mode=client&room=alpha
```

### 4.3 Versus (cross-device/network, WebSocket)
1) Start relay server:

```bash
node tools/ws-relay.mjs
```

2) Host URL:

```text
http://<SERVER_IP>:5173/?mode=host&room=alpha&ws=ws://<SERVER_IP>:8787
```

3) Client URL:

```text
http://<SERVER_IP>:5173/?mode=client&room=alpha&ws=ws://<SERVER_IP>:8787
```

---

## 5) Core controls

### Keyboard
- `W A S D` — move
- `Space` — dash / dodge-roll (includes i-frames)
- `Mouse click` — fire
- `F` — shield
- `Q` — burst
- `E` — slow-time
- `1 / 2 / 3` — upgrade shield / burst / slow-time
- `4 / 5 / 6` — swap weapon (assault / shotgun / rail)
- `R` — restart after death
- `Esc` — pause menu

### Gamepad
- Left stick — move
- `A` — dash
- `RT` — fire
- `LB` — shield
- `X` — burst
- `Y` — slow-time

### Mobile
- Virtual D-pad + action buttons (auto-mounted on touch devices)

---

## 6) Systems overview

## 6.1 Combat
- Bullet weapons with spread/cooldown profiles
- Enemy projectiles and telegraphed attacks
- Damage numbers + hit flashes + kill particles
- Camera shake feedback

## 6.2 Enemies
- Archetypes: `chaser`, `tank`, `spinner`
- Elite tiers (scaling modifiers)
- Boss waves every 5th wave

## 6.3 Boss mechanics
- Intro banner + phase transitions
- Attack kits by phase:
  - spiral barrage
  - slam shockwave
  - summon adds
- Weak-point windows (bonus damage)
- Arena hazards (phase-dependent)

## 6.4 Abilities
- Shield (resource-based)
- Burst AoE (cooldown)
- Slow-time (cooldown)
- Upgrade system via points

## 6.5 Progression and persistence
Per save slot:
- progression level/XP
- ability levels/points
- controls rebinding
- settings
- best score/wave

## 6.6 UI/UX
- HUD (HP, score, wave, level, abilities, versus)
- Minimap radar
- Main menu and settings
- Pause and game-over summary

## 6.7 Netcode-prep architecture
- fixed-step clock scaffold
- snapshot buffer
- prediction smoothing layer
- protocol/transport abstraction for versus

---

## 7) Menu and settings

Main menu provides:
- start run / resume
- save slot selector
- weapon selector
- controls rebinding
- settings sliders:
  - master volume
  - SFX volume
  - camera smoothing

All are persisted to localStorage (slot-scoped where implemented).

---

## 8) Versus rules (current implementation)

- Host-authoritative score/timer/winner state
- Target score default: 1000
- Time limit default: 180 sec
- Winner = first to target, or leader at timeout

Note: current relay is minimal and trusted; production anti-cheat and hardened server validation are not yet included.

---

## 9) File map (important)

### Gameplay core
- `src/main.ts`
- `src/core/state.ts`
- `src/core/input.ts`
- `src/core/progression.ts`
- `src/core/settings.ts`
- `src/core/saveSlots.ts`
- `src/core/controls.ts`
- `src/core/balance.ts`

### Entities/systems
- `src/entities/*`
- `src/systems/*`

### UI
- `src/ui.ts`
- `src/uiMenu.ts`
- `src/uiMinimap.ts`

### Net/versus
- `src/net/protocol.ts`
- `src/net/transport.ts`
- `src/net/versus.ts`
- `src/net/simClock.ts`
- `src/net/snapshot.ts`
- `src/net/prediction.ts`
- relay server: `tools/ws-relay.mjs`

---

## 10) Common operations

### Run dev server
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

---

## 11) Troubleshooting

### Versus not syncing
- ensure both clients share exact `room`
- ensure host is running with `mode=host`
- if using WebSocket, verify relay server is running and reachable

### WebSocket connection issues
- check relay port (`8787`) firewall rules
- ensure URL protocol matches (`ws://` for non-TLS dev)
- inspect browser console for connection errors

### No controller input
- connect gamepad before opening tab
- interact with page once to grant focus/input

### Performance drops
- reduce browser tabs/background apps
- lower render load (future setting can be added for quality scaling)

---

## 12) Security and production notes

Current relay (`tools/ws-relay.mjs`) is intentionally minimal for development.
For production competition deploy:
- authenticated sessions
- authoritative server simulation or validated event pipeline
- anti-cheat checks (rate limits, impossible score deltas, replay/audit logs)
- TLS (`wss://`) endpoint behind reverse proxy

---

## 13) Recommended next milestones

1. Hardened multiplayer backend (auth + anti-cheat + persistence)
2. Matchmaking/lobby UX + reconnection flow
3. Content expansion (maps, bosses, weapons, music/assets)
4. QA/performance pass and telemetry

---

## 14) Quick start cheat sheet

```bash
# install and run
npm install
npm run dev

# local versus (2 tabs)
# host:
http://localhost:5173/?mode=host&room=alpha
# client:
http://localhost:5173/?mode=client&room=alpha

# network versus (2 devices)
node tools/ws-relay.mjs
# host:
http://<IP>:5173/?mode=host&room=alpha&ws=ws://<IP>:8787
# client:
http://<IP>:5173/?mode=client&room=alpha&ws=ws://<IP>:8787
```

---

End of manual.
