const PORT     = process.env.PORT || 8080;
const express  = require('express');
const app      = express();

app.set('view engine', 'ejs');

app.use(express.static('public'));


app.get('/', (req, res) => {
  res.render('index');
});

app.listen(PORT, () => {
  console.log('Battleship 2.0 listening on port ' + PORT);
});