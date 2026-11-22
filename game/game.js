// Neon Snake — a tiny browser game built from one prompt.
// Pure logic (no DOM) plus the browser boot at the bottom, so the same
// file can be driven headlessly: import it in Node, step it, and the snake
// really eats, speeds up, and dies on a wall.

export const GRID_W = 24;
export const GRID_H = 14;
export const BASE_SPEED = 7; // steps per second at the start
export const SPEED_PER_5_ORBS = 1; // +1 step/s every 5 orbs eaten
export const POINTS_PER_ORB = 10;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  if (seed === undefined) return Math.random;
  return mulberry32(seed);
}

// A fresh game. rng is a function returning [0, 1); pass a seeded one for
// deterministic runs, or leave it out for Math.random.
export function createGame(rng) {
  const rand = rng || Math.random;
  const state = {
    snake: [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
    ],
    dir: { x: 1, y: 0 },
    pendingDir: { x: 1, y: 0 },
    food: { x: 18, y: 7 },
    score: 0,
    orbs: 0,
    speed: BASE_SPEED,
    over: false,
    steps: 0,
    ateAt: -1,
  };
  placeFood(state, rand);
  return state;
}

export function speedFor(orbs) {
  return BASE_SPEED + Math.floor(orbs / 5) * SPEED_PER_5_ORBS;
}

function isOnSnake(state, x, y) {
  return state.snake.some((seg) => seg.x === x && seg.y === y);
}

export function placeFood(state, rng) {
  const rand = rng || Math.random;
  const free = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (!isOnSnake(state, x, y)) free.push({ x, y });
    }
  }
  if (free.length === 0) {
    state.food = { x: -1, y: -1 };
    return;
  }
  state.food = free[Math.floor(rand() * free.length)];
}

// Test / video hook: put the orb exactly where the driver wants it.
export function placeFoodAt(state, x, y) {
  state.food = { x, y };
}

// Steer. Reversing into your own neck is ignored.
export function setDirection(state, dx, dy) {
  if (state.over) return;
  if (dx === -state.dir.x && dy === -state.dir.y) return;
  if (dx === 0 && dy === 0) return;
  state.pendingDir = { x: dx, y: dy };
}

// One tick. Returns "ate", "died", or "moved".
export function stepGame(state, rng) {
  if (state.over) return "died";
  state.dir = state.pendingDir;
  const head = state.snake[0];
  const next = { x: head.x + state.dir.x, y: head.y + state.dir.y };
  state.steps += 1;

  if (next.x < 0 || next.x >= GRID_W || next.y < 0 || next.y >= GRID_H) {
    state.over = true;
    return "died";
  }
  const eating = next.x === state.food.x && next.y === state.food.y;
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((seg) => seg.x === next.x && seg.y === next.y)) {
    state.over = true;
    return "died";
  }
  state.snake.unshift(next);
  if (eating) {
    state.score += POINTS_PER_ORB;
    state.orbs += 1;
    state.speed = speedFor(state.orbs);
    state.ateAt = state.steps;
    placeFood(state, rng);
    return "ate";
  }
  state.snake.pop();
  return "moved";
}

export function resetGame(state, rng) {
  const fresh = createGame(rng);
  Object.keys(fresh).forEach((k) => {
    state[k] = fresh[k];
  });
}

// ---- browser boot: only runs where a document exists ------------------

if (typeof document !== "undefined") {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const orbsEl = document.getElementById("orbs");
  const speedEl = document.getElementById("speed");
  const bannerEl = document.getElementById("banner");

  const CELL = 40;
  canvas.width = GRID_W * CELL;
  canvas.height = GRID_H * CELL;

  const state = createGame();
  let last = 0;
  let acc = 0;
  let flash = 0;
  let paused = false;

  // P pauses so you can admire the snake. Space does the same.
  function togglePause() {
    if (state.over) return;
    paused = !paused;
    bannerEl.textContent = paused
      ? "paused — press P to resume"
      : "eat the orbs — arrows / WASD to steer";
  }

  const KEYS = {
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1],
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
  };

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyR") {
      resetGame(state);
      paused = false;
      bannerEl.textContent = "eat the orbs — arrows / WASD to steer";
      return;
    }
    if (e.code === "KeyP" || e.code === "Space") {
      togglePause();
      e.preventDefault();
      return;
    }
    const d = KEYS[e.code];
    if (d) {
      setDirection(state, d[0], d[1]);
      e.preventDefault();
    }
  });

  function draw() {
    ctx.fillStyle = "#0b0b16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 1; x < GRID_W; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, canvas.height);
      ctx.stroke();
    }
    for (let y = 1; y < GRID_H; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(canvas.width, y * CELL);
      ctx.stroke();
    }
    // Orb: magenta glow.
    const fx = state.food.x * CELL + CELL / 2;
    const fy = state.food.y * CELL + CELL / 2;
    const pulse = 14 + Math.sin(performance.now() / 180) * 4;
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, pulse + 12);
    glow.addColorStop(0, "rgba(255,45,149,0.9)");
    glow.addColorStop(1, "rgba(255,45,149,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, pulse + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff2d95";
    ctx.beginPath();
    ctx.arc(fx, fy, 9, 0, Math.PI * 2);
    ctx.fill();
    // Snake: green head fading to cyan tail.
    state.snake.forEach((seg, i) => {
      const t = state.snake.length <= 1 ? 0 : i / (state.snake.length - 1);
      const r = Math.round(57 + (34 - 57) * t);
      const g = Math.round(255 + (211 - 255) * t);
      const b = Math.round(20 + (255 - 20) * t);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const pad = i === 0 ? 2 : 4;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 9);
      ctx.fill();
    });
    if (state.over) {
      ctx.fillStyle = "rgba(11,11,22,0.72)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff2d55";
      ctx.font = "bold 64px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px monospace";
      ctx.fillText("press R to restart", canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    if (paused) {
      draw();
      requestAnimationFrame(frame);
      return;
    }
    acc += dt;
    const interval = 1000 / state.speed;
    while (acc >= interval && !state.over) {
      acc -= interval;
      if (stepGame(state) === "ate") flash = 6;
    }
    if (flash > 0) flash -= 1;
    scoreEl.textContent = String(state.score);
    orbsEl.textContent = String(state.orbs);
    speedEl.textContent = state.speed.toFixed(1) + "/s";
    if (state.over) bannerEl.textContent = "GAME OVER — press R";
    draw();
    requestAnimationFrame(frame);
  }

  bannerEl.textContent = "eat the orbs — arrows / WASD to steer";
  requestAnimationFrame((now) => {
    last = now;
    requestAnimationFrame(frame);
  });
}
