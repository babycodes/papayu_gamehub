import test from "node:test";
import assert from "node:assert/strict";
import { FishingGame, fishSize } from "../src/engine.js";
import { fishingDaylight } from "../src/fishing-daylight.js";
import { FishingMotion } from "../src/fishing-motion.js";
import { FISHING_BOSSES } from "../src/fishing-bosses.js";
const wave = () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.score = 42000;
  g.nextBossScore = 42000;
  g.tick(0.05);
  for (let i = 0; i < 42; i++) g.tick(0.05);
  g.fish.forEach((f, i) => {
    f.power = 10 + i * 10;
    f.x = 0.5;
    f.y = 0.65;
  });
  g.nextHuntAt = g.elapsed;
  return g;
};
const feed = (g) => {
  for (let i = 0; i < 16; i++) g.tickPredation(0.05);
};
test("only stronger free bosses eat, inherit traits, double growth and preserve the reward without awarding it", () => {
  const g = wave(),
    prey = g.fish[0],
    predator = g.fish[2],
    companion = g.fish[1],
    score = g.score,
    time = g.remaining,
    reward = prey.points + predator.points;
  feed(g);
  assert.equal(g.predation.phase, "mutate");
  assert.equal(g.predation.predator, predator);
  assert.equal(predator.growth, 2);
  assert.equal(predator.power, 35);
  assert.equal(predator.points, reward);
  assert.deepEqual(predator.mutations, [prey.kind]);
  assert.equal(g.bossRemaining, 2);
  assert.ok(g.fish.includes(companion));
  assert.ok(!g.fish.includes(prey));
  assert.equal(g.score, score);
  assert.equal(g.remaining, time);
  assert.equal(
    g.drainEvents().filter((e) => e.type === "boss-eaten").length,
    1,
  );
  feed(g);
  assert.equal(predator.growth, 2);
  assert.equal(
    g.drainEvents().filter((e) => e.type === "boss-eaten").length,
    0,
  );
  g.viewport = { width: 320, height: 420 };
  assert.ok(fishSize(predator, 320, 420) < 160);
});
test("a hooked prey is eaten and released without a failed stage, penalty, or reward", () => {
  const g = wave(),
    prey = g.fish.shift(),
    time = g.remaining;
  g.hook.catch = prey;
  g.hook.y = prey.y;
  g.hook.x = prey.x;
  g.beginFight(prey);
  g.fight.remaining = 0.01;
  feed(g);
  assert.equal(g.hook.catch, null);
  assert.equal(g.fight, null);
  assert.equal(g.hook.state, "reeling");
  assert.equal(g.remaining, time);
  assert.equal(prey.failures, 0);
  assert.equal(g.score, 42000);
  assert.equal(g.bossRemaining, 2);
});
test("hooking the hunter cancels its attack and a hooked strong boss never eats", () => {
  const g = wave();
  g.tickPredation(0.05);
  const predator = g.predation.predator;
  g.fish.splice(g.fish.indexOf(predator), 1);
  g.hook.catch = predator;
  g.beginFight(predator);
  g.tickPredation(0.05);
  assert.equal(g.predation, null);
  assert.equal(g.bossRemaining, 3);
  g.nextHuntAt = g.elapsed;
  g.tickPredation(0.05);
  assert.notEqual(g.predation?.predator, predator);
  assert.ok(
    !g.predation || g.predation.prey.power < g.predation.predator.power,
  );
});
test("equal power cannot eat, completed prey cannot be consumed twice and pause freezes feeding", () => {
  const g = wave();
  g.fish.forEach((f) => (f.power = 10));
  feed(g);
  assert.equal(g.predation, null);
  g.fish[2].power = 30;
  g.nextHuntAt = g.elapsed;
  g.tickPredation(0.05);
  const before = JSON.stringify(g.predation);
  g.pause();
  g.tick(0.05);
  assert.equal(JSON.stringify(g.predation), before);
  g.resume();
  g.finishBoss(g.predation.prey, true);
  g.tickPredation(0.05);
  assert.equal(g.predation, null);
  assert.equal(g.bossRemaining, 2);
  g.reset();
  assert.equal(g.predation, null);
  assert.equal(g.nextHuntAt, Infinity);
});
test("device-local daylight uses morning, noon, sunset and night boundaries", () => {
  assert.deepEqual(
    [4, 5, 10, 11, 15, 16, 18, 19, 23, 0].map((h) => fishingDaylight(h).name),
    [
      "Malam",
      "Pagi",
      "Pagi",
      "Siang",
      "Siang",
      "Sore",
      "Sore",
      "Malam",
      "Malam",
      "Malam",
    ],
  );
  assert.equal(fishingDaylight(22).night, true);
  assert.notDeepEqual(fishingDaylight(22).sea, fishingDaylight(12).sea);
});
test("new families have distinct silhouettes and ordinary hooked fish struggle while reduced motion remains still", () => {
  for (const family of ["seahorse", "kaiju", "jellyfish", "hydra"])
    assert.ok(FISHING_BOSSES.some((f) => f.kind === family));
  const m = new FishingMotion(),
    fish = { kind: "fish", phase: 1 };
  m.update(0.05, true);
  assert.notEqual(m.pose(fish).sway, m.pose(fish, { total: 1 }).sway);
  m.setReducedMotion(true);
  assert.equal(m.pose(fish, { total: 1 }).sway, 0);
  assert.equal(m.pose(fish, { total: 1 }).limb, 0);
});

test("two meals grow to four times, accumulate rewards and the last survivor ends the wave once", () => {
  const g = wave();
  const reward = g.fish.reduce((n, f) => n + f.points, 0);
  feed(g);
  const survivor = g.predation.predator;
  for (let i = 0; i < 42; i++) g.tickPredation(0.05);
  assert.equal(g.predation, null);
  g.nextHuntAt = g.elapsed;
  g.fish.forEach((f) => {
    f.x = 0.5;
    f.y = 0.65;
  });
  feed(g);
  assert.equal(survivor.growth, 4);
  assert.equal(survivor.points, reward);
  assert.equal(survivor.mutations.length, 2);
  assert.equal(g.bossRemaining, 1);
  assert.equal(g.bossState, "active");
  assert.equal(g.score, 42000);
  g.reward(survivor);
  assert.equal(g.bossState, "waiting");
  assert.equal(g.bossRemaining, 0);
  assert.equal(g.score, 42000 + reward);
  g.reward(survivor);
  assert.equal(g.score, 42000 + reward);
});

test("normal wave startup schedules feeding after the grace period without test overrides", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.score = 42000;
  g.nextBossScore = 42000;
  g.tick(0.05);
  assert.ok(Number.isFinite(g.nextHuntAt));
  assert.equal(g.nextHuntAt, 20);
  for (let i = 0; i < 398; i++) g.tick(0.05);
  assert.equal(g.predation, null);
  for (let i = 0; i < 4; i++) g.tick(0.05);
  assert.ok(g.predation);
  assert.ok(g.predation.predator.power > g.predation.prey.power);
});
