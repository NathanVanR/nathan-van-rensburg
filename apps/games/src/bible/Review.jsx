import { useEffect, useMemo, useRef, useState } from 'react';
import { GameTop, PauseCover, useGameTimer, fmt } from '../shared/timer.jsx';
import { BOOKS, parseCode, refLabel, makeRef } from './books.js';
import { loadChapter } from './data.js';
import { load, dayNum, dueEntries, recordVerse, levelFor } from './store.js';
import Fade from './games/Fade.jsx';

const stageFor = box => (box <= 1 ? 2 : box <= 3 ? 3 : 4);

/** Spaced review: the verses that are due, each as a fading-blanks round that starts harder the better you know it. */
export default function Review({ onlyCode, navigate }) {
  const p = useMemo(load, []);
  const today = dayNum();
  const queue = useMemo(() => {
    let due = dueEntries(p, today);
    if (onlyCode) { const r = parseCode(onlyCode); if (r) due = due.filter(e => e.key.startsWith(`${r.book}.${r.chapter}.`)); }
    return due.slice(0, 10);
  }, []);
  const nextDue = useMemo(() => {
    const later = Object.values(p.srs).filter(e => e.due > today).map(e => e.due - today);
    return later.length ? Math.min(...later) : null;
  }, []);

  const [i, setI] = useState(0);
  const [item, setItem] = useState(null);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(queue.length === 0);
  const timer = useGameTimer({ running: !finished });
  const { secs, paused } = timer;
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (finished || !queue[i]) return;
    const [b, c, v] = queue[i].key.split('.').map(Number);
    setItem(null);
    loadChapter(b, c).then(vs => { if (alive.current) setItem({ b, c, v, text: vs[v - 1], total: vs.length, box: queue[i].box }); });
  }, [i, finished]);

  const onDone = score => {
    let list = results;
    if (score !== null && item) { const r = recordVerse(item.b, item.c, item.v, item.total, score, 10); list = [...results, { score, gained: r.gained }]; setResults(list); }
    if (i + 1 >= queue.length) setFinished(true); else setI(i + 1);
  };

  const avg = results.length ? results.reduce((a, r) => a + r.score, 0) / results.length : 0;
  const xp = results.reduce((a, r) => a + r.gained, 0);

  if (queue.length === 0) {
    return (
      <div className="screen">
        <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
        <h1 className="screen-title">Review</h1>
        <p className="screen-sub">{onlyCode ? 'Nothing from this passage is due.' : 'Nothing is due today.'} {nextDue !== null ? `Your next review is in ${nextDue} day${nextDue > 1 ? 's' : ''}.` : 'Learn a verse in any game and it will appear here.'}</p>
        <button className="primary big" onClick={() => navigate('/bible')}>Back to games</button>
      </div>
    );
  }
  const label = item ? refLabel(makeRef(item.b, item.c, item.v, item.v)) : '';
  return (
    <div className="screen bible-game">
      <GameTop title="Review" sub={`${label} · ${Math.min(i + 1, queue.length)} of ${queue.length}`} secs={secs} paused={paused}
        onToggle={timer.toggle} onBack={() => navigate('/bible')} done={finished} />
      <div className="pausable bible-area">
        {paused && <PauseCover onResume={() => timer.setPaused(false)} />}
        {!finished && item && <Fade key={item.b + '.' + item.c + '.' + item.v} verse={{ n: item.v, text: item.text }} startStage={stageFor(item.box)} onDone={onDone} />}
        {!finished && !item && <p className="screen-sub">Opening the verse…</p>}
      </div>
      {finished && (
        <div className="overlay">
          <div className="dialog result">
            <h2>Review done</h2>
            {results.length ? <p>{results.length} verse{results.length > 1 ? 's' : ''}, {Math.round(avg * 100)}% on average, {fmt(secs)}.</p> : <p>Nothing was recorded.</p>}
            <p className="small">+{xp} XP · level {levelFor(load().xp).level}</p>
            <div className="dialog-actions"><button className="primary" onClick={() => navigate('/bible')}>Back to games</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
