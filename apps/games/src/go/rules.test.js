import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, play, pass, replay, score, groupAt, BLACK, WHITE } from './rules.js';

const at = (size, x, y) => y * size + x;
const run = (size, pts, komi = 0) => replay(size, komi, pts.map(([x, y]) => at(size, x, y)));

test('a single stone with no liberties is captured', () => {
  const { state } = run(9, [[0, 0], [1, 0], [2, 0], [8, 8], [1, 1]]);
  assert.equal(state.board[at(9, 1, 0)], 0);
  assert.equal(state.captures[BLACK], 1);
});

test('a two-stone group is captured together', () => {
  const { state } = run(9, [[2, 0], [0, 0], [0, 1], [1, 0], [8, 8], [8, 7], [1, 1]]);
  assert.equal(state.board[at(9, 0, 0)], 0);
  assert.equal(state.board[at(9, 1, 0)], 0);
  assert.equal(state.captures[BLACK], 2);
});

test('suicide is rejected, but filling the last liberty to capture is legal', () => {
  const { state, history } = run(9, [[8, 8], [1, 0], [8, 7], [0, 1]]);
  assert.equal(state.turn, BLACK);
  assert.equal(play(state, at(9, 0, 0), history).error, 'suicide');
});

test('occupied points are rejected', () => {
  const s = newGame(9);
  const a = play(s, 10, []).state;
  assert.equal(play(a, 10, [s]).error, 'occupied');
});

test('the ko rule stops an immediate recapture', () => {
  const size = 9;
  let s = newGame(size);
  const put = (colour, x, y) => { s.board[at(size, x, y)] = colour; };
  s = { ...s, board: s.board.slice() };
  put(BLACK, 2, 1); put(BLACK, 1, 2); put(BLACK, 2, 3);
  put(WHITE, 3, 1); put(WHITE, 4, 2); put(WHITE, 3, 3); put(WHITE, 2, 2);
  s = { ...s, key: s.board.join(''), turn: BLACK };
  const cap = play(s, at(size, 3, 2), []);
  assert.equal(cap.error, undefined, 'black captures the ko stone');
  assert.equal(cap.state.board[at(size, 2, 2)], 0);
  assert.equal(play(cap.state, at(size, 2, 2), [s]).error, 'ko');
});

test('territory scoring with a wall and komi', () => {
  const size = 9;
  let s = newGame(size, 6.5);
  const board = s.board.slice();
  for (let y = 0; y < size; y++) { board[at(size, 4, y)] = BLACK; board[at(size, 5, y)] = WHITE; }
  s = { ...s, board, key: board.join('') };
  const r = score(s, new Set());
  assert.equal(r.black.territory, 4 * size);
  assert.equal(r.white.territory, 3 * size);
  assert.equal(r.winner, BLACK);
  assert.equal(r.margin, 36 - (27 + 6.5));
});

test('dead stones count as prisoners and free their points', () => {
  const size = 9;
  let s = newGame(size, 0);
  const board = s.board.slice();
  for (let y = 0; y < size; y++) board[at(size, 4, y)] = BLACK;
  board[at(size, 1, 1)] = WHITE;
  s = { ...s, board, key: board.join('') };
  const r = score(s, new Set([at(size, 1, 1)]));
  assert.equal(r.black.prisoners, 1);
  assert.equal(r.black.territory, size * size - size); // everything except the wall itself
  assert.equal(r.white.territory, 0);
});

test('passing twice is recorded and a pass resets nothing on the board', () => {
  let s = newGame(9);
  s = play(s, 0, []).state;
  const p1 = pass(s), p2 = pass(p1);
  assert.equal(p2.passes, 2);
  assert.equal(p2.board[0], BLACK);
});

test('groups report liberties', () => {
  const s = play(newGame(9), at(9, 0, 0), []).state;
  assert.equal(groupAt(s.board, 9, at(9, 0, 0)).libs.size, 2);
});
