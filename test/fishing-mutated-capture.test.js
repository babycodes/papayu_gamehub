import test from "node:test";
import assert from "node:assert/strict";
import { FishingGame } from "../src/engine.js";
import { FISHING_BOSSES, bossCaptureProfile } from "../src/fishing-bosses.js";
function fight(difficulty, growth) {
  const g = new FishingGame(() => 0.5);
  g.reset();
  g.difficulty = difficulty;
  const fish = {
    ...FISHING_BOSSES[0],
    growth,
    tier: 5,
    phase: 0,
    x: 0.5,
    y: 0.65,
    failures: 0,
  };
  g.hook.catch = fish;
  g.hook.y = 0.65;
  g.beginFight(fish);
  return g;
}
test("mutation narrows aiming and timing, increases effort and grants extra time with bounded levels", () => {
  for (const mode of ["easy", "normal"]) {
    const normal = bossCaptureProfile(FISHING_BOSSES[0], mode),
      once = bossCaptureProfile({ ...FISHING_BOSSES[0], growth: 2 }, mode),
      twice = bossCaptureProfile({ ...FISHING_BOSSES[0], growth: 4 }, mode);
    assert.ok(
      twice.tolerance < once.tolerance && once.tolerance < normal.tolerance,
    );
    assert.ok(
      twice.greenThreshold > once.greenThreshold &&
        once.greenThreshold > normal.greenThreshold,
    );
    assert.ok(twice.effort > once.effort);
    assert.ok(
      twice.stageSeconds.every((v, i) => v === normal.stageSeconds[i] + 4),
    );
    assert.deepEqual(
      bossCaptureProfile({ ...FISHING_BOSSES[0], growth: 1024 }, mode),
      twice,
    );
  }
});
test("both mutation levels remain catchable in both modes using aim, hold and release on the warning", () => {
  for (const mode of ["easy", "normal"])
    for (const growth of [2, 4]) {
      const g = fight(mode, growth),
        stages = new Set();
      let ticks = 0;
      while (g.fight && ticks++ < 1000) {
        const f = g.fight;
        stages.add(f.stage);
        g.hook.x = f.target;
        g.held = !f.straining;
        g.tickFight(0.05);
      }
      assert.equal(g.fight, null, `${mode} ${growth}x`);
      assert.ok(g.hook.catch, `${mode} ${growth}x escaped`);
      assert.equal(stages.size, 3);
      assert.equal(
        g.drainEvents().filter((e) => e.type === "fight-won").length,
        1,
      );
      assert.equal(g.hook.catch.failures, 0);
    }
});
test("holding through rebellion sets back progress without instantly failing, and release relieves tension", () => {
  const g = fight("easy", 4);
  Object.assign(g.fight, {
    type: "hold",
    stage: 1,
    elapsed: 1.35,
    tension: 0.9,
    progress: 0.5,
  });
  g.held = true;
  g.tickFight(0.1);
  assert.ok(g.fight.progress < 0.5);
  assert.equal(g.hook.catch.failures, 0);
  assert.equal(
    g.drainEvents().filter((e) => e.type === "line-strain").length,
    1,
  );
  const tension = g.fight.tension,
    progress = g.fight.progress;
  g.held = false;
  g.tickFight(0.1);
  assert.ok(g.fight.tension < tension);
  assert.equal(g.fight.progress, progress);
  g.pause();
  const snapshot = JSON.stringify([g.fight, g.hook]);
  g.tick(0.05);
  assert.equal(JSON.stringify([g.fight, g.hook]), snapshot);
});
test("unmutated bosses retain the original hold mechanic without release warnings", () => {
  const g = fight("easy", 1);
  Object.assign(g.fight, { type: "hold", stage: 1, elapsed: 1.3 });
  g.held = true;
  g.tickFight(0.1);
  assert.equal(g.fight.straining, false);
  assert.equal(g.fight.tension, 0);
  assert.ok(g.fight.progress > 0);
});
