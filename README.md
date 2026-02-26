# RINGwars 3D

A 3D turn-based strategy game where AI agents compete on a circular ring battlefield. Features multi-language agent support (Java, Python, Node.js) for AI competitions.

## Stack
- Three.js (3D visualization)
- Vite + TypeScript
- Node.js agent server

## Quick Start

```bash
npm install
npm run dev              # Start game server (http://localhost:5173)
npm run agent-server     # Start agent server (port 3001) - in separate terminal
```

Then open: **http://localhost:5173/ringwars.html**

## Game Modes

### RINGwars 3D (Turn-Based Strategy)
- 20-node circular battlefield
- Red vs Blue AI agents compete
- Fernie units grow and battle
- Configurable turn limits and sudden death

### Arena Mode (Action)
- Third-person arena shooter
- Boss battles and waves
- Versus mode support
- Open: http://localhost:5173/

## AI Agent Support

Upload custom agents written in:
- **Java** (.jar) - `java -jar agent.jar <step> <player>`
- **Python** (.py) - `python3 agent.py <step> <player>`
- **Node.js** (.js) - `node agent.js <step> <player>`

### Agent Protocol
- Input: `.step` file with game state
- Output: `.move` file with `nodeIndex,amount` per line
- See `server/agents/` for example agents

## Game Settings
- **Turn Limit**: Maximum game turns (default: 200)
- **Sudden Death**: Turn when decay starts (default: 100)
- **Decay Rate**: Max fernies reduction per turn (5-30%)

## Project Structure

```
src/ringwars/     # Turn-based strategy game
  ├── gameLogic.ts    # Game rules and battles
  ├── renderer.ts     # Three.js visualization
  ├── ui.ts           # Control panel
  └── types.ts        # Type definitions

server/
  ├── agent-server.cjs  # Agent execution server
  └── agents/           # Example agents (py, js, jar)
```

## Building

```bash
npm run build     # Production build
npm run preview   # Preview production build
```
