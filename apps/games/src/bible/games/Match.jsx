import { useMemo, useState } from 'react';
import { tokens, phrases, shuffle } from '../text.js';

const pairsFor = verses => {
  if (verses.length >= 2) {
    return verses.filter(v => tokens(v.text).length >= 4).slice(0, 5).map(v => {
      const w = tokens(v.text), k = Math.min(5, Math.floor(w.length / 2));
      return { id: v.n, left: w.slice(0, k).join(' ') + '…', right: '…' + w.slice(k).join(' '), label: `Verse ${v.n}` };
    });
  }
  const ph = phrases(verses[0].text);                // one verse: what comes next?
  const out = [];
  for (let i = 0; i < ph.length - 1 && out.length < 5; i++) out.push({ id: i, left: ph[i], right: ph[i + 1], label: `Part ${i + 1}` });
  return out;
};

/** Match-up: pair openings with endings, then say which verse a passage of text is. */
export default function Match({ verses, onFinish, paused }) {
  const pairs = useMemo(() => pairsFor(verses), [verses]);
  const seed = verses[0].n * 13 + verses.length;
  const rightOrder = useMemo(() => shuffle(pairs.map(p => p.id), seed), [pairs]);
  const quiz = useMemo(() => (verses.length >= 2 ? shuffle(verses, seed + 1).slice(0, 5) : []), [verses]);

  const [phase, setPhase] = useState('pairs');
  const [matched, setMatched] = useState(() => new Set());
  const [pick, setPick] = useState(null);
  const [bad, setBad] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [rights, setRights] = useState(0);
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState(null);

  const tapLeft = id => { if (!paused && !matched.has(id)) setPick(id); };
  const tapRight = id => {
    if (paused || pick === null || matched.has(id)) return;
    if (pick === id) {
      const next = new Set(matched); next.add(id); setMatched(next); setPick(null); setRights(r => r + 1);
      if (next.size === pairs.length) setTimeout(() => (quiz.length ? setPhase('quiz') : finish(rights + 1, mistakes)), 500);
    } else {
      setMistakes(m => m + 1); setBad(id); setTimeout(() => setBad(null), 500); setPick(null);
    }
  };

  const finish = (r, m) => onFinish(Math.max(0.2, r / Math.max(1, r + m)));

  const options = useMemo(() => {
    if (phase !== 'quiz') return [];
    const v = quiz[qi], others = shuffle(verses.filter(x => x.n !== v.n).map(x => x.n), seed + qi).slice(0, 3);
    return shuffle([v.n, ...others], seed + 7 + qi).sort((a, b) => a - b);
  }, [phase, qi]);
  const choose = n => {
    if (paused || answer !== null) return;
    const right = n === quiz[qi].n;
    setAnswer(n);
    const r = rights + (right ? 1 : 0), m = mistakes + (right ? 0 : 1);
    setRights(r); setMistakes(m);
    setTimeout(() => {
      setAnswer(null);
      if (qi + 1 >= quiz.length) finish(r, m); else setQi(qi + 1);
    }, 1100);
  };

  if (phase === 'quiz') {
    const v = quiz[qi];
    return (
      <div className="match">
        <p className="verse-ref">Which verse is this? ({qi + 1} of {quiz.length})</p>
        <p className="verse-text quote">{v.text}</p>
        <div className="options">
          {options.map(n => (
            <button key={n} className={answer === null ? '' : n === v.n ? 'right' : n === answer ? 'wrong' : ''} onClick={() => choose(n)}>Verse {n}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="match">
      <p className="verse-ref">{verses.length >= 2 ? 'Match each beginning to its ending.' : 'Match each part to the part that follows it.'}</p>
      <div className="match-cols">
        <div className="col">
          {pairs.map(p => (
            <button key={p.id} className={'chip' + (matched.has(p.id) ? ' good' : '') + (pick === p.id ? ' on' : '')} disabled={matched.has(p.id)} onClick={() => tapLeft(p.id)}>{p.left}</button>
          ))}
        </div>
        <div className="col">
          {rightOrder.map(id => {
            const p = pairs.find(x => x.id === id);
            return <button key={id} className={'chip' + (matched.has(id) ? ' good' : '') + (bad === id ? ' bad' : '')} disabled={matched.has(id)} onClick={() => tapRight(id)}>{p.right}</button>;
          })}
        </div>
      </div>
      <p className="small">Tap one on the left, then its match on the right. Mistakes: {mistakes}.</p>
    </div>
  );
}
