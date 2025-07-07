const boardElement = document.getElementById('board');

function createBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');

                if (row < 3) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece', 'black');
                    square.appendChild(piece);
                } else if (row > 4) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece', 'white');
                    square.appendChild(piece);
                }
            }
            boardElement.appendChild(square);
        }
    }
}

document.addEventListener('DOMContentLoaded', createBoard);
