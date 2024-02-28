const mapImage = new Image();
mapImage.src = "/snowy-sheet.png";

const santaImage = new Image();
santaImage.src = "/santa.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io(`ws://localhost:3000/`);

let groundMap = [[]];
let players = [];
const TILE_SIZE = 32;

socket.on('connect', () => {
  console.log('connected');
});

socket.on("map", (loadedMap) => {
    groundMap = loadedMap;
});

socket.on('players', (serverPlayers) => {
    players = serverPlayers;
});

const inputs = {
    up: false,
    down: false,
    left: false,
    right: false,
};

window.addEventListener("keydown", (e) => {
    if (e.key === "w") {
        inputs.up = true;
    } else if (e.key === "s") {
        inputs.down = true;
    } else if (e.key === "d") {
        inputs.right = true;
    } else if (e.key === "a") {
        inputs.left = true;
    }
    socket.emit("input", inputs);
});

window.addEventListener("keyup", (e) => {
    if (e.key === "w") {
        inputs.up = false;
    } else if (e.key === "s") {
        inputs.down = false;
    } else if (e.key === "d") {
        inputs.right = false;
    } else if (e.key === "a") {
        inputs.left = false;
    }
    socket.emit("input", inputs);
});

function loop() {
    canvas.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const TILES_IN_ROW = 8;

    for (let row = 0; row < groundMap.length; row++) {
        for (let col = 0; col < groundMap[0].length; col++) {
            let { id } = groundMap[row][col];
            const imageRow = parseInt(id / TILES_IN_ROW);
            const imageCol = id % TILES_IN_ROW;
            canvas.drawImage(
                mapImage,
                imageCol * TILE_SIZE,
                imageRow * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE,
                col * TILE_SIZE,
                row * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }

    for (const player of players) {
        canvas.drawImage(santaImage, player.x, player.y);
    };

    window.requestAnimationFrame(loop);
};

window.requestAnimationFrame(loop);