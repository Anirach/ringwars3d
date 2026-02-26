import * as THREE from 'three';
import { Enemy, EnemyArchetype } from '../entities/types';
import { EnemyProjectile } from '../entities/projectile';
import { createEnemy } from '../entities/enemy';

type BossRuntime = {
  spiralCd: number;
  slamCd: number;
  summonCd: number;
  weakPointCd: number;
  weakPointTimer: number;
};

type Hazard = {
  mesh: THREE.Mesh;
  life: number;
  radius: number;
};

const runtimes = new Map<string, BossRuntime>();
const hazards: Hazard[] = [];

function getRt(id: string): BossRuntime {
  let rt = runtimes.get(id);
  if (!rt) {
    rt = { spiralCd: 2.2, slamCd: 4.8, summonCd: 7.5, weakPointCd: 3.2, weakPointTimer: 0 };
    runtimes.set(id, rt);
  }
  return rt;
}

function makeProjectile(pos: THREE.Vector3, dir: THREE.Vector3, speed: number): EnemyProjectile {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xff8a80, emissive: 0x4a1212, roughness: 0.3, metalness: 0.4 })
  );
  mesh.position.copy(pos);
  mesh.position.y = Math.max(1, pos.y);
  return {
    mesh,
    velocity: dir.clone().normalize().multiplyScalar(speed),
    life: 4.4
  };
}

function spawnHazard(scene: THREE.Scene, center: THREE.Vector3, radius: number, life: number, color = 0xff5533) {
  const geo = new THREE.RingGeometry(radius * 0.75, radius, 42);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(center.x, 0.32, center.z);
  scene.add(mesh);
  hazards.push({ mesh, life, radius });
}

export function updateBossAttacks(
  scene: THREE.Scene,
  enemies: Enemy[],
  enemyProjectiles: EnemyProjectile[],
  player: THREE.Mesh,
  wave: number,
  dt: number,
  time: number
) {
  let hpDamage = 0;
  let shake = 0;
  let phaseEvent = false;

  for (const e of enemies) {
    if (!e.isBoss) continue;

    const ratio = e.hp / Math.max(1, e.maxHp || 1);
    const phase = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
    const rt = getRt(e.mesh.uuid);

    rt.spiralCd -= dt;
    rt.slamCd -= dt;
    rt.summonCd -= dt;
    rt.weakPointCd -= dt;
    rt.weakPointTimer = Math.max(0, rt.weakPointTimer - dt);

    if (rt.weakPointCd <= 0) {
      rt.weakPointTimer = 1.2 + phase * 0.4;
      rt.weakPointCd = Math.max(4.2 - phase * 0.6, 2.6);
      phaseEvent = true;
    }
    e.weakPointActive = rt.weakPointTimer > 0;

    // Phase 0+: Spiral barrage
    if (rt.spiralCd <= 0) {
      const count = 10 + phase * 4 + Math.min(6, Math.floor(wave / 5));
      const base = time * (0.9 + phase * 0.35);
      for (let i = 0; i < count; i++) {
        const a = base + (i / count) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
        const p = makeProjectile(e.mesh.position, dir, 7.5 + phase * 1.3);
        enemyProjectiles.push(p);
        scene.add(p.mesh);
      }
      rt.spiralCd = Math.max(2.6 - phase * 0.35, 1.6);
      shake = Math.max(shake, 0.16);
    }

    // Phase 1+: Shockwave slam
    if (phase >= 1 && rt.slamCd <= 0) {
      const d = e.mesh.position.distanceTo(player.position);
      const radius = 4.6 + phase * 1.2;
      if (d < radius) hpDamage += phase >= 2 ? 22 : 14;
      spawnHazard(scene, e.mesh.position.clone(), radius, 1.2, 0xff7b5a);
      rt.slamCd = Math.max(5.4 - phase * 1.2, 2.9);
      shake = Math.max(shake, 0.24);
    }

    // Phase 2: Summon adds + lava pools
    if (phase >= 2 && rt.summonCd <= 0) {
      const archetypes: EnemyArchetype[] = ['spinner', 'chaser'];
      for (let i = 0; i < 2; i++) {
        const add = createEnemy(archetypes[i % archetypes.length], undefined, 1);
        const a = Math.random() * Math.PI * 2;
        const r = 2.8 + Math.random() * 1.5;
        add.mesh.position.set(e.mesh.position.x + Math.cos(a) * r, 1.1, e.mesh.position.z + Math.sin(a) * r);
        add.hp += wave * 2;
        add.maxHp = add.hp;
        enemies.push(add);
        scene.add(add.mesh);
      }

      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 7;
        const center = new THREE.Vector3(Math.cos(a) * r, 0.3, Math.sin(a) * r);
        spawnHazard(scene, center, 2.4 + Math.random() * 1.2, 4.2, 0xff3d2e);
      }

      rt.summonCd = 8.5;
      shake = Math.max(shake, 0.2);
    }
  }

  // Hazards tick
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.life -= dt;
    h.mesh.scale.multiplyScalar(1 + dt * 0.35);
    const mat = h.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0.08, h.life / 4.2) * 0.42;

    const center = h.mesh.position;
    const d = player.position.distanceTo(new THREE.Vector3(center.x, player.position.y, center.z));
    if (d < h.radius * 0.92) hpDamage += 10 * dt;

    if (h.life <= 0) {
      scene.remove(h.mesh);
      hazards.splice(i, 1);
    }
  }

  return { hpDamage, shake, phaseEvent };
}
