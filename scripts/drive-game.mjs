// Headless driver: plays the real game logic from game/game.js with a
// simple autopilot, and dumps one state per video frame (30 fps) to JSON.
// The video's gameplay segment is rendered from these states, so what the
// viewer sees is the actual game running — same code the browser runs.
//
// Usage: node scripts/drive-game.mjs <seconds> <out.json>
//   e.g. node scripts/drive-game.mjs 17 /tmp/game-states.json

import { writeFileSync } from "node:fs";
import {
  GRID_W,
  GRID_H,
  createGame,
  makeRng,
  setDirection,
  stepGame,
} from "../game/game.js";

const FPS = 30;
const seconds = Number(process.argv[2] || 17);
const outPath = process.argv[3] || "/tmp/game-states.json";

// Flood fill: how many free cells the head can still reach from (x, y).
// A move is safe only if the snake can keep going afterwards.
function reachableCells(state, x, y) {
  const blocked = new Set(state.snake.map((s) => `${s.x},${s.y}`));
  blocked.delete(`${state.snake[state.snake.length - 1].x},${state.snake[state.snake.length - 1].y}`);
  const seen = new Set([`${x},${y}`]);
  const queue = [[x, y]];
  let count = 0;
  while (queue.length) {
    const [cx, cy] = queue.pop();
    count += 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) continue;
      if (blocked.has(key) || seen.has(key)) continue;
      seen.add(key);
      queue.push([nx, ny]);
    }
  }
  return count;
}

function isSafe(state, dx, dy) {
  const head = state.snake[0];
  const nx = head.x + dx;
  const ny = head.y + dy;
  if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) return false;
  const eating = nx === state.food.x && ny === state.food.y;
  const body = eating ? state.snake : state.snake.slice(0, -1);
  if (body.some((s) => s.x === nx && s.y === ny)) return false;
  // After the move, the snake must still have room to roam.
  const probe = { ...state, snake: [{ x: nx, y: ny }, ...body] };
  return reachableCells(probe, nx, ny) >= state.snake.length;
}

// Greedy autopilot: prefer the safe direction that gets closer to the orb.
function autopilot(state) {
  const head = state.snake[0];
  const cands = [
    [Math.sign(state.food.x - head.x), 0],
    [0, Math.sign(state.food.y - head.y)],
    [state.dir.x, state.dir.y],
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  const seen = new Set();
  for (const [dx, dy] of cands) {
    if (dx === 0 && dy === 0) continue;
    const key = `${dx},${dy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (dx === -state.dir.x && dy === -state.dir.y) continue;
    if (isSafe(state, dx, dy)) return [dx, dy];
  }
  return [state.dir.x, state.dir.y];
}

const rng = makeRng(20261122);
const state = createGame(rng);
const totalFrames = Math.round(seconds * FPS);
const frames = [];
let acc = 0;
let lastAteFrame = -100;

for (let f = 0; f < totalFrames; f++) {
  const interval = 1000 / state.speed;
  acc += 1000 / FPS;
  let ate = false;
  while (acc >= interval && !state.over) {
    acc -= interval;
    const [dx, dy] = autopilot(state);
    setDirection(state, dx, dy);
    if (stepGame(state, rng) === "ate") {
      ate = true;
      lastAteFrame = f;
    }
  }
  if (state.over) {
    // Restart and keep playing — the video never shows a dead snake.
    const fresh = createGame(makeRng(20261122 + f));
    Object.keys(fresh).forEach((k) => {
      state[k] = fresh[k];
    });
    acc = 0;
  }
  frames.push({
    frame: f,
    t: f / FPS,
    snake: state.snake.map((s) => [s.x, s.y]),
    food: [state.food.x, state.food.y],
    score: state.score,
    orbs: state.orbs,
    speed: state.speed,
    ate: f - lastAteFrame <= 3,
  });
}

writeFileSync(outPath, JSON.stringify({ fps: FPS, seconds, frames }));
const peak = frames.reduce((m, fr) => Math.max(m, fr.score), 0);
console.log(
  `drove ${totalFrames} frames (${seconds}s): final score ${state.score}, peak ${peak}, orbs ${state.orbs}, speed ${state.speed}/s, snake length ${state.snake.length} -> ${outPath}`,
);
