import { useEffect, useMemo, useRef, useState } from 'react';
import { tokens, core, hideOrder, accuracy } from '../text.js';
import Recall from '../Recall.jsx';

const FRAC = [0.15, 0.4, 0.7, 1];
const NOTE = ['A few words are missing.', 'Fewer words to lean on.', 'Most of the verse is hidden.', 'Type the whole verse from memory.'];
const split = w => { const m = w.match(/^([^A-Za-z]*)(.*?)([^A-Za-z]*)$/); return [m[1], m[2], m[3]]; };

/** Fading blanks: the verse loses more of its words at each stage, until you say it all yourself. */
export default function Fade({ verse, onDone, startStage = 1 }) {
  const words = useMemo(() => tokens(verse.text), [verse]);
  const order = useMemo(() => hideOrder(words, verse.n * 7919 + words.length), [words]);
  const [stage, setStage] = useState(startStage);
  const [vals, setVals] = useState({});
  const [state, setState] = useState({});
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [cleared, setCleared] = useState(false);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null);
  const refs = useRef({});

  const hidden = useMemo(() => new Set(order.slice(0, Math.ceil(FRAC[stage - 1] * order.length))), [order, stage]);
  const hiddenList = useMemo(() => [...hidden].sort((a, b) => a - b), [hidden]);

  useEffect(() => { setVals({}); setState({}); setCleared(false); setTyped(''); setResult(null); setTimeout(() => refs.current[hiddenList[0]]?.focus(), 60); }, [stage]);

  const check = () => {
    const next = {}; let bad = 0;
    hiddenList.forEach(i => { const ok = core(vals[i] || '') === core(words[i]); next[i] = ok ? 'ok' : 'bad'; if (!ok) bad++; });
    setState(next);
    if (bad) setMistakes(m => m + 1); else setCleared(true);
  };
  const hint = () => {
    const i = hiddenList.find(k => core(vals[k] || '') !== core(words[k]));
    if (i === undefined) return;
    setVals(v => ({ ...v, [i]: core(words[i]).slice(0, 1) })); setState(s => ({ ...s, [i]: undefined })); setHints(h => h + 1);
    refs.current[i]?.focus();
  };
  const goNext = from => {
    const k = hiddenList.find(i => i > from && core(vals[i] || '') !== core(words[i]));
    if (k !== undefined) refs.current[k]?.focus();
  };

  const finishRecall = () => {
    const acc = accuracy(typed, verse.text);
    setResult(acc);
  };
  const stageHint = () => {                      // the next word of the verse, added to what you have typed
    const n = tokens(typed).length;
    if (n >= words.length) return;
    setTyped(t => (t.trim() ? t.trimEnd() + ' ' : '') + words[n]); setHints(h => h + 1);
  };
  const penalty = Math.min(0.4, mistakes * 0.02 + hints * 0.04);
  const score = acc => Math.max(0, acc - penalty);

  return (
    <div className="fade">
      <div className="stages" role="tablist" aria-label="Stage">
        {[1, 2, 3, 4].map(s => <button key={s} role="tab" aria-selected={stage === s} className={stage === s ? 'on' : s < stage ? 'past' : ''} onClick={() => setStage(s)}>{s}</button>)}
        <span className="small">Stage {stage} of 4. {NOTE[stage - 1]}</span>
      </div>

      {stage < 4 && (
        <>
          <p className="verse-text">
            <sup>{verse.n}</sup>{' '}
            {words.map((w, i) => {
              if (!hidden.has(i)) return <span key={i}>{w} </span>;
              const [pre, mid, post] = split(w);
              return (
                <span key={i} className="blank-wrap">{pre}
                  <input ref={el => { refs.current[i] = el; }} className={'blank ' + (state[i] || '')} style={{ width: `${Math.max(3, core(mid).length + 1)}ch` }}
                    value={vals[i] || ''} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-label={`Missing word ${hiddenList.indexOf(i) + 1}`}
                    onChange={e => { setVals(v => ({ ...v, [i]: e.target.value })); setState(s => ({ ...s, [i]: undefined })); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goNext(i); } }} />
                  {post} </span>
              );
            })}
          </p>
          {cleared ? (
            <div className="actions"><b className="good-line">All filled in.</b><button className="primary" onClick={() => setStage(stage + 1)}>Next stage</button></div>
          ) : (
            <div className="actions"><button className="primary" onClick={check}>Check</button><button onClick={hint}>Hint{hints ? ` (${hints})` : ''}</button><button className="quiet" onClick={() => onDone(null)}>Skip verse</button></div>
          )}
        </>
      )}

      {stage === 4 && result === null && (
        <>
          <p className="verse-ref"><sup>{verse.n}</sup> Say verse {verse.n} from memory.</p>
          <textarea className="recite" rows={4} value={typed} onChange={e => setTyped(e.target.value)} placeholder="Type the verse here" autoCapitalize="sentences" spellCheck={false} />
          <div className="actions"><button className="primary" onClick={finishRecall} disabled={!typed.trim()}>Check</button><button onClick={stageHint}>Hint{hints ? ` (${hints})` : ''}</button><button className="quiet" onClick={() => onDone(null)}>Skip verse</button></div>
        </>
      )}
      {stage === 4 && result !== null && (
        <Recall verse={verse} typed={typed} acc={result} onRetry={() => { setResult(null); }} onContinue={() => onDone(score(result))} />
      )}
    </div>
  );

}
