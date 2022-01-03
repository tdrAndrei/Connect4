
const duckSound = new Audio("../audio/duckSound.wav");

document.getElementById("playButton").addEventListener("click", (event) => {

    duckSound.play();
    setTimeout(()=> document.getElementById("theGame").submit(),1500); 

})

document.getElementById("rulesButton").addEventListener("click", (event) => {
    document.getElementById("theRules").submit();
})

this.socket = new WebSocket("ws://localhost:3000");