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
