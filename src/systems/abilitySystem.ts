import * as THREE from 'three';
import { Enemy } from '../entities/types';
import { EnemyProjectile } from '../entities/projectile';
import { Progression } from '../core/progression';

export type AbilityState = {
  shieldEnergy: number;
  shieldActive: boolean;
  burstCooldown: number;
  slowTimeCooldown: number;
  slowTimeActive: number;
};

export function createAbilityState(): AbilityState {
  return {
    shieldEnergy: 100,
    shieldActive: false,
    burstCooldown: 0,
    slowTimeCooldown: 0,
    slowTimeActive: 0
  };
}

export function updateAbilityTimers(state: AbilityState, dt: number) {
  state.burstCooldown = Math.max(0, state.burstCooldown - dt);
  state.slowTimeCooldown = Math.max(0, state.slowTimeCooldown - dt);
  state.slowTimeActive = Math.max(0, state.slowTimeActive - dt);
  state.shieldEnergy = Math.min(100, state.shieldEnergy + dt * 6);
}

export function toggleShield(state: AbilityState, progression: Progression, active: boolean) {
  if (progression.abilities.shield <= 0) {
    state.shieldActive = false;
    return;
  }
  if (active && state.shieldEnergy > 5) state.shieldActive = true;
  if (!active) state.shieldActive = false;
}

export function drainShield(state: AbilityState, dt: number) {
  if (!state.shieldActive) return;
  state.shieldEnergy = Math.max(0, state.shieldEnergy - dt * 18);
  if (state.shieldEnergy <= 0) state.shieldActive = false;
}

export function triggerBurst(
  state: AbilityState,
  progression: Progression,
  player: THREE.Mesh,
  enemies: Enemy[],
  scene: THREE.Scene
) {
  if (progression.abilities.burst <= 0 || state.burstCooldown > 0) return 0;
  state.burstCooldown = Math.max(10 - progression.abilities.burst * 1.5, 4);
  let kills = 0;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const d = e.mesh.position.distanceTo(player.position);
    if (d < 4.5 + progression.abilities.burst * 1.4) {
      e.hp -= 60 + progression.abilities.burst * 30;
      if (e.hp <= 0) {
        scene.remove(e.mesh);
        enemies.splice(i, 1);
        kills++;
      }
    }
  }
  return kills;
}

export function triggerSlowTime(state: AbilityState, progression: Progression) {
  if (progression.abilities.slowTime <= 0 || state.slowTimeCooldown > 0) return false;
  state.slowTimeActive = 2 + progression.abilities.slowTime * 0.8;
  state.slowTimeCooldown = Math.max(16 - progression.abilities.slowTime * 2, 8);
  return true;
}

export function updateEnemyProjectiles(
  scene: THREE.Scene,
  projectiles: EnemyProjectile[],
  player: THREE.Mesh,
  dt: number,
  shieldActive: boolean
) {
  let hpDamage = 0;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.life -= dt;

    if (p.mesh.position.distanceTo(player.position) < 0.9) {
      hpDamage += shieldActive ? 2 : 10;
      p.life = 0;
    }

    if (p.life <= 0 || p.mesh.position.length() > 50) {
      scene.remove(p.mesh);
      projectiles.splice(i, 1);
    }
  }

  return hpDamage;
}
