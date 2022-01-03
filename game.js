const websocket = require("ws");

class Game {
  
/**
 * Game constructor
 * @param {number} gameId : the game's unique id
 */

constructor(gameId){

    this.playerA = null;
    this.playerB = null;
    this.id = gameId;
    this.gameBoard = Array(6).fill( Array(7).fill(0) );
    this.status = "0";                                       ///game is empty of players
    this.moves = null;                                      ///player's whose turn it is
    this.lastMove = null;                                  ///the last column where a player inserted a chip

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

canITransition(from,to){

    let a,b;

    if(isState(from) == false)
        return false;
    else 
        a = statusMatrix[from];
    
    if(isState(to) == false)
        return false;
    else 
        b = statusMatrix[to];

    return (statusMatrix[a][b] == 1) ; ///true if the state can change from 'from' to 'to'

}

/**
 * Check whether s is a valid state string 
 * @param {string} s 
 * @returns true/false
 */

isState(s){

    return s in statusMatrix;

}

/**
 * Updates the status of the game to 's'
 * @param {string} s 
 */
updateState(s){

    if(isState(s) && canITransition(this.status,s)){      ///update

        this.status = 's';

    }
    else{

        return new Error('Impossible status transition');

    }

}

/**
 * Checks if any of the players have won
 * @returns true/false
 */

verifyIfPlayerWon(){

    if(this.status == '4')
        playerA.wins += 1;
    
    else if(this.status == '5')
        playerB.wins += 1;

}

/**
 * Update the move turn
 */

updateMove(){

    if(this.moves == this.playerA)
        this.moves = this.playerB;

    else if(this.moves == this.playerB)
        this.moves = this.playerA;

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
    }
    else if(this.status == '1'){
        this.playerB = player;
    }
    else{                                            
        return new Error('Game is full');
    }
 
}


}

module.exports = Game; 