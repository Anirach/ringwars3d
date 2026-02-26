export function enemyFireIntervalForWave(wave: number) {
  // smoother scaling than raw linear
  return Math.max(1.25 - Math.log2(wave + 1) * 0.18, 0.42);
}

export function enemyShooterCountForWave(wave: number) {
  if (wave < 4) return 1;
  if (wave < 8) return 2;
  if (wave < 13) return 3;
  return 4;
}

export function enemyProjectileSpeedForWave(wave: number) {
  return Math.min(8.5 + wave * 0.15, 13.5);
}
