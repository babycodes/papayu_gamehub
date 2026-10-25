import test from "node:test";
import assert from "node:assert/strict";
import { TileDuel, TILE_THEMES } from "../src/mahjong-engine.js";

test("tile duel deals two mixed boards and exactly four of every picture", () => {
  const game = new TileDuel({ random: () => 0.37 });
  assert.deepEqual(
    game.boards.map((board) => board.length),
    [24, 24],
  );
  for (const board of game.boards)
    assert.equal(new Set(board.map((tile) => tile.theme)).size, 2);
  for (const theme of ["fruit", "animal"])
    for (let picture = 0; picture < 6; picture++)
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

test("opponent tiles immediately switch the turn and become available to their owner", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "animal");
  const move = game.draw(0, index);
  assert.equal(move.sender, 0);
  assert.equal(move.owner, 1);
  assert.equal(game.collections[1][move.picture], 0);
  assert.equal(game.pending.stage, "pickup");
  assert.equal(game.actor(), 1);
  assert.equal(
    game.collections[0].reduce((a, b) => a + b),
    0,
  );
  assert.equal(game.turn, 1);
  assert.equal(game.draw(0, index), null);
  assert.equal(game.pickup(0), false);
  assert.equal(game.place(0, move.picture), false);
  assert.equal(game.actor(), 1);
  assert.equal(game.pending.stage, "pickup");
  assert.ok(game.pickup(1));
  assert.equal(game.place(1, move.picture), true);
  assert.equal(game.collections[1][move.picture], 1);
  assert.equal(game.turn, 1);
  assert.equal(game.pending, null);
  const saved = JSON.stringify(game);
  assert.equal(game.draw(0, 0), null);
  assert.equal(game.draw(1, -1), null);
  assert.equal(game.draw(1, 24), null);
  assert.equal(game.draw(1, 1.5), null);
  assert.equal(JSON.stringify(game), saved);
});

test("players can use the other board after their own board empties", () => {
  const game = new TileDuel({ random: () => 0.37 });
  // Exhaust a board without completing either theme, then check the forced fallback.
  game.boards[0].forEach((tile) => (tile.revealed = true));
  game.turn = 0;
  assert.equal(game.availableBoard(), 1);
  assert.equal(game.choices().length, 24);
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
      if (game.pending.stage === "pickup")
        assert.ok(game.pickup(pending.owner));
      assert.ok(game.place(pending.owner, pending.picture));
      reveals++;
      assert.equal(
        game.collections.flat().reduce((a, b) => a + b),
        reveals,
      );
      assert.ok(game.collections.flat().every((count) => count <= 4));
    }
    assert.ok(reveals <= 47);
    assert.deepEqual(game.collections[game.winner], [4, 4, 4, 4, 4, 4]);
    const saved = JSON.stringify(game);
    assert.deepEqual(game.choices(), []);
    assert.equal(game.draw(0, 0), null);
    assert.equal(JSON.stringify(game), saved);
  }
});

test("new rounds preserve chosen themes and reset collections", () => {
  const game = new TileDuel({ firstTheme: "animal", firstPlayer: 1 });
  assert.deepEqual(game.themes, ["animal", "fruit"]);
  assert.equal(game.turn, 1);
  assert.equal(game.availableBoard(), 1);
  assert.deepEqual(game.collections, [Array(6).fill(0), Array(6).fill(0)]);
  assert.equal(game.winner, null);
  assert.throws(() => new TileDuel({ firstTheme: "unknown" }));
});

test("pending automatic transfers and wrong columns cannot duplicate tiles or advance play", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const index = game.boards[0].findIndex((tile) => tile.theme === "animal");
  const move = game.draw(0, index);
  let saved = JSON.stringify(game);
  assert.deepEqual(game.choices(), []);
  assert.equal(game.draw(0, (index + 1) % 24), null);
  assert.equal(game.place(1, move.picture), false);
  assert.equal(JSON.stringify(game), saved);
  assert.equal(game.place(1, move.picture), false);
  assert.equal(game.pickup(0), false);
  assert.ok(game.pickup(1));
  game.columns[1][(move.picture + 1) % 4] = (move.picture + 1) % 4;
  saved = JSON.stringify(game);
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
  game.collections[0] = [4, 4, 4, 4, 4, 4];
  game.collections[0][picture] = 3;
  game.draw(0, index);
  assert.equal(game.pending.stage, "arrange");
  assert.equal(game.actor(), 0);
  assert.equal(game.winner, null);
  assert.ok(game.place(0, picture));
  assert.equal(game.winner, 0);
  assert.equal(game.pending, null);
});

test("new pictures choose any empty column while matching pictures must share it", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const first = game.boards[0].findIndex((tile) => tile.theme === "fruit");
  const picture = game.boards[0][first].picture;
  game.draw(0, first);
  assert.ok(game.place(0, 3));
  assert.equal(game.columns[0][3], picture);
  assert.equal(game.collections[0][picture], 1);
  assert.equal(game.turn, 0);
  const second = game.boards[0].findIndex(
    (tile) =>
      !tile.revealed && tile.theme === "fruit" && tile.picture === picture,
  );
  assert.ok(second >= 0);
  game.draw(0, second);
  const saved = JSON.stringify(game);
  assert.equal(game.place(0, 0), false);
  assert.equal(JSON.stringify(game), saved);
  assert.ok(game.place(0, 3));
  assert.equal(game.collections[0][picture], 2);
  assert.equal(game.columnFor(0, picture), 3);
  assert.equal(game.turn, 0);
  const different = game.boards[0].findIndex(
    (tile) =>
      !tile.revealed && tile.theme === "fruit" && tile.picture !== picture,
  );
  game.draw(0, different);
  assert.equal(game.place(0, 3), false);
  assert.ok(game.place(0, 1));
  assert.notEqual(game.columns[0][1], picture);
});

test("own tiles keep the turn; opponent tiles switch immediately and block draws until placed", () => {
  const game = new TileDuel({ random: () => 0.37 });
  const own = game.boards[0].findIndex((tile) => tile.theme === "fruit");
  game.draw(0, own);
  assert.ok(game.place(0, 2));
  assert.equal(game.turn, 0);
  const opponent = game.boards[0].findIndex(
    (tile) => !tile.revealed && tile.theme === "animal",
  );
  game.draw(0, opponent);
  assert.equal(game.turn, 1);
  assert.equal(game.actor(), 1);
  assert.deepEqual(game.choices(), []);
  assert.equal(game.draw(1, 0), null);
  assert.equal(game.pickup(0), false);
  assert.ok(game.pickup(1));
  assert.equal(game.turn, 1);
  assert.ok(game.place(1, 3));
  assert.equal(game.turn, 1);
});

test("dice block opening tiles until both roll; the higher value starts", () => {
  let value = 0.37;
  const game = new TileDuel({ requireRoll: true, random: () => value });
  assert.deepEqual(game.choices(), []);
  assert.equal(game.draw(0, 0), null);
  assert.equal(game.roll(1), null);
  value = 0;
  assert.equal(game.roll(0), 1);
  assert.equal(game.roll(0), null);
  assert.equal(game.awaitingDice, true);
  value = 0.999;
  assert.equal(game.roll(1), 6);
  assert.equal(game.awaitingDice, false);
  assert.equal(game.turn, 1);
  assert.equal(game.roll(0), null);
  assert.equal(game.choices().length, 24);
});

test("equal dice require a fresh pair of rolls, including on a new round", () => {
  let value = 0.37;
  const game = new TileDuel({ requireRoll: true, random: () => value });
  game.roll(0);
  game.roll(1);
  assert.equal(game.awaitingDice, true);
  assert.deepEqual(game.diceHistory, [[3, 3]]);
  assert.deepEqual(game.dice, [null, null]);
  assert.equal(game.draw(0, 0), null);
  value = 0.8;
  game.roll(0);
  value = 0.2;
  game.roll(1);
  assert.equal(game.turn, 0);
  assert.deepEqual(game.dice, [5, 2]);
  assert.equal(game.awaitingDice, false);
  const next = new TileDuel({ requireRoll: true });
  assert.deepEqual(next.dice, [null, null]);
  assert.deepEqual(next.diceHistory, []);
  assert.equal(next.awaitingDice, true);
});

test("every character pairing uses only those two themes and can finish all six groups", () => {
  for (const firstTheme of Object.keys(TILE_THEMES)) {
    assert.equal(TILE_THEMES[firstTheme].pictures.length, 6);
    assert.equal(TILE_THEMES[firstTheme].labels.length, 6);
    assert.equal(new Set(TILE_THEMES[firstTheme].pictures).size, 6);
    for (const secondTheme of Object.keys(TILE_THEMES)) {
      if (firstTheme === secondTheme) {
        assert.throws(() => new TileDuel({ firstTheme, secondTheme }));
        continue;
      }
      const g = new TileDuel({ firstTheme, secondTheme, random: () => 0.37 });
      assert.deepEqual(g.themes, [firstTheme, secondTheme]);
      assert.deepEqual(
        g.boards.map((board) => board.length),
        [24, 24],
      );
      for (const theme of g.themes)
        for (let picture = 0; picture < 6; picture++)
          assert.equal(
            g.boards
              .flat()
              .filter((t) => t.theme === theme && t.picture === picture).length,
            4,
          );
      let moves = 0;
      while (g.winner === null) {
        const choice = g.choices()[0];
        g.draw(choice.board, choice.index);
        const p = g.pending;
        if (p.stage === "pickup") g.pickup(p.owner);
        assert.ok(g.place(p.owner, g.columnFor(p.owner, p.picture)));
        assert.ok(++moves <= 47);
      }
      assert.deepEqual(g.collections[g.winner], [4, 4, 4, 4, 4, 4]);
    }
  }
});
test("the sixth collection column accepts a new picture and enforces matching placement", () => {
  const g = new TileDuel({
    firstTheme: "shinchan",
    secondTheme: "mario",
    random: () => 0.37,
  });
  const own = g.boards[0].findIndex((t) => t.theme === "shinchan");
  const picture = g.boards[0][own].picture;
  g.draw(0, own);
  assert.equal(g.place(0, 6), false);
  assert.ok(g.place(0, 5));
  assert.equal(g.columns[0][5], picture);
  assert.equal(g.columnFor(0, picture), 5);
});
