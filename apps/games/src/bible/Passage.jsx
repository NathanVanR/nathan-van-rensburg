import { useEffect, useMemo, useState } from 'react';
import { BOOKS, makeRef, refLabel, refShort, parseCode } from './books.js';
import { loadPassage } from './data.js';

/** Load a passage from a ref code like "43.3.16-18". */
export function usePassage(code) {
  const ref = useMemo(() => parseCode(code), [code]);
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let off = false;
    if (!ref) { setState({ status: 'error', message: 'That passage is not valid.' }); return; }
    setState({ status: 'loading' });
    loadPassage(ref)
      .then(passage => { if (!off) setState({ status: 'ready', passage }); })
      .catch(e => { if (!off) setState({ status: 'error', message: e.message || 'Could not load that passage.' }); });
    return () => { off = true; };
  }, [code]);
  return state;
}

/**
 * The one way every Bible game picks what to play: a book, a chapter, and optionally a range of verses.
 */
export function PassagePicker({ value, onChange }) {
  const [book, setBook] = useState(value?.book ?? 43);
  const [chapter, setChapter] = useState(value?.chapter ?? 3);
  const [from, setFrom] = useState(value?.from ?? '');
  const [to, setTo] = useState(value?.to ?? '');
  const [error, setError] = useState('');
  const b = BOOKS[book - 1];

  useEffect(() => {          // follow the outside value (verse of the day, a window, a recent passage)
    if (!value) return;
    setBook(value.book); setChapter(value.chapter); setFrom(value.from ?? ''); setTo(value.to ?? '');
  }, [value?.book, value?.chapter, value?.from, value?.to]);

  const emit = (bk, ch, f, t) => {
    const fi = f === '' ? null : +f, ti = t === '' ? null : +t;
    if (fi && fi < 1) return setError('Verse numbers start at 1.');
    if (fi && ti && ti < fi) return setError('The last verse must come after the first.');
    if (!fi && ti) return setError('Add a first verse as well.');
    setError('');
    onChange(makeRef(bk, ch, fi, fi ? ti || fi : null));
  };
  const pickBook = n => { setBook(n); setChapter(1); setFrom(''); setTo(''); emit(n, 1, '', ''); };
  const pickChapter = n => { setChapter(n); setFrom(''); setTo(''); emit(book, n, '', ''); };
  const setVerse = (f, t) => { setFrom(f); setTo(t); emit(book, chapter, f, t); };

  const current = makeRef(book, chapter, from === '' ? null : +from, from === '' ? null : +(to || from));
  return (
    <div className="picker">
      <div className="picker-row">
        <label className="field"><span>Book</span>
          <select value={book} onChange={e => pickBook(+e.target.value)}>
            {BOOKS.map(x => <option key={x.n} value={x.n}>{x.name}</option>)}
          </select>
        </label>
        <label className="field narrow"><span>Chapter</span>
          <select value={chapter} onChange={e => pickChapter(+e.target.value)}>
            {Array.from({ length: b.chapters }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
      </div>
      <div className="picker-row">
        <label className="field narrow"><span>From verse</span>
          <input inputMode="numeric" value={from} onChange={e => setVerse(e.target.value.replace(/\D/g, ''), e.target.value === '' ? '' : to)} placeholder="all" />
        </label>
        <label className="field narrow"><span>To verse</span>
          <input inputMode="numeric" value={to} disabled={from === ''} onChange={e => setVerse(from, e.target.value.replace(/\D/g, ''))} placeholder="same" />
        </label>
        <div className="picked" aria-live="polite">
          <small>Selected</small>
          <b>{refLabel(current)}</b>
          <small>{refShort(current)}</small>
        </div>
      </div>
      {error && <p className="small warn">{error}</p>}
    </div>
  );
}
