# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Versus Mode (Multiplayer)

Local versus (same browser, BroadcastChannel):
- Host: `http://localhost:5173/?mode=host&room=alpha`
- Client: `http://localhost:5173/?mode=client&room=alpha`

Cross-device versus (WebSocket):
```bash
node tools/ws-relay.mjs  # Start relay on ws://localhost:8787
```
- Host: `http://<IP>:5173/?mode=host&room=alpha&ws=ws://<IP>:8787`
- Client: `http://<IP>:5173/?mode=client&room=alpha&ws=ws://<IP>:8787`

## Architecture

**Stack**: Three.js + TypeScript + Vite

### Entry Point and Game Loop
[main.ts](src/main.ts) - Single-file orchestrator containing:
- Three.js scene setup (renderer, camera, lighting, arena)
- Main `animate()` loop with fixed timestep simulation
- Input handling and ability triggers
- Wave spawning and game state transitions
- Netcode-prep: fixed-step clock + snapshot buffer for future multiplayer

### Core Layer (`src/core/`)
Game state and persistence, separated from rendering:
- [state.ts](src/core/state.ts) - `GameState` type: HP, score, wave, cooldowns, invuln timers
- [input.ts](src/core/input.ts) - Keyboard, gamepad, and mobile touch input
- [progression.ts](src/core/progression.ts) - XP/level system with ability points
- [settings.ts](src/core/settings.ts) - Volume, camera smoothing (localStorage)
- [saveSlots.ts](src/core/saveSlots.ts) - Multi-slot save system
- [controls.ts](src/core/controls.ts) - Rebindable keybindings
- [balance.ts](src/core/balance.ts) - Wave scaling formulas (enemy fire rate, projectile speed, shooter counts)

### Entity Types (`src/entities/`)
Data types and factory functions:
- [types.ts](src/entities/types.ts) - `Bullet`, `Enemy`, `WeaponType`, `EnemyArchetype`
- [player.ts](src/entities/player.ts) - Player mesh creation
- [bullet.ts](src/entities/bullet.ts) - Weapon fire patterns (assault/shotgun/rail)
- [enemy.ts](src/entities/enemy.ts) - Enemy mesh with archetype variants (chaser/tank/spinner)
- [projectile.ts](src/entities/projectile.ts) - Enemy projectiles

### Systems (`src/systems/`)
Update logic operating on entities each frame:
- [combatSystem.ts](src/systems/combatSystem.ts) - `updateBullets()`, `updateEnemies()` with hit detection and damage
- [playerSystem.ts](src/systems/playerSystem.ts) - Movement, dash, i-frames
- [abilitySystem.ts](src/systems/abilitySystem.ts) - Shield, burst AoE, slow-time
- [bossSystem.ts](src/systems/bossSystem.ts) - Boss attack patterns (spiral, slam, summon)
- [waves.ts](src/systems/waves.ts) - Wave spawning with elite/boss scaling
- [vfxSystem.ts](src/systems/vfxSystem.ts) - Damage numbers, hit flashes, death bursts, trails, telegraphs

### UI Layer
- [ui.ts](src/ui.ts) - HUD rendering (HP, score, wave, abilities, versus status)
- [uiMenu.ts](src/uiMenu.ts) - Main menu, pause, settings, save slots, game over
- [uiMinimap.ts](src/uiMinimap.ts) - Radar minimap

### Networking (`src/net/`)
Versus mode and netcode-prep infrastructure:
- [versus.ts](src/net/versus.ts) - Host/client game session (score sync, win conditions)
- [transport.ts](src/net/transport.ts) - BroadcastChannel (local) or WebSocket (cross-device)
- [protocol.ts](src/net/protocol.ts) - Message types (`join`, `score`, `state`)
- [simClock.ts](src/net/simClock.ts) - Fixed-step clock (60Hz) for deterministic updates
- [snapshot.ts](src/net/snapshot.ts) - World state snapshots for replay/netcode
- [prediction.ts](src/net/prediction.ts) - Client-side prediction smoothing

### Effects
- [effects.ts](src/effects.ts) - Post-processing composer (bloom, vignette)
- [audio.ts](src/audio.ts) - Web Audio API sound effects

## Key Patterns

- **Mutable arrays**: Bullets, enemies, and projectiles are managed in mutable arrays that get spliced on removal
- **Delta time**: Raw `dt` for UI/timers, scaled `dt` for gameplay (slow-time ability)
- **Camera shake**: Accumulated shake value that decays each frame
- **Boss phases**: HP ratio determines phase (0/1/2), tracked per-boss in `bossPhaseMap`
- **Invulnerability**: `invulnTimer > 0` blocks all damage (dash i-frames, etc.)

## RINGwars 3D Mode

RINGwars is a turn-based strategy game with 3D ring visualization.

### Running RINGwars

```bash
npm run dev              # Start Vite dev server
npm run agent-server     # Start JAR agent server (port 3001)
```

Then open: http://localhost:5173/ringwars.html

### JAR Agent Integration

The agent server (`server/agent-server.cjs`) executes Java JAR files as AI agents:
- **Upload**: POST /upload - Upload JAR file
- **List**: GET /agents - List uploaded agents
- **Execute**: POST /execute - Run agents for a turn

JAR agents receive a `.step` file and must output a `.move` file:
- Step file format: `fernies\nowners\nnewFernies\nmaxFernies`
- Move file format: `nodeIndex,amount` per line

### RINGwars Architecture (`src/ringwars/`)
- [types.ts](src/ringwars/types.ts) - Game types, settings (turn limit, sudden death)
- [gameLogic.ts](src/ringwars/gameLogic.ts) - Turn execution, battle resolution, Fernie growth
- [renderer.ts](src/ringwars/renderer.ts) - Three.js ring visualization
- [ui.ts](src/ringwars/ui.ts) - HUD, agent selection, JAR upload
- [index.ts](src/ringwars/index.ts) - Game orchestration, AI execution
