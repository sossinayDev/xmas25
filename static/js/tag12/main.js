// ski.js
// Corrected skiing minigame JS:
// - piste.png is only vertically tileable and is scaled horizontally (no ugly horizontal tiling)
// - skier is placed near the top; piste & obstacles move upward so skier appears to ski downward
// - obstacles and skier are scaled to match the piste scale
// - tap/click/space toggles horizontal direction
// - score = 1 point per second

// -----------------------------
// Asset paths (from your message)
// -----------------------------
const pisteSrc = "static/img/tagdebug/piste.png";       // 128x32 tileable vertically
const skierRightSrc = "static/img/tagdebug/skier_r.png"; // 32x32 (assumed)
const stoneSrc = "static/img/tagdebug/stone.png";      // 16x16
const snowmanSrc = "static/img/tagdebug/snowman.png";  // 16x16

// -----------------------------
// Canvas
// -----------------------------
const canvas = document.getElementById("skiCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;     // for older browsers
ctx.webkitImageSmoothingEnabled = false; // for older Safari
const W = canvas.width;
const H = canvas.height;

// -----------------------------
// Load images
// -----------------------------
const pisteImg = new Image();
pisteImg.src = pisteSrc;

const skierRightImg = new Image();
skierRightImg.src = skierRightSrc;

const stoneImg = new Image();
stoneImg.src = stoneSrc;

const snowmanImg = new Image();
snowmanImg.src = snowmanSrc;

// -----------------------------
// Scale calculation
// We'll scale piste horizontally to fit canvas width and scale everything
// with the same scale so the look remains consistent.
// piste original size: 128x32
// -----------------------------
function computeScale() {
    // scale factor to stretch 128px -> Wpx horizontally
    const scale = W / 128;
    const tileW = W;                // destination width for the piste strip
    const tileH = 32 * scale;       // destination height after scaling
    const spriteScale = scale/1.3;      // use same for sprites/obstacles
    return { scale, tileW, tileH, spriteScale };
}

let { scale, tileW, tileH, spriteScale } = computeScale();

// Recompute scale if canvas size ever changes
window.addEventListener("resize", () => {
    // if you allow responsive canvas later, you'd recompute scale here.
    ({ scale, tileW, tileH, spriteScale } = computeScale());
});

// -----------------------------
// Game state
// -----------------------------
let skierX = W / 2 - (32 * spriteScale) / 2; // centered horizontally
let skierY = 40;                             // near top to create downhill effect
let skierDirection = 1;                      // 1 = right, -1 = left

// horizontal speed (pixels per frame)
const horizontalSpeed = 2.4;

// world speed (how fast piste & obstacles move up; larger -> faster downhill)
const worldSpeed = 2.8;

// scroll offset for vertical tiling (we'll move this upward: decrease)
let scrollY = 0;

// obstacles list
let obstacles = [];
let spawnAccumulator = 0;  // controls spawn timing

// sizing for sprites (scaled)
function spriteSizes() {
    return {
        skierW: 24 * spriteScale,
        skierH: 16 * spriteScale,
        obsW: 16 * spriteScale,
        obsH: 16 * spriteScale
    };
}

// scoring
let startTime = null;
let running = true;
let score = 0;

// -----------------------------
// Input
// -----------------------------
function toggleDirection() {
    skierDirection *= -1;
}

window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        toggleDirection();
    }
});
canvas.addEventListener("click", toggleDirection);
canvas.addEventListener("touchstart", (ev) => {
    ev.preventDefault();
    toggleDirection();
}, { passive: false });

// -----------------------------
// Obstacles
// spawn at bottom (y > H) and move upward (decreasing y), so they appear
// to come from the bottom as the skier 'skis down'.
// -----------------------------
function spawnObstacle() {
    const type = Math.random() < 0.5 ? "stone" : "snowman";
    const img = type === "stone" ? stoneImg : snowmanImg;
    const { obsW, obsH } = spriteSizes();

    // spawn slightly below the bottom so it scrolls into view
    const spawnY = H + (10 + Math.random() * 40);
    const spawnX = Math.random() * (W - obsW);

    obstacles.push({
        x: spawnX,
        y: spawnY,
        img,
        w: obsW,
        h: obsH,
        type
    });
}

// -----------------------------
// Collision
// -----------------------------
function checkCollision(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// -----------------------------
// Draw
// -----------------------------
function drawScene() {
    ctx.clearRect(0, 0, W, H);

    // Draw piste: scaled horizontally to fill canvas width; tile vertically only.
    // We move scrollY upward (decrease) so the strip moves upward on screen,
    // giving the visual sense that the skier is moving downward.
    //
    // tileH is the scaled height of one strip.
    for (let y = -tileH; y < H + tileH; y += tileH) {
        ctx.drawImage(pisteImg, 0, y + scrollY, tileW, tileH);
    }

    // Draw obstacles
    for (let o of obstacles) {
        ctx.drawImage(o.img, o.x, o.y, o.w, o.h);
    }

    // Draw skier (flip horizontally when going left)
    const { skierW, skierH } = spriteSizes();
    ctx.save();
    if (skierDirection === -1) {
        // flip horizontally around skier's center
        ctx.translate(skierX + skierW, skierY);
        ctx.scale(-1, 1);
        ctx.drawImage(skierRightImg, 0, 0, skierW, skierH);
    } else {
        ctx.drawImage(skierRightImg, skierX, skierY, skierW, skierH);
    }
    ctx.restore();

    // Score display (assumes an element with id 'scoreDisplay' exists)
    const scoreEl = document.getElementById("scoreDisplay");
    if (scoreEl) scoreEl.textContent = "Score: " + score;
}

// -----------------------------
// Update loop
// -----------------------------
function update(timestamp) {
    if (!running) return;

    if (!startTime) startTime = timestamp || performance.now();
    score = Math.floor(((timestamp || performance.now()) - startTime) / 1000);

    // Horizontal movement (player toggles direction)
    const { skierW } = spriteSizes();
    skierX += horizontalSpeed * skierDirection;

    // clamp horizontally so skier stays on screen
    if (skierX < 0) skierX = 0;
    if (skierX > W - skierW) skierX = W - skierW;

    // Move the world upward (decrease scrollY)
    scrollY -= worldSpeed;
    // wrap the vertical tile offset to keep it bounded and continuous
    if (scrollY <= -tileH) scrollY += tileH;

    // Move obstacles upward
    for (let o of obstacles) {
        o.y -= worldSpeed;
    }

    // Spawn logic: accumulate time-like quantity and spawn occasionally
    spawnAccumulator += worldSpeed;
    // spawn roughly every ~70 units of accumulator; tweak this for density
    if (spawnAccumulator > 200) {
        spawnAccumulator = 0;
        spawnObstacle();
    }

    // Collision detection: skier near top, obstacles come upward from bottom
    const { skierH, obsW, obsH } = (() => {
        const s = spriteSizes();
        return { skierH: s.skierH, obsW: s.obsW, obsH: s.obsH };
    })();

    for (let o of obstacles) {
        if (checkCollision(skierX, skierY, skierW, skierH, o.x, o.y, o.w, o.h)) {
            running = false;
            break;
        }
    }

    // Remove obstacles that moved past the top (out of view)
    obstacles = obstacles.filter(o => o.y + o.h > -50);

    drawScene();
    requestAnimationFrame(update);
}

// -----------------------------
// Reset / start function
// -----------------------------
function resetGame() {
    ({ scale, tileW, tileH, spriteScale } = computeScale());
    const sizes = spriteSizes();

    skierX = W / 2 - sizes.skierW / 2;
    skierY = 40;        // near top to create downhill effect
    skierDirection = 1;

    scrollY = 0;
    obstacles = [];
    spawnAccumulator = 0;

    startTime = null;
    running = true;
    score = 0;

    requestAnimationFrame(update);
}

// Expose resetGame globally (so your HTML button can call it)
window.resetGame = resetGame;

// start automatically
requestAnimationFrame(update);
