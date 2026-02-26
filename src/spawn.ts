import * as THREE from 'three';
import { Enemy } from './types';

export function makeEnemy(material?: THREE.Material): Enemy {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.55, 0.18, 72, 10),
    material ?? new THREE.MeshStandardMaterial({ color: 0xff5577, emissive: 0x3a0a16, roughness: 0.45, metalness: 0.5 })
  );
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random() * 5;
  mesh.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r);
  mesh.castShadow = true;
  return {
    mesh,
    hp: 30,
    speed: 1.6 + Math.random() * 0.8,
    orbitOffset: Math.random() * Math.PI * 2
  };
}
