import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDifferences, makeScene, THEME_KEYS, SPOT_KEYS, SPOT_LEVELS, NO_COLOR, FLIPPABLE } from './scene.js';

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

test('no difference is invisible (no colour change on colourless shapes, no flip on symmetric ones)', () => {
  for (const th of THEME_KEYS) for (const lv of SPOT_KEYS) for (let seed = 1; seed <= 60; seed++) {
    const { a, diffs } = makeDifferences(th, lv, seed);
    for (const d of diffs) {
      const e = a.elements.find(x => x.id === d.id);
      if (!e) continue;
      if (d.kind === 'color') assert.ok(!NO_COLOR.has(e.type), `${th} ${lv} ${seed}: colour change on ${e.type}`);
      if (d.kind === 'flip') assert.ok(FLIPPABLE.has(e.type), `${th} ${lv} ${seed}: flip on ${e.type}`);
    }
  }
});
