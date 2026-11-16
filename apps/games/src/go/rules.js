// Go rules, pure functions. Board is a flat array: 0 empty, 1 black, 2 white. Index = y * size + x.
export const EMPTY = 0, BLACK = 1, WHITE = 2;
export const other = c => (c === BLACK ? WHITE : BLACK);

export function neighbors(i, size) {
  const x = i % size, y = (i / size) | 0, out = [];
  if (x > 0) out.push(i - 1);
  if (x < size - 1) out.push(i + 1);
  if (y > 0) out.push(i - size);
  if (y < size - 1) out.push(i + size);
  return out;
}

export function newGame(size, komi = 6.5) {
  const board = new Array(size * size).fill(EMPTY);
  return { size, komi, board, turn: BLACK, captures: { [BLACK]: 0, [WHITE]: 0 }, passes: 0, last: null, key: board.join('') };
}

/** Connected stones of one colour containing i, plus the empty points that touch them. */
export function groupAt(board, size, i) {
  const colour = board[i], stones = [i], seen = new Set([i]), libs = new Set();
  for (let k = 0; k < stones.length; k++) {
    for (const n of neighbors(stones[k], size)) {
      if (board[n] === EMPTY) libs.add(n);
      else if (board[n] === colour && !seen.has(n)) { seen.add(n); stones.push(n); }
    }
  }
  return { stones, libs };
}

/**
 * Try to play `turn` at point i. `history` is every earlier state (positional superko: a move may not
 * recreate any earlier whole-board position). Returns { state } or { error }.
 */
export function play(state, i, history = []) {
  const { size, turn } = state;
  if (state.board[i] !== EMPTY) return { error: 'occupied' };
  const board = state.board.slice();
  board[i] = turn;
  const foe = other(turn);
  let taken = 0;
  const done = new Set();
  for (const n of neighbors(i, size)) {
    if (board[n] === foe && !done.has(n)) {
      const g = groupAt(board, size, n);
      g.stones.forEach(s => done.add(s));
      if (g.libs.size === 0) { g.stones.forEach(s => { board[s] = EMPTY; }); taken += g.stones.length; }
    }
  }
  if (groupAt(board, size, i).libs.size === 0) return { error: 'suicide' };
  const key = board.join('');
  if (key === state.key || history.some(h => h.key === key)) return { error: 'ko' };
  return {
    state: {
      ...state, board, key, turn: foe, passes: 0, last: i,
      captures: { ...state.captures, [turn]: state.captures[turn] + taken }
    }
  };
}

export function pass(state) {
  return { ...state, turn: other(state.turn), passes: state.passes + 1, last: -1 };
}

/** Replay a list of moves (point index, or -1 for pass). Returns { state, history } or throws on an illegal move. */
export function replay(size, komi, moves) {
  let state = newGame(size, komi);
  const history = [];
  for (const m of moves) {
    history.push(state);
    if (m === -1) state = pass(state);
    else {
      const r = play(state, m, history);
      if (r.error) throw new Error('illegal move in record: ' + r.error);
      state = r.state;
    }
  }
  return { state, history };
}

/** All stones of the group at i (used when marking dead groups in the scoring phase). */
export function stonesOfGroup(board, size, i) {
  return board[i] === EMPTY ? [] : groupAt(board, size, i).stones;
}

/**
 * Territory scoring (Japanese style). `dead` is a Set of point indices the players agreed are dead.
 * Dead stones become the opponent's prisoners and their points count as empty.
 */
export function score(state, dead = new Set()) {
  const { size, board, komi } = state;
  const b = board.map((c, i) => (dead.has(i) ? EMPTY : c));
  const deadOf = { [BLACK]: 0, [WHITE]: 0 };
  dead.forEach(i => { if (board[i] !== EMPTY) deadOf[board[i]]++; });
  const territory = { [BLACK]: 0, [WHITE]: 0 }, owner = new Array(size * size).fill(0), seen = new Set();
  for (let i = 0; i < b.length; i++) {
    if (b[i] !== EMPTY || seen.has(i)) continue;
    const region = [i], touches = new Set();
    seen.add(i);
    for (let k = 0; k < region.length; k++) {
      for (const n of neighbors(region[k], size)) {
        if (b[n] === EMPTY) { if (!seen.has(n)) { seen.add(n); region.push(n); } }
        else touches.add(b[n]);
      }
    }
    if (touches.size === 1) {
      const who = [...touches][0];
      territory[who] += region.length;
      region.forEach(p => { owner[p] = who; });
    }
  }
  const black = territory[BLACK] + state.captures[BLACK] + deadOf[WHITE];
  const white = territory[WHITE] + state.captures[WHITE] + deadOf[BLACK] + komi;
  return {
    owner,
    black: { territory: territory[BLACK], prisoners: state.captures[BLACK] + deadOf[WHITE], total: black },
    white: { territory: territory[WHITE], prisoners: state.captures[WHITE] + deadOf[BLACK], komi, total: white },
    winner: black > white ? BLACK : WHITE,
    margin: Math.abs(black - white)
  };
}

export function starPoints(size) {
  const pts = size === 9 ? [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]]
    : size === 13 ? [3, 6, 9].flatMap(y => [3, 6, 9].map(x => [x, y]))
    : [3, 9, 15].flatMap(y => [3, 9, 15].map(x => [x, y]));
  return pts.map(([x, y]) => y * size + x);
}
