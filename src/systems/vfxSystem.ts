import * as THREE from 'three';
import { Enemy } from '../entities/types';

type Telegraph = {
  mesh: THREE.Mesh;
  life: number;
  enemyId: string;
};

type DamageNumber = {
  el: HTMLDivElement;
  world: THREE.Vector3;
  life: number;
};

type HitFlash = {
  mesh: THREE.Mesh;
  life: number;
};

type DeathBurst = {
  points: THREE.Points;
  velocity: Float32Array;
  life: number;
};

type Trail = {
  mesh: THREE.Mesh;
  life: number;
};

const telegraphs: Telegraph[] = [];
const numbers: DamageNumber[] = [];
const flashes: HitFlash[] = [];
const deathBursts: DeathBurst[] = [];
const trails: Trail[] = [];

export function spawnTelegraph(scene: THREE.Scene, enemy: Enemy, duration = 0.45) {
  const geo = new THREE.RingGeometry(enemy.isBoss ? 1.4 : 0.8, enemy.isBoss ? 1.65 : 1.0, 28);
  const mat = new THREE.MeshBasicMaterial({ color: enemy.isBoss ? 0xffa84a : 0xff6488, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(enemy.mesh.position.x, 0.31, enemy.mesh.position.z);
  scene.add(mesh);
  telegraphs.push({ mesh, life: duration, enemyId: enemy.mesh.uuid });
}

export function spawnHitFlash(scene: THREE.Scene, position: THREE.Vector3, color = 0xffd27a, scale = 1) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2 * scale, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
  );
  mesh.position.copy(position);
  mesh.position.y += 0.5;
  scene.add(mesh);
  flashes.push({ mesh, life: 0.12 });
}

export function spawnDamageNumber(position: THREE.Vector3, text: string, color = '#ffd27a') {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.position = 'fixed';
  el.style.zIndex = '26';
  el.style.color = color;
  el.style.font = '700 14px system-ui, sans-serif';
  el.style.textShadow = '0 2px 6px #000';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  numbers.push({ el, world: position.clone().add(new THREE.Vector3(0, 1.2, 0)), life: 0.8 });
}

export function spawnDeathBurst(scene: THREE.Scene, position: THREE.Vector3, color = 0xffad66) {
  const count = 18;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocity = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = position.x;
    positions[i * 3 + 1] = position.y + 0.5;
    positions[i * 3 + 2] = position.z;

    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 5);
    velocity[i * 3] = dir.x;
    velocity[i * 3 + 1] = dir.y;
    velocity[i * 3 + 2] = dir.z;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.12, transparent: true, opacity: 0.95 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  deathBursts.push({ points, velocity, life: 0.55 });
}

export function spawnTrail(scene: THREE.Scene, position: THREE.Vector3, color = 0x9adfff, scale = 1) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * scale, 6, 6),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })
  );
  mesh.position.copy(position);
  scene.add(mesh);
  trails.push({ mesh, life: 0.18 });
}

export function updateTelegraphs(scene: THREE.Scene, dt: number, enemies: Enemy[]) {
  for (let i = telegraphs.length - 1; i >= 0; i--) {
    const t = telegraphs[i];
    t.life -= dt;

    const enemy = enemies.find((e) => e.mesh.uuid === t.enemyId);
    if (enemy) {
      t.mesh.position.x = enemy.mesh.position.x;
      t.mesh.position.z = enemy.mesh.position.z;
    }

    t.mesh.scale.multiplyScalar(1 + dt * 1.8);
    const mat = t.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, t.life / 0.45) * 0.75;

    if (t.life <= 0 || !enemy) {
      scene.remove(t.mesh);
      telegraphs.splice(i, 1);
    }
  }
}

export function updateHitFlashes(scene: THREE.Scene, dt: number) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    f.life -= dt;
    f.mesh.scale.multiplyScalar(1 + dt * 7.5);
    const mat = f.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, f.life / 0.12);
    if (f.life <= 0) {
      scene.remove(f.mesh);
      flashes.splice(i, 1);
    }
  }
}

export function updateDeathBursts(scene: THREE.Scene, dt: number) {
  for (let i = deathBursts.length - 1; i >= 0; i--) {
    const b = deathBursts[i];
    b.life -= dt;

    const pos = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let p = 0; p < pos.count; p++) {
      const ix = p * 3;
      pos.array[ix] += b.velocity[ix] * dt;
      pos.array[ix + 1] += b.velocity[ix + 1] * dt;
      pos.array[ix + 2] += b.velocity[ix + 2] * dt;
      b.velocity[ix + 1] -= 9.8 * dt * 0.6;
    }
    pos.needsUpdate = true;

    const mat = b.points.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, b.life / 0.55);

    if (b.life <= 0) {
      scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
      deathBursts.splice(i, 1);
    }
  }
}

export function updateTrails(scene: THREE.Scene, dt: number) {
  for (let i = trails.length - 1; i >= 0; i--) {
    const t = trails[i];
    t.life -= dt;
    t.mesh.scale.multiplyScalar(1 + dt * 3.5);
    const mat = t.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, t.life / 0.18) * 0.55;
    if (t.life <= 0) {
      scene.remove(t.mesh);
      trails.splice(i, 1);
    }
  }
}

export function updateDamageNumbers(camera: THREE.Camera, dt: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = numbers.length - 1; i >= 0; i--) {
    const n = numbers[i];
    n.life -= dt;
    n.world.y += dt * 0.8;

    const p = n.world.clone().project(camera);
    const x = (p.x * 0.5 + 0.5) * w;
    const y = (-p.y * 0.5 + 0.5) * h;
    n.el.style.left = `${x}px`;
    n.el.style.top = `${y - (1 - n.life / 0.8) * 18}px`;
    n.el.style.opacity = `${Math.max(0, n.life / 0.8)}`;

    if (n.life <= 0 || p.z > 1) {
      n.el.remove();
      numbers.splice(i, 1);
    }
  }
}
