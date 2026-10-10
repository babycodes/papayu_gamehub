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
  advance(game, 8);
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
  assert.equal(game.missions[0].value, 1);
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
  advance(game, 48.1);
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
  assert.equal(game.bossState, "done");
  assert.equal(game.bossCount, 1);
  assert.equal(game.score, 500);
  assert.ok(game.fish.length > 1);
  assert.equal(game.missions[2].value, 1);
  assert.ok(game.remaining > remaining - 8);
  assert.equal(
    game.drainEvents().filter((e) => e.type === "fight-stage").length,
    2,
  );
  advance(game, 10);
  assert.equal(game.bossState, "done");
});
test("buaya can leave safely and escaped fish never remove earned points", () => {
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
  assert.equal(game.bossState, "done");
  assert.ok(game.fish.length > 1);
  assert.equal(game.score, 80);
});
test("missions only complete once and replay clears all round challenges", () => {
  const game = new FishingGame();
  game.reset();
  for (let i = 0; i < 5; i++) game.reward({ ...LAYERS[2], layer: 2 });
  assert.equal(game.missions[0].value, 3);
  assert.equal(game.missions[1].value, 1);
  assert.equal(
    game.drainEvents().filter((e) => e.type === "mission").length,
    2,
  );
  game.reset("playing", "normal");
  assert.equal(game.difficulty, "normal");
  assert.equal(game.bossState, "waiting");
  assert.equal(game.fight, null);
  assert.equal(game.held, false);
  assert.ok(game.missions.every((m) => m.value === 0));
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
