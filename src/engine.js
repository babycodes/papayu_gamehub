import {
  BOSS_STEP,
  FRENZY_DURATION,
  STAR_DURATION,
  createBossWave,
  nextBossThreshold,
} from "./fishing-bosses.js";
export const LAYERS = [
  {
    name: "Ikan kecil",
    kind: "fish",
    points: 10,
    color: "#bce7c5",
    accent: "#76b5a0",
    size: 22,
  },
  {
    name: "Ikan kuning",
    kind: "fish",
    points: 25,
    color: "#ffe5a0",
    accent: "#dbad58",
    size: 30,
  },
  {
    name: "Ikan buntal",
    kind: "puffer",
    points: 60,
    color: "#ffd78a",
    accent: "#ca934b",
    size: 40,
  },
  {
    name: "Hiu",
    kind: "shark",
    points: 100,
    color: "#b7dce9",
    accent: "#5e91ad",
    size: 62,
  },
  {
    name: "Hiu paus",
    kind: "whale",
    points: 180,
    color: "#b7bff4",
    accent: "#798bc7",
    size: 84,
  },
];
export function fishSize(fish, width = 650, height = 470, giant = false) {
  const scale = Math.max(0.55, Math.min(1.2, width / 600, height / 430));
  const multi = fish.boss && fish.waveCount > 1;
  const horizontal = multi && width / height > 1.6;
  const growth = fish.boss ? Math.min(5, fish.tier || 0) * 0.008 : 0;
  return Math.min(
    width *
      (fish.boss
        ? (horizontal
            ? fish.waveCount === 3
              ? 0.12
              : 0.2
            : multi
              ? 0.21
              : 0.32) + growth
        : 0.23),
    height *
      (fish.boss
        ? (horizontal
            ? fish.waveCount === 3
              ? 0.24
              : 0.28
            : multi
              ? fish.waveCount === 3
                ? 0.14
                : 0.21
              : 0.45) + growth
        : 0.245),
    fish.size *
      scale *
      ((giant || fish.giant) && !fish.bonus && !fish.boss ? 1.6 : 1),
  );
}
export class FishingGame {
  constructor(random = Math.random) {
    this.random = random;
    this.viewport = { width: 650, height: 470 };
    this.reset("ready");
  }
  reset(mode = "playing", difficulty = this.difficulty || "easy") {
    this.difficulty = difficulty === "normal" ? "normal" : "easy";
    this.mode = mode;
    this.remaining = 90;
    this.elapsed = 0;
    this.score = 0;
    this.count = 0;
    this.combo = 1;
    this.lastCatchAt = -Infinity;
    this.bestCombo = 1;
    this.rareCount = 0;
    this.nextBonus = 17;
    this.frenzy = false;
    this.lastFrenzy = false;
    this.frenzyRemaining = 0;
    this.starRemaining = 0;
    this.nextFrenzyAt = 25;
    this.bossIndex = 0;
    this.nextBossScore = BOSS_STEP;
    this.currentBoss = null;
    this.bossWave = [];
    this.bossRemaining = 0;
    this.bossWaveCaught = 0;
    this.previousBossKinds = [];
    this.finishedBossIds = new Set();
    this.events = [];
    this.held = false;
    this.fight = null;
    this.bossState = "waiting";
    this.bossClock = 0;
    this.hiddenFish = [];
    this.bossCount = 0;
    this.hook = {
      x: 0.47,
      targetX: 0.47,
      y: 0.305,
      state: "idle",
      catch: null,
    };
    this.fish = [];
    this.id = 0;
    this.populate();
  }
  populate() {
    for (let layer = 0; layer < 5; layer++)
      for (let i = 0; i < (layer < 2 ? 4 : layer === 2 ? 3 : 2); i++)
        this.spawn(layer, true);
  }
  spawn(layer, initial = false, bonus = false, special = false) {
    const direction = this.random() < 0.5 ? 1 : -1;
    const species = bonus
      ? {
          name: "Bonus waktu",
          kind: "clock",
          points: 0,
          color: "#f9e19c",
          accent: "#cba151",
          size: 24,
        }
      : special
        ? {
            ...LAYERS[4],
            kind: "star",
            name: "Bintang laut ajaib",
            points: 200,
            color: "#ffe8a5",
            accent: "#d6b15d",
            size: 46,
          }
        : LAYERS[layer];
    const fish = {
      ...species,
      id: ++this.id,
      layer,
      bonus,
      special,
      giant: special,
      x: initial ? 0.12 + this.random() * 0.65 : direction > 0 ? -0.24 : 1.24,
      y: 0.352 + layer * 0.124 + this.random() * 0.025,
      direction,
      speed: (0.025 + this.random() * 0.025) * (layer >= 3 ? 0.55 : 1),
      phase: this.random() * Math.PI * 2,
      expires: bonus ? this.elapsed + 13 : Infinity,
    };
    this.fish.push(fish);
    return fish;
  }
  press(x) {
    if (this.mode !== "playing") return;
    if (x !== undefined) this.aim(x);
    this.held = true;
    if (this.hook.state === "idle" && this.bossState !== "warning")
      this.hook.state = "dropping";
  }
  aim(x) {
    if (Number.isFinite(x))
      this.hook.targetX = Math.max(0.06, Math.min(0.94, x));
  }
  release() {
    this.held = false;
    if (this.mode === "playing" && this.hook.state === "dropping")
      this.hook.state = "reeling";
  }
  pause() {
    if (this.mode === "playing") {
      this.release();
      this.mode = "paused";
    }
  }
  resume() {
    if (this.mode === "paused") this.mode = "playing";
  }
  beginBoss() {
    if (this.hook.catch || ["warning", "active"].includes(this.bossState))
      return false;
    const threshold = this.nextBossScore;
    this.bossWave = createBossWave(
      threshold,
      this.bossIndex++,
      this.random,
      this.previousBossKinds,
    );
    this.currentBoss = this.bossWave[0];
    this.previousBossKinds = this.bossWave.map((b) => b.kind);
    this.finishedBossIds.clear();
    this.bossRemaining = this.bossWave.length;
    this.bossWaveCaught = 0;
    this.nextBossScore = nextBossThreshold(threshold);
    this.bossState = "warning";
    this.bossClock = 0;
    this.hiddenFish = this.fish;
    this.fish = [];
    this.hook.state = "idle";
    this.held = false;
    this.events.push({
      type: "boss-warning",
      boss: this.currentBoss,
      bosses: this.bossWave,
    });
    return true;
  }
  returnFish(caught) {
    this.fish = this.hiddenFish.filter((f) => !f.bonus);
    this.hiddenFish = [];
    this.bossState = "waiting";
    this.bossRemaining = 0;
    if (!caught)
      this.events.push({ type: "boss-left", boss: this.currentBoss });
    if (!this.fish.length) this.populate();
    this.events.push({
      type: "sea-return",
      caught,
      boss: this.currentBoss,
      caughtCount: this.bossWaveCaught,
      total: this.bossWave.length,
    });
  }
  finishBoss(fish, caught) {
    if (!this.canFinishBoss(fish)) return;
    this.finishedBossIds.add(fish.encounterId);
    this.fish = this.fish.filter((f) => f.encounterId !== fish.encounterId);
    this.bossRemaining--;
    if (caught) this.bossWaveCaught++;
    this.events.push({
      type: "boss-finished",
      fish,
      caught,
      remaining: this.bossRemaining,
      total: this.bossWave.length,
    });
    if (this.bossRemaining === 0)
      this.returnFish(this.bossWaveCaught === this.bossWave.length);
    else this.bossClock = 0; // A fresh invitation for each remaining monster.
  }
  canFinishBoss(fish) {
    return (
      this.bossState === "active" &&
      this.bossRemaining > 0 &&
      !this.finishedBossIds.has(fish.encounterId) &&
      this.bossWave.some((b) => b.encounterId === fish.encounterId)
    );
  }
  beginFight(fish) {
    this.fight = {
      type:
        fish.boss || fish.kind === "shark"
          ? "follow"
          : fish.kind === "puffer"
            ? "timing"
            : "hold",
      stage: 0,
      aggression: fish.boss ? Math.min(5, fish.tier || 0) : 0,
      progress: 0,
      elapsed: 0,
      total: 0,
      good: false,
      target: this.hook.x,
      meter: 0,
      remaining: fish.boss
        ? 24 + Math.min(5, fish.tier || 0) * 2
        : this.difficulty === "easy"
          ? 16
          : 11,
    };
    this.hook.state = "fighting";
    this.events.push({ type: "fight-start", fish });
  }
  tickFight(dt) {
    const f = this.fight,
      fish = this.hook.catch;
    f.elapsed += dt;
    f.total += dt;
    f.remaining -= dt;
    f.target =
      0.5 +
      Math.sin(
        f.elapsed *
          (this.difficulty === "easy" ? 0.9 : 1.3) *
          (1 + f.aggression * 0.08),
      ) *
        0.22;
    f.meter = (Math.sin(f.elapsed * 2.2 - Math.PI / 2) + 1) / 2;
    f.good =
      f.type === "follow"
        ? Math.abs(this.hook.x - f.target) <
          (this.difficulty === "easy" ? 0.17 : 0.11)
        : f.type === "timing"
          ? f.meter >= (this.difficulty === "easy" ? 0.42 : 0.62)
          : true;
    if (this.held && f.good)
      f.progress = Math.min(
        1,
        f.progress +
          dt / ((f.type === "hold" ? 1.8 : 1.45) * (1 + f.aggression * 0.05)),
      );
    else if (this.held && !f.good && this.difficulty === "normal")
      f.progress = Math.max(0, f.progress - dt * 0.08);
    if (f.progress >= 1) {
      if (fish.boss && f.stage < 2) {
        f.stage++;
        f.type = ["follow", "hold", "timing"][f.stage];
        f.progress = 0;
        f.elapsed = 0;
        this.events.push({ type: "fight-stage", stage: f.stage, fish });
      } else {
        this.fight = null;
        this.hook.state = "reeling";
        this.events.push({ type: "fight-won", fish });
      }
    } else if (f.remaining <= 0) {
      this.fight = null;
      this.hook.catch = null;
      this.hook.state = "reeling";
      this.held = false;
      if (fish.boss) this.finishBoss(fish, false);
      else if (fish.special) this.fish.push(fish);
      else this.spawn(fish.layer);
      this.events.push({ type: "escaped", fish });
    }
  }
  reward(fish) {
    if (fish.boss && !this.canFinishBoss(fish)) return;
    if (fish.bonus) {
      this.remaining += 12;
      this.events.push({ type: "bonus", seconds: 12 });
      return;
    }
    this.combo =
      this.elapsed - this.lastCatchAt <= 8 ? Math.min(4, this.combo + 1) : 1;
    this.lastCatchAt = this.elapsed;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const points =
      fish.points *
      (fish.boss ? 1 : this.combo) *
      (!fish.boss && (fish.special ? this.starRemaining > 0 : this.frenzy)
        ? 2
        : 1);
    this.score += points;
    this.count++;
    if (fish.layer === 4) this.rareCount++;
    if (fish.boss) {
      this.bossCount++;
      this.remaining += 8;
      this.finishBoss(fish, true);
    }
    this.events.push({ type: "catch", fish, points, combo: this.combo });
    if (!fish.boss && !fish.special) this.spawn(fish.layer);
  }
  tick(dt) {
    if (this.mode !== "playing" || !Number.isFinite(dt)) return;
    dt = Math.min(Math.max(dt, 0), 0.05);
    if (
      this.bossState === "waiting" &&
      this.score >= this.nextBossScore &&
      !this.hook.catch
    )
      this.beginBoss();
    this.elapsed += dt;
    // Boss encounters and hauling a hooked star give children time to finish.
    const protectedTime =
      ["warning", "active"].includes(this.bossState) ||
      this.hook.catch?.special;
    if (!protectedTime) this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 0) {
      this.mode = "ended";
      this.held = false;
      this.fight = null;
      this.hook.state = "idle";
      this.hook.catch = null;
      this.events.push({ type: "end" });
      return;
    }
    if (["warning", "active"].includes(this.bossState)) {
      this.bossClock += dt;
      if (this.bossState === "warning" && this.bossClock >= 2) {
        this.bossState = "active";
        this.bossClock = 0;
        for (const boss of this.bossWave)
          this.fish.push({
            ...boss,
            id: ++this.id,
            bossId: boss.id,
            layer: 3,
            x: 0.5,
            y: 0.64,
            direction: 1,
            speed: 0,
            phase: boss.slot * 2.1,
            expires: Infinity,
          });
        this.events.push({
          type: "boss-arrived",
          boss: this.currentBoss,
          bosses: this.bossWave,
        });
      } else if (
        this.bossState === "active" &&
        this.bossClock >= 30 &&
        !this.hook.catch
      )
        this.returnFish(false);
    }
    const bossBusy = ["warning", "active"].includes(this.bossState);
    if (!bossBusy) {
      this.frenzyRemaining = Math.max(0, this.frenzyRemaining - dt);
      if (!this.hook.catch?.special)
        this.starRemaining = Math.max(0, this.starRemaining - dt);
    }
    if (
      !bossBusy &&
      this.frenzyRemaining === 0 &&
      this.elapsed >= this.nextFrenzyAt
    ) {
      this.frenzyRemaining = FRENZY_DURATION;
      this.starRemaining = STAR_DURATION;
      this.nextFrenzyAt = this.elapsed + 25;
      this.events.push({ type: "frenzy" });
      if (!this.fish.some((f) => f.special) && !this.hook.catch?.special)
        this.spawn(4, true, false, true);
    }
    this.frenzy = this.frenzyRemaining > 0 && !bossBusy;
    if (
      this.elapsed >= this.nextBonus &&
      !["warning", "active"].includes(this.bossState)
    ) {
      this.nextBonus += 22;
      this.spawn(2, true, true);
      this.events.push({ type: "bonus-spawn" });
    }
    if (this.elapsed - this.lastCatchAt > 8) this.combo = 1;
    for (const fish of [...this.fish]) {
      if (fish.boss) {
        const multi = fish.waveCount > 1,
          slot = fish.slot || 0;
        const horizontal =
          multi && this.viewport.width / this.viewport.height > 1.6;
        const centers =
          fish.waveCount === 3 ? [0.46, 0.65, 0.84] : [0.51, 0.78];
        const swim =
          this.elapsed * (0.65 + (fish.tier || 0) * 0.04) + slot * 1.9;
        const horizontalX =
          fish.waveCount === 3 ? [0.18, 0.5, 0.82] : [0.3, 0.7];
        fish.x =
          (horizontal
            ? horizontalX[slot]
            : multi
              ? slot % 2
                ? 0.65
                : 0.35
              : 0.5) +
          Math.sin(swim) * (multi ? 0.025 : 0.14);
        const margin =
          (fishSize(fish, this.viewport.width, this.viewport.height) * 1.3) /
          this.viewport.width;
        fish.x = Math.max(margin, Math.min(1 - margin, fish.x));
        fish.y =
          (horizontal ? 0.64 : multi ? centers[slot] : 0.64) +
          Math.sin(swim * 1.4) * 0.008;
        const size = fishSize(fish, this.viewport.width, this.viewport.height);
        fish.y = Math.max(
          0.34 + size / this.viewport.height,
          Math.min(0.975 - (size * 0.9) / this.viewport.height, fish.y),
        );
        fish.direction = Math.cos(swim) >= 0 ? 1 : -1;
      } else {
        fish.x += fish.direction * fish.speed * dt;
        if (fish.special && (fish.x > 0.84 || fish.x < 0.16)) {
          fish.x = Math.max(0.16, Math.min(0.84, fish.x));
          fish.direction *= -1;
        }
      }
      if (fish.x > 1.3 || fish.x < -0.3 || this.elapsed > fish.expires) {
        this.fish.splice(this.fish.indexOf(fish), 1);
        if (!fish.bonus && !fish.special && !fish.boss) this.spawn(fish.layer);
      }
    }
    const hook = this.hook;
    hook.x += (hook.targetX - hook.x) * Math.min(1, dt * 8);
    if (hook.state === "fighting") {
      this.tickFight(dt);
      return;
    }
    if (hook.state === "dropping") {
      hook.y = Math.min(0.973, hook.y + dt * 0.235);
      const { width, height } = this.viewport;
      const catchable = [...this.fish]
        .sort((a, b) => Number(!!b.special) - Number(!!a.special))
        .find((f) => {
          const s = fishSize(f, width, height, this.frenzy);
          return (
            Math.abs(f.x - hook.x) < s / width + 0.012 &&
            Math.abs(f.y - hook.y) <
              (s * (f.kind === "puffer" ? 0.8 : 0.48)) / height + 0.01
          );
        });
      if (catchable) {
        hook.catch = catchable;
        this.fish.splice(this.fish.indexOf(catchable), 1);
        this.events.push({ type: "hooked", fish: catchable });
        if (
          !catchable.bonus &&
          (catchable.boss ||
            ["puffer", "shark", "whale"].includes(catchable.kind) ||
            catchable.special)
        )
          this.beginFight(catchable);
        else hook.state = "reeling";
      } else if (hook.y >= 0.973) hook.state = "reeling";
    } else if (hook.state === "reeling") {
      hook.y = Math.max(0.305, hook.y - dt * (hook.catch ? 0.35 : 0.52));
      if (hook.y <= 0.305) {
        const fish = hook.catch;
        if (fish) this.reward(fish);
        else this.events.push({ type: "miss" });
        hook.catch = null;
        hook.state = "idle";
      }
    }
  }
  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}
