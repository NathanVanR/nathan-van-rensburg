import { recall } from './text.js';

/** Shows the verse with the words you missed marked, and how much you recalled. */
export default function Recall({ verse, typed, acc, onRetry, onContinue, continueLabel = 'Continue' }) {
  const words = recall(typed, verse.text);
  return (
    <div className="recall">
      <p className="verse-text">
        <sup>{verse.n}</sup>{' '}
        {words.map((w, i) => <span key={i} className={w.ok ? 'hit' : 'miss'}>{w.word} </span>)}
      </p>
      <p className="score-line"><b>{Math.round(acc * 100)}%</b> of the words in order. <span className="small">Missed words are marked in red.</span></p>
      <div className="actions">
        <button onClick={onRetry}>Try again</button>
        <button className="primary" onClick={onContinue}>{continueLabel}</button>
      </div>
    </div>
  );
}
