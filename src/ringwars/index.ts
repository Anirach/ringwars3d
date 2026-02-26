// RINGwars 3D - Main Entry Point

import { GameState, Move, DEFAULT_SETTINGS } from './types';
import {
  createInitialState,
  startTurn,
  executeTurn,
  generateStepFile,
  parseMoveFile,
  validateMove,
  getVisibleNodes,
} from './gameLogic';
import { createRingRenderer, RingRenderer } from './renderer';
import { createGameUI, GameUI } from './ui';

export interface RingWarsGame {
  start: () => void;
  step: () => void;
  reset: () => void;
  setAutoPlay: (enabled: boolean) => void;
  getState: () => GameState;
}

export function createRingWarsGame(container: HTMLElement): RingWarsGame {
  // Create 3D container
  const canvas3D = document.createElement('div');
  canvas3D.id = 'ringwars-3d';
  canvas3D.style.cssText = `
    position: fixed;
    top: 0;
    left: 300px;
    right: 0;
    bottom: 0;
  `;
  container.appendChild(canvas3D);

  // Initialize renderer and UI
  const renderer = createRingRenderer(canvas3D);
  const ui = createGameUI(container);

  // Game state - start with turn 1 so we have newFernies
  let state = createInitialState(DEFAULT_SETTINGS);
  state = startTurn(state); // Initialize first turn

  let autoPlay = false;
  let autoPlayInterval: number | null = null;
  let redMode: 'human' | 'ai' = 'ai';
  let blueMode: 'human' | 'ai' = 'ai';

  console.log('RINGwars initialized:', state);

  // Aggressive AI - prioritizes attacking enemies, uses random tiebreaker
  function simpleAI(gameState: GameState, playerId: 'red' | 'blue'): Move[] {
    const player = gameState[playerId];
    const opponent = playerId === 'red' ? 'blue' : 'red';
    const visible = getVisibleNodes(gameState, playerId);
    const moves: Move[] = [];
    const { ringSize } = gameState.settings;

    if (player.newFernies <= 0) return moves;

    const controlledNodes = gameState.nodes.filter(
      (n) => n.owner === playerId
    );

    if (controlledNodes.length === 0) return moves;

    // Find attack targets - separate enemy nodes from neutral
    const enemyTargets: { nodeIdx: number; fernies: number }[] = [];
    const neutralTargets: { nodeIdx: number }[] = [];

    for (const node of controlledNodes) {
      const prev = (node.index - 1 + ringSize) % ringSize;
      const next = (node.index + 1) % ringSize;

      for (const adj of [prev, next]) {
        if (!visible.includes(adj)) continue;
        const adjNode = gameState.nodes[adj];
        if (adjNode.owner === opponent) {
          // Only add if not already in list
          if (!enemyTargets.some(t => t.nodeIdx === adj)) {
            enemyTargets.push({ nodeIdx: adj, fernies: adjNode.fernies });
          }
        } else if (adjNode.owner === 'neutral') {
          if (!neutralTargets.some(t => t.nodeIdx === adj)) {
            neutralTargets.push({ nodeIdx: adj });
          }
        }
      }
    }

    let remaining = player.newFernies;

    // PRIORITY 1: Attack weakest enemy node if we can win
    if (enemyTargets.length > 0) {
      // Sort by weakest first
      enemyTargets.sort((a, b) => a.fernies - b.fernies);
      const weakest = enemyTargets[0];

      // Attack if we have enough to win
      if (remaining > weakest.fernies) {
        moves.push({ nodeIndex: weakest.nodeIdx, amount: remaining });
        return moves;
      }
    }

    // PRIORITY 2: Expand to neutral territory (with randomness to avoid symmetry)
    if (neutralTargets.length > 0) {
      // Add randomness: shuffle neutral targets
      for (let i = neutralTargets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [neutralTargets[i], neutralTargets[j]] = [neutralTargets[j], neutralTargets[i]];
      }

      const target = neutralTargets[0];
      moves.push({ nodeIndex: target.nodeIdx, amount: remaining });
      return moves;
    }

    // PRIORITY 3: If no good targets, reinforce our frontline
    if (controlledNodes.length > 0) {
      // Find node closest to enemy
      let bestNode = controlledNodes[0];
      let foundFrontline = false;

      for (const node of controlledNodes) {
        const prev = (node.index - 1 + ringSize) % ringSize;
        const next = (node.index + 1) % ringSize;

        for (const adj of [prev, next]) {
          const adjNode = gameState.nodes[adj];
          if (adjNode.owner === opponent) {
            // This node is on the frontline
            if (!foundFrontline || node.fernies < bestNode.fernies) {
              bestNode = node;
              foundFrontline = true;
            }
          }
        }
      }

      moves.push({ nodeIndex: bestNode.index, amount: remaining });
    }

    return moves;
  }

  function updateDisplay() {
    renderer.update(state);
    ui.updateState(state);
  }

  const AGENT_SERVER = 'http://localhost:3001';

  async function getAgentMoves(): Promise<{ redMoves: Move[]; blueMoves: Move[] }> {
    const agents = ui.getSelectedAgents();
    let redMoves: Move[] = [];
    let blueMoves: Move[] = [];

    // Check if any JAR agents are selected
    const useServer = agents.red !== 'builtin' || agents.blue !== 'builtin';

    if (useServer) {
      try {
        const res = await fetch(`${AGENT_SERVER}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state,
            redAgent: agents.red,
            blueAgent: agents.blue,
          }),
        });
        const data = await res.json();

        if (agents.red !== 'builtin') {
          redMoves = data.redMoves || [];
        }
        if (agents.blue !== 'builtin') {
          blueMoves = data.blueMoves || [];
        }
      } catch (e) {
        console.error('Agent server error:', e);
        ui.showMessage('Agent server error - using built-in AI', 'error');
      }
    }

    // Use built-in AI for any agents not handled by server
    if (agents.red === 'builtin' || redMoves.length === 0) {
      redMoves = simpleAI(state, 'red');
    }
    if (agents.blue === 'builtin' || blueMoves.length === 0) {
      blueMoves = simpleAI(state, 'blue');
    }

    return { redMoves, blueMoves };
  }

  async function step() {
    if (state.phase === 'gameover') {
      console.log('Game is over, cannot step');
      return;
    }

    console.log('Executing step', state.step);

    // Get moves from agents (built-in or JAR)
    const { redMoves, blueMoves } = await getAgentMoves();

    console.log('Red moves:', redMoves);
    console.log('Blue moves:', blueMoves);

    state.red.moves = redMoves;
    state.blue.moves = blueMoves;

    // Execute turn
    state = executeTurn(state);
    console.log('After turn:', state.step, 'Red:', state.red.totalFernies, 'Blue:', state.blue.totalFernies);

    updateDisplay();

    if (state.phase === 'gameover') {
      setAutoPlay(false);
      ui.showMessage(
        state.winner === 'draw'
          ? 'Game ended in a draw!'
          : `${state.winner?.toUpperCase()} wins!`,
        state.winner === 'draw' ? 'info' : 'success'
      );
    }
  }

  function start() {
    console.log('Start clicked - beginning auto-play');
    updateDisplay();
    ui.showMessage('Battle started!', 'success');
    // Start auto-play
    setAutoPlay(true);
    ui.setButtonText('start', 'Running...');
    ui.setButtonText('auto', 'Stop');
  }

  function reset() {
    setAutoPlay(false);

    // Get settings from UI
    const uiSettings = ui.getGameSettings();
    const customSettings = {
      ...DEFAULT_SETTINGS,
      turnLimit: uiSettings.turnLimit,
      suddenDeathTurn: uiSettings.suddenDeathTurn,
      suddenDeathDecay: uiSettings.suddenDeathDecay,
    };

    state = createInitialState(customSettings);
    state = startTurn(state); // Start first turn
    updateDisplay();
    ui.showMessage(`Game reset (Limit: ${uiSettings.turnLimit}, Sudden Death: ${uiSettings.suddenDeathTurn})`, 'info');
    ui.setButtonText('start', 'Start Game');
    ui.setButtonText('auto', 'Auto Play');
  }

  async function runAutoPlayLoop() {
    const speed = 500;
    while (autoPlay && state.phase !== 'gameover') {
      await step();
      // Wait before next step
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    autoPlayInterval = null;
  }

  function setAutoPlay(enabled: boolean) {
    autoPlay = enabled;
    if (autoPlay && !autoPlayInterval) {
      console.log('Starting auto-play');
      autoPlayInterval = 1; // Mark as running (non-null)
      runAutoPlayLoop();
    } else if (!autoPlay) {
      console.log('Stopping auto-play');
      autoPlayInterval = null;
    }
  }

  function getState() {
    return state;
  }

  // Wire up UI buttons
  ui.onStart(start);
  ui.onStep(step);
  ui.onAutoPlay(() => {
    setAutoPlay(!autoPlay);
    ui.setButtonText('auto', autoPlay ? 'Stop' : 'Auto Play');
  });
  ui.onReset(reset);
  console.log('Button event listeners attached');

  // Handle human moves
  ui.onMoveSubmit((moves) => {
    if (redMode === 'human') {
      state.red.moves = moves;
    }
    if (blueMode === 'human') {
      state.blue.moves = moves;
    }
    step();
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    renderer.resize(canvas3D.clientWidth, canvas3D.clientHeight);
  });

  // Initial render
  updateDisplay();
  renderer.animate();

  return {
    start,
    step,
    reset,
    setAutoPlay,
    getState,
  };
}

// Don't auto-initialize - let main-ringwars.ts handle it
/*
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (app) {
      const game = createRingWarsGame(app);
      (window as any).ringwars = game;
    }
  });
}
*/
