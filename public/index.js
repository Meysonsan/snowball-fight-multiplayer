const mapImage = new Image();
mapImage.src = "/snowy-sheet.png";

const canvasEl = document.getElementById("canvas");
canvasEl.width = window.innerWidth;
canvasEl.height = window.innerHeight;
const canvas = canvasEl.getContext("2d");

const socket = io(`ws://localhost:3000/`);

let groundMap = [[]];
const TILE_SIZE = 32;

socket.on('connect', () => {
  console.log('connected');
});

socket.on("map", (loadedMap) => {
    groundMap = loadedMap;
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
    window.requestAnimationFrame(loop);
};

window.requestAnimationFrame(loop);