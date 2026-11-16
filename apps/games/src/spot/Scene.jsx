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
    case 'planet': return (<g>
      {v ? <ellipse cx="0" cy="0" rx="40" ry="9" fill="none" stroke={c(h + 30, 50, 70)} strokeWidth="4" transform="rotate(-18)" /> : null}
      <circle r="24" fill={c(h, 60, 52)} /><path d="M-22 -8 Q0 -2 22 -8 M-23 6 Q0 12 23 6" stroke={c(h, 55, 38)} strokeWidth="3" fill="none" />
    </g>);
    case 'comet': return (<g><polygon points="0,-5 -56,-17 -56,9 0,5" fill="#bfe8ff" opacity=".45" /><circle r="8" fill="#fff" /></g>);
    case 'ufo': return (<g><ellipse cx="0" cy="-8" rx="13" ry="10" fill="#9fe8ff" opacity=".85" /><ellipse rx="30" ry="9" fill={c(h, 15, 72)} />{[-16, 0, 16].map(x => <circle key={x} cx={x} cy="1" r="2.6" fill="#ffe27a" />)}</g>);
    case 'rocket': return (<g>
      <polygon points="-10,-14 -22,2 -10,2" fill={c(h, 80, 48)} /><polygon points="10,-14 22,2 10,2" fill={c(h, 80, 48)} />
      <rect x="-10" y="-56" width="20" height="58" rx="3" fill={c(h, 8, 92)} stroke="#0003" />
      <polygon points="-10,-56 0,-78 10,-56" fill={c(h, 80, 48)} /><circle cx="0" cy="-36" r="6" fill="#8fd2ff" stroke="#556" />
    </g>);
    case 'crater': return <ellipse cx="0" cy="-5" rx="24" ry="7" fill="#37335a" stroke="#6f6a96" strokeWidth="2" />;
    case 'astronaut': return (<g>
      <rect x="-6" y="-14" width="5" height="14" fill="#e8e8f0" /><rect x="1" y="-14" width="5" height="14" fill="#e8e8f0" />
      <rect x="-9" y="-36" width="18" height="24" rx="5" fill="#f4f4fa" stroke="#0003" /><circle cx="0" cy="-44" r="10" fill="#f4f4fa" stroke="#0003" />
      <ellipse cx="0" cy="-44" rx="6.5" ry="5.5" fill={c(h, 70, 55)} />
    </g>);
    case 'flag': return (<g><line x1="0" y1="0" x2="0" y2="-52" stroke="#ddd" strokeWidth="3" /><rect x="0" y="-52" width="24" height="15" fill={c(h, 80, 52)} /></g>);
    case 'snowflake': return (<g stroke="#fff" strokeWidth="2.4" strokeLinecap="round">{[0, 60, 120].map(a => <line key={a} x1="0" y1="-11" x2="0" y2="11" transform={`rotate(${a})`} />)}</g>);
    case 'snowman': return (<g>
      <circle cx="0" cy="-16" r="17" fill="#fff" stroke="#0002" /><circle cx="0" cy="-42" r="12.5" fill="#fff" stroke="#0002" /><circle cx="0" cy="-60" r="9.5" fill="#fff" stroke="#0002" />
      <circle cx="-3" cy="-62" r="1.4" fill="#222" /><circle cx="3" cy="-62" r="1.4" fill="#222" /><polygon points="0,-59 9,-57 0,-56" fill="#f08a2b" />
      {v ? <g><rect x="-8" y="-76" width="16" height="9" fill={c(h, 40, 25)} /><rect x="-12" y="-68" width="24" height="3" fill={c(h, 40, 25)} /></g> : <rect x="-11" y="-52" width="22" height="4" fill={c(h, 75, 50)} />}
    </g>);
    case 'pinesnow': return (<g>
      <rect x="-4" y="-18" width="8" height="18" fill="#6b4a2c" />
      <polygon points="-26,-16 0,-52 26,-16" fill="#2f6b4a" /><polygon points="-21,-38 0,-72 21,-38" fill="#38805a" /><polygon points="-15,-58 0,-88 15,-58" fill="#40946a" />
      <path d="M-15 -26 L0 -43 L15 -26 L7 -29 L0 -24 L-7 -29Z M-11 -48 L0 -66 L11 -48 L5 -50 L0 -45 L-5 -50Z" fill="#fff" />
    </g>);
    case 'igloo': return (<g><path d="M-34 0 A34 30 0 0 1 34 0Z" fill="#eaf4ff" stroke="#8aa4c4" strokeWidth="2" /><path d="M-30 -10 H30 M-22 -20 H22 M-10 -28 H10" stroke="#aac0d8" /><path d="M-9 0 V-9 Q0 -20 9 -9 V0Z" fill="#35455c" /></g>);
    case 'sled': return (<g><path d="M-22 -4 Q-30 -4 -28 -12 M26 -4 H-22" stroke="#6b4a2c" strokeWidth="3" fill="none" /><rect x="-20" y="-14" width="40" height="9" rx="3" fill={c(h, 75, 48)} /></g>);
    case 'barn': return (<g>
      <rect x="-30" y="-36" width="60" height="36" fill={c(h, 70, 42)} stroke="#0003" />
      <polygon points="-36,-36 0,-66 36,-36" fill={c(h + 10, 25, 28)} />
      <rect x="-10" y="-24" width="20" height="24" fill="#f4eee4" /><path d="M-10 -24 L10 0 M10 -24 L-10 0" stroke={c(h, 70, 42)} strokeWidth="2" />
      {v ? <rect x="-6" y="-52" width="12" height="9" fill="#f4eee4" /> : <circle cx="0" cy="-47" r="5" fill="#f4eee4" />}
    </g>);
    case 'cow': return (<g>
      {[-16, -8, 10, 18].map(x => <rect key={x} x={x - 2} y="-16" width="4" height="16" fill="#f3f0ea" stroke="#0002" />)}
      <ellipse cx="0" cy="-24" rx="25" ry="13" fill="#fbfaf6" stroke="#0002" /><ellipse cx="-8" cy="-27" rx="7" ry="5" fill="#2a2a2a" /><ellipse cx="9" cy="-20" rx="6" ry="4.5" fill="#2a2a2a" />
      <circle cx="-28" cy="-30" r="9" fill="#fbfaf6" stroke="#0002" /><ellipse cx="-33" cy="-27" rx="4" ry="3" fill="#f2b6b6" /><path d="M-31 -39 l-2 -5 M-25 -39 l2 -5" stroke="#bbb" strokeWidth="2" /><path d="M25 -28 Q32 -22 29 -12" stroke="#fbfaf6" strokeWidth="3" fill="none" />
    </g>);
    case 'sheep': return (<g>
      {[-10, 8].map(x => <rect key={x} x={x - 1.5} y="-14" width="3" height="14" fill="#3a3a3a" />)}
      {[[-14, -24], [0, -28], [14, -24], [-6, -18], [8, -17]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill="#f8f6f0" stroke="#0002" />)}
      <ellipse cx="-24" cy="-22" rx="7" ry="6.5" fill="#3a3a3a" />
    </g>);
    case 'haybale': return (<g><rect x="-18" y="-20" width="36" height="20" rx="4" fill="#dcb64e" stroke="#0003" /><path d="M-18 -13 H18 M-18 -6 H18 M-8 -20 V0 M8 -20 V0" stroke="#b58f2e" /></g>);
    case 'chicken': return (<g>
      <ellipse cx="0" cy="-13" rx="13" ry="10" fill={c(h, 25, 90)} stroke="#0002" /><circle cx="11" cy="-24" r="6" fill={c(h, 25, 90)} stroke="#0002" />
      <polygon points="16,-25 23,-23 16,-21" fill="#f2a22b" /><path d="M8 -31 q3 -5 6 0" stroke="#d33" strokeWidth="3" fill="none" /><path d="M-3 0 v-4 M4 0 v-4" stroke="#f2a22b" strokeWidth="2" />
    </g>);
    case 'acacia': return (<g>
      <path d="M0 0 Q-3 -26 2 -48 M2 -44 Q18 -52 26 -58 M2 -44 Q-14 -52 -24 -57" stroke="#6e4b2c" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="-60" rx="40" ry="11" fill={c(h, 45, 38)} />{v ? <ellipse cx="-4" cy="-69" rx="28" ry="8" fill={c(h, 45, 46)} /> : null}
    </g>);
    case 'giraffe': return (<g>
      {[-13, -7, 8, 14].map(x => <rect key={x} x={x - 2} y="-30" width="4" height="30" fill="#e6b04b" stroke="#0002" />)}
      <ellipse cx="0" cy="-38" rx="20" ry="11" fill="#e8b24e" stroke="#0002" /><path d="M13 -42 L21 -86" stroke="#e8b24e" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="25" cy="-90" rx="10" ry="5.5" fill="#e8b24e" stroke="#0002" /><path d="M20 -97 l-1 -6 M26 -97 l1 -6" stroke="#7a4a1e" strokeWidth="2" />
      {[[-8, -40], [5, -36], [-1, -33], [17, -62], [19, -76]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill="#9a5f24" />)}
    </g>);
    case 'elephant': return (<g>
      {[-18, -8, 10, 20].map(x => <rect key={x} x={x - 4} y="-16" width="8" height="16" rx="2" fill={c(h, 8, 58)} />)}
      <ellipse cx="2" cy="-30" rx="30" ry="19" fill={c(h, 8, 62)} stroke="#0002" /><circle cx="-30" cy="-36" r="14" fill={c(h, 8, 62)} stroke="#0002" />
      <ellipse cx="-21" cy="-33" rx="9" ry="14" fill={c(h, 8, 56)} stroke="#0002" /><path d="M-40 -32 Q-48 -22 -42 -8" stroke={c(h, 8, 62)} strokeWidth="7" fill="none" strokeLinecap="round" />
      <circle cx="-34" cy="-40" r="1.8" fill="#222" /><path d="M-38 -26 l-8 5" stroke="#f4efe0" strokeWidth="3" strokeLinecap="round" />
    </g>);
    case 'zebra': return (<g>
      {[-13, -7, 8, 14].map(x => <rect key={x} x={x - 2} y="-24" width="4" height="24" fill="#f7f7f4" stroke="#222" strokeWidth="1" />)}
      <ellipse cx="0" cy="-30" rx="21" ry="11" fill="#f7f7f4" stroke="#222" strokeWidth="1.2" />
      {[-12, -6, 0, 6, 12].map(x => <path key={x} d={`M${x} -40 Q${x + 3} -30 ${x} -20`} stroke="#222" strokeWidth="3" fill="none" />)}
      <path d="M15 -36 L24 -52" stroke="#f7f7f4" strokeWidth="9" strokeLinecap="round" /><ellipse cx="29" cy="-54" rx="9" ry="5" fill="#f7f7f4" stroke="#222" />
      <path d="M17 -42 l5 6 M20 -48 l5 6" stroke="#222" strokeWidth="2.4" />
    </g>);
    case 'bush': return (<g><circle cx="-12" cy="-10" r="11" fill={c(h % 60 + 90, 45, 30)} /><circle cx="6" cy="-14" r="14" fill={c(h % 60 + 90, 45, 36)} /><circle cx="18" cy="-8" r="9" fill={c(h % 60 + 90, 45, 28)} /></g>);
    case 'cathedral': return (<g>
      <rect x="-30" y="-46" width="60" height="46" fill={c(h, 15, 74)} stroke="#0003" />
      <rect x="-44" y="-76" width="20" height="76" fill={c(h, 15, 68)} stroke="#0003" /><rect x="24" y="-76" width="20" height="76" fill={c(h, 15, 68)} stroke="#0003" />
      <polygon points="-47,-76 -34,-106 -21,-76" fill={c(h, 30, 34)} /><polygon points="21,-76 34,-106 47,-76" fill={c(h, 30, 34)} />
      <circle cx="0" cy="-30" r="9" fill="#2a3a6a" stroke="#d8c58a" strokeWidth="2" /><path d="M-6 0 V-10 Q0 -20 6 -10 V0Z" fill="#2a2432" />
    </g>);
    case 'archwin': return (<g>
      <path d="M-16 0 V-32 Q-16 -52 0 -62 Q16 -52 16 -32 V0Z" fill={c(h, 15, 66)} stroke="#0003" />
      <path d={v ? 'M-9 -4 V-32 Q-9 -46 0 -54 Q9 -46 9 -32 V-4Z' : 'M-9 -4 V-30 Q0 -50 9 -30 V-4Z'} fill="#2d3f7a" stroke="#d8c58a" /><path d="M0 -52 V-4 M-9 -26 H9" stroke="#d8c58a" strokeWidth="1.5" />
    </g>);
    case 'bench': return (<g><rect x="-24" y="-18" width="48" height="5" rx="1" fill={c(h, 45, 40)} /><rect x="-24" y="-28" width="48" height="5" rx="1" fill={c(h, 45, 40)} /><path d="M-20 -13 V0 M20 -13 V0 M-20 -28 V-18 M20 -28 V-18" stroke="#333" strokeWidth="3" /></g>);
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
