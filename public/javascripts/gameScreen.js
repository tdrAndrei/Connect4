//@ts-check

let socket = new WebSocket('ws://localhost:3000');
let music = new Audio("../audio/gameScreenMusic.mp4");

let UIHandler = (function() {
    
    let bilutaYou = document.getElementById('youDot');
    bilutaYou.style.backgroundColor = "red";

    let bilutaOpp = document.getElementById("oppDot");
    bilutaOpp.style.backgroundColor = "blue";

    music.volume = 0.4;
    music.play();
    music.onended = () => {
        music.play();
    }

    let setupBoard = () => {

        let board = document.getElementById('gameBoard');
        board.style.height = 0.8 * window.innerHeight + "px";
        board.style.width = 0.5 * window.innerWidth + "px";

        for( let i = 0; i < 6; i ++ ) {
            for( let j = 0; j < 7; j ++ ) {

                let circle = document.createElement('div');
                circle.id = i.toString() + j.toString();
                circle.classList.add("circle");

                const radius = 0.1 * Math.min(parseInt(board.style.height), parseInt(board.style.width));
                circle.style.height = radius + "px";
                circle.style.width = radius + "px";
                circle.style.borderWidth = 0.15 * radius + "px";
                
                circle.addEventListener("click", function move() {
                    
                    const move = GameLogic.makeMove(j);
                    let actualCircle = document.getElementById(move.row.toString() + move.col.toString());
                    
                    actualCircle.classList.remove("circleHover");
                    actualCircle.classList.add("circleClick");
                    actualCircle.addEventListener("animationend", () => {
                        actualCircle.style.backgroundColor = GameLogic.playerColor;
                        actualCircle.classList.remove("circleClick");
                    })

                });
                
                circle.addEventListener("mouseover", () => {
                    const row = GameLogic.getAvailableRow(j);
                    let actualCircle = document.getElementById(row.toString() + j.toString());
                    if(GameLogic.playerType == GameLogic.game.moves && GameLogic.playerType != undefined)
                        actualCircle.classList.add("circleHover");
                })

                circle.addEventListener("mouseout", () => {
                    const row = GameLogic.getAvailableRow(j);
                    let actualCircle = document.getElementById(row.toString() + j.toString());
                    actualCircle.classList.remove("circleHover");
                })
            
               
                board.appendChild(circle);
            }
        }

    }

    let setupSurrender = () => {

        document.getElementById("surrenderButton").addEventListener("click", () => {
                getToHomePage();
        });

    }

    //Simulates the timer
    //Only starts when both players are connected

    let setupTimer = () => {

        let secondsElapsed = 0;
        setInterval(() => {

            secondsElapsed ++;
            // @ts-ignore
            const minutes = parseInt(secondsElapsed / 60);
            const seconds = secondsElapsed % 60;

            document.getElementById('timer').innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

        }, 1000);
    }

    return {
        bilutaYou: bilutaYou,
        bilutaOpp: bilutaOpp,
        setupBoard: setupBoard,
        setupSurrender: setupSurrender,
        setupTimer: setupTimer
    }

})();



(function main() {

    UIHandler.setupBoard();
    UIHandler.setupSurrender();

    /*Send an initial message to the server
     *This signals the server that the client is on the game page looking for a game
     */
    socket.addEventListener('open', () => {

        socket.send(JSON.stringify({
            'url' : '/game'
        }));

    });
   
    /* We either receive the first message from the server that informs us which player are we
     * or it's our turn to move
     */ 
    socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data.toString());
        GameLogic.game = msg.game;

        if( GameLogic.playerType == undefined ) {
           GameLogic.setPlayerType(msg.playerType);
        }
        
        if(msg.game.winner != undefined){

            if(msg.game.winner == "DRAW") {
                document.getElementById("title").textContent = "It's a draw!";
            }
            else if(msg.game.winner == GameLogic.playerType)
                document.getElementById("title").textContent = "You won!";
            else{
                document.getElementById("title").textContent = "You lost! :(";
                GameLogic.display();
            }
            
            sleep(5000).then( () => {
                getToHomePage();
                
            });
            
            return;
        }

        if(GameLogic.game.moves == GameLogic.playerType){   ///It's my time to move
            document.getElementById("title").textContent = "It's your turn!";
            GameLogic.display(); //show the gameBoard ; afisez ce e deja colorat
        }
        else 
            document.getElementById("title").textContent = "It's your opponent's turn!";

    });
    
    window.addEventListener("beforeunload", () => {
        GameLogic.abortGame();
        getToHomePage();
    });

})();

let GameLogic = ( () => {

    let playerType = undefined;
    let playerColor = undefined;
    let game = {};

   /*Add event listeners for all the circles in the game board
    *Don't register the clicks as moves if - the game hasn't started (playerType == undefined)
    *                                      - the game object is not initialised (game == undefined)
    *                                      - It's not our turn to move (game.moves != playerType)
    */ 

    function makeMove(selectedColumn) {

        if( this.playerType == undefined || this.game == undefined || this.game.moves != this.playerType )
            return ;

        //the user can select any column
        //we check if it's a legal move and which is the first available row 
        
        let availableRow = this.getAvailableRow(selectedColumn);
        if( availableRow != null ) {
            const move = {
                'row' : availableRow,
                'col' : selectedColumn
            }

            this.game.gameBoard[move.row][move.col] = (this.playerType == "playerA") ? 'A' : 'B'; //we mark the move in our game matrix
        

            ///CHECK IF THE PLAYER WON THE GAME; if playerA was the last to move, search for 4 'A's; else, 4 'B's

            if(this.game.moves == "playerA")
                if(this.ifFourChips("A") == true)
                    this.game.status = "A";
            
            if(this.game.moves == "playerB")
                if(this.ifFourChips("B") == true)
                    this.game.status = "B";
            
            this.game.lastMove = move;   //update the last move
            
            if( this.game.status != "A" && this.game.status != "B" && this.isDraw() )
                this.game.status = "DRAW";

            socket.send(JSON.stringify({    //send our move back to the server
                'game' : this.game,
                'url' : '/game'
            }));

            return move;

        } else {
            console.log("Invalid selection");
        }

    }

    function getAvailableRow(selectedColumn) {
        let availableRow;

        for( let k = 5; k >= 0; k --) { 
            if( this.game.gameBoard[k][selectedColumn] == 0 ) {
                availableRow = k; 
                break;
            }
        }

        return availableRow;
    }

    function setPlayerType(playerType) {

        this.playerType = playerType;
        
        this.playerColor = (this.playerType == "playerA") ? "#fa0f0f" : "#4281f5";
        const hoverColor = (this.playerType == "playerA") ? "#fa7a7a" : "#94baff";

        const oppColor = (this.playerType == "playerA") ? "#4281f5" : "#fa0f0f";
        
        UIHandler.bilutaYou.style.backgroundColor = this.playerColor;
        UIHandler.bilutaOpp.style.backgroundColor = oppColor;
        
        document.documentElement.style.setProperty('--playerColor', this.playerColor);
        document.documentElement.style.setProperty('--playerColorHover', hoverColor);
        
        UIHandler.setupTimer();

    }

    function abortGame() {
        if( this.game.winner != undefined )
                    return ;
    
        this.game.status = "ABORTED";
        socket.send(JSON.stringify({
            'url': '/game',
            'game': this.game
        }));
    }

    function display() {
        for(let i = 0; i < 6; i++){
            for(let j = 0; j < 7; j++){
                let circle = document.getElementById(i.toString() + j.toString());
                if(this.game.gameBoard[i][j] == 'A')
                    circle.style.backgroundColor = "#fa0f0f";
                else if(this.game.gameBoard[i][j] == 'B' )
                    circle.style.backgroundColor = "#4281f5";
            }
        }
    }

    function ifFourChips(char) {
    
       const mat = this.game.gameBoard; 
    
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
    
    function isDraw() {
        let nr = 0;
        for( let i = 0; i < 6; i ++ ) {
            for( let j = 0; j < 7; j ++ ) {
                if( this.game.gameBoard[i][j] == 0 )
                    nr ++;
            }
        }
    
        return (nr == 0);
    }

    return {
        game: game,
        playerType: playerType,
        playerColor: playerColor,
        makeMove: makeMove,
        getAvailableRow: getAvailableRow,
        setPlayerType: setPlayerType,
        abortGame: abortGame,
        display: display,
        ifFourChips: ifFourChips,
        isDraw: isDraw
    }
})();


function getToHomePage() {
    // @ts-ignore
    document.getElementById("surrender").submit();
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}