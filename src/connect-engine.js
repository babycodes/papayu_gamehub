export class ConnectFour {
  constructor(firstPlayer = 0) {
    this.cells = Array(42).fill(null);
    this.turn = firstPlayer;
    this.winner = null;
    this.line = [];
    this.last = null;
  }
  choices() {
    return this.winner === null
      ? [3, 2, 4, 1, 5, 0, 6].filter((c) => this.cells[c] === null)
      : [];
  }
  play(column) {
    if (
      this.winner !== null ||
      !Number.isInteger(column) ||
      column < 0 ||
      column > 6 ||
      this.cells[column] !== null
    )
      return false;
    let row = 5;
    while (this.cells[row * 7 + column] !== null) row--;
    const player = this.turn;
    this.cells[row * 7 + column] = player;
    this.last = row * 7 + column;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      const line = [this.last];
      for (const sign of [-1, 1]) {
        let r = row + dr * sign,
          c = column + dc * sign;
        while (
          r >= 0 &&
          r < 6 &&
          c >= 0 &&
          c < 7 &&
          this.cells[r * 7 + c] === player
        ) {
          line.push(r * 7 + c);
          r += dr * sign;
          c += dc * sign;
        }
      }
      if (line.length >= 4) {
        this.winner = player;
        this.line = line;
        return true;
      }
    }
    if (this.cells.every((c) => c !== null)) this.winner = "draw";
    else this.turn = 1 - player;
    return true;
  }
  clone() {
    const g = new ConnectFour(this.turn);
    g.cells = [...this.cells];
    g.winner = this.winner;
    return g;
  }
}
function evaluate(game, player) {
  if (game.winner !== null)
    return game.winner === "draw"
      ? 0
      : game.winner === player
        ? 100000
        : -100000;
  let score = 0;
  for (let r = 0; r < 6; r++)
    if (game.cells[r * 7 + 3] !== null)
      score += game.cells[r * 7 + 3] === player ? 4 : -4;
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 7; c++)
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ]) {
        if (r + 3 * dr > 5 || c + 3 * dc < 0 || c + 3 * dc > 6) continue;
        let own = 0,
          opponent = 0;
        for (let i = 0; i < 4; i++) {
          const v = game.cells[(r + i * dr) * 7 + c + i * dc];
          if (v === player) own++;
          else if (v !== null) opponent++;
        }
        if (!opponent) score += [0, 1, 10, 90, 100000][own];
        if (!own) score -= [0, 1, 12, 110, 100000][opponent];
      }
  return score;
}
export function connectBot(game, easy = false) {
  const player = game.turn,
    choices = game.choices();
  if (!choices.length) return null;
  for (const c of choices) {
    const g = game.clone();
    g.play(c);
    if (g.winner === player) return c;
  }
  for (const c of choices) {
    const g = game.clone();
    g.turn = 1 - player;
    g.play(c);
    if (g.winner === 1 - player) return c;
  }
  const search = (g, depth, alpha, beta) => {
    if (!depth || g.winner !== null) return evaluate(g, player);
    const max = g.turn === player;
    let value = max ? -Infinity : Infinity;
    for (const c of g.choices()) {
      const next = g.clone();
      next.play(c);
      const score = search(next, depth - 1, alpha, beta);
      value = max ? Math.max(value, score) : Math.min(value, score);
      if (max) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  };
  let best = choices[0],
    value = -Infinity;
  for (const c of choices) {
    const next = game.clone();
    next.play(c);
    const score = search(next, easy ? 1 : 3, -Infinity, Infinity);
    if (score > value) {
      best = c;
      value = score;
    }
  }
  return best;
}
