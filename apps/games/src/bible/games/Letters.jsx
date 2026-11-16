import { useMemo, useState } from 'react';
import { tokens, firstLetters, accuracy } from '../text.js';
import Recall from '../Recall.jsx';

/** First letters: only the first letter of each word is shown. Say the verse, then check. */
export default function Letters({ verse, onDone }) {
  const words = useMemo(() => tokens(verse.text), [verse]);
  const letters = useMemo(() => firstLetters(verse.text), [verse]);
  const [shown, setShown] = useState(0);
  const [hints, setHints] = useState(0);
  const [typed, setTyped] = useState('');
  const [acc, setAcc] = useState(null);

  const hint = () => { if (shown >= words.length) return; setShown(s => Math.min(words.length, s + 3)); setHints(h => h + 1); };
  const score = a => Math.max(0, a - Math.min(0.4, hints * 0.05));

  if (acc !== null) return <Recall verse={verse} typed={typed} acc={acc} onRetry={() => setAcc(null)} onContinue={() => onDone(score(acc))} />;
  return (
    <div className="letters">
      <p className="verse-text initials">
        <sup>{verse.n}</sup>{' '}
        {letters.map((l, i) => <span key={i} className={i < shown ? 'revealed' : ''}>{i < shown ? words[i] : l} </span>)}
      </p>
      <textarea className="recite" rows={4} value={typed} onChange={e => setTyped(e.target.value)} placeholder="Say the verse in full, then type it here" autoCapitalize="sentences" spellCheck={false} />
      <div className="actions">
        <button className="primary" onClick={() => setAcc(accuracy(typed, verse.text))} disabled={!typed.trim()}>Check</button>
        <button onClick={hint}>Hint{hints ? ` (${hints})` : ''}</button>
        <button className="quiet" onClick={() => onDone(null)}>Skip verse</button>
      </div>
    </div>
  );
}
