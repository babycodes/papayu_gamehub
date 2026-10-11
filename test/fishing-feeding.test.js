import test from "node:test";
import assert from "node:assert/strict";
import { FishingGame, fishSize, bossEatRadius } from "../src/engine.js";
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
  g.fish[1].x = 0.05;
  g.fish[1].y = 0.35;
  g.nextHuntAt = Infinity;
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
test("a hooked strongest boss cannot eat but other free bosses may still consume weaker prey", () => {
  const g = wave(),
    strongest = g.fish.pop();
  g.hook.catch = strongest;
  g.hook.x = strongest.x;
  g.hook.y = strongest.y;
  g.beginFight(strongest);
  g.fish.forEach((f) => {
    f.x = 0.5;
    f.y = 0.65;
  });
  g.tickPredation(0.05);
  assert.equal(strongest.growth, 1);
  assert.notEqual(g.predation.predator, strongest);
  assert.equal(g.hook.catch, strongest);
  assert.equal(g.bossRemaining, 2);
});
test("equal power cannot eat, consumed prey cannot be counted twice and pause freezes feeding", () => {
  const g = wave();
  g.fish.forEach((f) => (f.power = 10));
  feed(g);
  assert.equal(g.predation, null);
  g.fish[2].power = 30;
  g.tickPredation(0.05);
  const snapshot = JSON.stringify(g.predation),
    remaining = g.bossRemaining;
  g.pause();
  g.tick(0.05);
  assert.equal(JSON.stringify(g.predation), snapshot);
  g.resume();
  g.finishBoss(g.predation.prey, true);
  assert.equal(g.bossRemaining, remaining);
  assert.equal(g.bossWaveCaught, 0);
  for (let i = 0; i < 56; i++) g.tickPredation(0.05);
  assert.equal(g.predation, null);
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

test("contact immediately consumes a hooked victim even before the fallback deadline", () => {
  const g = wave(),
    prey = g.fish.shift(),
    predator = g.fish.at(-1);
  g.hook.catch = prey;
  g.hook.x = prey.x;
  g.hook.y = prey.y;
  g.beginFight(prey);
  g.nextHuntAt = Infinity;
  g.tickPredation(0.001);
  assert.equal(g.bossRemaining, 2);
  assert.equal(g.hook.catch, null);
  assert.equal(g.fight, null);
  assert.equal(g.predation.phase, "bite");
  assert.equal(predator.growth, 2);
  assert.equal(g.score, 42000);
  assert.equal(g.remaining, 90);
  assert.equal(prey.failures, 0);
});
test("distant bosses begin a physical chase after eight seconds and eat only on contact", () => {
  const g = wave();
  g.fish[0].x = 0.18;
  g.fish[0].y = 0.5;
  g.fish[1].x = 0.19;
  g.fish[1].y = 0.51;
  g.fish[0].power = g.fish[1].power = 10;
  const predator = g.fish[2];
  predator.x = 0.8;
  predator.y = 0.8;
  g.nextHuntAt = g.elapsed + 8;
  g.elapsed += 7.99;
  g.tickPredation(0.01);
  assert.equal(g.bossRemaining, 3);
  g.elapsed += 0.02;
  const before = predator.x;
  g.tickPredation(0.01);
  assert.equal(g.bossRemaining, 3);
  assert.equal(g.predation.phase, "hunt");
  assert.ok(predator.x < before);
  const prey = g.predation.prey;
  const radius =
    bossEatRadius(predator, g.viewport.width, g.viewport.height) +
    fishSize(prey, g.viewport.width, g.viewport.height) * 0.3;
  let steps = 0;
  while (g.predation.phase === "hunt" && steps++ < 200) {
    g.elapsed += 0.05;
    g.tickPredation(0.05);
    const distance = Math.hypot(
      (predator.x - prey.x) * g.viewport.width,
      (predator.y - prey.y) * g.viewport.height,
    );
    if (g.bossRemaining === 3) assert.ok(distance > radius);
    else assert.ok(distance <= radius + 0.001);
  }
  assert.equal(g.bossRemaining, 2);
  assert.equal(g.predation.phase, "bite");
  assert.equal(g.predation.predator, predator);
});
test("radius uses circular pixel distances in portrait and landscape, not stretched normalized coordinates", () => {
  for (const [width, height] of [
    [320, 568],
    [844, 390],
  ]) {
    const g = wave();
    g.viewport = { width, height };
    const predator = g.fish[2],
      prey = g.fish[0];
    g.fish[1].power = predator.power;
    g.fish[1].x = 0.01;
    g.fish[1].y = 0.35;
    const reach =
      bossEatRadius(predator, width, height) +
      fishSize(prey, width, height) * 0.3;
    prey.x = predator.x;
    prey.y = predator.y + (reach + 1) / height;
    g.tickPredation(0.001);
    assert.equal(g.bossRemaining, 3);
    prey.y = predator.y + (reach - 1) / height;
    g.tickPredation(0.001);
    assert.equal(g.bossRemaining, 2);
  }
});
test("contact with a second victim bypasses the previous meal animation and counts both exactly once", () => {
  const g = wave();
  g.fish.forEach((f) => {
    f.x = 0.5;
    f.y = 0.65;
  });
  g.tickPredation(0.001);
  assert.equal(g.bossRemaining, 2);
  g.tickPredation(0.001);
  assert.equal(g.bossRemaining, 1);
  assert.equal(g.fish[0].growth, 4);
  g.tickPredation(0.001);
  assert.equal(g.bossRemaining, 1);
  assert.equal(
    g.drainEvents().filter((e) => e.type === "boss-eaten").length,
    2,
  );
});

test("hooking the chasing predator cancels the hunt, and a caught prey remains a moving chase target", () => {
  const g = wave();
  g.fish[0].x = 0.18;
  g.fish[0].y = 0.5;
  g.fish[1].x = 0.19;
  g.fish[1].y = 0.51;
  g.fish[0].power = g.fish[1].power = 10;
  const predator = g.fish[2];
  predator.x = 0.8;
  predator.y = 0.8;
  g.nextHuntAt = g.elapsed;
  g.tickPredation(0.05);
  assert.equal(g.predation.phase, "hunt");
  g.pause();
  const snap = JSON.stringify(g.predation);
  g.tick(0.05);
  assert.equal(JSON.stringify(g.predation), snap);
  g.resume();
  g.fish.splice(g.fish.indexOf(predator), 1);
  g.hook.catch = predator;
  g.beginFight(predator);
  g.tickPredation(0.05);
  assert.equal(g.predation, null);
  assert.equal(g.bossRemaining, 3);
  assert.equal(predator.growth, 1);
  // Releasing the predator and hooking its prey makes it track the actual hook.
  g.hook.catch = null;
  g.fight = null;
  g.fish.push(predator);
  const prey = g.fish.shift();
  g.hook.catch = prey;
  g.hook.x = 0.3;
  g.hook.y = 0.5;
  g.beginFight(prey);
  g.nextHuntAt = g.elapsed;
  const x = predator.x;
  g.tickPredation(0.05);
  assert.equal(g.predation.phase, "hunt");
  assert.ok(predator.x < x);
  assert.equal(g.hook.catch, prey);
});
