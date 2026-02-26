export type RunStats = {
  startAt: number;
  kills: number;
  bossKills: number;
  damageTaken: number;
};

export function createRunStats(): RunStats {
  return {
    startAt: performance.now(),
    kills: 0,
    bossKills: 0,
    damageTaken: 0
  };
}

export function runDurationSec(stats: RunStats) {
  return Math.floor((performance.now() - stats.startAt) / 1000);
}
