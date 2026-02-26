import * as THREE from 'three';
import { Enemy, EnemyArchetype } from '../entities/types';
import { createEnemy, createBoss } from '../entities/enemy';

const ARCHETYPES: EnemyArchetype[] = ['chaser', 'tank', 'spinner'];

function rollEliteLevel(wave: number): 0 | 1 | 2 {
  const r = Math.random();
  const tier2Chance = Math.max(0, (wave - 9) * 0.015);
  const tier1Chance = Math.min(0.35, 0.05 + wave * 0.015);
  if (r < tier2Chance) return 2;
  if (r < tier2Chance + tier1Chance) return 1;
  return 0;
}

export function spawnWave(scene: THREE.Scene, enemies: Enemy[], wave: number, enemyMaterial: THREE.Material | undefined, bossMaterial: THREE.Material) {
  const bossWave = wave % 5 === 0;

  if (bossWave) {
    const boss = createBoss(bossMaterial);
    boss.hp += wave * 20;
    boss.maxHp = boss.hp;
    boss.speed += wave * 0.02;
    enemies.push(boss);
    scene.add(boss.mesh);
    return;
  }

  const count = Math.min(3 + wave, 16);
  for (let i = 0; i < count; i++) {
    const archetype = ARCHETYPES[(i + wave) % ARCHETYPES.length];
    const eliteLevel = rollEliteLevel(wave);
    const enemy = createEnemy(archetype, enemyMaterial, eliteLevel);
    enemy.hp += wave * (archetype === 'tank' ? 10 : 6);
    enemy.maxHp = enemy.hp;
    enemy.speed += wave * (archetype === 'tank' ? 0.03 : 0.08);
    enemies.push(enemy);
    scene.add(enemy.mesh);
  }
}
