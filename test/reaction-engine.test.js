import test from "node:test";
import assert from "node:assert/strict";
import { ReactionRace } from "../src/reaction-engine.js";
test("reaction early taps award the opponent once and ignore repeated taps", () => {
  const g = new ReactionRace({ bot: false, random: () => 0 });
  assert.ok(g.press(0));
  assert.deepEqual(g.scores, [0, 1]);
  assert.equal(g.result.reason, "early");
  assert.equal(g.press(0), false);
  g.tick(1.3);
  assert.equal(g.round, 2);
  assert.equal(g.phase, "wait");
});
test("reaction compares actual response times, handles ties and missing responses", () => {
  const g = new ReactionRace({ bot: false, random: () => 0 });
  g.tick(1.5);
  assert.equal(g.phase, "go");
  g.tick(0.12);
  g.press(0);
  g.tick(0.1);
  g.press(1);
  assert.equal(g.result.winner, 0);
  assert.deepEqual(g.result.responses, [120, 220]);
  const tie = new ReactionRace({ bot: false, random: () => 0 });
  tie.tick(1.5);
  tie.press(0);
  tie.press(1);
  assert.equal(tie.result.winner, "draw");
  const none = new ReactionRace({ bot: false, random: () => 0 });
  none.tick(1.5);
  none.tick(3);
  assert.equal(none.result.winner, "draw");
});
test("reaction runs the selected number of rounds and bot only taps after green", () => {
  const g = new ReactionRace({ rounds: 3, random: () => 0 });
  for (let i = 0; i < 3; i++) {
    g.tick(1.5);
    g.tick(0.5);
    assert.equal(g.responses[1], 500);
    g.tick(1);
    g.tick(1.3);
  }
  assert.equal(g.winner, 1);
  assert.deepEqual(g.scores, [0, 3]);
  assert.equal(g.log.length, 3);
  assert.equal(g.press(0), false);
});
