const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require("./mapLoader");

const SPEED = 5;
const TICK_RATE = 128;
const SNOWBALL_SPEED = 7;

const players = [];
let snowballs = [];
const inputsMap = {};

function tick(delta) {
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

    for (const snowball of snowballs) {
        snowball.x += Math.cos(snowball.angle) * SNOWBALL_SPEED;
        snowball.y += Math.sin(snowball.angle) * SNOWBALL_SPEED;
        snowball.timeLeft -= delta;
        // remove snowball after 1000 ticks
        if (snowball.timeLeft <= 0) {
            snowballs.splice(snowballs.indexOf(snowball), 1);
        }

        for (const player of players) {
            // const distance = Math.hypot((player.x - snowball.x), (player.y - snowball.y));
            if (player.id === snowball.playerId) continue;
            const distance = Math.sqrt((player.x + 8 - snowball.x) ** 2 + (player.y + 8 - snowball.y) ** 2);
            if (distance <= 8) {
                player.x = 0;
                player.y = 0;
                snowball.timeLeft = -1;
                break;
            }
        }
    }
    // remove snowball after 1000 ticks, another method
    // snowballs = snowballs.filter((snowball) => snowball.timeLeft > 0);

    io.emit('players', players);
    io.emit('snowballs', snowballs);
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
        socket.on('snowball', (angle) => {
            const player =  players.find((player) => player.id === socket.id);
            snowballs.push({
                angle,
                x: player.x,
                y: player.y,
                timeLeft: 1000,
                playerId: socket.id
            });
        });
        socket.on('disconnect', () => {
            delete inputsMap[socket.id];
            players.splice(players.indexOf(socket.id), 1);
        });
    });

    app.use(express.static('public'));


    httpServer.listen(3000);

    let lastUpdate = Date.now();

    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
      }, 1000 / TICK_RATE);
}

main();