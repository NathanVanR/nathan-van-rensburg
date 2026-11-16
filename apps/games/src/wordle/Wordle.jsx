import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Keyboard from '../shared/Keyboard.jsx';
import { GameTop, PauseCover, useGameTimer, fmt } from '../shared/timer.jsx';
import { ROUNDS, dayNumber, evaluate, keyStates, makeAnswer, isValidGuess, themedCategories, MESSAGES, shareText } from './engine.js';
import { randomSeed } from '../wordsearch/packs.js';

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const STATS = 'games.wordle.stats';
const blankStats = () => ({ played: 0, won: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] });

async function share(text, flash) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); flash('Result copied'); } catch { window.prompt('Copy your result', text); }
}

export default function Wordle({ path, navigate }) {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'daily') return <Play key="daily" navigate={navigate} mode="daily" />;
  if (parts[0] === 'random' && parts[1]) return <Play key={path} navigate={navigate} mode="random" seed={+parts[1]} />;
  if (parts[0] === 'cat' && parts[1] && parts[2]) return <Play key={path} navigate={navigate} mode="cat" cat={parts[1]} seed={+parts[2]} />;
  return <Home navigate={navigate} />;
}

function Home({ navigate }) {
  const day = dayNumber();
  const today = store.get(`games.wordle.g.daily-${day}`);
  const stats = store.get(STATS) || blankStats();
  const cats = useMemo(themedCategories, []);
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/')}>‹ Games</button>
      <h1 className="screen-title">Wordle</h1>
      <p className="screen-sub">Guess the five-letter word in six tries. Green is right, gold is the wrong place.</p>

      <button className="feature-card" onClick={() => navigate('/wordle/daily')}>
        <span className="kicker">Today's word</span>
        <b>{today?.status === 'won' ? 'Solved' : today?.status === 'lost' ? 'Not this time' : today?.guesses?.length ? 'In progress' : 'Play the daily word'}</b>
        <span>{today && today.status !== 'playing' ? 'Come back tomorrow for a new word.' : 'The same word for everyone today.'}</span>
      </button>
      <button className="feature-card ink" onClick={() => navigate('/wordle/random/' + randomSeed())}>
        <span className="kicker">Practice</span>
        <b>A random word</b>
        <span>As many as you like.</span>
      </button>

      <h2 className="section">Themed words</h2>
      <p className="small">The answer comes from a category. Any real word still counts as a guess.</p>
      <div className="pack-grid">
        {cats.map(c => (
          <button key={c.id} className="pack-card" onClick={() => navigate(`/wordle/cat/${c.id}/${randomSeed()}`)}>
            <b>{c.title}</b><small>{c.count} possible words</small>
          </button>
        ))}
      </div>

      <h2 className="section">Your record</h2>
      <div className="stat-row">
        <div><b>{stats.played}</b><small>Played</small></div>
        <div><b>{stats.played ? Math.round((stats.won / stats.played) * 100) : 0}%</b><small>Won</small></div>
        <div><b>{stats.streak}</b><small>Streak</small></div>
        <div><b>{stats.best}</b><small>Best streak</small></div>
      </div>
    </div>
  );
}

function Play({ navigate, mode, seed = 0, cat }) {
  const day = dayNumber();
  const id = mode === 'daily' ? `daily-${day}` : mode === 'cat' ? `cat-${cat}-${seed}` : `random-${seed}`;
  const key = 'games.wordle.g.' + id;
  const answer = useMemo(() => makeAnswer({ mode, seed, cat, day }), [mode, seed, cat, day]);
  const saved = useMemo(() => store.get(key), [key]);
  const title = mode === 'daily' ? 'Wordle · Daily' : mode === 'cat' ? 'Wordle · ' + (themedCategories().find(c => c.id === cat)?.title || 'Theme') : 'Wordle';

  const [guesses, setGuesses] = useState(saved?.guesses || []);
  const [cur, setCur] = useState('');
  const [status, setStatus] = useState(saved?.status || 'playing');
  const [reveal, setReveal] = useState(-1);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState(false);
  const timer = useGameTimer({ running: status === 'playing', initial: saved?.secs || 0 });
  const { secs, paused } = timer;
  const busy = useRef(false);
  const curRef = useRef('');
  const setCurBoth = v => { curRef.current = v; setCur(v); };
  const toastTimer = useRef(0);

  const flash = m => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 1800); };
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const persist = (g, s, t) => store.set(key, { guesses: g, status: s, secs: t });
  useEffect(() => { if (status === 'playing' && secs % 5 === 0) persist(guesses, status, secs); }, [secs]);
  useEffect(() => { if (status !== 'playing') setDialog(true); }, []); // reopening a finished game shows the result

  const finish = (g, won) => {
    const st = store.get(STATS) || blankStats();
    st.played++; if (won) { st.won++; st.streak++; st.best = Math.max(st.best, st.streak); st.dist[g.length - 1]++; } else st.streak = 0;
    store.set(STATS, st);
  };

  const submit = useCallback(() => {
    if (busy.current || status !== 'playing' || paused) return;
    const cur = curRef.current;
    if (cur.length < 5) { setShake(true); setTimeout(() => setShake(false), 450); flash('Not enough letters'); return; }
    if (!isValidGuess(cur)) { setShake(true); setTimeout(() => setShake(false), 450); flash('Not in the word list'); return; }
    const g = [...guesses, cur];
    const won = cur === answer, lost = !won && g.length >= ROUNDS;
    setGuesses(g); setCurBoth(''); setReveal(g.length - 1);
    busy.current = true;
    const s = won ? 'won' : lost ? 'lost' : 'playing';
    persist(g, s, secs);
    setTimeout(() => {
      busy.current = false; setReveal(-1);
      if (s !== 'playing') { setStatus(s); finish(g, won); setDialog(true); }
    }, 5 * 280 + 650);
  }, [guesses, status, paused, answer, secs]);

  const onKey = useCallback(k => {
    if (status !== 'playing' || paused || busy.current) return;
    if (k === 'ENTER') submit();
    else if (k === 'BACK') setCurBoth(curRef.current.slice(0, -1));
    else if (/^[A-Z]$/.test(k)) { if (curRef.current.length < 5) setCurBoth(curRef.current + k); }
  }, [status, paused, submit]);

  useEffect(() => {
    const f = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') onKey('ENTER');
      else if (e.key === 'Backspace') onKey('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  }, [onKey]);

  const states = keyStates(status === 'playing' && reveal >= 0 ? guesses.slice(0, -1) : guesses, answer);
  const rows = Array.from({ length: ROUNDS }, (_, r) => {
    if (r < guesses.length) return { word: guesses[r], done: true, res: evaluate(guesses[r], answer), live: r === reveal };
    if (r === guesses.length && status === 'playing') return { word: cur.padEnd(5, ' '), done: false, shake };
    return { word: '     ', done: false };
  });
  const won = status === 'won';
  const label = mode === 'daily' ? 'Wordle daily' : mode === 'cat' ? title : 'Wordle';
  const again = () => (mode === 'cat' ? navigate(`/wordle/cat/${cat}/${randomSeed()}`) : navigate('/wordle/random/' + randomSeed()));

  return (
    <div className="screen wordle">
      <GameTop title={title} sub={`${guesses.length} of ${ROUNDS} guesses`} secs={secs} paused={paused}
        onToggle={timer.toggle} onBack={() => navigate('/wordle')} done={status !== 'playing'} />
      <div className="pausable wordle-area">
        {paused && <PauseCover onResume={() => timer.setPaused(false)} />}
        <div className="wordle-grid">
          {rows.map((row, r) => (
            <div key={r} className={'wrow' + (row.shake ? ' shake' : '')}>
              {row.word.split('').map((ch, i) => (
                <span key={i} style={{ '--i': i }}
                  className={'tile' + (ch.trim() ? ' filled' : '') + (row.done ? ' ' + row.res[i] + (row.live ? ' reveal' : ' static') : '')}>{ch.trim()}</span>
              ))}
            </div>
          ))}
        </div>
        <Keyboard onKey={onKey} states={states} disabled={status !== 'playing' || paused} />
      </div>
      {toast && <div className="toast">{toast}</div>}

      {dialog && status !== 'playing' && (
        <div className="overlay" onClick={() => setDialog(false)}>
          <div className="dialog result" onClick={e => e.stopPropagation()}>
            <h2>{won ? MESSAGES[Math.min(guesses.length, 6) - 1] : 'The word was'}</h2>
            {!won && <p className="answer-word">{answer}</p>}
            <p>{won ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}, ${fmt(secs)}.` : 'Better luck next time.'}</p>
            <div className="dialog-actions">
              <button className="primary" onClick={() => share(shareText({ title: label, guesses, answer, won, secs }), flash)}>Share</button>
              {mode === 'daily'
                ? <button onClick={() => navigate('/wordle')}>Done</button>
                : <button onClick={again}>Another word</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
