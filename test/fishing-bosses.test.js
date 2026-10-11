import test from "node:test";
import assert from "node:assert/strict";
import {
  createBossWave,
  nextBossThreshold,
  bossWaveSize,
} from "../src/fishing-bosses.js";

test("boss interval and wave size follow the agreed score boundaries", () => {
  assert.equal(nextBossThreshold(18000), 20000);
  assert.equal(nextBossThreshold(20000), 22000);
  assert.equal(nextBossThreshold(22000), 27000);
  assert.equal(nextBossThreshold(97000), 102000);
  assert.equal(nextBossThreshold(1000000), 1005000);
  assert.deepEqual(
    [19999, 20000, 39999, 40000, 100000, 10000000].map(bossWaveSize),
    [1, 2, 2, 3, 3, 3],
  );
});
test("procedural encounters vary their silhouettes and keep only bounded state at very high scores", () => {
  let previous = [];
  let tierZero = createBossWave(2000, 0, () => 0.5)[0];
  for (let i = 0; i < 1000; i++) {
    const wave = createBossWave(22000 + i * 5000, i + 10, () => 0.5, previous);
    assert.equal(wave.length, bossWaveSize(22000 + i * 5000));
    assert.equal(new Set(wave.map((b) => b.kind)).size, wave.length);
    assert.ok(wave.every((b) => !previous.includes(b.kind)));
    assert.ok(wave.every((b) => b.tier <= 5 && b.size <= 218 && b.fierce));
    assert.ok(wave[0].size > tierZero.size);
    assert.ok(wave.every((b) => /^#[0-9a-f]{6}$/i.test(b.color)));
    previous = wave.map((b) => b.kind);
  }
});
test("random seeds affect appearances while early buaya and gurita remain recognizable", () => {
  assert.equal(createBossWave(2000, 0, () => 0)[0].kind, "crocodile");
  assert.equal(createBossWave(4000, 1, () => 1)[0].kind, "octopus");
  assert.notDeepEqual(
    createBossWave(22000, 10, () => 0.1),
    createBossWave(22000, 10, () => 0.9),
  );
  assert.equal(createBossWave(102000, 30, () => 0.5)[0].tier, 5);
  assert.equal(createBossWave(100000000, 30000, () => 0.5)[0].tier, 5);
});
