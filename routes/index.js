var express = require('express');
var router = express.Router();
var statTracker = require("../statTracker");

/* GET GAME PAGE. */
router.get('/game', function(req, res, next) {
  res.sendFile("gameScreen.html", { root: "./public/pages" });
});

/*GET SPLASH SCREEN. */

router.get('/', function(req, res, next) {
  //res.sendFile("splashScreen.html", { root: "./public/pages" });
  res.render("splashScreen.ejs", {
    onlineGames: statTracker.onlineGames,
    onlinePlayers: statTracker.onlinePlayers
  })
});

/* GET RULES PAGE. */

router.get('/rules', function(req, res, next) {
  res.sendFile("rulesScreen.html", { root: "./public/pages" });
});

module.exports = router;
