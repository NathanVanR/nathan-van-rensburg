import { useEffect, useMemo, useRef, useState } from 'react';
import Board from './Board.jsx';
import { newGame, play, pass, replay, score, stonesOfGroup, other, BLACK, WHITE } from './rules.js';

const SAVE = 'games.go.save';
const SIZES = [
  { n: 9, note: 'A quick game' },
  { n: 13, note: 'A good middle ground' },
  { n: 19, note: 'The full board' }
];
const KOMIS = [0.5, 5.5, 6.5, 7.5];
const MESSAGES = {
  occupied: 'That point is taken.',
  suicide: 'That move would have no liberties.',
  ko: 'Ko: that would repeat an earlier position. Play elsewhere first.'
};
const NAME = { [BLACK]: 'Black', [WHITE]: 'White' };

const readSave = () => { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } };
const writeSave = g => { try { g ? localStorage.setItem(SAVE, JSON.stringify(g)) : localStorage.removeItem(SAVE); } catch { /* private mode */ } };

function build(size, komi, moves) {
  const { state, history } = replay(size, komi, moves);
  return { size, komi, moves, state, history, phase: state.passes >= 2 ? 'scoring' : 'play', dead: new Set(), result: null };
}

export default function Go({ onExit }) {
  const [cfg, setCfg] = useState({ size: 9, komi: 6.5, confirm: false });
  const [game, setGame] = useState(null);
  const [pending, setPending] = useState(null);
  const [toast, setToast] = useState('');
  const [ask, setAsk] = useState(null); // 'resign' | 'leave'
  const [showResult, setShowResult] = useState(true);
  const saved = useMemo(readSave, [game === null]);
  const toastTimer = useRef(0);

  const flash = msg => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2600); };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const commit = next => {
    setGame(next);
    if (next.phase === 'done' || next.moves.length === 0) writeSave(null);
    else writeSave({ size: next.size, komi: next.komi, moves: next.moves, confirm: cfg.confirm });
  };

  const start = () => { setPending(null); setShowResult(true); commit(build(cfg.size, cfg.komi, [])); };
  const resume = () => {
    try { setCfg(c => ({ ...c, size: saved.size, komi: saved.komi, confirm: !!saved.confirm })); setPending(null); setGame(build(saved.size, saved.komi, saved.moves)); }
    catch { writeSave(null); flash('That saved game could not be opened.'); }
  };

  /* ---------- setup screen ---------- */
  if (!game) {
    return (
      <div className="screen go-setup">
        <button className="back" onClick={onExit}>‹ Games</button>
        <h1 className="screen-title">Go</h1>
        <p className="screen-sub">Two players, one device. Pass it back and forth.</p>

        {saved && saved.moves && (
          <button className="resume-card" onClick={resume}>
            <span className="kicker">Unfinished game</span>
            <b>{saved.size} × {saved.size}, move {saved.moves.length}</b>
            <span>Pick up where you left off</span>
          </button>
        )}

        <div className="size-row" role="radiogroup" aria-label="Board size">
          {SIZES.map(s => (
            <button key={s.n} role="radio" aria-checked={cfg.size === s.n}
              className={'size-card' + (cfg.size === s.n ? ' on' : '')}
              onClick={() => setCfg(c => ({ ...c, size: s.n, confirm: s.n === 19 ? true : c.confirm && s.n !== 9 }))}>
              <MiniBoard n={s.n} />
              <b>{s.n} × {s.n}</b>
              <small>{s.note}</small>
            </button>
          ))}
        </div>

        <div className="options">
          <label className="opt">
            <span><b>Komi</b><small>Points given to White for moving second</small></span>
            <select value={cfg.komi} onChange={e => setCfg(c => ({ ...c, komi: +e.target.value }))}>
              {KOMIS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label className="opt">
            <span><b>Confirm each move</b><small>Tap to preview a stone, tap again to place it</small></span>
            <input type="checkbox" className="switch" checked={cfg.confirm} onChange={e => setCfg(c => ({ ...c, confirm: e.target.checked }))} />
          </label>
        </div>

        <button className="primary big" onClick={start}>Start game</button>
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  /* ---------- game ---------- */
  const { size, state, history, phase, dead, moves, result } = game;
  const scoring = phase === 'scoring' || phase === 'done';
  const tally = scoring ? score(state, dead) : null;

  const tryPlace = i => {
    const r = play(state, i, history);
    if (r.error) { flash(MESSAGES[r.error]); setPending(null); return; }
    navigator.vibrate?.(8);
    setPending(null);
    commit({ ...game, history: [...history, state], state: r.state, moves: [...moves, i] });
  };

  const onPoint = i => {
    if (phase === 'play') {
      if (!cfg.confirm) return tryPlace(i);
      if (pending === i) return tryPlace(i);
      const probe = play(state, i, history);
      if (probe.error) { flash(MESSAGES[probe.error]); setPending(null); } else setPending(i);
    } else if (phase === 'scoring') {
      const group = stonesOfGroup(state.board, size, i);
      if (!group.length) return;
      const next = new Set(dead);
      const allDead = group.every(s => next.has(s));
      group.forEach(s => (allDead ? next.delete(s) : next.add(s)));
      setGame({ ...game, dead: next });
    }
  };

  const doPass = () => {
    setPending(null);
    const next = pass(state);
    commit({ ...game, history: [...history, state], state: next, moves: [...moves, -1], phase: next.passes >= 2 ? 'scoring' : 'play', dead: new Set() });
  };
  const undo = () => {
    if (!moves.length) return;
    setPending(null); setShowResult(true);
    commit(build(size, game.komi, moves.slice(0, -1)));
  };
  const resumePlay = () => {
    const m = [...moves];
    while (m.length && m[m.length - 1] === -1) m.pop();
    setPending(null);
    commit(build(size, game.komi, m));
  };
  const finish = () => commit({ ...game, phase: 'done', result: { winner: tally.winner, margin: tally.margin } });
  const resign = () => { setAsk(null); setShowResult(true); commit({ ...game, phase: 'done', result: { winner: other(state.turn), resign: true } }); };
  const leave = () => { setAsk(null); setGame(null); setPending(null); };

  const status = phase === 'done'
    ? (result.resign ? `${NAME[result.winner]} wins by resignation` : `${NAME[result.winner]} wins by ${result.margin}`)
    : phase === 'scoring' ? 'Tap groups that are dead, then confirm'
    : `${NAME[state.turn]} to play`;
  const passNote = phase === 'play' && state.passes === 1 ? `${NAME[other(state.turn)]} passed` : '';

  return (
    <div className="go">
      <div className="go-stage">
        <div className="go-board-wrap">
          <Board size={size} board={state.board} last={state.last} turn={state.turn} pending={pending}
            dead={scoring ? dead : null} owner={scoring ? tally.owner : null}
            interactive={phase === 'play' || phase === 'scoring'} onPoint={onPoint} />
        </div>

        <aside className="go-panel">
          <div className="go-top">
            <button className="back" onClick={() => setAsk('leave')}>‹ Menu</button>
            <span className="go-title">Go · {size} × {size}</span>
            <span className="go-move">Move {moves.filter(m => m !== -1).length}</span>
          </div>

          <div className="players">
            {[BLACK, WHITE].map(c => (
              <div key={c} className={'pcard' + (phase === 'play' && state.turn === c ? ' on' : '') + (phase === 'done' && result.winner === c ? ' won' : '')}>
                <span className={'stone-dot ' + (c === BLACK ? 'b' : 'w')} />
                <div>
                  <b>{NAME[c]}</b>
                  <small>
                    {scoring
                      ? `${c === BLACK ? tally.black.total : tally.white.total}${c === WHITE ? ' (incl. komi)' : ''}`
                      : `${state.captures[c]} captured`}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div className={'status' + (phase === 'done' ? ' final' : '')}>
            <b>{status}</b>
            {passNote && <small>{passNote}</small>}
            {phase === 'scoring' && (
              <small>
                Black {tally.black.territory} territory + {tally.black.prisoners} prisoners<br />
                White {tally.white.territory} territory + {tally.white.prisoners} prisoners + {tally.white.komi} komi<br />
                <em>{tally.winner === BLACK ? 'Black' : 'White'} leads by {tally.margin}</em>
              </small>
            )}
          </div>

          <div className="actions">
            {phase === 'play' && (
              <>
                {cfg.confirm && pending != null
                  ? <button className="primary" onClick={() => tryPlace(pending)}>Place stone</button>
                  : <button onClick={doPass}>Pass</button>}
                <button onClick={undo} disabled={!moves.length}>Undo</button>
                <button className="quiet" onClick={() => setAsk('resign')}>Resign</button>
              </>
            )}
            {phase === 'scoring' && (
              <>
                <button className="primary" onClick={finish}>Confirm result</button>
                <button onClick={resumePlay}>Keep playing</button>
              </>
            )}
            {phase === 'done' && (
              <>
                <button className="primary" onClick={() => { setGame(null); }}>New game</button>
                {!showResult && <button onClick={() => setShowResult(true)}>Show result</button>}
              </>
            )}
          </div>

          {phase === 'play' && (
            <label className="mini-opt">
              <input type="checkbox" className="switch" checked={cfg.confirm} onChange={e => { setPending(null); setCfg(c => ({ ...c, confirm: e.target.checked })); }} />
              <span>Confirm each move</span>
            </label>
          )}
        </aside>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {phase === 'done' && showResult && (
        <div className="overlay" onClick={() => setShowResult(false)}>
          <div className="dialog result" onClick={e => e.stopPropagation()}>
            <span className={'stone-dot big ' + (result.winner === BLACK ? 'b' : 'w')} />
            <h2>{NAME[result.winner]} wins</h2>
            <p>{result.resign ? `${NAME[other(result.winner)]} resigned.` : `By ${result.margin} points.`}</p>
            {!result.resign && (
              <p className="small">Black {tally.black.total} · White {tally.white.total}</p>
            )}
            <div className="dialog-actions">
              <button className="primary" onClick={() => setGame(null)}>New game</button>
              <button onClick={() => setShowResult(false)}>View board</button>
            </div>
          </div>
        </div>
      )}

      {ask && (
        <div className="overlay" onClick={() => setAsk(null)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            {ask === 'resign' ? (
              <>
                <h2>{NAME[state.turn]} resigns?</h2>
                <p>{NAME[other(state.turn)]} will be declared the winner.</p>
                <div className="dialog-actions"><button className="primary" onClick={resign}>Resign</button><button onClick={() => setAsk(null)}>Keep playing</button></div>
              </>
            ) : (
              <>
                <h2>Back to the menu?</h2>
                <p>{phase === 'done' ? 'This game is finished.' : 'Your game is saved and you can pick it up later.'}</p>
                <div className="dialog-actions"><button className="primary" onClick={leave}>Back to menu</button><button onClick={() => setAsk(null)}>Stay</button></div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBoard({ n }) {
  const lines = n === 9 ? 5 : n === 13 ? 7 : 9;
  const s = 44, g = s / (lines - 1);
  return (
    <svg viewBox="-4 -4 52 52" className="mini-board" aria-hidden="true">
      <rect x="-4" y="-4" width="52" height="52" rx="4" fill="#d9ae5c" />
      {Array.from({ length: lines }, (_, k) => (
        <g key={k} stroke="#4a3418" strokeWidth=".8">
          <line x1="0" y1={k * g} x2={s} y2={k * g} /><line x1={k * g} y1="0" x2={k * g} y2={s} />
        </g>
      ))}
      <circle cx={g} cy={g} r={g * 0.42} fill="#161616" />
      <circle cx={g * (lines - 2)} cy={g} r={g * 0.42} fill="#f4f1e6" stroke="#8a8470" strokeWidth=".4" />
      <circle cx={g * ((lines - 1) / 2)} cy={g * (lines - 2)} r={g * 0.42} fill="#161616" />
    </svg>
  );
}
