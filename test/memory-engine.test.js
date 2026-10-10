import test from "node:test";
import assert from "node:assert/strict";
import { MemoryMatch, MEMORY_THEMES } from "../src/memory-engine.js";
test("all memory themes support twenty distinct pairs without extra duplicates", () => {
  for (const theme of Object.keys(MEMORY_THEMES))
    for (const pairs of [4, 10, 15, 20]) {
      const game = new MemoryMatch({ theme, pairs, random: () => 0.37 });
      assert.equal(game.cards.length, pairs * 2);
      const counts = new Map();
      for (const card of game.cards)
        counts.set(card.picture, (counts.get(card.picture) || 0) + 1);
      assert.equal(counts.size, pairs);
      assert.ok([...counts.values()].every((n) => n === 2));
    }
  assert.throws(() => new MemoryMatch({ pairs: 21 }));
  assert.throws(() => new MemoryMatch({ theme: "unknown" }));
});
test("memory mismatch stays visible, blocks extra cards, and passes the local turn only after delay", () => {
  const game = new MemoryMatch({ local: true, random: () => 0.37 });
  const other = game.cards.findIndex(
    (c) => c.picture !== game.cards[0].picture,
  );
  assert.equal(game.flip(0), "first");
  assert.equal(game.flip(0), null);
  assert.equal(game.flip(other), "miss");
  assert.equal(game.flip(3), null);
  assert.equal(game.turn, 0);
  assert.equal(game.attempts, 1);
  assert.equal(game.tick(0.4), false);
  assert.equal(game.open.length, 2);
  assert.equal(game.tick(0.5), true);
  assert.equal(game.open.length, 0);
  assert.equal(game.turn, 1);
  assert.deepEqual(game.scores, [0, 0]);
});
test("memory matching scores once, keeps the turn, and finishes only after all pairs", () => {
  const game = new MemoryMatch({
    pairs: 10,
    local: true,
    firstPlayer: 1,
    random: () => 0.37,
  });
  const pictures = [...new Set(game.cards.map((c) => c.picture))];
  for (const picture of pictures) {
    const indices = game.cards.flatMap((c, i) =>
      c.picture === picture ? [i] : [],
    );
    assert.equal(game.flip(indices[0]), "first");
    assert.equal(game.flip(indices[1]), "match");
    assert.equal(game.flip(indices[0]), null);
    assert.equal(game.turn, 1);
  }
  assert.equal(game.winner, 1);
  assert.deepEqual(game.scores, [0, 10]);
  assert.equal(game.attempts, 10);
  assert.equal(game.flip(0), null);
});
test("solo mismatch never changes player and equal local collections end in a draw", () => {
  const solo = new MemoryMatch({ pairs: 4, random: () => 0.37 });
  solo.flip(0);
  solo.flip(solo.cards.findIndex((c) => c.picture !== solo.cards[0].picture));
  solo.tick(1);
  assert.equal(solo.turn, 0);
  const game = new MemoryMatch({ pairs: 4, local: true, random: () => 0.37 });
  let n = 0;
  for (const picture of new Set(game.cards.map((c) => c.picture))) {
    game.turn = n++ % 2;
    const pair = game.cards.flatMap((c, i) =>
      c.picture === picture ? [i] : [],
    );
    pair.forEach((i) => game.flip(i));
  }
  assert.equal(game.winner, "draw");
});
