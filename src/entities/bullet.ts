import * as THREE from 'three';
import { Bullet, Enemy, WeaponType } from './types';

const WEAPON_STATS: Record<WeaponType, { speed: number; damage: number; life: number; spread: number; count: number }> = {
  assault: { speed: 18, damage: 20, life: 2.2, spread: 0.02, count: 1 },
  shotgun: { speed: 16, damage: 11, life: 1.1, spread: 0.22, count: 5 },
  rail: { speed: 28, damage: 48, life: 1.0, spread: 0.005, count: 1 }
};

function findAim(playerPos: THREE.Vector3, enemies: Enemy[]) {
  const nearest = enemies.reduce<{ d: number; v: THREE.Vector3 }>(
    (best, e) => {
      const d = e.mesh.position.distanceToSquared(playerPos);
      if (d < best.d) return { d, v: e.mesh.position.clone() };
      return best;
    },
    { d: Infinity, v: playerPos.clone().add(new THREE.Vector3(0, 0, -1)) }
  );
  return nearest.v.sub(playerPos).setY(0).normalize();
}

export function createBullets(playerPos: THREE.Vector3, enemies: Enemy[], weapon: WeaponType): Bullet[] {
  const stats = WEAPON_STATS[weapon];
  const aim = findAim(playerPos, enemies);
  const bullets: Bullet[] = [];

  for (let i = 0; i < stats.count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(weapon === 'rail' ? 0.09 : 0.12, 12, 12),
      new THREE.MeshStandardMaterial({
        color: weapon === 'rail' ? 0x8ef6ff : 0xffe17a,
        emissive: weapon === 'rail' ? 0x1b5360 : 0x6a4704,
        metalness: 0.4,
        roughness: 0.2
      })
    );
    mesh.position.copy(playerPos);
    mesh.position.y = 1;

    const spread = (Math.random() - 0.5) * stats.spread;
    const dir = aim.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    bullets.push({
      mesh,
      velocity: dir.multiplyScalar(stats.speed),
      life: stats.life,
      damage: stats.damage
    });
  }

  return bullets;
}

export function weaponCooldown(weapon: WeaponType) {
  if (weapon === 'shotgun') return 0.38;
  if (weapon === 'rail') return 0.62;
  return 0.12;
}
