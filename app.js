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

    res.cookie('cookieName', randomNumber, { maxAge: 1800000, httpOnly: false});
    //console.log("Cookie " + randomNumber + " was created.");
    
    const player = new Player(playerId++);
    const key = randomNumber;

    playerList[key] = player;

    console.log("A fost creat playerul " + player.id);
    res.redirect("/");
  }
  else{                               ///cookie exists already
    if( playerList[cookie] == undefined ) {
      const player = new Player(playerId++);
      playerList[cookie] = player;
      console.log("A fost creat playerul " + player.id);
      res.redirect("/");
    }
    //console.log("cookie exists", cookie);
  }

  next(); ///goes to the next middleware 

});


app.use('/', indexRouter);
const wss = new websocket.Server({ server });

let currentGame = new Game();

/* Very important!
 * This object represents key/value pairs of playerId / the game they take part in
 * if gamesList[player.id] == undefined then that player isn't involved in a game
 */
const gamesList = {};

wss.on("connection", (stream, req)=>{

  //The header was cookieName=nr, but we only need the number so we cut the prefix
  const cookie = req.headers.cookie.substring(("cookieName=").length, req.headers.cookie.length);

  //Get the player that made the request (it is identified via it's cookie)
  const player = playerList[cookie];
  
  //Save the connection between server and client for further messages 
  const connection = stream;
  player.con = connection;

  //Player is online
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

       if (gamesList[player.id] == undefined){    ///player is not in a game
          console.log("player " + player.id + " is searching a game");

          currentGame.addPlayer(player);        ///add player to game
          gamesList[player.id] = currentGame;   ///map the player to the game

          if (currentGame.hasTwoConnectedPlayers()){

            console.log("A game has been created");
            statTracker.onlineGames++;        ///increment nr of ongoing games
            currentGame.updateMove();
            
            //inform clients that the game has started and which player they are
            currentGame.playerA.con.send(JSON.stringify({
              "game": currentGame,
              "playerType" : "playerA"
            }));
            
            currentGame.playerB.con.send(JSON.stringify({
              "game": currentGame,
              "playerType" : "playerB"
            }));

            //we need to initialize a new currentGame as the old one was full
            currentGame = new Game();
          }
       }

       /* This else branch means that the player was already involved in a game
        * We can receive turn updates or terminal messages from the clients
        * We know there must be a game object in msg
        */
       else {
          if(!gamesList[player.id].hasTwoConnectedPlayers()){
      
            if(msg.game.status == "ABORTED"){
              delete gamesList[player.id];
              currentGame = new Game();
            }

            return;
          }

          //if client refreshes the page, they send only the url; the websocket closes and another one is made.
          if( msg.game == undefined ) {
            const playerType = (player == gamesList[player.id].playerA) ? "playerA" : "playerB";
            player.con.send(JSON.stringify({
              "game": gamesList[player.id],
              "playerType" : playerType
            }));
            return ;
          }

          ///2 players are in an ongoing game
          const game =  gamesList[player.id];
          game.loadGame(msg.game);

          game.updateMove();
          const isFinished = game.verifyIfPlayerWon();

          console.log(game);

          game.playerA.con.send(JSON.stringify({
            "game": game
          }));

          game.playerB.con.send(JSON.stringify({
            "game": game 
          }));

          if( isFinished ) {
            //game.playerA.con.close();       ///delete the websockets
            //game.playerB.con.close();
            
            ///delete the game from each player
            delete gamesList[game.playerA.id];
            delete gamesList[game.playerB.id];
            statTracker.onlineGames --;
    
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
