// Spot the difference: pictures are drawn from data, so no image files are stored or downloaded.
import { mulberry32 } from '../wordsearch/engine.js';

export const W = 640, H = 420;

export const THEMES = {
  village: { label: 'Village', top: '#aee0ff', bottom: '#eaf7ff', ground: '#86bd70', horizon: 255, sky: ['cloud', 'sun', 'bird', 'balloon', 'cloud'], land: ['house', 'tree', 'tree', 'flower', 'flower', 'fence', 'rock', 'house'] },
  night: { label: 'Night', top: '#0c1736', bottom: '#33437a', ground: '#1d3a30', horizon: 262, sky: ['moon', 'star', 'star', 'star', 'cloud', 'bat', 'star'], land: ['tower', 'tree', 'house', 'lantern', 'lantern', 'mushroom', 'tree'] },
  sea: { label: 'Under the sea', top: '#7dd3f7', bottom: '#1d6fa8', ground: '#e0c58a', horizon: 330, sky: ['fish', 'fish', 'bubble', 'bubble', 'jellyfish', 'fish', 'bubble'], land: ['seaweed', 'shell', 'starfish', 'crab', 'seaweed', 'rock', 'starfish'] },
  garden: { label: 'Garden', top: '#d6efff', bottom: '#f4fbff', ground: '#78b966', horizon: 235, sky: ['cloud', 'sun', 'butterfly', 'butterfly', 'bird', 'cloud'], land: ['flower', 'flower', 'mushroom', 'tree', 'flower', 'ladybug', 'rock', 'flower'] }
};
export const THEME_KEYS = Object.keys(THEMES);

export const SPOT_LEVELS = {
  easy:   { label: 'Easy',   count: 5, note: '5 differences, big ones.' },
  medium: { label: 'Medium', count: 7, note: '7 differences.' },
  hard:   { label: 'Hard',   count: 9, note: '9 differences, some very small.' }
};
export const SPOT_KEYS = Object.keys(SPOT_LEVELS);

const FLIPPABLE = new Set(['house', 'fish', 'bird', 'butterfly', 'tower', 'bat', 'crab']);
const VARIANT = new Set(['house', 'tree', 'flower', 'sun', 'tower']);
const NO_COLOR = new Set(['cloud', 'bubble', 'star', 'moon', 'rock', 'bat']);

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function bandFor(theme, isSky) {
  const t = THEMES[theme];
  return isSky ? [48, Math.max(90, t.horizon - 70)] : [t.horizon + 24, H - 26];
}

export function makeScene(theme, seed, extra = 0) {
  const t = THEMES[theme], rand = mulberry32(seed * 7919 + 17);
  const elements = [];
  const place = (type, isSky) => {
    const [y0, y1] = bandFor(theme, isSky);
    for (let k = 0; k < 220; k++) {
      const x = 48 + rand() * (W - 96), y = y0 + rand() * (y1 - y0);
      if (elements.every(e => dist(e, { x, y }) > 82)) {
        elements.push({ id: elements.length, type, x: Math.round(x), y: Math.round(y), s: +(0.85 + rand() * 0.4).toFixed(2), h: Math.round(rand() * 360), v: rand() < 0.5 ? 0 : 1, flip: rand() < 0.5 });
        return true;
      }
    }
    return false;
  };
  const skyN = 4 + (extra > 0 ? 1 : 0), landN = 6 + extra;
  for (let i = 0; i < skyN; i++) place(t.sky[(i + Math.floor(rand() * t.sky.length)) % t.sky.length], true);
  for (let i = 0; i < landN; i++) place(t.land[(i + Math.floor(rand() * t.land.length)) % t.land.length], false);
  return { theme, w: W, h: H, elements };
}

/** The same scene with `count` changes. Returns { a, b, diffs } where each diff has a centre and a tap radius. */
export function makeDifferences(theme, level, seed) {
  const cfg = SPOT_LEVELS[level] || SPOT_LEVELS.medium;
  const a = makeScene(theme, seed, level === 'hard' ? 2 : level === 'medium' ? 1 : 0);
  const rand = mulberry32(seed * 104729 + 31);
  const b = { ...a, elements: a.elements.map(e => ({ ...e })) };
  const diffs = [];
  const kindsFor = e => {
    const k = ['remove', 'size'];
    if (!NO_COLOR.has(e.type)) k.push('color');
    if (level !== 'easy') { k.push('move'); if (FLIPPABLE.has(e.type)) k.push('flip'); if (VARIANT.has(e.type)) k.push('variant'); }
    return k;
  };
  const order = a.elements.map(e => e.id).sort(() => rand() - 0.5);
  const mag = { easy: { hue: 120, grow: 1.6, shrink: 0.55, move: 0 }, medium: { hue: 70, grow: 1.4, shrink: 0.7, move: 20 }, hard: { hue: 38, grow: 1.22, shrink: 0.8, move: 13 } }[level] || { hue: 70, grow: 1.4, shrink: 0.7, move: 20 };

  const wantAdd = level === 'easy' ? 1 : 1;
  const wanted = cfg.count - wantAdd;
  for (const id of order) {
    if (diffs.length >= wanted) break;
    const e = b.elements.find(x => x.id === id);
    if (diffs.some(d => dist(d, e) < 96)) continue;
    const kind = kindsFor(e)[Math.floor(rand() * kindsFor(e).length)];
    const r = Math.round(30 * e.s + 14);
    if (kind === 'remove') { b.elements = b.elements.filter(x => x.id !== id); diffs.push({ id, kind, x: e.x, y: e.y - 20, r }); continue; }
    if (kind === 'color') e.h = (e.h + (rand() < 0.5 ? 1 : -1) * mag.hue + 360) % 360;
    else if (kind === 'size') e.s = +(e.s * (rand() < 0.5 ? mag.grow : mag.shrink)).toFixed(2);
    else if (kind === 'move') { const ang = rand() * Math.PI * 2; e.x += Math.round(Math.cos(ang) * mag.move); e.y += Math.round(Math.sin(ang) * mag.move); }
    else if (kind === 'flip') e.flip = !e.flip;
    else if (kind === 'variant') e.v = e.v ? 0 : 1;
    diffs.push({ id, kind, x: e.x, y: e.y - 20, r });
  }
  // one extra object that only the second picture has
  const t = THEMES[theme];
  for (let k = 0; k < 400 && diffs.length < cfg.count; k++) {
    const isSky = rand() < 0.45, [y0, y1] = bandFor(theme, isSky);
    const p = { x: Math.round(48 + rand() * (W - 96)), y: Math.round(y0 + rand() * (y1 - y0)) };
    if (b.elements.some(e => dist(e, p) < 80) || a.elements.some(e => dist(e, p) < 80) || diffs.some(d => dist(d, p) < 96)) continue;
    const pool = isSky ? t.sky : t.land;
    const type = pool[Math.floor(rand() * pool.length)];
    const id = 1000 + diffs.length;
    b.elements.push({ id, type, x: p.x, y: p.y, s: level === 'hard' ? 0.8 : 1, h: Math.round(rand() * 360), v: 0, flip: false });
    diffs.push({ id, kind: 'add', x: p.x, y: p.y - 20, r: 42 });
  }
  return { a, b, diffs };
}
