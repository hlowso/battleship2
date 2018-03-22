const uuid          = require('uuid-v4');
const express       = require('express');
const WebSocket     = require('ws');
const SocketServer  = WebSocket.Server;

const PORT          = 3001;
const server        = express()
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`WebSockets server listening on ${ PORT }`));

const wss           = new SocketServer({ server });
const clients       = [];
const users         = [];
const rooms         = [];

const getSocket = (id) => {
  return clients.find(ws => ws.id === id);
};

const getUserBySocketId = (id) => {
  return users.find(user => user.ws_id === id);
};

const getRoomBySocketId = (id) => {
  return rooms.find(room => (room.player1.ws_id === id || room.player2.ws_id === id));
};

const getOpponentBySocketId = (id) => {
  // console.log(id);
  const room = getRoomBySocketId(id);

  // console.log(room);

  if(room.player1.ws_id !== id) {
    return room.player1;
  }
  else {
    return room.player2;
  }
};

wss.on('connection', (ws) => {

  console.log('Client connected');

  const joinProtocol = ({ username }) => {
    ws.id = uuid();
    clients.push(ws);
    const user = {
      ws_id: ws.id,
      username
    };
    console.log('JOINING:', user);

    let index;
    const partner = users.find(user => !user.engaged);

    if(partner) {
      let id = uuid();
      user.engaged     = true;
      user.game_id     = id;

      partner.engaged  = true;
      partner.game_id  = id;

      rooms.push({
        id,
        player1: partner,
        player2: user
      });

      getSocket(partner.ws_id).send(JSON.stringify({ opponent: user }));
      getSocket(user.ws_id).send(JSON.stringify({ opponent: partner }));

    } 
    else {
      user.engaged = false;
    }

    users.push(user);
  };

  const readyProtocol = ({ fleet }) => {

    console.log(fleet, users);

    const user = getUserBySocketId(ws.id);
    user.fleet = fleet;

    const opponent = getOpponentBySocketId(ws.id);
    if(opponent.fleet) {
      getSocket(opponent.ws_id).send(JSON.stringify({ fleet }));
      getSocket(user.ws_id).send(JSON.stringify({ fleet: opponent.fleet }));
    }
  };

  const handleMessage  = (message_string) => {
    const message  = JSON.parse(message_string);
    const data     = message.data;

    switch(message.type) {
      case 'join':
        joinProtocol(data);
        break;
      case 'ready':
        readyProtocol(data);
        break;
    }
  };

  ws.on('message', handleMessage);
  ws.on('close', () => console.log('Client disconnected'));
});