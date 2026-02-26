export type Settings = {
  masterVolume: number;
  sfxVolume: number;
  cameraSmoothing: number;
};

function key(prefix = 'global') {
  return `ringwars3d.settings.${prefix}.v1`;
}

export function defaultSettings(): Settings {
  return {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    cameraSmoothing: 0.08
  };
}

export function loadSettings(prefix = 'global'): Settings {
  try {
    const raw = localStorage.getItem(key(prefix));
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: Settings, prefix = 'global') {
  localStorage.setItem(key(prefix), JSON.stringify(s));
}
