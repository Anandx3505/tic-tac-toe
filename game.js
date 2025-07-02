document.addEventListener('DOMContentLoaded', () => {

    let gameBoard = new Array(9).fill(0);
    const winSequences = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    let j = 'X';
    let flag = false;

    const xMoves = [];
    const oMoves = [];

    const cells = document.querySelectorAll('.cell');
    const stat = document.getElementById('status');
    const resetButton = document.getElementById('reset');
    const twistOn = document.getElementById('mySwitch');

    const heading = document.querySelector('h1');
    const para = document.querySelector('p');


    twistOn.addEventListener('change', function () {
        if (this.checked) {
            document.body.style.backgroundColor = 'black';
            para.style.color = 'white';
            heading.style.color = 'white';
        } else {
            document.body.style.backgroundColor = 'white';
            para.style.color = 'black';
            heading.style.color = 'black';
        }
    });
    resetButton.addEventListener('click', resetGame);

    cells.forEach(cell => {
        cell.addEventListener('click', handleClick);
    });

    function handleClick(e) {
        if (flag) return;

        const index = e.target.dataset.index;
        if (gameBoard[index] === 0) {
            gameBoard[index] = j;
            e.target.textContent = j;
            
            if(twistOn.checked) {
                if (j === 'X') {
                xMoves.push(index);
                if (xMoves.length > 3) {
                    const oldIndex = xMoves.shift();
                    gameBoard[oldIndex] = 0;
                    cells[oldIndex].textContent = '';
                }
            } else {
                oMoves.push(index);
                if (oMoves.length > 3) {
                    const oldIndex = oMoves.shift();
                    gameBoard[oldIndex] = 0;
                    cells[oldIndex].textContent = '';
                }
            }}


            if (checkWin(gameBoard, j)) {
                stat.textContent = j + " Wins!";
                flag = true;
            } else {
                drawGame();
                j = (j === 'X') ? '0' : 'X';
            }
        } else {
            alert("Invalid move, try again!");
        }
    }

    function checkWin(gameBoard, player) {
        for (let seq of winSequences) {
            if (
                gameBoard[seq[0]] === player &&
                gameBoard[seq[1]] === player &&
                gameBoard[seq[2]] === player
            ) {
                return true;
            }
        }
        return false;
    }

    function resetGame() {
        gameBoard.fill(0);
        xMoves.length = 0;
        oMoves.length = 0;
        cells.forEach(cell => {
            cell.textContent = '';
        });
        j = 'X';
        stat.textContent = '';
        flag = false;
    }

    function drawGame() {
        if (!gameBoard.includes(0) && stat.textContent === '') {
            stat.textContent = "It's a draw!";
            flag = true;
        }
    }
});
