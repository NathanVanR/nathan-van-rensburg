import { useEffect, useMemo, useRef, useState } from 'react';
import {
  generate, cleanWords, lineCells, snapEnd, matchSelection, placementCells,
  encodePuzzle, decodePuzzle, hashString, LEVELS, SIZES
} from './engine.js';
import { PACKS, packById, dailyDef, buildRound, LEVEL_CFG, LEVEL_KEYS, randomSeed } from './packs.js';

const COLORS = ['#b8412f', '#2f6aa8', '#2f8a63', '#b8892b', '#7a4a9c', '#c0567c', '#3b8a96', '#8a6a3a'];
const LEVEL_NOTE = { easy: 'Across and down', medium: 'Plus diagonals', hard: 'Every direction, backwards too' };
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};

export const linkFor = def => `${location.origin}${location.pathname}#/ws/p/${encodePuzzle(def)}`;

async function shareOrCopy(url, title, flash) {
  try {
    if (navigator.share) { await navigator.share({ title, text: title, url }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); flash('Link copied'); }
  catch { window.prompt('Copy this link', url); }
}

const getLevel = () => { const l = store.get('games.ws.level'); return LEVEL_KEYS.includes(l) ? l : 'medium'; };
const bumpStat = cat => { if (!cat) return; const st = store.get('games.ws.stats') || {}; st[cat] = (st[cat] || 0) + 1; store.set('games.ws.stats', st); };

export default function WordSearch({ path, navigate }) {
  const parts = path.split('/').filter(Boolean); // after "ws"
  if (parts[0] === 'make') return <Maker navigate={navigate} />;
  if (parts[0] === 'daily') {
    const level = LEVEL_KEYS.includes(parts[1]) ? parts[1] : getLevel();
    return <Play key={'daily' + level} def={dailyDef(level)} back="/ws" navigate={navigate} cat="daily" />;
  }
  if (parts[0] === 'pack') {
    const pack = packById(parts[1]);
    if (!pack) return <Home navigate={navigate} />;
    const level = LEVEL_KEYS.includes(parts[2]) ? parts[2] : null;
    const seed = +parts[3] || 0;
    if (!level || !seed) return <Redirect to={`/ws/pack/${pack.id}/${level || getLevel()}/${randomSeed()}`} />;
    return <Play key={path} def={buildRound(pack, level, seed)} back="/ws" navigate={navigate} cat={pack.id}
      again={() => navigate(`/ws/pack/${pack.id}/${level}/${randomSeed()}`)} />;
  }
  if (parts[0] === 'p') {
    const def = decodePuzzle(parts.slice(1).join('/'));
    if (!def) return <BadLink navigate={navigate} />;
    return <Play key={path} def={def} back="/ws" navigate={navigate} shared />;
  }
  return <Home navigate={navigate} />;
}

function Redirect({ to }) {
  useEffect(() => { location.replace('#' + to); }, [to]);
  return null;
}

function BadLink({ navigate }) {
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/ws')}>‹ Word search</button>
      <h1 className="screen-title">That link is broken</h1>
      <p className="screen-sub">The puzzle could not be read. Ask for the link again, or make a fresh puzzle.</p>
      <button className="primary big" onClick={() => navigate('/ws/make')}>Make a puzzle</button>
    </div>
  );
}

/* ------------------------------------------------------------------ home */
function Home({ navigate }) {
  const [level, setLevelState] = useState(getLevel);
  const setLevel = l => { setLevelState(l); store.set('games.ws.level', l); };
  const daily = dailyDef(level);
  const dailyKey = 'games.ws.' + hashString(JSON.stringify([cleanWords(daily.words), daily.size, daily.level, daily.seed, daily.title, daily.message]));
  const dailyDone = store.get(dailyKey)?.done;
  const stats = store.get('games.ws.stats') || {};
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/')}>‹ Games</button>
      <h1 className="screen-title">Word search</h1>
      <p className="screen-sub">Swipe across the letters. Or tap the first and last letter of a word.</p>

      <div className="field">
        <span>Level</span>
        <div className="seg" role="radiogroup" aria-label="Level">
          {LEVEL_KEYS.map(k => (
            <button key={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{LEVEL_CFG[k].label}</button>
          ))}
        </div>
        <small>{LEVEL_CFG[level].note}</small>
      </div>

      <button className="feature-card" onClick={() => navigate('/ws/daily/' + level)}>
        <span className="kicker">Today's puzzle</span>
        <b>{daily.title.replace('Daily · ', '')}</b>
        <span>{dailyDone ? 'Solved. Come back tomorrow for a new one.' : 'A new puzzle every day, the same for everyone.'}</span>
      </button>

      <h2 className="section">Choose a category</h2>
      <p className="small">Every round picks a fresh set of words from the category.</p>
      <div className="pack-grid">
        {PACKS.map(p => (
          <button key={p.id} className="pack-card" onClick={() => navigate(`/ws/pack/${p.id}/${level}/${randomSeed()}`)}>
            <b>{p.title}</b><small>{p.blurb}</small>
            {stats[p.id] > 0 && <span className="tick" title="Rounds solved">{stats[p.id]} solved</span>}
          </button>
        ))}
      </div>

      <h2 className="section">Make one for someone</h2>
      <button className="feature-card ink" onClick={() => navigate('/ws/make')}>
        <span className="kicker">Your own words</span>
        <b>Create a puzzle and send it as a link</b>
        <span>Names, in-jokes, a message at the end. No account needed.</span>
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- maker */
function Maker({ navigate }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [size, setSize] = useState('medium');
  const [level, setLevel] = useState('medium');
  const [message, setMessage] = useState('');
  const [made, setMade] = useState(null);
  const [toast, setToast] = useState('');
  const words = useMemo(() => cleanWords(text.split(/[\n,;]+/)), [text]);
  const ok = words.length >= 3;

  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const create = () => {
    const def = { title: title.trim() || 'A puzzle for you', words, size: SIZES[size], level, seed: 1 + Math.floor(Math.random() * 2 ** 30), message: message.trim() };
    setMade({ def, url: linkFor(def) });
  };

  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/ws')}>‹ Word search</button>
      <h1 className="screen-title">Make a puzzle</h1>
      <p className="screen-sub">Type some words. We hide them in a grid and give you a link to send.</p>

      <div className="form">
        <label className="field"><span>Title</span>
          <input value={title} maxLength={60} onChange={e => setTitle(e.target.value)} placeholder="Happy birthday, Nikki" />
        </label>
        <label className="field"><span>Words <em>(commas or new lines, 3 to 20 letters each)</em></span>
          <textarea rows={6} value={text} onChange={e => setText(e.target.value)} placeholder={'love\ncoffee\nsunsets\nour first trip'} />
          <small className={ok ? 'good' : ''}>{words.length} word{words.length === 1 ? '' : 's'} ready{ok ? '' : ' (add at least 3)'}. Spaces and punctuation are removed.</small>
        </label>

        <div className="field"><span>Grid size</span>
          <div className="seg" role="radiogroup">
            {Object.keys(SIZES).map(k => <button key={k} role="radio" aria-checked={size === k} className={size === k ? 'on' : ''} onClick={() => setSize(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
          </div>
        </div>
        <div className="field"><span>Difficulty</span>
          <div className="seg" role="radiogroup">
            {LEVELS.map(k => <button key={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{k[0].toUpperCase() + k.slice(1)}</button>)}
          </div>
          <small>{LEVEL_NOTE[level]}</small>
        </div>

        <label className="field"><span>Message at the end <em>(optional)</em></span>
          <textarea rows={3} value={message} maxLength={280} onChange={e => setMessage(e.target.value)} placeholder="Shown when the last word is found." />
        </label>

        <button className="primary big" disabled={!ok} onClick={create}>Create puzzle</button>
      </div>

      {made && (
        <div className="made">
          <h2>Ready to send</h2>
          <p className="small">Everything is inside this link, so anyone who opens it gets the same puzzle.</p>
          <input className="linkbox" readOnly value={made.url} onFocus={e => e.target.select()} />
          <div className="row">
            <button className="primary" onClick={() => shareOrCopy(made.url, made.def.title, flash)}>Share link</button>
            <button onClick={async () => { try { await navigator.clipboard.writeText(made.url); flash('Link copied'); } catch { window.prompt('Copy this link', made.url); } }}>Copy</button>
            <button onClick={() => navigate('/ws/p/' + encodePuzzle(made.def))}>Play it first</button>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ play */
export function Play({ def, back, navigate, shared, cat, again, onSolved }) {
  const key = JSON.stringify([cleanWords(def.words), def.size, def.level, def.seed, def.title, def.message]);
  const puzzle = useMemo(() => generate(def), [key]);
  const id = hashString(key), storeKey = 'games.ws.' + id;
  const n = puzzle.size, total = puzzle.placements.length;

  const [found, setFound] = useState(() => store.get(storeKey)?.found || []);
  const [secs, setSecs] = useState(() => store.get(storeKey)?.secs || 0);
  const [done, setDone] = useState(() => !!store.get(storeKey)?.done);
  const [hints, setHints] = useState(() => store.get(storeKey)?.hints || 0);
  const [sel, setSel] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [hint, setHint] = useState(null);
  const [paused, setPaused] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [toast, setToast] = useState('');
  const gridRef = useRef(null);

  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const save = patch => store.set(storeKey, { found, secs, done, hints, ...patch });

  useEffect(() => {
    if (done || paused) return;
    const t = setInterval(() => { if (!document.hidden) setSecs(s => s + 1); }, 1000);
    return () => clearInterval(t);
  }, [done, paused]);
  useEffect(() => { if (paused) save({ secs }); }, [paused]);
  useEffect(() => { if (secs % 5 === 0) save({ secs }); }, [secs]);

  const addFound = word => {
    if (found.includes(word)) { flash('Already found'); return; }
    const next = [...found, word];
    setFound(next);
    navigator.vibrate?.(12);
    const finished = next.length === total;
    if (finished) { setDone(true); setOverlay(true); bumpStat(cat); if (onSolved) onSolved({ secs, hints }); }
    save({ found: next, done: finished });
  };

  const cellAt = e => {
    const r = gridRef.current.getBoundingClientRect();
    const c = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    const rr = Math.min(n - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * n)));
    return [rr, c];
  };
  const down = e => {
    if (done || paused) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [r, c] = cellAt(e);
    setSel({ r0: r, c0: c, r1: r, c1: c });
  };
  const move = e => {
    if (!sel) return;
    const [r, c] = cellAt(e);
    const [r1, c1] = snapEnd(sel.r0, sel.c0, r, c, n);
    if (r1 !== sel.r1 || c1 !== sel.c1) setSel({ ...sel, r1, c1 });
  };
  const up = () => {
    if (!sel) return;
    const { r0, c0, r1, c1 } = sel;
    setSel(null);
    if (r0 === r1 && c0 === c1) {                       // a tap: first tap anchors, second tap completes
      if (anchor && !(anchor[0] === r0 && anchor[1] === c0)) {
        const w = matchSelection(puzzle, lineCells(anchor[0], anchor[1], r0, c0));
        setAnchor(null);
        if (w) addFound(w); else flash('Not a word. Try again.');
      } else setAnchor(anchor ? null : [r0, c0]);
      return;
    }
    setAnchor(null);
    const w = matchSelection(puzzle, lineCells(r0, c0, r1, c1));
    if (w) addFound(w);
  };

  const giveHint = () => {
    if (paused) return;
    const open = puzzle.placements.filter(p => !found.includes(p.word));
    if (!open.length || done) return;
    const p = open[Math.floor(Math.random() * open.length)];
    setHint({ r: p.r, c: p.c, word: p.word });
    setHints(h => { save({ hints: h + 1 }); return h + 1; });
    setTimeout(() => setHint(null), 3200);
  };
  const reset = () => { setFound([]); setDone(false); setSecs(0); setHints(0); setOverlay(false); store.set(storeKey, null); };

  const foundPlacements = found.map(w => puzzle.placements.find(p => p.word === w)).filter(Boolean);
  const caps = foundPlacements.map((p, k) => ({ cells: placementCells(p), color: COLORS[k % COLORS.length] }));
  const selCells = sel ? lineCells(sel.r0, sel.c0, sel.r1, sel.c1) : null;
  const words = puzzle.placements.map(p => p.word).sort();
  const url = linkFor(def);

  const cap = (cells, color, key, opacity = 0.42) => {
    const [a, b] = [cells[0], cells[cells.length - 1]];
    return <line key={key} x1={a[1] + 0.5} y1={a[0] + 0.5} x2={b[1] + 0.5} y2={b[0] + 0.5} stroke={color} strokeWidth=".78" strokeLinecap="round" opacity={opacity} />;
  };

  return (
    <div className="screen ws-play">
      <div className="ws-top">
        <button className="back" onClick={() => navigate(back)}>‹ Back</button>
        <div className="ws-title"><b>{def.title}</b><small>{found.length} of {total} found</small></div>
        <button className={'ws-time' + (paused ? ' paused' : '')} onClick={() => !done && setPaused(p => !p)} disabled={done}
          aria-label={paused ? 'Resume timer' : 'Pause timer'}>
          <span className="t">{fmt(secs)}</span>
          {paused
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>}
        </button>
      </div>

      <div className="ws-main">
        <div className="ws-board">
          {paused && (
            <button className="ws-pause-cover" onClick={() => setPaused(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
              <b>Paused</b>
              <span>Tap to resume</span>
            </button>
          )}
          <div ref={gridRef} className="ws-grid" style={{ '--n': n }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setSel(null)}>
            {puzzle.grid.map((ch, i) => {
              const r = (i / n) | 0, c = i % n;
              const isAnchor = anchor && anchor[0] === r && anchor[1] === c;
              const isHint = hint && hint.r === r && hint.c === c;
              return <span key={i} className={'ws-cell' + (isAnchor ? ' anchor' : '') + (isHint ? ' hint' : '')}>{ch}</span>;
            })}
            <svg className="ws-overlay" viewBox={`0 0 ${n} ${n}`} aria-hidden="true">
              {caps.map((k, i) => cap(k.cells, k.color, 'f' + i))}
              {selCells && selCells.length > 1 && cap(selCells, '#a8822f', 'sel', 0.55)}
            </svg>
          </div>
        </div>

        <aside className="ws-side">
          <ul className="wordlist">
            {words.map(w => {
              const k = found.indexOf(w);
              return (
                <li key={w} className={k >= 0 ? 'found' : ''}>
                  <span className="dot" style={k >= 0 ? { background: COLORS[k % COLORS.length] } : null} />
                  <span>{w}</span>
                </li>
              );
            })}
          </ul>
          {puzzle.unplaced.length > 0 && <p className="small warn">{puzzle.unplaced.length} word{puzzle.unplaced.length > 1 ? 's' : ''} did not fit and {puzzle.unplaced.length > 1 ? 'were' : 'was'} left out.</p>}
          <div className="ws-actions">
            <button onClick={giveHint} disabled={done || paused}>Hint{hints ? ` (${hints})` : ''}</button>
            <button onClick={() => shareOrCopy(url, def.title, flash)}>Share</button>
            {again ? <button className="quiet" onClick={again}>New round</button> : <button className="quiet" onClick={reset}>Start over</button>}
          </div>
          {hint && <p className="small">Look for <b>{hint.word}</b>. Its first letter is glowing.</p>}
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {done && overlay && (
        <div className="overlay" onClick={() => setOverlay(false)}>
          <div className="dialog result" onClick={e => e.stopPropagation()}>
            <svg className="done-mark" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="26" className="draw" pathLength="1" />
              <path d="M19 33l9 9 18-20" className="draw d2" pathLength="1" />
            </svg>
            <h2>All {total} found</h2>
            <p>{fmt(secs)}{hints ? `, ${hints} hint${hints > 1 ? 's' : ''}` : ', no hints'}.</p>
            {def.message && <blockquote className="msg">{def.message}</blockquote>}
            <div className="dialog-actions">
              {again
                ? <button className="primary" onClick={again}>Another round</button>
                : <button className="primary" onClick={() => navigate('/ws/make')}>{shared ? 'Make one back' : 'Make your own'}</button>}
              <button onClick={() => setOverlay(false)}>View grid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
