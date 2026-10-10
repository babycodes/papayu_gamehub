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

test("revealing an opponent tile requires handing it over and arranging before changing turns", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "animal");
  const move = game.draw(0, index);
  assert.equal(move.sender, 0);
  assert.equal(move.owner, 1);
  assert.equal(game.collections[1][move.picture], 0);
  assert.equal(game.pending.stage, "handoff");
  assert.equal(game.actor(), 0);
  assert.equal(
    game.collections[0].reduce((a, b) => a + b),
    0,
  );
  assert.equal(game.turn, 0);
  assert.equal(game.draw(0, index), null);
  assert.equal(game.handoff(0), true);
  assert.equal(game.actor(), 1);
  assert.equal(game.place(1, move.picture), true);
  assert.equal(game.collections[1][move.picture], 1);
  assert.equal(game.turn, 1);
  assert.equal(game.pending, null);
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
      assert.equal(game.winner, null);
      const pending = game.pending;
      if (pending.stage === "handoff") assert.ok(game.handoff(pending.sender));
      assert.ok(game.place(pending.owner, pending.picture));
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
    assert.deepEqual(game.choices(), []);
    assert.equal(game.draw(0, 0), null);
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

test("pending handoffs and wrong columns cannot duplicate tiles or advance play", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "animal");
  const move = game.draw(0, index);
  let saved = JSON.stringify(game);
  assert.deepEqual(game.choices(), []);
  assert.equal(game.draw(0, (index + 1) % 16), null);
  assert.equal(game.handoff(1), false);
  assert.equal(game.place(1, move.picture), false);
  assert.equal(JSON.stringify(game), saved);
  assert.ok(game.handoff(0));
  saved = JSON.stringify(game);
  assert.equal(game.handoff(0), false);
  assert.equal(game.place(0, move.picture), false);
  assert.equal(game.place(1, (move.picture + 1) % 4), false);
  assert.equal(JSON.stringify(game), saved);
  assert.ok(game.place(1, move.picture));
  saved = JSON.stringify(game);
  assert.equal(game.place(1, move.picture), false);
  assert.equal(JSON.stringify(game), saved);
});

test("own tiles go to the owner's tray and victory waits for arranging the final tile", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "fruit");
  const picture = game.boards[0][index].picture;
  game.collections[0] = [4, 4, 4, 4];
  game.collections[0][picture] = 3;
  game.draw(0, index);
  assert.equal(game.pending.stage, "arrange");
  assert.equal(game.actor(), 0);
  assert.equal(game.winner, null);
  assert.equal(game.handoff(0), false);
  assert.ok(game.place(0, picture));
  assert.equal(game.winner, 0);
  assert.equal(game.pending, null);
});
