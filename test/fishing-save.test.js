import test from "node:test";
import assert from "node:assert/strict";
import { FishingGame } from "../src/engine.js";
import {
  encodeFishingSave,
  decodeFishingSave,
  FishingProgress,
  FISHING_SAVE_KEY,
} from "../src/fishing-save.js";
const restore = (g) => {
  const raw = encodeFishingSave(g, {
    bossStyle: "cute",
    sound: false,
    roundBest: 200,
  });
  const save = decodeFishingSave(raw);
  assert.ok(save, "valid round must restore");
  return save;
};
const step = (g, seconds) => {
  for (let t = 0; t < seconds; t += 0.05) g.tick(0.05);
};
function bosses(score = 20000) {
  const g = new FishingGame(() => 0.37);
  g.reset();
  g.score = score;
  g.nextBossScore = score;
  g.beginBoss();
  step(g, 2.05);
  g.drainEvents();
  return g;
}
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
test("round trips score, clock, fish, frenzy, difficulty and settings without advancing offline time", () => {
  const g = new FishingGame(() => 0.37);
  g.reset("playing", "normal");
  step(g, 26);
  g.score = 1230;
  g.count = 8;
  g.combo = 3;
  g.bestCombo = 5;
  const save = restore(g),
    r = save.game;
  assert.equal(r.mode, "paused");
  assert.equal(r.remaining, g.remaining);
  assert.equal(r.elapsed, g.elapsed);
  assert.equal(r.score, 1230);
  assert.equal(r.combo, 3);
  assert.equal(r.bestCombo, 5);
  assert.equal(r.difficulty, "normal");
  assert.equal(r.starRemaining, g.starRemaining);
  assert.equal(r.nextHuntAt, Infinity);
  assert.equal(r.lastCatchAt, -Infinity);
  assert.equal(r.fish[0].expires, Infinity);
  assert.deepEqual(r.fish, g.fish);
  assert.deepEqual(save.settings, {
    bossStyle: "cute",
    sound: false,
    roundBest: 200,
  });
  r.tick(500);
  assert.equal(r.remaining, g.remaining);
  r.resume();
  r.tick(0.05);
  assert.equal(r.remaining, g.remaining - 0.05);
});
test("restore releases controls and preserves a fighting fish and stage timer", () => {
  const g = new FishingGame(() => 0.37);
  g.reset();
  const f = g.fish.find((f) => f.kind === "shark");
  g.fish.splice(g.fish.indexOf(f), 1);
  g.hook.catch = f;
  g.hook.y = 0.7;
  g.beginFight(f);
  g.fight.progress = 0.35;
  g.fight.remaining = 6.7;
  g.held = true;
  const r = restore(g).game;
  assert.equal(r.held, false);
  assert.equal(r.hook.state, "fighting");
  assert.equal(r.fight.progress, 0.35);
  assert.equal(r.fight.remaining, 6.7);
  assert.equal(r.hook.catch.id, f.id);
  assert.deepEqual(r.events, []);
  r.resume();
  r.tick(0.05);
  assert.ok(r.fight.remaining < 6.7);
  const empty = new FishingGame();
  empty.reset();
  empty.press();
  const released = restore(empty).game;
  assert.equal(released.hook.state, "reeling");
  assert.equal(released.held, false);
});
test("boss warning, active wave and finished-boss Set survive save and continue normally", () => {
  const g = new FishingGame(() => 0.37);
  g.reset();
  g.score = 20000;
  g.nextBossScore = 20000;
  g.beginBoss();
  const warning = restore(g).game;
  assert.equal(warning.currentBoss, warning.bossWave[0]);
  assert.equal(warning.bossState, "warning");
  warning.resume();
  step(warning, 2.1);
  assert.equal(warning.fish.filter((f) => f.boss).length, 2);
  warning.finishBoss(warning.fish[0], false);
  warning.fish.shift();
  const r = restore(warning).game;
  assert.ok(r.finishedBossIds instanceof Set);
  assert.equal(r.finishedBossIds.size, 1);
  assert.equal(r.bossRemaining, 1);
  assert.equal(r.nextBossScore, 22000);
  r.resume();
  r.tick(0.05);
  assert.equal(r.bossState, "active");
});
test("boss hunt keeps shared predator and prey identities, including a hooked prey", () => {
  const g = bosses(),
    [predator, prey] = g.fish;
  predator.power = 200;
  prey.power = 10;
  g.predation = { predator, prey, phase: "hunt", clock: 0.2 };
  g.hook.catch = prey;
  g.fish.splice(g.fish.indexOf(prey), 1);
  g.beginFight(prey);
  const r = restore(g).game;
  assert.equal(r.predation.predator, r.fish[0]);
  assert.equal(r.predation.prey, r.hook.catch);
  r.resume();
  step(r, 1);
  assert.ok(r.bossRemaining >= 1);
});
test("a boss mid-bite/mutation stays mutated rather than duplicating the prey", () => {
  const g = bosses(),
    [predator, prey] = g.fish;
  predator.power = 200;
  prey.power = 10;
  g.consumeBoss(predator, prey);
  const r = restore(g).game;
  assert.equal(r.predation.predator, r.fish[0]);
  assert.equal(r.predation.phase, "bite");
  assert.equal(r.bossRemaining, 1);
  assert.equal(r.fish.length, 1);
  assert.equal(r.fish[0].growth, 2);
  r.resume();
  step(r, 3);
  assert.equal(r.predation, null);
  assert.equal(r.fish.length, 1);
});
test("ended/ready rounds are not resumable, malformed or older saves are ignored", () => {
  const g = new FishingGame();
  assert.equal(encodeFishingSave(g), null);
  g.reset();
  g.endRound();
  assert.equal(encodeFishingSave(g), null);
  for (const raw of [null, "{", "{}", '{"version":999}', "x".repeat(524289)])
    assert.equal(decodeFishingSave(raw), null);
  g.reset();
  const data = JSON.parse(encodeFishingSave(g));
  data.state.nodes[data.state.entry.ref].values.score = -2;
  assert.equal(decodeFishingSave(JSON.stringify(data)), null);
});
test("progress clear ends only the checkpoint, best score is monotonic and old best values are reused", () => {
  const storage = memory(),
    progress = new FishingProgress(storage),
    g = new FishingGame();
  storage.setItem("papayu-fishing-best", "1800");
  assert.equal(progress.best(), 1800);
  assert.equal(progress.best(100), 1800);
  assert.equal(progress.best(2200), 2200);
  g.reset();
  g.score = 200;
  assert.ok(progress.save(g));
  assert.equal(progress.load().game.score, 200);
  progress.clear();
  assert.equal(progress.load(), null);
  assert.equal(progress.best(), 2200);
  storage.setItem(FISHING_SAVE_KEY, "{");
  assert.equal(progress.load(), null);
  assert.equal(storage.getItem(FISHING_SAVE_KEY), null);
});
test("blocked storage or quota failures do not crash gameplay or corrupt the in-memory record", () => {
  const broken = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("quota");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  const progress = new FishingProgress(broken),
    g = new FishingGame();
  g.reset();
  assert.equal(progress.load(), null);
  assert.equal(progress.save(g), false);
  assert.doesNotThrow(() => progress.clear());
  assert.equal(progress.best(30), 30);
  assert.equal(new FishingProgress(null).save(g), false);
});
