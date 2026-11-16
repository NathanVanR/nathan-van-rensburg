import { useMemo, useState } from 'react';
import { phrases, shuffle } from '../text.js';

/** Word order: phrases of the verse are shuffled; tap them back into place. */
export default function Order({ verse, onDone }) {
  const pieces = useMemo(() => phrases(verse.text), [verse]);
  const start = useMemo(() => {
    let k = 0, s;
    do { s = shuffle(pieces.map((_, i) => i), verse.n * 31 + k++); } while (s.every((v, i) => v === i) && k < 6);
    return s;
  }, [pieces]);
  const [placed, setPlaced] = useState([]);          // piece indices in the order you set them
  const [flash, setFlash] = useState([]);            // positions that were wrong, shown red for a moment
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [won, setWon] = useState(false);

  const tray = start.filter(i => !placed.includes(i));
  const ok = pos => pieces[placed[pos]] === pieces[pos];

  const evaluate = next => {
    const bad = next.map((p, pos) => (pieces[p] === pieces[pos] ? -1 : pos)).filter(x => x >= 0);
    if (!bad.length) { setWon(true); return next; }
    setMistakes(m => m + 1); setFlash(bad);
    setTimeout(() => { setFlash([]); setPlaced(cur => cur.slice(0, bad[0])); }, 900);
    return next;
  };
  const add = i => {
    if (won || flash.length) return;
    const next = [...placed, i];
    setPlaced(next);
    if (next.length === pieces.length) evaluate(next);
  };
  const remove = pos => { if (!won && !flash.length) setPlaced(placed.filter((_, k) => k !== pos)); };
  const hint = () => {
    if (won || flash.length) return;
    let cur = placed;
    const firstBad = cur.findIndex((p, pos) => pieces[p] !== pieces[pos]);
    if (firstBad >= 0) cur = cur.slice(0, firstBad);
    const need = pieces[cur.length];
    const idx = start.find(i => !cur.includes(i) && pieces[i] === need);
    if (idx === undefined) return;
    const next = [...cur, idx];
    setHints(h => h + 1); setPlaced(next);
    if (next.length === pieces.length) evaluate(next);
  };
  const score = Math.max(0.3, 1 - mistakes * 0.12 - hints * 0.08);

  return (
    <div className="order">
      <p className="verse-ref"><sup>{verse.n}</sup> Put the phrases in order.</p>
      <div className="answer-line" aria-label="Your answer">
        {placed.length === 0 && <span className="small">Tap a phrase below to start.</span>}
        {placed.map((p, pos) => (
          <button key={pos} className={'chip placed' + (flash.includes(pos) ? ' bad' : won || ok(pos) ? ' good' : '')} onClick={() => remove(pos)}>{pieces[p]}</button>
        ))}
      </div>
      <div className="tray" aria-label="Phrases to place">
        {tray.map(i => <button key={i} className="chip" onClick={() => add(i)}>{pieces[i]}</button>)}
      </div>
      {won ? (
        <div className="actions"><b className="good-line">In order.</b><button className="primary" onClick={() => onDone(score)}>Continue</button></div>
      ) : (
        <div className="actions"><button onClick={hint}>Hint{hints ? ` (${hints})` : ''}</button><button className="quiet" onClick={() => setPlaced([])}>Clear</button><button className="quiet" onClick={() => onDone(null)}>Skip verse</button></div>
      )}
    </div>
  );
}
