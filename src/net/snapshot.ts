import * as THREE from 'three';
import { Enemy } from '../entities/types';

export type PlayerSnapshot = {
  x: number;
  y: number;
  z: number;
  hp: number;
};

export type EnemySnapshot = {
  id: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  archetype: string;
  boss: boolean;
};

export type WorldSnapshot = {
  tick: number;
  ts: number;
  wave: number;
  score: number;
  player: PlayerSnapshot;
  enemies: EnemySnapshot[];
};

export function buildSnapshot(tick: number, wave: number, score: number, player: THREE.Mesh, hp: number, enemies: Enemy[]): WorldSnapshot {
  return {
    tick,
    ts: Date.now(),
    wave,
    score,
    player: { x: player.position.x, y: player.position.y, z: player.position.z, hp },
    enemies: enemies.map((e) => ({
      id: e.mesh.uuid,
      x: e.mesh.position.x,
      y: e.mesh.position.y,
      z: e.mesh.position.z,
      hp: e.hp,
      archetype: e.archetype,
      boss: !!e.isBoss
    }))
  };
}
