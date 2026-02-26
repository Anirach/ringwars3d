import * as THREE from 'three';
import { Bullet, Enemy } from '../entities/types';

export type HitEvent = {
  position: THREE.Vector3;
  damage: number;
  killed: boolean;
  isBoss: boolean;
  eliteLevel: number;
  weakPointHit?: boolean;
};

export type CombatEvents = {
  hitCount: number;
  killCount: number;
  scoreGain: number;
  hpDamage: number;
  hits: HitEvent[];
};

const tmp = new THREE.Vector3();

export function updateBullets(scene: THREE.Scene, bullets: Bullet[], enemies: Enemy[], dt: number): CombatEvents {
  const events: CombatEvents = { hitCount: 0, killCount: 0, scoreGain: 0, hpDamage: 0, hits: [] };

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.mesh.position.addScaledVector(b.velocity, dt);
    b.life -= dt;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const hitRadius = e.isBoss ? 1.4 : e.archetype === 'tank' ? 1.1 : 0.9;
      if (b.mesh.position.distanceTo(e.mesh.position) < hitRadius) {
        const weakPointHit = !!e.isBoss && !!e.weakPointActive;
        const dealt = weakPointHit ? b.damage * 1.9 : b.damage;
        e.hp -= dealt;
        b.life = 0;
        events.hitCount += 1;

        const eliteLevel = e.eliteLevel ?? 0;
        const killed = e.hp <= 0;
        events.hits.push({
          position: e.mesh.position.clone(),
          damage: Math.floor(dealt),
          killed,
          isBoss: !!e.isBoss,
          eliteLevel,
          weakPointHit
        });

        if (killed) {
          scene.remove(e.mesh);
          enemies.splice(j, 1);
          events.killCount += 1;
          const eliteBonus = eliteLevel * 12;
          events.scoreGain += e.isBoss ? 120 + eliteBonus : e.archetype === 'tank' ? 24 + eliteBonus : e.archetype === 'spinner' ? 18 + eliteBonus : 15 + eliteBonus;
        }
        break;
      }
    }

    if (b.life <= 0 || b.mesh.position.length() > 45) {
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }

  return events;
}

export function updateEnemies(player: THREE.Mesh, enemies: Enemy[], dt: number, t: number): CombatEvents {
  const events: CombatEvents = { hitCount: 0, killCount: 0, scoreGain: 0, hpDamage: 0, hits: [] };

  for (const e of enemies) {
    const toPlayer = tmp.copy(player.position).sub(e.mesh.position).setY(0);
    const dist = Math.max(0.001, toPlayer.length());

    const eliteLevel = e.eliteLevel ?? 0;
    const eliteSpeedMul = eliteLevel === 2 ? 1.14 : eliteLevel === 1 ? 1.06 : 1;

    const archetypeSeek = e.archetype === 'spinner' ? 1.4 : e.archetype === 'tank' ? 0.9 : 1;
    const seekScale = (e.isBoss ? 1.2 : archetypeSeek) * eliteSpeedMul;
    const seek = toPlayer.normalize().multiplyScalar(e.speed * seekScale * dt);

    const tangentAmp = e.isBoss ? 0.35 : e.archetype === 'spinner' ? 1.7 : e.archetype === 'tank' ? 0.2 : 0.9;
    const tangent = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x)
      .normalize()
      .multiplyScalar(Math.sin(t * (e.archetype === 'spinner' ? 2.8 : 1) + e.orbitOffset) * tangentAmp * dt);

    e.mesh.position.add(seek).add(tangent);
    e.mesh.position.y = (e.isBoss ? 1.5 : 1.2) + Math.sin(t * (e.isBoss ? 1.5 : 3) + e.orbitOffset) * (e.isBoss ? 0.07 : 0.15);
    e.mesh.rotation.x += dt * (e.isBoss ? 0.7 : e.archetype === 'spinner' ? 2.2 : 1.4);
    e.mesh.rotation.y += dt * (e.isBoss ? 1.1 : 2.1);

    const touchRadius = e.isBoss ? 2.0 : e.archetype === 'tank' ? 1.6 : 1.3;
    if (dist < touchRadius) {
      const dps = e.isBoss ? 28 : e.archetype === 'tank' ? 22 : 14;
      events.hpDamage += dps * (1 + eliteLevel * 0.14) * dt;
    }
  }

  return events;
}
