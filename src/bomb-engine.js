export const BOMB_COLUMNS = 6,
  BOMB_ROWS = 4,
  MAX_BOMBS = 5;
export const MINE_HOLD_SECONDS = 1.6,
  MINE_WINDOW_SECONDS = 5;
export const BOMB_CELLS = BOMB_COLUMNS * BOMB_ROWS;

// Local, in-memory boards. Only opened cells and earned Peek warnings reach the UI.
export class BomBom {
  constructor({ bot = false, firstPlayer = 0, random = Math.random } = {}) {
    this.bot = bot;
    this.random = random;
    this.turn = firstPlayer === 1 && !bot ? 1 : 0;
    this.firstPlayer = this.turn;
    this.bombs = [new Set(), new Set()];
    this.mines = [null, null];
    this.mine = null;
    this.peekCells = [null, null];
    this.warnings = [new Set(), new Set()];
    this.defused = [new Set(), new Set()];
    this.revealed = [new Set(), new Set()];
    this.ready = [false, false];
    this.scores = [0, 0];
    this.hits = [0, 0];
    this.winner = null;
    this.result = null;
    this.results = [null, null];
    this.endingRemaining = 0;
    this.phase = bot ? "placement" : "handover";
    this.pending = "placement";
  }
  lives(player) {
    return MAX_BOMBS - this.hits[player];
  }
  valid(index) {
    return Number.isInteger(index) && index >= 0 && index < BOMB_CELLS;
  }
  acknowledge() {
    if (this.phase !== "handover" || this.winner !== null) return false;
    this.phase = this.pending;
    return true;
  }
  toggle(index) {
    if (
      this.phase !== "placement" ||
      !this.valid(index) ||
      this.ready[this.turn]
    )
      return false;
    const bombs = this.bombs[this.turn];
    if (this.mines[this.turn] === index) this.mines[this.turn] = null;
    else if (bombs.has(index)) bombs.delete(index);
    else if (bombs.size < MAX_BOMBS) bombs.add(index);
    else if (this.mines[this.turn] === null) this.mines[this.turn] = index;
    else return false;
    return true;
  }
  confirm() {
    if (
      this.phase !== "placement" ||
      this.bombs[this.turn].size !== MAX_BOMBS ||
      this.mines[this.turn] === null
    )
      return false;
    this.ready[this.turn] = true;
    if (this.bot) {
      const choices = Array.from({ length: BOMB_CELLS }, (_, i) => i);
      while (this.bombs[1].size < MAX_BOMBS) {
        const position = Math.floor(this.random() * choices.length);
        this.bombs[1].add(choices.splice(position, 1)[0]);
      }
      this.mines[1] = choices[Math.floor(this.random() * choices.length)];
      this.ready[1] = true;
    }
    if (this.ready.every(Boolean)) {
      // One surprise bonus per board, chosen only from genuinely safe cells.
      for (const owner of [0, 1]) {
        const safe = Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
          (i) => !this.bombs[owner].has(i) && this.mines[owner] !== i,
        );
        this.peekCells[owner] = safe[Math.floor(this.random() * safe.length)];
      }
      this.turn = this.firstPlayer;
      this.pending = "attack";
    } else {
      this.turn = 1 - this.turn;
      this.pending = "placement";
    }
    this.phase = this.ready.every(Boolean) ? "attack" : "handover";
    return true;
  }
  open(index, player = this.turn) {
    if (
      player !== this.turn ||
      this.phase !== "attack" ||
      this.winner !== null ||
      !this.valid(index)
    )
      return false;
    const target = 1 - this.turn;
    if (this.revealed[target].has(index)) return false;
    this.revealed[target].add(index);
    if (this.mines[target] === index) {
      this.mine = {
        player: this.turn,
        target,
        index,
        remaining: MINE_WINDOW_SECONDS,
        held: 0,
        holding: false,
      };
      this.phase = "mine";
      return true;
    }
    const hit = this.bombs[target].has(index);
    if (hit) this.hits[this.turn]++;
    else this.scores[this.turn]++;
    this.result = { player: this.turn, target, index, hit };
    if (!hit && this.peekCells[target] === index) {
      const hidden = [...this.bombs[target]].filter(
        (i) =>
          !this.revealed[target].has(i) && !this.warnings[this.turn].has(i),
      );
      const warning = hidden.length
        ? hidden[Math.floor(this.random() * hidden.length)]
        : null;
      if (warning !== null) this.warnings[this.turn].add(warning);
      this.result = { ...this.result, peek: true, warning };
    }
    this.results[this.turn] = this.result;
    if (this.hits[this.turn] >= MAX_BOMBS) {
      this.winner = target;
      this.phase = "ending";
      // Let children see the last bomb before the result screen appears.
      this.endingRemaining = 0.9;
    } else this.turn = target;
    return true;
  }
  holdMine(player = this.turn) {
    if (this.phase !== "mine" || player !== this.turn) return false;
    this.mine.holding = true;
    return true;
  }
  releaseMine(player = this.turn) {
    if (this.phase !== "mine" || player !== this.turn || !this.mine.holding)
      return false;
    return this.resolveMine(false);
  }
  resolveMine(defused) {
    if (this.phase !== "mine") return false;
    const { player, target, index } = this.mine;
    if (defused) {
      this.scores[player] += 3;
      this.defused[target].add(index);
    } else this.hits[player]++;
    this.result = { player, target, index, hit: !defused, mine: true, defused };
    this.results[player] = this.result;
    this.mine = null;
    if (this.hits[player] >= MAX_BOMBS) {
      this.winner = target;
      this.phase = "ending";
      this.endingRemaining = 0.9;
    } else {
      this.turn = target;
      this.phase = "attack";
    }
    return true;
  }
  tick(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return false;
    if (this.phase === "mine") {
      // Resolve in small steps so holding and the deadline use the same clock.
      const elapsed = Math.min(dt, this.mine.remaining);
      this.mine.remaining = Math.max(0, this.mine.remaining - elapsed);
      if (this.mine.holding) this.mine.held += elapsed;
      if (this.mine.held >= MINE_HOLD_SECONDS) return this.resolveMine(true);
      if (this.mine.remaining <= 0) return this.resolveMine(false);
      return false;
    }
    if (this.phase !== "ending") return false;
    this.endingRemaining = Math.max(0, this.endingRemaining - dt);
    if (this.endingRemaining > 0) return false;
    this.phase = "ended";
    return true;
  }
  // Bot uses opened squares and earned peek warnings, never hidden contents.
  botChoice() {
    if (!this.bot || this.turn !== 1 || this.phase !== "attack") return null;
    const choices = Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
      (i) => !this.revealed[0].has(i),
    );
    const unmarked = choices.filter((i) => !this.warnings[1].has(i));
    const pool = unmarked.length ? unmarked : choices;
    return pool.length ? pool[Math.floor(this.random() * pool.length)] : null;
  }
}
