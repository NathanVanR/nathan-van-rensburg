import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOOKS, parseRef, findBook, refLabel, refShort, refCode, parseCode } from './books.js';
import { accuracy, recall, hideOrder, phrases, firstLetters, keyWords, tokens } from './text.js';
import { nextSrs, levelFor, bumpStreak, liveStreak, VERSE_OF_THE_DAY, verseOfTheDay } from './store.js';

const kjv = n => JSON.parse(readFileSync(new URL(`./kjv/${String(n).padStart(2, '0')}.json`, import.meta.url), 'utf8'));

test('the KJV files are complete', () => {
  let verses = 0, chapters = 0;
  BOOKS.forEach(b => {
    const d = kjv(b.n);
    assert.equal(d.length, b.chapters, `${b.name} chapter count`);
    d.forEach(c => { assert.ok(c.length > 0); verses += c.length; c.forEach(v => assert.ok(typeof v === 'string' && v.length > 1)); });
    chapters += d.length;
  });
  assert.equal(chapters, 1189);
  assert.equal(verses, 31102);
  assert.match(kjv(43)[2][15], /^For God so loved the world/);
  assert.equal(kjv(19)[22][0], 'The LORD is my shepherd; I shall not want.');
  assert.ok(!JSON.stringify(kjv(1)).includes('—'), 'no em dashes');
});

test('references parse in every style the picker accepts', () => {
  assert.deepEqual(parseRef('John 3'), { book: 43, chapter: 3, from: null, to: null });
  assert.deepEqual(parseRef('John 3:16-18'), { book: 43, chapter: 3, from: 16, to: 18 });
  assert.deepEqual(parseRef('jn 3 v16-18'), { book: 43, chapter: 3, from: 16, to: 18 });
  assert.deepEqual(parseRef('Psalm 23:1'), { book: 19, chapter: 23, from: 1, to: 1 });
  assert.deepEqual(parseRef('1 Cor 13'), { book: 46, chapter: 13, from: null, to: null });
  assert.deepEqual(parseRef('ps 119:105'), { book: 19, chapter: 119, from: 105, to: 105 });
  assert.deepEqual(parseRef('ch1', 1), { book: 1, chapter: 1, from: null, to: null });
  assert.deepEqual(parseRef('ch1v3-7', 1), { book: 1, chapter: 1, from: 3, to: 7 });
  assert.deepEqual(parseRef('ch12v4', 19), { book: 19, chapter: 12, from: 4, to: 4 });
  assert.equal(parseRef('John 99'), null);
  assert.equal(parseRef('Nonsense 3'), null);
  assert.equal(parseRef('John 3:9-4'), null);
  assert.equal(findBook('First John').name, '1 John');
  assert.equal(findBook('song of songs').name, 'Song of Solomon');
});

test('labels and codes round-trip', () => {
  const ref = { book: 43, chapter: 3, from: 16, to: 18 };
  assert.equal(refLabel(ref), 'John 3:16-18');
  assert.equal(refShort(ref), 'ch3v16-18');
  assert.equal(refShort({ book: 1, chapter: 1, from: null, to: null }), 'ch1');
  assert.deepEqual(parseCode(refCode(ref)), ref);
  assert.deepEqual(parseCode('19.23'), { book: 19, chapter: 23, from: null, to: null });
  assert.equal(parseCode('999.1'), null);
  assert.deepEqual(parseCode('43.3.16'), { book: 43, chapter: 3, from: 16, to: 16 });
  assert.ok(VERSE_OF_THE_DAY.every(c => parseCode(c)), 'every verse-of-the-day code parses');
});

test('every verse of the day exists', () => {
  assert.ok(VERSE_OF_THE_DAY.length >= 60);
  for (const code of VERSE_OF_THE_DAY) {
    const [b, c, v] = code.split('.').map(Number);
    assert.ok(kjv(b)[c - 1]?.[v - 1], `missing ${code}`);
  }
  assert.ok(VERSE_OF_THE_DAY.includes(verseOfTheDay(20000)));
});

test('word comparison ignores case and punctuation, and cares about order', () => {
  const v = 'For God so loved the world, that he gave his only begotten Son.';
  assert.equal(accuracy('for god so loved the world that he gave his only begotten son', v), 1);
  assert.ok(accuracy('God loved the world', v) < 0.6);
  assert.equal(accuracy('', v), 0);
  const r = recall('for god so loved world', v);
  assert.equal(r.filter(x => !x.ok).length, v.split(' ').length - 5);
});

test('hiding words is deterministic and nested', () => {
  const words = tokens('In the beginning God created the heaven and the earth.');
  assert.deepEqual(hideOrder(words, 5), hideOrder(words, 5));
  assert.equal(new Set(hideOrder(words, 5)).size, words.length);
});

test('phrases cover the whole verse in order', () => {
  for (const [b, c, n] of [[43, 3, 16], [19, 23, 1], [19, 119, 105], [57, 1, 1], [17, 8, 9]]) {
    const text = kjv(b)[c - 1][n - 1], p = phrases(text);
    assert.equal(p.join(' ').replace(/\s+/g, ' '), text.replace(/\s+/g, ' '));
    assert.ok(p.length >= 2);
  }
  assert.deepEqual(firstLetters('For God, so loved'), ['F', 'G,', 's', 'l']);
});

test('key words for the word search are clean', () => {
  const k = keyWords(kjv(43)[2][15] + ' ' + kjv(43)[2][16], 8, 3);
  assert.ok(k.length >= 6);
  assert.ok(k.every(w => /^[A-Z]{4,12}$/.test(w)));
});

test('spaced review boxes move up on success and back on a miss', () => {
  let e = nextSrs(undefined, true, 100);
  assert.deepEqual([e.box, e.due], [1, 101]);
  e = nextSrs(e, true, 101); assert.deepEqual([e.box, e.due], [2, 104]);
  e = nextSrs(e, true, 104); assert.equal(e.due, 111);
  e = nextSrs(e, false, 111); assert.deepEqual([e.box, e.due], [2, 112]);
  for (let i = 0; i < 10; i++) e = nextSrs(e, true, 200);
  assert.equal(e.box, 5);
});

test('levels and streaks', () => {
  assert.equal(levelFor(0).level, 1);
  assert.equal(levelFor(40).level, 2);
  assert.ok(levelFor(500).level > 3);
  const p = { streak: 0, best: 0, lastDay: 0 };
  bumpStreak(p, 10); bumpStreak(p, 10); assert.equal(p.streak, 1);
  bumpStreak(p, 11); assert.equal(p.streak, 2);
  bumpStreak(p, 14); assert.equal(p.streak, 1);
  assert.equal(p.best, 2);
  assert.equal(liveStreak(p, 14), 1);
  assert.equal(liveStreak(p, 20), 0);
});
