const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

const loadMap = require("./mapLoader");

const SPEED = 5;
const TICK_RATE = 64;
const SNOWBALL_SPEED = 7;
const PLSYER_SIZE = 32;
const TILE_SIZE = 32;

const players = [];
let snowballs = [];
const inputsMap = {};
let ground2D, decal2D;

function isColliding(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.h + rect1.y > rect2.y
    );
}

function isCollidingWithMap(player) {
    for (let row = 0; row < decal2D.length; row++) {
        for (let col = 0; col < decal2D[0].length; col++) {
            const tile = decal2D[row][col];
            if (
                tile &&
                isColliding(
                  {
                    x: player.x,
                    y: player.y,
                    w: 32,
                    h: 32,
                  },
                  {
                    x: col * TILE_SIZE,
                    y: row * TILE_SIZE,
                    w: TILE_SIZE,
                    h: TILE_SIZE,
                  }
                )
            ) {
                return true;
              }
        }
    }
}

function tick(delta) {
    for (const player of players) {
        const input = inputsMap[player.id];
        const previousY = player.y;
        const previousX = player.x;

        if (input.up) {
            player.y -= SPEED;
        } else if (input.down) {
            player.y += SPEED;
        }

        if (isCollidingWithMap(player)) {
            player.y = previousY;
        }

        if (input.left) {
            player.x -= SPEED;
        } else if (input.right) {
            player.x += SPEED;
        }

        if (isCollidingWithMap(player)) {
            player.x = previousX;
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
            const distance = Math.sqrt((player.x + PLSYER_SIZE / 2 - snowball.x) ** 2 + (player.y + PLSYER_SIZE / 2 - snowball.y) ** 2);
            if (distance <= PLSYER_SIZE / 2) {
                player.x = Math.floor(Math.random() * 1650);
                player.y = Math.floor(Math.random() * 1650);
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

    ({ ground2D, decal2D } = await loadMap());

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
            x: Math.floor(Math.random() * 1650),
            y: Math.floor(Math.random() * 1650),
        });

        socket.emit('map', {
            ground: ground2D,
            decal: decal2D
        });

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


    httpServer.listen(PORT);

    let lastUpdate = Date.now();

    setInterval(() => {
        const now = Date.now();
        const delta = now - lastUpdate;
        tick(delta);
        lastUpdate = now;
      }, 1000 / TICK_RATE);
}

main();