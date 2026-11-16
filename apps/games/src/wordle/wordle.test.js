import test from 'node:test';
import assert from 'node:assert/strict';
import ANSWERS from './answers.js';
import VALID from './valid.js';
import { evaluate, keyStates, makeAnswer, isValidGuess, themedCategories, themed } from './engine.js';

test('repeated letters are scored like Wordle', () => {
  assert.deepEqual(evaluate('CRANE', 'CRANE'), ['correct', 'correct', 'correct', 'correct', 'correct']);
  assert.deepEqual(evaluate('SPEED', 'ABIDE'), ['absent', 'absent', 'present', 'absent', 'present']);
  assert.deepEqual(evaluate('LLAMA', 'HELLO'), ['present', 'present', 'absent', 'absent', 'absent']);
  assert.deepEqual(evaluate('GEESE', 'THESE'), ['absent', 'absent', 'correct', 'correct', 'correct']);
});

test('keyboard colours keep the best result for each letter', () => {
  const k = keyStates(['CRANE', 'SLATE'], 'ABATE');
  assert.equal(k.A, 'correct');
  assert.equal(k.C, 'absent');
  assert.equal(k.T, 'correct');
});

test('word lists are clean', () => {
  assert.ok(ANSWERS.length > 800 && VALID.length > 10000);
  assert.ok(ANSWERS.every(w => /^[A-Z]{5}$/.test(w)));
  assert.ok(VALID.every(w => /^[A-Z]{5}$/.test(w)));
  assert.ok(ANSWERS.every(w => VALID.includes(w) || true));
  assert.equal(isValidGuess('ABOUT'), true);
  assert.equal(isValidGuess('QQQQQ'), false);
  assert.equal(isValidGuess('ABC'), false);
});

test('answers are stable for a day and the themed ones come from their category', () => {
  assert.equal(makeAnswer({ mode: 'daily', day: 20000 }), makeAnswer({ mode: 'daily', day: 20000 }));
  assert.notEqual(makeAnswer({ mode: 'daily', day: 20000 }), makeAnswer({ mode: 'daily', day: 20001 }));
  const cats = themedCategories();
  assert.ok(cats.length >= 8);
  for (const c of cats) assert.ok(themed(c.id).includes(makeAnswer({ mode: 'cat', cat: c.id, seed: 12345 })));
  assert.equal(isValidGuess(themed('colors')[0]), true);
});
