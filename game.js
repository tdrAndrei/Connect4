const websocket = require("ws");

class Game {
  
/**
 * Game constructor
 */

constructor() {

    this.playerA = null;
    this.playerB = null;
    this.gameBoard = Array(6).fill( Array(7).fill(0) );
    this.status = "0";                                       ///game is empty of players
    this.moves = null;                                      ///player's whose turn it is
    this.lastMove = null;                                  ///the last column where a player inserted a chip
    this.winner = null;                                   ///winner of the game

    this.statusOfGame = {

        "0" : 0,                ///no players in game
        "1" : 1,               ///1 player in game
        "2" : 2,              ///2 players in game => ongoing
        "4_CHIPS" : 3,       ///4 chips of the same color have formed a line
        "A" : 4,            ///playerA won
        "B" : 5,           ///playerB won
        "ABORTED" : 6     ///game aborted
    
    };
    
    /**
     * The matrix encodes the possible game transitions.
     */
    this.statusMatrix = [
    
        [0, 1, 0, 0, 0, 0, 0],      //0 
        [1, 0, 1, 0, 0, 0, 0],     //1 
        [0, 0, 0, 1, 0, 0, 1],    //2  
        [0, 0, 0, 0, 1, 1, 1],   //4_CHIPS
        [0, 0, 0, 0, 0, 0, 0],  //A WON
        [0, 0, 0, 0, 0, 0, 0], //B WON
        [0, 0, 0, 0, 0, 0, 0] //ABORTED
    
    ];

}

//Basically takes a game from client and puts it in a game from server; used when we receive a game from the client, but the game 
//only contains a stringified version (JSON.stringify) with no access to methods; so we copy the attributes to a new game and we can
//access the methods through the new game.

loadGame(msg) {

    this.gameBoard = msg.gameBoard;
    this.status = msg.status;                                       
    this.moves = msg.moves;                                      
    this.lastMove = msg.lastMove;     
    this.statusOfGame = msg.statusOfGame;
    this.statusMatrix = msg.statusMatrix;
    this.winner = msg.winner;
    
}

/**
 * Checks whether the transition from one state to another is possible, by using the statusMatrix. 
 * @param {string} from the state to change from
 * @param {string} to the state to change to
 * @returns true/false if the states can change or not
 */

canITransition(from,to){
    return true;
    let a,b;

    if(this.isState(from) == false)
        return false;
    else 
        a = this.statusMatrix[from];
    
    if(this.isState(to) == false)
        return false;
    else 
        b = this.statusMatrix[to];

    return (this.statusMatrix[a][b] == 1) ; ///true if the state can change from 'from' to 'to'

}

/**
 * Check whether s is a valid state string 
 * @param {string} s 
 * @returns true/false
 */

isState(s){

    return s in this.statusOfGame;

}

/**
 * Updates the status of the game to s
 * @param {string} s 
 */
updateState(s){

    if(this.isState(s) && this.canITransition(this.status,s)){      ///update

        this.status = s;

    }
    else{

        return new Error('Impossible status transition');

    }

}

/**
 * Checks if any of the players have won
 * @returns true/false
 */

 verifyIfPlayerWon(player){
    
    if(this.status == 'ABORTED'){

        if(player == this.playerA){
            this.playerB.wins++;
            this.winner = "playerB";
        }
        else {
            this.playerA.wins++;
            this.winner = "playerA";
        }
        this.moves = null;
        return true;
    }

    if(this.status == '4') {
        this.playerA.wins ++;
        this.winner = "playerA";
        this.moves = null;
        return true;
    }

    else if(this.status == '5') {
        this.playerB.wins ++;
        this.winner = "playerB";
        this.moves = null;
        return true;
    }

    return false;
}

/**
 * Update the move turn
 */

updateMove(){
    if( this.moves == null )
        this.moves = "playerA";

    else if(this.moves == "playerA")
        this.moves = "playerB";

    else if(this.moves == "playerB")
        this.moves = "playerA";

} 

/**
 * Check whether the game is complete
 * @returns true if the game is complete, false otherwise
 */

hasTwoConnectedPlayers(){

    return (this.status == '2');

}


/**
 * Adds a new player to the game, if the game is not full.
 */
 addPlayer(player){

    if(this.status == '0'){
        this.playerA = player;
        this.updateState("1");
    }
    else if(this.status == '1'){
        this.playerB = player;
        this.updateState("2");
    }
    else{                                            
        return new Error('Game is full');
    }
 
}


}

module.exports = Game; 