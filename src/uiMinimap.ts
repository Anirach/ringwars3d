import * as THREE from 'three';
import { Enemy } from './entities/types';

export function createMinimap() {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 180;
  canvas.style.position = 'fixed';
  canvas.style.right = '14px';
  canvas.style.bottom = '14px';
  canvas.style.zIndex = '25';
  canvas.style.border = '1px solid #2a3550';
  canvas.style.borderRadius = '10px';
  canvas.style.background = '#0b1020cc';
  canvas.style.boxShadow = '0 8px 24px #0008';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  const RING_R = 16;

  function toMap(v: THREE.Vector3) {
    const nx = THREE.MathUtils.clamp(v.x / RING_R, -1, 1);
    const ny = THREE.MathUtils.clamp(v.z / RING_R, -1, 1);
    return {
      x: canvas.width * 0.5 + nx * (canvas.width * 0.42),
      y: canvas.height * 0.5 + ny * (canvas.height * 0.42)
    };
  }

  function render(player: THREE.Mesh, enemies: Enemy[], wave: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#355089';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    const p = toMap(player.position);
    ctx.fillStyle = '#69d2ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();

    for (const e of enemies) {
      const m = toMap(e.mesh.position);
      ctx.fillStyle = e.isBoss ? '#ffae5c' : e.archetype === 'tank' ? '#c17dff' : e.archetype === 'spinner' ? '#66ffbe' : '#ff6f91';
      ctx.beginPath();
      ctx.arc(m.x, m.y, e.isBoss ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#a8bbdf';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`Wave ${wave} | Enemies ${enemies.length}`, 10, 16);
  }

  return { render };
}
