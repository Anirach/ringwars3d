import { VersusMsg, VersusView } from './protocol';
import { createTransport } from './transport';

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createVersus(playerName = 'Player') {
  const qs = new URLSearchParams(location.search);
  const room = qs.get('room') || 'ringwars-room-1';
  const mode = qs.get('mode') || 'solo'; // host|client|solo
  const wsUrl = qs.get('ws');

  const selfId = qs.get('pid') || rid();
  const transport = createTransport(room, wsUrl);

  const view: VersusView = {
    selfId,
    names: { [selfId]: playerName },
    scores: { [selfId]: 0 },
    timeLeft: 180,
    target: 1000
  };

  const isHost = mode === 'host';
  const hostState = {
    scores: { [selfId]: 0 } as Record<string, number>,
    names: { [selfId]: playerName } as Record<string, string>,
    timeLeft: 180,
    target: 1000,
    winnerId: undefined as string | undefined
  };

  function emit(msg: VersusMsg) {
    transport.send(msg);
  }

  function broadcastState() {
    if (!isHost) return;
    emit({
      t: 'state',
      scores: hostState.scores,
      names: hostState.names,
      hostId: selfId,
      winnerId: hostState.winnerId,
      timeLeft: hostState.timeLeft,
      target: hostState.target
    });
  }

  transport.onMessage((m) => {
    if (m.t === 'join' && isHost) {
      hostState.names[m.id] = m.name;
      hostState.scores[m.id] ??= 0;
      broadcastState();
      return;
    }

    if (m.t === 'score' && isHost) {
      if (hostState.winnerId) return;
      hostState.scores[m.id] = (hostState.scores[m.id] || 0) + m.delta;
      for (const [pid, sc] of Object.entries(hostState.scores)) {
        if (sc >= hostState.target) hostState.winnerId = pid;
      }
      broadcastState();
      return;
    }

    if (m.t === 'state') {
      view.scores = { ...m.scores };
      view.names = { ...m.names };
      view.hostId = m.hostId;
      view.winnerId = m.winnerId;
      view.timeLeft = m.timeLeft;
      view.target = m.target;
    }
  });

  emit({ t: 'join', id: selfId, name: playerName });
  if (isHost) broadcastState();

  return {
    view,
    mode,
    isHost,
    transport: transport.kind,
    submitScore(delta: number) {
      if (mode === 'solo') return;
      if (isHost) {
        hostState.scores[selfId] = (hostState.scores[selfId] || 0) + delta;
        if (hostState.scores[selfId] >= hostState.target) hostState.winnerId = selfId;
        broadcastState();
      } else {
        emit({ t: 'score', id: selfId, delta });
      }
    },
    tick(dt: number) {
      if (!isHost || mode === 'solo') return;
      if (hostState.winnerId) return;
      hostState.timeLeft = Math.max(0, hostState.timeLeft - dt);
      if (hostState.timeLeft <= 0) {
        const sorted = Object.entries(hostState.scores).sort((a, b) => b[1] - a[1]);
        hostState.winnerId = sorted[0]?.[0];
      }
      if (Math.random() < 0.18) broadcastState();
    },
    destroy() {
      transport.close();
    }
  };
}
