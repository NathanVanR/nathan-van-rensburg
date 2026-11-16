// The 66 books, their chapter counts, and a forgiving reference parser used by every Bible game.
export const BOOKS = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34], ['Joshua', 24], ['Judges', 21], ['Ruth', 4],
  ['1 Samuel', 31], ['2 Samuel', 24], ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10],
  ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8],
  ['Isaiah', 66], ['Jeremiah', 52], ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9],
  ['Obadiah', 1], ['Jonah', 4], ['Micah', 7], ['Nahum', 3], ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14],
  ['Malachi', 4], ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16], ['1 Corinthians', 16],
  ['2 Corinthians', 13], ['Galatians', 6], ['Ephesians', 6], ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5],
  ['2 Thessalonians', 3], ['1 Timothy', 6], ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5],
  ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1], ['3 John', 1], ['Jude', 1], ['Revelation', 22]
].map(([name, chapters], i) => ({ n: i + 1, name, chapters }));

export const bookByNumber = n => BOOKS[n - 1];

const squash = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIASES = {
  gn: 1, ge: 1, ex: 2, exo: 2, lv: 3, le: 3, nm: 4, nu: 4, dt: 5, de: 5, jos: 6, jsh: 6, jdg: 7, jg: 7, ru: 8, rth: 8,
  '1sa': 9, '1sm': 9, '2sa': 10, '2sm': 10, '1ki': 11, '1kg': 11, '2ki': 12, '2kg': 12, '1ch': 13, '2ch': 14, ezr: 15, ne: 16,
  es: 17, est: 17, jb: 18, ps: 19, psa: 19, psalm: 19, pr: 20, prv: 20, pro: 20, ec: 21, ecc: 21, ss: 22, sos: 22, song: 22,
  songofsongs: 22, isa: 23, is: 23, jer: 24, je: 24, la: 25, lam: 25, eze: 26, ezk: 26, da: 27, dn: 27, ho: 28, jl: 29, joe: 29,
  am: 30, ob: 31, oba: 31, jnh: 32, jon: 32, mi: 33, mic: 33, na: 34, nah: 34, hab: 35, hb: 35, zep: 36, zp: 36, hag: 37, hg: 37,
  zec: 38, zc: 38, mal: 39, ml: 39, mt: 40, mat: 40, mk: 41, mr: 41, lk: 42, lu: 42, jn: 43, jhn: 43, ac: 44, ro: 45, rom: 45, rm: 45,
  '1co': 46, '1cor': 46, '2co': 47, '2cor': 47, ga: 48, gal: 48, eph: 49, ep: 49, php: 50, phil: 50, pp: 50, col: 51, co: 51,
  '1th': 52, '1thess': 52, '2th': 53, '2thess': 53, '1ti': 54, '1tim': 54, '2ti': 55, '2tim': 55, tit: 56, ti: 56,
  phm: 57, phlm: 57, philem: 57, heb: 58, he: 58, jas: 59, jm: 59, '1pe': 60, '1pt': 60, '1pet': 60, '2pe': 61, '2pt': 61, '2pet': 61,
  '1jn': 62, '1jo': 62, '1john': 62, '2jn': 63, '2jo': 63, '3jn': 64, '3jo': 64, jud: 65, jde: 65, re: 66, rev: 66, rv: 66
};
const ROMAN = { i: '1', ii: '2', iii: '3', first: '1', second: '2', third: '3' };

export function findBook(text) {
  let q = text.trim().toLowerCase().replace(/\./g, '');
  q = q.replace(/^(iii|ii|i|first|second|third)\s+/, (_, m) => ROMAN[m] + ' ');
  const s = squash(q);
  if (!s) return null;
  if (ALIASES[s]) return BOOKS[ALIASES[s] - 1];
  const exact = BOOKS.find(b => squash(b.name) === s);
  if (exact) return exact;
  if (s.length >= 3) return BOOKS.find(b => squash(b.name).startsWith(s)) || null;
  return null;
}

/** A reference is { book, chapter, from, to }. from/to are null for a whole chapter. */
export function makeRef(book, chapter, from = null, to = null) {
  if (from && !to) to = from;
  return { book, chapter, from: from || null, to: from ? to : null };
}

/**
 * Accepts "John 3", "John 3:16-18", "Ps 23 v1-6", "1 Cor 13", and, with a book already chosen, the short
 * forms "ch3" and "ch3v16-18". Returns a ref or null.
 */
export function parseRef(text, currentBook = null) {
  const t = text.trim();
  if (!t) return null;
  let m = t.match(/^(?:ch|chapter)\s*\.?\s*(\d+)\s*(?:v|vs|verses?|:)?\s*(?:(\d+)(?:\s*[-–to]+\s*(\d+))?)?$/i);
  if (m && currentBook) return validate(makeRef(currentBook, +m[1], m[2] ? +m[2] : null, m[3] ? +m[3] : null));
  m = t.match(/^(.*?[a-zA-Z.])\s*(\d+)\s*(?:(?::|v|vs|verses?|\.)\s*(\d+)(?:\s*[-–]\s*(?:v\s*)?(\d+))?)?$/i);
  if (!m) return null;
  const b = findBook(m[1]);
  if (!b) return null;
  return validate(makeRef(b.n, +m[2], m[3] ? +m[3] : null, m[4] ? +m[4] : null));
}

function validate(ref) {
  const b = BOOKS[ref.book - 1];
  if (!b || ref.chapter < 1 || ref.chapter > b.chapters) return null;
  if (ref.from && (ref.to < ref.from)) return null;
  return ref;
}

export function refLabel(ref) {
  const b = BOOKS[ref.book - 1];
  if (!ref.from) return `${b.name} ${ref.chapter}`;
  return ref.to === ref.from ? `${b.name} ${ref.chapter}:${ref.from}` : `${b.name} ${ref.chapter}:${ref.from}-${ref.to}`;
}
/** The standard short form used on the picker: ch3 or ch3v16-18. */
export function refShort(ref) {
  if (!ref.from) return `ch${ref.chapter}`;
  return ref.to === ref.from ? `ch${ref.chapter}v${ref.from}` : `ch${ref.chapter}v${ref.from}-${ref.to}`;
}
export const refCode = ref => `${ref.book}.${ref.chapter}` + (ref.from ? `.${ref.from}-${ref.to}` : '');
export function parseCode(code) {
  const m = String(code || '').match(/^(\d+)\.(\d+)(?:\.(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;
  return validate(makeRef(+m[1], +m[2], m[3] ? +m[3] : null, m[4] ? +m[4] : null));
}
export const verseKey = (ref, n) => `${ref.book}.${ref.chapter}.${n}`;
