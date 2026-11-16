// Helpers for working with verse text.
import { mulberry32 } from '../wordsearch/engine.js';

export const tokens = text => text.split(/\s+/).filter(Boolean);
/** The comparable core of a word: lowercase letters only. */
export const core = w => w.toLowerCase().replace(/æ/g, 'ae').replace(/[^a-z]/g, '');

/** Share of the verse recalled, by longest common subsequence of words (order matters, punctuation and case do not). */
export function accuracy(typed, original) {
  const a = tokens(typed).map(core).filter(Boolean), b = tokens(original).map(core).filter(Boolean);
  if (!b.length || !a.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length] / Math.max(a.length, b.length);
}

/** Which words of the original were recalled (true) or missed (false), aligned by LCS. */
export function recall(typed, original) {
  const a = tokens(typed).map(core).filter(Boolean), orig = tokens(original), b = orig.map(core);
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] && b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const hit = new Array(b.length).fill(false);
  let i = a.length, j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1] && b[j - 1] && dp[i][j] === dp[i - 1][j - 1] + 1) { hit[j - 1] = true; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return orig.map((word, k) => ({ word, ok: hit[k] || !b[k] }));
}

/** Indices of the words to hide, in the order they disappear. Deterministic for a seed. */
export function hideOrder(words, seed) {
  const rand = mulberry32(seed >>> 0);
  const idx = words.map((w, i) => i).filter(i => core(words[i]).length > 0);
  for (let i = idx.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

/** Split a verse into phrases for the word-order puzzle. */
export function phrases(text) {
  let parts = text.split(/(?<=[,;:.?!])\s+/).filter(Boolean);
  const merged = [];
  for (const p of parts) {
    if (merged.length && tokens(p).length < 2) merged[merged.length - 1] += ' ' + p;
    else merged.push(p);
  }
  const out = [];
  for (const p of merged) {
    const w = tokens(p);
    if (w.length <= 7) out.push(p);
    else { const size = Math.ceil(w.length / Math.ceil(w.length / 5)); for (let i = 0; i < w.length; i += size) out.push(w.slice(i, i + size).join(' ')); }
  }
  if (out.length >= 4) return out;
  const w = tokens(text), step = w.length >= 8 ? 2 : 1, chunks = [];
  for (let i = 0; i < w.length; i += step) chunks.push(w.slice(i, i + step).join(' '));
  return chunks;
}

/** "For God so loved" becomes "F G s l" with punctuation kept. */
export const firstLetters = text => tokens(text).map(w => { const m = w.match(/^([^A-Za-z]*)([A-Za-z])[A-Za-z']*(.*)$/); return m ? m[1] + m[2] + m[3] : w; });

const STOP = new Set('that unto with thou thee thy thine they them their have from which were this will hath shall into also then than there these those when what your ours upon been said saith unto thereof therefore wherefore'.split(' '));
/** Good words to hide in a word search: distinct, 4-12 letters, not filler words. */
export function keyWords(text, count, seed = 1) {
  const seen = new Set(), list = [];
  for (const w of tokens(text)) { const c = core(w).toUpperCase(); if (c.length >= 4 && c.length <= 12 && !STOP.has(c.toLowerCase()) && !seen.has(c)) { seen.add(c); list.push(c); } }
  const rand = mulberry32(seed >>> 0);
  for (let i = list.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, count);
}

export const shuffle = (arr, seed) => {
  const rand = mulberry32(seed >>> 0), a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
