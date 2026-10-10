import test from "node:test";
import assert from "node:assert/strict";
import { ConnectFour, connectBot } from "../src/connect-engine.js";
test("connect four obeys gravity, blocks full columns and illegal moves", () => {
  const g = new ConnectFour();
  assert.equal(g.play(-1), false);
  assert.equal(g.play(7), false);
  assert.equal(g.play(1.5), false);
  for (let i = 0; i < 6; i++) {
    assert.ok(g.play(0));
    assert.equal(g.last, (5 - i) * 7);
  }
  const saved = JSON.stringify(g);
  assert.equal(g.play(0), false);
  assert.equal(JSON.stringify(g), saved);
});
test("connect four detects vertical, horizontal and diagonal four", () => {
  const vertical = new ConnectFour();
  [0, 1, 0, 1, 0, 1, 0].forEach((c) => vertical.play(c));
  assert.equal(vertical.winner, 0);
  assert.equal(vertical.line.length, 4);
  assert.equal(vertical.play(2), false);
  const horizontal = new ConnectFour();
  [0, 0, 1, 1, 2, 2, 3].forEach((c) => horizontal.play(c));
  assert.equal(horizontal.winner, 0);
  const diagonal = new ConnectFour();
  [0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3].forEach((c) => diagonal.play(c));
  assert.equal(diagonal.winner, 0);
});
test("connect bot wins or blocks immediate threats and never mutates the position", () => {
  for (const moves of [
    [6, 0, 6, 1, 5, 2, 5],
    [0, 6, 1, 6, 2],
  ]) {
    const g = new ConnectFour();
    moves.forEach((c) => g.play(c));
    const saved = JSON.stringify(g);
    assert.equal(connectBot(g), 3);
    assert.equal(JSON.stringify(g), saved);
  }
  const g = new ConnectFour();
  assert.equal(connectBot(g), 3);
});
