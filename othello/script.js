(() => {
  const BOARD_SIZE = 8;
  const PLAYER_BLACK = 'B';
  const PLAYER_WHITE = 'W';

  /** @type {('B'|'W')=} */
  let currentPlayer;
  /** @type {(('B'|'W')|null)[][]} */
  let board;
  /** @type {{board:(('B'|'W')|null)[][], currentPlayer:'B'|'W', lastMove:{row:number,col:number}|null}[]} */
  let history;
  /** @type {{row:number,col:number}|null} */
  let lastMove = null;
  let gameOver = false;
  let hintsEnabled = true;

  const elements = {
    board: document.getElementById('board'),
    blackCount: document.getElementById('blackCount'),
    whiteCount: document.getElementById('whiteCount'),
    turn: document.getElementById('turn'),
    passBtn: document.getElementById('passBtn'),
    undoBtn: document.getElementById('undoBtn'),
    restartBtn: document.getElementById('restartBtn'),
    hintsToggle: document.getElementById('hintsToggle'),
    message: document.getElementById('message'),
  };

  function createInitialBoard() {
    const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    const mid = BOARD_SIZE / 2;
    newBoard[mid - 1][mid - 1] = PLAYER_WHITE;
    newBoard[mid][mid] = PLAYER_WHITE;
    newBoard[mid - 1][mid] = PLAYER_BLACK;
    newBoard[mid][mid - 1] = PLAYER_BLACK;
    return newBoard;
  }

  function deepCopyBoard(src) {
    return src.map(row => row.slice());
  }

  function getOpponent(player) {
    return player === PLAYER_BLACK ? PLAYER_WHITE : PLAYER_BLACK;
  }

  function isOnBoard(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  function findFlips(boardState, row, col, player) {
    if (boardState[row][col] !== null) return [];
    const opponent = getOpponent(player);
    const flips = [];

    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const line = [];

      if (!isOnBoard(r, c) || boardState[r][c] !== opponent) continue;
      while (isOnBoard(r, c) && boardState[r][c] === opponent) {
        line.push({ r, c });
        r += dr;
        c += dc;
      }
      if (!isOnBoard(r, c)) continue;
      if (boardState[r][c] === player && line.length > 0) {
        for (const pos of line) flips.push(pos);
      }
    }
    return flips;
  }

  function getLegalMoves(boardState, player) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardState[r][c] !== null) continue;
        const flips = findFlips(boardState, r, c, player);
        if (flips.length > 0) moves.push({ row: r, col: c, flips });
      }
    }
    return moves;
  }

  function applyMove(boardState, row, col, player) {
    const copy = deepCopyBoard(boardState);
    const flips = findFlips(copy, row, col, player);
    if (flips.length === 0) return null; // illegal
    copy[row][col] = player;
    for (const { r, c } of flips) {
      copy[r][c] = player;
    }
    return copy;
  }

  function countDiscs(boardState) {
    let black = 0, white = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = boardState[r][c];
        if (v === PLAYER_BLACK) black++;
        else if (v === PLAYER_WHITE) white++;
      }
    }
    return { black, white };
  }

  function isGameOver(boardState) {
    const blackMoves = getLegalMoves(boardState, PLAYER_BLACK);
    const whiteMoves = getLegalMoves(boardState, PLAYER_WHITE);
    return blackMoves.length === 0 && whiteMoves.length === 0;
  }

  function buildBoardGrid() {
    elements.board.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        elements.board.appendChild(cell);
      }
    }
  }

  function render() {
    const legalMoves = getLegalMoves(board, currentPlayer);
    const legalSet = new Set(legalMoves.map(m => `${m.row},${m.col}`));

    const cells = elements.board.children;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const r = Number(cell.dataset.row);
      const c = Number(cell.dataset.col);
      cell.classList.remove('hint', 'last-move');
      cell.innerHTML = '';

      const v = board[r][c];
      if (v) {
        const disc = document.createElement('div');
        disc.className = `disc ${v === PLAYER_BLACK ? 'black' : 'white'}`;
        cell.appendChild(disc);
      } else if (hintsEnabled && legalSet.has(`${r},${c}`)) {
        cell.classList.add('hint');
      }

      if (lastMove && lastMove.row === r && lastMove.col === c) {
        cell.classList.add('last-move');
      }
    }

    const { black, white } = countDiscs(board);
    elements.blackCount.textContent = String(black);
    elements.whiteCount.textContent = String(white);

    if (gameOver) {
      const result = black === white ? '引き分け' : (black > white ? '黒の勝ち' : '白の勝ち');
      elements.turn.textContent = 'ゲーム終了';
      elements.message.textContent = `最終結果: 黒 ${black} - 白 ${white}（${result}）`;
      elements.passBtn.disabled = true;
    } else {
      elements.turn.textContent = `手番: ${currentPlayer === PLAYER_BLACK ? '黒' : '白'}`;
      const canPlay = legalMoves.length > 0;
      elements.passBtn.disabled = canPlay; // 打てる手があるならパスできない
      elements.message.textContent = canPlay ? '' : '打てる手がありません。パスが必要です。';
    }

    elements.undoBtn.disabled = history.length <= 1;
  }

  function pushHistory() {
    history.push({ board: deepCopyBoard(board), currentPlayer, lastMove: lastMove ? { ...lastMove } : null });
  }

  function handleCellClick(e) {
    if (gameOver) return;
    const cell = e.target.closest('.cell');
    if (!cell || !elements.board.contains(cell)) return;

    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    const nextBoard = applyMove(board, r, c, currentPlayer);
    if (!nextBoard) return; // illegal

    pushHistory();
    board = nextBoard;
    lastMove = { row: r, col: c };
    currentPlayer = getOpponent(currentPlayer);

    if (isGameOver(board)) {
      gameOver = true;
    }
    render();

    // If next player has no moves but the other still had, we simply show message and enable Pass
    if (!gameOver) {
      const canNext = getLegalMoves(board, currentPlayer).length > 0;
      if (!canNext) {
        elements.message.textContent = '打てる手がありません。パスしてください。';
      }
    }
  }

  function handlePass() {
    if (gameOver) return;
    const canPlay = getLegalMoves(board, currentPlayer).length > 0;
    if (canPlay) return; // only allowed when no legal moves

    pushHistory();
    currentPlayer = getOpponent(currentPlayer);
    elements.message.textContent = '';

    if (isGameOver(board)) {
      gameOver = true;
    }
    render();
  }

  function handleUndo() {
    if (history.length <= 1) return;
    history.pop();
    const prev = history[history.length - 1];
    board = deepCopyBoard(prev.board);
    currentPlayer = prev.currentPlayer;
    lastMove = prev.lastMove ? { ...prev.lastMove } : null;
    gameOver = isGameOver(board);
    render();
  }

  function restart() {
    init();
  }

  function init() {
    board = createInitialBoard();
    currentPlayer = PLAYER_BLACK;
    history = [];
    lastMove = null;
    gameOver = false;
    if (elements.hintsToggle) hintsEnabled = elements.hintsToggle.checked;

    buildBoardGrid();
    pushHistory();
    render();
  }

  // events
  elements.board.addEventListener('click', handleCellClick);
  elements.passBtn.addEventListener('click', handlePass);
  elements.undoBtn.addEventListener('click', handleUndo);
  elements.restartBtn.addEventListener('click', restart);
  elements.hintsToggle.addEventListener('change', (e) => {
    hintsEnabled = e.target.checked;
    render();
  });

  // start
  init();
})();
