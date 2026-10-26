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
test("many complete bot matches terminate with a valid winner or draw within 47 selections", () => {
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
    if (g.winner === "draw") {
      assert.deepEqual(g.hits, [4, 4]);
      assert.ok(g.revealed.every((board) => board.size === 23));
    } else {
      assert.equal(g.hits[1 - g.winner], 5);
      assert.ok(g.hits[g.winner] < 5);
    }
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

function openAndDefuse(g, index) {
  assert.ok(g.open(index));
  if (g.phase === "mine") {
    assert.ok(g.holdMine());
    assert.ok(g.tick(1.61));
  }
}
function lastBombOrder(mineLast = false) {
  const safe = Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
    (i) => i >= 5 && i !== 21,
  );
  return mineLast ? [0, 1, 2, 3, ...safe, 21] : [21, 0, 1, 2, 3, ...safe];
}
test("last bomb on both boards is a draw for either local starter, before anyone loses a heart", () => {
  for (const starter of [0, 1]) {
    const g = localReady(starter);
    const order = lastBombOrder();
    for (const index of order) {
      openAndDefuse(g, index);
      assert.equal(g.winner, null);
      openAndDefuse(g, index);
    }
    assert.deepEqual(g.hits, [4, 4]);
    assert.deepEqual(g.scores, [21, 21]);
    assert.equal(g.winner, "draw");
    assert.equal(g.phase, "ending");
    assert.ok(g.revealed.every((board) => board.size === 23 && !board.has(4)));
    assert.equal(g.open(4), false);
    assert.equal(g.holdMine(), false);
    assert.equal(g.tick(0.4), false);
    assert.equal(g.tick(0.51), true);
    assert.equal(g.phase, "ended");
    assert.equal(g.open(4), false);
    assert.deepEqual(g.hits, [4, 4]);
  }
});
test("successfully defusing the last mine can complete the draw", () => {
  const g = localReady();
  const order = lastBombOrder(true);
  for (const index of order.slice(0, -1)) {
    openAndDefuse(g, index);
    openAndDefuse(g, index);
    assert.equal(g.winner, null);
  }
  openAndDefuse(g, 21);
  assert.equal(g.winner, null);
  assert.ok(g.open(21));
  assert.equal(g.phase, "mine");
  assert.equal(g.winner, null);
  g.holdMine();
  g.tick(1.61);
  assert.equal(g.winner, "draw");
  assert.deepEqual(g.hits, [4, 4]);
});
test("four hits each is not a draw while safe choices remain", () => {
  const g = localReady();
  for (const index of [0, 1, 2, 3]) {
    g.open(index);
    g.open(index);
  }
  assert.deepEqual(g.hits, [4, 4]);
  assert.equal(g.checkDraw(), false);
  openAndDefuse(g, 21);
  assert.equal(g.winner, null);
  g.open(5);
  assert.equal(g.winner, null);
  g.open(4);
  assert.equal(g.winner, 1);
  assert.equal(g.phase, "ending");
});
test("bot matches use the same draw rule without exposing hidden positions", () => {
  const g = new BomBom({ bot: true, random: () => 0 });
  [0, 1, 2, 3, 4, 21].forEach((i) => g.toggle(i));
  g.confirm();
  const orders = [1, 0].map((target) => [
    g.mines[target],
    0,
    1,
    2,
    3,
    ...Array.from({ length: BOMB_CELLS }, (_, i) => i).filter(
      (i) => i >= 5 && i !== g.mines[target],
    ),
  ]);
  for (let move = 0; move < 23; move++) {
    openAndDefuse(g, orders[0][move]);
    assert.equal(g.winner, null);
    openAndDefuse(g, orders[1][move]);
  }
  assert.equal(g.winner, "draw");
  assert.equal(g.botChoice(), null);
  assert.deepEqual(g.hits, [4, 4]);
});
