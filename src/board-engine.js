import { Chess } from "chess.js";
export { Chess };
export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export function ticResult(board) {
  for (const line of WIN_LINES)
    if (board[line[0]] && line.every((i) => board[i] === board[line[0]]))
      return { winner: board[line[0]], line };
  return board.every(Boolean) ? { winner: "draw", line: [] } : null;
}
export function ticBot(
  board,
  player = "O",
  easy = false,
  random = Math.random,
) {
  const available = board
    .map((cell, i) => (cell ? -1 : i))
    .filter((i) => i >= 0);
  if (!available.length || ticResult(board)) return null;
  if (easy) return available[Math.floor(random() * available.length)];
  function solve(cells, turn, depth) {
    const result = ticResult(cells);
    if (result)
      return result.winner === player
        ? 10 - depth
        : result.winner === "draw"
          ? 0
          : depth - 10;
    const scores = [];
    cells.forEach((cell, i) => {
      if (!cell) {
        const next = [...cells];
        next[i] = turn;
        scores.push(solve(next, turn === "X" ? "O" : "X", depth + 1));
      }
    });
    return turn === player ? Math.max(...scores) : Math.min(...scores);
  }
  let best = -Infinity,
    chosen = available[0];
  for (const i of available) {
    const next = [...board];
    next[i] = player;
    const score = solve(next, player === "X" ? "O" : "X", 0);
    if (score > best) {
      best = score;
      chosen = i;
    }
  }
  return chosen;
}
const VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
function evaluate(chess, color) {
  if (chess.isCheckmate()) return chess.turn() === color ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  let score = 0;
  chess.board().forEach((row, rank) =>
    row.forEach((piece, file) => {
      if (!piece) return;
      const center =
        (3.5 - Math.abs(3.5 - file) + 3.5 - Math.abs(3.5 - rank)) * 4;
      const value =
        VALUES[piece.type] +
        center +
        (piece.type === "p"
          ? (piece.color === "w" ? 6 - rank : rank - 1) * 7
          : 0);
      score += piece.color === color ? value : -value;
    }),
  );
  return score;
}
export function chessBot(chess, easy = false, random = Math.random) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length || chess.isGameOver()) return null;
  if (easy) return moves[Math.floor(random() * moves.length)];
  const color = chess.turn();
  let best = -Infinity,
    chosen = moves[0];
  // Two-ply search: choose a move after considering the opponent's best reply.
  for (const move of moves) {
    chess.move(move);
    let score = evaluate(chess, color);
    if (!chess.isGameOver()) {
      let worst = Infinity;
      for (const reply of chess.moves({ verbose: true })) {
        chess.move(reply);
        worst = Math.min(worst, evaluate(chess, color));
        chess.undo();
      }
      score = worst;
    }
    chess.undo();
    if (score > best) {
      best = score;
      chosen = move;
    }
  }
  return { from: chosen.from, to: chosen.to, promotion: chosen.promotion };
}
