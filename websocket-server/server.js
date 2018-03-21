const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;

const PORT = 3001;
const server = express()
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`WebSockets server listening on ${ PORT }`));

const wss = new SocketServer({ server });
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => console.log('Client disconnected'));
});