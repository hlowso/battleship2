const PORT          = process.env.PORT || 8080;
const bodyParser    = require('body-parser');
const express       = require('express');
const app           = express();

const MongoClient   = require("mongodb").MongoClient;
const MONGODB_URI   = "mongodb://localhost:27017/";

MongoClient.connect(MONGODB_URI, (err, mongoDB) => {
  if(err) {
    console.error(`Failed to connect: ${MONGODB_URI}`);
    throw err;
  }
  console.log(`Connected to mongodb: ${MONGODB_URI}`);
  const dataAccess = require('./data-access.js')(mongoDB);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(express.static('public'));

  app.get('/leaderboard', (req, res) => {
    dataAccess.getLeaderboard()
      .then(leaderboard => {
        res.status(200).json(leaderboard);
      })
      .catch(err => {
        res.status(400).send(err);
      });
  });

  dataAccess.updateLeaderboard({ 
    username: 'lorde',
    opponent: 'computer'
  });

  app.put('/leaderboard', (req, res) => {
    dataAccess.updateLeaderboard(req.body);
    res.send('got through to put');
  });

  app.listen(PORT, () => {
    console.log('Battleship 2.0 listening on port ' + PORT);
  });
});
