// RINGwars 3D - Game Logic

import {
  GameState,
  GameSettings,
  RingNode,
  PlayerState,
  Move,
  BattleResult,
  DEFAULT_SETTINGS,
} from './types';

export function createInitialState(settings: GameSettings = DEFAULT_SETTINGS): GameState {
  const nodes: RingNode[] = [];
  const angleStep = (Math.PI * 2) / settings.ringSize;

  for (let i = 0; i < settings.ringSize; i++) {
    nodes.push({
      index: i,
      owner: 'neutral',
      fernies: 0,
      angle: i * angleStep,
    });
  }

  // Place starting positions on opposite sides
  const redStart = 0;
  const blueStart = Math.floor(settings.ringSize / 2);

  nodes[redStart].owner = 'red';
  nodes[redStart].fernies = settings.startingFernies;

  nodes[blueStart].owner = 'blue';
  nodes[blueStart].fernies = settings.startingFernies;

  const red: PlayerState = {
    id: 'red',
    name: 'Red Agent',
    totalFernies: settings.startingFernies,
    nodesControlled: 1,
    newFernies: 0,
    moves: [],
  };

  const blue: PlayerState = {
    id: 'blue',
    name: 'Blue Agent',
    totalFernies: settings.startingFernies,
    nodesControlled: 1,
    newFernies: 0,
    moves: [],
  };

  return {
    step: 0,
    nodes,
    red,
    blue,
    settings,
    phase: 'planning',
    winner: null,
    battleLog: [],
    resolutionDirection: 'clockwise',
    resolutionStartNode: 0,
    currentMaxFernies: settings.maxFerniesPerNode,
    inSuddenDeath: false,
  };
}

export function calculateNewFernies(state: GameState, playerId: 'red' | 'blue'): number {
  const player = state[playerId];
  const { growthPercent, nodeOwnershipBonus } = state.settings;

  // New Fernies = Current Fernies × Growth % × (1 + Node Bonus × Nodes Owned)
  const growthMultiplier = 1 + nodeOwnershipBonus * player.nodesControlled;
  const newFernies = Math.floor(player.totalFernies * growthPercent * growthMultiplier);

  return newFernies;
}

export function getVisibleNodes(state: GameState, playerId: 'red' | 'blue'): number[] {
  const { visibilityRange, ringSize } = state.settings;
  const visible = new Set<number>();

  state.nodes.forEach((node) => {
    if (node.owner === playerId) {
      // Add nodes within visibility range
      for (let offset = -visibilityRange; offset <= visibilityRange; offset++) {
        const idx = (node.index + offset + ringSize) % ringSize;
        visible.add(idx);
      }
    }
  });

  return Array.from(visible).sort((a, b) => a - b);
}

export function validateMove(state: GameState, playerId: 'red' | 'blue', move: Move): string | null {
  const { nodeIndex, amount } = move;
  const player = state[playerId];
  const node = state.nodes[nodeIndex];
  const visible = getVisibleNodes(state, playerId);

  if (nodeIndex < 0 || nodeIndex >= state.settings.ringSize) {
    return `Invalid node index: ${nodeIndex}`;
  }

  if (amount > 0) {
    // Placing Fernies
    if (!visible.includes(nodeIndex)) {
      return `Node ${nodeIndex} is not visible`;
    }
    if (amount > player.newFernies) {
      return `Not enough Fernies to place (have ${player.newFernies}, trying to place ${amount})`;
    }
  } else if (amount < 0) {
    // Removing Fernies
    if (node.owner !== playerId) {
      return `Cannot remove Fernies from node ${nodeIndex} - not owned`;
    }
    if (Math.abs(amount) > node.fernies) {
      return `Cannot remove ${Math.abs(amount)} Fernies from node ${nodeIndex} (only has ${node.fernies})`;
    }
  }

  return null;
}

export function startTurn(state: GameState): GameState {
  const newState = { ...state };
  newState.step += 1;
  newState.phase = 'planning';
  newState.battleLog = [];

  // Calculate new Fernies for each player
  newState.red = {
    ...state.red,
    newFernies: calculateNewFernies(state, 'red'),
    moves: [],
  };
  newState.blue = {
    ...state.blue,
    newFernies: calculateNewFernies(state, 'blue'),
    moves: [],
  };

  return newState;
}

// Track placements from each player for local battle resolution
interface Placements {
  red: Map<number, number>;
  blue: Map<number, number>;
}

export function applyMoves(state: GameState): { state: GameState; placements: Placements } {
  const newState = { ...state };
  const nodes = state.nodes.map((n) => ({ ...n }));
  const placements: Placements = {
    red: new Map(),
    blue: new Map(),
  };

  // First pass: apply removals and track placements
  const processPlayerMoves = (playerId: 'red' | 'blue') => {
    const player = newState[playerId];

    for (const move of player.moves) {
      if (move.amount < 0) {
        // Remove Fernies from owned node
        const node = nodes[move.nodeIndex];
        const removeAmount = Math.min(Math.abs(move.amount), node.fernies);
        node.fernies -= removeAmount;
        if (node.fernies === 0) {
          node.owner = 'neutral';
        }
      } else if (move.amount > 0) {
        // Track placement for local battle resolution
        const current = placements[playerId].get(move.nodeIndex) || 0;
        placements[playerId].set(move.nodeIndex, current + move.amount);
      }
    }
  };

  processPlayerMoves('red');
  processPlayerMoves('blue');

  // Second pass: apply placements with local battle resolution
  const allPlacementNodes = new Set([
    ...placements.red.keys(),
    ...placements.blue.keys(),
  ]);

  for (const nodeIdx of allPlacementNodes) {
    const redAmount = placements.red.get(nodeIdx) || 0;
    const blueAmount = placements.blue.get(nodeIdx) || 0;
    const node = nodes[nodeIdx];

    if (redAmount > 0 && blueAmount > 0) {
      // LOCAL BATTLE: Both players placed on the same node
      // Higher count wins, difference survives
      if (redAmount > blueAmount) {
        const surviving = redAmount - blueAmount;
        node.fernies += surviving;
        if (node.owner === 'neutral' || node.owner === 'blue') {
          node.owner = 'red';
        }
      } else if (blueAmount > redAmount) {
        const surviving = blueAmount - redAmount;
        node.fernies += surviving;
        if (node.owner === 'neutral' || node.owner === 'red') {
          node.owner = 'blue';
        }
      }
      // If equal, they cancel out - nothing added to node
    } else if (redAmount > 0) {
      // Only red placed here
      node.fernies += redAmount;
      if (node.owner === 'neutral') {
        node.owner = 'red';
      }
    } else if (blueAmount > 0) {
      // Only blue placed here
      node.fernies += blueAmount;
      if (node.owner === 'neutral') {
        node.owner = 'blue';
      }
    }
  }

  newState.nodes = nodes;
  return { state: newState, placements };
}

// Local battles are now handled in applyMoves() when both players place on same node

function resolveEdgeBattle(
  nodes: RingNode[],
  idx1: number,
  idx2: number,
  maxFernies: number
): BattleResult | null {
  const node1 = nodes[idx1];
  const node2 = nodes[idx2];

  if (
    node1.owner !== 'neutral' &&
    node2.owner !== 'neutral' &&
    node1.owner !== node2.owner
  ) {
    const result: BattleResult = {
      type: 'edge',
      nodes: [idx1, idx2],
      winner: 'neutral',
      ferniesLost: { red: 0, blue: 0 },
    };

    if (node1.fernies > node2.fernies) {
      // Node1 wins
      result.winner = node1.owner;
      result.ferniesLost[node2.owner] = node2.fernies;
      node1.fernies = Math.min(node1.fernies + node2.fernies, maxFernies);
      node2.fernies = 0;
      node2.owner = 'neutral';
    } else if (node2.fernies > node1.fernies) {
      // Node2 wins
      result.winner = node2.owner;
      result.ferniesLost[node1.owner] = node1.fernies;
      node2.fernies = Math.min(node2.fernies + node1.fernies, maxFernies);
      node1.fernies = 0;
      node1.owner = 'neutral';
    } else {
      // Tie - both lose
      result.ferniesLost.red = node1.owner === 'red' ? node1.fernies : node2.fernies;
      result.ferniesLost.blue = node1.owner === 'blue' ? node1.fernies : node2.fernies;
      node1.fernies = 0;
      node1.owner = 'neutral';
      node2.fernies = 0;
      node2.owner = 'neutral';
    }

    return result;
  }

  return null;
}

function resolveTripleBattle(
  nodes: RingNode[],
  idx1: number,
  idx2: number,
  idx3: number,
  maxFernies: number
): BattleResult | null {
  const node1 = nodes[idx1];
  const node2 = nodes[idx2];
  const node3 = nodes[idx3];

  // Check for A-B-A pattern
  if (
    node1.owner !== 'neutral' &&
    node2.owner !== 'neutral' &&
    node3.owner !== 'neutral' &&
    node1.owner === node3.owner &&
    node1.owner !== node2.owner
  ) {
    const result: BattleResult = {
      type: 'triple',
      nodes: [idx1, idx2, idx3],
      winner: 'neutral',
      ferniesLost: { red: 0, blue: 0 },
    };

    const sideA = node1.owner;
    const sideB = node2.owner;
    const totalA = node1.fernies + node3.fernies;
    const totalB = node2.fernies;

    if (totalA > totalB) {
      result.winner = sideA;
      result.ferniesLost[sideB] = totalB;
      const surviving = totalA - totalB;
      // Distribute surviving Fernies
      node1.fernies = Math.floor(surviving / 2);
      node3.fernies = surviving - node1.fernies;
      node2.fernies = 0;
      node2.owner = 'neutral';
    } else if (totalB > totalA) {
      result.winner = sideB;
      result.ferniesLost[sideA] = totalA;
      const surviving = totalB - totalA;
      node2.fernies = Math.min(surviving, maxFernies);
      node1.fernies = 0;
      node1.owner = 'neutral';
      node3.fernies = 0;
      node3.owner = 'neutral';
    } else {
      // Tie
      result.ferniesLost[sideA] = totalA;
      result.ferniesLost[sideB] = totalB;
      node1.fernies = 0;
      node1.owner = 'neutral';
      node2.fernies = 0;
      node2.owner = 'neutral';
      node3.fernies = 0;
      node3.owner = 'neutral';
    }

    return result;
  }

  return null;
}

export function resolveAllBattles(state: GameState): GameState {
  const newState = { ...state };
  const nodes = state.nodes.map((n) => ({ ...n }));
  const battles: BattleResult[] = [];
  const { ringSize } = state.settings;
  const maxFernies = state.currentMaxFernies;

  // Randomize starting position and direction
  const startNode = Math.floor(Math.random() * ringSize);
  const clockwise = Math.random() < 0.5;

  newState.resolutionStartNode = startNode;
  newState.resolutionDirection = clockwise ? 'clockwise' : 'counterclockwise';

  // Local battles are now handled in applyMoves()

  // Second pass: resolve edge and triple battles
  const processed = new Set<number>();

  for (let offset = 0; offset < ringSize; offset++) {
    const i = clockwise
      ? (startNode + offset) % ringSize
      : (startNode - offset + ringSize) % ringSize;

    if (processed.has(i)) continue;

    const next = (i + 1) % ringSize;
    const nextNext = (i + 2) % ringSize;

    // Check for triple battle first (A-B-A pattern)
    const tripleBattle = resolveTripleBattle(nodes, i, next, nextNext, maxFernies);
    if (tripleBattle) {
      battles.push(tripleBattle);
      processed.add(i);
      processed.add(next);
      processed.add(nextNext);
      continue;
    }

    // Check for edge battle
    const edgeBattle = resolveEdgeBattle(nodes, i, next, maxFernies);
    if (edgeBattle) {
      battles.push(edgeBattle);
      processed.add(i);
      processed.add(next);
    }
  }

  // Update player stats
  const updatePlayerStats = (playerId: 'red' | 'blue') => {
    let total = 0;
    let controlled = 0;
    for (const node of nodes) {
      if (node.owner === playerId) {
        total += node.fernies;
        controlled++;
      }
    }
    return { totalFernies: total, nodesControlled: controlled };
  };

  const redStats = updatePlayerStats('red');
  const blueStats = updatePlayerStats('blue');

  newState.nodes = nodes;
  newState.battleLog = battles;
  newState.red = { ...state.red, ...redStats };
  newState.blue = { ...state.blue, ...blueStats };

  return newState;
}

export function checkWinCondition(state: GameState): GameState {
  const newState = { ...state };
  const { turnLimit } = state.settings;

  if (state.red.nodesControlled === 0 || state.red.totalFernies === 0) {
    newState.winner = 'blue';
    newState.phase = 'gameover';
  } else if (state.blue.nodesControlled === 0 || state.blue.totalFernies === 0) {
    newState.winner = 'red';
    newState.phase = 'gameover';
  } else if (state.red.nodesControlled === state.settings.ringSize) {
    newState.winner = 'red';
    newState.phase = 'gameover';
  } else if (state.blue.nodesControlled === state.settings.ringSize) {
    newState.winner = 'blue';
    newState.phase = 'gameover';
  } else if (state.step >= turnLimit) {
    // Turn limit reached - winner is whoever has more Fernies, or draw if tied
    if (state.red.totalFernies > state.blue.totalFernies) {
      newState.winner = 'red';
    } else if (state.blue.totalFernies > state.red.totalFernies) {
      newState.winner = 'blue';
    } else {
      newState.winner = 'draw';
    }
    newState.phase = 'gameover';
  }

  return newState;
}

// Apply sudden death effects - reduces max Fernies cap and kills excess
function applySuddenDeath(state: GameState): GameState {
  const newState = { ...state };
  const { suddenDeathTurn, suddenDeathDecay } = state.settings;

  // Check if we're entering or continuing sudden death
  if (state.step >= suddenDeathTurn) {
    newState.inSuddenDeath = true;

    // Reduce max Fernies cap by decay percentage each turn
    const newMax = Math.floor(state.currentMaxFernies * (1 - suddenDeathDecay));
    newState.currentMaxFernies = Math.max(newMax, 1); // Minimum of 1

    // Kill excess Fernies on all nodes
    const nodes = state.nodes.map((n) => {
      if (n.fernies > newState.currentMaxFernies) {
        return { ...n, fernies: newState.currentMaxFernies };
      }
      return { ...n };
    });
    newState.nodes = nodes;

    // Recalculate player totals after killing excess
    let redTotal = 0, redNodes = 0;
    let blueTotal = 0, blueNodes = 0;
    for (const node of nodes) {
      if (node.owner === 'red') {
        redTotal += node.fernies;
        redNodes++;
      } else if (node.owner === 'blue') {
        blueTotal += node.fernies;
        blueNodes++;
      }
    }
    newState.red = { ...state.red, totalFernies: redTotal, nodesControlled: redNodes };
    newState.blue = { ...state.blue, totalFernies: blueTotal, nodesControlled: blueNodes };
  }

  return newState;
}

export function executeTurn(state: GameState): GameState {
  const { state: stateAfterMoves } = applyMoves(state);
  let newState = resolveAllBattles(stateAfterMoves);

  // Apply sudden death before checking win condition
  newState = applySuddenDeath(newState);

  newState = checkWinCondition(newState);

  if (newState.phase !== 'gameover') {
    newState = startTurn(newState);
  }

  return newState;
}

// Generate step file content for AI agents
export function generateStepFile(state: GameState, playerId: 'red' | 'blue'): string {
  const visible = getVisibleNodes(state, playerId);
  const player = state[playerId];

  // Line 1: Fernie counts (-1 for invisible, owner prefix Y/N/U)
  const fernieLine = state.nodes
    .map((n) => {
      if (!visible.includes(n.index)) return '-1';
      return n.fernies.toString();
    })
    .join(',');

  // Line 2: Owner info (Y = you, N = opponent, U = uncontrolled, invisible = hidden)
  const opponent = playerId === 'red' ? 'blue' : 'red';
  const ownerLine = state.nodes
    .map((n, i) => {
      if (!visible.includes(i)) return 'N'; // Not visible
      if (n.owner === playerId) return 'Y';
      if (n.owner === opponent) return 'two'; // Opponent marker
      return 'U';
    })
    .join(',');

  // Line 3: New Fernies available
  const newFerniesLine = player.newFernies.toString();

  // Line 4: Max Fernies per node
  const maxFerniesLine = state.settings.maxFerniesPerNode.toString();

  return `${fernieLine}\n${ownerLine}\n${newFerniesLine}\n${maxFerniesLine}\n`;
}

// Parse move file from AI agent
export function parseMoveFile(content: string): Move[] {
  const moves: Move[] = [];
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(/[,\s]+/);
    if (parts.length >= 2) {
      const nodeIndex = parseInt(parts[0], 10);
      const amount = parseInt(parts[1], 10);
      if (!isNaN(nodeIndex) && !isNaN(amount)) {
        moves.push({ nodeIndex, amount });
      }
    }
  }

  return moves;
}
