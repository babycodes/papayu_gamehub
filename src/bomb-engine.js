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
    this.phase = bot ? "placement" : "handover";
    this.pending = "placement";
  }
  valid(index) {
    return Number.isInteger(index) && index >= 0 && index < 16;
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
    else if (bombs.size < 3) bombs.add(index);
    else return false;
    return true;
  }
  confirm() {
    if (this.phase !== "placement" || this.bombs[this.turn].size !== 3)
      return false;
    this.ready[this.turn] = true;
    if (this.bot) {
      const choices = Array.from({ length: 16 }, (_, i) => i);
      while (this.bombs[1].size < 3) {
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
    this.phase = this.bot ? this.pending : "handover";
    return true;
  }
  open(index) {
    if (this.phase !== "attack" || this.winner !== null || !this.valid(index))
      return false;
    const target = 1 - this.turn;
    if (this.revealed[target].has(index)) return false;
    this.revealed[target].add(index);
    const hit = this.bombs[target].has(index);
    if (hit) this.hits[this.turn]++;
    else this.scores[this.turn]++;
    this.result = { player: this.turn, target, index, hit };
    if (this.hits[this.turn] === 3) this.winner = target;
    this.phase = "result";
    return true;
  }
  next() {
    if (this.phase !== "result" || this.winner !== null) return false;
    this.turn = 1 - this.turn;
    this.result = null;
    this.pending = "attack";
    this.phase = this.bot ? "attack" : "handover";
    return true;
  }
  // Bot sees only which squares have already been opened, never their contents.
  botChoice() {
    if (!this.bot || this.turn !== 1 || this.phase !== "attack") return null;
    const choices = Array.from({ length: 16 }, (_, i) => i).filter(
      (i) => !this.revealed[0].has(i),
    );
    return choices.length
      ? choices[Math.floor(this.random() * choices.length)]
      : null;
  }
}
