const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

/** On-screen keyboard. `states` maps a letter to 'correct' | 'present' | 'absent' for colouring. */
export default function Keyboard({ onKey, states = {}, disabled, enter = 'Enter', simple = false }) {
  const press = k => e => { e.preventDefault(); if (!disabled) onKey(k); };
  return (
    <div className="kb" role="group" aria-label="Keyboard">
      {ROWS.map((row, i) => (
        <div className="kb-row" key={row}>
          {i === 2 && !simple && <button className="kb-key wide" onPointerDown={press('ENTER')} onClick={e => e.preventDefault()}>{enter}</button>}
          {row.split('').map(ch => (
            <button key={ch} className={'kb-key ' + (states[ch] || '')} onPointerDown={press(ch)} onClick={e => e.preventDefault()}>{ch}</button>
          ))}
          {i === 2 && !simple && <button className="kb-key wide" aria-label="Backspace" onPointerDown={press('BACK')} onClick={e => e.preventDefault()}>⌫</button>}
        </div>
      ))}
    </div>
  );
}
