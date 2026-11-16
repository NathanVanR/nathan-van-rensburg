import { useEffect, useMemo, useRef, useState } from 'react';
import Keyboard from '../shared/Keyboard.jsx';
import { GameTop, PauseCover, useGameTimer, fmt } from '../shared/timer.jsx';
import { PACKS, packById, randomSeed } from '../wordsearch/packs.js';
import { CW_LEVELS, CW_KEYS, generateCrossword, pickCrosswordWords, slotCells } from './engine.js';

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const getLevel = () => { const l = store.get('games.cw.level'); return CW_KEYS.includes(l) ? l : 'easy'; };

export default function Crossword({ path, navigate }) {
  const parts = path.split('/').filter(Boolean);
  const pack = packById(parts[0]);
  if (pack && CW_KEYS.includes(parts[1]) && +parts[2]) {
    return <Play key={path} pack={pack} level={parts[1]} seed={+parts[2]} navigate={navigate} />;
  }
  return <Home navigate={navigate} />;
}

function Home({ navigate }) {
  const [level, setLevelState] = useState(getLevel);
  const setLevel = l => { setLevelState(l); store.set('games.cw.level', l); };
  const stats = store.get('games.cw.stats') || {};
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/')}>‹ Games</button>
      <h1 className="screen-title">Crossword</h1>
      <p className="screen-sub">A fill-in crossword: every word is in the list, you work out where it goes.</p>
      <div className="field">
        <span>Level</span>
        <div className="seg" role="radiogroup" aria-label="Level">
          {CW_KEYS.map(k => <button key={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{CW_LEVELS[k].label}</button>)}
        </div>
        <small>{CW_LEVELS[level].note}</small>
      </div>
      <h2 className="section">Choose a category</h2>
      <p className="small">Every puzzle uses a fresh set of words from the category.</p>
      <div className="pack-grid">
        {PACKS.map(p => (
          <button key={p.id} className="pack-card" onClick={() => navigate(`/crossword/${p.id}/${level}/${randomSeed()}`)}>
            <b>{p.title}</b><small>{p.blurb}</small>
            {stats[p.id] > 0 && <span className="tick">{stats[p.id]} solved</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function Play({ pack, level, seed, navigate }) {
  const cw = useMemo(() => generateCrossword(pickCrosswordWords(pack.words, level, seed), seed), [pack, level, seed]);
  const { rows, cols, grid, slots } = cw;
  const [entry, setEntry] = useState(() => grid.map(r => r.map(() => '')));
  const [sel, setSel] = useState(() => ({ r: slots[0].r, c: slots[0].c, dir: slots[0].dir }));
  const [wrong, setWrong] = useState(() => new Set());
  const [hints, setHints] = useState(0);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState(false);
  const timer = useGameTimer({ running: !done });
  const { secs, paused } = timer;
  const wrongTimer = useRef(0);
  useEffect(() => () => clearTimeout(wrongTimer.current), []);

  // which slot covers each cell, per direction
  const cover = useMemo(() => {
    const m = {};
    slots.forEach((s, i) => slotCells(s).forEach(([r, c]) => { (m[r + ',' + c] ??= {})[s.dir] = i; }));
    return m;
  }, [slots]);
  const slotAt = (r, c, dir) => { const e = cover[r + ',' + c]; return e && e[dir] !== undefined ? slots[e[dir]] : null; };
  const active = slotAt(sel.r, sel.c, sel.dir);
  const activeCells = new Set(active ? slotCells(active).map(([r, c]) => r + ',' + c) : []);

  const tapCell = (r, c) => {
    if (paused || done || !grid[r][c]) return;
    const e = cover[r + ',' + c];
    if (sel.r === r && sel.c === c && e.A !== undefined && e.D !== undefined) setSel({ r, c, dir: sel.dir === 'A' ? 'D' : 'A' });
    else setSel({ r, c, dir: e[sel.dir] !== undefined ? sel.dir : sel.dir === 'A' ? 'D' : 'A' });
  };

  const check = next => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] && next[r][c] !== grid[r][c]) return false;
    return true;
  };
  const apply = next => {
    setEntry(next);
    if (!done && check(next)) {
      setDone(true); setDialog(true);
      const st = store.get('games.cw.stats') || {}; st[pack.id] = (st[pack.id] || 0) + 1; store.set('games.cw.stats', st);
    }
  };
  const step = (dr, dc) => setSel(s => (grid[s.r + dr]?.[s.c + dc] ? { ...s, r: s.r + dr, c: s.c + dc } : s));
  const nextSlot = () => {
    const i = active ? slots.indexOf(active) : -1, n = slots[(i + 1) % slots.length];
    setSel({ r: n.r, c: n.c, dir: n.dir });
  };

  const onKey = k => {
    if (paused || done) return;
    setWrong(new Set());
    if (k === 'ENTER') return nextSlot();
    const next = entry.map(r => r.slice());
    const dr = sel.dir === 'D' ? 1 : 0, dc = sel.dir === 'A' ? 1 : 0;
    if (k === 'BACK') {
      if (next[sel.r][sel.c]) { next[sel.r][sel.c] = ''; apply(next); }
      else if (grid[sel.r - dr]?.[sel.c - dc]) { next[sel.r - dr][sel.c - dc] = ''; apply(next); step(-dr, -dc); }
      return;
    }
    next[sel.r][sel.c] = k; apply(next); step(dr, dc);
  };

  useEffect(() => {
    const f = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') onKey('ENTER');
      else if (e.key === 'Backspace') onKey('BACK');
      else if (e.key === 'ArrowRight') step(0, 1); else if (e.key === 'ArrowLeft') step(0, -1);
      else if (e.key === 'ArrowDown') step(1, 0); else if (e.key === 'ArrowUp') step(-1, 0);
      else if (/^[a-zA-Z]$/.test(e.key)) onKey(e.key.toUpperCase());
    };
    addEventListener('keydown', f);
    return () => removeEventListener('keydown', f);
  });

  const hint = () => {
    if (paused || done) return;
    let r = sel.r, c = sel.c;
    if (entry[r][c] === grid[r][c]) {            // current cell is already right: use the first empty cell of the active word
      const cell = active && slotCells(active).find(([rr, cc]) => entry[rr][cc] !== grid[rr][cc]);
      if (!cell) return; [r, c] = cell;
    }
    const next = entry.map(row => row.slice()); next[r][c] = grid[r][c];
    setHints(h => h + 1); apply(next);
  };
  const checkBoard = () => {
    if (paused || done) return;
    const bad = new Set();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (entry[r][c] && entry[r][c] !== grid[r][c]) bad.add(r + ',' + c);
    setWrong(bad); clearTimeout(wrongTimer.current); wrongTimer.current = setTimeout(() => setWrong(new Set()), 2500);
  };
  const place = word => {
    if (paused || done || !active || active.len !== word.length) return;
    const next = entry.map(r => r.slice());
    slotCells(active).forEach(([r, c], i) => { next[r][c] = word[i]; });
    setWrong(new Set()); apply(next);
  };

  const pattern = active ? slotCells(active).map(([r, c]) => entry[r][c] || '_').join(' ') : '';
  const words = useMemo(() => slots.map(s => s.word).sort((a, b) => a.length - b.length || (a < b ? -1 : 1)), [slots]);
  const used = new Set(slots.filter(s => slotCells(s).every(([r, c]) => entry[r][c])).map(s => slotCells(s).map(([r, c]) => entry[r][c]).join('')));
  const numbers = new Map(slots.map(s => [s.r + ',' + s.c, s.n]));
  const filled = entry.flat().filter(Boolean).length, total = grid.flat().filter(Boolean).length;

  return (
    <div className="screen cw">
      <GameTop title={pack.title} sub={`${CW_LEVELS[level].label} · ${filled} of ${total} letters`} secs={secs} paused={paused}
        onToggle={timer.toggle} onBack={() => navigate('/crossword')} done={done} />

      <div className="pausable cw-area">
        {paused && <PauseCover onResume={() => timer.setPaused(false)} />}
        <div className="cw-grid" style={{ '--cols': cols, '--rows': rows }}>
          {grid.map((row, r) => row.map((ch, c) => {
            if (!ch) return <span key={r + '-' + c} className="cw-cell block" />;
            const k = r + ',' + c;
            const cls = 'cw-cell' + (activeCells.has(k) ? ' in-word' : '') + (sel.r === r && sel.c === c ? ' cur' : '') + (wrong.has(k) ? ' bad' : '');
            return (
              <button key={r + '-' + c} className={cls} onPointerDown={e => { e.preventDefault(); tapCell(r, c); }} aria-label={`Row ${r + 1} column ${c + 1}`}>
                {numbers.has(k) && <i>{numbers.get(k)}</i>}
                <span>{entry[r][c]}</span>
              </button>
            );
          }))}
        </div>

        <div className="cw-pattern">
          {active ? <><b>{active.n} {active.dir === 'A' ? 'across' : 'down'}</b> <span>{pattern}</span> <small>({active.len} letters)</small></> : 'Tap a square'}
        </div>

        <div className="cw-words" aria-label="Word list">
          {words.map((w, i) => (
            <button key={w + i} className={'cw-word' + (used.has(w) ? ' used' : '') + (active && active.len === w.length ? ' fits' : '')} onClick={() => place(w)}>{w}</button>
          ))}
        </div>

        <div className="ws-actions">
          <button onClick={hint} disabled={done}>Hint{hints ? ` (${hints})` : ''}</button>
          <button onClick={checkBoard} disabled={done}>Check</button>
          <button className="quiet" onClick={() => navigate(`/crossword/${pack.id}/${level}/${randomSeed()}`)}>New puzzle</button>
        </div>
        <Keyboard onKey={onKey} disabled={paused || done} enter="Next" />
      </div>

      {dialog && (
        <div className="overlay" onClick={() => setDialog(false)}>
          <div className="dialog result" onClick={e => e.stopPropagation()}>
            <h2>Solved</h2>
            <p>{fmt(secs)}{hints ? `, ${hints} hint${hints > 1 ? 's' : ''}` : ', no hints'}.</p>
            <div className="dialog-actions">
              <button className="primary" onClick={() => navigate(`/crossword/${pack.id}/${level}/${randomSeed()}`)}>Another puzzle</button>
              <button onClick={() => setDialog(false)}>View grid</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
