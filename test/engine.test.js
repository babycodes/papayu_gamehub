import test from 'node:test';
import assert from 'node:assert/strict';
import { FishingGame } from '../src/engine.js';
const advance = (game, seconds) => { for (let i = 0; i < Math.ceil(seconds / .05); i++) game.tick(.05); };
function catchFish(game, layer = 0, bonus = false) {
  game.fish = [{ name: 'Test fish', points: 10, size: 18, layer, bonus, x: .47, y: .38, direction: 1, speed: 0, expires: Infinity }];
  game.press(); advance(game, 1); return game.drainEvents();
}
test('a round starts with five depths and 90 seconds', () => {
  const game = new FishingGame(); assert.equal(game.mode, 'ready'); assert.equal(game.remaining, 90);
  assert.equal(new Set(game.fish.map(f => f.layer)).size, 5);
  advance(game, 2); assert.equal(game.remaining, 90);
});
test('catching and reeling delivers points, then increases combo', () => {
  const game = new FishingGame(); game.reset();
  assert.ok(catchFish(game).some(e => e.type === 'catch')); assert.equal(game.score, 10); assert.equal(game.count, 1);
  catchFish(game); assert.equal(game.score, 30); assert.equal(game.combo, 2); assert.equal(game.hook.state, 'idle');
  advance(game, 9); assert.equal(game.combo, 1);
});
test('bonus grants time without awarding fish points', () => {
  const game = new FishingGame(); game.reset(); const events = catchFish(game, 2, true);
  assert.ok(events.some(e => e.type === 'bonus')); assert.ok(game.remaining > 100); assert.equal(game.score, 0); assert.equal(game.count, 0);
});
test('frenzy doubles score and creates its exclusive species', () => {
  const game = new FishingGame(); game.reset(); advance(game, 25.1);
  assert.equal(game.frenzy, true); assert.ok(game.fish.some(f => f.special));
  catchFish(game); assert.equal(game.score, 20);
  advance(game, 8); assert.equal(game.frenzy, false);
});
test('pause freezes time and release reels an empty hook', () => {
  const game = new FishingGame(); game.reset(); game.fish = []; game.press(); advance(game, .5); game.release();
  assert.equal(game.hook.state, 'reeling'); const remaining = game.remaining; game.pause(); advance(game, 10);
  assert.equal(game.remaining, remaining); game.resume(); advance(game, 1); assert.equal(game.hook.state, 'idle');
});
test('time expiry ends the round and replay resets progress', () => {
  const game = new FishingGame(); game.reset(); game.score = 300; advance(game, 91);
  assert.equal(game.mode, 'ended'); assert.equal(game.remaining, 0); game.press(); assert.equal(game.hook.state, 'idle');
  game.reset(); assert.equal(game.score, 0); assert.equal(game.count, 0); assert.equal(game.remaining, 90);
});
