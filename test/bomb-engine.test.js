import test from "node:test";
import assert from "node:assert/strict";
import { BomBom, BOMB_CELLS, MAX_BOMBS } from "../src/bomb-engine.js";

function localReady(firstPlayer = 0) {
  const g = new BomBom({ firstPlayer });
  for (let p = 0; p < 2; p++) {
    assert.equal(g.phase, "handover");
    g.acknowledge();
    for (const i of [0, 1, 2, 3, 4]) assert.ok(g.toggle(i));
    g.toggle(21);
    assert.ok(g.confirm());
  }
  assert.equal(g.phase, "attack");
  return g;
}
test("bomb placement requires five distinct valid cells and can be corrected", () => {
  const g = new BomBom({ bot: true, random: () => 0 });
  for (const invalid of [-1, 24, 1.5, NaN, "1", null])
    assert.equal(g.toggle(invalid), false);
  assert.equal(g.confirm(), false);
  for (const i of [0, 5, 15, 20, 23]) assert.ok(g.toggle(i));
  assert.equal(g.toggle(9), true);
  assert.equal(g.toggle(10), false);
  assert.ok(g.toggle(9));
  assert.ok(g.toggle(5));
  assert.equal(g.confirm(), false);
  assert.ok(g.toggle(9));
  assert.equal(g.confirm(), false);
  assert.ok(g.toggle(21));
  assert.ok(g.confirm());
  assert.deepEqual([...g.bombs[0]], [0, 15, 20, 23, 9]);
  assert.equal(g.bombs[1].size, 5);
  assert.deepEqual([...g.bombs[1]], [0, 1, 2, 3, 4]);
  assert.equal(g.toggle(4), false);
  assert.equal(g.confirm(), false);
});
test("only placement needs handover; attacks switch directly and reject the inactive player", () => {
  const g = new BomBom();
  assert.equal(g.toggle(0), false);
  assert.equal(g.open(0), false);
  g.acknowledge();
  [0, 1, 2, 3, 4].forEach((i) => g.toggle(i));
  g.toggle(21);
  g.confirm();
  assert.equal(g.turn, 1);
  assert.equal(g.phase, "handover");
  assert.equal(g.toggle(3), false);
  assert.equal(g.open(3), false);
  g.acknowledge();
  [5, 6, 7, 8, 9].forEach((i) => g.toggle(i));
  g.toggle(21);
  g.confirm();
  assert.equal(g.turn, 0);
  assert.equal(g.phase, "attack");
  assert.ok(g.open(10, 0));
  assert.deepEqual(g.scores, [1, 0]);
  assert.deepEqual(g.hits, [0, 0]);
  assert.equal(g.turn, 1);
  assert.equal(g.phase, "attack");
  assert.equal(g.open(11, 0), false);
  assert.equal(g.acknowledge(), false);
  assert.ok(g.open(0, 1));
  assert.deepEqual(g.hits, [0, 1]);
  assert.deepEqual(g.scores, [1, 0]);
  assert.equal(g.turn, 0);
  assert.equal(g.open(11, 1), false);
  assert.deepEqual(g.results, [
    { player: 0, target: 1, index: 10, hit: false },
    { player: 1, target: 0, index: 0, hit: true },
  ]);
});
test("fifth bomb loses immediately with no bonus points or extra moves", () => {
  const g = localReady();
  for (let i = 0; i < 5; i++) {
    assert.ok(g.open(i));
    if (i < 4) {
      assert.ok(g.open(8 + i));
    }
  }
  assert.equal(g.winner, 1);
  assert.deepEqual(g.hits, [5, 0]);
  assert.deepEqual(g.scores, [0, 4]);
  assert.equal(g.phase, "ending");
  assert.equal(g.open(12), false);
  assert.equal(g.acknowledge(), false);
});
test("opened cells cannot award points twice, and replay starts fresh with alternate starter", () => {
  const g = localReady(1);
  assert.equal(g.turn, 1);
  g.open(5);
  g.open(6);
  assert.equal(g.open(5), false);
  assert.deepEqual(g.scores, [1, 1]);
  const next = new BomBom({ firstPlayer: 0 });
  assert.equal(next.turn, 0);
  assert.deepEqual(next.hits, [0, 0]);
  assert.deepEqual(next.scores, [0, 0]);
  assert.ok(next.bombs.every((b) => b.size === 0));
});
test("bot choices ignore hidden positions and only use unopened cells", () => {
  const a = new BomBom({ bot: true, random: () => 0 }),
    b = new BomBom({ bot: true, random: () => 0 });
  for (const [g, positions] of [
    [a, [0, 1, 2, 3, 4]],
    [b, [12, 13, 14, 15, 16]],
  ]) {
    positions.forEach((i) => g.toggle(i));
    g.toggle(21);
    g.confirm();
    g.open(8);
  }
  assert.equal(a.botChoice(), b.botChoice());
  assert.equal(a.botChoice(), 0);
  a.open(0);
  a.open(9);
  assert.equal(a.botChoice(), 1);
});
test("many complete bot matches terminate with exactly one loser and at most 47 selections", () => {
  let seed = 17;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let round = 0; round < 100; round++) {
    const g = new BomBom({ bot: true, random });
    [2, 7, 14, 19, 23].forEach((i) => g.toggle(i));
    g.toggle(21);
    g.confirm();
    let moves = 0;
    while (g.winner === null) {
      const choices = Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
        (i) => !g.revealed[1 - g.turn].has(i),
      );
      assert.ok(
        g.open(
          g.turn === 1
            ? g.botChoice()
            : choices[Math.floor(random() * choices.length)],
        ),
      );
      if (g.phase === "mine") {
        if (random() > 0.5) g.holdMine();
        g.tick(5);
      }
      moves++;
      assert.ok(moves <= 47);
    }
    assert.equal(g.hits[1 - g.winner], 5);
    assert.ok(g.hits[g.winner] < 5);
    assert.ok(g.scores.every((s) => s <= 21));
  }
});

test("fifth bomb feedback ends automatically and only advances with active game time", () => {
  const g = localReady();
  for (let i = 0; i < 5; i++) {
    g.open(i);
    if (i < 4) g.open(8 + i);
  }
  assert.equal(g.phase, "ending");
  assert.equal(g.tick(0), false);
  assert.equal(g.tick(NaN), false);
  assert.equal(g.tick(-5), false);
  assert.equal(g.tick(Infinity), false);
  assert.equal(g.endingRemaining, 0.9);
  assert.equal(g.tick(0.4), false);
  assert.equal(g.phase, "ending");
  assert.equal(g.tick(0.51), true);
  assert.equal(g.phase, "ended");
  assert.equal(g.tick(10), false);
  assert.equal(g.open(5), false);
});

test("24 cells and five hearts: every bomb costs one life, safe cells preserve lives", () => {
  const g = localReady();
  assert.equal(BOMB_CELLS, 24);
  assert.equal(MAX_BOMBS, 5);
  assert.equal(g.lives(0), 5);
  assert.equal(g.lives(1), 5);
  assert.ok(g.open(23, 0));
  assert.equal(g.lives(0), 5);
  assert.ok(g.open(22, 1));
  assert.equal(g.lives(1), 5);
  for (let i = 0; i < 5; i++) {
    assert.ok(g.open(i, 0));
    assert.equal(g.lives(0), 4 - i);
    if (i < 4) {
      assert.equal(g.winner, null);
      assert.ok(g.open(10 + i, 1));
    }
  }
  assert.equal(g.winner, 1);
  assert.equal(g.lives(0), 0);
  assert.equal(g.lives(1), 5);
});

test("one extra mine is required, cannot overlap bombs, and remains editable", () => {
  const g = new BomBom({ bot: true, random: () => 0 });
  [0, 1, 2, 3, 4].forEach((i) => g.toggle(i));
  assert.equal(g.confirm(), false);
  assert.ok(g.toggle(5));
  assert.equal(g.mines[0], 5);
  assert.equal(g.toggle(6), false);
  assert.ok(g.toggle(5));
  assert.ok(g.toggle(23));
  assert.ok(g.confirm());
  assert.equal(g.mines[1], 5);
  assert.ok(g.mines.every((mine, p) => !g.bombs[p].has(mine)));
});
test("mine locks both boards until held long enough; success earns three points once", () => {
  const g = localReady();
  assert.ok(g.open(21));
  assert.equal(g.phase, "mine");
  assert.equal(g.turn, 0);
  assert.equal(g.open(10), false);
  assert.equal(g.holdMine(1), false);
  assert.equal(g.releaseMine(), false);
  assert.ok(g.holdMine());
  assert.equal(g.tick(0.8), false);
  assert.equal(g.tick(0.81), true);
  assert.equal(g.phase, "attack");
  assert.equal(g.turn, 1);
  assert.deepEqual(g.scores, [3, 0]);
  assert.deepEqual(g.hits, [0, 0]);
  assert.equal(g.result.defused, true);
  assert.equal(g.resolveMine(true), false);
  g.open(10);
  assert.equal(g.open(21), false);
});
test("early release or ignoring a mine costs one heart, never multiple hearts", () => {
  for (const release of [true, false]) {
    const g = localReady();
    g.open(21);
    if (release) {
      g.holdMine();
      g.tick(0.4);
      assert.ok(g.releaseMine());
    } else {
      assert.equal(g.tick(4.9), false);
      assert.ok(g.tick(0.11));
    }
    assert.equal(g.phase, "attack");
    assert.equal(g.turn, 1);
    assert.equal(g.lives(0), 4);
    assert.equal(g.result.mine, true);
    assert.equal(g.result.hit, true);
    assert.equal(g.releaseMine(), false);
    g.tick(10);
    assert.equal(g.lives(0), 4);
  }
});
test("a late hold cannot bypass the mine deadline; mine can take the last heart", () => {
  const g = localReady();
  for (let i = 0; i < 4; i++) {
    g.open(i);
    g.open(10 + i);
  }
  g.open(21);
  g.tick(4);
  g.holdMine();
  assert.ok(g.tick(2));
  assert.equal(g.winner, 1);
  assert.equal(g.lives(0), 0);
  assert.equal(g.phase, "ending");
  assert.equal(g.scores[0], 0);
  g.tick(1);
  assert.equal(g.phase, "ended");
});

test("each board has one random Peek on a safe square, separate from the mine", () => {
  for (const value of [0, 0.25, 0.5, 0.999999]) {
    const g = new BomBom({ bot: true, random: () => value });
    [0, 1, 2, 3, 4, 21].forEach((i) => g.toggle(i));
    g.confirm();
    for (const owner of [0, 1]) {
      assert.ok(g.valid(g.peekCells[owner]));
      assert.equal(g.bombs[owner].has(g.peekCells[owner]), false);
      assert.notEqual(g.mines[owner], g.peekCells[owner]);
    }
    assert.ok(g.warnings.every((set) => set.size === 0));
  }
});
test("Peek awards a normal safe point and marks exactly one unopened bomb without opening it", () => {
  const g = localReady();
  g.random = () => 0.999;
  const bonus = g.peekCells[1];
  assert.ok(g.open(bonus));
  assert.equal(g.result.peek, true);
  const warning = g.result.warning;
  assert.equal(g.bombs[1].has(warning), true);
  assert.equal(g.revealed[1].has(warning), false);
  assert.deepEqual([...g.warnings[0]], [warning]);
  assert.equal(g.warnings[1].size, 0);
  assert.equal(g.scores[0], 1);
  assert.equal(g.lives(0), 5);
  assert.equal(g.turn, 1);
  g.open(22);
  assert.equal(g.open(bonus), false);
  assert.equal(g.warnings[0].size, 1);
  assert.ok(g.open(warning));
  assert.equal(g.result.hit, true);
  assert.equal(g.lives(0), 4);
  assert.equal(g.scores[0], 1);
});
test("Peek excludes previously opened bombs and bot uses only earned warnings", () => {
  const g = new BomBom({ bot: true, random: () => 0 });
  [0, 1, 2, 3, 4, 21].forEach((i) => g.toggle(i));
  g.confirm();
  g.open(0);
  g.open(0);
  g.open(g.peekCells[1]);
  assert.equal(g.result.warning, 1);
  g.open(g.peekCells[0]);
  assert.equal(g.result.warning, 1);
  assert.equal(g.botChoice(), null);
  g.open(23);
  assert.equal(g.botChoice(), 2);
  assert.equal(g.warnings[1].has(1), true);
  assert.equal(g.revealed[0].has(1), false);
  const next = new BomBom();
  assert.ok(next.warnings.every((set) => set.size === 0));
  assert.deepEqual(next.peekCells, [null, null]);
});
