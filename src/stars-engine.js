export class CatchStars {
  constructor({
    duration = 45,
    local = false,
    firstPlayer = 0,
    random = Math.random,
  } = {}) {
    if (![30, 45, 60].includes(duration))
      throw Error("Pilih 30, 45, atau 60 detik.");
    Object.assign(this, {
      duration,
      local,
      firstPlayer,
      random,
      scores: [0, 0],
      roundIndex: 0,
      winner: null,
      events: [],
    });
    this.beginRound(firstPlayer);
  }
  beginRound(player) {
    this.turn = player;
    this.phase = "playing";
    this.remaining = this.duration;
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.caught = 0;
    this.bonusAdded = 0;
    this.basket = 0.5;
    this.objects = [];
    this.spawnRemaining = 0.5;
    this.frenzy = false;
    this.events = [];
  }
  move(player, x) {
    if (this.phase !== "playing" || this.winner !== null || !Number.isFinite(x))
      return false;
    this.basket = Math.max(0.09, Math.min(0.91, x));
    return true;
  }
  spawn() {
    const n = this.random();
    const type =
      n < 0.2
        ? "bomb"
        : n < 0.24 && this.bonusAdded < 9
          ? "time"
          : n < 0.36
            ? "gold"
            : "star";
    this.objects.push({
      type,
      x: 0.06 + this.random() * 0.88,
      y: -0.08,
      speed: 0.19 + this.random() * 0.12 + Math.min(0.12, this.elapsed / 300),
    });
  }
  tick(dt) {
    if (this.phase !== "playing" || this.winner !== null || !(dt > 0)) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (!this.remaining) {
      this.endRound();
      return;
    }
    this.elapsed += dt;
    const frenzy = this.elapsed % 20 >= 12 && this.elapsed % 20 < 17;
    if (frenzy && !this.frenzy) this.events.push({ type: "frenzy" });
    this.frenzy = frenzy;
    this.spawnRemaining -= dt;
    if (this.spawnRemaining <= 0) {
      this.spawn();
      this.spawnRemaining = this.frenzy ? 0.28 : 0.5;
    }
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const object = this.objects[i],
        previous = object.y;
      object.y += object.speed * dt;
      if (
        previous <= 0.86 &&
        object.y >= 0.86 &&
        Math.abs(object.x - this.basket) <= 0.105
      ) {
        this.catch(object);
        this.objects.splice(i, 1);
      } else if (object.y > 1.1) {
        if (object.type === "star" || object.type === "gold") this.combo = 0;
        this.objects.splice(i, 1);
      }
    }
  }
  catch(object) {
    if (object.type === "bomb") {
      this.score = Math.max(0, this.score - 15);
      this.combo = 0;
      this.events.push({ type: "bomb", x: object.x, text: "−15" });
    } else if (object.type === "time") {
      const bonus = Math.min(3, 9 - this.bonusAdded);
      this.remaining += bonus;
      this.bonusAdded += bonus;
      this.events.push({ type: "time", x: object.x, text: `+${bonus} detik` });
    } else {
      this.combo++;
      this.caught++;
      const points =
        (object.type === "gold" ? 25 : 10) *
        Math.min(5, 1 + Math.floor((this.combo - 1) / 3)) *
        (this.frenzy ? 2 : 1);
      this.score += points;
      this.events.push({ type: "catch", x: object.x, text: `+${points}` });
    }
    this.scores[this.turn] = this.score;
  }
  endRound() {
    this.scores[this.turn] = this.score;
    if (this.local && this.roundIndex === 0) this.phase = "handover";
    else {
      this.phase = "ended";
      this.winner = this.local
        ? this.scores[0] === this.scores[1]
          ? "draw"
          : this.scores[0] > this.scores[1]
            ? 0
            : 1
        : this.turn;
    }
  }
  nextRound() {
    if (this.phase !== "handover") return false;
    this.roundIndex = 1;
    this.beginRound(1 - this.firstPlayer);
    return true;
  }
  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}
