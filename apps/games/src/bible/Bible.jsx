import { useMemo, useState } from 'react';
import { PassagePicker } from './Passage.jsx';
import { parseCode, refCode, refLabel, refShort, makeRef } from './books.js';
import { MODES, MODE_KEYS, challengeLink, decodeChallenge } from './challenge.js';
import { load, setPassage, levelFor, liveStreak, learnedCount, dueEntries, verseOfTheDay } from './store.js';
import Session from './Session.jsx';
import BibleSearch from './BibleSearch.jsx';
import Review from './Review.jsx';
import Window from './Window.jsx';

async function share(text, flash) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); flash('Link copied'); } catch { window.prompt('Copy this link', text); }
}

export default function Bible({ path, navigate }) {
  const parts = path.split('/').filter(Boolean);
  const g = parts[0];
  if (!g) return <Hub navigate={navigate} />;
  if (g === 'review') return <Review key={parts[1] || 'all'} onlyCode={parts[1]} navigate={navigate} />;
  if (g === 'window') return <Window navigate={navigate} />;
  if (g === 'challenge') return parts[1] ? <ChallengeOpen code={parts[1]} navigate={navigate} /> : <ChallengeMake navigate={navigate} />;
  if (g === 'search' && parts[1]) return <BibleSearch key={parts[1]} code={parts[1]} navigate={navigate} />;
  if (MODES[g] && g !== 'search' && parts[1]) return <Session key={g + parts[1]} code={parts[1]} mode={g} navigate={navigate} />;
  return <Hub navigate={navigate} />;
}

const storedRef = () => parseCode(load().passage) || makeRef(19, 23);

function Hub({ navigate }) {
  const [ref, setRef] = useState(storedRef);
  const p = useMemo(load, []);
  const lv = levelFor(p.xp);
  const due = dueEntries(p).length;
  const votd = parseCode(verseOfTheDay());
  const code = refCode(ref);
  const choose = r => { setRef(r); setPassage(refCode(r)); };

  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/')}>‹ Games</button>
      <h1 className="screen-title">Bible memory</h1>
      <p className="screen-sub">King James Version. Choose a chapter, or a run of verses in it, then pick how to practise.</p>

      <div className="stat-row">
        <div><b>{lv.level}</b><small>Level</small></div>
        <div><b>{liveStreak(p)}</b><small>Day streak</small></div>
        <div><b>{learnedCount(p)}</b><small>Learned</small></div>
        <div><b>{due}</b><small>Due today</small></div>
      </div>

      <h2 className="section">What to learn</h2>
      <PassagePicker value={ref} onChange={choose} />
      <div className="row">
        <button onClick={() => choose(votd)}>Verse of the day: {refLabel(votd)}</button>
      </div>

      <h2 className="section">How to practise {refLabel(ref)} <small className="muted">({refShort(ref)})</small></h2>
      <div className="mode-grid">
        {MODE_KEYS.map(k => (
          <button key={k} className="pack-card mode-card" onClick={() => navigate(`/bible/${k}/${code}`)}>
            <b>{MODES[k].title}</b><small>{MODES[k].blurb}</small>
          </button>
        ))}
      </div>

      <h2 className="section">Keep it fresh</h2>
      <button className={'feature-card' + (due ? '' : ' ink')} onClick={() => navigate('/bible/review')}>
        <span className="kicker">Spaced review</span>
        <b>{due ? `${due} verse${due > 1 ? 's' : ''} due` : 'Nothing due today'}</b>
        <span>Verses come back after 1, 3, 7, 14 and 30 days, so they stay.</span>
      </button>
      <div className="row two">
        <button className="feature-card ink" onClick={() => navigate('/bible/window')}>
          <span className="kicker">Progress</span><b>Your stained-glass windows</b><span>A pane for every verse you learn.</span>
        </button>
        <button className="feature-card ink" onClick={() => navigate('/bible/challenge')}>
          <span className="kicker">With a friend</span><b>Send a challenge</b><span>A link to {refLabel(ref)}. No accounts.</span>
        </button>
      </div>
    </div>
  );
}

function ChallengeMake({ navigate }) {
  const ref = storedRef();
  const [mode, setMode] = useState('order');
  const [name, setName] = useState('');
  const [toast, setToast] = useState('');
  const flash = m => { setToast(m); setTimeout(() => setToast(''), 1800); };
  const link = challengeLink({ p: refCode(ref), m: mode, n: name.trim() });
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">Send a challenge</h1>
      <p className="screen-sub">Pick a game and send the link. Whoever opens it plays the same passage. Everything is in the link, so nobody needs an account.</p>
      <div className="field">
        <span>Passage</span>
        <p><b>{refLabel(ref)}</b> <span className="small">({refShort(ref)}). Change it on the Bible memory page.</span></p>
      </div>
      <div className="field">
        <span>Game</span>
        <div className="mode-grid">
          {MODE_KEYS.map(k => <button key={k} role="radio" aria-checked={mode === k} className={'pack-card mode-card' + (mode === k ? ' on' : '')} onClick={() => setMode(k)}><b>{MODES[k].title}</b><small>{MODES[k].blurb}</small></button>)}
        </div>
      </div>
      <label className="field"><span>Your name <em>(optional)</em></span><input value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder="Nathan" /></label>
      <input className="linkbox" readOnly value={link} onFocus={e => e.target.select()} />
      <div className="row">
        <button className="primary" onClick={() => share(`${name.trim() ? name.trim() + ' challenges you' : 'A challenge'}: ${MODES[mode].title} on ${refLabel(ref)}.\n${link}`, flash)}>Share link</button>
        <button onClick={async () => { try { await navigator.clipboard.writeText(link); flash('Link copied'); } catch { window.prompt('Copy this link', link); } }}>Copy</button>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function ChallengeOpen({ code, navigate }) {
  const c = useMemo(() => decodeChallenge(code), [code]);
  if (!c) return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">That link is broken</h1>
      <p className="screen-sub">Ask for it again, or choose a passage yourself.</p>
    </div>
  );
  const ref = parseCode(c.p);
  return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">{c.n ? `${c.n} challenges you` : 'You have a challenge'}</h1>
      <div className="feature-card ink static">
        <span className="kicker">{MODES[c.m].title}</span>
        <b>{refLabel(ref)}</b>
        <span>{MODES[c.m].blurb}</span>
      </div>
      <button className="primary big" onClick={() => { setPassage(c.p); navigate(`/bible/${c.m}/${c.p}`); }}>Start</button>
    </div>
  );
}
