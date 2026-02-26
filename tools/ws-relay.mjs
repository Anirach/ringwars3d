// Minimal WebSocket relay for RingWars3D versus mode
// Run: node tools/ws-relay.mjs
// Then connect with: ?mode=host&room=alpha&ws=ws://localhost:8787

import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8787 });
console.log('ws relay on ws://localhost:8787');

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(String(data));
    }
  });
});
