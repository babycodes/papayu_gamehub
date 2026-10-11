import test from "node:test";
import assert from "node:assert/strict";
import { FishingMotion, mixColor, bossSea } from "../src/fishing-motion.js";
import { FISHING_BOSSES } from "../src/fishing-bosses.js";
const boss = FISHING_BOSSES[1];
const advance = (m, seconds) => {
  for (let i = 0; i < Math.ceil(seconds / 0.05); i++) m.update(0.05, true);
};
test("boss arrival, reaction and victory blend smoothly and return to a clear ocean", () => {
  const m = new FishingMotion();
  m.handle({ type: "boss-warning", boss });
  advance(m, 0.5);
  assert.ok(m.state.sea > 0 && m.state.sea < 1);
  m.handle({ type: "boss-arrived", boss });
  advance(m, 1);
  assert.equal(m.state.presence, 1);
  m.handle({ type: "fight-stage" });
  assert.equal(m.state.recoil, 1);
  advance(m, 0.6);
  assert.equal(m.state.recoil, 0);
  m.handle({ type: "fight-won", fish: boss });
  advance(m, 0.6);
  assert.equal(m.state.friendly, 1);
  m.handle({ type: "sea-return", caught: true, boss });
  assert.equal(m.state.celebration, 1);
  advance(m, 1.4);
  assert.equal(m.state.sea, 0);
  assert.equal(m.state.presence, 0);
  assert.equal(m.state.celebration, 0);
  assert.equal(m.group.getAll().length, 0);
});
test("paused animations freeze their clock, eye pose, limbs and sea transitions", () => {
  const m = new FishingMotion();
  m.handle({ type: "boss-warning", boss });
  advance(m, 0.3);
  const before = { ...m.state },
    pose = m.pose(boss, { stage: 2 }),
    time = m.time;
  for (let i = 0; i < 40; i++) m.update(0.05, false);
  assert.deepEqual(m.state, before);
  assert.deepEqual(m.pose(boss, { stage: 2 }), pose);
  assert.equal(m.time, time);
  advance(m, 0.3);
  assert.ok(m.state.sea > before.sea);
  assert.notEqual(m.pose(boss).limb, pose.limb);
});
test("replaced tween channels and reset do not leave background animations behind", () => {
  const m = new FishingMotion();
  for (let i = 0; i < 30; i++) {
    m.handle({ type: "fight-stage" });
    m.update(0.01, true);
  }
  assert.equal(m.group.getAll().length, 1);
  advance(m, 1);
  assert.equal(m.group.getAll().length, 0);
  assert.equal(m.channels.size, 0);
  m.handle({ type: "boss-warning", boss });
  m.reset();
  assert.equal(m.group.getAll().length, 0);
  assert.equal(m.boss, null);
  assert.equal(m.state.sea, 0);
});
test("reduced motion finishes transitions immediately and palettes blend within bounds", () => {
  const m = new FishingMotion(true);
  m.handle({ type: "boss-warning", boss });
  m.handle({ type: "boss-arrived", boss });
  assert.equal(m.state.sea, 1);
  assert.equal(m.state.presence, 1);
  assert.equal(m.group.getAll().length, 0);
  assert.equal(m.pose(boss).limb, 0);
  m.setReducedMotion(false);
  m.handle({ type: "sea-return", caught: true, boss });
  m.setReducedMotion(true);
  assert.equal(m.state.sea, 0);
  assert.equal(m.state.celebration, 0);
  assert.equal(m.group.getAll().length, 0);
  assert.equal(mixColor("#000000", "#ffffff", 0.5), "rgb(128, 128, 128)");
  assert.equal(mixColor("#000000", "#ffffff", 2), "rgb(255, 255, 255)");
  assert.notDeepEqual(bossSea(boss), bossSea(FISHING_BOSSES[0]));
  assert.notDeepEqual(bossSea(boss), bossSea(boss, true));
});

test("ordinary animals have distinct moving fins and tails that stop on pause and reduced motion", () => {
  const m = new FishingMotion();
  const fish = { kind: "fish", phase: 1.2 };
  const before = m.pose(fish);
  advance(m, 0.4);
  assert.notEqual(m.pose(fish).tail, before.tail);
  assert.notEqual(m.pose(fish).limb, before.limb);
  assert.notEqual(m.pose(fish).tail, m.pose({ ...fish, phase: 2.5 }).tail);
  const paused = m.pose(fish);
  m.update(0.05, false);
  assert.deepEqual(m.pose(fish), paused);
  m.setReducedMotion(true);
  const still = m.pose(fish);
  advance(m, 0.5);
  assert.deepEqual(m.pose(fish), still);
  assert.equal(still.tail, 0);
});

test("capturing one boss changes its expression without changing its companions or clearing their animations", () => {
  const m = new FishingMotion();
  const a = { ...FISHING_BOSSES[1], encounterId: "1:0" },
    b = { ...FISHING_BOSSES[4], encounterId: "1:1" };
  m.handle({ type: "boss-warning", boss: a, bosses: [a, b] });
  m.handle({ type: "boss-arrived", boss: a, bosses: [a, b] });
  advance(m, 1);
  m.handle({ type: "fight-won", fish: a });
  advance(m, 0.6);
  assert.equal(m.pose(a).friendly, 1);
  assert.equal(m.pose(b).friendly, 0);
  m.handle({ type: "boss-finished", fish: a, caught: true, remaining: 1 });
  assert.equal(m.actors.size, 1);
  assert.equal(m.pose(b).presence, 1);
  assert.ok(m.state.celebration > 0);
  assert.equal(m.boss, a);
  m.handle({ type: "sea-return", caught: true, boss: b });
  advance(m, 1.5);
  assert.equal(m.actors.size, 0);
  assert.equal(m.group.getAll().length, 0);
  m.reset();
  assert.equal(m.actors.size, 0);
});

test("hundreds of rapid waves keep at most three actor states and bounded tween channels", () => {
  const m = new FishingMotion();
  for (let wave = 0; wave < 300; wave++) {
    const bosses = [0, 1, 2].map((slot) => ({
      ...FISHING_BOSSES[slot],
      encounterId: `${wave}:${slot}`,
    }));
    m.handle({ type: "boss-warning", boss: bosses[0], bosses });
    m.handle({ type: "boss-arrived", boss: bosses[0], bosses });
    m.handle({ type: "fight-won", fish: bosses[0] });
    m.update(0.05, true);
    assert.equal(m.actors.size, 3);
    assert.ok(m.group.getAll().length <= 8);
    assert.ok(m.channels.size <= 8);
  }
  m.reset();
  assert.equal(m.actors.size, 0);
  assert.equal(m.channels.size, 0);
  assert.equal(m.group.getAll().length, 0);
});

test("a fleeing boss animates independently, freezes on pause and releases its tween", () => {
  const m = new FishingMotion();
  const fish = { ...boss, encounterId: "escape:0", failures: 3 };
  m.handle({ type: "boss-failed", fish, fled: true });
  assert.equal(m.state.escape, 1);
  advance(m, 0.2);
  const state = m.state.escape;
  assert.ok(state > 0 && state < 1);
  m.update(0.05, false);
  assert.equal(m.state.escape, state);
  assert.equal(m.escapedBoss.encounterId, fish.encounterId);
  advance(m, 1);
  assert.equal(m.state.escape, 0);
  assert.equal(m.channels.size, 0);
  assert.equal(m.group.getAll().length, 0);
  m.handle({ type: "boss-failed", fish, fled: true });
  m.setReducedMotion(true);
  assert.equal(m.state.escape, 0);
  m.reset();
  assert.equal(m.escapedBoss, null);
});
