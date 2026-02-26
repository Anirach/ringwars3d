<div align="center">

# 🎮 RINGwars 3D

### *Write an AI agent. Watch it fight for territory on a 3D ring battlefield.*

[![Version](https://img.shields.io/badge/version-1.0-blue?style=flat-square)](https://github.com/Anirach/ringwars3d)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square)](https://nodejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=threedotjs)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

**A browser-based AI competition platform — two agents battle on a 20-node 3D ring.  
Write your strategy in Java, Python, or JavaScript and let it fight.**

[Quick Start](#-quick-start) · [How It Works](#%EF%B8%8F-how-it-works) · [Build an Agent](#-build-your-ai-agent) · [Game Rules](#-game-rules) · [Full Manual](MANUAL.md)

</div>

---

## ✨ Features

- **20-node circular ring battlefield** visualized in real-time 3D with Three.js
- **Multi-language AI agents** — upload Java `.jar`, Python `.py`, or Node.js `.js`
- **Fog of war** — agents only see nodes within their `visibilityRange`
- **Fernie growth economy** — units grow each turn based on territory held
- **Sudden death** — max Fernies per node decays after a configurable turn threshold
- **Three battle types** — Local, Edge, and Triple node conflict resolution
- **Configurable parameters** — turn limit, growth rate, decay, visibility, and more
- **Built-in example agents** — aggressive, defensive, expansion, and balanced strategies

---

## 🚀 Quick Start

**Requirements:** Node.js ≥ 18 · npm · Chrome / Edge / Firefox

```bash
# 1. Clone and install
git clone https://github.com/Anirach/ringwars3d.git
cd ringwars3d
npm install

# 2. Start game server (Terminal 1)
npm run dev              # → http://localhost:5173

# 3. Start agent server (Terminal 2) — required for AI agent execution
npm run agent-server     # → http://localhost:3001
```

Open **http://localhost:5173** in your browser.

---

## ⚙️ How It Works

### System Architecture

```mermaid
graph TD
    Browser["🌐 Browser Client\nhttp://localhost:5173"]

    subgraph "Game Engine (TypeScript)"
        GL["gameLogic.ts\nTurn resolution · Battles · Growth"]
        R["renderer.ts\nThree.js 3D Ring Visualization"]
        UI["ui.ts\nControl Panel · Agent Upload"]
    end

    subgraph "Agent Server (Node.js :3001)"
        AS["agent-server.cjs\nPOST /execute-agent"]
        FS["File I/O\nWrite .step → Read .move"]
    end

    subgraph "Agent Processes"
        J["java -jar agent.jar"]
        P["python3 agent.py"]
        N["node agent.js"]
    end

    Browser --> GL
    GL --> R
    GL --> UI
    GL -->|"HTTP POST\nstepData"| AS
    AS --> FS
    FS --> J & P & N
    J & P & N -->|"moves[]"| FS
    FS -->|"return moves"| GL
```

---

### Turn Sequence

```mermaid
sequenceDiagram
    participant UI as 🖥️ Browser UI
    participant GL as ⚙️ Game Logic
    participant AS as 🔌 Agent Server :3001
    participant AG as 🤖 Agent Process

    UI->>GL: startTurn()
    GL->>GL: computeNewFernies()
    GL->>GL: checkSuddenDeath()
    GL->>AS: POST /execute-agent { stepNum, player, stepData }
    AS->>AS: write stepNum.step
    AS->>AG: spawn process
    note over AG: read .step<br/>compute strategy<br/>write .move
    AG-->>AS: player.move file
    AS-->>GL: moves[]
    GL->>GL: validateMoves()
    GL->>GL: resolveBattles()
    GL->>GL: updateOwnership()
    GL->>GL: growFernies()
    GL-->>UI: render updated state
    UI->>UI: advance to next turn
```

---

### Game State Machine

```mermaid
stateDiagram-v2
    [*] --> Planning : createInitialState()

    Planning --> Resolution : both agents submit moves
    Resolution --> Planning  : turn complete · no winner yet
    Resolution --> GameOver  : elimination OR turn limit reached

    GameOver --> Planning : reset()

    note right of Planning
        • Generate new Fernies for both players
        • Check sudden death activation
        • Agents read .step and write .move
    end note

    note right of Resolution
        • Validate all moves
        • Resolve battles (clockwise/counterclockwise)
        • Apply sudden death cap decay
        • Update node ownership
    end note

    note right of GameOver
        Winner = last agent standing
        OR agent with most Fernies at turn limit
    end note
```

---

### Agent Execution Flow

```mermaid
flowchart LR
    A["Browser\nPOST /execute-agent"] --> B["Write\nstepNum.step"]
    B --> C{File\nextension?}
    C -->|.jar| D["java -jar\nagent.jar"]
    C -->|.py|  E["python3\nagent.py"]
    C -->|.js|  F["node\nagent.js"]
    D & E & F --> G["Agent reads\n.step file"]
    G --> H["Agent writes\nplayer.move file"]
    H --> I{Valid\nmoves?}
    I -->|Yes| J["Return moves[]\nto game logic"]
    I -->|No / timeout| K["Return []\nempty — skip turn"]
    J & K --> L["Resolve\nbattles"]
```

---

## 🤖 Build Your AI Agent

### Supported Languages

| Language | File | Command |
|---|---|---|
| **Java** | `.jar` | `java -jar agent.jar <stepNum> <playerName>` |
| **Python** | `.py` | `python3 agent.py <stepNum> <playerName>` |
| **Node.js** | `.js` | `node agent.js <stepNum> <playerName>` |

---

### Input — `<stepNum>.step`

```
10,15,-1,20,8,0,5,12,-1,3,0,0,7,4,-1,0,0,9,6,0
Y,Y,H,N,U,U,N,N,H,U,U,U,N,N,H,U,U,N,Y,U
25
10000
```

| Line | Content | Values |
|---|---|---|
| **Line 1** | Fernie count per node | Integer · `-1` = hidden (fog of war) |
| **Line 2** | Node owner per node | `Y`=you · `N`=enemy · `U`=neutral · `H`=hidden |
| **Line 3** | New Fernies available this turn | Integer |
| **Line 4** | Current max Fernies per node | Integer (decreases in sudden death) |

> Nodes are ordered `0` → `ringSize-1`. Node `0` is adjacent to node `1` and node `ringSize-1`.

---

### Output — `<playerName>.move`

```
5,20
3,10
```

Each line = `nodeIndex,amount` — place `amount` Fernies on node `nodeIndex`.

> **Rules:** total placed ≤ Line 3 · target node must be owned or adjacent to owned node · partial moves are accepted.

---

### Python Agent Starter Template

```python
import sys

def parse_step(step_num):
    with open(f"{step_num}.step") as f:
        lines = f.read().strip().split('\n')
    fernies  = list(map(int, lines[0].split(',')))
    owners   = lines[1].split(',')     # Y / N / U / H
    new_f    = int(lines[2])           # Available Fernies to place
    max_cap  = int(lines[3])           # Current node cap
    return fernies, owners, new_f, max_cap

def compute_moves(fernies, owners, new_f, ring_size=20):
    moves = []
    remaining = new_f

    # Example: place on your own nodes (balanced distribution)
    my_nodes = [i for i, o in enumerate(owners) if o == 'Y']
    if not my_nodes:
        return moves

    per_node = remaining // len(my_nodes)
    for node in my_nodes:
        if per_node <= 0:
            break
        moves.append(f"{node},{per_node}")
        remaining -= per_node

    return moves

step_num = sys.argv[1]
player   = sys.argv[2]

fernies, owners, new_f, max_cap = parse_step(step_num)
moves = compute_moves(fernies, owners, new_f)

with open(f"{player}.move", 'w') as f:
    f.write('\n'.join(moves))
```

---

### Example Agents (in `server/agents/`)

| Agent | Language | Strategy |
|---|---|---|
| `aggressive_agent.py` | Python | Always attack the weakest enemy-adjacent node |
| `defensive_agent.py` | Python | Accumulate 2× opponent's force before striking |
| `expansion_agent.js` | Node.js | Rapid early-game neutral node capture |
| `balanced_agent.js` | Node.js | Phase-adaptive: expand → consolidate → attack |

---

### Upload & Run

1. Open **http://localhost:5173**
2. Click **Upload Agent** → select your `.jar` / `.py` / `.js`
3. Assign to **Red** or **Blue** in the dropdown
4. Click **Reset** → **Start Game**

---

## 🎯 Game Rules

### Fernie Growth

Each turn, each player receives new Fernies:

```
newFernies = ⌊totalOwnedFernies × growthPercent⌋
           + ⌊nodesControlled × nodeOwnershipBonus × totalOwnedFernies⌋
```

### Battle Resolution

| Battle Type | Trigger | Outcome |
|---|---|---|
| **Local** | Both agents place on the same node | Higher count wins · loser loses all Fernies |
| **Edge** | Opposing agents hold adjacent nodes | Larger force wins · survivor count = difference |
| **Triple** | Conflict spans 3+ consecutive nodes | Chain resolved in `resolutionDirection` order |

### Sudden Death

After `suddenDeathTurn`, the max Fernies cap decays each turn:

```
currentMaxFernies = currentMaxFernies - ⌊currentMaxFernies × suddenDeathDecay⌋
```

Nodes over the new cap lose excess Fernies — forcing aggressive play.

### Victory Conditions

| Condition | Winner |
|---|---|
| Opponent reaches 0 total Fernies | You |
| Turn limit reached — unequal Fernies | Most Fernies |
| Turn limit reached — equal Fernies | Draw |

### Default Settings

| Parameter | Default | Description |
|---|---|---|
| `ringSize` | `20` | Number of nodes on the ring |
| `startingFernies` | `75` | Initial Fernies per player |
| `growthPercent` | `10%` | Fernie growth per turn |
| `maxFerniesPerNode` | `10,000` | Hard cap per node |
| `visibilityRange` | `5` | Nodes visible from owned territory |
| `nodeOwnershipBonus` | `10%` | Extra growth per owned node |
| `turnLimit` | `200` | Max turns |
| `suddenDeathTurn` | `100` | Turn sudden death begins |
| `suddenDeathDecay` | `10%` | Cap reduction per turn in sudden death |

---

## 📁 Project Structure

```
ringwars3d/
│
├── src/
│   ├── ringwars/
│   │   ├── index.ts        # Game orchestrator: turn loop, AI execution, autoplay
│   │   ├── gameLogic.ts    # Rules: Fernie growth, battles, sudden death, .step/.move I/O
│   │   ├── renderer.ts     # Three.js: ring nodes, ownership colors, battle animations
│   │   ├── ui.ts           # Control panel: agent upload, settings, step/autoplay controls
│   │   └── types.ts        # Types: GameState, RingNode, Move, BattleResult, DEFAULT_SETTINGS
│   │
│   └── main-ringwars.ts    # Entry point
│
├── server/
│   ├── agent-server.cjs    # HTTP :3001 — receives agents, spawns processes, returns moves
│   └── agents/             # Example & competition agents (.py · .js · .jar)
│
├── index.html              # Game page
├── MANUAL.md               # Full user & developer documentation
├── vite.config.ts
└── package.json
```

---

## 🛠️ Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server → `http://localhost:5173` |
| `npm run agent-server` | Agent execution server → `:3001` |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

---

## 📄 License

MIT — see [LICENSE](LICENSE) · Full documentation: [MANUAL.md](MANUAL.md)

---

<div align="center">

Built with ❤️ by [Anirach](https://github.com/Anirach)

*Three.js · TypeScript · Vite · Node.js*

</div>
