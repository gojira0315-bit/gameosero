/* Othello/Reversi - minimal but complete implementation */
(() => {
  const SIZE = 8;
  const EMPTY = 0, BLACK = 1, WHITE = 2;
  const boardEl = document.getElementById('board');
  const currentPlayerEl = document.getElementById('currentPlayer');
  const blackCountEl = document.getElementById('blackCount');
  const whiteCountEl = document.getElementById('whiteCount');
  const restartBtn = document.getElementById('restart');
  const showHintsEl = document.getElementById('showHints');
  const messageEl = document.getElementById('message');

  /** @type {number[][]} */
  let board;
  let current = BLACK;
  let gameOver = false;

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], /*self*/ [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  function inBounds(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE; }

  function initBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
    const mid = SIZE / 2;
    board[mid - 1][mid - 1] = WHITE;
    board[mid][mid] = WHITE;
    board[mid - 1][mid] = BLACK;
    board[mid][mid - 1] = BLACK;
    current = BLACK;
    gameOver = false;
    updateStatus();
  }

  function opponent(player) { return player === BLACK ? WHITE : BLACK; }

  function getFlipsIfMove(r, c, player) {
    if (!inBounds(r, c) || board[r][c] !== EMPTY) return [];
    const flips = [];
    for (const [dr, dc] of directions) {
      let i = r + dr, j = c + dc;
      const line = [];
      while (inBounds(i, j) && board[i][j] === opponent(player)) {
        line.push([i, j]);
        i += dr; j += dc;
      }
      if (line.length && inBounds(i, j) && board[i][j] === player) {
        flips.push(...line);
      }
    }
    return flips;
  }

  function hasAnyValidMove(player) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (getFlipsIfMove(r, c, player).length) return true;
      }
    }
    return false;
  }

  function place(r, c) {
    if (gameOver) return;
    const flips = getFlipsIfMove(r, c, current);
    if (!flips.length) return;

    board[r][c] = current;
    for (const [fr, fc] of flips) board[fr][fc] = current;

    const next = opponent(current);
    if (hasAnyValidMove(next)) {
      current = next;
    } else if (hasAnyValidMove(current)) {
      showMessage('相手はパスしました');
    } else {
      gameOver = true;
      announceWinner();
    }
    updateStatus();
    render();
  }

  function countDisks() {
    let b = 0, w = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === BLACK) b++;
        else if (board[r][c] === WHITE) w++;
      }
    }
    return { b, w };
  }

  function updateStatus() {
    const { b, w } = countDisks();
    blackCountEl.textContent = String(b);
    whiteCountEl.textContent = String(w);
    currentPlayerEl.textContent = current === BLACK ? '黒' : '白';
  }

  function showMessage(text) { messageEl.textContent = text || ''; }

  function announceWinner() {
    const { b, w } = countDisks();
    if (b > w) showMessage('ゲーム終了: 黒の勝ち');
    else if (w > b) showMessage('ゲーム終了: 白の勝ち');
    else showMessage('ゲーム終了: 引き分け');
  }

  function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `${r+1}行 ${c+1}列`);
        cell.addEventListener('click', () => place(r, c));

        const value = board[r][c];
        if (value === BLACK || value === WHITE) {
          const disk = document.createElement('div');
          disk.className = 'disk ' + (value === BLACK ? 'black' : 'white');
          cell.appendChild(disk);
        } else if (showHintsEl.checked && getFlipsIfMove(r, c, current).length) {
          cell.classList.add('hint');
        }

        boardEl.appendChild(cell);
      }
    }
  }

  restartBtn.addEventListener('click', () => { initBoard(); render(); showMessage(''); });
  showHintsEl.addEventListener('change', () => render());

  // init
  initBoard();
  render();
})();
