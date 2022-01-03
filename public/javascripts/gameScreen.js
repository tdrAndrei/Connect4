(function() {
    let board = document.getElementById('gameBoard');
    board.style.height = 0.8 * window.innerHeight + "px";
    board.style.width = 0.5 * window.innerWidth + "px";
    for( let i = 0; i < 42; i ++ ) {
        let circle = document.createElement('div');
        circle.id = i;
        circle.class = "gameCircle";

        const radius = 0.1 * Math.min(parseInt(board.style.height), parseInt(board.style.width));
        circle.style.height = radius + "px";
        circle.style.width = radius + "px";
        circle.style.borderWidth = 0.2 * radius + "px";

        board.appendChild(circle);
    }
})();

let secondsElapsed = 0;
setInterval(() => {
    secondsElapsed ++;
    const minutes = parseInt(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;

    document.getElementById('timer').innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}, 1000);

let bilutaYou = document.getElementById('youDot');
bilutaYou.style.backgroundColor = "red";

let bilutaOpp = document.getElementById("oppDot");
bilutaOpp.style.backgroundColor = "blue";


const duckSound = new Audio("../audio/duckSound.wav");

document.getElementById("surrenderButton").addEventListener("click", (event) => {

    duckSound.play();
    setTimeout(()=> {document.getElementById("surrender").submit()}, 1500);

});

console.log(this.socket);


