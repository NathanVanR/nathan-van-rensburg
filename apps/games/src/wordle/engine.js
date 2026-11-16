import ANSWERS from './answers.js';
import VALID from './valid.js';
import { PACKS } from '../wordsearch/packs.js';
import { hashString } from '../wordsearch/engine.js';

export const ROUNDS = 6;
export const dayNumber = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** Score a guess against the answer, handling repeated letters the way Wordle does. */
export function evaluate(guess, answer) {
  const res = Array(answer.length).fill('absent'), left = {};
  for (let i = 0; i < answer.length; i++) {
    if (guess[i] === answer[i]) res[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < answer.length; i++) {
    if (res[i] !== 'correct' && left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
  }
  return res;
}

const RANK = { absent: 1, present: 2, correct: 3 };
export function keyStates(guesses, answer) {
  const out = {};
  for (const g of guesses) evaluate(g, answer).forEach((s, i) => { if (!out[g[i]] || RANK[s] > RANK[out[g[i]]]) out[g[i]] = s; });
  return out;
}

export const themed = id => {
  const pack = PACKS.find(p => p.id === id);
  return pack ? pack.words.filter(w => w.length === 5) : [];
};
export const themedCategories = () => PACKS.map(p => ({ id: p.id, title: p.title, count: themed(p.id).length })).filter(c => c.count >= 12);

export function makeAnswer({ mode, seed, cat, day }) {
  if (mode === 'daily') return ANSWERS[hashString('wordle' + day) % ANSWERS.length];
  if (mode === 'cat') { const bank = themed(cat); return bank[Math.abs(seed) % bank.length]; }
  return ANSWERS[Math.abs(seed) % ANSWERS.length];
}

const VALID_SET = new Set(VALID);
ANSWERS.forEach(w => VALID_SET.add(w));
const THEMED_SET = new Set(PACKS.flatMap(p => p.words.filter(w => w.length === 5)));
export const isValidGuess = w => w.length === 5 && (VALID_SET.has(w) || THEMED_SET.has(w));

export const MESSAGES = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

export function shareText({ title, guesses, answer, won, secs }) {
  const sq = { correct: '🟩', present: '🟨', absent: '⬛' };
  const grid = guesses.map(g => evaluate(g, answer).map(s => sq[s]).join('')).join('\n');
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return `${title} ${won ? guesses.length : 'X'}/${ROUNDS} · ${mm}\n${grid}\nnatevr.net/games`;
}
