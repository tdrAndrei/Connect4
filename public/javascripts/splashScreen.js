
const duckSound = new Audio("../audio/duckSound.wav");

document.getElementById("playButton").addEventListener("click", (event) => {

    duckSound.play();
    setTimeout(()=> document.getElementById("theGame").submit(),1500); 

})

document.getElementById("rulesButton").addEventListener("click", (event) => {
    document.getElementById("theRules").submit();
})

this.socket = new WebSocket("ws://localhost:3000");
socket.addEventListener('open', () => {
    socket.send(JSON.stringify({'url': '/'}));
    setInterval( () =>{
        socket.send(JSON.stringify({'url': '/'}));
    }, 5000 );
});

socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data.toString());
    console.log(msg);
    document.getElementById("onlinePlayers").textContent = msg.onlinePlayers;
    document.getElementById("onlineGames").textContent = msg.onlineGames;
    document.getElementById("yourWins").textContent = msg.playerWins;
});

