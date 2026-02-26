import * as THREE from 'three';
import { Enemy, EnemyArchetype } from './types';

function enemyMaterial(archetype: EnemyArchetype, eliteLevel: 0 | 1 | 2 = 0) {
  const base = archetype === 'tank'
    ? { color: 0xb65cff, emissive: 0x2a103f, roughness: 0.55, metalness: 0.35 }
    : archetype === 'spinner'
      ? { color: 0x57ffa0, emissive: 0x103f2a, roughness: 0.35, metalness: 0.5 }
      : { color: 0xff5577, emissive: 0x3a0a16, roughness: 0.45, metalness: 0.5 };

  const boost = eliteLevel === 2 ? 1.8 : eliteLevel === 1 ? 1.35 : 1;
  const mat = new THREE.MeshStandardMaterial(base);
  mat.emissiveIntensity = boost;
  return mat;
}

export function createEnemy(archetype: EnemyArchetype = 'chaser', material?: THREE.Material, eliteLevel: 0 | 1 | 2 = 0): Enemy {
  const geometry = archetype === 'tank'
    ? new THREE.DodecahedronGeometry(0.8 + eliteLevel * 0.08, 0)
    : archetype === 'spinner'
      ? new THREE.OctahedronGeometry(0.62 + eliteLevel * 0.08, 0)
      : new THREE.TorusKnotGeometry(0.55 + eliteLevel * 0.05, 0.18, 72, 10);

  const mesh = new THREE.Mesh(geometry, material ?? enemyMaterial(archetype, eliteLevel));
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 5;
  mesh.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r);
  mesh.castShadow = true;

  const base = {
    chaser: { hp: 30, speed: 2.0 },
    tank: { hp: 55, speed: 1.2 },
    spinner: { hp: 24, speed: 2.7 }
  }[archetype];

  const hpMul = eliteLevel === 2 ? 2.1 : eliteLevel === 1 ? 1.45 : 1;
  const speedMul = eliteLevel === 2 ? 1.2 : eliteLevel === 1 ? 1.08 : 1;

  const hp = base.hp * hpMul;

  return {
    mesh,
    hp,
    maxHp: hp,
    speed: base.speed * speedMul,
    orbitOffset: Math.random() * Math.PI * 2,
    archetype,
    eliteLevel
  };
}

export function createBoss(material?: THREE.Material): Enemy {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 2),
    material ?? new THREE.MeshStandardMaterial({ color: 0xff9f43, emissive: 0x4b1e00, roughness: 0.35, metalness: 0.55 })
  );
  const a = Math.random() * Math.PI * 2;
  mesh.position.set(Math.cos(a) * 10, 1.5, Math.sin(a) * 10);
  mesh.castShadow = true;

  return {
    mesh,
    hp: 260,
    maxHp: 260,
    speed: 1.35,
    orbitOffset: Math.random() * Math.PI * 2,
    isBoss: true,
    archetype: 'tank',
    eliteLevel: 2
  };
}
