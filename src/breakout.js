export default function breakout() {
    let board;
    let boardWidth = 500;
    let boardHeight = 500;
    let context;

    let playerWidth = 80;
    let playerHeight = 10;
    let playerVelocityX = 10;

    let player = {
        x: boardWidth / 2 - playerWidth / 2,
        y: boardHeight - playerHeight - 5,
        width: playerWidth,
        height: playerHeight,
        velocityX: playerVelocityX
    };

    let ballWidth = 10;
    let ballHeight = 10;
    let ballVelocityX = 3;
    let ballVelocityY = 2;

    let ball1 = {
        x: boardWidth / 2,
        y: boardHeight / 2,
        width: ballWidth,
        height: ballHeight,
        velocityX: ballVelocityX,
        velocityY: ballVelocityY
    };

    let ball2 = {
        x: boardWidth / 3,
        y: boardHeight / 3,
        width: ballWidth,
        height: ballHeight,
        velocityX: -ballVelocityX,
        velocityY: -ballVelocityY
    };

    let balls = [ball1, ball2];

    let blockArray = [];
    let blockWidth = 50;
    let blockHeight = 10;
    let blockColumns = 8;
    let blockRows = 3;
    let blockMaxRows = 10;
    let blockCount = 0;

    let blockX = 15;
    let blockY = 45;

    let score = 0;
    let gameOver = false;

    let ws;
    let playerColor = '#00FF00'; // Color del jugador actual

    function setupWebSocket() {
        ws = new WebSocket('ws://localhost:8080/websocket'); // Asegúrate de que esta ruta sea la correcta

        ws.onopen = function() {
            console.log('WebSocket is open now.');
        };

        ws.onmessage = function(event) {
            let data = JSON.parse(event.data);
            console.log('Data received from WebSocket:', data);
            if (data.type === 'gameState') {
                playerColor = data.players[Object.keys(data.players)[0]].color; // Asignar el color del jugador al cliente
                player = data.players[Object.keys(data.players)[0]]; // Solo para el jugador actual
                balls = data.balls;
                blockArray = data.blocks;
                score = data.score;
            }
        };

        ws.onclose = function() {
            console.log('WebSocket is closed now. Reconnecting...');
            setTimeout(setupWebSocket, 1000);
        };

        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }

    setupWebSocket(); // Inicializa la conexión WebSocket

    window.onload = function() {
        board = document.getElementById("board");
        board.height = boardHeight;
        board.width = boardWidth;
        context = board.getContext("2d");

        context.fillStyle = "skyblue";
        context.fillRect(player.x, player.y, player.width, player.height);

        requestAnimationFrame(update);
        document.addEventListener("keydown", movePlayer);

        createBlocks();
    }

    function update() {
        console.log('Updating game state...');
        requestAnimationFrame(update);
        if (gameOver) {
            console.log('Game Over!');
            return;
        }
        context.clearRect(0, 0, board.width, board.height);

        context.fillStyle = "#000";
        context.fillRect(0, 0, board.width, board.height);

        context.fillStyle = playerColor; // Usar el color del jugador
        context.fillRect(player.x, player.y, player.width, player.height);

        context.fillStyle = "white";
        balls.forEach(ball => {
            ball.x += ball.velocityX;
            ball.y += ball.velocityY;
            context.fillRect(ball.x, ball.y, ball.width, ball.height);

            // Verificar colisiones con el jugador
            if (topCollision(ball, player) || bottomCollision(ball, player)) {
                console.log('Collision with player!');
                ball.velocityY *= -1;
            } else if (leftCollision(ball, player) || rightCollision(ball, player)) {
                console.log('Collision with player!');
                ball.velocityX *= -1;
            }

            // Verificar colisiones con las paredes
            if (ball.y <= 0) {
                ball.velocityY *= -1;
            } else if (ball.x <= 0 || (ball.x + ball.width >= boardWidth)) {
                ball.velocityX *= -1;
            } else if (ball.y + ball.height >= boardHeight) {
                console.log('Ball Y:', ball.y);
                console.log('Ball Height:', ball.height);
                console.log('Board Height:', boardHeight);
                context.font = "20px sans-serif";
                context.fillText("Game Over: Press 'Space' to Restart", 80, 400);
                gameOver = true;
            }
        });

        // Verificar colisiones entre pelotas
        if (detectCollision(balls[0], balls[1])) {
            let tempVelocityX = balls[0].velocityX;
            let tempVelocityY = balls[0].velocityY;
            balls[0].velocityX = balls[1].velocityX;
            balls[0].velocityY = balls[1].velocityY;
            balls[1].velocityX = tempVelocityX;
            balls[1].velocityY = tempVelocityY;
        }

        // Dibujar bloques y verificar colisiones
        context.fillStyle = "skyblue";
        for (let i = 0; i < blockArray.length; i++) {
            let block = blockArray[i];
            if (!block.break) {
                balls.forEach(ball => {
                    if (topCollision(ball, block) || bottomCollision(ball, block)) {
                        block.break = true;
                        ball.velocityY *= -1;
                        updateScore();
                    } else if (leftCollision(ball, block) || rightCollision(ball, block)) {
                        block.break = true;
                        ball.velocityX *= -1;
                        updateScore();
                    }
                });
                context.fillRect(block.x, block.y, block.width, block.height);
            }
        }

        if (blockCount === 0) {
            score += 100 * blockRows * blockColumns;
            blockRows = Math.min(blockRows + 1, blockMaxRows);
            createBlocks();
        }

        context.font = "20px sans-serif";
        context.fillText(score, 10, 25);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'update',
                player: player,
                balls: balls,
                blockArray: blockArray,
                score: score
            }));
        }
    }

    function updateScore() {
        score += 100;
        blockCount -= 1;
    }

    function outOfBounds(xPosition) {
        return (xPosition < 0 || xPosition + playerWidth > boardWidth);
    }

    function movePlayer(e) {
        if (gameOver) {
            if (e.code === "Space") {
                resetGame();
                console.log("RESET");
            }
            return;
        }
        if (e.code === "ArrowLeft") {
            let nextplayerX = player.x - player.velocityX;
            if (!outOfBounds(nextplayerX)) {
                player.x = nextplayerX;
            }
        } else if (e.code === "ArrowRight") {
            let nextplayerX = player.x + player.velocityX;
            if (!outOfBounds(nextplayerX)) {
                player.x = nextplayerX;
            }
        }
    }

    function detectCollision(a, b) {
        return a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
    }

    function topCollision(ball, block) {
        return detectCollision(ball, block) && (ball.y + ball.height) >= block.y;
    }

    function bottomCollision(ball, block) {
        return detectCollision(ball, block) && (block.y + block.height) >= ball.y;
    }

    function leftCollision(ball, block) {
        return detectCollision(ball, block) && (ball.x + ball.width) >= block.x;
    }

    function rightCollision(ball, block) {
        return detectCollision(ball, block) && (block.x + block.width) >= ball.x;
    }

    function createBlocks() {
        blockArray = [];
        for (let c = 0; c < blockColumns; c++) {
            for (let r = 0; r < blockRows; r++) {
                let block = {
                    x: blockX + c * blockWidth + c * 10,
                    y: blockY + r * blockHeight + r * 10,
                    width: blockWidth,
                    height: blockHeight,
                    break: false
                };
                blockArray.push(block);
            }
        }
        blockCount = blockArray.length;
        console.log('Blocks created:', blockArray);
    }

    function resetGame() {
        gameOver = false;
        player = {
            x: boardWidth / 2 - playerWidth / 2,
            y: boardHeight - playerHeight - 5,
            width: playerWidth,
            height: playerHeight,
            velocityX: playerVelocityX,
            color: playerColor // Mantener el color del jugador
        };
        balls = [
            {
                x: boardWidth / 2,
                y: boardHeight / 2,
                width: ballWidth,
                height: ballHeight,
                velocityX: ballVelocityX,
                velocityY: ballVelocityY
            },
            {
                x: boardWidth / 3,
                y: boardHeight / 3,
                width: ballWidth,
                height: ballHeight,
                velocityX: -ballVelocityX,
                velocityY: -ballVelocityY
            }
        ];
        blockArray = [];
        blockRows = 3;
        score = 0;
        createBlocks();
    }
}









