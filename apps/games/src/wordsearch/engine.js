// Word search engine: seeded generation, straight-line selection, and shareable puzzle links.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const normalizeWord = w =>
  String(w).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');

export function cleanWords(list) {
  const seen = new Set(), out = [];
  for (const raw of list) {
    const w = normalizeWord(raw);
    if (w.length >= 3 && w.length <= 20 && !seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

// [row step, column step]
const DIRS = {
  easy: [[0, 1], [1, 0]],
  medium: [[0, 1], [1, 0], [1, 1], [-1, 1]],
  hard: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]
};
export const LEVELS = ['easy', 'medium', 'hard'];
export const SIZES = { small: 10, medium: 13, large: 16 };

export function pickSize(words, wanted) {
  const longest = Math.max(0, ...words.map(w => w.length));
  const letters = words.reduce((n, w) => n + w.length, 0);
  const auto = Math.ceil(Math.sqrt(letters * 1.9));
  return Math.min(22, Math.max(wanted || 0, longest + 1, auto, 8));
}

const ALPHABET = 'EEEEEEEEEEEEAAAAAAAAARRRRRRIIIIIIOOOOOOTTTTTTNNNNNNSSSSSSLLLLCCCCUUUUDDDPPPMMMHHHGGBBFFYYWKVXZJQ';

/** Build a puzzle. Same input always gives the same grid. */
export function generate({ words, size, level = 'medium', seed = 1 }) {
  const list = cleanWords(words).sort((a, b) => b.length - a.length);
  const start = pickSize(list, size);
  let best = null;
  // If a crowded grid leaves words out, try again one size bigger (still fully deterministic per seed).
  for (let extra = 0; extra <= 3; extra++) {
    const attempt = build(list, start + extra, level, seed + extra * 101);
    if (!best || attempt.unplaced.length < best.unplaced.length) best = attempt;
    if (attempt.unplaced.length === 0) break;
  }
  return best;
}

function build(list, n, level, seed) {
  const rand = mulberry32(seed);
  const grid = new Array(n * n).fill('');
  const dirs = DIRS[level] || DIRS.medium;
  const placements = [], unplaced = [];

  for (const word of list) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const [dr, dc] = dirs[(rand() * dirs.length) | 0];
      const r0 = (rand() * n) | 0, c0 = (rand() * n) | 0;
      const r1 = r0 + dr * (word.length - 1), c1 = c0 + dc * (word.length - 1);
      if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue;
      let ok = true;
      for (let k = 0; k < word.length && ok; k++) {
        const cell = grid[(r0 + dr * k) * n + (c0 + dc * k)];
        if (cell !== '' && cell !== word[k]) ok = false;
      }
      if (!ok) continue;
      for (let k = 0; k < word.length; k++) grid[(r0 + dr * k) * n + (c0 + dc * k)] = word[k];
      placements.push({ word, r: r0, c: c0, dr, dc });
      placed = true;
    }
    if (!placed) unplaced.push(word);
  }
  for (let i = 0; i < grid.length; i++) if (grid[i] === '') grid[i] = ALPHABET[(rand() * ALPHABET.length) | 0];
  return { size: n, grid, placements, unplaced };
}

/** Cells on the straight line between two cells, or null if they are not aligned. */
export function lineCells(r0, c0, r1, c1) {
  const dr = r1 - r0, dc = c1 - c0;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr), sc = Math.sign(dc);
  return Array.from({ length: steps + 1 }, (_, k) => [r0 + sr * k, c0 + sc * k]);
}

/** Snap a free drag to the nearest of the 8 directions. Returns the end cell (row, col) of the snapped line. */
export function snapEnd(r0, c0, r, c, size) {
  const dr = r - r0, dc = c - c0;
  if (dr === 0 && dc === 0) return [r0, c0];
  const ang = Math.atan2(dr, dc), snapped = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
  const ur = Math.round(Math.sin(snapped)), uc = Math.round(Math.cos(snapped));
  const dist = Math.hypot(dr, dc) * Math.cos(ang - snapped) / Math.hypot(ur, uc);
  let steps = Math.max(0, Math.round(dist));
  while (steps > 0 && (r0 + ur * steps < 0 || r0 + ur * steps >= size || c0 + uc * steps < 0 || c0 + uc * steps >= size)) steps--;
  return [r0 + ur * steps, c0 + uc * steps];
}

/** Which placed word (if any) does this straight selection spell, forwards or backwards? */
export function matchSelection(puzzle, cells) {
  if (!cells || cells.length < 2) return null;
  const [rA, cA] = cells[0], [rB, cB] = cells[cells.length - 1];
  for (const p of puzzle.placements) {
    const rEnd = p.r + p.dr * (p.word.length - 1), cEnd = p.c + p.dc * (p.word.length - 1);
    const fwd = rA === p.r && cA === p.c && rB === rEnd && cB === cEnd;
    const back = rB === p.r && cB === p.c && rA === rEnd && cA === cEnd;
    if (fwd || back) return p.word;
  }
  return null;
}

export const placementCells = p =>
  Array.from({ length: p.word.length }, (_, k) => [p.r + p.dr * k, p.c + p.dc * k]);

/* ---------- shareable puzzles: everything lives in the link, no server ---------- */
const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export function encodePuzzle({ title = '', words, size = 0, level = 'medium', seed = 1, message = '' }) {
  return b64(JSON.stringify({ t: title, w: cleanWords(words), s: size, l: level, d: seed, m: message }));
}
export function decodePuzzle(code) {
  try {
    const o = JSON.parse(unb64(code));
    if (!Array.isArray(o.w) || o.w.length === 0) return null;
    return { title: String(o.t || ''), words: cleanWords(o.w), size: +o.s || 0, level: LEVELS.includes(o.l) ? o.l : 'medium', seed: +o.d || 1, message: String(o.m || '') };
  } catch { return null; }
}

export const hashString = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
