import { parseCode } from './books.js';

/** The games that work on any passage. Every one is started the same way: a passage code, then play. */
export const MODES = {
  fade:    { title: 'Fading blanks',  blurb: 'Words disappear stage by stage until you say it all.', weight: 14 },
  order:   { title: 'Word order',     blurb: 'Tap the shuffled phrases back into order.', weight: 9 },
  letters: { title: 'First letters',  blurb: 'Only the first letter of each word is shown.', weight: 14 },
  guess:   { title: 'Letter guess',   blurb: 'The verse is blank. Guess letters to reveal it.', weight: 10 },
  match:   { title: 'Match-up',       blurb: 'Pair beginnings with endings, and verses with their numbers.', weight: 8 },
  search:  { title: 'Word search',    blurb: 'Find the key words, then read the whole passage.', weight: 8 }
};
export const MODE_KEYS = Object.keys(MODES);

const enc = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const dec = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

export const encodeChallenge = o => enc(JSON.stringify(o));
export function decodeChallenge(code) {
  try {
    const o = JSON.parse(dec(code));
    if (!parseCode(o.p) || !MODES[o.m]) return null;
    return { p: o.p, m: o.m, n: String(o.n || '').slice(0, 40) };
  } catch { return null; }
}
export const challengeLink = o => `${location.origin}${location.pathname}#/bible/challenge/${encodeChallenge(o)}`;
