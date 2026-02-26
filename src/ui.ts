import { GameState } from './core/state';
import { Progression } from './core/progression';
import { AbilityState } from './systems/abilitySystem';
import { VersusView } from './net/protocol';

const ensure = (id: string) => document.getElementById(id)!;

const hpEl = ensure('health');
const scoreEl = ensure('score');

function ensureBadge(id: string, fallback: string) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('span');
    el.id = id;
    el.className = 'badge';
    el.textContent = fallback;
    scoreEl.parentElement?.appendChild(el);
  }
  return el;
}

const waveEl = ensureBadge('wave', 'Wave 1');
const stateEl = ensureBadge('state', 'LIVE');
const levelEl = ensureBadge('level', 'Lv 1');
const pointsEl = ensureBadge('points', 'Pts 0');
const abilityEl = ensureBadge('abilities', 'Abilities S:0 B:0 T:0');
const versusEl = ensureBadge('versus', 'Versus: solo');

export function renderUI(
  state: GameState,
  progression: Progression,
  abilityState: AbilityState,
  versus?: VersusView,
  mode: string = 'solo'
) {
  hpEl.textContent = `HP ${Math.max(0, Math.floor(state.hp))}`;
  scoreEl.textContent = `Score ${state.score}`;
  waveEl.textContent = `Wave ${state.wave}`;
  stateEl.textContent = state.alive ? 'LIVE' : 'GAME OVER (press R)';

  levelEl.textContent = `Lv ${progression.level} XP ${Math.floor(progression.xp)}/${progression.level * 100}`;
  pointsEl.textContent = `Pts ${progression.points}`;
  abilityEl.textContent = `Abilities S:${progression.abilities.shield} B:${progression.abilities.burst} T:${progression.abilities.slowTime} | Shield ${Math.floor(abilityState.shieldEnergy)}`;

  if (!versus || mode === 'solo') {
    versusEl.textContent = 'Versus: solo';
  } else {
    const entries = Object.entries(versus.scores);
    const me = versus.selfId;
    const mine = versus.scores[me] ?? 0;
    const opp = entries.find(([id]) => id !== me);
    const oppName = opp ? (versus.names[opp[0]] || 'Opponent') : 'Waiting...';
    const oppScore = opp ? opp[1] : 0;
    const timeLeft = Math.ceil(versus.timeLeft);
    const winner = versus.winnerId ? (versus.winnerId === me ? 'You win' : `${versus.names[versus.winnerId] || 'Opponent'} wins`) : '';
    versusEl.textContent = `VS ${oppName}: ${mine}-${oppScore} | ${timeLeft}s | target ${versus.target}${winner ? ` | ${winner}` : ''}`;
  }
}
