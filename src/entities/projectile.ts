import * as THREE from 'three';

export type EnemyProjectile = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
};

export function createEnemyProjectile(from: THREE.Vector3, to: THREE.Vector3, speed = 8.5): EnemyProjectile {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xff8a80, emissive: 0x4a1212, roughness: 0.3, metalness: 0.4 })
  );
  mesh.position.copy(from);
  mesh.position.y = Math.max(1, from.y);
  const velocity = to.clone().sub(from).setY(0).normalize().multiplyScalar(speed);
  return { mesh, velocity, life: 4.2 };
}
