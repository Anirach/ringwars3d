import { VersusMsg } from './protocol';

type MsgHandler = (msg: VersusMsg) => void;

export type VersusTransport = {
  kind: 'broadcast' | 'ws';
  send: (msg: VersusMsg) => void;
  onMessage: (handler: MsgHandler) => void;
  close: () => void;
};

function createBroadcastTransport(room: string): VersusTransport {
  const channel = new BroadcastChannel(`ringwars3d:${room}`);
  let handler: MsgHandler | null = null;

  channel.onmessage = (ev) => {
    if (!handler) return;
    handler(ev.data as VersusMsg);
  };

  return {
    kind: 'broadcast',
    send: (msg) => channel.postMessage(msg),
    onMessage: (h) => {
      handler = h;
    },
    close: () => channel.close()
  };
}

function createWsTransport(room: string, wsUrl: string): VersusTransport {
  const ws = new WebSocket(wsUrl);
  const outbox: string[] = [];
  let handler: MsgHandler | null = null;

  const flush = () => {
    if (ws.readyState !== WebSocket.OPEN) return;
    while (outbox.length) ws.send(outbox.shift()!);
  };

  ws.onopen = flush;

  ws.onmessage = (ev) => {
    if (!handler) return;
    try {
      const parsed = JSON.parse(String(ev.data));
      const msg = parsed?.payload ? parsed.payload : parsed;
      const msgRoom = parsed?.room;
      if (msgRoom && msgRoom !== room) return;
      handler(msg as VersusMsg);
    } catch {
      // ignore bad payload
    }
  };

  const send = (msg: VersusMsg) => {
    const payload = JSON.stringify({ room, payload: msg });
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    else outbox.push(payload);
  };

  return {
    kind: 'ws',
    send,
    onMessage: (h) => {
      handler = h;
    },
    close: () => ws.close()
  };
}

export function createTransport(room: string, wsUrl?: string | null): VersusTransport {
  if (wsUrl) {
    try {
      return createWsTransport(room, wsUrl);
    } catch {
      return createBroadcastTransport(room);
    }
  }
  return createBroadcastTransport(room);
}
