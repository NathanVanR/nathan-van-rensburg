import { useMemo, useRef, useState } from 'react';
import { GameTop, PauseCover, useGameTimer, fmt } from '../shared/timer.jsx';
import { refLabel, refShort, parseCode } from './books.js';
import { usePassage } from './Passage.jsx';
import { recordVerse, levelFor, load } from './store.js';
import { MODES, challengeLink } from './challenge.js';
import Fade from './games/Fade.jsx';
import Order from './games/Order.jsx';
import Letters from './games/Letters.jsx';
import Guess from './games/Guess.jsx';
import Match from './games/Match.jsx';

const GAMES = { fade: Fade, order: Order, letters: Letters, guess: Guess };

async function share(text, flash) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); flash('Copied'); } catch { window.prompt('Copy this', text); }
}

/** One play-through of a game over a passage: verse by verse, with pause, XP and spaced-review scheduling. */
export default function Session({ code, mode, navigate, from }) {
  const cfg = MODES[mode];
  const state = usePassage(code);
  const ref = useMemo(() => parseCode(code), [code]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('play');         // play | result | done
  const [last, setLast] = useState(null);
  const [toast, setToast] = useState('');
  const [round, setRound] = useState(0);
  const tt = useRef(0);
  const timer = useGameTimer({ running: state.status === 'ready' && phase !== 'done' });
  const { secs, paused } = timer;
  const flash = m => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(''), 1800); };

  if (state.status === 'loading') return <div className="screen"><p className="screen-sub">Opening {ref ? refLabel(ref) : 'passage'}…</p></div>;
  if (state.status === 'error') return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">Could not open that passage</h1>
      <p className="screen-sub">{state.message}</p>
      <button className="primary big" onClick={() => navigate('/bible')}>Choose another passage</button>
    </div>
  );

  const { passage } = state;
  const verses = passage.verses, n = verses.length, whole = mode === 'match';
  const verse = verses[idx];
  const label = refLabel(ref);

  const record = (v, score) => recordVerse(ref.book, ref.chapter, v.n, passage.total, score, cfg.weight);
  const done = list => { setResults(list); setPhase('done'); };

  const handleDone = score => {
    if (score === null) {                              // skipped
      const list = [...results, { n: verse.n, skipped: true }];
      if (idx + 1 >= n) return done(list);
      setResults(list); setIdx(idx + 1); return;
    }
    const r = record(verse, score);
    const list = [...results, { n: verse.n, score, gained: r.gained, box: r.box }];
    setResults(list); setLast(list[list.length - 1]); setPhase('result');
  };
  const nextVerse = () => {
    if (idx + 1 >= n) return done(results);
    setIdx(idx + 1); setPhase('play');
  };
  const handleMatch = score => {
    const list = verses.map(v => { const r = record(v, score); return { n: v.n, score, gained: r.gained, box: r.box }; });
    done(list);
  };

  const scored = results.filter(r => !r.skipped);
  const avg = scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : 0;
  const xp = scored.reduce((a, r) => a + r.gained, 0);
  const lvl = levelFor(load().xp);
  const resultText = `I played ${cfg.title} on ${label} (KJV): ${Math.round(avg * 100)}% in ${fmt(secs)}. Can you beat it?\n${challengeLink({ p: code, m: mode })}`;
  const again = () => { setIdx(0); setResults([]); setLast(null); setPhase('play'); setRound(r => r + 1); timer.setSecs(0); };

  const Game = GAMES[mode];
  return (
    <div className="screen bible-game">
      <GameTop title={label} sub={whole ? cfg.title : `${cfg.title} · verse ${verse?.n} (${idx + 1} of ${n})`} secs={secs} paused={paused}
        onToggle={timer.toggle} onBack={() => navigate('/bible')} done={phase === 'done'} />

      <div className="pausable bible-area">
        {paused && <PauseCover onResume={() => timer.setPaused(false)} />}
        {phase === 'play' && whole && <Match key={round} verses={verses} paused={paused} onFinish={handleMatch} />}
        {phase === 'play' && !whole && <Game key={`${round}-${verse.n}`} verse={verse} paused={paused} onDone={handleDone} />}
        {phase === 'result' && last && (
          <div className="verse-done">
            <p className="verse-text"><sup>{verse.n}</sup> {verse.text}</p>
            <p className="score-line"><b>{Math.round(last.score * 100)}%</b> · +{last.gained} XP · {last.score >= 0.8 ? 'a good one. We will bring it back for review.' : 'we will bring this one back tomorrow.'}</p>
            <div className="actions"><button className="primary" onClick={nextVerse}>{idx + 1 >= n ? 'Finish' : 'Next verse'}</button></div>
          </div>
        )}
      </div>

      {phase === 'play' && !whole && n > 1 && (
        <div className="session-foot"><button className="quiet" onClick={() => done(results)}>End session</button></div>
      )}
      {toast && <div className="toast">{toast}</div>}

      {phase === 'done' && (
        <div className="overlay">
          <div className="dialog result">
            <h2>{scored.length ? 'Well done' : 'Session ended'}</h2>
            {scored.length > 0 ? (
              <>
                <p>{scored.length} verse{scored.length > 1 ? 's' : ''}, {Math.round(avg * 100)}% on average, {fmt(secs)}.</p>
                <p className="small">+{xp} XP · level {lvl.level} · {refShort(ref)} is now in your review schedule.</p>
              </>
            ) : <p>Nothing was recorded this time.</p>}
            <div className="dialog-actions stack">
              <button className="primary" onClick={again}>Play again</button>
              <button onClick={() => navigate('/bible')}>Choose another game</button>
              <button onClick={() => share(resultText, flash)}>Challenge a friend</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
