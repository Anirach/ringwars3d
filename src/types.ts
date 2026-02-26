import * as THREE from 'three';

export type Bullet = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
};

export type Enemy = {
  mesh: THREE.Mesh;
  hp: number;
  speed: number;
  orbitOffset: number;
};

export type GameState = {
  hp: number;
  score: number;
  wave: number;
  alive: boolean;
  cooldown: number;
  spawnTimer: number;
};
