//@ts-check

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const http = require('http');
const websocket = require('ws');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const Game = require('./game');
const statTracker = require('./statTracker');
const Player = require('./player');

const app = express();

/**
 * Get port from environment and store in Express.
 */

 const port = normalizePort(process.env.PORT || '3000');
 app.set('port', port);
 
 /**
  * Create HTTP server.
  */
 
const server = http.createServer(app);
 
 /**
  * Listen on provided port, on all network interfaces.
  */
 
 server.listen(port);
 
 /**
  * Normalize a port into a number, string, or false.
  */
 
 function normalizePort(val) {
   var port = parseInt(val, 10);
 
   if (isNaN(port)) {
     // named pipe
     return val;
   }
 
   if (port >= 0) {
     // port number
     return port;
   }
 
   return false;
 }
 
  
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


let playerId = 0;
const playerList = {};

app.use(function (req, res, next){ 

  let cookie = req.cookies.cookieName;
  if(cookie === undefined){             ///client does not have a cookie

    let randomNumber = Math.random().toString();
    randomNumber = randomNumber.substring(2, randomNumber.length);

    res.cookie('cookieName', randomNumber, { maxAge: 120000, httpOnly: false});
    //console.log("Cookie " + randomNumber + " was created.");
    
    const player = new Player(playerId++);
    const key = randomNumber;

    playerList[key] = player;

    console.log("A fost creat playerul " + player.id);
    res.redirect("/");
  }
  else{                               ///cookie exists already
    //console.log("cookie exists", cookie);
  }

  next(); ///goes to the next middleware 

});


app.use('/', indexRouter);
app.use('/users', usersRouter);
const wss = new websocket.Server({ server });

let currentGame = new Game();
const gamesList = {};

wss.on("connection", (stream, req)=>{
  
  const cookie = req.headers.cookie.substring(11, req.headers.cookie.length);
  const player = playerList[cookie];
  const connection = stream;
  player.con = connection;
  player.active = true;
  statTracker.onlinePlayers++;

  console.log("Player " + player.id + " s-a conectat");

  connection.on('message', (data) => {

    const msg = JSON.parse(data.toString());

    if( msg.url == '/' ){ //splashScreen
      connection.send(JSON.stringify({

        'onlineGames': statTracker.onlineGames,
        'onlinePlayers' : statTracker.onlinePlayers,
        'playerWins' : player.wins

      }))

    }
    else{ //gameScreen

       if(gamesList[player.id] == undefined){    ///player is not in a game
          console.log("player " + player.id + " is searching a game");
          currentGame.addPlayer(player);        ///add player to game
          gamesList[player.id] = currentGame;   ///map the player to the game

          if(currentGame.hasTwoConnectedPlayers()){

            console.log("A game has been created");
            statTracker.onlineGames++;        ///increment nr of ongoing games
            currentGame.updateMove();

            currentGame.playerA.con.send(JSON.stringify({
              "game": currentGame,
              "playerType" : "playerA"
            }));
            
            currentGame.playerB.con.send(JSON.stringify({
              "game": currentGame,
              "playerType" : "playerB"
            }));

            currentGame = new Game();

          }

       }

       else {

          /*if(!currentGame.hasTwoConnectedPlayers()){
            currentGame.status = "ABORTED";
            player.con.close();
            delete gamesList[player.id];
            return;
          }*/

          ///2 players are in an ongoing game

          const game = msg.game;
          game.updateMove();
          const isFinished = game.verifyIfPlayerWon();

          game.playerA.con.send(JSON.stringify({
            "game": game
          }));

          game.playerB.con.send(JSON.stringify({
            "game": game 
          }));

          if( isFinished ) {
            game.playerA.con.close();       ///delete the websockets
            game.playerB.con.close();
            
            ///delete the game from each player
            delete gamesList[game.playerA.id];
            delete gamesList[game.playerB.id];

          }

       }

    }
  });

  connection.on("close", function (code) {
    console.log("S a deconectat playerul " + player.id);
    player.active = false;
    statTracker.onlinePlayers--;
  });

})

module.exports = app;
