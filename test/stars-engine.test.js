import test from "node:test";
import assert from "node:assert/strict";
import { CatchStars } from "../src/stars-engine.js";
test("stars reward catches and combos; bombs subtract safely and misses reset combo", () => {
  const g = new CatchStars({ random: () => 0.9 });
  for (let i = 0; i < 4; i++) g.catch({ type: "star", x: 0.5 });
  assert.equal(g.score, 50);
  g.catch({ type: "bomb", x: 0.5 });
  assert.equal(g.score, 35);
  assert.equal(g.combo, 0);
  g.score = 5;
  g.catch({ type: "bomb", x: 0.5 });
  assert.equal(g.score, 0);
  g.combo = 2;
  g.objects = [{ type: "star", x: 0.1, y: 1.09, speed: 0.3 }];
  g.tick(0.1);
  assert.equal(g.combo, 0);
});
test("stars collision requires the basket, frenzy doubles points and time bonuses are bounded", () => {
  const g = new CatchStars();
  g.objects = [
    { type: "star", x: 0.5, y: 0.85, speed: 0.3 },
    { type: "star", x: 0.1, y: 0.85, speed: 0.3 },
  ];
  g.tick(0.1);
  assert.equal(g.caught, 1);
  g.elapsed = 12;
  g.tick(0.01);
  assert.equal(g.frenzy, true);
  const before = g.score;
  g.catch({ type: "gold", x: 0.5 });
  assert.equal(g.score - before, 50);
  for (let i = 0; i < 5; i++) g.catch({ type: "time", x: 0.5 });
  assert.equal(g.bonusAdded, 9);
  assert.ok(g.remaining <= g.duration + 9);
  g.move(0, 4);
  assert.equal(g.basket, 0.91);
});
test("local stars waits for handover, preserves scores and ends after equal timed rounds", () => {
  const g = new CatchStars({ duration: 30, local: true });
  g.catch({ type: "star", x: 0.5 });
  g.tick(31);
  assert.equal(g.phase, "handover");
  assert.equal(g.winner, null);
  const saved = JSON.stringify(g);
  g.tick(3);
  assert.equal(JSON.stringify(g), saved);
  assert.ok(g.nextRound());
  assert.equal(g.turn, 1);
  assert.equal(g.remaining, 30);
  assert.equal(g.score, 0);
  g.catch({ type: "gold", x: 0.5 });
  g.tick(31);
  assert.equal(g.winner, 1);
  assert.deepEqual(g.scores, [10, 25]);
  assert.equal(g.nextRound(), false);
});
