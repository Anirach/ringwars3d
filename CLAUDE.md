# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run agent-server # Start agent server (port 3001) - separate terminal
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

**Stack**: Three.js + TypeScript + Vite

RINGwars 3D is a turn-based strategy game where AI agents compete on a circular ring battlefield. Features multi-language agent support (Java JAR, Python, Node.js).

### Entry Point
[main-ringwars.ts](src/main-ringwars.ts) - Initializes the RINGwars game

### Game Logic (`src/ringwars/`)
- [types.ts](src/ringwars/types.ts) - Game types, settings (turn limit, sudden death, decay)
- [gameLogic.ts](src/ringwars/gameLogic.ts) - Turn execution, battle resolution, Fernie growth
- [renderer.ts](src/ringwars/renderer.ts) - Three.js ring visualization (20 nodes)
- [ui.ts](src/ringwars/ui.ts) - Control panel, agent selection, settings, file upload
- [index.ts](src/ringwars/index.ts) - Game orchestration, AI execution loop

### Agent Server (`server/`)
- [agent-server.cjs](server/agent-server.cjs) - Executes agents in Java/Python/Node.js
- `server/agents/` - Example agents (aggressive, defensive, expansion, balanced)

## Agent Protocol

Agents receive a `.step` file and must output a `.move` file:

**Input** (`<stepNum>.step`):
```
10,15,-1,20,8,...    # Fernie count per node (-1 = hidden)
Y,Y,H,N,U,...        # Owner (Y=you, N=enemy, U=neutral, H=hidden)
25                   # New Fernies available this turn
10000                # Current max Fernies per node
```

**Output** (`<agentName>.move`):
```
5,20                 # Place 20 Fernies on node 5
3,10                 # Place 10 Fernies on node 3
```

**Execution commands by language**:
| Extension | Command |
|-----------|---------|
| `.jar` | `java -jar <file> <stepNum> <agentName>` |
| `.py` | `python3 <file> <stepNum> <agentName>` |
| `.js` | `node <file> <stepNum> <agentName>` |

## Game Rules

- **Battlefield**: 20 nodes in a ring
- **Players**: Red vs Blue (AI agents)
- **Units**: Fernies grow each turn based on owned territory
- **Visibility**: Each player only sees nodes within range of owned territory
- **Victory**: Eliminate opponent or have more Fernies at turn limit
- **Sudden Death**: After configured turn, max Fernies per node decays each turn
