import { useEffect, useMemo, useRef, useState } from 'react';
import SceneSvg from './Scene.jsx';
import { GameTop, PauseCover, useGameTimer, fmt } from '../shared/timer.jsx';
import { THEMES, THEME_KEYS, SPOT_LEVELS, SPOT_KEYS, makeScene, makeDifferences } from './scene.js';
import { randomSeed } from '../wordsearch/packs.js';

const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const getLevel = () => { const l = store.get('games.spot.level'); return SPOT_KEYS.includes(l) ? l : 'easy'; };

export default function SpotDiff({ path, navigate }) {
  const parts = path.split('/').filter(Boolean);
  if (THEME_KEYS.includes(parts[0]) && SPOT_KEYS.includes(parts[1]) && +parts[2]) {
    return <Play key={path} theme={parts[0]} level={parts[1]} seed={+parts[2]} navigate={navigate} />;
  }
  return <Home navigate={navigate} />;
}

function Home({ navigate }) {
  const [level, setLevelState] = useState(getLevel);
  const setLevel = l => { setLevelState(l); store.set('games.spot.level', l); };
  const stats = store.get('games.spot.stats') || {};
  const go = theme => navigate(`/spot/${theme}/${level}/${randomSeed()}`);
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/')}>‹ Games</button>
      <h1 className="screen-title">Spot the difference</h1>
      <p className="screen-sub">Two pictures, a few changes. Tap either picture where you see one. The pictures are drawn on the fly, so no images are stored.</p>
      <div className="field">
        <span>Level</span>
        <div className="seg" role="radiogroup" aria-label="Level">
          {SPOT_KEYS.map(k => <button key={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{SPOT_LEVELS[k].label}</button>)}
        </div>
        <small>{SPOT_LEVELS[level].note}</small>
      </div>
      <div className="pack-grid scenes">
        {THEME_KEYS.map(k => (
          <button key={k} className="pack-card scene-card" onClick={() => go(k)}>
            <span className="thumb"><SceneSvg scene={makeScene(k, 3)} label="" /></span>
            <b>{THEMES[k].label}</b>
            {stats[k] > 0 && <span className="tick">{stats[k]} solved</span>}
          </button>
        ))}
      </div>
      <button className="feature-card ink" onClick={() => go(THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)])}>
        <span className="kicker">Not sure?</span>
        <b>Surprise me</b>
      </button>
    </div>
  );
}

function Play({ theme, level, seed, navigate }) {
  const { a, b, diffs } = useMemo(() => makeDifferences(theme, level, seed), [theme, level, seed]);
  const [found, setFound] = useState(() => new Set());
  const [misses, setMisses] = useState(0);
  const [hint, setHint] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [done, setDone] = useState(false);
  const [dialog, setDialog] = useState(false);
  const timer = useGameTimer({ running: !done });
  const { secs, paused } = timer;
  const t1 = useRef(0), t2 = useRef(0);
  useEffect(() => () => { clearTimeout(t1.current); clearTimeout(t2.current); }, []);

  const tap = side => (x, y) => {
    if (paused || done) return;
    const hit = diffs.find(d => !found.has(d.id) && Math.hypot(d.x - x, d.y - y) <= d.r + 10);
    if (hit) {
      navigator.vibrate?.(10);
      const next = new Set(found); next.add(hit.id); setFound(next); setHint(null);
      if (next.size === diffs.length) {
        setDone(true); setDialog(true);
        const st = store.get('games.spot.stats') || {}; st[theme] = (st[theme] || 0) + 1; store.set('games.spot.stats', st);
      }
    } else {
      setMisses(m => m + 1);
      setWrong({ x, y, side });
      clearTimeout(t1.current); t1.current = setTimeout(() => setWrong(null), 650);
    }
  };
  const giveHint = () => {
    if (paused || done) return;
    const d = diffs.find(x => !found.has(x.id));
    if (!d) return;
    setHint(d.id); clearTimeout(t2.current); t2.current = setTimeout(() => setHint(null), 2600);
  };

  const marksFor = side => [
    ...diffs.filter(d => found.has(d.id)).map(d => ({ kind: 'found', x: d.x, y: d.y, r: d.r })),
    ...(hint != null ? [{ ...diffs.find(d => d.id === hint), kind: 'hint' }] : []),
    ...(wrong && wrong.side === side ? [{ kind: 'wrong', x: wrong.x, y: wrong.y, r: 22 }] : [])
  ];

  return (
    <div className="screen spot">
      <GameTop title={THEMES[theme].label} sub={`${SPOT_LEVELS[level].label} · found ${found.size} of ${diffs.length}`} secs={secs} paused={paused}
        onToggle={timer.toggle} onBack={() => navigate('/spot')} done={done} />
      <div className="pausable spot-area">
        {paused && <PauseCover onResume={() => timer.setPaused(false)} />}
        <div className="spot-pics">
          <SceneSvg scene={a} marks={marksFor('a')} onTap={tap('a')} label="Original picture" />
          <SceneSvg scene={b} marks={marksFor('b')} onTap={tap('b')} label="Changed picture" />
        </div>
        <div className="spot-dots" aria-hidden="true">{diffs.map(d => <span key={d.id} className={found.has(d.id) ? 'on' : ''} />)}</div>
        <div className="ws-actions">
          <button onClick={giveHint} disabled={done}>Hint</button>
          <span className="spot-miss">Misses: {misses}</span>
          <button className="quiet" onClick={() => navigate(`/spot/${theme}/${level}/${randomSeed()}`)}>New picture</button>
        </div>
      </div>

      {dialog && (
        <div className="overlay" onClick={() => setDialog(false)}>
          <div className="dialog result" onClick={e => e.stopPropagation()}>
            <h2>All {diffs.length} found</h2>
            <p>{fmt(secs)}, {misses} {misses === 1 ? 'miss' : 'misses'}.</p>
            <div className="dialog-actions">
              <button className="primary" onClick={() => navigate(`/spot/${theme}/${level}/${randomSeed()}`)}>Another picture</button>
              <button onClick={() => setDialog(false)}>View pictures</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
