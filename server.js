const uuid          = require('uuid-v4');
const bodyParser    = require('body-parser');
const express       = require('express');
const WebSocket     = require('ws');
const SocketServer  = WebSocket.Server;

const PORT          = 8080;

const MongoClient   = require("mongodb").MongoClient;
const MONGODB_URI   = "mongodb://localhost:27017/";

const app = express()
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static('public'))
  // .use('/', lb_routes)
  // .use(express.Router)
  .use((req, res) => res.sendFile(__dirname + '/public/index.html'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
  
// MongoClient.connect(MONGODB_URI, (err, mongoDB) => {
//   if(err) {
//     console.error(`Failed to connect: ${MONGODB_URI}`);
//     throw err;
//   }
//   console.log(`Connected to mongodb: ${MONGODB_URI}`);
//   const dataAccess = require('./data-access.js')(mongoDB);

//   const lb_routes = express.Router();
//   lb_routes.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html');
//   });
//   lb_routes.get('/leaderboard', (req, res) => {
//     dataAccess.getLeaderboard()
//       .then(leaderboard => {
//         res.status(200).json(leaderboard);
//       })
//       .catch(err => {
//         res.status(400).send(err);
//       });
//   });
//   lb_routes.put('/leaderboard', (req, res) => {
//     dataAccess.updateLeaderboard(req.body);
//     res.status(200).send();
//   });


//   const app = express()
//     .use(bodyParser.urlencoded({ extended: false }))
//     .use(express.static('public'))
//     .use('/', lb_routes)
//     .use(express.Router)
//     .listen(PORT, () => console.log(`Listening on ${ PORT }`));

//   const wss           = new SocketServer({ server: app });
//   const clients       = [];
//   const users         = [];
//   const rooms         = [];

//   const getSocketIndex = (id, remove = false) => {
//   let index;
//   let ws = clients.find((ws, i) => { 
//     index = i;
//     return (ws.id === id); 
//   });

//   return index;
//   };

//   const getUserIndexBySocketId = (id, remove = false) => {
//   let index;
//   let user = users.find((user, i) => { 
//     index = i;
//     return (user.ws_id === id); 
//   });

//   return index;
//   };

//   const getRoomIndexBySocketId = (id, remove = false) => {
//   let index;
//   let room = rooms.find((room, i) => { 
//     index = i;
//     return (room.player1.ws_id === id || room.player2.ws_id === id); 
//   });

//   return index;
//   };

//   const getOpponentBySocketId = (id) => {
//   const room_index = getRoomIndexBySocketId(id);
//   const room = rooms[room_index];
//   if(room.player1.ws_id !== id) {
//     return room.player1;
//   }
//   else {
//     return room.player2;
//   }
//   };

//   const getSocket = (id) => {
//   return clients[getSocketIndex(id)];
//   };
//   const getUserBySocketId = (id) => {
//   return users[getUserIndexBySocketId(id)];
//   };


//   wss.on('connection', (ws) => {

//     console.log('Client connected');
//     const joinProtocol = ({ username }) => {
//       ws.id = uuid();
//       clients.push(ws);
//       const user = {
//         ws_id: ws.id,
//         username
//       };

//       let index;
//       const partner = users.find(user => !user.engaged);

//       if(partner) {
//         let id = uuid();
//         user.engaged     = true;
//         user.game_id     = id;

//         partner.engaged  = true;
//         partner.game_id  = id;

//         rooms.push({
//           id,
//           player1: partner,
//           player2: user
//         });

//         getSocket(partner.ws_id).send(JSON.stringify({ opponent: user }));
//         getSocket(user.ws_id).send(JSON.stringify({ opponent: partner }));

//       } 
//       else {
//         user.engaged = false;
//       }

//       users.push(user);
//     };

//     const readyProtocol = ({ fleet }) => {

//       const user = getUserBySocketId(ws.id);
//       user.fleet = fleet;
//       const opponent = getOpponentBySocketId(ws.id);

//       if(opponent.fleet) {

//         let user_message = {
//           fleet: opponent.fleet
//         };
//         let opponent_message = {
//           fleet
//         };

//         if(Math.random() < 0.5) {
//           user_message.first = true;
//         }
//         else {
//           opponent_message.first = true;
//         }

//         getSocket(opponent.ws_id).send(JSON.stringify(opponent_message));
//         getSocket(user.ws_id).send(JSON.stringify(user_message));
//       }
//     };

//     // const transfer = (data) => {
//     //   const opponent = getOpponentBySocketId(ws.id);
//     //   getSocket(opponent.ws_id).send(JSON.stringify(data));
//     // };

//     const attackProtocol = ({ fleet, sea }) => {
//       const opponent = getOpponentBySocketId(ws.id);
//       getSocket(opponent.ws_id).send(JSON.stringify({ fleet, sea }));
//     };  

//     const sinkProtocol = ({ ship_name }) => {

//       console.log(ship_name);

//       const opponent = getOpponentBySocketId(ws.id);
//       getSocket(opponent.ws_id).send(JSON.stringify({ ship_name }));
//     };

//     const logProtocol = ({ html }) => {
//       const opponent = getOpponentBySocketId(ws.id);
//       getSocket(opponent.ws_id).send(JSON.stringify({ html }));
//     };

//     const overProtocol = () => {
//       const opponent = getOpponentBySocketId(ws.id);
//       // deleteAllRelated(ws, opponent);
//       ws.on('close', () => console.log('Client disconnected.'));
//     };

//     const handleMessage  = (message_string) => {
//       const message  = JSON.parse(message_string);
//       const data     = message.data;

//       switch(message.type) {
//         case 'join':
//           joinProtocol(data);
//           break;
//         case 'ready':
//           readyProtocol(data);
//           break;
//         case 'attack':
//           attackProtocol(data);
//           break;
//         case 'sink':
//           sinkProtocol(data);
//           break;
//         case 'log':
//           logProtocol(data);
//           break;
//         case 'over':
//           overProtocol();
//           break;
//       }
//     };

//     // const deleteAllRelated = (ws, opponent) => {

//     //   users.splice(getUserIndexBySocketId(ws.id), 1);
//     //   users.splice(getUserIndexBySocketId(opponent.ws_id), 1);
//     //   rooms.splice(getRoomIndexBySocketId(opponent.ws_id), 1);
//     //   clients.splice(getSocketIndex(ws.id));
//     //   clients.splice(getSocketIndex(opponent.ws_id));
//     // };

//     ws.on('message', handleMessage);
//     ws.on('close', () => {
//       // Close opponent socket
//       try {
//         const opponent = getOpponentBySocketId(ws.id);
//         getSocket(opponent.ws_id).send(JSON.stringify({ broken: true }));

//         // Delete all objects
//         // deleteAllRelated(ws, opponent);
//       }
//       catch(err) {
//         console.log(err);
//       }
//       console.log('Client disconnected');
//     }); 
//   });
// });


  



  

