class Player {

    constructor(playerId, stream){
        this.id = playerId;
        this.connection = stream;
        this.wins = 0;
    }
   
}

module.exports = Player;