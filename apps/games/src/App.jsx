import { useEffect, useState } from 'react';
import Go from './go/Go.jsx';
import WordSearch from './wordsearch/WordSearch.jsx';
import Wordle from './wordle/Wordle.jsx';
import Crossword from './crossword/Crossword.jsx';
import SpotDiff from './spot/SpotDiff.jsx';
import Bible from './bible/Bible.jsx';
import UpdateBanner from './shared/UpdateBanner.jsx';

const useRoute = () => {
  const read = () => location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const f = () => setRoute(read());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return route;
};
const navigate = p => { location.hash = p; window.scrollTo(0, 0); };

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInstalled = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

const starts = (route, name) => route === name || route.startsWith(name + '/');

export default function App() {
  const route = useRoute();
  let page;
  if (starts(route, '/go')) page = <Go onExit={() => navigate('/')} />;
  else if (starts(route, '/ws')) page = <WordSearch path={route.slice(3)} navigate={navigate} />;
  else if (starts(route, '/wordle')) page = <Wordle path={route.slice(7)} navigate={navigate} />;
  else if (starts(route, '/crossword')) page = <Crossword path={route.slice(10)} navigate={navigate} />;
  else if (starts(route, '/spot')) page = <SpotDiff path={route.slice(5)} navigate={navigate} />;
  else if (starts(route, '/bible')) page = <Bible path={route.slice(6)} navigate={navigate} />;
  else page = <Hub />;
  return <><UpdateBanner />{page}</>;
}

const Art = ({ children }) => <svg className="card-art draw-in" viewBox="0 0 120 120" aria-hidden="true">{children}</svg>;

function Hub() {
  const [installEvent, setInstallEvent] = useState(null);
  const [hideTip, setHideTip] = useState(() => { try { return localStorage.getItem('games.tip') === '1'; } catch { return false; } });

  useEffect(() => {
    const f = e => { e.preventDefault(); setInstallEvent(e); };
    addEventListener('beforeinstallprompt', f);
    return () => removeEventListener('beforeinstallprompt', f);
  }, []);
  const dismiss = () => { setHideTip(true); try { localStorage.setItem('games.tip', '1'); } catch { /* ignore */ } };

  const showIOSTip = isIOS() && !isInstalled() && !hideTip;
  const showInstall = installEvent && !isInstalled();

  return (
    <div className="screen hub">
      <header className="hub-head">
        <svg className="crest draw-in" viewBox="0 0 64 80" aria-hidden="true">
          <path className="ln" pathLength="1" d="M10 76V38A22 22 0 0 1 32 5 22 22 0 0 1 54 38V76" />
          <path className="ln g" pathLength="1" style={{ '--d': '.5s' }} d="M18 76V42A14 14 0 0 1 32 17 14 14 0 0 1 46 42V76M32 17V76" />
          <circle className="ln" pathLength="1" style={{ '--d': '1s' }} cx="32" cy="36" r="6" />
        </svg>
        <h1>The Games Room</h1>
        <p>Pick a game. Everything works offline once it has loaded.</p>
      </header>

      <div className="shelf">
        <button className="game-card" onClick={() => navigate('/go')}>
          <Art>
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#d9ae5c" />
            {[0, 1, 2, 3, 4].map(k => (
              <g key={k}>
                <path className="ln" pathLength="1" style={{ '--d': k * 0.08 + 's' }} d={`M24 ${24 + k * 18}H96`} />
                <path className="ln" pathLength="1" style={{ '--d': 0.4 + k * 0.08 + 's' }} d={`M${24 + k * 18} 24V96`} />
              </g>
            ))}
            <circle className="pop" style={{ '--d': '1s' }} cx="42" cy="42" r="8" fill="#161616" />
            <circle className="pop" style={{ '--d': '1.15s' }} cx="78" cy="60" r="8" fill="#f4f1e6" stroke="#8a8470" strokeWidth="1" />
            <circle className="pop" style={{ '--d': '1.3s' }} cx="60" cy="78" r="8" fill="#161616" />
          </Art>
          <span className="card-text"><b>Go</b><small>9, 13 or 19 lines. Two players, one device.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/ws')}>
          <Art>
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#f2e8d2" />
            {'WORDSEARCHFINDME'.split('').map((ch, i) => (
              <text key={i} x={25 + (i % 4) * 24} y={37 + Math.floor(i / 4) * 24} fontSize="15" fontFamily="EB Garamond, serif" fontWeight="600" fill="#2a1f14" textAnchor="middle">{ch}</text>
            ))}
            <path className="ln r" pathLength="1" style={{ '--d': '.6s' }} d="M22 32H98" strokeWidth="15" strokeLinecap="round" opacity=".38" />
          </Art>
          <span className="card-text"><b>Word search</b><small>Daily puzzles, 12 categories, three levels.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/wordle')}>
          <Art>
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#2a2320" />
            {['#3f8a4f', '#b8943a', '#4a4440', '#3f8a4f', '#4a4440', '#b8943a', '#3f8a4f', '#3f8a4f', '#4a4440', '#b8943a', '#3f8a4f', '#4a4440', '#3f8a4f', '#3f8a4f', '#3f8a4f'].map((f, i) => (
              <rect key={i} className="pop" style={{ '--d': i * 0.06 + 's' }} x={16 + (i % 5) * 18.4} y={26 + Math.floor(i / 5) * 24} width="16" height="20" rx="2" fill={f} />
            ))}
          </Art>
          <span className="card-text"><b>Wordle</b><small>Daily word, random words, and themed ones.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/crossword')}>
          <Art>
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#f2e8d2" />
            {[[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 0], [1, 2], [1, 3], [3, 0], [3, 2], [3, 3], [3, 4]].map(([c, r], i) => (
              <rect key={i} className="pop" style={{ '--d': i * 0.07 + 's' }} x={18 + c * 17} y={18 + r * 17 + (c === 3 && r !== 1 ? 0 : 0)} width="16" height="16" fill="#fff" stroke="#2a1f14" strokeWidth="1.2" />
            ))}
            <rect x="18" y="86" width="84" height="8" rx="2" fill="#2a1f14" opacity=".15" />
          </Art>
          <span className="card-text"><b>Crossword</b><small>Fill-in crosswords from your favourite categories.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/spot')}>
          <Art>
            <rect x="8" y="14" width="48" height="92" rx="5" fill="#aee0ff" />
            <rect x="64" y="14" width="48" height="92" rx="5" fill="#aee0ff" />
            <rect x="8" y="70" width="48" height="36" rx="5" fill="#86bd70" /><rect x="64" y="70" width="48" height="36" rx="5" fill="#86bd70" />
            <polygon points="32,40 20,70 44,70" fill="#c0563a" /><polygon points="88,40 76,70 100,70" fill="#c0563a" />
            <circle className="ln" pathLength="1" style={{ '--d': '.6s' }} cx="98" cy="30" r="9" stroke="#c0392b" strokeWidth="2.5" fill="none" />
            <circle cx="40" cy="30" r="5" fill="#ffd54a" /><circle cx="98" cy="30" r="5" fill="#3a7bd5" />
          </Art>
          <span className="card-text"><b>Spot the difference</b><small>Pictures drawn on the fly. Four scenes, three levels.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/bible')}>
          <Art>
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#24170f" />
            <path d="M30 104V54Q30 22 60 12Q90 22 90 54V104Z" fill="#3a2517" />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} className="pop" style={{ '--d': i * 0.08 + 's' }} x={36 + (i % 3) * 16} y={42 + Math.floor(i / 3) * 15} width="14" height="13"
                fill={['#7a4aa6', '#2f6aa8', '#2f8a63', '#d99a2b', '#f2d27a', '#232a49'][i % 6]} stroke="#150d08" />
            ))}
          </Art>
          <span className="card-text"><b>Bible memory</b><small>KJV. Blanks, word order, review, and a window that fills with light.</small></span>
        </button>
      </div>

      {showInstall && (
        <div className="tip">
          <span>Install this on your device to play offline.</span>
          <button className="primary" onClick={async () => { installEvent.prompt(); await installEvent.userChoice; setInstallEvent(null); }}>Install</button>
        </div>
      )}
      {showIOSTip && (
        <div className="tip">
          <span>To install: tap the <b>Share</b> button in Safari, then <b>Add to Home Screen</b>.</span>
          <button onClick={dismiss}>Got it</button>
        </div>
      )}

      <footer className="hub-foot"><a href="/">natevr.net</a><small>Version {__BUILD__}</small></footer>
    </div>
  );
}
