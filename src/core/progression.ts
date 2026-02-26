export type Abilities = {
  shield: number;
  burst: number;
  slowTime: number;
};

export type Progression = {
  xp: number;
  level: number;
  points: number;
  abilities: Abilities;
};

function key(prefix = 'global') {
  return `ringwars3d.progression.${prefix}.v1`;
}

export function defaultProgression(): Progression {
  return {
    xp: 0,
    level: 1,
    points: 0,
    abilities: { shield: 0, burst: 0, slowTime: 0 }
  };
}

export function loadProgression(prefix = 'global'): Progression {
  try {
    const raw = localStorage.getItem(key(prefix));
    if (!raw) return defaultProgression();
    const p = JSON.parse(raw) as Progression;
    return { ...defaultProgression(), ...p, abilities: { ...defaultProgression().abilities, ...(p.abilities || {}) } };
  } catch {
    return defaultProgression();
  }
}

export function saveProgression(p: Progression, prefix = 'global') {
  localStorage.setItem(key(prefix), JSON.stringify(p));
}

export function gainXp(p: Progression, amount: number) {
  p.xp += amount;
  const needed = p.level * 100;
  if (p.xp >= needed) {
    p.xp -= needed;
    p.level += 1;
    p.points += 1;
  }
}
