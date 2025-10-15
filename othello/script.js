(() => {
  const SIZE = 8;
  const EMPTY = 0, BLACK = 1, WHITE = 2;
  const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1],
  ];

  /** @typedef {0|1|2} Cell */
  /** @typedef {Cell[][]} Board */

  /** @type {Board} */
  let board;
  /** @type {1|2} */
  let turn;

  const boardEl = document.getElementById("board");
  const turnEl = document.getElementById("turn");
  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");
  const newGameBtn = document.getElementById("newGame");

  function newBoard() {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
    const mid = SIZE / 2;
    b[mid - 1][mid - 1] = WHITE;
    b[mid][mid] = WHITE;
    b[mid - 1][mid] = BLACK;
    b[mid][mid - 1] = BLACK;
    return b;
  }

  function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

  function opponent(player) { return player === BLACK ? WHITE : BLACK; }

  function discsToFlip(b, r, c, player) {
    if (b[r][c] !== EMPTY) return [];
    const flips = [];
    for (const [dr, dc] of DIRECTIONS) {
      const path = [];
      let rr = r + dr, cc = c + dc;
      while (inBounds(rr, cc) && b[rr][cc] === opponent(player)) {
        path.push([rr, cc]);
        rr += dr; cc += dc;
      }
      if (path.length && inBounds(rr, cc) && b[rr][cc] === player) {
        flips.push(...path);
      }
    }
    return flips;
  }

  function legalMoves(b, player) {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === EMPTY && discsToFlip(b, r, c, player).length) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  }

  function applyMove(b, r, c, player) {
    const flips = discsToFlip(b, r, c, player);
    if (!flips.length) return false;
    b[r][c] = player;
    for (const [fr, fc] of flips) b[fr][fc] = player;
    return true;
  }

  function count(b) {
    let black = 0, white = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === BLACK) black++;
        else if (b[r][c] === WHITE) white++;
      }
    }
    return { black, white };
  }

  function render() {
    boardEl.innerHTML = "";
    const moves = new Set(legalMoves(board, turn).map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        const btn = document.createElement("button");
        btn.setAttribute("role", "gridcell");
        btn.setAttribute("aria-label", `r${r+1} c${c+1}`);
        btn.addEventListener("click", () => onCellClick(r, c));
        if (moves.has(`${r},${c}`)) {
          btn.classList.add("hint");
          btn.title = "合法手";
        }
        if (board[r][c] !== EMPTY) {
          const disc = document.createElement("div");
          disc.className = `disc ${board[r][c] === BLACK ? "black" : "white"}`;
          cell.appendChild(disc);
        }
        cell.appendChild(btn);
        boardEl.appendChild(cell);
      }
    }
    const { black, white } = count(board);
    scoreEl.textContent = `黒 ${black} - ${white} 白`;
    turnEl.textContent = `手番: ${turn === BLACK ? "黒" : "白"}`;
  }

  function onCellClick(r, c) {
    if (!applyMove(board, r, c, turn)) return;
    turn = opponent(turn);
    const moves = legalMoves(board, turn);
    if (moves.length === 0) {
      // pass
      if (legalMoves(board, opponent(turn)).length === 0) {
        finishGame();
        return;
      } else {
        statusEl.textContent = `${turn === BLACK ? "黒" : "白"} はパスします`;
        turn = opponent(turn);
      }
    } else {
      statusEl.textContent = "";
    }
    render();
  }

  function finishGame() {
    const { black, white } = count(board);
    let msg = "ゲーム終了。";
    if (black > white) msg += " 黒の勝ち!";
    else if (white > black) msg += " 白の勝ち!";
    else msg += " 引き分け。";
    statusEl.textContent = msg;
  }

  function reset() {
    board = newBoard();
    turn = BLACK;
    statusEl.textContent = "";
    render();
  }

  newGameBtn.addEventListener("click", reset);
  // init
  reset();
})();
