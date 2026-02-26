# RINGwars 3D — Full User Manual

Version: Prototype v0.18 (with Turn-Based Strategy Mode)

---

## 1) What this system is

RINGwars 3D is a browser-based game with two modes:

### 1.1 RINGwars Turn-Based Strategy
- AI agent competition on a circular ring battlefield
- Multi-language agent support (Java JAR, Python, Node.js)
- Configurable game settings (turn limit, sudden death, decay rate)
- 3D visualization with Three.js

### 1.2 Arena Action Mode
- Single-player survival loop
- Boss phase mechanics
- Progression and upgrades
- Save slots and settings persistence
- Controller + touch support
- Versus mode (local tabs + cross-device WebSocket relay)

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

## 4) RINGwars Turn-Based Strategy Mode

### 4.1 Quick Start

1. Start the game server:
```bash
npm run dev
```

2. Start the agent server (separate terminal):
```bash
npm run agent-server
```

3. Open the game:
```text
http://localhost:5173/ringwars.html
```

### 4.2 Game Rules

- **Battlefield**: 20 nodes arranged in a ring
- **Players**: Red vs Blue (AI agents)
- **Units**: Fernies (grow each turn based on territory)
- **Visibility**: Each player can only see nodes within range of owned territory
- **Victory**: Eliminate opponent or have more Fernies when turn limit reached

### 4.3 Battle Types

| Battle Type | Condition | Resolution |
|-------------|-----------|------------|
| **Local** | Both players place on same node | Higher count wins, loser loses all |
| **Edge** | Adjacent nodes owned by opponents | Larger force wins, difference survives |
| **Triple** | Three consecutive nodes with conflict | Complex multi-node resolution |

### 4.4 Game Settings (UI Controls)

| Setting | Default | Description |
|---------|---------|-------------|
| Turn Limit | 200 | Maximum turns before game ends |
| Sudden Death | 100 | Turn when sudden death begins |
| Decay Rate | 10% | Max Fernies reduced each turn in sudden death |

### 4.5 AI Agent Support

#### Supported Languages
- **Java JAR**: `java -jar agent.jar <stepNum> <playerName>`
- **Python**: `python3 agent.py <stepNum> <playerName>`
- **Node.js**: `node agent.js <stepNum> <playerName>`

#### Agent Protocol

**Input** — `<stepNum>.step` file:
```
10,15,-1,20,8,...      # Line 1: Fernie count per node (-1 = hidden)
Y,Y,H,N,U,...          # Line 2: Owner (Y=you, N=enemy, U=neutral, H=hidden)
25                      # Line 3: New Fernies available this turn
10000                   # Line 4: Current max Fernies per node
```

**Output** — `<playerName>.move` file:
```
5,20                    # Place 20 Fernies on node 5
3,10                    # Place 10 Fernies on node 3
```

#### Example Agents (in `server/agents/`)

| Agent | Language | Strategy |
|-------|----------|----------|
| `aggressive_agent.py` | Python | Attack weak enemies first |
| `defensive_agent.py` | Python | Build up forces, attack with 2x advantage |
| `expansion_agent.js` | Node.js | Rapidly expand territory |
| `balanced_agent.js` | Node.js | Adapts strategy based on game phase |

### 4.6 Uploading Custom Agents

1. Click **Upload Agent** button in the UI
2. Select your agent file (.jar, .py, or .js)
3. Select agent from Red/Blue dropdown
4. Click **Reset** then **Start Game**

---

## 5) Arena Action Mode

### 5.1 Solo mode
Open normally:

```text
http://localhost:5173
```

### 5.2 Versus (same browser/machine, BroadcastChannel)
Host tab:

```text
http://localhost:5173/?mode=host&room=alpha
```

Client tab:

```text
http://localhost:5173/?mode=client&room=alpha
```

### 5.3 Versus (cross-device/network, WebSocket)
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

## 6) Core controls (Arena Mode)

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

## 7) Systems overview (Arena Mode)

## 7.1 Combat
- Bullet weapons with spread/cooldown profiles
- Enemy projectiles and telegraphed attacks
- Damage numbers + hit flashes + kill particles
- Camera shake feedback

## 7.2 Enemies
- Archetypes: `chaser`, `tank`, `spinner`
- Elite tiers (scaling modifiers)
- Boss waves every 5th wave

## 7.3 Boss mechanics
- Intro banner + phase transitions
- Attack kits by phase:
  - spiral barrage
  - slam shockwave
  - summon adds
- Weak-point windows (bonus damage)
- Arena hazards (phase-dependent)

## 7.4 Abilities
- Shield (resource-based)
- Burst AoE (cooldown)
- Slow-time (cooldown)
- Upgrade system via points

## 7.5 Progression and persistence
Per save slot:
- progression level/XP
- ability levels/points
- controls rebinding
- settings
- best score/wave

## 7.6 UI/UX
- HUD (HP, score, wave, level, abilities, versus)
- Minimap radar
- Main menu and settings
- Pause and game-over summary

## 7.7 Netcode-prep architecture
- fixed-step clock scaffold
- snapshot buffer
- prediction smoothing layer
- protocol/transport abstraction for versus

---

## 8) Menu and settings

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

## 9) Versus rules (current implementation)

- Host-authoritative score/timer/winner state
- Target score default: 1000
- Time limit default: 180 sec
- Winner = first to target, or leader at timeout

Note: current relay is minimal and trusted; production anti-cheat and hardened server validation are not yet included.

---

## 10) File map (important)

### RINGwars Turn-Based Strategy
- `src/ringwars/index.ts` — Game orchestration, AI execution
- `src/ringwars/gameLogic.ts` — Game rules, battles, Fernie growth
- `src/ringwars/renderer.ts` — Three.js ring visualization
- `src/ringwars/ui.ts` — Control panel, agent selection, settings
- `src/ringwars/types.ts` — Type definitions, game settings
- `server/agent-server.cjs` — Agent execution server (JAR/Python/Node.js)
- `server/agents/*` — Example agents

### Arena Mode - Gameplay core
- `src/main.ts`
- `src/core/state.ts`
- `src/core/input.ts`
- `src/core/progression.ts`
- `src/core/settings.ts`
- `src/core/saveSlots.ts`
- `src/core/controls.ts`
- `src/core/balance.ts`

### Arena Mode - Entities/systems
- `src/entities/*`
- `src/systems/*`

### Arena Mode - UI
- `src/ui.ts`
- `src/uiMenu.ts`
- `src/uiMinimap.ts`

### Arena Mode - Net/versus
- `src/net/protocol.ts`
- `src/net/transport.ts`
- `src/net/versus.ts`
- `src/net/simClock.ts`
- `src/net/snapshot.ts`
- `src/net/prediction.ts`
- relay server: `tools/ws-relay.mjs`

---

## 11) Common operations

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

## 12) Troubleshooting

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

## 13) Security and production notes

Current relay (`tools/ws-relay.mjs`) is intentionally minimal for development.
For production competition deploy:
- authenticated sessions
- authoritative server simulation or validated event pipeline
- anti-cheat checks (rate limits, impossible score deltas, replay/audit logs)
- TLS (`wss://`) endpoint behind reverse proxy

---

## 14) Recommended next milestones

1. Hardened multiplayer backend (auth + anti-cheat + persistence)
2. Matchmaking/lobby UX + reconnection flow
3. Content expansion (maps, bosses, weapons, music/assets)
4. QA/performance pass and telemetry

---

## 15) Quick start cheat sheet

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
