import { useMemo, useState } from 'react';
import { Play } from '../wordsearch/WordSearch.jsx';
import { LEVEL_CFG, LEVEL_KEYS, randomSeed } from '../wordsearch/packs.js';
import { refLabel, parseCode } from './books.js';
import { usePassage } from './Passage.jsx';
import { keyWords } from './text.js';
import { addXp } from './store.js';

/** A word search built from the key words of any passage. Finishing it reveals the passage. */
export default function BibleSearch({ code, navigate }) {
  const state = usePassage(code);
  const ref = useMemo(() => parseCode(code), [code]);
  const [level, setLevel] = useState('easy');
  const [seed, setSeed] = useState(randomSeed);
  const [started, setStarted] = useState(false);

  if (state.status === 'loading') return <div className="screen"><p className="screen-sub">Opening {ref ? refLabel(ref) : 'passage'}…</p></div>;
  if (state.status === 'error') return (
    <div className="screen">
      <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
      <h1 className="screen-title">Could not open that passage</h1>
      <p className="screen-sub">{state.message}</p>
    </div>
  );
  const { passage } = state;
  const text = passage.verses.map(v => `${v.n} ${v.text}`).join(' ');
  const cfg = LEVEL_CFG[level];
  const words = keyWords(passage.verses.map(v => v.text).join(' '), cfg.count, seed);

  if (!started) {
    return (
      <div className="screen">
        <button className="back" onClick={() => navigate('/bible')}>‹ Bible memory</button>
        <h1 className="screen-title">Word search</h1>
        <p className="screen-sub">Find the key words of {refLabel(ref)}. When you have them all, the passage is revealed.</p>
        <div className="field">
          <span>Level</span>
          <div className="seg" role="radiogroup" aria-label="Level">
            {LEVEL_KEYS.map(k => <button key={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>{LEVEL_CFG[k].label}</button>)}
          </div>
          <small>{LEVEL_CFG[level].note}</small>
        </div>
        {words.length < 3 ? <p className="small warn">This passage is too short to build a word search. Pick a longer one.</p>
          : <button className="primary big" onClick={() => setStarted(true)}>Start ({words.length} words)</button>}
      </div>
    );
  }
  const def = { title: refLabel(ref), words, size: cfg.size, level, seed, message: text.length > 1400 ? text.slice(0, 1400) + '…' : text };
  return <Play key={seed + level} def={def} back="/bible" navigate={navigate} cat="bible"
    again={() => setSeed(randomSeed())} onSolved={() => addXp(15)} />;
}
