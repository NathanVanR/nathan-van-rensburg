import { useEffect, useState } from 'react';

export const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** A game timer that can be paused. It also stops by itself while the page is in the background. */
export function useGameTimer({ running = true, initial = 0 } = {}) {
  const [secs, setSecs] = useState(initial);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!running || paused) return;
    const t = setInterval(() => { if (!document.hidden) setSecs(s => s + 1); }, 1000);
    return () => clearInterval(t);
  }, [running, paused]);
  return { secs, setSecs, paused, setPaused, toggle: () => setPaused(p => !p) };
}

const PauseIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>;
const PlayIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>;

/** The clock with a pause/resume button built in. */
export function TimeButton({ secs, paused, onToggle, disabled }) {
  return (
    <button className={'ws-time' + (paused ? ' paused' : '')} onClick={onToggle} disabled={disabled}
      aria-label={paused ? 'Resume timer' : 'Pause timer'}>
      <span className="t">{fmt(secs)}</span>
      {paused ? <PlayIcon /> : <PauseIcon />}
    </button>
  );
}

/** Covers a `.pausable` area while the game is paused, so the board cannot be studied with the clock stopped. */
export function PauseCover({ onResume }) {
  return (
    <button className="pause-cover" onClick={onResume}>
      <PauseIcon />
      <b>Paused</b>
      <span>Tap to resume</span>
    </button>
  );
}

/** Top bar used by the games: back button, title, and the timer with its pause button. */
export function GameTop({ title, sub, secs, paused, onToggle, onBack, done, right }) {
  return (
    <div className="ws-top">
      <button className="back" onClick={onBack}>‹ Back</button>
      <div className="ws-title"><b>{title}</b>{sub && <small>{sub}</small>}</div>
      {right}
      <TimeButton secs={secs} paused={paused} onToggle={onToggle} disabled={done} />
    </div>
  );
}
