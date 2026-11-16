import { useId, useMemo } from 'react';
import { BOOKS, makeRef, refLabel, refCode } from './books.js';
import { load, levelFor, liveStreak, learnedCount, dueEntries, setPassage } from './store.js';

const PANE = ['#232a49', '#7a4aa6', '#2f6aa8', '#2f8a63', '#d99a2b', '#f2d27a'];

/** One stained-glass window per chapter. Each pane is a verse; it lights up as you master it. */
export function GlassWindow({ total, boxes, label }) {
  const id = useId().replace(/:/g, '');
  const cols = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(total * 0.55))));
  const rows = Math.ceil(total / cols);
  const x0 = 14, y0 = 26, w = 92, h = 130, cw = w / cols, ch = h / rows;
  return (
    <svg viewBox="0 0 120 170" className="glass" role="img" aria-label={label}>
      <defs><clipPath id={'c' + id}><path d="M10 162 V72 Q10 22 60 6 Q110 22 110 72 V162 Z" /></clipPath></defs>
      <path d="M6 166 V72 Q6 18 60 0 Q114 18 114 72 V166 Z" fill="#3a2517" />
      <g clipPath={`url(#c${id})`}>
        <rect x="10" y="0" width="100" height="170" fill={PANE[0]} />
        {Array.from({ length: total }, (_, i) => {
          const r = Math.floor(i / cols), c = i % cols, b = boxes[i + 1];
          return <rect key={i} x={x0 + c * cw} y={y0 + r * ch} width={cw} height={ch} fill={PANE[b === undefined ? 0 : b + (b > 0 ? 0 : 0)]} stroke="#150d08" strokeWidth="1.4" opacity={b === undefined ? 0.7 : 1} />;
        })}
        <circle cx="60" cy="18" r="8" fill={boxes[1] !== undefined ? PANE[Math.max(1, boxes[1])] : PANE[0]} stroke="#150d08" strokeWidth="1.4" />
      </g>
      <path d="M10 162 V72 Q10 22 60 6 Q110 22 110 72 V162 Z" fill="none" stroke="#150d08" strokeWidth="3" />
    </svg>
  );
}

export default function Window({ navigate }) {
  const p = useMemo(load, []);
  const lv = levelFor(p.xp);
  const chapters = useMemo(() => {
    const m = {};
    Object.entries(p.srs).forEach(([k, e]) => { const [b, c, v] = k.split('.').map(Number); (m[`${b}.${c}`] ??= { b, c, boxes: {} }).boxes[v] = e.box; });
    return Object.values(m).map(x => ({ ...x, total: p.chapters[`${x.b}.${x.c}`] || Math.max(...Object.keys(x.boxes).map(Number)) }))
      .sort((a, b) => a.b - b.b || a.c - b.c);
  }, [p]);
  const open = c => { setPassage(refCode(makeRef(c.b, c.c))); navigate('/bible'); };

  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">Your windows</h1>
      <p className="screen-sub">Every chapter you practise becomes a window. Each pane is a verse, and it lights up as you learn it.</p>

      <div className="stat-row">
        <div><b>{lv.level}</b><small>Level</small></div>
        <div><b>{p.xp}</b><small>XP</small></div>
        <div><b>{liveStreak(p)}</b><small>Day streak</small></div>
        <div><b>{learnedCount(p)}</b><small>Verses learned</small></div>
      </div>
      <div className="xpbar" aria-label={`${lv.into} of ${lv.span} XP to level ${lv.level + 1}`}><i style={{ width: `${Math.round((lv.into / lv.span) * 100)}%` }} /></div>
      <p className="small">{lv.span - lv.into} XP to level {lv.level + 1}. Best streak: {p.best || 0} {(p.best || 0) === 1 ? "day" : "days"}. Due for review now: {dueEntries(p).length}.</p>

      <div className="legend" aria-hidden="true">
        {['Not started', 'Seen', 'Learning', 'Know it', 'Strong', 'Mastered'].map((t, i) => <span key={t}><i style={{ background: PANE[i] }} />{t}</span>)}
      </div>

      {chapters.length === 0 ? <p className="small">No windows yet. Finish a verse in any game and your first window appears here.</p> : (
        <div className="windows">
          {chapters.map(c => (
            <button key={c.b + '.' + c.c} className="window-card" onClick={() => open(c)}>
              <GlassWindow total={c.total} boxes={c.boxes} label={`${BOOKS[c.b - 1].name} ${c.c}`} />
              <b>{BOOKS[c.b - 1].name} {c.c}</b>
              <small>{Object.values(c.boxes).filter(b => b >= 3).length} of {c.total} learned</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
