import { useEffect, useMemo, useState } from 'react';
import Keyboard from '../../shared/Keyboard.jsx';
import { tokens } from '../text.js';

/** Letter guess: the verse is blank. Guess letters to reveal it before you run out of lives. */
export default function Guess({ verse, onDone, paused }) {
  const words = useMemo(() => tokens(verse.text), [verse]);
  const inVerse = useMemo(() => new Set(verse.text.toUpperCase().replace(/[^A-Z]/g, '')), [verse]);
  const lives = words.length > 25 ? 10 : words.length > 14 ? 8 : 6;
  const [guessed, setGuessed] = useState(() => new Set());
  const [wrong, setWrong] = useState(0);

  const solved = [...inVerse].every(l => guessed.has(l));
  const lost = wrong >= lives;
  const over = solved || lost;

  const guess = l => {
    if (over || paused || guessed.has(l)) return;
    setGuessed(g => new Set(g).add(l));
    if (!inVerse.has(l)) setWrong(w => w + 1);
  };
  const revealWord = () => {
    if (over || paused) return;
    const w = words.find(x => [...x.toUpperCase().replace(/[^A-Z]/g, '')].some(l => !guessed.has(l)));
    if (!w) return;
    setGuessed(g => { const n = new Set(g); w.toUpperCase().replace(/[^A-Z]/g, '').split('').forEach(l => n.add(l)); return n; });
    setWrong(x => x + 1);
  };
  useEffect(() => {
    const f = e => { if (!e.metaKey && !e.ctrlKey && !e.altKey && /^[a-zA-Z]$/.test(e.key)) guess(e.key.toUpperCase()); };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  });

  const states = {};
  guessed.forEach(l => { states[l] = inVerse.has(l) ? 'correct' : 'absent'; });
  const score = lost ? 0.2 : Math.max(0.4, 1 - (wrong / lives) * 0.6);

  return (
    <div className="guess">
      <div className="lives" aria-label={`${lives - wrong} lives left`}>
        {Array.from({ length: lives }, (_, i) => <span key={i} className={i < lives - wrong ? 'on' : ''} />)}
        <small>{Math.max(0, lives - wrong)} lives left</small>
      </div>
      <p className="verse-text guessline">
        <sup>{verse.n}</sup>{' '}
        {words.map((w, i) => (
          <span key={i} className="gw">
            {w.split('').map((ch, k) => {
              const up = ch.toUpperCase();
              if (!/[A-Z]/.test(up)) return <span key={k}>{ch}</span>;
              const open = guessed.has(up) || lost;
              return <span key={k} className={'gl' + (open ? ' open' : '') + (lost && !guessed.has(up) ? ' missed' : '')}>{open ? ch : ''}</span>;
            })}{' '}
          </span>
        ))}
      </p>
      {over ? (
        <div className="actions">
          <b className={solved ? 'good-line' : 'bad-line'}>{solved ? 'Revealed.' : 'Out of lives. Here is the verse.'}</b>
          <button className="primary" onClick={() => onDone(score)}>Continue</button>
        </div>
      ) : (
        <>
          <Keyboard onKey={guess} states={states} disabled={paused} simple />
          <div className="actions"><button onClick={revealWord}>Reveal a word (costs a life)</button><button className="quiet" onClick={() => onDone(null)}>Skip verse</button></div>
        </>
      )}
    </div>
  );
}
