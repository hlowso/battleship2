const uuid          = require('uuid-v4');
const express       = require('express');
const WebSocket     = require('ws');
const SocketServer  = WebSocket.Server;

const PORT          = 3001;
const server        = express()
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`WebSockets server listening on ${ PORT }`));

const wss           = new SocketServer({ server });
const users         = [];
const rooms         = [];

wss.on('connection', (ws) => {
  console.log('Client connected');


  // TODO come up with a better way of storing
  // players...
  const joinProtocol = (data) => {
    const user = {
      info: data,
      ws
    };
    console.log('JOINING:', user);

    let index;
    const partner  = users.find((user, i) => {
      index = i;
      return !user.info.engaged;
    });

    if(partner) {
      users.splice(index, 1);

      let id = uuid();
      user.info.engaged     = true;
      user.info.game_id     = id;

      partner.info.engaged  = true;
      partner.info.game_id  = id;

      rooms.push({
        id,
        player1: partner,
        player2: user
      });

      partner.ws.send(JSON.stringify(user.info));
      user.ws.send(JSON.stringify(partner.info));

    } 
    else {
      user.info.engaged = false;
      users.push(user);
    }
  };

  const handleMessage  = (message_string) => {
    const message  = JSON.parse(message_string);
    const data     = message.data;

    switch(message.type) {
      case 'join':
        joinProtocol(data);
        break;
    }
  };

  ws.on('message', handleMessage);
  ws.on('close', () => console.log('Client disconnected'));
});