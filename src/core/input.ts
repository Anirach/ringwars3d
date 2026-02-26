export type Input = {
  keys: Set<string>;
  virtualKeys: Set<string>;
  pointerDown: boolean;
};

export function createInput(): Input {
  const input: Input = { keys: new Set(), virtualKeys: new Set(), pointerDown: false };

  window.addEventListener('keydown', (e) => input.keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
  window.addEventListener('pointerdown', () => (input.pointerDown = true));
  window.addEventListener('pointerup', () => (input.pointerDown = false));

  return input;
}

export function keyDown(input: Input, key: string) {
  return input.keys.has(key) || input.virtualKeys.has(key);
}

export function setVirtualKey(input: Input, key: string, down: boolean) {
  if (down) input.virtualKeys.add(key);
  else input.virtualKeys.delete(key);
}

export function mountMobileControls(input: Input) {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.inset = 'auto 10px 10px 10px';
  root.style.display = 'flex';
  root.style.justifyContent = 'space-between';
  root.style.zIndex = '30';
  root.style.pointerEvents = 'none';

  const mkBtn = (txt: string) => {
    const b = document.createElement('button');
    b.textContent = txt;
    b.style.pointerEvents = 'auto';
    b.style.width = '56px';
    b.style.height = '56px';
    b.style.borderRadius = '50%';
    b.style.border = '1px solid #3a4f86';
    b.style.background = '#132142cc';
    b.style.color = '#dce7ff';
    return b;
  };

  const left = document.createElement('div');
  left.style.display = 'grid';
  left.style.gridTemplateColumns = 'repeat(3,56px)';
  left.style.gap = '6px';

  const up = mkBtn('↑'); const down = mkBtn('↓'); const leftB = mkBtn('←'); const right = mkBtn('→');
  left.append(document.createElement('div'), up, document.createElement('div'), leftB, document.createElement('div'), right, document.createElement('div'), down, document.createElement('div'));

  const bindHold = (el: HTMLButtonElement, key: string) => {
    const on = () => setVirtualKey(input, key, true);
    const off = () => setVirtualKey(input, key, false);
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
  };
  bindHold(up, 'w'); bindHold(down, 's'); bindHold(leftB, 'a'); bindHold(right, 'd');

  const rightWrap = document.createElement('div');
  rightWrap.style.display = 'grid';
  rightWrap.style.gridTemplateColumns = 'repeat(3,56px)';
  rightWrap.style.gap = '6px';
  const shoot = mkBtn('●'); const dash = mkBtn('D'); const shield = mkBtn('S'); const burst = mkBtn('B'); const slow = mkBtn('T');
  rightWrap.append(shield, burst, slow, dash, shoot);

  bindHold(dash, ' ');
  bindHold(shield, 'f');
  bindHold(burst, 'q');
  bindHold(slow, 'e');
  shoot.addEventListener('pointerdown', () => (input.pointerDown = true));
  shoot.addEventListener('pointerup', () => (input.pointerDown = false));

  root.append(left, rightWrap);
  document.body.appendChild(root);
}

export function getGamepad() {
  const pads = navigator.getGamepads?.() ?? [];
  for (const p of pads) if (p) return p;
  return null;
}

export function getMoveAxes() {
  const p = getGamepad();
  if (!p) return { x: 0, y: 0 };
  const x = Math.abs(p.axes[0] ?? 0) > 0.15 ? (p.axes[0] ?? 0) : 0;
  const y = Math.abs(p.axes[1] ?? 0) > 0.15 ? (p.axes[1] ?? 0) : 0;
  return { x, y };
}

export function gpPressed(index: number) {
  const p = getGamepad();
  return !!p?.buttons?.[index]?.pressed;
}
