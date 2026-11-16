import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS, LEVEL_CFG, LEVEL_KEYS, pickWords, buildRound, dailyDef } from './packs.js';
import { generate, cleanWords } from './engine.js';

test('the categories are the ones asked for', () => {
  assert.deepEqual(PACKS.map(p => p.id), ['libraries', 'wildlife', 'mzansi', 'cinema', 'kitchen', 'flowers', 'bible', 'scents', 'colors', 'korea', 'kpop', 'kdrama']);
});

test('every bank word is a clean 3-to-20 letter A-Z token with no duplicates', () => {
  for (const p of PACKS) {
    const bad = p.words.filter(x => !/^[A-Z]{3,20}$/.test(x));
    assert.deepEqual(bad, [], p.id + ' has unusable words');
    assert.equal(new Set(p.words).size, p.words.length, p.id + ' has duplicates');
    assert.ok(p.words.length >= 130, p.id + ' bank is thin: ' + p.words.length);
  }
});

test('every category can fill every level from words that really fit that level', () => {
  for (const p of PACKS) for (const level of LEVEL_KEYS) {
    const cfg = LEVEL_CFG[level];
    const fits = p.words.filter(x => x.length >= cfg.min && x.length <= cfg.max);
    assert.ok(fits.length >= cfg.count, `${p.id} ${level}: only ${fits.length} words fit`);
    const picked = pickWords(p.words, level, 7);
    assert.equal(picked.length, cfg.count);
    assert.equal(new Set(picked).size, cfg.count);
  }
});

test('same seed gives the same words, a different seed gives a different set', () => {
  const bank = PACKS[0].words;
  assert.deepEqual(pickWords(bank, 'medium', 5), pickWords(bank, 'medium', 5));
  const sets = new Set(Array.from({ length: 12 }, (_, i) => pickWords(bank, 'medium', i + 1).slice().sort().join()));
  assert.ok(sets.size >= 10, 'rounds should rarely repeat');
});

test('rounds always generate with every word placed, at every level', () => {
  for (const p of PACKS) for (const level of LEVEL_KEYS) for (const seed of [1, 2, 3]) {
    const def = buildRound(p, level, seed * 1000 + 17);
    const pz = generate(def);
    assert.equal(pz.unplaced.length, 0, `${p.id} ${level} seed ${seed} left out ${pz.unplaced}`);
    assert.ok(pz.size <= 17, `${p.id} ${level} grid too big: ${pz.size}`);
  }
});

test('harder levels use longer words and more directions', () => {
  const avg = level => { const w = pickWords(PACKS[2].words, level, 3); return w.reduce((n, x) => n + x.length, 0) / w.length; };
  assert.ok(avg('hard') > avg('easy'));
});

test('the daily puzzle is stable for a date and differs by level', () => {
  const d = new Date(2026, 5, 15);
  assert.deepEqual(dailyDef('easy', d).words, dailyDef('easy', d).words);
  assert.notDeepEqual(dailyDef('easy', d).words, dailyDef('hard', d).words);
  assert.match(dailyDef('medium', d).daily, /^2026-06-15$/);
  assert.equal(cleanWords(dailyDef('hard', d).words).length, LEVEL_CFG.hard.count);
});
