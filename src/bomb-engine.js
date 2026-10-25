export const BOMB_COLUMNS = 6,
  BOMB_ROWS = 4,
  MAX_BOMBS = 5;
export const BOMB_CELLS = BOMB_COLUMNS * BOMB_ROWS;

// Local, in-memory boards. Hidden bomb positions are never rendered during attacks.
export class BomBom {
  constructor({ bot = false, firstPlayer = 0, random = Math.random } = {}) {
    this.bot = bot;
    this.random = random;
    this.turn = firstPlayer === 1 && !bot ? 1 : 0;
    this.firstPlayer = this.turn;
    this.bombs = [new Set(), new Set()];
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
    if (bombs.has(index)) bombs.delete(index);
    else if (bombs.size < MAX_BOMBS) bombs.add(index);
    else return false;
    return true;
  }
  confirm() {
    if (this.phase !== "placement" || this.bombs[this.turn].size !== MAX_BOMBS)
      return false;
    this.ready[this.turn] = true;
    if (this.bot) {
      const choices = Array.from({ length: BOMB_CELLS }, (_, i) => i);
      while (this.bombs[1].size < MAX_BOMBS) {
        const position = Math.floor(this.random() * choices.length);
        this.bombs[1].add(choices.splice(position, 1)[0]);
      }
      this.ready[1] = true;
    }
    if (this.ready.every(Boolean)) {
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
    const hit = this.bombs[target].has(index);
    if (hit) this.hits[this.turn]++;
    else this.scores[this.turn]++;
    this.result = { player: this.turn, target, index, hit };
    this.results[this.turn] = this.result;
    if (this.hits[this.turn] === MAX_BOMBS) {
      this.winner = target;
      this.phase = "ending";
      // Let children see the last bomb before the result screen appears.
      this.endingRemaining = 0.9;
    } else this.turn = target;
    return true;
  }
  tick(dt) {
    if (this.phase !== "ending" || !Number.isFinite(dt) || dt <= 0)
      return false;
    this.endingRemaining = Math.max(0, this.endingRemaining - dt);
    if (this.endingRemaining > 0) return false;
    this.phase = "ended";
    return true;
  }
  // Bot sees only which squares have already been opened, never their contents.
  botChoice() {
    if (!this.bot || this.turn !== 1 || this.phase !== "attack") return null;
    const choices = Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
      (i) => !this.revealed[0].has(i),
    );
    return choices.length
      ? choices[Math.floor(this.random() * choices.length)]
      : null;
  }
}
