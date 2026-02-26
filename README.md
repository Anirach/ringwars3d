# 🎮 RINGwars 3D

> *A 3D browser-based strategy game where AI agents battle on a circular ring battlefield — write your agent in Java, Python, or JavaScript and watch it fight.*

![Version](https://img.shields.io/badge/version-0.18--prototype-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Built With](https://img.shields.io/badge/built%20with-Three.js%20%2B%20TypeScript-blueviolet)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

---

> 🎮 **Screenshot coming soon**

---

## ✨ Features

| Turn-Based Strategy | Arena Action Mode |
|---|---|
| 🔵 20-node circular battlefield | 🎯 Third-person arena shooter |
| 🤖 Red vs Blue AI agent battles | 👾 Boss battles & wave survival |
| 🌐 Multi-language agent support | ⚔️ Local versus mode |
| ⚙️ Configurable game parameters | 🎮 Controller & touch support |
| 📊 Real-time 3D visualization | 💾 Save slots & settings |
| 🔁 Sudden death & decay mechanics | 🌐 Cross-device WebSocket relay |

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+, npm, modern browser (Chrome / Edge / Firefox)

```bash
# 1. Clone the repository
git clone https://github.com/Anirach/ringwars3d.git
cd ringwars3d

# 2. Install dependencies
npm install

# 3. Start the game server (Terminal 1)
npm run dev

# 4. Start the agent server (Terminal 2)
npm run agent-server
```

Then open your browser:
- **RINGwars Strategy:** http://localhost:5173/ringwars.html
- **Arena Mode:** http://localhost:5173/

---

## 🎮 Game Modes

### ♟️ RINGwars — Turn-Based Strategy

AI agents compete to control a 20-node circular battlefield. Each turn, agents read the game state and issue movement commands. The agent that controls the most nodes wins.

| Mechanic | Description |
|---|---|
| **Battlefield** | 20 nodes arranged in a ring |
| **Players** | Red vs Blue (AI-controlled) |
| **Units** | Fernies — grow each turn based on territory |
| **Visibility** | Limited to nodes within range of owned territory |
| **Victory** | Eliminate opponent or hold majority at turn limit |
| **Sudden Death** | Decay activates after configurable turn threshold |

### 🏟️ Arena Mode — Action

Single-player or versus survival arena with third-person perspective.

| Feature | Description |
|---|---|
| **Boss Phase** | Escalating boss encounters with special mechanics |
| **Progression** | Upgrades and power-ups during runs |
| **Versus** | Local tabs or cross-device via WebSocket relay |
| **Input** | Keyboard, controller, and touch support |

---

## 🤖 AI Agent Development

Write your own agent in **Java**, **Python**, or **Node.js** and upload it directly in the game UI.

### Supported Languages

| Language | Format | Execution |
|---|---|---|
| **Java** | `.jar` file | `java -jar agent.jar <step> <player>` |
| **Python** | `.py` file | `python3 agent.py <step> <player>` |
| **Node.js** | `.js` file | `node agent.js <step> <player>` |

<details>
<summary>📋 Agent Protocol — Input / Output Format</summary>

### Input — `.step` file (game state)

Your agent receives the current game state each turn via a `.step` file:

```
<turn_number>
<total_nodes>
<node_id> <owner> <fernies_count>
...
```

- `owner`: `0` = neutral, `1` = Red, `2` = Blue
- `fernies_count`: number of Fernie units on that node

### Output — `.move` file (your moves)

Write your moves to a `.move` file, one move per line:

```
<from_node>,<to_node>,<amount>
```

**Example:**
```
3,4,10
3,2,5
```

Moves are processed simultaneously each turn.

### Example Agents

The `server/agents/` directory contains ready-to-use example agents:

| Agent | Language | Strategy |
|---|---|---|
| `aggressive_agent.py` | Python | Maximum expansion, high-risk |
| `defensive_agent.py` | Python | Hold territory, counterattack |
| `balanced_agent.js` | Node.js | Balanced expansion and defense |
| `expansion_agent.js` | Node.js | Fast early node capture |

</details>

---

## ⚙️ Configuration

Adjust game parameters in the RINGwars UI or via server config:

| Parameter | Default | Description |
|---|---|---|
| **Turn Limit** | `200` | Maximum turns before game ends |
| **Sudden Death** | `100` | Turn at which decay begins |
| **Decay Rate** | `15%` | Max Fernie reduction per turn (5–30%) |
| **Agent Server Port** | `3001` | Port for the agent execution server |
| **Game Server Port** | `5173` | Vite dev server port |
| **Relay Port** | `8787` | Cross-device versus WebSocket relay |

---

## 📁 Project Structure

```
ringwars3d/
├── src/
│   ├── ringwars/           # Turn-based strategy game core
│   │   ├── gameLogic.ts    # Game rules, battles, Fernie growth
│   │   ├── renderer.ts     # Three.js 3D visualization
│   │   ├── ui.ts           # Control panel & game UI
│   │   └── types.ts        # TypeScript type definitions
│   ├── entities/           # Arena mode entities
│   ├── systems/            # Game systems (physics, AI, etc.)
│   ├── main-ringwars.ts    # RINGwars entry point
│   └── main.ts             # Arena mode entry point
├── server/
│   ├── agent-server.cjs    # Agent execution & file I/O server
│   └── agents/             # Example agents (py, js, jar)
├── ringwars.html           # RINGwars strategy game page
├── index.html              # Arena mode page
├── MANUAL.md               # Full user manual
└── package.json
```

---

## 🛠️ Development

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run agent-server` | Start agent execution server (port 3001) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ by [Anirach](https://github.com/Anirach)

*Three.js · TypeScript · Node.js*

</div>
