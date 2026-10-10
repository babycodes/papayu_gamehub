import test from "node:test";
import assert from "node:assert/strict";
import { TileDuel } from "../src/mahjong-engine.js";

test("tile duel deals two mixed boards and exactly four of every picture", () => {
  const game = new TileDuel({ random: () => 0.37 });
  assert.deepEqual(
    game.boards.map((board) => board.length),
    [16, 16],
  );
  for (const board of game.boards)
    assert.equal(new Set(board.map((tile) => tile.theme)).size, 2);
  for (const theme of ["fruit", "animal"])
    for (let picture = 0; picture < 4; picture++)
      assert.equal(
        game.boards
          .flat()
          .filter((tile) => tile.theme === theme && tile.picture === picture)
          .length,
        4,
      );
  assert.equal(game.boards.flat().filter((tile) => tile.revealed).length, 0);
  const unshuffled = new TileDuel({ random: () => 0.999 });
  for (const board of unshuffled.boards)
    assert.equal(new Set(board.map((tile) => tile.theme)).size, 2);
});

test("revealing an opponent theme transfers it to its owner and changes turns", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "animal");
  const move = game.draw(0, index);
  assert.equal(move.sender, 0);
  assert.equal(move.owner, 1);
  assert.equal(game.collections[1][move.picture], 1);
  assert.equal(
    game.collections[0].reduce((a, b) => a + b),
    0,
  );
  assert.equal(game.turn, 1);
  assert.equal(game.draw(0, index), null);
  const saved = JSON.stringify(game);
  assert.equal(game.draw(0, 0), null);
  assert.equal(game.draw(1, -1), null);
  assert.equal(game.draw(1, 16), null);
  assert.equal(game.draw(1, 1.5), null);
  assert.equal(JSON.stringify(game), saved);
});

test("players can use the other board after their own board empties", () => {
  const game = new TileDuel({ random: () => 0.37 });
  // Exhaust a board without completing either theme, then check the forced fallback.
  game.boards[0].forEach((tile) => (tile.revealed = true));
  game.turn = 0;
  assert.equal(game.availableBoard(), 1);
  assert.equal(game.choices().length, 16);
  assert.equal(game.draw(0, 0), null);
  assert.equal(game.draw(1, 0).sender, 0);
});

test("a full duel conserves tiles and ends at the first complete collection", () => {
  for (const firstTheme of ["fruit", "animal"]) {
    const game = new TileDuel({ firstTheme, random: () => 0.37 });
    let reveals = 0;
    while (game.winner === null) {
      const choice = game.choices()[0];
      assert.ok(choice);
      assert.ok(game.draw(choice.board, choice.index));
      reveals++;
      assert.equal(
        game.collections.flat().reduce((a, b) => a + b),
        reveals,
      );
      assert.ok(game.collections.flat().every((count) => count <= 4));
    }
    assert.ok(reveals <= 31);
    assert.deepEqual(game.collections[game.winner], [4, 4, 4, 4]);
    const saved = JSON.stringify(game);
    const choice = game.choices()[0];
    assert.equal(game.draw(choice.board, choice.index), null);
    assert.equal(JSON.stringify(game), saved);
  }
});

test("new rounds preserve chosen themes, alternate starters, and reset collections", () => {
  const game = new TileDuel({ firstTheme: "animal", firstPlayer: 1 });
  assert.deepEqual(game.themes, ["animal", "fruit"]);
  assert.equal(game.turn, 1);
  assert.equal(game.availableBoard(), 1);
  assert.deepEqual(game.collections, [Array(4).fill(0), Array(4).fill(0)]);
  assert.equal(game.winner, null);
  assert.throws(() => new TileDuel({ firstTheme: "unknown" }));
});
