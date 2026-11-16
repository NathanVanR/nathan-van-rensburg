import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDifferences, makeScene, THEME_KEYS, SPOT_KEYS, SPOT_LEVELS } from './scene.js';

test('every picture has the right number of well-spaced differences', () => {
  for (const th of THEME_KEYS) for (const lv of SPOT_KEYS) for (let seed = 1; seed <= 25; seed++) {
    const { a, b, diffs } = makeDifferences(th, lv, seed);
    assert.equal(diffs.length, SPOT_LEVELS[lv].count, `${th} ${lv} ${seed}`);
    for (let i = 0; i < diffs.length; i++) for (let j = i + 1; j < diffs.length; j++)
      assert.ok(Math.hypot(diffs[i].x - diffs[j].x, diffs[i].y - diffs[j].y) >= 60, 'differences too close');
    assert.notEqual(JSON.stringify(a.elements), JSON.stringify(b.elements));
  }
});

test('pictures are repeatable and not identical across seeds', () => {
  assert.deepEqual(makeScene('village', 4), makeScene('village', 4));
  assert.notDeepEqual(makeScene('village', 4), makeScene('village', 5));
  assert.deepEqual(makeDifferences('sea', 'hard', 9).diffs, makeDifferences('sea', 'hard', 9).diffs);
});
