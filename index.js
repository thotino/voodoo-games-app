const express = require('express');
const bodyParser = require('body-parser');

const { retrieveGames, createGame, updateGame, deleteGame, searchGames, populateGames } = require('./controllers')

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));


app.get('/api/games', retrieveGames)

app.post('/api/games', createGame);

app.delete('/api/games/:id', deleteGame);

app.put('/api/games/:id', updateGame);

app.post('/api/games/search', searchGames);

app.post('/api/games/populate', populateGames);

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
