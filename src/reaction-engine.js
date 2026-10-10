export class ReactionRace {
  constructor({
    rounds = 5,
    bot = true,
    easy = false,
    random = Math.random,
  } = {}) {
    if (![3, 5, 7].includes(rounds)) throw Error("Pilih 3, 5, atau 7 ronde.");
    Object.assign(this, {
      rounds,
      bot,
      easy,
      random,
      scores: [0, 0],
      round: 1,
      winner: null,
      log: [],
    });
    this.begin();
  }
  begin() {
    this.phase = "wait";
    this.waitRemaining = 1.5 + this.random() * 2.5;
    this.elapsed = 0;
    this.responses = [null, null];
    this.result = null;
    this.botTime = (this.easy ? 0.38 : 0.23) + this.random() * 0.14;
  }
  press(player) {
    if (
      this.winner !== null ||
      ![0, 1].includes(player) ||
      this.phase === "result" ||
      this.phase === "ended" ||
      this.responses[player] !== null
    )
      return false;
    if (this.phase === "wait") {
      this.responses[player] = "early";
      this.endRound(1 - player, "early");
      return true;
    }
    this.responses[player] = Math.round(this.elapsed * 1000);
    if (this.responses.every((r) => r !== null)) this.resolve();
    return true;
  }
  resolve() {
    const [a, b] = this.responses;
    this.endRound(
      a === b ? "draw" : a === null ? 1 : b === null ? 0 : a < b ? 0 : 1,
      "reaction",
    );
  }
  endRound(winner, reason) {
    if (this.phase === "result") return;
    if (winner !== "draw") this.scores[winner]++;
    this.result = { winner, reason, responses: [...this.responses] };
    this.log.push(this.result);
    this.phase = "result";
    this.resultRemaining = 1.2;
  }
  tick(dt) {
    if (this.winner !== null || !(dt > 0)) return;
    if (this.phase === "wait") {
      this.waitRemaining = Math.max(0, this.waitRemaining - dt);
      if (!this.waitRemaining) {
        this.phase = "go";
        this.elapsed = 0;
      }
      return;
    }
    if (this.phase === "go") {
      this.elapsed += dt;
      if (
        this.bot &&
        this.responses[1] === null &&
        this.elapsed >= this.botTime
      )
        this.press(1);
      if (this.phase !== "go") return;
      const first = this.responses.filter((r) => typeof r === "number");
      if (
        (first.length && this.elapsed * 1000 >= Math.min(...first) + 900) ||
        this.elapsed >= 3
      )
        this.resolve();
      return;
    }
    if (this.phase === "result") {
      this.resultRemaining = Math.max(0, this.resultRemaining - dt);
      if (this.resultRemaining) return;
      if (this.round === this.rounds) {
        this.winner =
          this.scores[0] === this.scores[1]
            ? "draw"
            : this.scores[0] > this.scores[1]
              ? 0
              : 1;
        this.phase = "ended";
      } else {
        this.round++;
        this.begin();
      }
    }
  }
}
