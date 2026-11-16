import test from 'node:test';
import assert from 'node:assert/strict';
import { PACKS } from '../wordsearch/packs.js';
import { generateCrossword, pickCrosswordWords, CW_KEYS, CW_LEVELS, slotCells } from './engine.js';

test('crosswords place every word, cross them, and make no accidental words', () => {
  let unplaced = 0, total = 0;
  for (const p of PACKS) for (const lv of CW_KEYS) for (const seed of [1, 2, 3]) {
    const words = pickCrosswordWords(p.words, lv, seed * 31);
    assert.equal(words.length, CW_LEVELS[lv].count);
    const cw = generateCrossword(words, seed);
    total++; unplaced += cw.unplaced.length ? 1 : 0;
    const slotSet = new Set(cw.slots.map(s => `${s.dir}${s.r},${s.c},${s.len}`));
    for (const s of cw.slots) slotCells(s).forEach(([r, c], i) => assert.equal(cw.grid[r][c], s.word[i]));
    for (let r = 0; r < cw.rows; r++) { let c = 0; while (c < cw.cols) { if (cw.grid[r][c]) { let e = c; while (e < cw.cols && cw.grid[r][e]) e++; if (e - c >= 2) assert.ok(slotSet.has(`A${r},${c},${e - c}`), 'stray across run'); c = e; } else c++; } }
    for (let c = 0; c < cw.cols; c++) { let r = 0; while (r < cw.rows) { if (cw.grid[r][c]) { let e = r; while (e < cw.rows && cw.grid[e][c]) e++; if (e - r >= 2) assert.ok(slotSet.has(`D${r},${c},${e - r}`), 'stray down run'); r = e; } else r++; } }
    if (cw.slots.length > 1) assert.ok(cw.slots.every(s => slotCells(s).some(([r, c]) => cw.slots.some(o => o !== s && slotCells(o).some(([r2, c2]) => r2 === r && c2 === c)))), 'every word crosses another');
  }
  assert.ok(unplaced <= total * 0.05, `too many puzzles dropped words: ${unplaced}/${total}`);
});

test('same seed, same crossword', () => {
  const words = pickCrosswordWords(PACKS[0].words, 'medium', 5);
  assert.deepEqual(generateCrossword(words, 9).grid, generateCrossword(words, 9).grid);
});
