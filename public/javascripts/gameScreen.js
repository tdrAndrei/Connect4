//@ts-check
(function() {
    let board = document.getElementById('gameBoard');
    board.style.height = 0.8 * window.innerHeight + "px";
    board.style.width = 0.5 * window.innerWidth + "px";
    for( let i = 0; i < 6; i ++ ) {
            for( let j = 0; j < 7; j ++ ) {
            let circle = document.createElement('div');
            circle.id = i.toString() + j.toString();
            circle.class = "gameCircle";

            const radius = 0.1 * Math.min(parseInt(board.style.height), parseInt(board.style.width));
            circle.style.height = radius + "px";
            circle.style.width = radius + "px";
            circle.style.borderWidth = 0.2 * radius + "px";
            circle.style.backgroundColor = 'aliceblue';
            board.appendChild(circle);
        }
    }
})();

let bilutaYou = document.getElementById('youDot');
bilutaYou.style.backgroundColor = "red";

let bilutaOpp = document.getElementById("oppDot");
bilutaOpp.style.backgroundColor = "blue";


const duckSound = new Audio("../audio/duckSound.wav");

document.getElementById("surrenderButton").addEventListener("click", (event) => {
    duckSound.play();
    setTimeout(()=> {document.getElementById("surrender").submit()}, 1500);
});

(function setup() {

    const socket = new WebSocket('ws://localhost:3000');
    let playerType;
    let playerColor;

    socket.addEventListener('open', () => {

        socket.send(JSON.stringify({
            'url' : '/game'
        }));

    });

    socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data.toString());
        const game = msg.game;
        console.log(msg);

        if( playerType == undefined ) {
            playerType = msg.playerType;
            playerColor = (playerType == "playerA") ? "#fa0f0f" : "#4281f5";
            const oppColor = (playerType == "playerA") ? "#4281f5" : "#fa0f0f";
            bilutaYou.style.backgroundColor = playerColor;
            bilutaOpp.style.backgroundColor = oppColor;
        }

        for( let i = 0; i < 6; i ++ ) {
            for( let j = 0; j < 7; j ++ ) {
                let circle = document.getElementById(i.toString() + j.toString());
                circle.addEventListener("click", function move(event) {
                    if( playerType == undefined || game.moves != playerType )
                        return ;

                    let availableRow;
                    let selectedColumn;
                    for( let k = 5; k >= 0; k --) {
                        if( game.gameBoard[k][j] == 0 ) {
                            console.log("a clickuit");
                            availableRow = k;
                            selectedColumn = j;   
                            break;
                        }
                    }

                    if( selectedColumn != null ) {
                        const move = {
                            'row' : availableRow,
                            'col' : selectedColumn
                        }

                        document.getElementById(move.row.toString() + move.col.toString()).style.color = playerColor;
                        game.gameBoard[move.row][move.col] = (playerType == "playerA") ? 'A' : 'B';
                        game.lastMove = move;
                        console.log(game);
                        socket.send(JSON.stringify({
                            'game' : game,
                            'url' : '/game'
                        }));
                    }
                });
            }
        }
        

        if(msg.game.moves == playerType){   ///It's my time to move
            console.log("M am dus aici");
            display(game, playerType); //show the gameBoard ; afisez ce e deja colorat
        }

    });

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

function display(game, playerType) {

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
