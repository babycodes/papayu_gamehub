import test from "node:test";
import assert from "node:assert/strict";
import { SlidingPuzzle } from "../src/puzzle-engine.js";
test("puzzle shuffles preserve tile counts and the correct solvability parity", () => {
  for (const size of [3, 4])
    for (let n = 0; n < 20; n++) {
      const g = new SlidingPuzzle({ size });
      assert.equal(g.solved(), false);
      assert.deepEqual(
        [...g.tiles].sort((a, b) => a - b),
        Array.from({ length: size * size }, (_, i) => i),
      );
      let inversions = 0;
      for (let i = 0; i < g.tiles.length; i++)
        for (let j = i + 1; j < g.tiles.length; j++)
          if (g.tiles[i] && g.tiles[j] && g.tiles[i] > g.tiles[j]) inversions++;
      if (size === 3) assert.equal(inversions % 2, 0);
      else
        assert.equal((inversions + size - Math.floor(g.empty / size)) % 2, 1);
    }
});
test("puzzle rejects nonadjacent moves and hints solve after user detours", () => {
  for (const size of [3, 4]) {
    const g = new SlidingPuzzle({ size, random: () => 0.37 });
    const saved = JSON.stringify(g);
    assert.equal(g.move(g.empty), false);
    assert.equal(g.move(-1), false);
    assert.equal(JSON.stringify(g), saved);
    g.move(g.neighbors()[0]);
    let steps = 0;
    while (g.winner === null) {
      assert.ok(g.move(g.hint()));
      assert.ok(++steps < 100);
    }
    assert.equal(g.solved(), true);
    assert.equal(g.move(g.neighbors()[0]), false);
  }
});
