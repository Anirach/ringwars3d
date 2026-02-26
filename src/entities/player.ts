import * as THREE from 'three';

export function createPlayer() {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.75, 1),
    new THREE.MeshStandardMaterial({ color: 0x4fd1ff, emissive: 0x0b2c44, roughness: 0.25, metalness: 0.5 })
  );
  mesh.position.set(0, 1, 0);
  mesh.castShadow = true;
  return mesh;
}
