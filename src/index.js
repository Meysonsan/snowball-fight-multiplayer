const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require("./mapLoader");

const SPEED = 5;
const TICK_RATE = 30;

const players = [];
const inputsMap = {};

function tick() {
    for (const player of players) {
        const input = inputsMap[player.id];
        if (input.up) {
            player.y -= SPEED;
        } else if (input.down) {
            player.y += SPEED;
        }

        if (input.left) {
            player.x -= SPEED;
        } else if (input.right) {
            player.x += SPEED;
        }
    }

    io.emit('players', players);
}

async function main() {

    const ground2D = await loadMap();

    io.on('connection', (socket) => {
        console.log('user connected', socket.id);
        inputsMap[socket.id] = { 
            up: false,
            down: false,
            left: false,
            right: false
        };

        players.push({
            id: socket.id,
            x: 0,
            y: 0,
        });

        socket.emit('map', ground2D);

        socket.on('input', (inputs) => {
            inputsMap[socket.id] = inputs;
        });
        socket.on('disconnect', () => {
            delete inputsMap[socket.id];
            players.splice(players.indexOf(socket.id), 1);
        });
    });

    app.use(express.static('public'));


    httpServer.listen(3000);
    setInterval(tick, 1000 / TICK_RATE);
}

main();