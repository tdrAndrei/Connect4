class Player {

    constructor(playerId){
        this.id = playerId;
        this.wins = 0;
        this.active = false;
        this.con = null;
    }
   
}

module.exports = Player;