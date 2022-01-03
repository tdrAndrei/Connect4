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

  }
  else{                               ///cookie exists already
    //console.log("cookie exists", cookie);
  }

  next(); ///goes to the next middleware 

});


app.use('/', indexRouter);
app.use('/users', usersRouter);
const wss = new websocket.Server({ server });

let currentGame = new Game(++statTracker.onlineGames);

wss.on("connection", (stream, req)=>{
  
  const cookie = req.headers.cookie.substring(11, req.headers.cookie.length);
  const player = playerList[cookie];
  const connection = stream;

  console.log("Player " + player.id + " s-a conectat");

  connection.on("close", function (code) {
    console.log("S a deconectat playerul " + player.id);
  });

})





















module.exports = app;






