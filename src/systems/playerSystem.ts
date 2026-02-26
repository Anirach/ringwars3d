import * as THREE from 'three';
import { Input } from '../core/input';

export function updatePlayer(
  player: THREE.Mesh,
  input: Input,
  dt: number,
  dashReady: boolean,
  gamepadAxes: { x: number; y: number },
  gamepadDash: boolean
) {
  let usedDash = false;
  const baseSpeed = 7.5;
  const dashSpeed = 18;

  const has = (k: string) => input.keys.has(k) || input.virtualKeys.has(k);
  const keyMove = new THREE.Vector3(
    (has('d') ? 1 : 0) - (has('a') ? 1 : 0),
    0,
    (has('s') ? 1 : 0) - (has('w') ? 1 : 0)
  );
  const gpMove = new THREE.Vector3(gamepadAxes.x, 0, gamepadAxes.y);
  const move = keyMove.lengthSq() > gpMove.lengthSq() ? keyMove : gpMove;

  if (move.lengthSq() > 0) {
    move.normalize();
    let speed = baseSpeed;
    if (dashReady && (input.keys.has(' ') || gamepadDash)) {
      speed = dashSpeed;
      usedDash = true;
    }
    move.multiplyScalar(speed * dt);
    player.position.add(move);

    const planar = new THREE.Vector3(player.position.x, 0, player.position.z);
    if (planar.length() > 13.6) {
      planar.setLength(13.6);
      player.position.x = planar.x;
      player.position.z = planar.z;
    }
  }

  player.position.y = 1;
  return { usedDash };
}
