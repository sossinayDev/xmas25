const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;

let playerPos = { x: 1, y: 1 };
let goalPos = { x: Math.floor(cols) - 2, y: Math.floor(rows) - 2 };
let movements = [[1,1]];
const maze = JSON.parse(document.getElementById('maze_data').textContent);
function canMove(x, y) {
    return x >= 0 && x < cols && y >= 0 && y < rows && maze[y][x] === 0;
}

function movePlayer(dx, dy, direction) {
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    if (canMove(newX, newY)) {
        playerPos.x = newX;
        playerPos.y = newY;
        movements.push([playerPos.y,playerPos.x]);
        checkWin();
    }
    draw();
}

function checkWin() {
    if (playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
        answer = movements;
        send_answer(true, false);
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#444';
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (maze[i][j] === 1) {
                ctx.fillRect(j * gridSize, i * gridSize, gridSize, gridSize);
            }
        }
    }

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(goalPos.x * gridSize, goalPos.y * gridSize, gridSize, gridSize);

    ctx.fillStyle = '#00FF00';
    ctx.fillRect(playerPos.x * gridSize, playerPos.y * gridSize, gridSize, gridSize);
}

function resetGame() {
    playerPos = { x: 1, y: 1 };
    movements = [[1,1]];
    draw();
}

function submitMoves() {
    const data = { movements: movements };
    fetch('/submit-moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(r => r.json())
        .then(d => alert(d.message))
        .catch(e => console.error(e));
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': movePlayer(0, -1, 'u'); break;
        case 'ArrowDown': movePlayer(0, 1, 'd'); break;
        case 'ArrowLeft': movePlayer(-1, 0, 'l'); break;
        case 'ArrowRight': movePlayer(1, 0, 'r'); break;
    }
});

draw();