const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

let clients = [];

wss.on('connection', ws => {
  clients.push(ws);

  ws.on('message', message => {
    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

console.log('WebSocket signaling server running on ws://localhost:3000');
