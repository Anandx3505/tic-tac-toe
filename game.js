document.addEventListener('DOMContentLoaded', () => {

    let gameBoard = new Array(9).fill(0);
    const winSequences = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

    let j = 'X';

    const cells = document.querySelectorAll('.cell');
    const stat = document.getElementById('status');
    const resetButton = document.getElementById('reset');

    resetButton.addEventListener('click',resetGame);

    cells.forEach(cell => {
        cell.addEventListener('click', handleClick);
    });

    function handleClick(e) {
        const index = e.target.dataset.index;
        if (gameBoard[index] === 0) {
            gameBoard[index] = j;
            e.target.textContent = j;
            if (checkWin(gameBoard, j)) {
                stat.textContent = j + " Wins!";
            }
            else {
                drawGame();
                j = (j === 'X') ? '0' : 'X';
            }
        }
        else {
            alert("Invalid move, try again!");
        }

    }

    function checkWin(gameBoard, player) {

        for (let seq of winSequences) {
            if (gameBoard[seq[0]] === player &&
                gameBoard[seq[1]] === player &&
                gameBoard[seq[2]] === player) {
                return true;
            }
            else { continue }
        }
        return false;
    }
    function resetGame() {
        gameBoard.fill(0);
        cells.forEach(cell =>{
            cell.textContent = '';
        })
        j = 'X';
        stat.textContent = '';
    }
    function drawGame(){
        if(gameBoard.includes(0) === false && stat.textContent === ''){
            stat.textContent = "It's a draw!";
        }
    }
});
