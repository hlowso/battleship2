const PORT     = process.env.PORT || 8080;
const express  = require('express');
const app      = express();

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log('Battleship 2.0 listening on port ' + PORT);
});
