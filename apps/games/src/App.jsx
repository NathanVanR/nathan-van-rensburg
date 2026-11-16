import { useEffect, useState } from 'react';
import Go from './go/Go.jsx';
import WordSearch from './wordsearch/WordSearch.jsx';

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

export default function App() {
  const route = useRoute();
  if (route.startsWith('/go')) return <Go onExit={() => navigate('/')} />;
  if (route.startsWith('/ws')) return <WordSearch path={route.slice(3)} navigate={navigate} />;
  return <Hub />;
}

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
          <svg className="card-art draw-in" viewBox="0 0 120 120" aria-hidden="true">
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
          </svg>
          <span className="card-text"><b>Go</b><small>9, 13 or 19 lines. Two players, one device.</small></span>
        </button>

        <button className="game-card" onClick={() => navigate('/ws')}>
          <svg className="card-art draw-in" viewBox="0 0 120 120" aria-hidden="true">
            <rect x="8" y="8" width="104" height="104" rx="6" fill="#f2e8d2" />
            {'WORDSEARCHFINDME'.split('').slice(0, 16).map((ch, i) => (
              <text key={i} x={25 + (i % 4) * 24} y={37 + Math.floor(i / 4) * 24} fontSize="15" fontFamily="EB Garamond, serif" fontWeight="600" fill="#2a1f14" textAnchor="middle">{ch}</text>
            ))}
            <path className="ln r" pathLength="1" style={{ '--d': '.6s' }} d="M22 32H98" strokeWidth="15" strokeLinecap="round" opacity=".38" />
          </svg>
          <span className="card-text"><b>Word search</b><small>Daily puzzles, themes, and ones you make yourself.</small></span>
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

      <footer className="hub-foot"><a href="/">natevr.net</a></footer>
    </div>
  );
}
