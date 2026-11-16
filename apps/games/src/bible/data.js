// KJV text, one JSON file per book, loaded on demand (and cached offline by the service worker).
import { BOOKS } from './books.js';

const files = import.meta.glob('./kjv/*.json');
const cache = new Map();

export async function loadChapter(book, chapter) {
  let b = cache.get(book);
  if (!b) {
    const load = files[`./kjv/${String(book).padStart(2, '0')}.json`];
    if (!load) throw new Error('Book not found');
    b = (await load()).default;
    cache.set(book, b);
  }
  return b[chapter - 1];
}

/** Resolve a reference to its verses: { ref, verses: [{ n, text }], total }. */
export async function loadPassage(ref) {
  const all = await loadChapter(ref.book, ref.chapter);
  if (!all) throw new Error('Chapter not found');
  const total = all.length, from = ref.from || 1, to = ref.to || total;
  if (from > total || to > total) throw new Error(`${BOOKS[ref.book - 1].name} ${ref.chapter} has only ${total} verses.`);
  return { ref, total, verses: all.slice(from - 1, to).map((text, i) => ({ n: from + i, text })) };
}
