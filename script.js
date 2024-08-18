const chessboard = document.getElementById("chessboard");
const resetButton = document.getElementById("resetButton");
let initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const pieces = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟",
  R: "♖",
  N: "♘",
  B: "♗",
  Q: "♕",
  K: "♔",
  P: "♙",
};

let selectedPiece = null;
let selectedSquare = null;
let currentPlayer = "white";
let moveHistory = [];
let enPassantTarget = null;

function drawBoard(board) {
  chessboard.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((i + j) % 2 === 0 ? "white" : "black");
      square.dataset.row = i;
      square.dataset.col = j;
      if (board[i][j]) {
        const piece = document.createElement("div");
        piece.classList.add("piece");
        piece.textContent = pieces[board[i][j]];
        piece.dataset.piece = board[i][j];
        square.appendChild(piece);
      }
      square.addEventListener("click", () => selectSquare(square));
      chessboard.appendChild(square);
    }
  }
}

function selectSquare(square) {
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);

  if (selectedPiece) {
    if (isValidMove(selectedSquare, square)) {
      movePiece(selectedSquare, square);
      if (isInCheck(currentPlayer)) {
        alert("Invalid move, you are in check!");
        undoLastMove();
      } else {
        currentPlayer = currentPlayer === "white" ? "black" : "white";
        if (isCheckmate(currentPlayer)) {
          alert(
            `Checkmate! ${currentPlayer === "white" ? "Black" : "White"} wins!`
          );
        }
      }
    }
    clearHighlights();
    selectedPiece = null;
    selectedSquare = null;
    drawBoard(initialBoard);
  } else if (
    square.firstChild &&
    isCurrentPlayerPiece(square.firstChild.dataset.piece)
  ) {
    selectedPiece = square.firstChild.dataset.piece;
    selectedSquare = square;
    highlightMoves(square);
  }
}

function isCurrentPlayerPiece(piece) {
  return (
    (currentPlayer === "white" && piece === piece.toUpperCase()) ||
    (currentPlayer === "black" && piece === piece.toLowerCase())
  );
}

function highlightMoves(square) {
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);

  const moves = getPossibleMoves(square, row, col);
  moves.forEach((move) => {
    const targetSquare = document.querySelector(
      `[data-row="${move[0]}"][data-col="${move[1]}"]`
    );
    if (targetSquare) targetSquare.classList.add("highlight");
  });
}

function clearHighlights() {
  document.querySelectorAll(".highlight").forEach((square) => {
    square.classList.remove("highlight");
  });
}

function getPossibleMoves(square, row, col) {
  const piece = square.firstChild.dataset.piece;
  const moves = [];

  if (piece.toLowerCase() === "p") {
    const direction = piece === "P" ? -1 : 1;
    if (!initialBoard[row + direction][col]) {
      moves.push([row + direction, col]);
      if ((piece === "P" && row === 6) || (piece === "p" && row === 1)) {
        if (!initialBoard[row + 2 * direction][col]) {
          moves.push([row + 2 * direction, col]);
          enPassantTarget = [row + 2 * direction, col];
        }
      }
    }
    if (
      col > 0 &&
      initialBoard[row + direction][col - 1] &&
      isOpponentPiece(piece, initialBoard[row + direction][col - 1])
    ) {
      moves.push([row + direction, col - 1]);
    }
    if (
      col < 7 &&
      initialBoard[row + direction][col + 1] &&
      isOpponentPiece(piece, initialBoard[row + direction][col + 1])
    ) {
      moves.push([row + direction, col + 1]);
    }
    if (
      enPassantTarget &&
      row + direction === enPassantTarget[0] &&
      col + 1 === enPassantTarget[1] &&
      isOpponentPiece(piece, initialBoard[row][col + 1])
    ) {
      moves.push([row + direction, col + 1]);
    }
    if (
      enPassantTarget &&
      row + direction === enPassantTarget[0] &&
      col - 1 === enPassantTarget[1] &&
      isOpponentPiece(piece, initialBoard[row][col - 1])
    ) {
      moves.push([row + direction, col - 1]);
    }
  }

  if (piece.toLowerCase() === "r") {
    for (let i = row + 1; i < 8 && !initialBoard[i][col]; i++) {
      moves.push([i, col]);
    }
    for (let i = row - 1; i >= 0 && !initialBoard[i][col]; i--) {
      moves.push([i, col]);
    }
    for (let j = col + 1; j < 8 && !initialBoard[row][j]; j++) {
      moves.push([row, j]);
    }
    for (let j = col - 1; j >= 0 && !initialBoard[row][j]; j--) {
      moves.push([row, j]);
    }
  }

  if (piece.toLowerCase() === "n") {
    const knightMoves = [
      [row - 2, col - 1],
      [row - 2, col + 1],
      [row - 1, col - 2],
      [row - 1, col + 2],
      [row + 1, col - 2],
      [row + 1, col + 2],
      [row + 2, col - 1],
      [row + 2, col + 1],
    ];
    knightMoves.forEach((move) => {
      if (
        move[0] >= 0 &&
        move[0] < 8 &&
        move[1] >= 0 &&
        move[1] < 8 &&
        (!initialBoard[move[0]][move[1]] ||
          isOpponentPiece(piece, initialBoard[move[0]][move[1]]))
      ) {
        moves.push(move);
      }
    });
  }

  if (piece.toLowerCase() === "b") {
    for (
      let i = 1;
      row + i < 8 && col + i < 8 && !initialBoard[row + i][col + i];
      i++
    ) {
      moves.push([row + i, col + i]);
    }
    for (
      let i = 1;
      row + i < 8 && col - i >= 0 && !initialBoard[row + i][col - i];
      i++
    ) {
      moves.push([row + i, col - i]);
    }
    for (
      let i = 1;
      row - i >= 0 && col + i < 8 && !initialBoard[row - i][col + i];
      i++
    ) {
      moves.push([row - i, col + i]);
    }
    for (
      let i = 1;
      row - i >= 0 && col - i >= 0 && !initialBoard[row - i][col - i];
      i++
    ) {
      moves.push([row - i, col - i]);
    }
  }

  if (piece.toLowerCase() === "q") {
    moves.push(
      ...getPossibleMoves(
        {
          firstChild: {
            dataset: { piece: piece.toUpperCase() === piece ? "B" : "b" },
          },
        },
        row,
        col
      )
    );
    moves.push(
      ...getPossibleMoves(
        {
          firstChild: {
            dataset: { piece: piece.toUpperCase() === piece ? "R" : "r" },
          },
        },
        row,
        col
      )
    );
  }

  if (piece.toLowerCase() === "k") {
    const kingMoves = [
      [row - 1, col - 1],
      [row - 1, col],
      [row - 1, col + 1],
      [row, col - 1],
      [row, col + 1],
      [row + 1, col - 1],
      [row + 1, col],
      [row + 1, col + 1],
    ];
    kingMoves.forEach((move) => {
      if (
        move[0] >= 0 &&
        move[0] < 8 &&
        move[1] >= 0 &&
        move[1] < 8 &&
        (!initialBoard[move[0]][move[1]] ||
          isOpponentPiece(piece, initialBoard[move[0]][move[1]]))
      ) {
        moves.push(move);
      }
    });
  }

  return moves;
}

function isOpponentPiece(piece, target) {
  return (
    (piece === piece.toUpperCase() && target === target.toLowerCase()) ||
    (piece === piece.toLowerCase() && target === target.toUpperCase())
  );
}

function isValidMove(fromSquare, toSquare) {
  const fromRow = parseInt(fromSquare.dataset.row);
  const fromCol = parseInt(fromSquare.dataset.col);
  const toRow = parseInt(toSquare.dataset.row);
  const toCol = parseInt(toSquare.dataset.col);

  const possibleMoves = getPossibleMoves(fromSquare, fromRow, fromCol);
  return possibleMoves.some((move) => move[0] === toRow && move[1] === toCol);
}

function movePiece(fromSquare, toSquare) {
  const fromRow = parseInt(fromSquare.dataset.row);
  const fromCol = parseInt(fromSquare.dataset.col);
  const toRow = parseInt(toSquare.dataset.row);
  const toCol = parseInt(toSquare.dataset.col);

  moveHistory.push({
    from: [fromRow, fromCol],
    to: [toRow, toCol],
    piece: initialBoard[fromRow][fromCol],
    captured: initialBoard[toRow][toCol],
  });

  initialBoard[toRow][toCol] = initialBoard[fromRow][fromCol];
  initialBoard[fromRow][fromCol] = "";

  if (
    enPassantTarget &&
    toRow === enPassantTarget[0] &&
    toCol === enPassantTarget[1]
  ) {
    initialBoard[fromRow][toCol] = "";
  }
  enPassantTarget = null;
  drawBoard(initialBoard);
}

function isInCheck(player) {
  const king = player === "white" ? "K" : "k";
  let kingPosition;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (initialBoard[i][j] === king) {
        kingPosition = [i, j];
        break;
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = initialBoard[i][j];
      if (piece && isOpponentPiece(king, piece)) {
        const possibleMoves = getPossibleMoves(
          { firstChild: { dataset: { piece } } },
          i,
          j
        );
        if (
          possibleMoves.some(
            (move) => move[0] === kingPosition[0] && move[1] === kingPosition[1]
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function isCheckmate(player) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = initialBoard[i][j];
      if (piece && isCurrentPlayerPiece(piece)) {
        const possibleMoves = getPossibleMoves(
          { firstChild: { dataset: { piece } } },
          i,
          j
        );
        for (const move of possibleMoves) {
          movePiece(
            document.querySelector(`[data-row="${i}"][data-col="${j}"]`),
            document.querySelector(
              `[data-row="${move[0]}"][data-col="${move[1]}"]`
            )
          );
          const inCheck = isInCheck(player);
          undoLastMove();
          if (!inCheck) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function undoLastMove() {
  const lastMove = moveHistory.pop();
  if (lastMove) {
    initialBoard[lastMove.from[0]][lastMove.from[1]] = lastMove.piece;
    initialBoard[lastMove.to[0]][lastMove.to[1]] = lastMove.captured;
    drawBoard(initialBoard);
  }
}

resetButton.addEventListener("click", () => {
  initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];
  selectedPiece = null;
  selectedSquare = null;
  currentPlayer = "white";
  moveHistory = [];
  enPassantTarget = null;
  drawBoard(initialBoard);
});

drawBoard(initialBoard);
