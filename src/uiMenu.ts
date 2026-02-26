import { Settings } from './core/settings';
import { RunStats, runDurationSec } from './core/runStats';
import { Action, Controls } from './core/controls';
import { SaveSlot } from './core/saveSlots';
import { WeaponType } from './entities/types';

export type MenuApi = {
  getStarted: () => boolean;
  renderRunMeta: (wave: number, stats: RunStats) => void;
  setPaused: (v: boolean) => void;
  setGameOver: (text: string) => void;
  clearGameOver: () => void;
  setRebindLabel: (action: Action | null) => void;
  refreshSlotMeta: (slots: SaveSlot[]) => void;
};

export function mountMenu(
  settings: Settings,
  controls: Controls,
  slots: SaveSlot[],
  selectedSlot: number,
  weapon: WeaponType,
  onSettingsChanged: () => void,
  onRebindRequest: (action: Action) => void,
  onSelectSlot: (id: number) => void,
  onSelectWeapon: (w: WeaponType) => void
): MenuApi {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.background = 'radial-gradient(1200px 500px at 50% -20%, #274987aa, transparent), linear-gradient(180deg,#05070ded,#05070dbb)';
  root.style.backdropFilter = 'blur(2px)';
  root.style.color = '#dce7ff';
  root.style.display = 'grid';
  root.style.placeItems = 'center';
  root.style.zIndex = '20';

  const keyName = (k: string) => (k === ' ' ? 'Space' : k);

  root.innerHTML = `
    <div style="width:min(860px,96vw);background:#0f1526dd;border:1px solid #2a3550;border-radius:14px;padding:18px;font:14px system-ui,sans-serif;box-shadow:0 20px 80px #0008;">
      <h1 style="margin:0 0 2px;letter-spacing:.06em">RINGWARS 3D</h1>
      <p style="margin:0 0 12px;color:#aab7d6">Neon arena survival • v0.8 prototype</p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <button id="startBtn" style="padding:10px 14px;border-radius:10px;border:1px solid #36508b;background:#1d2f58;color:white;cursor:pointer">Start Run</button>
        <button id="resumeBtn" style="display:none;padding:10px 14px;border-radius:10px;border:1px solid #36508b;background:#1d2f58;color:white;cursor:pointer;">Resume</button>
        <label>Save Slot
          <select id="slotSel" style="margin-left:6px"></select>
        </label>
        <label>Weapon
          <select id="weaponSel" style="margin-left:6px">
            <option value="assault">Assault</option>
            <option value="shotgun">Shotgun</option>
            <option value="rail">Rail</option>
          </select>
        </label>
      </div>

      <h3 style="margin:12px 0 8px">Settings</h3>
      <label>Master Volume <input id="master" type="range" min="0" max="1" step="0.01" value="${settings.masterVolume}"></label><br>
      <label>SFX Volume <input id="sfx" type="range" min="0" max="1" step="0.01" value="${settings.sfxVolume}"></label><br>
      <label>Camera Smooth <input id="cam" type="range" min="0.02" max="0.2" step="0.01" value="${settings.cameraSmoothing}"></label>

      <h3 style="margin:16px 0 8px">Controls (Rebind)</h3>
      <div style="display:grid;grid-template-columns:repeat(3,max-content);gap:8px;align-items:center;">
        <span>Dash</span><button id="rb-dash">${keyName(controls.dash)}</button><span>Action: dash</span>
        <span>Shield</span><button id="rb-shield">${keyName(controls.shield)}</button><span>Action: shield</span>
        <span>Burst</span><button id="rb-burst">${keyName(controls.burst)}</button><span>Action: burst</span>
        <span>Slow Time</span><button id="rb-slow">${keyName(controls.slow)}</button><span>Action: slow</span>
        <span>Pause</span><button id="rb-pause">${keyName(controls.pause)}</button><span>Action: pause</span>
      </div>
      <p id="rebindInfo" style="margin-top:8px;color:#ffd38c"></p>
      <p id="slotMeta" style="margin-top:8px;color:#9ac1ff"></p>
      <p id="runMeta" style="margin-top:8px;color:#9fb0d8">Run: not started</p>
      <p id="gameOver" style="margin-top:8px;color:#ff9aa6"></p>
    </div>
  `;

  document.body.appendChild(root);

  let started = false;
  const startBtn = root.querySelector('#startBtn') as HTMLButtonElement;
  const resumeBtn = root.querySelector('#resumeBtn') as HTMLButtonElement;
  const master = root.querySelector('#master') as HTMLInputElement;
  const sfx = root.querySelector('#sfx') as HTMLInputElement;
  const cam = root.querySelector('#cam') as HTMLInputElement;
  const runMeta = root.querySelector('#runMeta') as HTMLParagraphElement;
  const gameOver = root.querySelector('#gameOver') as HTMLParagraphElement;
  const rebindInfo = root.querySelector('#rebindInfo') as HTMLParagraphElement;
  const slotMeta = root.querySelector('#slotMeta') as HTMLParagraphElement;
  const slotSel = root.querySelector('#slotSel') as HTMLSelectElement;
  const weaponSel = root.querySelector('#weaponSel') as HTMLSelectElement;
  weaponSel.value = weapon;

  const renderSlots = (items: SaveSlot[]) => {
    slotSel.innerHTML = items
      .map((s) => `<option value="${s.id}" ${s.id === selectedSlot ? 'selected' : ''}>${s.name}</option>`)
      .join('');
    const sel = items.find((s) => s.id === Number(slotSel.value)) || items[0];
    slotMeta.textContent = `Slot ${sel.id} • Best Score ${sel.bestScore} • Best Wave ${sel.bestWave}`;
  };
  renderSlots(slots);

  const sync = () => {
    settings.masterVolume = Number(master.value);
    settings.sfxVolume = Number(sfx.value);
    settings.cameraSmoothing = Number(cam.value);
    onSettingsChanged();
  };

  master.oninput = sync;
  sfx.oninput = sync;
  cam.oninput = sync;

  slotSel.onchange = () => onSelectSlot(Number(slotSel.value));
  weaponSel.onchange = () => onSelectWeapon(weaponSel.value as WeaponType);

  const map: Record<Action, string> = {
    dash: '#rb-dash', shield: '#rb-shield', burst: '#rb-burst', slow: '#rb-slow', pause: '#rb-pause', restart: ''
  };
  (['dash', 'shield', 'burst', 'slow', 'pause'] as Action[]).forEach((a) => {
    const el = root.querySelector(map[a]) as HTMLButtonElement;
    el.onclick = () => onRebindRequest(a);
  });

  startBtn.onclick = () => {
    started = true;
    root.style.display = 'none';
  };
  resumeBtn.onclick = () => {
    root.style.display = 'none';
  };

  return {
    getStarted: () => started,
    renderRunMeta: (wave, stats) => {
      runMeta.textContent = `Run: ${runDurationSec(stats)}s • Wave ${wave} • Kills ${stats.kills} • Boss Kills ${stats.bossKills}`;
    },
    setPaused: (v) => {
      if (!started) return;
      root.style.display = v ? 'grid' : 'none';
      resumeBtn.style.display = v ? 'inline-block' : 'none';
    },
    setGameOver: (text) => {
      gameOver.textContent = text;
      root.style.display = 'grid';
      resumeBtn.style.display = 'none';
    },
    clearGameOver: () => {
      gameOver.textContent = '';
    },
    setRebindLabel: (action) => {
      rebindInfo.textContent = action ? `Press a key for ${action}... (Esc to cancel)` : '';
    },
    refreshSlotMeta: (updated) => renderSlots(updated)
  };
}
