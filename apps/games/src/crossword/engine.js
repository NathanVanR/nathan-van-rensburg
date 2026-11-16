import { mulberry32, cleanWords } from '../wordsearch/engine.js';

/** Crossword levels: how many words, how long they are. */
export const CW_LEVELS = {
  easy:   { label: 'Easy',   count: 7,  min: 3, max: 7,  note: '7 short words.' },
  medium: { label: 'Medium', count: 10, min: 4, max: 8,  note: '10 words.' },
  hard:   { label: 'Hard',   count: 12, min: 4, max: 10, note: '12 words, some long.' }
};
export const CW_KEYS = Object.keys(CW_LEVELS);

export function pickCrosswordWords(bank, level, seed) {
  const cfg = CW_LEVELS[level] || CW_LEVELS.medium;
  const rand = mulberry32(seed ^ 0x51ed270b);
  const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; [x[i], x[j]] = [x[j], x[i]]; } return x; };
  return shuffle(cleanWords(bank).filter(w => w.length >= cfg.min && w.length <= cfg.max)).slice(0, cfg.count);
}

const key = (r, c) => r + ',' + c;

function canPlace(cells, word, r, c, dir) {
  const dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0, pr = dc, pc = dr;
  if (cells.has(key(r - dr, c - dc)) || cells.has(key(r + dr * word.length, c + dc * word.length))) return -1;
  let cross = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i, cc = c + dc * i, cell = cells.get(key(rr, cc));
    if (cell) { if (cell.ch !== word[i] || cell.dirs.has(dir)) return -1; cross++; }
    else if (cells.has(key(rr + pr, cc + pc)) || cells.has(key(rr - pr, cc - pc))) return -1;
  }
  return cross;
}

function put(cells, placed, word, r, c, dir) {
  const dr = dir === 'D' ? 1 : 0, dc = dir === 'A' ? 1 : 0;
  for (let i = 0; i < word.length; i++) {
    const k = key(r + dr * i, c + dc * i), cell = cells.get(k);
    if (cell) cell.dirs.add(dir); else cells.set(k, { ch: word[i], dirs: new Set([dir]) });
  }
  placed.push({ word, r, c, dir });
}

function attempt(order, rand) {
  const cells = new Map(), placed = [], unplaced = [];
  put(cells, placed, order[0], 0, 0, 'A');
  const box = () => {
    let r0 = 1e9, r1 = -1e9, c0 = 1e9, c1 = -1e9;
    for (const k of cells.keys()) { const [r, c] = k.split(',').map(Number); if (r < r0) r0 = r; if (r > r1) r1 = r; if (c < c0) c0 = c; if (c > c1) c1 = c; }
    return [r0, r1, c0, c1];
  };
  for (const word of order.slice(1)) {
    const [br0, br1, bc0, bc1] = box();
    let best = [], bestKey = null;
    for (const [k, cell] of cells) {
      const [cr, cc] = k.split(',').map(Number);
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== cell.ch) continue;
        for (const dir of ['A', 'D']) {
          const r = cr - (dir === 'D' ? i : 0), c = cc - (dir === 'A' ? i : 0);
          const s = canPlace(cells, word, r, c, dir);
          if (s < 1) continue;
          const r1 = r + (dir === 'D' ? word.length - 1 : 0), c1 = c + (dir === 'A' ? word.length - 1 : 0);
          const h = Math.max(br1, r1) - Math.min(br0, r) + 1, w = Math.max(bc1, c1) - Math.min(bc0, c) + 1;
          const rank = Math.max(h, w) * 100 + h * w - s * 3;           // stay compact, reward crossings
          if (bestKey === null || rank < bestKey) { bestKey = rank; best = [[r, c, dir]]; } else if (rank === bestKey) best.push([r, c, dir]);
        }
      }
    }
    if (best.length) { const [r, c, dir] = best[(rand() * best.length) | 0]; put(cells, placed, word, r, c, dir); }
    else unplaced.push(word);
  }
  return { placed, unplaced };
}

/** Build a crossword where every word crosses at least one other. Deterministic for a given seed. */
export function generateCrossword(words, seed = 1, tries = 120) {
  const list = [...new Set(words)];
  let best = null;
  for (let t = 0; t < tries; t++) {
    const rand = mulberry32(seed * 977 + t);
    const sorted = list.slice().sort((a, b) => b.length - a.length);
    const rest = sorted.slice(1).sort(() => rand() - 0.5);
    const res = attempt([sorted[0], ...rest], rand);
    const rows = res.placed.map(p => p.r), cols = res.placed.map(p => p.c);
    const h = Math.max(...res.placed.map(p => p.r + (p.dir === 'D' ? p.word.length : 1))) - Math.min(...rows);
    const w = Math.max(...res.placed.map(p => p.c + (p.dir === 'A' ? p.word.length : 1))) - Math.min(...cols);
    res.area = Math.max(h, w) * 1000 + h * w;                  // prefer a squarish, compact grid
    if (!best || res.unplaced.length < best.unplaced.length || (res.unplaced.length === best.unplaced.length && res.area < best.area)) best = res;
    if (best.unplaced.length === 0 && t >= 15) break;
  }
  return finalize(best);
}

function finalize({ placed, unplaced }) {
  const r0 = Math.min(...placed.map(p => p.r)), c0 = Math.min(...placed.map(p => p.c));
  const slots = placed.map(p => ({ dir: p.dir, r: p.r - r0, c: p.c - c0, len: p.word.length, word: p.word }));
  const rows = Math.max(...slots.map(s => s.r + (s.dir === 'D' ? s.len : 1)));
  const cols = Math.max(...slots.map(s => s.c + (s.dir === 'A' ? s.len : 1)));
  const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
  for (const s of slots) for (let i = 0; i < s.len; i++) grid[s.r + (s.dir === 'D' ? i : 0)][s.c + (s.dir === 'A' ? i : 0)] = s.word[i];
  // number the starting cells in reading order
  const starts = [...new Set(slots.map(s => s.r * 1000 + s.c))].sort((a, b) => a - b);
  const num = new Map(starts.map((v, i) => [v, i + 1]));
  slots.forEach(s => { s.n = num.get(s.r * 1000 + s.c); });
  slots.sort((a, b) => a.n - b.n || (a.dir < b.dir ? -1 : 1));
  return { rows, cols, grid, slots, unplaced };
}

export const slotCells = s => Array.from({ length: s.len }, (_, i) => [s.r + (s.dir === 'D' ? i : 0), s.c + (s.dir === 'A' ? i : 0)]);
