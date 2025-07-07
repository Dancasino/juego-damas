const boardElement = document.getElementById('board');
const SIZE = 8;
let board = [];
let squares = [];
let selected = null;
let currentPlayer = 'white';

function initBoard() {
    board = [];
    squares = [];
    boardElement.innerHTML = '';
    for (let row = 0; row < SIZE; row++) {
        board[row] = [];
        squares[row] = [];
        for (let col = 0; col < SIZE; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }
            square.dataset.row = row;
            square.dataset.col = col;
            square.addEventListener('click', onSquareClick);
            boardElement.appendChild(square);
            squares[row][col] = square;

            let piece = null;
            if ((row + col) % 2 === 1) {
                if (row < 3) {
                    piece = { color: 'black', king: false };
                } else if (row > 4) {
                    piece = { color: 'white', king: false };
                }
            }
            board[row][col] = piece;
        }
    }
    renderBoard();
}

function renderBoard() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const square = squares[row][col];
            square.classList.remove('highlight');
            square.innerHTML = '';
            const piece = board[row][col];
            if (piece) {
                const p = document.createElement('div');
                p.classList.add('piece', piece.color);
                if (piece.king) p.classList.add('king');
                square.appendChild(p);
            }
        }
    }
}

function withinBoard(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function kingHasCapture(row, col) {
    const piece = board[row][col];
    if (!piece || !piece.king) return false;
    const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (withinBoard(r, c) && board[r][c] === null) {
            r += dr;
            c += dc;
        }
        if (withinBoard(r, c) && board[r][c] && board[r][c].color !== piece.color) {
            let r2 = r + dr;
            let c2 = c + dc;
            while (withinBoard(r2, c2) && board[r2][c2] === null) {
                return true;
            }
        }
    }
    return false;
}

function pieceHasCapture(row, col) {
    const piece = board[row][col];
    if (!piece) return false;
    if (piece.king) {
        return kingHasCapture(row, col);
    }
    const dirs = piece.color === 'white'
        ? [[-1,1],[-1,-1]]
        : [[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
        const r1 = row + dr;
        const c1 = col + dc;
        const r2 = row + dr * 2;
        const c2 = col + dc * 2;
        if (withinBoard(r2,c2) && board[r1][c1] && board[r1][c1].color !== piece.color && !board[r2][c2]) {
            return true;
        }
    }
    return false;
}

function hasAnyCapture(color) {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = board[r][c];
            if (p && p.color === color && pieceHasCapture(r,c)) {
                return true;
            }
        }
    }
    return false;
}

function getKingMoves(row, col, mustCapture) {
    const moves = [];
    const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (const [dr, dc] of dirs) {
        let r = row + dr;
        let c = col + dc;
        while (withinBoard(r, c) && board[r][c] === null) {
            if (!mustCapture) {
                moves.push({row:r, col:c, capture:false});
            }
            r += dr;
            c += dc;
        }
        if (withinBoard(r, c) && board[r][c] && board[r][c].color !== board[row][col].color) {
            let r2 = r + dr;
            let c2 = c + dc;
            while (withinBoard(r2, c2) && board[r2][c2] === null) {
                moves.push({row:r2, col:c2, capture:true, remove:{row:r, col:c}});
                r2 += dr;
                c2 += dc;
            }
        }
    }
    return moves;
}

function getValidMoves(row, col, mustCapture) {
    const piece = board[row][col];
    if (!piece) return [];
    if (piece.king) {
        return getKingMoves(row, col, mustCapture);
    }
    const moves = [];
    const dirs = piece.color === 'white'
            ? [[-1,1],[-1,-1]]
            : [[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
        const r1 = row + dr;
        const c1 = col + dc;
        if (!withinBoard(r1,c1)) continue;
        if (board[r1][c1] === null && !mustCapture) {
            moves.push({row:r1,col:c1,capture:false});
        } else if (board[r1][c1] && board[r1][c1].color !== piece.color) {
            const r2 = r1 + dr;
            const c2 = c1 + dc;
            if (withinBoard(r2,c2) && board[r2][c2] === null) {
                moves.push({row:r2,col:c2,capture:true,remove:{row:r1,col:c1}});
            }
        }
    }
    return moves;
}

function clearHighlights() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            squares[row][col].classList.remove('highlight');
        }
    }
}

function onSquareClick(e) {
    const row = parseInt(this.dataset.row, 10);
    const col = parseInt(this.dataset.col, 10);
    const piece = board[row][col];
    if (selected && selected.moves) {
        const move = selected.moves.find(m => m.row === row && m.col === col);
        if (move) {
            executeMove(selected.row, selected.col, move);
            return;
        }
    }

    if (piece && piece.color === currentPlayer) {
        const mustCap = hasAnyCapture(currentPlayer);
        const moves = getValidMoves(row, col, mustCap);
        selected = {row, col, moves};
        clearHighlights();
        for (const m of moves) {
            squares[m.row][m.col].classList.add('highlight');
        }
    } else {
        selected = null;
        clearHighlights();
    }
}

function executeMove(fromRow, fromCol, move) {
    const piece = board[fromRow][fromCol];
    board[move.row][move.col] = piece;
    board[fromRow][fromCol] = null;
    if (move.capture) {
        board[move.remove.row][move.remove.col] = null;
    }

    if ((piece.color === 'white' && move.row === 0) || (piece.color === 'black' && move.row === SIZE-1)) {
        piece.king = true;
    }

    renderBoard();

    if (move.capture && pieceHasCapture(move.row, move.col)) {
        selected = {row: move.row, col: move.col, moves: getValidMoves(move.row, move.col, true)};
        for (const m of selected.moves) {
            squares[m.row][m.col].classList.add('highlight');
        }
        return;
    }

    selected = null;
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

document.addEventListener('DOMContentLoaded', initBoard);
