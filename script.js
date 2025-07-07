const boardElement = document.getElementById('board');
const difficultySelect = document.getElementById('difficulty');
let difficulty = difficultySelect.value;
difficultySelect.addEventListener('change', e => {
    difficulty = e.target.value;
});
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

function hasAnyMoves(color) {
    const mustCap = hasAnyCapture(color);
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = board[r][c];
            if (p && p.color === color) {
                if (getValidMoves(r, c, mustCap).length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function computeMoveEasy() {
    clearHighlights();
    const moves = [];
    const mustCap = hasAnyCapture('black');
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = board[r][c];
            if (p && p.color === 'black') {
                const mvs = getValidMoves(r, c, mustCap);
                for (const m of mvs) {
                    moves.push({fromRow: r, fromCol: c, move: m});
                }
            }
        }
    }
    if (moves.length === 0) {
        return false;
    }
    let choice = moves[Math.floor(Math.random() * moves.length)];
    executeMove(choice.fromRow, choice.fromCol, choice.move);
    while (currentPlayer === 'black' && selected) {
        const next = selected.moves[Math.floor(Math.random() * selected.moves.length)];
        executeMove(selected.row, selected.col, next);
    }
    return true;
}

function cloneBoard(src) {
    return src.map(row => row.map(p => p ? {color: p.color, king: p.king} : null));
}

function evaluateBoard(bd) {
    let score = 0;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = bd[r][c];
            if (p) {
                let val = p.king ? 3 : 1;
                if (p.color === 'black') {
                    score += val;
                    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) score += 0.5;
                } else {
                    score -= val;
                    if (r >= 2 && r <= 5 && c >= 2 && c <= 5) score -= 0.5;
                }
            }
        }
    }
    return score;
}

function boardWithin(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function boardGetValidMoves(bd, row, col, mustCapture) {
    const piece = bd[row][col];
    if (!piece) return [];
    if (piece.king) {
        const moves = [];
        const dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of dirs) {
            let r = row + dr;
            let c = col + dc;
            while (boardWithin(r, c) && bd[r][c] === null) {
                if (!mustCapture) moves.push({row:r,col:c,capture:false});
                r += dr; c += dc;
            }
            if (boardWithin(r,c) && bd[r][c] && bd[r][c].color !== piece.color) {
                let r2 = r + dr;
                let c2 = c + dc;
                while (boardWithin(r2,c2) && bd[r2][c2] === null) {
                    moves.push({row:r2,col:c2,capture:true,remove:{row:r,col:c}});
                    r2 += dr; c2 += dc;
                }
            }
        }
        return moves;
    }
    const moves = [];
    const dirs = piece.color === 'white' ? [[-1,1],[-1,-1]] : [[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
        const r1 = row + dr;
        const c1 = col + dc;
        if (!boardWithin(r1,c1)) continue;
        if (bd[r1][c1] === null && !mustCapture) {
            moves.push({row:r1,col:c1,capture:false});
        } else if (bd[r1][c1] && bd[r1][c1].color !== piece.color) {
            const r2 = r1 + dr;
            const c2 = c1 + dc;
            if (boardWithin(r2,c2) && bd[r2][c2] === null) {
                moves.push({row:r2,col:c2,capture:true,remove:{row:r1,col:c1}});
            }
        }
    }
    return moves;
}

function boardHasAnyCapture(bd, color) {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = bd[r][c];
            if (p && p.color === color) {
                const dirs = p.king ? [[1,1],[1,-1],[-1,1],[-1,-1]]
                                    : (p.color === 'white' ? [[-1,1],[-1,-1]] : [[1,1],[1,-1]]);
                for (const [dr, dc] of dirs) {
                    let r1 = r + dr;
                    let c1 = c + dc;
                    if (!boardWithin(r1,c1)) continue;
                    if (p.king) {
                        while (boardWithin(r1,c1) && bd[r1][c1] === null) {
                            r1 += dr; c1 += dc;
                        }
                    }
                    const r2 = r1 + dr;
                    const c2 = c1 + dc;
                    if (boardWithin(r2,c2) && bd[r1] && bd[r1][c1] && bd[r1][c1].color !== p.color && bd[r2][c2] === null) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function generateMoves(bd, color) {
    const moves = [];
    const mustCap = boardHasAnyCapture(bd, color);
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const p = bd[r][c];
            if (p && p.color === color) {
                const mv = boardGetValidMoves(bd, r, c, mustCap);
                for (const m of mv) {
                    moves.push({fromRow:r, fromCol:c, move:m});
                }
            }
        }
    }
    return moves;
}

function applyMove(bd, obj) {
    const newB = cloneBoard(bd);
    const piece = newB[obj.fromRow][obj.fromCol];
    newB[obj.fromRow][obj.fromCol] = null;
    newB[obj.move.row][obj.move.col] = piece;
    if (obj.move.capture) {
        newB[obj.move.remove.row][obj.move.remove.col] = null;
    }
    if ((piece.color === 'white' && obj.move.row === 0) ||
        (piece.color === 'black' && obj.move.row === SIZE-1)) {
        piece.king = true;
    }
    return newB;
}

function minimax(bd, depth, alpha, beta, maximizing) {
    if (depth === 0) {
        return evaluateBoard(bd);
    }
    const color = maximizing ? 'black' : 'white';
    const moves = generateMoves(bd, color);
    if (moves.length === 0) {
        return maximizing ? -Infinity : Infinity;
    }
    if (maximizing) {
        let maxEval = -Infinity;
        for (const mv of moves) {
            const eval = minimax(applyMove(bd, mv), depth - 1, alpha, beta, false);
            if (eval > maxEval) maxEval = eval;
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const mv of moves) {
            const eval = minimax(applyMove(bd, mv), depth - 1, alpha, beta, true);
            if (eval < minEval) minEval = eval;
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function computeMoveHard() {
    clearHighlights();
    const moves = generateMoves(board, 'black');
    if (moves.length === 0) {
        return false;
    }
    let bestScore = -Infinity;
    let bestMove = moves[0];
    for (const mv of moves) {
        const score = minimax(applyMove(board, mv), 5, -Infinity, Infinity, false);
        if (score > bestScore) {
            bestScore = score;
            bestMove = mv;
        }
    }
    executeMove(bestMove.fromRow, bestMove.fromCol, bestMove.move);
    while (currentPlayer === 'black' && selected) {
        const nextMoves = selected.moves;
        const mv = nextMoves[Math.floor(Math.random() * nextMoves.length)];
        executeMove(selected.row, selected.col, mv);
    }
    return true;
}

function computeMoveMedium() {
    return Math.random() < 0.5 ? computeMoveEasy() : computeMoveHard();
}

function makeAIMove() {
    if (!hasAnyMoves('black')) {
        alert('Victoria del jugador');
        currentPlayer = 'white';
        return;
    }
    if (difficulty === 'easy') {
        computeMoveEasy();
    } else if (difficulty === 'medium') {
        computeMoveMedium();
    } else {
        computeMoveHard();
    }
    renderBoard();
    if (!hasAnyMoves('white')) {
        alert('Victoria de la IA');
    }
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
    if (currentPlayer === 'black') {
        makeAIMove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initBoard();
});
