import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, cleanWords, lineCells, snapEnd, matchSelection, placementCells, encodePuzzle, decodePuzzle } from './engine.js';

const WORDS = ['nave', 'Spire', 'buttress', 'vault', 'cloister', 'transept', 'gargoyle', 'choir', 'altar', 'arch'];

test('words are cleaned, de-duplicated and accents removed', () => {
  assert.deepEqual(cleanWords(['Café', 'cafe', 'a', 'two words', 'ok!']), ['CAFE', 'TWOWORDS']);
});

test('every word is placed and readable in the grid', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    const p = generate({ words: WORDS, size: 12, level, seed: 7 });
    assert.equal(p.unplaced.length, 0, level);
    for (const pl of p.placements) {
      const spelled = placementCells(pl).map(([r, c]) => p.grid[r * p.size + c]).join('');
      assert.equal(spelled, pl.word);
    }
    assert.ok(p.grid.every(ch => /^[A-Z]$/.test(ch)));
  }
});

test('the same seed gives the same puzzle, a different seed a different one', () => {
  const a = generate({ words: WORDS, size: 12, seed: 3 }), b = generate({ words: WORDS, size: 12, seed: 3 }), c = generate({ words: WORDS, size: 12, seed: 4 });
  assert.deepEqual(a.grid, b.grid);
  assert.notDeepEqual(a.grid, c.grid);
});

test('easy puzzles only run left to right or top to bottom', () => {
  const p = generate({ words: WORDS, size: 12, level: 'easy', seed: 5 });
  assert.ok(p.placements.every(pl => pl.dr >= 0 && pl.dc >= 0 && pl.dr + pl.dc === 1));
});

test('selections match a word forwards and backwards', () => {
  const p = generate({ words: WORDS, size: 12, level: 'hard', seed: 9 });
  const pl = p.placements[0], cells = placementCells(pl);
  assert.equal(matchSelection(p, cells), pl.word);
  assert.equal(matchSelection(p, [...cells].reverse()), pl.word);
  assert.equal(matchSelection(p, cells.slice(0, -1)), null);
});

test('lines and snapping', () => {
  assert.equal(lineCells(0, 0, 2, 1), null);
  assert.deepEqual(lineCells(0, 0, 2, 2), [[0, 0], [1, 1], [2, 2]]);
  assert.deepEqual(snapEnd(5, 5, 5, 9, 12), [5, 9]);
  const [dr, dc] = snapEnd(5, 5, 8, 9, 12);
  assert.equal(dr - 5, dc - 5, 'a mostly diagonal drag snaps onto the diagonal');
  const [r, c] = snapEnd(5, 5, 9, 6, 12);
  assert.equal(c, 5); assert.equal(r, 9); // mostly vertical drags snap vertical
});

test('puzzles survive a trip through a link', () => {
  const code = encodePuzzle({ title: 'For Nikki', words: ['café', 'love', 'nave'], size: 10, level: 'easy', seed: 42, message: 'Happy birthday ❤' });
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  const back = decodePuzzle(code);
  assert.equal(back.title, 'For Nikki');
  assert.deepEqual(back.words, ['CAFE', 'LOVE', 'NAVE']);
  assert.equal(back.message, 'Happy birthday ❤');
  assert.equal(decodePuzzle('not a puzzle'), null);
});
