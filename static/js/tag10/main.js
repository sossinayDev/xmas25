let cam_pos = {
    x: 0,
    y: 0
};

let canvas = document.getElementById("photoCanvas");
let ctx = canvas.getContext('2d', { willReadFrequently: true });


let isDragging = false;
let last = { x: 0, y: 0 };

let zoom_input = document.getElementById("zoomRange")

const img = document.getElementById("subject");
const scale = parseFloat(zoom_input.value) || 1;

let prevScale = parseFloat(zoom_input.value) || 1;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = parseFloat(zoom_input.value) || 1;
    const img = document.getElementById("subject");

    ctx.save();
    ctx.scale(scale, scale);
    // divide cam_pos by scale so panning remains consistent when zooming
    ctx.drawImage(img, -cam_pos.x / scale, -cam_pos.y / scale);
    ctx.restore();
    canvas.style.filter = `blur(${Math.abs(6-document.getElementById('focusRange').value)}px) brightness(${document.getElementById('exposureRange').value})`

    answer = {
        x: cam_pos.x,
        y: cam_pos.y,
        z: parseFloat(zoom_input.value),
        f: parseFloat(document.getElementById('focusRange').value),
        e: parseFloat(document.getElementById('exposureRange').value)
    }
}

function is_on_screen() {
    const scale = parseFloat(zoom_input.value) || 1;

    // Scaled image size
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Check each edge
    const leftEdge = cam_pos.x;
    const rightEdge = cam_pos.x + canvas.width;
    const topEdge = cam_pos.y;
    const bottomEdge = cam_pos.y + canvas.height;

    const onScreenHorizontally = leftEdge < scaledWidth && rightEdge > 0;
    const onScreenVertically = topEdge < scaledHeight && bottomEdge > 0;

    return onScreenHorizontally && onScreenVertically;
}

function is_covering_screen() {
    const scale = parseFloat(zoom_input.value) || 1;

    // Scaled image size
    const scaledWidth = 4923 * scale;
    const scaledHeight = 3280 * scale;

    if (cam_pos.x < 0 || cam_pos.y < 0){
        return false;
    }

    if (cam_pos.x + 1280 > scaledWidth){
        return false
    }
    if (cam_pos.y + 720 > scaledHeight){
        return false
    }

    return true
}


// Keep zoom centered on canvas center
zoom_input.addEventListener('input', (e) => {
    const newScale = parseFloat(e.target.value) || 1;
    if (newScale === prevScale) return;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Preserve the image point currently at canvas center:
    // (c + cam_new) / newScale = (c + cam_old) / prevScale
    cam_pos.x = (newScale / prevScale) * (cx + cam_pos.x) - cx;
    cam_pos.y = (newScale / prevScale) * (cy + cam_pos.y) - cy;

    prevScale = newScale;
    draw();
});

// --- Drag handling ---
canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    last.x = e.clientX;
    last.y = e.clientY;
    canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;

    cam_pos.x -= 2*dx;
    cam_pos.y -= 2*dy;

    last.x = e.clientX;
    last.y = e.clientY;

    draw();
});

canvas.addEventListener("pointerup", (e) => {
    isDragging = false;
    canvas.releasePointerCapture(e.pointerId);
});

// Initial paint
draw();