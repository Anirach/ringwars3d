export type GameState = {
  hp: number;
  score: number;
  wave: number;
  alive: boolean;
  cooldown: number;
  spawnTimer: number;
  dashCooldown: number;
  rollTimer: number;
  rollCooldown: number;
  invulnTimer: number;
};

export function createState(): GameState {
  return {
    hp: 100,
    score: 0,
    wave: 1,
    alive: true,
    cooldown: 0,
    spawnTimer: 0,
    dashCooldown: 0,
    rollTimer: 0,
    rollCooldown: 0,
    invulnTimer: 0
  };
}

export function resetState(state: GameState) {
  state.hp = 100;
  state.score = 0;
  state.wave = 1;
  state.alive = true;
  state.cooldown = 0;
  state.spawnTimer = 0;
  state.dashCooldown = 0;
  state.rollTimer = 0;
  state.rollCooldown = 0;
  state.invulnTimer = 0;
}
