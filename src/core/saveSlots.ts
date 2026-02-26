export type SaveSlot = {
  id: number;
  name: string;
  updatedAt: number;
  bestScore: number;
  bestWave: number;
};

const KEY = 'ringwars3d.slots.v1';

export function defaultSlots(): SaveSlot[] {
  return [1, 2, 3].map((id) => ({
    id,
    name: `Slot ${id}`,
    updatedAt: 0,
    bestScore: 0,
    bestWave: 0
  }));
}

export function loadSlots(): SaveSlot[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSlots();
    const parsed = JSON.parse(raw) as SaveSlot[];
    const fallback = defaultSlots();
    return fallback.map((s, i) => ({ ...s, ...(parsed[i] || {}) }));
  } catch {
    return defaultSlots();
  }
}

export function saveSlots(slots: SaveSlot[]) {
  localStorage.setItem(KEY, JSON.stringify(slots));
}

export function slotPrefix(id: number) {
  return `slot${id}`;
}
