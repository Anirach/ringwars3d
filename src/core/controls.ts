export type Action = 'dash' | 'shield' | 'burst' | 'slow' | 'pause' | 'restart';
export type Controls = Record<Action, string>;

function key(prefix = 'global') {
  return `ringwars3d.controls.${prefix}.v1`;
}

export function defaultControls(): Controls {
  return {
    dash: ' ',
    shield: 'f',
    burst: 'q',
    slow: 'e',
    pause: 'escape',
    restart: 'r'
  };
}

export function loadControls(prefix = 'global'): Controls {
  try {
    const raw = localStorage.getItem(key(prefix));
    if (!raw) return defaultControls();
    return { ...defaultControls(), ...(JSON.parse(raw) as Partial<Controls>) };
  } catch {
    return defaultControls();
  }
}

export function saveControls(c: Controls, prefix = 'global') {
  localStorage.setItem(key(prefix), JSON.stringify(c));
}
