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


const duckSound = new Audio("../audio/duckSound.wav");

/*TODO
 *Set status to game aborted and send to server
 */ 
document.getElementById("surrenderButton").addEventListener("click", (event) => {
    duckSound.play();
    setTimeout(()=> {
        document.getElementById("surrender").submit();
    }, 1500);
});

(function setup() {

    const socket = new WebSocket('ws://localhost:3000');
    let playerType;
    let playerColor;
    let game;

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
                    game.lastMove = move;   //update the last move
                   
                    console.log(game);
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

        if(game.moves == playerType){   ///It's my time to move
            document.getElementById("title").textContent = "It's your turn!";
            display(game); //show the gameBoard ; afisez ce e deja colorat
        }
        else 
            document.getElementById("title").textContent = "It's your opponent's turn!";

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
