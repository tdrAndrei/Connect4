//@ts-check
(function() {
    let board = document.getElementById('gameBoard');
    board.style.height = 0.8 * window.innerHeight + "px";
    board.style.width = 0.5 * window.innerWidth + "px";
    for( let i = 0; i < 6; i ++ ) {
            for( let j = 0; j < 7; j ++ ) {
            let circle = document.createElement('div');
            circle.id = i.toString() + j.toString();

            const radius = 0.1 * Math.min(parseInt(board.style.height), parseInt(board.style.width));
            circle.style.height = radius + "px";
            circle.style.width = radius + "px";
            circle.style.borderWidth = 0.15 * radius + "px";
            board.appendChild(circle);
        }
    }
})();

let bilutaYou = document.getElementById('youDot');
bilutaYou.style.backgroundColor = "red";

let bilutaOpp = document.getElementById("oppDot");
bilutaOpp.style.backgroundColor = "blue";

(function setup() {

    const socket = new WebSocket('ws://localhost:3000');
    let playerType;
    let playerColor;
    let game = {};
    const duckSound = new Audio("../audio/duckSound.wav");

    document.getElementById("surrenderButton").addEventListener("click", () => {
        duckSound.play();
        setTimeout(()=> {
            //abortGame(game, socket);
            getToHomePage();
        }, 1500);
    });

    /*Send an initial message to the server
     *This signals the server that the client is on the game page looking for a game
     */
    socket.addEventListener('open', () => {

        socket.send(JSON.stringify({
            'url' : '/game'
        }));

    });

    /*Add event listeners for all the circles in the game board
     *Don't register the clicks as moves if - the game hasn't started (playerType == undefined)
     *                                      - the game object is not initialised (game == undefined)
     *                                      - It's not our turn to move (game.moves != playerType)
     */ 
    for( let i = 0; i < 6; i ++ ) {
        for( let j = 0; j < 7; j ++ ) {
            let circle = document.getElementById(i.toString() + j.toString());

            circle.addEventListener("click", function move() {
                if( playerType == undefined || game == undefined || game.moves != playerType )
                    return ;

                //the user can select any column
                //we check if it's a legal move and which is the first available row 
                let availableRow;
                let selectedColumn = j;
                for( let k = 5; k >= 0; k --) { 
                    if( game.gameBoard[k][selectedColumn] == 0 ) {
                        console.log("a clickuit");
                        availableRow = k; 
                        break;
                    }
                }

                if( availableRow != null ) {
                    const move = {
                        'row' : availableRow,
                        'col' : selectedColumn
                    }

                    document.getElementById(move.row.toString() + move.col.toString()).style.backgroundColor = playerColor; //change the color of the apropriate circle
                    game.gameBoard[move.row][move.col] = (playerType == "playerA") ? 'A' : 'B'; //we mark the move in our game matrix
                   

                    ///CHECK IF THE PLAYER WON THE GAME; if playerA was the last to move, search for 4 'A's; else, 4 'B's

                    if(game.moves == "playerA")
                        if(ifFourChips(game, "A") == true)
                            game.status = "A";
                    
                    if(game.moves == "playerB")
                         if(ifFourChips(game, "B") == true)
                            game.status = "B";
                    
                    game.lastMove = move;   //update the last move
                    
                    if( game.status != "A" && game.status != "B" && isDraw(game) )
                        game.status = "DRAW";

                    socket.send(JSON.stringify({    //send our move back to the server
                        'game' : game,
                        'url' : '/game'
                    }));

                } else {
                    console.log("Invalid selection");
                }
            });
        }
    }

    /* We either receive the first message from the server that informs us which player are we
     * or it's our turn to move
     */ 
    socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data.toString());
        game = msg.game;
        console.log(msg);

        if( playerType == undefined ) {
            playerType = msg.playerType;
            playerColor = (playerType == "playerA") ? "#fa0f0f" : "#4281f5";
            const oppColor = (playerType == "playerA") ? "#4281f5" : "#fa0f0f";
            bilutaYou.style.backgroundColor = playerColor;
            bilutaOpp.style.backgroundColor = oppColor;
        }
        
        if(msg.game.winner != undefined){

            if(msg.game.winner == "DRAW") {
                document.getElementById("title").textContent = "It's a draw!";
            }
            else if(msg.game.winner == playerType)
                document.getElementById("title").textContent = "You won!";
            else{
                document.getElementById("title").textContent = "You lost! :(";
                display(game);
            }
            
            sleep(5000).then( () => {
                getToHomePage();
                
            });
            
            return;
        }

        if(game.moves == playerType){   ///It's my time to move
            document.getElementById("title").textContent = "It's your turn!";
            display(game); //show the gameBoard ; afisez ce e deja colorat
        }
        else 
            document.getElementById("title").textContent = "It's your opponent's turn!";

    });
    
    window.addEventListener("beforeunload", () => {
        abortGame(game, socket);
        getToHomePage();
    });

    //Simulates the timer
    //Only starts when both players are connected
    let secondsElapsed = 0;
    setInterval(() => {

        if(playerType != undefined){
            secondsElapsed ++;
            // @ts-ignore
            const minutes = parseInt(secondsElapsed / 60);
            const seconds = secondsElapsed % 60;

            document.getElementById('timer').innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        }

    }, 1000);

})();

function getToHomePage() {
    //wait 1 sec
    document.getElementById("surrender").submit();
}

function abortGame(game, socket) {
    if( game.winner != undefined )
                return ;

    game.status = "ABORTED";
    socket.send(JSON.stringify({
        'url': '/game',
        'game': game
    }));
}

function display(game) {

    for(let i = 0; i < 6; i++){
        for(let j = 0; j < 7; j++){
            let circle = document.getElementById(i.toString() + j.toString());
            if(game.gameBoard[i][j] == 'A')
                circle.style.backgroundColor = "#fa0f0f";
            else if( game.gameBoard[i][j] == 'B' )
                circle.style.backgroundColor = "#4281f5";
        }
    }
}

function ifFourChips(game,char){
    
    const mat = game.gameBoard; 

   for(let i = 0; i < 6; i++){      ///horizontally
       for(let j = 0; j < 4; j++){
           if(mat[i][j] == char && mat[i][j+1] == char && mat[i][j+2] == char && mat[i][j+3] == char)
                return true;
       }
   }

   for(let i = 0; i < 3; i++){      ///vertically
    for(let j = 0; j < 7; j++){
        if(mat[i][j] == char && mat[i+1][j] == char && mat[i+2][j] == char && mat[i+3][j] == char)
             return true;
    }
  }

  for(let i = 0; i < 3; i++){      ///diagonally left-right
    for(let j = 0; j < 4; j++){
        if(mat[i][j] == char && mat[i+1][j+1] == char && mat[i+2][j+2] == char && mat[i+3][j+3] == char)
             return true;
    }
  }

  for(let i = 0; i < 3; i++){      ///diagonally right-left
    for(let j = 6; j > 2; j--){
        if(mat[i][j] == char && mat[i+1][j-1] == char && mat[i+2][j-2] == char && mat[i+3][j-3] == char)
             return true;
    }
  }

  return false;

}

function isDraw(game) {
    let nr = 0;
    for( let i = 0; i < 6; i ++ ) {
        for( let j = 0; j < 7; j ++ ) {
            if( game.gameBoard[i][j] == 0 )
                nr ++;
        }
    }

    return (nr == 0);
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}