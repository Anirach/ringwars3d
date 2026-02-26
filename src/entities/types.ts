import * as THREE from 'three';

export type WeaponType = 'assault' | 'shotgun' | 'rail';
export type EnemyArchetype = 'chaser' | 'tank' | 'spinner';

export type Bullet = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
};

export type Enemy = {
  mesh: THREE.Mesh;
  hp: number;
  maxHp: number;
  speed: number;
  orbitOffset: number;
  isBoss?: boolean;
  archetype: EnemyArchetype;
  eliteLevel?: 0 | 1 | 2;
  weakPointActive?: boolean;
};
