<div align="center">

# 🎮 RINGwars 3D

### *A browser-based AI strategy game where your code fights for territory*

[![Version](https://img.shields.io/badge/version-0.18--prototype-blue?style=flat-square)](https://github.com/Anirach/ringwars3d)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![Built With](https://img.shields.io/badge/Three.js%20%2B%20TypeScript-blueviolet?style=flat-square&logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

**Write an AI agent in Java, Python, or JavaScript — then watch it battle for control of a 3D ring battlefield.**

[Quick Start](#-quick-start) · [Game Modes](#-game-modes) · [Build an Agent](#-build-your-ai-agent) · [Architecture](#-architecture) · [Manual](MANUAL.md)

</div>

---

## 🗺️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                           │
│                                                                 │
│   ┌─────────────────────┐     ┌─────────────────────────────┐  │
│   │   RINGwars Strategy │     │      Arena Action Mode      │  │
│   │  (ringwars.html)    │     │       (index.html)          │  │
│   │                     │     │                             │  │
│   │  ┌───────────────┐  │     │  ┌───────────┐ ┌────────┐  │  │
│   │  │  Three.js 3D  │  │     │  │  Entities │ │  Net   │  │  │
│   │  │   Renderer    │  │     │  │  Systems  │ │  Relay │  │  │
│   │  └───────────────┘  │     │  └───────────┘ └────────┘  │  │
│   │  ┌───────────────┐  │     │  ┌───────────────────────┐  │  │
│   │  │  Game Logic   │  │     │  │  BroadcastChannel /   │  │  │
│   │  │  (gameLogic)  │  │     │  │  WebSocket Versus     │  │  │
│   │  └───────────────┘  │     │  └───────────────────────┘  │  │
│   └──────────┬──────────┘     └─────────────────────────────┘  │
└──────────────┼──────────────────────────────────────────────────┘
               │ HTTP (fetch)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│              AGENT SERVER  (Node.js :3001)                       │
│                                                                  │
│   POST /execute-agent                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Write .step file  →  Spawn process  →  Read .move file │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│       ┌──────────────┬──────────────┬──────────────┐            │
│       │  java -jar   │  python3     │  node        │            │
│       │  agent.jar   │  agent.py    │  agent.js    │            │
│       └──────────────┴──────────────┴──────────────┘            │
└──────────────────────────────────────────────────────────────────┘
               │ ws://
               ▼
┌──────────────────────────────────────────────────────────────────┐
│         WS RELAY SERVER  (Node.js :8787)  [optional]            │
│         Cross-device versus mode relay                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

<table>
<tr>
<td width="50%">

**♟️ RINGwars — Strategy Mode**
- 20-node circular ring battlefield
- Red vs Blue AI agent competition
- Fernie units grow & decay each turn
- Multi-language agent upload (Java / Python / JS)
- Configurable turn limit, sudden death, decay rate
- Real-time 3D visualization with Three.js
- Battle resolution: Local, Edge, Triple node types

</td>
<td width="50%">

**🏟️ Arena — Action Mode**
- Third-person arena shooter
- Wave-based enemies (chaser, tank, spinner)
- Boss battles every 5th wave with phase mechanics
- Upgrade system: Shield, Burst, Slow-time
- Local versus (BroadcastChannel) & cross-device (WebSocket)
- Controller + touch input support
- Per-slot save persistence (progression, settings, best score)

</td>
</tr>
</table>

---

## 🚀 Quick Start

**Requirements:** Node.js 18+, npm, Chrome / Edge / Firefox

```bash
# Clone and install
git clone https://github.com/Anirach/ringwars3d.git
cd ringwars3d
npm install
```

### ♟️ RINGwars Strategy Mode

```bash
# Terminal 1 — Game server
npm run dev

# Terminal 2 — Agent execution server (required for AI agents)
npm run agent-server
```

Open **http://localhost:5173/ringwars.html**

### 🏟️ Arena Mode

```bash
npm run dev
```

Open **http://localhost:5173/**

---

## 🎮 Game Modes

### ♟️ RINGwars — Turn-Based Strategy

A 20-node ring battlefield where two AI agents compete for territory. Each turn, agents read the game state and deploy **Fernies** (units that grow based on controlled territory).

#### Battle Resolution

| Battle Type | Trigger | Outcome |
|---|---|---|
| **Local** | Both players place on same node | Higher count wins, loser eliminated |
| **Edge** | Opposing agents on adjacent nodes | Larger force prevails; remainder survives |
| **Triple** | Conflict across 3+ consecutive nodes | Multi-node chain resolution |

#### Game Settings

| Parameter | Default | Range | Description |
|---|---|---|---|
| Turn Limit | `200` | 50–500 | Maximum turns before game ends |
| Sudden Death | `100` | 1–499 | Turn when Fernie decay activates |
| Decay Rate | `10%` | 5–30% | Maximum Fernies reduced per turn |

---

### 🏟️ Arena Mode — Action

Solo or versus arena combat with progression and save slots.

#### Boss Wave Mechanics

Every 5th wave triggers a boss encounter with:
- **Phase transitions** — attack pattern shifts at HP thresholds
- **Attack kits**: spiral barrage → slam shockwave → summon adds
- **Weak-point windows** — timed exposure for bonus damage
- **Arena hazards** — phase-dependent environmental threats

#### Controls

| Input | Keyboard | Gamepad |
|---|---|---|
| Move | `WASD` | Left stick |
| Dash / Dodge | `Space` | `A` |
| Fire | Mouse click | `RT` |
| Shield | `F` | `LB` |
| Burst AoE | `Q` | `X` |
| Slow-time | `E` | `Y` |
| Weapons | `1` / `2` / `3` | — |
| Pause | `Esc` | — |

#### Versus Mode

```bash
# Option A — Same machine (BroadcastChannel, 2 tabs)
http://localhost:5173/?mode=host&room=alpha    # Tab 1
http://localhost:5173/?mode=client&room=alpha  # Tab 2

# Option B — Cross-device (WebSocket relay)
node tools/ws-relay.mjs                        # Start relay server

http://<IP>:5173/?mode=host&room=alpha&ws=ws://<IP>:8787    # Host device
http://<IP>:5173/?mode=client&room=alpha&ws=ws://<IP>:8787  # Client device
```

---

## 🤖 Build Your AI Agent

Write an agent in any supported language and upload it through the game UI.

### Supported Languages

| Language | File | Invocation |
|---|---|---|
| **Java** | `.jar` | `java -jar agent.jar <stepNum> <playerName>` |
| **Python** | `.py` | `python3 agent.py <stepNum> <playerName>` |
| **Node.js** | `.js` | `node agent.js <stepNum> <playerName>` |

### Agent Protocol

**Input** — read `<stepNum>.step`:

```
10,15,-1,20,8,...      ← Line 1: Fernie count per node (-1 = hidden/fog)
Y,Y,H,N,U,...          ← Line 2: Node owner  (Y=you · N=enemy · U=neutral · H=hidden)
25                     ← Line 3: New Fernies available this turn
10000                  ← Line 4: Current max Fernies per node cap
```

**Output** — write `<playerName>.move`:

```
5,20    ← Place 20 Fernies on node 5
3,10    ← Place 10 Fernies on node 3
```

> Each line = one placement. You can place on multiple nodes per turn.
> Total placed cannot exceed available Fernies (Line 3 of input).

### Example Agents

Four reference agents are included in `server/agents/`:

| Agent | Language | Strategy |
|---|---|---|
| `aggressive_agent.py` | Python | Attack weakest enemy node each turn |
| `defensive_agent.py` | Python | Build force to 2× opponent before attacking |
| `expansion_agent.js` | Node.js | Rapidly capture neutral nodes early game |
| `balanced_agent.js` | Node.js | Adapts strategy based on current game phase |
| `RINGwars_*_Cornelia.jar` | Java | Student submission — competition agent |
| `RINGwars_*_Vanessa.jar` | Java | Student submission — competition agent |

### Upload Your Agent

1. Click **Upload Agent** in the RINGwars UI
2. Select your `.jar`, `.py`, or `.js` file
3. Assign to **Red** or **Blue** from the dropdown
4. Click **Reset** → **Start Game**

---

## 📁 Project Structure

```
ringwars3d/
│
├── src/
│   ├── ringwars/               # ♟️ Strategy mode core
│   │   ├── index.ts            #    Game orchestration & AI turn execution
│   │   ├── gameLogic.ts        #    Rules: battles, Fernie growth, sudden death
│   │   ├── renderer.ts         #    Three.js ring & node 3D visualization
│   │   ├── ui.ts               #    Control panel, agent upload, settings
│   │   └── types.ts            #    TypeScript types & game settings interfaces
│   │
│   ├── entities/               # 🏟️ Arena mode entity definitions
│   ├── systems/                #    Arena game systems (physics, AI, combat)
│   ├── net/
│   │   ├── protocol.ts         #    Message schema for versus mode
│   │   ├── transport.ts        #    BroadcastChannel / WebSocket abstraction
│   │   ├── versus.ts           #    Versus session management
│   │   ├── simClock.ts         #    Fixed-step simulation clock
│   │   ├── snapshot.ts         #    State snapshot buffer
│   │   └── prediction.ts       #    Client-side prediction & smoothing
│   │
│   ├── core/
│   │   ├── state.ts            #    Global game state
│   │   ├── input.ts            #    Keyboard / gamepad / touch unified input
│   │   ├── progression.ts      #    XP, levels, ability upgrades
│   │   ├── saveSlots.ts        #    LocalStorage persistence (3 slots)
│   │   ├── settings.ts         #    Audio, camera, control settings
│   │   └── balance.ts          #    Tuning constants
│   │
│   ├── main-ringwars.ts        # ♟️ RINGwars entry point
│   └── main.ts                 # 🏟️ Arena entry point
│
├── server/
│   ├── agent-server.cjs        # Agent execution server (port 3001)
│   └── agents/                 # Example & competition agents
│
├── tools/
│   └── ws-relay.mjs            # WebSocket relay for cross-device versus
│
├── ringwars.html               # RINGwars strategy page
├── index.html                  # Arena mode page
├── MANUAL.md                   # Full user & developer manual
├── vite.config.ts
└── package.json
```

---

## 🛠️ Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server at `http://localhost:5173` |
| `npm run agent-server` | Start agent execution server at `:3001` |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `node tools/ws-relay.mjs` | Start WebSocket relay server at `:8787` |

---

## 🔒 Production & Security Notes

> The current relay server (`tools/ws-relay.mjs`) is **intentionally minimal** for development use.

For a production competition deployment, add:

- [ ] Authenticated sessions (JWT / OAuth)
- [ ] Authoritative server-side game simulation
- [ ] Anti-cheat: rate limits, impossible-delta detection, replay audit logs
- [ ] TLS endpoint (`wss://`) behind a reverse proxy
- [ ] Input validation on all agent `.move` files

---

## 🗺️ Roadmap

| Priority | Milestone |
|---|---|
| 🔴 High | Hardened multiplayer backend (auth + anti-cheat + persistence) |
| 🟡 Medium | Matchmaking / lobby UX + reconnection flow |
| 🟡 Medium | Expanded content (maps, bosses, weapons, audio) |
| 🟢 Nice to have | QA / performance pass + telemetry + mobile optimization |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
Full documentation: [MANUAL.md](MANUAL.md)

---

<div align="center">

Built with ❤️ by [Anirach](https://github.com/Anirach)

*Three.js · TypeScript · Vite · Node.js*

</div>
