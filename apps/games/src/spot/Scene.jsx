import { useId } from 'react';
import { THEMES, W, H } from './scene.js';

const c = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

function Shape({ e }) {
  const { type, h, v } = e;
  switch (type) {
    case 'house': return (<g>
      <rect x="-30" y="-40" width="60" height="40" fill={c(h, 45, 78)} stroke="#0003" />
      <polygon points="-38,-40 0,-74 38,-40" fill={c(h + 20, 60, 42)} />
      <rect x="-8" y="-24" width="16" height="24" fill="#7b5230" />
      {v ? <rect x="12" y="-32" width="14" height="14" fill="#cfe9ff" stroke="#556" /> : <circle cx="19" cy="-26" r="8" fill="#cfe9ff" stroke="#556" />}
      {v ? <path d="M19 -32v14M12 -25h14" stroke="#556" /> : null}
    </g>);
    case 'tree': return v ? (<g>
      <rect x="-4" y="-18" width="8" height="18" fill="#7b5230" />
      <polygon points="-24,-16 0,-52 24,-16" fill={c(h, 45, 32)} /><polygon points="-20,-38 0,-72 20,-38" fill={c(h, 45, 38)} /><polygon points="-15,-58 0,-88 15,-58" fill={c(h, 45, 44)} />
    </g>) : (<g>
      <rect x="-5" y="-32" width="10" height="32" fill="#7b5230" />
      <circle cx="0" cy="-50" r="28" fill={c(h, 48, 40)} /><circle cx="-18" cy="-40" r="17" fill={c(h, 48, 46)} /><circle cx="18" cy="-40" r="17" fill={c(h, 48, 36)} />
    </g>);
    case 'cloud': return (<g fill="#fff" opacity=".95"><circle cx="-24" cy="0" r="16" /><circle cx="0" cy="-9" r="22" /><circle cx="26" cy="0" r="16" /><rect x="-24" y="0" width="50" height="16" /></g>);
    case 'sun': return (<g>
      {Array.from({ length: v ? 12 : 8 }, (_, i) => <line key={i} x1="0" y1="-26" x2="0" y2="-38" stroke={c(h, 95, 55)} strokeWidth="4" strokeLinecap="round" transform={`rotate(${(i * 360) / (v ? 12 : 8)})`} />)}
      <circle r="20" fill={c(h, 95, 62)} />
    </g>);
    case 'moon': return <path d="M0 -22 A22 22 0 1 0 0 22 A16 16 0 1 1 0 -22Z" fill="#fdf3c4" />;
    case 'star': return <polygon points="0,-12 3.5,-4 12,-3.5 5.5,2.5 7.5,11 0,6.5 -7.5,11 -5.5,2.5 -12,-3.5 -3.5,-4" fill="#ffe9a0" />;
    case 'bird': return <path d="M-16 0 Q-8 -12 0 0 Q8 -12 16 0" fill="none" stroke="#2a2f45" strokeWidth="3" strokeLinecap="round" />;
    case 'bat': return <path d="M-20 -4 Q-12 -16 -4 -4 L0 -10 L4 -4 Q12 -16 20 -4 Q10 0 0 8 Q-10 0 -20 -4Z" fill="#14172b" />;
    case 'balloon': return (<g><ellipse cx="0" cy="-22" rx="15" ry="19" fill={c(h, 70, 55)} /><polygon points="-3,-3 3,-3 0,2" fill={c(h, 70, 40)} /><path d="M0 2 Q-5 14 0 24" stroke="#555" fill="none" /></g>);
    case 'flower': return (<g>
      <line x1="0" y1="0" x2="0" y2="-30" stroke="#3f8a45" strokeWidth="3" />
      <ellipse cx="-8" cy="-10" rx="8" ry="4" fill="#4b9a50" transform="rotate(-30 -8 -10)" />
      {Array.from({ length: 5 + v }, (_, i) => <ellipse key={i} cx="0" cy="-42" rx="6" ry="11" fill={c(h, 80, 66)} transform={`rotate(${(i * 360) / (5 + v)} 0 -34)`} />)}
      <circle cx="0" cy="-34" r="6" fill="#ffd54a" />
    </g>);
    case 'fence': return (<g fill="#e8d2a4" stroke="#0003"><rect x="-26" y="-22" width="8" height="24" /><rect x="-4" y="-22" width="8" height="24" /><rect x="18" y="-22" width="8" height="24" /><rect x="-28" y="-16" width="56" height="5" /></g>);
    case 'rock': return <ellipse cx="0" cy="-8" rx="19" ry="11" fill="#9a9aa3" stroke="#0003" />;
    case 'tower': return (<g>
      <rect x="-17" y="-72" width="34" height="72" fill={c(h, 14, 62)} stroke="#0003" />
      <polygon points="-22,-72 0,-114 22,-72" fill={c(h, 45, 32)} />
      <path d={v ? 'M-6 -30 V-48 Q0 -58 6 -48 V-30Z' : 'M-6 -30 V-44 H6 V-30Z'} fill="#1b2340" />
    </g>);
    case 'lantern': return (<g>
      <circle cx="0" cy="-28" r="26" fill="#ffd66b" opacity=".28" />
      <line x1="0" y1="0" x2="0" y2="-16" stroke="#333" strokeWidth="3" />
      <rect x="-8" y="-38" width="16" height="22" rx="3" fill={c(h, 85, 62)} stroke="#333" />
      <polygon points="-10,-38 0,-48 10,-38" fill="#333" />
    </g>);
    case 'mushroom': return (<g>
      <rect x="-5" y="-14" width="10" height="14" fill="#f1e6d3" />
      <path d="M-19 -14 A19 17 0 0 1 19 -14Z" fill={c(h, 70, 50)} />
      <circle cx="-7" cy="-22" r="3" fill="#fff" /><circle cx="6" cy="-26" r="3.5" fill="#fff" /><circle cx="10" cy="-19" r="2.5" fill="#fff" />
    </g>);
    case 'fish': return (<g><polygon points="-18,0 -35,-12 -35,12" fill={c(h + 30, 80, 48)} /><ellipse rx="23" ry="13" fill={c(h, 80, 56)} /><circle cx="11" cy="-3" r="4" fill="#fff" /><circle cx="12" cy="-3" r="1.8" fill="#222" /></g>);
    case 'bubble': return <circle r="11" fill="#ffffff33" stroke="#fff" strokeWidth="2" />;
    case 'jellyfish': return (<g><path d="M-18 0 A18 16 0 0 1 18 0Z" fill={c(h, 70, 72)} opacity=".9" />{[-10, -3, 4, 11].map(x => <path key={x} d={`M${x} 0 q-4 9 0 16 q4 7 0 14`} stroke={c(h, 70, 78)} fill="none" strokeWidth="2.5" />)}</g>);
    case 'seaweed': return <path d="M0 0 Q-9 -16 0 -30 Q9 -44 0 -60" stroke={c(120 + (h % 40), 55, 36)} strokeWidth="7" fill="none" strokeLinecap="round" />;
    case 'shell': return (<g><path d="M-18 0 Q0 -34 18 0Z" fill={c(h, 55, 82)} stroke="#a77" /><path d="M0 0 V-22 M-8 0 L-7 -17 M8 0 L7 -17" stroke="#a77" /></g>);
    case 'starfish': return <polygon points="0,-17 5,-6 17,-5 8,3 11,15 0,9 -11,15 -8,3 -17,-5 -5,-6" fill={c(h, 90, 58)} stroke="#0003" transform="translate(0 -14)" />;
    case 'crab': return (<g><ellipse cx="0" cy="-9" rx="19" ry="11" fill={c(h, 75, 50)} /><circle cx="-23" cy="-17" r="6" fill={c(h, 75, 50)} /><circle cx="23" cy="-17" r="6" fill={c(h, 75, 50)} /><circle cx="-6" cy="-21" r="2.5" fill="#fff" /><circle cx="6" cy="-21" r="2.5" fill="#fff" />{[-12, -4, 4, 12].map(x => <line key={x} x1={x} y1="-2" x2={x * 1.6} y2="4" stroke={c(h, 75, 40)} strokeWidth="2.5" />)}</g>);
    case 'butterfly': return (<g><ellipse cx="-10" cy="-6" rx="10" ry="8" fill={c(h, 80, 62)} /><ellipse cx="10" cy="-6" rx="10" ry="8" fill={c(h + 40, 80, 62)} /><ellipse cx="-8" cy="5" rx="7" ry="5" fill={c(h, 75, 55)} /><ellipse cx="8" cy="5" rx="7" ry="5" fill={c(h + 40, 75, 55)} /><line x1="0" y1="-12" x2="0" y2="8" stroke="#333" strokeWidth="3" /></g>);
    case 'ladybug': return (<g><circle cx="0" cy="-9" r="10" fill={c(h, 80, 48)} /><path d="M0 -19 V1" stroke="#222" /><circle cx="-4" cy="-12" r="2" fill="#222" /><circle cx="4" cy="-6" r="2" fill="#222" /><circle cx="0" cy="-20" r="4" fill="#222" /></g>);
    default: return null;
  }
}

/** One picture. `marks` are circles to draw (found differences, hints, misses) in scene coordinates. */
export default function SceneSvg({ scene, marks = [], onTap, label }) {
  const uid = useId().replace(/:/g, '');
  const t = THEMES[scene.theme];
  const els = [...scene.elements].sort((p, q) => p.y - q.y);
  const tap = e => {
    if (!onTap) return;
    const r = e.currentTarget.getBoundingClientRect();
    onTap(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
  };
  return (
    <svg className="spot-svg" viewBox={`0 0 ${W} ${H}`} onPointerDown={tap} role="img" aria-label={label}>
      <defs>
        <linearGradient id={'sky' + uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.top} /><stop offset="1" stopColor={t.bottom} /></linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#sky${uid})`} />
      <ellipse cx="150" cy={t.horizon + 8} rx="230" ry="40" fill={t.ground} opacity=".85" />
      <ellipse cx="520" cy={t.horizon + 14} rx="260" ry="46" fill={t.ground} opacity=".7" />
      <rect y={t.horizon} width={W} height={H - t.horizon} fill={t.ground} />
      {els.map(e => (
        <g key={e.id} transform={`translate(${e.x} ${e.y}) scale(${e.flip ? -e.s : e.s} ${e.s})`}><Shape e={e} /></g>
      ))}
      {marks.map((m, i) => (
        <circle key={i} className={'spot-mark ' + m.kind} cx={m.x} cy={m.y} r={m.r} fill="none" />
      ))}
    </svg>
  );
}
