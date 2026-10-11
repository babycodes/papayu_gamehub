import {
  FISHING_BOSSES,
  FRENZY_DURATION,
  STAR_DURATION,
  BOSS_CAPTURE,
} from "../src/fishing-bosses.js";
import test from "node:test";
import assert from "node:assert/strict";
import { FishingGame, LAYERS, fishSize } from "../src/engine.js";
const advance = (game, seconds) => {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) game.tick(0.05);
};
function catchFish(game, layer = 0, bonus = false) {
  game.fish = [
    {
      name: "Test fish",
      points: 10,
      size: 18,
      layer,
      bonus,
      x: 0.47,
      y: 0.38,
      direction: 1,
      speed: 0,
      expires: Infinity,
    },
  ];
  game.press();
  for (let i = 0; i < 200; i++) {
    if (game.fight) game.aim(game.fight.target);
    game.tick(0.05);
    if (game.hook.state === "idle") break;
  }
  return game.drainEvents();
}
test("a round starts with five depths and 90 seconds", () => {
  const game = new FishingGame();
  assert.equal(game.mode, "ready");
  assert.equal(game.remaining, 90);
  assert.equal(new Set(game.fish.map((f) => f.layer)).size, 5);
  advance(game, 2);
  assert.equal(game.remaining, 90);
});
test("catching and reeling delivers points, then increases combo", () => {
  const game = new FishingGame();
  game.reset();
  assert.ok(catchFish(game).some((e) => e.type === "catch"));
  assert.equal(game.score, 10);
  assert.equal(game.count, 1);
  catchFish(game);
  assert.equal(game.score, 30);
  assert.equal(game.combo, 2);
  assert.equal(game.hook.state, "idle");
  advance(game, 9);
  assert.equal(game.combo, 1);
});
test("bonus grants time without awarding fish points", () => {
  const game = new FishingGame();
  game.reset();
  const events = catchFish(game, 2, true);
  assert.ok(events.some((e) => e.type === "bonus"));
  assert.ok(game.remaining > 100);
  assert.equal(game.score, 0);
  assert.equal(game.count, 0);
});
test("frenzy doubles score and creates its exclusive species", () => {
  const game = new FishingGame();
  game.reset();
  advance(game, 25.1);
  assert.equal(game.frenzy, true);
  assert.ok(game.fish.some((f) => f.special));
  catchFish(game);
  assert.equal(game.score, 20);
  advance(game, 15);
  assert.equal(game.frenzy, false);
});
test("pause freezes time and release reels an empty hook", () => {
  const game = new FishingGame();
  game.reset();
  game.fish = [];
  game.press();
  advance(game, 0.5);
  game.release();
  assert.equal(game.hook.state, "reeling");
  const remaining = game.remaining;
  game.pause();
  advance(game, 10);
  assert.equal(game.remaining, remaining);
  game.resume();
  advance(game, 1);
  assert.equal(game.hook.state, "idle");
});
test("time expiry ends the round and replay resets progress", () => {
  const game = new FishingGame();
  game.reset();
  game.score = 300;
  advance(game, 91);
  assert.equal(game.mode, "ended");
  assert.equal(game.remaining, 0);
  game.press();
  assert.equal(game.hook.state, "idle");
  game.reset();
  assert.equal(game.score, 0);
  assert.equal(game.count, 0);
  assert.equal(game.remaining, 90);
});

function fightFish(game, layer, boss = false) {
  const fish = {
    ...LAYERS[layer],
    boss,
    id: 100,
    x: 0.47,
    y: 0.6,
    direction: 1,
    speed: 0,
    expires: Infinity,
    phase: 0,
  };
  game.hook.catch = fish;
  game.hook.y = 0.6;
  game.beginFight(fish);
  return fish;
}
function winFight(game) {
  for (let i = 0; i < 600 && game.fight; i++) {
    game.aim(game.fight.target);
    game.press();
    game.tick(0.05);
  }
}
test("deep fish are larger, giant moments enlarge ordinary fish, and phone sizes stay bounded", () => {
  assert.deepEqual(
    LAYERS.slice(2).map((f) => f.kind),
    ["puffer", "shark", "whale"],
  );
  assert.ok(LAYERS[4].size > LAYERS[0].size * 3);
  for (const [w, h] of [
    [320, 350],
    [390, 600],
    [844, 220],
  ])
    for (const fish of LAYERS) {
      assert.ok(fishSize(fish, w, h, true) > fishSize(fish, w, h));
      assert.ok(fishSize(fish, w, h, true) <= w * 0.23);
    }
});
test("large fish use visible hit areas and require a fight before scoring", () => {
  const game = new FishingGame(() => 0.5);
  game.reset();
  game.viewport = { width: 390, height: 600 };
  game.fish = [
    {
      ...LAYERS[3],
      x: 0.57,
      y: 0.5,
      phase: 0,
      direction: 1,
      speed: 0,
      expires: Infinity,
      layer: 3,
    },
  ];
  game.hook.y = 0.5;
  game.press(0.47);
  game.tick(0.05);
  assert.equal(game.hook.state, "fighting");
  assert.equal(game.fight.type, "follow");
  assert.equal(game.score, 0);
  winFight(game);
  assert.equal(game.hook.state, "reeling");
  advance(game, 1);
  assert.equal(game.score, 100);
});
test("whale hold and puffer green timing require input and release stops progress", () => {
  for (const layer of [2, 4]) {
    const game = new FishingGame();
    game.reset();
    fightFish(game, layer);
    advance(game, 1);
    assert.equal(game.fight.progress, 0);
    game.press();
    advance(game, 1);
    const progress = game.fight.progress;
    game.release();
    advance(game, 0.4);
    assert.equal(game.fight.progress, progress);
    winFight(game);
    advance(game, 1);
    assert.equal(game.count, 1);
    assert.equal(game.score, LAYERS[layer].points);
  }
});
test("pausing a fight freezes its progress, timer and stage without holding on resume", () => {
  const game = new FishingGame();
  game.reset();
  fightFish(game, 4);
  game.press();
  advance(game, 0.5);
  game.pause();
  const snapshot = [
    game.remaining,
    game.fight.progress,
    game.fight.remaining,
    game.hook.y,
  ];
  advance(game, 10);
  assert.deepEqual(
    [game.remaining, game.fight.progress, game.fight.remaining, game.hook.y],
    snapshot,
  );
  game.resume();
  assert.equal(game.held, false);
  advance(game, 0.5);
  assert.equal(game.fight.progress, snapshot[1]);
});
test("buaya clears the ocean once, has three stages, then restores fish and rewards time", () => {
  const game = new FishingGame(() => 0.5);
  game.reset();
  game.score = 2000;
  game.tick(0.05);
  assert.equal(game.bossState, "warning");
  assert.equal(game.fish.length, 0);
  assert.ok(game.hiddenFish.length > 0);
  advance(game, 2);
  assert.equal(game.bossState, "active");
  assert.equal(game.fish.length, 1);
  assert.equal(game.fish[0].kind, "crocodile");
  game.hook.catch = game.fish.pop();
  game.hook.y = 0.64;
  game.beginFight(game.hook.catch);
  const remaining = game.remaining;
  winFight(game);
  assert.equal(game.hook.state, "reeling");
  advance(game, 1.2);
  assert.equal(game.bossState, "waiting");
  assert.equal(game.bossCount, 1);
  assert.equal(game.score, 2500);
  assert.ok(game.fish.length > 1);
  assert.ok(game.remaining > remaining - 8);
  assert.equal(
    game.drainEvents().filter((e) => e.type === "fight-stage").length,
    2,
  );
  advance(game, 10);
  assert.equal(game.bossState, "waiting");
});
test("idle bosses wait for attempts and escaped ordinary fish never remove earned points", () => {
  const game = new FishingGame();
  game.reset();
  game.score = 80;
  fightFish(game, 3);
  advance(game, 17);
  assert.equal(game.score, 80);
  assert.equal(game.fight, null);
  assert.equal(game.hook.catch, null);
  assert.ok(game.drainEvents().some((e) => e.type === "escaped"));
  game.hook.state = "idle";
  game.beginBoss();
  advance(game, 33);
  assert.equal(game.bossState, "active");
  assert.equal(game.fish.length, 1);
  assert.equal(game.score, 80);
});
test("replay clears challenges and independent bonus clocks", () => {
  const game = new FishingGame();
  game.reset();
  advance(game, 25.1);
  assert.ok(game.frenzyRemaining > 0 && game.starRemaining > 0);
  game.reset("playing", "normal");
  assert.equal(game.difficulty, "normal");
  assert.equal(game.bossState, "waiting");
  assert.equal(game.fight, null);
  assert.equal(game.held, false);
  assert.equal(game.frenzyRemaining, 0);
  assert.equal(game.starRemaining, 0);
});
test("timer ending during a fight drops the pending catch without points or future input", () => {
  const game = new FishingGame();
  game.reset();
  fightFish(game, 4);
  game.remaining = 0.02;
  game.tick(0.05);
  assert.equal(game.mode, "ended");
  assert.equal(game.fight, null);
  assert.equal(game.hook.catch, null);
  assert.equal(game.score, 0);
  game.press();
  assert.equal(game.held, false);
});

test("bosses trigger at score thresholds, never from elapsed time, and wait for a hooked fish", () => {
  const g = new FishingGame();
  g.reset();
  advance(g, 60);
  assert.equal(g.bossState, "waiting");
  assert.equal(g.bossIndex, 0);
  g.score = 1999;
  g.tick(0.05);
  assert.equal(g.bossIndex, 0);
  g.score = 2000;
  g.hook.catch = { special: false };
  g.tick(0.05);
  assert.equal(g.bossIndex, 0);
  g.hook.catch = null;
  g.remaining = 0.01;
  g.tick(0.05);
  assert.equal(g.currentBoss.id, "crocodile");
  assert.equal(g.bossIndex, 1);
  assert.equal(g.nextBossScore, 4000);
  assert.equal(g.mode, "playing");
  const remaining = g.remaining;
  advance(g, 2.5);
  assert.equal(g.remaining, remaining);
  g.returnFish(false);
  g.remaining = 30;
  g.score = 3999;
  g.tick(0.05);
  assert.equal(g.bossIndex, 1);
  g.remaining = 30;
  g.score = 4000;
  g.tick(0.05);
  assert.equal(g.currentBoss.id, "octopus");
  assert.equal(g.bossIndex, 2);
});
test("first ten encounters keep their order, then bosses continue beyond 40k and 100k without skipping thresholds", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  for (let i = 0; i < 50; i++) {
    const threshold = g.nextBossScore;
    g.score = threshold;
    g.tick(0.05);
    assert.equal(g.bossState, "warning");
    if (i < 10) assert.equal(g.currentBoss.id, FISHING_BOSSES[i].id);
    assert.equal(g.currentBoss.threshold, threshold);
    assert.equal(
      g.nextBossScore,
      threshold < 22000 ? threshold + 2000 : threshold + 5000,
    );
    advance(g, 2.1);
    assert.equal(
      g.bossRemaining,
      threshold >= 40000 ? 3 : threshold >= 20000 ? 2 : 1,
    );
    assert.equal(g.fish.length, g.bossRemaining);
    assert.equal(
      new Set(g.fish.map((f) => f.encounterId)).size,
      g.bossRemaining,
    );
    g.returnFish(false);
    assert.equal(g.bossState, "waiting");
  }
  assert.ok(g.nextBossScore > 200000);
  assert.equal(g.bossIndex, 50);
  g.reset();
  assert.equal(g.bossIndex, 0);
  assert.equal(g.nextBossScore, 2000);
  assert.equal(g.bossWave.length, 0);
  assert.equal(g.finishedBossIds.size, 0);
});
test("fish frenzy lasts five seconds while star bonus lasts fifteen and the star stays available", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  advance(g, 25.1);
  assert.ok(g.frenzyRemaining > 4.8);
  assert.ok(g.starRemaining > 14.8);
  assert.equal(FRENZY_DURATION, 5);
  assert.equal(STAR_DURATION, 15);
  const star = g.fish.find((f) => f.special);
  g.fish = [star];
  star.x = 0.83;
  star.speed = 0.4;
  advance(g, 5.1);
  assert.equal(g.frenzy, false);
  assert.ok(g.starRemaining > 9 && g.starRemaining < 10);
  advance(g, 10);
  assert.equal(g.starRemaining, 0);
  assert.equal(g.fish.filter((f) => f.special).length, 1);
  assert.ok(star.x >= 0.16 && star.x <= 0.84);
  assert.equal(star.giant, true);
  assert.ok(
    fishSize(star, 390, 600, false) >
      fishSize({ ...star, giant: false }, 390, 600, false),
  );
  advance(g, 10);
  assert.equal(g.fish.filter((f) => f.special).length, 1);
  const starTime = g.starRemaining;
  g.hook.catch = star;
  g.fish = g.fish.filter((f) => f !== star);
  g.beginFight(star);
  const remaining = g.remaining;
  advance(g, 1);
  assert.equal(g.starRemaining, starTime);
  assert.equal(g.remaining, remaining);
  advance(g, 17);
  assert.ok(g.fish.includes(star));
  assert.equal(g.fight, null);
  assert.equal(g.score, 0);
});
test("a star takes priority over overlapping large fish and boss rewards cannot multiply into a chain", () => {
  const g = new FishingGame();
  g.reset();
  const whale = {
    ...LAYERS[4],
    layer: 4,
    x: 0.47,
    y: 0.5,
    speed: 0,
    direction: 1,
    expires: Infinity,
  };
  const star = {
    ...whale,
    kind: "star",
    special: true,
    giant: true,
    points: 200,
  };
  g.fish = [whale, star];
  g.hook.y = 0.5;
  g.press();
  g.tick(0.05);
  assert.equal(g.hook.catch, star);
  g.fight = null;
  g.hook.catch = null;
  g.score = 2000;
  g.combo = 4;
  g.lastCatchAt = g.elapsed;
  g.beginBoss();
  advance(g, 2.1);
  g.combo = 4;
  g.lastCatchAt = g.elapsed;
  g.reward(g.fish[0]);
  assert.equal(g.score, 2500);
  g.tick(0.05);
  assert.equal(g.bossIndex, 1);
});

test("small fish reel automatically during frenzy and return to normal size after five seconds", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  advance(g, 25.1);
  const small = {
    ...LAYERS[0],
    layer: 0,
    x: 0.47,
    y: 0.4,
    direction: 1,
    speed: 0,
    expires: Infinity,
  };
  g.fish = [small];
  g.hook.y = 0.4;
  g.press();
  g.tick(0.05);
  g.release();
  assert.equal(g.hook.state, "reeling");
  assert.equal(g.fight, null);
  assert.equal(small.giant, undefined);
  advance(g, 1);
  assert.equal(g.score, 20);
  const largeSize = fishSize(small, 390, 600, g.frenzy);
  advance(g, 4);
  assert.equal(g.frenzy, false);
  assert.ok(fishSize(small, 390, 600, g.frenzy) < largeSize);
  assert.ok(g.starRemaining > 9);
});
test("star bonus awards double after fish frenzy ends and both clocks freeze for pause or boss", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  advance(g, 30.2);
  const star = g.fish.find((f) => f.special);
  assert.equal(g.frenzy, false);
  assert.ok(g.starRemaining > 9);
  g.pause();
  const clocks = [g.frenzyRemaining, g.starRemaining];
  advance(g, 2);
  assert.deepEqual([g.frenzyRemaining, g.starRemaining], clocks);
  g.resume();
  g.score = 2000;
  g.tick(0.05);
  advance(g, 2.2);
  assert.deepEqual([g.frenzyRemaining, g.starRemaining], clocks);
  g.returnFish(false);
  g.reward(star);
  const event = g
    .drainEvents()
    .find((e) => e.type === "catch" && e.fish === star);
  assert.equal(event.points, 400);
});

test("a multi-boss wave restores fish only after the last boss, with rewards counted once per boss", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.nextBossScore = 42000;
  g.bossIndex = 14;
  g.score = 42000;
  const original = g.fish.slice();
  g.tick(0.05);
  advance(g, 2.1);
  const bosses = g.fish.slice(),
    time = g.remaining;
  assert.equal(bosses.length, 3);
  g.reward(bosses[0]);
  assert.equal(g.bossState, "active");
  assert.equal(g.bossRemaining, 2);
  assert.equal(g.fish.length, 2);
  assert.equal(g.bossCount, 1);
  const score = g.score;
  g.reward(bosses[0]);
  assert.equal(g.score, score);
  assert.equal(g.bossRemaining, 2);
  g.reward(bosses[1]);
  assert.equal(g.bossRemaining, 1);
  advance(g, 1);
  assert.equal(g.remaining, time + 16);
  g.reward(bosses[2]);
  assert.equal(g.bossRemaining, 0);
  assert.equal(g.bossState, "waiting");
  assert.equal(g.bossCount, 3);
  assert.equal(g.remaining, time + 24);
  assert.deepEqual(
    g.fish,
    original.filter((f) => !f.bonus),
  );
  assert.equal(
    g.drainEvents().filter((e) => e.type === "sea-return").length,
    1,
  );
});
test("an escaped boss leaves its companions and allows the next one a full capture window", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.nextBossScore = 22000;
  g.score = 22000;
  g.tick(0.05);
  advance(g, 2.1);
  const escaped = g.fish[0],
    remaining = g.remaining;
  for (let attempt = 0; attempt < 3; attempt++) {
    g.fish.splice(g.fish.indexOf(escaped), 1);
    g.hook.catch = escaped;
    g.hook.y = 0.65;
    g.beginFight(escaped);
    advance(g, 10.1);
    assert.equal(escaped.failures, attempt + 1);
  }
  assert.equal(g.fight, null);
  assert.equal(g.bossState, "active");
  assert.equal(g.bossRemaining, 1);
  assert.equal(g.bossCount, 0);
  assert.equal(g.score, 22000);
  assert.equal(g.remaining, remaining - 9);
  const companion = g.fish[0];
  g.reward(companion);
  assert.equal(g.bossState, "waiting");
  assert.equal(g.bossCount, 1);
  assert.equal(
    g
      .drainEvents()
      .filter((e) => e.type === "sea-return")
      .at(-1).caught,
    false,
  );
});
test("three bosses stay inside portrait and landscape canvases and pause freezes the whole wave", () => {
  for (const viewport of [
    { width: 320, height: 375 },
    { width: 844, height: 230 },
  ]) {
    const g = new FishingGame(() => 0.5);
    g.reset();
    g.viewport = viewport;
    g.nextBossScore = 102000;
    g.score = 102000;
    g.tick(0.05);
    advance(g, 2.1);
    advance(g, 4);
    if (viewport.width / viewport.height > 1.6)
      assert.ok(g.fish[2].x - g.fish[0].x > 0.5);
    for (const b of g.fish) {
      const s = fishSize(b, viewport.width, viewport.height);
      assert.ok(b.x * viewport.width >= s * 1.3 - 1);
      assert.ok((1 - b.x) * viewport.width >= s * 1.3 - 1);
      assert.ok(b.y * viewport.height + s * 0.9 < viewport.height);
    }
    g.pause();
    const snapshot = JSON.stringify([g.bossClock, g.fish, g.remaining]);
    advance(g, 5);
    assert.equal(JSON.stringify([g.bossClock, g.fish, g.remaining]), snapshot);
  }
});

test("each boss stage gets its own fresh deadline, and a timed-out stage resets the attempt", () => {
  for (const mode of ["easy", "normal"]) {
    const g = new FishingGame(() => 0.5);
    g.reset("playing", mode);
    g.score = 2000;
    g.tick(0.05);
    advance(g, 2.1);
    const boss = g.fish.shift();
    g.hook.catch = boss;
    g.hook.y = 0.6;
    g.beginFight(boss);
    for (let stage = 0; stage < 2; stage++) {
      assert.equal(g.fight.remaining, BOSS_CAPTURE[mode].stageSeconds[stage]);
      g.fight.progress = 0.999;
      g.held = true;
      g.aim(g.fight.target);
      g.tick(0.05);
    }
    assert.equal(g.fight.stage, 2);
    assert.equal(g.fight.remaining, BOSS_CAPTURE[mode].stageSeconds[2]);
    g.release();
    const remaining = g.remaining;
    advance(g, BOSS_CAPTURE[mode].stageSeconds[2] + 0.1);
    assert.equal(boss.failures, 1);
    assert.ok(g.fish.includes(boss));
    assert.equal(g.score, 2000);
    assert.equal(g.remaining, remaining - BOSS_CAPTURE[mode].failurePenalty);
    g.fish.splice(g.fish.indexOf(boss), 1);
    g.hook.catch = boss;
    g.beginFight(boss);
    assert.equal(g.fight.stage, 0);
    assert.equal(g.fight.remaining, BOSS_CAPTURE[mode].stageSeconds[0]);
  }
});
test("boss failures are individual and a successful retry gives reward once", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.nextBossScore = 22000;
  g.score = 22000;
  g.tick(0.05);
  advance(g, 2.1);
  const [a, b] = g.fish;
  g.fish.splice(g.fish.indexOf(a), 1);
  g.hook.catch = a;
  g.beginFight(a);
  advance(g, 10.1);
  assert.equal(a.failures, 1);
  assert.equal(b.failures, 0);
  assert.equal(g.bossRemaining, 2);
  g.fish.splice(g.fish.indexOf(a), 1);
  g.hook.catch = a;
  g.hook.y = 0.6;
  g.beginFight(a);
  winFight(g);
  advance(g, 1.2);
  assert.equal(g.bossCount, 1);
  assert.equal(g.bossRemaining, 1);
  assert.equal(b.failures, 0);
});
test("a failure can exhaust round time immediately and a pause freezes deadline and rebellion", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.score = 2000;
  g.tick(0.05);
  advance(g, 2.1);
  const boss = g.fish.shift();
  g.hook.catch = boss;
  g.hook.y = 0.6;
  g.beginFight(boss);
  advance(g, 0.3);
  g.pause();
  const snapshot = JSON.stringify([g.fight, g.hook, g.remaining]);
  advance(g, 20);
  assert.equal(JSON.stringify([g.fight, g.hook, g.remaining]), snapshot);
  g.resume();
  g.remaining = 2;
  advance(g, 10);
  assert.equal(g.mode, "ended");
  assert.equal(g.remaining, 0);
  assert.equal(g.score, 2000);
  assert.equal(g.hook.catch, null);
  assert.equal(g.fight, null);
  assert.equal(g.bossCount, 0);
  assert.equal(g.drainEvents().filter((e) => e.type === "end").length, 1);
});
test("boss patrol changes both axes and heading while keeping its full body in view", () => {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.score = 2000;
  g.tick(0.05);
  advance(g, 2.1);
  const boss = g.fish[0],
    positions = [];
  for (let i = 0; i < 160; i++) {
    g.tick(0.05);
    positions.push([boss.x, boss.y, boss.heading]);
  }
  for (let axis = 0; axis < 3; axis++)
    assert.ok(
      Math.max(...positions.map((p) => p[axis])) -
        Math.min(...positions.map((p) => p[axis])) >
        (axis === 1 ? 0.07 : 0.1),
    );
});
