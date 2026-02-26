<div align="center">

# RINGwars 3D

### *A browser-based AI strategy game where your code fights for territory*

[![Version](https://img.shields.io/badge/version-1.0-blue?style=flat-square)](https://github.com/Anirach/ringwars3d)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![Built With](https://img.shields.io/badge/Three.js%20%2B%20TypeScript-blueviolet?style=flat-square&logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

**Write an AI agent in Java, Python, or JavaScript — then watch it battle for control of a 3D ring battlefield.**

[Quick Start](#-quick-start) · [Game Rules](#-game-rules) · [Build an Agent](#-build-your-ai-agent) · [Manual](MANUAL.md)

</div>

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER CLIENT                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                 RINGwars Strategy Game                   │  │
│   │                                                         │  │
│   │  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │  │
│   │  │  Three.js 3D  │  │  Game Logic   │  │  Control UI │ │  │
│   │  │   Renderer    │  │  (gameLogic)  │  │  (agents)   │ │  │
│   │  └───────────────┘  └───────────────┘  └─────────────┘ │  │
│   └──────────────────────────┬──────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
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
```

---

## Features

- 20-node circular ring battlefield
- Red vs Blue AI agent competition
- Fernie units grow & decay each turn
- Multi-language agent upload (Java / Python / JS)
- Configurable turn limit, sudden death, decay rate
- Real-time 3D visualization with Three.js
- Battle resolution: Local, Edge, Triple node types

---

## Quick Start

**Requirements:** Node.js 18+, npm, Chrome / Edge / Firefox

```bash
# Clone and install
git clone https://github.com/Anirach/ringwars3d.git
cd ringwars3d
npm install

# Terminal 1 — Game server
npm run dev

# Terminal 2 — Agent execution server (required for AI agents)
npm run agent-server
```

Open **http://localhost:5173**

---

## Game Rules

A 20-node ring battlefield where two AI agents compete for territory. Each turn, agents read the game state and deploy **Fernies** (units that grow based on controlled territory).

### Battle Resolution

| Battle Type | Trigger | Outcome |
|---|---|---|
| **Local** | Both players place on same node | Higher count wins, loser eliminated |
| **Edge** | Opposing agents on adjacent nodes | Larger force prevails; remainder survives |
| **Triple** | Conflict across 3+ consecutive nodes | Multi-node chain resolution |

### Game Settings

| Parameter | Default | Range | Description |
|---|---|---|---|
| Turn Limit | `200` | 50–500 | Maximum turns before game ends |
| Sudden Death | `100` | 1–499 | Turn when Fernie decay activates |
| Decay Rate | `10%` | 5–30% | Maximum Fernies reduced per turn |

---

## Build Your AI Agent

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
| `defensive_agent.py` | Python | Build force to 2x opponent before attacking |
| `expansion_agent.js` | Node.js | Rapidly capture neutral nodes early game |
| `balanced_agent.js` | Node.js | Adapts strategy based on current game phase |

### Upload Your Agent

1. Click **Upload Agent** in the UI
2. Select your `.jar`, `.py`, or `.js` file
3. Assign to **Red** or **Blue** from the dropdown
4. Click **Reset** then **Start Game**

---

## Project Structure

```
ringwars3d/
│
├── src/
│   ├── ringwars/               # Strategy mode core
│   │   ├── index.ts            #    Game orchestration & AI turn execution
│   │   ├── gameLogic.ts        #    Rules: battles, Fernie growth, sudden death
│   │   ├── renderer.ts         #    Three.js ring & node 3D visualization
│   │   ├── ui.ts               #    Control panel, agent upload, settings
│   │   └── types.ts            #    TypeScript types & game settings interfaces
│   │
│   └── main-ringwars.ts        # Entry point
│
├── server/
│   ├── agent-server.cjs        # Agent execution server (port 3001)
│   └── agents/                 # Example agents
│
├── index.html                  # Game page
├── MANUAL.md                   # Full user & developer manual
├── vite.config.ts
└── package.json
```

---

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server at `http://localhost:5173` |
| `npm run agent-server` | Start agent execution server at `:3001` |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

---

## Documentation

See [MANUAL.md](MANUAL.md) for complete documentation including:
- Game rules and battle mechanics
- Agent protocol specification
- Writing custom agents
- Troubleshooting guide

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with Three.js, TypeScript, Vite, and Node.js

</div>
