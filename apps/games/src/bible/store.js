// Bible memory progress: XP, streak, and spaced review. All stored on the device.
const KEY = 'games.bible.progress';
export const INTERVALS = [1, 1, 3, 7, 14, 30];          // days until review, indexed by the box a verse lands in
export const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

export const blank = () => ({ xp: 0, streak: 0, best: 0, lastDay: 0, srs: {}, chapters: {}, recent: [], passage: null });

export function nextSrs(entry, ok, today) {
  const was = entry?.box ?? 0;
  const box = ok ? Math.min(5, was + 1) : Math.max(0, was - 1);
  return { box, due: today + (ok ? INTERVALS[box] : 1), last: today, seen: (entry?.seen || 0) + 1 };
}

export function levelFor(xp) {
  const level = 1 + Math.floor(Math.sqrt(xp / 40));
  const base = 40 * (level - 1) ** 2, next = 40 * level ** 2;
  return { level, into: xp - base, span: next - base };
}

export function bumpStreak(p, today) {
  if (p.lastDay === today) return p;
  p.streak = p.lastDay === today - 1 ? p.streak + 1 : 1;
  p.lastDay = today;
  p.best = Math.max(p.best || 0, p.streak);
  return p;
}

/** The streak as it should be shown today: it only counts if you played today or yesterday. */
export const liveStreak = (p, today = dayNum()) => (p.lastDay === today || p.lastDay === today - 1 ? p.streak : 0);

export const dueEntries = (p, today = dayNum()) =>
  Object.entries(p.srs).filter(([, e]) => e.due <= today).sort((a, b) => a[1].due - b[1].due || a[1].box - b[1].box).map(([key, e]) => ({ key, ...e }));

export const learnedCount = p => Object.values(p.srs).filter(e => e.box >= 3).length;

export function load() {
  try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return blank(); }
}
export function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } }

/** Record how well a verse went (score 0 to 1). Returns the XP earned and the verse's new box. */
export function recordVerse(book, chapter, n, total, score, weight = 10) {
  const p = load(), today = dayNum();
  const key = `${book}.${chapter}.${n}`;
  p.srs[key] = nextSrs(p.srs[key], score >= 0.8, today);
  p.chapters[`${book}.${chapter}`] = total;
  const gained = Math.round(weight * (0.4 + 0.6 * score));
  p.xp += gained;
  bumpStreak(p, today);
  save(p);
  return { gained, box: p.srs[key].box };
}

export function addXp(amount) {
  const p = load(); p.xp += amount; bumpStreak(p, dayNum()); save(p); return amount;
}

export function setPassage(code) {
  const p = load(); p.passage = code;
  p.recent = [code, ...(p.recent || []).filter(c => c !== code)].slice(0, 6);
  save(p);
}

/** Famous single verses, one per day. */
export const VERSE_OF_THE_DAY = [
  '43.3.16', '19.23.1', '20.3.5', '45.8.28', '24.29.11', '23.41.10', '50.4.13', '40.6.33', '6.1.9', '19.46.1', '45.12.2', '49.2.8',
  '19.119.105', '40.11.28', '43.14.6', '48.5.22', '50.4.6', '23.40.31', '19.27.1', '1.1.1', '43.1.1', '62.4.8', '46.13.4', '20.16.3',
  '19.121.1', '45.5.8', '58.11.1', '59.1.2', '60.5.7', '19.34.8', '40.5.16', '19.37.4', '19.91.1', '23.26.3', '49.6.10', '51.3.23',
  '52.5.16', '56.2.11', '24.17.7', '45.15.13', '47.5.17', '48.2.20', '50.4.8', '19.19.14', '19.51.10', '19.139.14', '20.18.10',
  '21.3.1', '23.53.5', '40.28.20', '41.12.30', '42.1.37', '43.8.12', '43.15.5', '44.1.8', '46.10.13', '52.5.17', '54.4.12', '58.4.12',
  '62.1.9', '66.3.20', '5.31.6', '6.24.15', '19.100.4', '19.16.11', '20.22.6', '23.55.8', '33.6.8', '40.7.7', '43.10.10', '45.1.16'
];
export const verseOfTheDay = (today = dayNum()) => VERSE_OF_THE_DAY[today % VERSE_OF_THE_DAY.length];
