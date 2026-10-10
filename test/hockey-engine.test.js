import test from "node:test";
import assert from "node:assert/strict";
import { AirHockey } from "../src/hockey-engine.js";
test("hockey clamps paddles to their own halves and rejects invalid input", () => {
  const g = new AirHockey();
  g.move(0, -200, -10);
  assert.deepEqual(g.paddles[0], { x: 34, y: 484 });
  g.move(1, 900, 900);
  assert.deepEqual(g.paddles[1], { x: 566, y: 416 });
  assert.equal(g.move(2, 100, 100), false);
  assert.equal(g.move(0, NaN, 1), false);
});
test("hockey scores only inside the goal, resets serve, and ends at the selected target", () => {
  const g = new AirHockey({ goal: 3, bot: false });
  g.serveRemaining = 0;
  g.puck = { x: 100, y: 17, vx: 0, vy: -300 };
  g.tick(0.02);
  assert.deepEqual(g.scores, [0, 0]);
  assert.ok(g.puck.vy > 0);
  for (let i = 0; i < 3; i++) {
    g.serveRemaining = 0;
    g.puck = { x: 300, y: 17, vx: 0, vy: -300 };
    g.tick(0.02);
  }
  assert.equal(g.winner, 0);
  assert.deepEqual(g.scores, [3, 0]);
  g.score(1);
  assert.deepEqual(g.scores, [3, 0]);
});
test("hockey paddle collisions bounce the puck and bot movement is bounded", () => {
  const g = new AirHockey({ bot: false });
  g.serveRemaining = 0;
  g.puck = { x: 300, y: 715, vx: 0, vy: 400 };
  g.tick(0.02);
  assert.ok(g.puck.vy < 0);
  const bot = new AirHockey({ bot: true });
  bot.serveRemaining = 0;
  bot.puck.x = 500;
  bot.tick(0.05);
  assert.ok(bot.paddles[1].x > 300 && bot.paddles[1].x <= 319);
  assert.ok(Number.isFinite(bot.puck.x));
});
