import test from "node:test";
import assert from "node:assert/strict";
import { Chess, ticResult, ticBot, chessBot } from "../src/board-engine.js";
import { GAMES, queryGames } from "../src/catalog.js";
test("library combines search, category, favorites, sorting and pagination", () => {
  assert.equal(
    queryGames(GAMES, { search: "CATUR", category: "Strategi" }).items[0].id,
    "chess",
  );
  assert.equal(queryGames(GAMES, { search: "unknown" }).total, 0);
  assert.deepEqual(
    queryGames(GAMES, {
      favoritesOnly: true,
      favorites: ["tic-tac-toe"],
    }).items.map((g) => g.id),
    ["tic-tac-toe"],
  );
  const first = queryGames(GAMES, {
    pageSize: 2,
    sort: "popular",
    plays: { chess: 7 },
  });
  assert.equal(first.items[0].id, "chess");
  assert.equal(first.pages, Math.ceil(GAMES.length / 2));
  assert.equal(queryGames(GAMES, { pageSize: 2, page: 2 }).items.length, 2);
  assert.equal(
    queryGames(GAMES, { category: "Arcade", page: 10 }).page,
    Math.ceil(GAMES.filter((g) => g.category === "Arcade").length / 6),
  );
});
test("tic tac toe distinguishes wins, draws and ongoing play", () => {
  assert.equal(
    ticResult(["X", "X", "X", "O", null, "O", null, null, null]).winner,
    "X",
  );
  assert.equal(
    ticResult(["X", "O", "X", "X", "O", "O", "O", "X", "X"]).winner,
    "draw",
  );
  assert.equal(ticResult(Array(9).fill(null)), null);
});
test("tic bot takes a win and blocks a loss without changing the board", () => {
  const board = ["O", "O", null, "X", "X", null, null, null, null],
    copy = [...board];
  assert.equal(ticBot(board), 2);
  assert.deepEqual(board, copy);
  assert.equal(ticBot(["X", "X", null, null, "O", null, null, null, null]), 2);
});
test("perfect tic bot never loses against any sequence of human moves", () => {
  function visit(board) {
    const outcome = ticResult(board);
    if (outcome) {
      assert.notEqual(outcome.winner, "X");
      return;
    }
    board.forEach((cell, i) => {
      if (cell) return;
      const next = [...board];
      next[i] = "X";
      const afterHuman = ticResult(next);
      if (afterHuman) {
        assert.notEqual(afterHuman.winner, "X");
        return;
      }
      const bot = ticBot(next);
      assert.ok(bot !== null && !next[bot]);
      next[bot] = "O";
      visit(next);
    });
  }
  visit(Array(9).fill(null));
});
test("chess rules reject illegal moves, including exposing your king", () => {
  const chess = new Chess();
  assert.throws(() => chess.move({ from: "e2", to: "e5" }));
  const pinned = new Chess("4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1");
  assert.throws(() => pinned.move({ from: "e2", to: "d2" }));
});
test("chess supports castling, en passant and all four promotions", () => {
  const castle = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  castle.move("O-O");
  assert.equal(castle.get("f1").type, "r");
  const ep = new Chess();
  for (const move of ["e4", "a6", "e5", "d5", "exd6"]) ep.move(move);
  assert.equal(ep.get("d5"), undefined);
  assert.equal(ep.get("d6").color, "w");
  for (const promotion of ["q", "r", "b", "n"]) {
    const chess = new Chess("7k/P7/8/8/8/8/8/7K w - - 0 1");
    chess.move({ from: "a7", to: "a8", promotion });
    assert.equal(chess.get("a8").type, promotion);
  }
});
test("chess bot makes a legal move and preserves position and move history during search", () => {
  const chess = new Chess();
  chess.move("e4");
  const fen = chess.fen(),
    history = chess.history();
  const move = chessBot(chess);
  assert.equal(chess.fen(), fen);
  assert.deepEqual(chess.history(), history);
  assert.ok(chess.move(move));
});
test("chess bot finishes mate in one and terminal positions have no bot move", () => {
  const chess = new Chess();
  ["f3", "e5", "g4"].forEach((m) => chess.move(m));
  chess.move(chessBot(chess));
  assert.equal(chess.isCheckmate(), true);
  assert.equal(chessBot(chess), null);
  const stale = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  assert.equal(stale.isStalemate(), true);
  assert.equal(chessBot(stale), null);
  assert.equal(
    new Chess("7k/8/8/8/8/8/8/7K w - - 0 1").isInsufficientMaterial(),
    true,
  );
});
