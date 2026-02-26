import * as THREE from 'three';
import { renderUI } from './ui';
import { createComposer } from './effects';
import { sfx } from './audio';
import { createState, resetState } from './core/state';
import { createInput, getMoveAxes, gpPressed, keyDown, mountMobileControls } from './core/input';
import { createPlayer } from './entities/player';
import { createBullets, weaponCooldown } from './entities/bullet';
import { Bullet, Enemy, WeaponType } from './entities/types';
import { spawnWave } from './systems/waves';
import { updateBullets, updateEnemies } from './systems/combatSystem';
import { updatePlayer } from './systems/playerSystem';
import { createEnemyProjectile, EnemyProjectile } from './entities/projectile';
import {
  createAbilityState,
  drainShield,
  toggleShield,
  triggerBurst,
  triggerSlowTime,
  updateAbilityTimers,
  updateEnemyProjectiles
} from './systems/abilitySystem';
import { gainXp, loadProgression, saveProgression, Progression } from './core/progression';
import { loadSettings, saveSettings, Settings } from './core/settings';
import { createRunStats, runDurationSec } from './core/runStats';
import { mountMenu } from './uiMenu';
import { Action, loadControls, saveControls, Controls } from './core/controls';
import { loadSlots, saveSlots, slotPrefix, SaveSlot } from './core/saveSlots';
import { createMinimap } from './uiMinimap';
import { createVersus } from './net/versus';
import { spawnTelegraph, updateTelegraphs, spawnDamageNumber, spawnHitFlash, updateDamageNumbers, updateHitFlashes, spawnDeathBurst, spawnTrail, updateDeathBursts, updateTrails } from './systems/vfxSystem';
import { enemyFireIntervalForWave, enemyProjectileSpeedForWave, enemyShooterCountForWave } from './core/balance';
import { updateBossAttacks } from './systems/bossSystem';
import { createFixedStepClock, consumeSteps } from './net/simClock';
import { buildSnapshot, WorldSnapshot } from './net/snapshot';
import { predictAndSmooth } from './net/prediction';

const app = document.getElementById('app')!;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);
scene.fog = new THREE.Fog(0x05070d, 15, 65);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 8, 12);
const { composer, resize: resizeFx } = createComposer(renderer, scene, camera);

scene.add(new THREE.HemisphereLight(0x88aaff, 0x101020, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 1.3);
dir.position.set(8, 12, 6);
dir.castShadow = true;
scene.add(dir);

const arena = new THREE.Mesh(
  new THREE.CylinderGeometry(16, 16, 0.5, 64),
  new THREE.MeshStandardMaterial({ color: 0x1c2742, roughness: 0.82, metalness: 0.08 })
);
arena.receiveShadow = true;
scene.add(arena);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(15.6, 0.15, 20, 120),
  new THREE.MeshStandardMaterial({ color: 0x6aa5ff, emissive: 0x183368, roughness: 0.25, metalness: 0.75 })
);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.28;
scene.add(ring);

const player = createPlayer();
scene.add(player);

const bossMaterial = new THREE.MeshStandardMaterial({ color: 0xff9f43, emissive: 0x4b1e00, roughness: 0.35, metalness: 0.55 });

const bullets: Bullet[] = [];
const enemies: Enemy[] = [];
const enemyProjectiles: EnemyProjectile[] = [];
const state = createState();
const input = createInput();
mountMobileControls(input);

let slots: SaveSlot[] = loadSlots();
let selectedSlot = 1;
let profileKey = slotPrefix(selectedSlot);
let progression: Progression = loadProgression(profileKey);
let controls: Controls = loadControls(profileKey);
let settings: Settings = loadSettings(profileKey);
let weapon: WeaponType = 'assault';

const abilityState = createAbilityState();
let runStats = createRunStats();
let paused = false;
let rebindAction: Action | null = null;
const minimap = createMinimap();
let cameraShake = 0;
let bossIntroTimer = 0;
const versus = createVersus('Player');
const bossPhaseMap = new Map<string, number>();

const bossBanner = document.createElement('div');
const phasePulse = document.createElement('div');
phasePulse.style.position = 'fixed';
phasePulse.style.inset = '0';
phasePulse.style.pointerEvents = 'none';
phasePulse.style.zIndex = '27';
phasePulse.style.background = 'radial-gradient(circle at center, #ffffff22, #ff8a0011, transparent 65%)';
phasePulse.style.opacity = '0';
document.body.appendChild(phasePulse);
let phasePulseStrength = 0;
bossBanner.style.position = 'fixed';
bossBanner.style.top = '14px';
bossBanner.style.left = '50%';
bossBanner.style.transform = 'translateX(-50%)';
bossBanner.style.zIndex = '28';
bossBanner.style.padding = '8px 14px';
bossBanner.style.border = '1px solid #6e4b2c';
bossBanner.style.borderRadius = '10px';
bossBanner.style.background = '#291609cc';
bossBanner.style.color = '#ffd7ad';
bossBanner.style.font = '700 14px system-ui, sans-serif';
bossBanner.style.display = 'none';
document.body.appendChild(bossBanner);

const menu = mountMenu(
  settings,
  controls,
  slots,
  selectedSlot,
  weapon,
  () => {
    saveSettings(settings, profileKey);
    sfx.setMaster(settings.masterVolume);
    sfx.setSfx(settings.sfxVolume);
  },
  (action) => {
    rebindAction = action;
    menu.setRebindLabel(action);
  },
  (id) => {
    selectedSlot = id;
    profileKey = slotPrefix(selectedSlot);
    progression = loadProgression(profileKey);
    controls = loadControls(profileKey);
    settings = loadSettings(profileKey);
    sfx.setMaster(settings.masterVolume);
    sfx.setSfx(settings.sfxVolume);
  },
  (w) => {
    weapon = w;
  }
);

sfx.setMaster(settings.masterVolume);
sfx.setSfx(settings.sfxVolume);

let enemyFireTimer = 0;
let lastTimeScale = 1;
let prevGp = { rt: false, lb: false, x: false, y: false };

// Netcode-prep runtime (single-player now, deterministic tick + snapshots)
const simClock = createFixedStepClock(60, 5);
let simTick = 0;
const snapshotBuffer: WorldSnapshot[] = [];

function startWave() {
  spawnWave(scene, enemies, state.wave, undefined, bossMaterial);
  if (state.wave % 5 === 0) {
    bossIntroTimer = 1.6;
    bossBanner.textContent = `⚠ BOSS WAVE ${state.wave}`;
    bossBanner.style.display = 'block';
    cameraShake = Math.max(cameraShake, 0.25);
    phasePulseStrength = Math.max(phasePulseStrength, 0.85);
    sfx.phaseShift(0);
  }
}

function hardReset() {
  bullets.forEach((b) => scene.remove(b.mesh));
  enemies.forEach((e) => scene.remove(e.mesh));
  enemyProjectiles.forEach((p) => scene.remove(p.mesh));
  bullets.length = 0;
  enemies.length = 0;
  enemyProjectiles.length = 0;
  resetState(state);
  runStats = createRunStats();
  player.position.set(0, 1, 0);
  menu.clearGameOver();
  bossBanner.style.display = 'none';
  bossPhaseMap.clear();
  startWave();
}

function fireWeapon() {
  if (!menu.getStarted() || paused || !state.alive || state.cooldown > 0) return;
  const spawned = createBullets(player.position, enemies, weapon);
  spawned.forEach((b) => {
    bullets.push(b);
    scene.add(b.mesh);
  });
  state.cooldown = weaponCooldown(weapon);
  sfx.shoot();
}

window.addEventListener('pointerdown', fireWeapon);

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();

  if (rebindAction) {
    if (k !== 'escape') {
      controls[rebindAction] = k;
      saveControls(controls, profileKey);
    }
    rebindAction = null;
    menu.setRebindLabel(null);
    return;
  }

  if (k === controls.pause) {
    paused = !paused;
    menu.setPaused(paused);
    return;
  }

  if (!menu.getStarted()) return;

  if (k === controls.restart && !state.alive) hardReset();

  if (k === '1' && progression.points > 0) { progression.points--; progression.abilities.shield += 1; saveProgression(progression, profileKey); }
  if (k === '2' && progression.points > 0) { progression.points--; progression.abilities.burst += 1; saveProgression(progression, profileKey); }
  if (k === '3' && progression.points > 0) { progression.points--; progression.abilities.slowTime += 1; saveProgression(progression, profileKey); }

  if (k === '4') weapon = 'assault';
  if (k === '5') weapon = 'shotgun';
  if (k === '6') weapon = 'rail';

  if (k === controls.burst) {
    const kills = triggerBurst(abilityState, progression, player, enemies, scene);
    if (kills > 0) {
      const burstScore = kills * 20;
      state.score += burstScore;
      runStats.kills += kills;
      gainXp(progression, kills * 15);
      versus.submitScore(burstScore);
      saveProgression(progression, profileKey);
      sfx.kill();
      cameraShake = Math.max(cameraShake, 0.2);
    }
  }

  if (k === controls.slow && triggerSlowTime(abilityState, progression)) sfx.hit();
});

const clock = new THREE.Clock();
startWave();

function animate() {
  const rawDt = Math.min(clock.getDelta(), 0.033);
  const timeScale = abilityState.slowTimeActive > 0 ? 0.45 : 1;
  const dt = rawDt * timeScale;

  if (lastTimeScale !== timeScale) {
    renderer.toneMappingExposure = timeScale < 1 ? 0.92 : 1.1;
    lastTimeScale = timeScale;
  }

  if (bossIntroTimer > 0) {
    bossIntroTimer -= rawDt;
    if (bossIntroTimer <= 0) bossBanner.style.display = 'none';
  }

  consumeSteps(simClock, rawDt * 1000, () => {
    simTick += 1;
  });

  if (menu.getStarted() && !paused && state.alive && bossIntroTimer <= 0) {
    const gpAxes = getMoveAxes();
    const gpDash = gpPressed(0);
    const gpRt = gpPressed(7);
    const gpLb = gpPressed(4);
    const gpX = gpPressed(2);
    const gpY = gpPressed(3);

    const moveResult = updatePlayer(player, input, rawDt, state.dashCooldown <= 0, gpAxes, gpDash || keyDown(input, controls.dash));
    if (moveResult.usedDash) {
      state.dashCooldown = 1.7;
      state.rollCooldown = 1.7;
      state.rollTimer = 0.18;
      state.invulnTimer = 0.26;
      cameraShake = Math.max(cameraShake, 0.06);
    }

    if ((gpRt && !prevGp.rt) && state.cooldown <= 0) fireWeapon();
    if (gpX && !prevGp.x) {
      const kills = triggerBurst(abilityState, progression, player, enemies, scene);
      if (kills > 0) {
        const burstScore = kills * 20;
        state.score += burstScore;
        runStats.kills += kills;
        gainXp(progression, kills * 15);
        versus.submitScore(burstScore);
        saveProgression(progression, profileKey);
        sfx.kill();
        cameraShake = Math.max(cameraShake, 0.2);
      }
    }
    if (gpY && !prevGp.y && triggerSlowTime(abilityState, progression)) sfx.hit();

    prevGp = { rt: gpRt, lb: gpLb, x: gpX, y: gpY };

    state.cooldown = Math.max(0, state.cooldown - rawDt);
    state.dashCooldown = Math.max(0, state.dashCooldown - rawDt);
    state.rollCooldown = Math.max(0, state.rollCooldown - rawDt);
    state.rollTimer = Math.max(0, state.rollTimer - rawDt);
    state.invulnTimer = Math.max(0, state.invulnTimer - rawDt);

    updateAbilityTimers(abilityState, rawDt);
    toggleShield(abilityState, progression, keyDown(input, controls.shield) || gpLb);
    drainShield(abilityState, rawDt);

    const bulletEvents = updateBullets(scene, bullets, enemies, dt);
    if (bulletEvents.hitCount > 0) sfx.hit();
    if (bulletEvents.killCount > 0) sfx.kill();
    state.score += bulletEvents.scoreGain;
    runStats.kills += bulletEvents.killCount;

    for (const hit of bulletEvents.hits) {
      const color = hit.weakPointHit ? '#8df0ff' : hit.killed ? '#ffb86c' : hit.eliteLevel > 0 ? '#f7a6ff' : '#ffd27a';
      spawnDamageNumber(hit.position, `${hit.damage}${hit.weakPointHit ? '!' : ''}`, color);
      spawnHitFlash(scene, hit.position, hit.weakPointHit ? 0x85e7ff : hit.killed ? 0xff9b52 : 0xffe08a, hit.isBoss ? 1.3 : 1);
      if (hit.killed) spawnDeathBurst(scene, hit.position, hit.isBoss ? 0xffa94e : hit.eliteLevel > 0 ? 0xd49bff : 0xffc987);
      if (hit.weakPointHit) phasePulseStrength = Math.max(phasePulseStrength, 0.35);
      cameraShake = Math.max(cameraShake, hit.killed ? 0.12 : 0.05);
    }

    if (bulletEvents.scoreGain > 0) {
      gainXp(progression, bulletEvents.scoreGain);
      saveProgression(progression, profileKey);
      versus.submitScore(bulletEvents.scoreGain);
    }

    for (const b of bullets) {
      if (Math.random() < 0.6) spawnTrail(scene, b.mesh.position, weapon === 'rail' ? 0x8ef6ff : 0xffd27a, weapon === 'rail' ? 1.2 : 1);
    }

    const t = performance.now() * 0.001;
    const enemyEvents = updateEnemies(player, enemies, dt, t);
    for (const e of enemies) predictAndSmooth(e.mesh.uuid, e.mesh.position, rawDt);
    const meleeDamage = state.invulnTimer > 0 ? 0 : enemyEvents.hpDamage;
    state.hp -= meleeDamage;
    runStats.damageTaken += meleeDamage;
    if (meleeDamage > 0) cameraShake = Math.max(cameraShake, 0.08);

    for (const e of enemies) {
      if (!e.isBoss) continue;
      const maxHp = e.maxHp ?? 260;
      const ratio = e.hp / Math.max(1, maxHp);
      const phase = ratio < 0.33 ? 2 : ratio < 0.66 ? 1 : 0;
      const prev = bossPhaseMap.get(e.mesh.uuid) ?? 0;
      if (phase > prev) {
        bossPhaseMap.set(e.mesh.uuid, phase);
        bossBanner.textContent = `BOSS ENRAGED • PHASE ${phase + 1}`;
        bossBanner.style.display = 'block';
        bossIntroTimer = Math.max(bossIntroTimer, 0.9);
        spawnTelegraph(scene, e, 0.7);
        cameraShake = Math.max(cameraShake, 0.28);
        phasePulseStrength = Math.max(phasePulseStrength, 1);
        sfx.phaseShift(phase);
      }
    }

    const bossAtk = updateBossAttacks(scene, enemies, enemyProjectiles, player, state.wave, rawDt, t);
    if (bossAtk.hpDamage > 0) {
      const applied = state.invulnTimer > 0 ? 0 : bossAtk.hpDamage;
      state.hp -= applied;
      runStats.damageTaken += applied;
      if (applied > 0) {
        spawnDamageNumber(player.position.clone(), `-${Math.floor(applied)}`, '#ff8e8e');
        spawnHitFlash(scene, player.position.clone(), 0xff6b6b, 1.4);
      }
    }
    if (bossAtk.shake > 0) {
      cameraShake = Math.max(cameraShake, bossAtk.shake);
      phasePulseStrength = Math.max(phasePulseStrength, bossAtk.shake * 0.9);
    }
    if (bossAtk.phaseEvent) {
      phasePulseStrength = Math.max(phasePulseStrength, 0.95);
      sfx.phaseShift(2);
    }

    enemyFireTimer += rawDt;
    const fireEvery = enemyFireIntervalForWave(state.wave);
    if (enemyFireTimer >= fireEvery && enemies.length > 0) {
      enemyFireTimer = 0;
      const shooters = Math.min(enemyShooterCountForWave(state.wave), enemies.length);
      const pSpeed = enemyProjectileSpeedForWave(state.wave);
      for (let i = 0; i < shooters; i++) {
        const idx = Math.floor(Math.random() * enemies.length);
        const e = enemies[idx];
        spawnTelegraph(scene, e, e.isBoss ? 0.55 : 0.4);
        const p = createEnemyProjectile(e.mesh.position.clone(), player.position.clone(), pSpeed);
        p.life += state.wave * 0.02;
        enemyProjectiles.push(p);
        scene.add(p.mesh);
      }
    }

    const projectileDamage = updateEnemyProjectiles(scene, enemyProjectiles, player, dt, abilityState.shieldActive);
    const appliedProjectile = state.invulnTimer > 0 ? 0 : projectileDamage;
    state.hp -= appliedProjectile;
    runStats.damageTaken += appliedProjectile;
    if (appliedProjectile > 0) cameraShake = Math.max(cameraShake, abilityState.shieldActive ? 0.04 : 0.1);

    if (enemies.length === 0) {
      state.spawnTimer += rawDt;
      if (state.spawnTimer > 1.2) {
        if (state.wave % 5 === 0) runStats.bossKills += 1;
        state.wave += 1;
        state.spawnTimer = 0;
        startWave();
      }
    }

    if (state.hp <= 0) {
      state.alive = false;
      state.hp = 0;
      sfx.gameOver();
      cameraShake = 0.35;
      saveProgression(progression, profileKey);

      const slot = slots.find((s) => s.id === selectedSlot);
      if (slot) {
        slot.bestScore = Math.max(slot.bestScore, state.score);
        slot.bestWave = Math.max(slot.bestWave, state.wave);
        slot.updatedAt = Date.now();
        saveSlots(slots);
        menu.refreshSlotMeta(slots);
      }

      menu.setGameOver(`Game Over • ${runDurationSec(runStats)}s • Score ${state.score} • Wave ${state.wave} • Kills ${runStats.kills}`);
    }
  }

  updateTelegraphs(scene, rawDt, enemies);
  updateHitFlashes(scene, rawDt);
  updateDeathBursts(scene, rawDt);
  updateTrails(scene, rawDt);
  updateDamageNumbers(camera, rawDt);

  phasePulseStrength = Math.max(0, phasePulseStrength - rawDt * 1.9);
  phasePulse.style.opacity = `${phasePulseStrength * 0.65}`;

  const pMat = player.material as THREE.MeshStandardMaterial;
  pMat.emissiveIntensity = state.invulnTimer > 0 ? 1.8 : 1;

  ring.rotation.z += dt * 0.25;
  ring.position.y = 0.28 + Math.sin(performance.now() * 0.0015) * 0.02;

  const camTarget = player.position.clone().add(new THREE.Vector3(0, 5.8, 9.5));
  const shake = cameraShake;
  cameraShake = Math.max(0, cameraShake - rawDt * 1.8);
  const shakeVec = new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.5, (Math.random() - 0.5) * shake);
  camera.position.lerp(camTarget.clone().add(shakeVec), settings.cameraSmoothing);
  camera.lookAt(player.position.x, player.position.y + 0.8, player.position.z);

  if (simTick % 15 === 0) {
    snapshotBuffer.push(buildSnapshot(simTick, state.wave, state.score, player, state.hp, enemies));
    if (snapshotBuffer.length > 120) snapshotBuffer.shift();
  }

  versus.tick(rawDt);
  if (versus.mode !== 'solo' && versus.view.winnerId && state.alive) {
    state.alive = false;
    const me = versus.view.selfId;
    const text = versus.view.winnerId === me ? 'MATCH RESULT • YOU WIN' : 'MATCH RESULT • YOU LOSE';
    menu.setGameOver(text);
  }

  minimap.render(player, enemies, state.wave);
  menu.renderRunMeta(state.wave, runStats);
  renderUI(state, progression, abilityState, versus.view, versus.mode);
  composer.render();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  resizeFx(w, h);
});

window.addEventListener('beforeunload', () => {
  versus.destroy();
});
