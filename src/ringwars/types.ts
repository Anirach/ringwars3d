// RINGwars 3D - Core Types

export type NodeOwner = 'red' | 'blue' | 'neutral';

export interface RingNode {
  index: number;
  owner: NodeOwner;
  fernies: number;
  angle: number; // Position on the ring in radians
}

export interface GameSettings {
  ringSize: number;           // Number of nodes (default: 20)
  startingFernies: number;    // Initial Fernies per player (default: 75)
  growthPercent: number;      // Fernie growth rate (default: 0.10 = 10%)
  maxFerniesPerNode: number;  // Cap per node (default: 10000)
  visibilityRange: number;    // How far you can see (default: 5)
  nodeOwnershipBonus: number; // Bonus per node owned (default: 0.10 = 10%)
  turnLimit: number;          // Max turns before game ends (default: 500)
  suddenDeathTurn: number;    // Turn when sudden death starts (default: turnLimit)
  suddenDeathDecay: number;   // Max Fernies reduced by this % each turn in sudden death (default: 0.10)
}

export interface Move {
  nodeIndex: number;
  amount: number; // Positive = place, Negative = remove
}

export interface PlayerState {
  id: 'red' | 'blue';
  name: string;
  totalFernies: number;
  nodesControlled: number;
  newFernies: number; // Available to place this turn
  moves: Move[];
}

export interface BattleResult {
  type: 'local' | 'edge' | 'triple';
  nodes: number[];
  winner: NodeOwner;
  ferniesLost: { red: number; blue: number };
}

export interface GameState {
  step: number;
  nodes: RingNode[];
  red: PlayerState;
  blue: PlayerState;
  settings: GameSettings;
  phase: 'planning' | 'resolution' | 'gameover';
  winner: NodeOwner | 'draw' | null;
  battleLog: BattleResult[];
  resolutionDirection: 'clockwise' | 'counterclockwise';
  resolutionStartNode: number;
  currentMaxFernies: number;  // Current max cap (decreases in sudden death)
  inSuddenDeath: boolean;     // Whether sudden death mode is active
}

export const DEFAULT_SETTINGS: GameSettings = {
  ringSize: 20,
  startingFernies: 75,
  growthPercent: 0.10,
  maxFerniesPerNode: 10000,
  visibilityRange: 5,
  nodeOwnershipBonus: 0.10,
  turnLimit: 200,
  suddenDeathTurn: 100,
  suddenDeathDecay: 0.10,
};
