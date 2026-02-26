import * as THREE from 'three';

export type PredictedPose = {
  x: number;
  y: number;
  z: number;
};

const last = new Map<string, PredictedPose>();

export function predictAndSmooth(id: string, pos: THREE.Vector3, dt: number, smooth = 0.18) {
  const prev = last.get(id);
  if (!prev) {
    last.set(id, { x: pos.x, y: pos.y, z: pos.z });
    return;
  }

  // very light one-step extrapolation + smoothing target
  const vx = (pos.x - prev.x) / Math.max(dt, 1e-4);
  const vz = (pos.z - prev.z) / Math.max(dt, 1e-4);
  const targetX = pos.x + vx * dt * 0.35;
  const targetZ = pos.z + vz * dt * 0.35;

  pos.x = THREE.MathUtils.lerp(pos.x, targetX, smooth);
  pos.z = THREE.MathUtils.lerp(pos.z, targetZ, smooth);

  last.set(id, { x: pos.x, y: pos.y, z: pos.z });
}
