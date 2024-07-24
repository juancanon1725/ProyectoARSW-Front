const http = require('http');
const express = require('express');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const gameState = {
    players: {},
    ball: { x: 250, y: 250, velocityX: 3, velocityY: 2 },
    blocks: createBlocks()
};

function createBlocks() {
    let blocks = [];
    const blockWidth = 50;
    const blockHeight = 10;
    const blockColumns = 8;
    const blockRows = 3;
    const blockX = 15;
    const blockY = 45;

    for (let c = 0; c < blockColumns; c++) {
        for (let r = 0; r < blockRows; r++) {
            blocks.push({
                x: blockX + c * blockWidth + c * 10,
                y: blockY + r * blockHeight + r * 10,
                width: blockWidth,
                height: blockHeight,
                break: false
            });
        }
    }

    return blocks;
}

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    // Inicializar el jugador
    gameState.players[socket.id] = {
        x: 250,
        y: 470,
        width: 80,
        height: 10,
        velocityX: 10
    };

    // Enviar el estado inicial del juego al nuevo jugador
    socket.emit('gameState', gameState);

    // Manejar actualizaciones del estado del juego
    socket.on('update', (data) => {
        gameState.players[socket.id] = data.player;

        // Actualizar el estado del juego
        // Aquí deberías agregar la lógica para mover la pelota y verificar colisiones

        // Enviar el estado actualizado a todos los jugadores
        io.emit('gameState', gameState);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete gameState.players[socket.id];
        io.emit('gameState', gameState);
    });
});

server.listen(8080, () => {
    console.log('Server listening on port 8080');
});





