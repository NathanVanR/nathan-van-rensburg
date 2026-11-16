import { useRef, useState } from 'react';
import { BLACK, WHITE, EMPTY, starPoints } from './rules.js';

const LETTERS = 'ABCDEFGHJKLMNOPQRST';

/** The board: an SVG with intersections at integer coordinates, so a tap maps straight to a point. */
export default function Board({ size, board, last, turn, pending, dead, owner, interactive, onPoint }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const m = 1.15, span = size - 1, total = span + 2 * m;
  const stars = starPoints(size);

  const pointAt = e => {
    const r = ref.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * total - m;
    const py = ((e.clientY - r.top) / r.height) * total - m;
    const x = Math.round(px), y = Math.round(py);
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
    return y * size + x;
  };

  const ghostAt = pending != null ? pending : hover;
  const ghostOk = interactive && ghostAt != null && board[ghostAt] === EMPTY;

  return (
    <svg
      ref={ref}
      className="go-board"
      viewBox={`${-m} ${-m} ${total} ${total}`}
      onClick={e => { if (!interactive) return; const i = pointAt(e); if (i != null) onPoint(i); }}
      onPointerMove={e => { if (e.pointerType === 'mouse' && interactive) setHover(pointAt(e)); }}
      onPointerLeave={() => setHover(null)}
      role="img"
      aria-label={`Go board, ${size} by ${size}`}
    >
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e4bd6a" /><stop offset="1" stopColor="#cf9f48" />
        </linearGradient>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.5" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 .35  0 0 0 0 .2  0 0 0 0 .05  0 0 0 .16 0" />
        </filter>
        <radialGradient id="sb" cx=".34" cy=".3" r=".8">
          <stop offset="0" stopColor="#6d6d6d" /><stop offset=".45" stopColor="#242424" /><stop offset="1" stopColor="#050505" />
        </radialGradient>
        <radialGradient id="sw" cx=".34" cy=".3" r=".85">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#ebe8de" /><stop offset="1" stopColor="#bdb9aa" />
        </radialGradient>
      </defs>

      <rect x={-m} y={-m} width={total} height={total} rx=".45" fill="url(#wood)" />
      <rect x={-m} y={-m} width={total} height={total} rx=".45" filter="url(#grain)" />
      <rect x={-m + 0.04} y={-m + 0.04} width={total - 0.08} height={total - 0.08} rx=".42" fill="none" stroke="rgba(255,235,190,.45)" strokeWidth=".06" />

      <g stroke="#4a3418" strokeWidth=".045" strokeLinecap="square">
        {Array.from({ length: size }, (_, k) => (
          <g key={k}>
            <line x1="0" y1={k} x2={span} y2={k} />
            <line x1={k} y1="0" x2={k} y2={span} />
          </g>
        ))}
      </g>
      <rect x="0" y="0" width={span} height={span} fill="none" stroke="#4a3418" strokeWidth=".085" />

      {stars.map(i => <circle key={i} cx={i % size} cy={(i / size) | 0} r=".085" fill="#4a3418" />)}

      <g className="go-coords" fill="#5a4220" fontSize=".36" textAnchor="middle">
        {Array.from({ length: size }, (_, k) => (
          <g key={k}>
            <text x={k} y={-0.55}>{LETTERS[k]}</text>
            <text x={k} y={span + 0.82}>{LETTERS[k]}</text>
            <text x={-0.62} y={k + 0.12}>{size - k}</text>
            <text x={span + 0.62} y={k + 0.12}>{size - k}</text>
          </g>
        ))}
      </g>

      {owner && owner.map((o, i) => (o !== 0 && (board[i] === EMPTY || (dead && dead.has(i)))) && (
        <rect key={'t' + i} x={(i % size) - 0.12} y={((i / size) | 0) - 0.12} width=".24" height=".24"
          fill={o === BLACK ? '#111' : '#f7f4ea'} stroke={o === BLACK ? '#000' : '#6b6657'} strokeWidth=".04" />
      ))}

      {board.map((c, i) => {
        if (c === EMPTY) return null;
        const x = i % size, y = (i / size) | 0, isDead = dead && dead.has(i);
        return (
          <g key={i} opacity={isDead ? 0.38 : 1}>
            <circle cx={x + 0.05} cy={y + 0.07} r=".47" fill="rgba(30,15,0,.38)" />
            <circle cx={x} cy={y} r=".47" fill={c === BLACK ? 'url(#sb)' : 'url(#sw)'} stroke={c === WHITE ? 'rgba(90,80,55,.5)' : 'none'} strokeWidth=".02" />
            {last === i && !isDead && <circle cx={x} cy={y} r=".2" fill="none" stroke={c === BLACK ? '#f2e8d2' : '#2a1f14'} strokeWidth=".07" />}
          </g>
        );
      })}

      {ghostOk && (
        <g opacity={pending != null ? 0.75 : 0.45} pointerEvents="none">
          <circle cx={ghostAt % size} cy={((ghostAt / size) | 0)} r=".47" fill={turn === BLACK ? 'url(#sb)' : 'url(#sw)'} />
          {pending != null && <circle cx={ghostAt % size} cy={((ghostAt / size) | 0)} r=".6" fill="none" stroke="#7a1f1f" strokeWidth=".07" strokeDasharray=".18 .12" />}
        </g>
      )}
    </svg>
  );
}
