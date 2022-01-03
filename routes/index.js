var express = require('express');
var router = express.Router();

/* GET GAME PAGE. */
router.get('/game', function(req, res, next) {
  res.sendFile("gameScreen.html", { root: "./public/pages" });
});

/*GET SPLASH SCREEN. */

router.get('/', function(req, res, next) {
  res.sendFile("splashScreen.html", { root: "./public/pages" });
});

/* GET RULES PAGE. */

router.get('/rules', function(req, res, next) {
  res.sendFile("rulesScreen.html", { root: "./public/pages" });
});

module.exports = router;
